/**
 * RTM (Real-Time Messaging) Composable
 * Vue 3 Composition API ile RTM işlemlerini yönetir
 * Ekran paylaşımı bildirimleri ve gerçek zamanlı mesajlaşma
 * @module composables/useRTM
 */

import { ref, computed, onMounted, onUnmounted, watch, nextTick, readonly } from 'vue'
import { rtmService } from '../services/index.js'
import { RTM_EVENTS, RTM_MESSAGE_TYPES } from '../constants.js'
import { fileLogger, LOG_CATEGORIES } from '../services/index.js'
import { useAgoraStore } from '../store/index.js'
import { notification } from '../services/index.js'

// Logger helper'ları (modül seviyesi - tutarlı kullanım)
const logDebug = (message, data) => fileLogger.log('debug', LOG_CATEGORIES.RTM, message, data)
const logInfo = (message, data) => fileLogger.log('info', LOG_CATEGORIES.RTM, message, data)
const logWarn = (message, data) => fileLogger.log('warn', LOG_CATEGORIES.RTM, message, data)
const logError = (errorOrMessage, context) => {
  if (errorOrMessage instanceof Error) {
    return fileLogger.log('error', LOG_CATEGORIES.RTM, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
  }
  return fileLogger.log('error', LOG_CATEGORIES.RTM, errorOrMessage, context)
}

/**
 * RTM Composable - Vue 3 uyumlu RTM işlemleri
 * @param {Object} agoraStore - Agora store referansı (opsiyonel)
 * @returns {Object} RTM state ve metodları
 */
export function useRTM(agoraStore = null) {
  // Store referansı - parametre olarak verilmemişse al
  const store = agoraStore || useAgoraStore()

  // ===========================
  // Reactive State
  // ===========================

  // Connection State
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const isChannelJoined = ref(false)
  const connectionError = ref(null)
  const connectionState = ref('disconnected')

  // User State
  const currentUserId = ref(null)
  const currentUserName = ref(null)
  const currentChannelName = ref(null)

  // Message State
  const lastMessage = ref(null)
  const messageHistory = ref([])
  const unreadCount = ref(0)

  // Channel Members
  const channelMembers = ref(new Set())
  const memberCount = ref(0)

  // Performance Metrics
  const metrics = ref({
    messagesSent: 0,
    messagesReceived: 0,
    messagesFailed: 0,
    connectionAttempts: 0,
    lastMessageTime: null,
    uptime: 0
  })

  // Retry Configuration
  const retryConfig = ref({
    maxRetries: 3,
    retryDelay: 2000, // 2 saniye
    exponentialBackoff: true,
    retryableErrors: [
      'NETWORK_ERROR',
      'CONNECTION_TIMEOUT',
      'SERVER_ERROR',
      'RTM_ERROR'
    ]
  })

  // ===========================
  // Computed Properties
  // ===========================

  const canSendMessages = computed(() => {
    return isConnected.value && isChannelJoined.value
  })

  const connectionStatus = computed(() => {
    if (isConnecting.value) return 'connecting'
    if (isConnected.value && isChannelJoined.value) return 'ready'
    if (isConnected.value) return 'connected'
    if (connectionError.value) return 'error'
    return 'disconnected'
  })

  const rtmInfo = computed(() => {
    return {
      userId: currentUserId.value,
      userName: currentUserName.value,
      channelName: currentChannelName.value,
      memberCount: memberCount.value,
      status: connectionStatus.value,
      canSend: canSendMessages.value,
      metrics: metrics.value
    }
  })

  // ===========================
  // Retry Helper Methods
  // ===========================

  /**
   * Hata retry edilebilir mi kontrol et
   * @param {Error} error - Hata objesi
   * @returns {boolean} Retry edilebilir mi
   */
  const isRetryableError = (error) => {
    const errorMessage = error.message || error.toString()
    return retryConfig.value.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError)
    )
  }

  /**
   * Retry delay hesapla
   * @param {number} attempt - Deneme sayısı
   * @returns {number} Delay (ms)
   */
  const calculateRetryDelay = (attempt) => {
    if (retryConfig.value.exponentialBackoff) {
      return retryConfig.value.retryDelay * Math.pow(2, attempt - 1)
    }
    return retryConfig.value.retryDelay
  }

  /**
   * Retry ile fonksiyon çalıştır
   * @param {Function} fn - Çalıştırılacak fonksiyon
   * @param {string} operationName - İşlem adı (log için)
   * @returns {Promise<any>} Sonuç
   */
  const executeWithRetry = async (fn, operationName) => {
    let lastError
    
    for (let attempt = 1; attempt <= retryConfig.value.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        if (attempt === retryConfig.value.maxRetries || !isRetryableError(error)) {
          logError(`❌ ${operationName} başarısız (${attempt}/${retryConfig.value.maxRetries})`, { 
            error: error.message || error,
            attempt,
            maxRetries: retryConfig.value.maxRetries
          })
          throw error
        }
        
        const delay = calculateRetryDelay(attempt)
        logWarn(`⚠️ ${operationName} başarısız (${attempt}/${retryConfig.value.maxRetries}), ${delay}ms sonra tekrar deneniyor`, { 
          error: error.message || error,
          attempt,
          maxRetries: retryConfig.value.maxRetries,
          delay
        })
        
        // Delay bekle
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }

  // ===========================
  // Core Methods
  // ===========================

  /**
   * RTM'i başlat ve kanala katıl
   * @param {Object} options - Başlatma seçenekleri
   * @param {string} options.userId - Kullanıcı ID
   * @param {string} options.userName - Kullanıcı adı
   * @param {string} options.channelName - Kanal adı
   * @param {string} options.token - RTM token (opsiyonel)
   * @returns {Promise<boolean>} Başarı durumu
   */
  const initialize = async (options = {}) => {
    try {
      if (isConnecting.value) {
        logWarn('⚠️ RTM zaten başlatılıyor')
        return false
      }

      isConnecting.value = true
      connectionError.value = null

      const { userId, userName, channelName, token: providedToken } = options

      logInfo('🚀 RTM composable başlatılıyor', { 
        userId, 
        userName, 
        channelName,
        timestamp: new Date().toISOString(),
        processId: Math.random().toString(36).substr(2, 9)
      })

      // Token kontrolü - token verilmemişse hata fırlat
      if (!providedToken) {
        throw new Error('RTM token gerekli - token olmadan başlatılamaz')
      }
      
      let finalToken = providedToken

      logDebug('🔑 RTM token hazır', {
        hasToken: !!finalToken,
        tokenLength: finalToken.length,
        tokenPreview: finalToken.substring(0, 20) + '...',
        userId,
        timestamp: new Date().toISOString()
      })

      // RTM client'ı başlat (retry ile)
      logDebug('🏗️ RTM client başlatılıyor...', { userId, timestamp: new Date().toISOString() })
      const clientSuccess = await executeWithRetry(
        () => rtmService.initialize({
          userId,
          userName,
          token: finalToken
        }),
        'RTM client başlatma'
      )

      if (!clientSuccess) {
        throw new Error('RTM client başlatılamadı')
      }

      logInfo('✅ RTM client başarıyla başlatıldı', { 
        userId, 
        userName,
        timestamp: new Date().toISOString()
      })

      // State güncelle
      currentUserId.value = userId
      currentUserName.value = userName
      isConnected.value = true

      // Kanal belirtilmişse katıl
      if (channelName) {
        logDebug('📡 Kanal belirtildi, RTM kanalına katılım başlatılıyor', { 
          channelName,
          userId,
          timestamp: new Date().toISOString()
        })
        
        const channelSuccess = await executeWithRetry(
          () => joinChannel(channelName),
          'RTM kanal katılımı'
        )
        if (!channelSuccess) {
          throw new Error('RTM kanalına katılınamadı')
        }
      } else {
        logDebug('ℹ️ Kanal belirtilmedi, sadece RTM client başlatıldı', { 
          userId,
          timestamp: new Date().toISOString()
        })
      }

      isConnecting.value = false
      
      logInfo('🎉 RTM composable başarıyla başlatıldı', { 
        ...rtmInfo.value,
        timestamp: new Date().toISOString()
      })
      return true

    } catch (error) {
      isConnecting.value = false
      connectionError.value = error.message
      logError('❌ RTM composable başlatma hatası', { 
        error,
        userId: options.userId,
        timestamp: new Date().toISOString()
      })
      return false
    }
  }

  /**
   * RTM kanalına subscribe ol - Güncellenmiş v2.2.2
   * @param {string} channelName - Kanal adı
   * @returns {Promise<boolean>} Başarı durumu
   */
  const joinChannel = async (channelName) => {
    try {
      if (!isConnected.value) {
        throw new Error('RTM client bağlı değil')
      }

      logInfo('📡 RTM kanalına subscribe olunuyor - v2.2.2', { 
        channelName,
        userId: currentUserId.value,
        userName: currentUserName.value,
        timestamp: new Date().toISOString(),
        processId: Math.random().toString(36).substr(2, 9)
      })

      const success = await rtmService.subscribeToChannel(channelName)
      
      if (success) {
        currentChannelName.value = channelName
        isChannelJoined.value = true
        
        // Message history'yi temizle
        messageHistory.value = []
        unreadCount.value = 0
        channelMembers.value.clear()
        memberCount.value = 0

        logInfo('✅ RTM kanalına başarıyla subscribe olundu - v2.2.2', { 
          channelName,
          userId: currentUserId.value,
          userName: currentUserName.value,
          subscribeTime: new Date().toISOString(),
          processId: Math.random().toString(36).substr(2, 9)
        })
      } else {
        logWarn('⚠️ RTM kanal subscribe başarısız', { 
          channelName,
          userId: currentUserId.value,
          timestamp: new Date().toISOString()
        })
      }

      return success

    } catch (error) {
      logError('❌ RTM kanal subscribe hatası - v2.2.2', { 
        error, 
        channelName,
        userId: currentUserId.value,
        timestamp: new Date().toISOString()
      })
      return false
    }
  }

  /**
   * RTM kanalından unsubscribe ol - Güncellenmiş v2.2.2
   * @returns {Promise<boolean>} Başarı durumu
   */
  const leaveChannel = async () => {
    try {
      if (!isChannelJoined.value) {
        return true
      }

      const channelName = currentChannelName.value
      logInfo('RTM kanalından unsubscribe olunuyor - v2.2.2', { channelName })

      const success = await rtmService.unsubscribeFromChannel()
      
      if (success) {
        isChannelJoined.value = false
        currentChannelName.value = null
        channelMembers.value.clear()
        memberCount.value = 0
        
        logInfo('RTM kanalından başarıyla unsubscribe olundu - v2.2.2', { channelName })
      }

      return false

    } catch (error) {
      logError('RTM kanal unsubscribe hatası - v2.2.2', { error })
      return false
    }
  }

  /**
   * RTM bağlantısını kapat
   * @returns {Promise<boolean>} Başarı durumu
   */
  const disconnect = async () => {
    try {
      logInfo('RTM bağlantısı kapatılıyor')

      await rtmService.disconnect()
      
      // State'i temizle
      _resetState()
      
      logInfo('RTM bağlantısı başarıyla kapatıldı')
      return true

    } catch (error) {
      logError('RTM bağlantısı kapatma hatası', { error })
      return false
    }
  }

  // ===========================
  // Screen Share Notification Methods
  // ===========================

  /**
   * Ekran paylaşımı başlama bildirimi gönder
   * @param {Object} screenData - Ekran paylaşımı verisi
   * @returns {Promise<boolean>} Başarı durumu
   */
  const notifyScreenShareStarted = async (screenData = {}) => {
    try {
      if (!canSendMessages.value) {
        logWarn('RTM mesaj gönderilemez - bağlantı yok')
        return false
      }

      logInfo('Ekran paylaşımı başlama bildirimi gönderiliyor', screenData)

      const success = await rtmService.notifyScreenShareStarted({
        ...screenData,
        timestamp: Date.now()
      })

      if (success) {
        metrics.value.messagesSent++
        metrics.value.lastMessageTime = Date.now()
        
        // Kendi bildirimini de göster (feedback için)
        notification.success('Ekran paylaşımınız başlatıldı ve diğer kullanıcılara bildirildi')
      } else {
        metrics.value.messagesFailed++
      }

      return success

    } catch (error) {
      metrics.value.messagesFailed++
      logError('Ekran paylaşımı başlama bildirimi hatası', { error })
      return false
    }
  }

  /**
   * Ekran paylaşımı durdurma bildirimi gönder
   * @param {Object} screenData - Ekran paylaşımı verisi
   * @returns {Promise<boolean>} Başarı durumu
   */
  const notifyScreenShareStopped = async (screenData = {}) => {
    try {
      if (!canSendMessages.value) {
        logWarn('RTM mesaj gönderilemez - bağlantı yok')
        return false
      }

      logInfo('Ekran paylaşımı durdurma bildirimi gönderiliyor', screenData)

      const success = await rtmService.notifyScreenShareStopped({
        ...screenData,
        timestamp: Date.now()
      })

      if (success) {
        metrics.value.messagesSent++
        metrics.value.lastMessageTime = Date.now()
        
        // Kendi bildirimini de göster (feedback için)
        notification.success('Ekran paylaşımınız durduruldu ve diğer kullanıcılara bildirildi')
      } else {
        metrics.value.messagesFailed++
      }

      return success

    } catch (error) {
      metrics.value.messagesFailed++
      logError('Ekran paylaşımı durdurma bildirimi hatası', { error })
      return false
    }
  }

  /**
   * Whiteboard aktivasyon bildirimi gönder
   * @param {Object} whiteboardData - Whiteboard verisi
   * @returns {Promise<boolean>} Başarı durumu
   */
  const notifyWhiteboardActivated = async (whiteboardData = {}) => {
    try {
      if (!canSendMessages.value) {
        logWarn('RTM mesaj gönderilemez - bağlantı yok')
        return false
      }

      logInfo('Whiteboard aktivasyon bildirimi gönderiliyor', whiteboardData)

      const success = await rtmService.notifyWhiteboardActivated({
        ...whiteboardData,
        timestamp: Date.now()
      })

      if (success) {
        metrics.value.messagesSent++
        metrics.value.lastMessageTime = Date.now()
        
        alert('Whiteboard\'ınız açıldı ve diğer kullanıcılara bildirildi')
        // Kendi bildirimini de göster (feedback için)
        notification.success('Whiteboard\'ınız açıldı ve diğer kullanıcılara bildirildi')
      } else {
        metrics.value.messagesFailed++
      }

      return success

    } catch (error) {
      metrics.value.messagesFailed++
      logError('Whiteboard aktivasyon bildirimi hatası', { error })
      return false
    }
  }

  /**
   * Whiteboard deaktivasyon bildirimi gönder
   * @param {Object} whiteboardData - Whiteboard verisi
   * @returns {Promise<boolean>} Başarı durumu
   */
  const notifyWhiteboardDeactivated = async (whiteboardData = {}) => {
    try {
      if (!canSendMessages.value) {
        logWarn('RTM mesaj gönderilemez - bağlantı yok')
        return false
      }

      logInfo('Whiteboard deaktivasyon bildirimi gönderiliyor', whiteboardData)

      const success = await rtmService.notifyWhiteboardDeactivated({
        ...whiteboardData,
        timestamp: Date.now()
      })

      if (success) {
        metrics.value.messagesSent++
        metrics.value.lastMessageTime = Date.now()
        
        // Kendi bildirimini de göster (feedback için)
        notification.success('Whiteboard\'ınız kapatıldı ve diğer kullanıcılara bildirildi')
      } else {
        metrics.value.messagesFailed++
      }

      return success

    } catch (error) {
      metrics.value.messagesFailed++
      logError('Whiteboard deaktivasyon bildirimi hatası', { error })
      return false
    }
  }

  // ===========================
  // Message Methods
  // ===========================

  /**
   * Kanal mesajı gönder
   * @param {string} messageType - Mesaj tipi
   * @param {Object} data - Mesaj verisi
   * @param {Object} options - Gönderim seçenekleri
   * @returns {Promise<boolean>} Başarı durumu
   */
  const sendMessage = async (messageType, data = {}, options = {}) => {
    try {
      if (!canSendMessages.value) {
        throw new Error('RTM mesaj gönderilemez')
      }

      const success = await rtmService.sendChannelMessage(messageType, data, options)
      
      if (success) {
        metrics.value.messagesSent++
        metrics.value.lastMessageTime = Date.now()
      } else {
        metrics.value.messagesFailed++
      }

      return success

    } catch (error) {
      metrics.value.messagesFailed++
      logError('RTM mesaj gönderme hatası', { error, messageType })
      return false
    }
  }

  // ===========================
  // Event Handlers
  // ===========================

  /**
   * RTM event handler'larını ayarla
   * @private
   */
  const _setupEventHandlers = () => {
    // Client bağlantı events
    rtmService.on(RTM_EVENTS.CLIENT_CONNECTED, (data) => {
      isConnected.value = true
      connectionState.value = 'connected'
      connectionError.value = null
      logDebug('RTM client bağlandı', data)
    })

    rtmService.on(RTM_EVENTS.CLIENT_DISCONNECTED, (data) => {
      isConnected.value = false
      isChannelJoined.value = false
      connectionState.value = 'disconnected'
      logDebug('RTM client bağlantısı kesildi', data)
    })

    rtmService.on(RTM_EVENTS.CLIENT_RECONNECTING, (data) => {
      connectionState.value = 'reconnecting'
      logDebug('RTM client yeniden bağlanıyor', data)
    })

    rtmService.on(RTM_EVENTS.CLIENT_ERROR, (data) => {
      connectionError.value = data.error
      logError('RTM client hatası', data)
    })

    // Channel events
    rtmService.on(RTM_EVENTS.CHANNEL_JOINED, (data) => {
      isChannelJoined.value = true
      logDebug('RTM kanalına katıldı', data)
    })

    rtmService.on(RTM_EVENTS.CHANNEL_LEFT, (data) => {
      isChannelJoined.value = false
      currentChannelName.value = null
      channelMembers.value.clear()
      memberCount.value = 0
      logDebug('RTM kanalından ayrıldı', data)
    })

    rtmService.on(RTM_EVENTS.CHANNEL_MESSAGE_RECEIVED, (data) => {
      _handleReceivedMessage(data)
    })

    rtmService.on(RTM_EVENTS.CHANNEL_MEMBER_JOINED, (data) => {
      channelMembers.value.add(data.memberId)
      memberCount.value = channelMembers.value.size
      logDebug('RTM kanal üyesi katıldı', data)
    })

    rtmService.on(RTM_EVENTS.CHANNEL_MEMBER_LEFT, (data) => {
      channelMembers.value.delete(data.memberId)
      memberCount.value = channelMembers.value.size
      logDebug('RTM kanal üyesi ayrıldı', data)
    })
  }

  /**
   * Alınan mesajı işle
   * @param {Object} messageData - Mesaj verisi
   * @private
   */
  const _handleReceivedMessage = (messageData) => {
    const { type, data, senderId, timestamp } = messageData

    // Metrics güncelle
    metrics.value.messagesReceived++
    
    // Message history'e ekle
    const message = {
      id: `msg_${timestamp}_${senderId}`,
      type,
      data,
      senderId,
      timestamp,
      isRead: false
    }

    messageHistory.value.push(message)
    lastMessage.value = message
    unreadCount.value++

    // History boyutunu sınırla (performans için)
    if (messageHistory.value.length > 100) {
      messageHistory.value = messageHistory.value.slice(-100)
    }

    logDebug('RTM mesajı alındı ve işlendi', { type, senderId })
  }

  /**
   * State'i sıfırla
   * @private
   */
  const _resetState = () => {
    isConnected.value = false
    isConnecting.value = false
    isChannelJoined.value = false
    connectionError.value = null
    connectionState.value = 'disconnected'
    currentUserId.value = null
    currentUserName.value = null
    currentChannelName.value = null
    lastMessage.value = null
    messageHistory.value = []
    unreadCount.value = 0
    channelMembers.value.clear()
    memberCount.value = 0
    
    // Metrics'i sıfırla
    metrics.value = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesFailed: 0,
      connectionAttempts: 0,
      lastMessageTime: null,
      uptime: 0
    }
  }

  // ===========================
  // Utility Methods
  // ===========================

  /**
   * Mesajları okundu olarak işaretle
   * @param {string[]} messageIds - Mesaj ID'leri (opsiyonel, boşsa tümü)
   */
  const markMessagesAsRead = (messageIds = null) => {
    if (messageIds) {
      messageHistory.value.forEach(msg => {
        if (messageIds.includes(msg.id)) {
          msg.isRead = true
        }
      })
    } else {
      messageHistory.value.forEach(msg => {
        msg.isRead = true
      })
    }
    
    // Unread count'u güncelle
    unreadCount.value = messageHistory.value.filter(msg => !msg.isRead).length
  }

  /**
   * RTM durumunu al
   * @returns {Object} RTM durumu
   */
  const getStatus = () => {
    return {
      ...rtmService.getStatus(),
      composableInfo: rtmInfo.value,
      messageStats: {
        historyCount: messageHistory.value.length,
        unreadCount: unreadCount.value,
        lastMessageTime: metrics.value.lastMessageTime
      }
    }
  }

  /**
   * Metrics'i sıfırla
   */
  const resetMetrics = () => {
    metrics.value = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesFailed: 0,
      connectionAttempts: metrics.value.connectionAttempts, // Connection attempts'i koru
      lastMessageTime: null,
      uptime: 0
    }
    logInfo('RTM metrics sıfırlandı')
  }

  // ===========================
  // Lifecycle Hooks
  // ===========================

  onMounted(() => {
    logDebug('useRTM composable mounted')
    _setupEventHandlers()
  })

  onUnmounted(async () => {
    logDebug('useRTM composable unmounted')
    
    // RTM bağlantısını temiz bir şekilde kapat
    try {
      await disconnect()
    } catch (error) {
      logError('useRTM unmount disconnect hatası', { error })
    }
  })

  // ===========================
  // Watchers
  // ===========================

  // Store'daki video kullanıcı bilgilerini izle ve RTM'e senkronize et
  // NOT: Otomatik RTM başlatma kaldırıldı - sadece manuel başlatma kullanılıyor
  // watch(
  //   () => store?.users?.local?.video,
  //   (newLocalUser) => {
  //     if (newLocalUser && newLocalUser.uid && !currentUserId.value) {
  //       logDebug('Store\'dan video kullanıcı bilgisi alındı, RTM senkronizasyonu yapılıyor', {
  //         uid: newLocalUser.uid,
  //         name: newLocalUser.name
  //       })
  //       
  //       // Auto-initialize RTM if user info is available
  //       nextTick(async () => {
  //         if (!isConnected.value && !isConnecting.value) {
  //           await initialize({
  //             userId: newLocalUser.uid.toString(),
  //             userName: newLocalUser.name || `User-${newLocalUser.uid}`,
  //             channelName: store?.session?.videoChannelName
  //           })
  //         }
  //       })
  //     }
  //   },
  //   { deep: true, immediate: true }
  // )

  // ===========================
  // Return Public API
  // ===========================

  return {
    // State
    isConnected: readonly(isConnected),
    isConnecting: readonly(isConnecting),
    isChannelJoined: readonly(isChannelJoined),
    connectionError: readonly(connectionError),
    connectionState: readonly(connectionState),
    currentUserId: readonly(currentUserId),
    currentUserName: readonly(currentUserName),
    currentChannelName: readonly(currentChannelName),
    lastMessage: readonly(lastMessage),
    messageHistory: readonly(messageHistory),
    unreadCount: readonly(unreadCount),
    channelMembers: readonly(channelMembers),
    memberCount: readonly(memberCount),
    metrics: readonly(metrics),

    // Computed
    canSendMessages,
    connectionStatus,
    rtmInfo,

    // Core Methods
    initialize,
    joinChannel,
    leaveChannel,
    disconnect,

    // Screen Share Methods
    notifyScreenShareStarted,
    notifyScreenShareStopped,

    // Whiteboard Methods
    notifyWhiteboardActivated,
    notifyWhiteboardDeactivated,

    // Message Methods
    sendMessage,

    // Utility Methods
    markMessagesAsRead,
    getStatus,
    resetMetrics,
    
    // Retry Configuration
    retryConfig,
    updateRetryConfig: (newConfig) => {
      retryConfig.value = { ...retryConfig.value, ...newConfig }
    }
  }
}

// Default export
export default useRTM
