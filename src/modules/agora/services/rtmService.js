/**
 * Agora RTM (Real-Time Messaging) Service - v2.2.2 Güncellenmiş
 * Gerçek zamanlı mesajlaşma, bildirimler ve kullanıcı durumu takibi
 * Sektör standartlarında, performanslı ve güvenli RTM yönetimi
 * 
 * IMPORT NOTU: Dokümantasyona göre doğru import şekli:
 * import AgoraRTM from 'agora-rtm-sdk'
 * const { RTM } = AgoraRTM
 * 
 * @module services/rtmService
 */

// Agora RTM SDK import - Dokümantasyona göre doğru şekilde
import AgoraRTM from 'agora-rtm-sdk'
import { 
  RTM_CONFIG, 
  RTM_MESSAGE_TYPES, 
  RTM_EVENTS, 
  RTM_ERROR_CODES, 
  RTM_USER_FRIENDLY_ERRORS,
  SCREEN_SHARE_NOTIFICATIONS,
  WHITEBOARD_NOTIFICATIONS,
  IS_DEV 
} from '../constants.js'
import { fileLogger, LOG_CATEGORIES } from './fileLogger.js'
import { notification } from './notificationService.js'
import { centralEmitter } from '../utils/index.js'

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
const logFatal = (errorOrMessage, context) => {
  if (errorOrMessage instanceof Error) {
    return fileLogger.log('fatal', LOG_CATEGORIES.RTM, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
  }
  return fileLogger.log('fatal', LOG_CATEGORIES.RTM, errorOrMessage, context)
}

/**
 * RTM Service Class - Güncellenmiş v2.2.2 için
 * Singleton pattern kullanarak tek instance garanti eder
 */
class RTMService {
  constructor() {
    // Singleton pattern - sadece bir instance olsun
    if (RTMService.instance) {
      return RTMService.instance
    }
    RTMService.instance = this

    // RTM Client ve Channel State - Yeni v2.2.2 yapısı
    this.client = null
    this.isClientConnected = false
    this.isChannelSubscribed = false // Yeni: subscribe sistemi
    
    // User ve Session State
    this.currentUserId = null
    this.currentUserName = null
    this.currentChannelName = null
    this.currentToken = null
    
    // Message Queue ve Retry Logic
    this.messageQueue = []
    this.isProcessingQueue = false
    this.retryAttempts = new Map() // messageId -> attempt count
    
    // Event Listeners
    this.eventListeners = new Map()
    
    // Connection State
    this.connectionState = 'disconnected' // disconnected, connecting, connected, reconnecting
    this.lastConnectionTime = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    
    // Performance Metrics
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      messagesFailed: 0,
      connectionAttempts: 0,
      lastMessageTime: null
    }

    logInfo('RTM Service initialized - v2.2.2', { 
      config: RTM_CONFIG,
      isDev: IS_DEV 
    })
  }

  /**
   * RTM Client'ı başlat ve kullanıcıyı login yap - Yeni v2.2.2 yapısı
   * @param {Object} options - Login seçenekleri
   * @param {string} options.userId - Kullanıcı ID
   * @param {string} options.userName - Kullanıcı adı (opsiyonel)
   * @param {string} options.token - RTM token (opsiyonel, yoksa oluşturulur)
   * @returns {Promise<boolean>} Başarı durumu
   */
  async initialize(options = {}) {
    try {
      if (this.isClientConnected) {
        logWarn('RTM client zaten bağlı', { userId: this.currentUserId })
        return true
      }

      const { userId, userName, token } = options
      
      if (!userId) {
        throw new Error('userId gerekli')
      }

      this.connectionState = 'connecting'
      this.metrics.connectionAttempts++

      logInfo('🚀 RTM client başlatılıyor - v2.2.2', { 
        userId, 
        userName,
        timestamp: new Date().toISOString(),
        processId: Math.random().toString(36).substr(2, 9)
      })

      // RTM v2.2.2 yapısı - Dokümantasyona göre: const { RTM } = AgoraRTM
      logDebug('🔍 AgoraRTM import kontrolü - Dokümantasyona göre', { 
        AgoraRTM: typeof AgoraRTM, 
        hasRTM: !!AgoraRTM.RTM,
        RTM: AgoraRTM.RTM,
        importMethod: 'import AgoraRTM from "agora-rtm-sdk"'
      })
      
      if (!AgoraRTM.RTM) {
        throw new Error('AgoraRTM.RTM bulunamadı - SDK import hatası. Dokümantasyona göre: const { RTM } = AgoraRTM')
      }
      
      // Dokümantasyona göre: const { RTM } = AgoraRTM
      const { RTM } = AgoraRTM
      logDebug('🏗️ RTM class oluşturuluyor', { 
        APP_ID: RTM_CONFIG.APP_ID, 
        userId,
        timestamp: new Date().toISOString()
      })
      
      this.client = new RTM(RTM_CONFIG.APP_ID, userId)

      // Event listener'ları ekle - YENİ: addEventListener sistemi
      logDebug('🎧 RTM event listener\'ları ayarlanıyor', { userId })
      this._setupClientEventListeners()

      // Token kontrolü - token verilmemişse hata fırlat
      logDebug('🔑 Token kontrolü', { 
        hasToken: !!token, 
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'YOK',
        userId,
        timestamp: new Date().toISOString()
      })
      
      if (!token) {
        throw new Error('RTM token gerekli - token olmadan bağlantı kurulamaz')
      }
      
      let rtmToken = token

      // YENİ: Login method - uid yerine userId kullanılıyor
      logInfo('🔐 RTM login işlemi başlatılıyor', { 
        userId, 
        userName,
        tokenPreview: rtmToken.substring(0, 20) + '...',
        timestamp: new Date().toISOString()
      })
      
      await this.client.login({ token: rtmToken })

      // State güncelle
      this.isClientConnected = true
      this.currentUserId = userId
      this.currentUserName = userName || `User-${userId}`
      this.currentToken = rtmToken
      this.connectionState = 'connected'
      this.lastConnectionTime = Date.now()
      this.reconnectAttempts = 0

      logInfo('✅ RTM client başarıyla bağlandı - v2.2.2', {
        userId: this.currentUserId,
        userName: this.currentUserName,
        hasToken: !!rtmToken,
        connectionTime: new Date(this.lastConnectionTime).toISOString(),
        processId: Math.random().toString(36).substr(2, 9)
      })

      // Event emit et
      this._emitEvent(RTM_EVENTS.CLIENT_CONNECTED, {
        userId: this.currentUserId,
        userName: this.currentUserName,
        timestamp: Date.now()
      })

      return true

    } catch (error) {
      this.connectionState = 'disconnected'
      logError('❌ RTM client bağlantı hatası - v2.2.2', { 
        error, 
        userId: options.userId,
        timestamp: new Date().toISOString()
      })
      
      this._emitEvent(RTM_EVENTS.CLIENT_ERROR, {
        error: error.message,
        code: RTM_ERROR_CODES.LOGIN_FAILED,
        timestamp: Date.now()
      })

      // User-friendly notification göster
      notification.error(RTM_USER_FRIENDLY_ERRORS.LOGIN_FAILED)
      
      return false
    }
  }

  /**
   * RTM kanalına subscribe ol - RTM v2.2.2 dokümantasyonuna göre
   * @param {string} channelName - Kanal adı
   * @returns {Promise<boolean>} Başarı durumu
   */
  async subscribeToChannel(channelName) {
    try {
      if (!this.isClientConnected) {
        throw new Error('RTM client bağlı değil')
      }

      if (this.isChannelSubscribed && this.currentChannelName === channelName) {
        logWarn('⚠️ Zaten bu kanala subscribe olunmuş', { channelName })
        return true
      }

      // Önceki kanaldan unsubscribe ol
      if (this.isChannelSubscribed && this.currentChannelName) {
        logDebug('🔄 Önceki kanaldan unsubscribe olunuyor', { 
          previousChannel: this.currentChannelName,
          newChannel: channelName,
          userId: this.currentUserId,
          timestamp: new Date().toISOString()
        })
        await this.unsubscribeFromChannel()
      }

      logInfo('📡 RTM kanalına subscribe olunuyor - v2.2.2 dokümantasyonuna göre', { 
        channelName,
        userId: this.currentUserId,
        userName: this.currentUserName,
        timestamp: new Date().toISOString(),
        processId: Math.random().toString(36).substr(2, 9)
      })

      // RTM v2.2.2 dokümantasyonuna göre subscribe
      const fullChannelName = `${RTM_CONFIG.CHANNEL.PREFIX}${channelName}`
      logDebug('🏷️ Tam kanal adı oluşturuldu', { 
        originalChannel: channelName,
        prefix: RTM_CONFIG.CHANNEL.PREFIX,
        fullChannelName,
        userId: this.currentUserId,
        timestamp: new Date().toISOString()
      })
      
      logDebug('🔧 Subscribe seçenekleri - dokümantasyona göre', {
        withMessage: RTM_CONFIG.CHANNEL.withMessage,
        withPresence: RTM_CONFIG.CHANNEL.withPresence,
        withMetadata: RTM_CONFIG.CHANNEL.withMetadata,
        userId: this.currentUserId,
        timestamp: new Date().toISOString()
      })

      // Dokümantasyona göre: subscribe(channelName) - options parametresi yok!
      // Presence bilgileri otomatik olarak alınacak
      await this.client.subscribe(fullChannelName)

      // State güncelle
      this.isChannelSubscribed = true
      this.currentChannelName = channelName

      logInfo('✅ RTM kanalına başarıyla subscribe olundu - v2.2.2 dokümantasyonuna göre', { 
        channelName, 
        fullChannelName,
        userId: this.currentUserId,
        userName: this.currentUserName,
        subscribeTime: new Date().toISOString(),
        processId: Math.random().toString(36).substr(2, 9)
      })

      // Event emit et
      this._emitEvent(RTM_EVENTS.CHANNEL_JOINED, {
        channelName,
        userId: this.currentUserId,
        timestamp: Date.now()
      })

      // Message queue'yu işle
      this._processMessageQueue()

      return true

    } catch (error) {
      logError('❌ RTM kanal subscribe hatası - v2.2.2 dokümantasyonuna göre', { 
        error, 
        channelName,
        userId: this.currentUserId,
        timestamp: new Date().toISOString()
      })
      
      this._emitEvent(RTM_EVENTS.CLIENT_ERROR, {
        error: error.message,
        code: RTM_ERROR_CODES.CHANNEL_JOIN_FAILED,
        channelName,
        timestamp: Date.now()
      })

      notification.error(RTM_USER_FRIENDLY_ERRORS.CHANNEL_JOIN_FAILED)
      return false
    }
  }

  /**
   * RTM kanalından unsubscribe ol - YENİ: leave yerine unsubscribe
   * @returns {Promise<boolean>} Başarı durumu
   */
  async unsubscribeFromChannel() {
    try {
      if (!this.isChannelSubscribed || !this.currentChannelName) {
        logWarn('Zaten kanalda değil')
        return true
      }

      const channelName = this.currentChannelName

      logInfo('RTM kanalından unsubscribe olunuyor - v2.2.2', { channelName })

      // YENİ: unsubscribe method kullan
      const fullChannelName = `${RTM_CONFIG.CHANNEL.PREFIX}${channelName}`
      await this.client.unsubscribe(fullChannelName)

      // State temizle
      this.isChannelSubscribed = false
      this.currentChannelName = null

      logInfo('RTM kanalından başarıyla unsubscribe olundu - v2.2.2', { channelName })

      // Event emit et
      this._emitEvent(RTM_EVENTS.CHANNEL_LEFT, {
        channelName,
        userId: this.currentUserId,
        timestamp: Date.now()
      })

      return true

    } catch (error) {
      logError('RTM kanal unsubscribe hatası - v2.2.2', { error })
      return false
    }
  }

  /**
   * Kanal mesajı gönder - YENİ: publish sistemi
   * @param {string} messageType - Mesaj tipi (RTM_MESSAGE_TYPES'dan)
   * @param {Object} data - Mesaj verisi
   * @param {Object} options - Gönderim seçenekleri
   * @returns {Promise<boolean>} Başarı durumu
   */
  async sendChannelMessage(messageType, data = {}, options = {}) {
    try {
      if (!this.isChannelSubscribed || !this.currentChannelName) {
        throw new Error('RTM kanalına subscribe olunmamış')
      }

      // Mesaj payload'unu oluştur
      const messagePayload = {
        type: messageType,
        data: {
          ...data,
          userId: this.currentUserId,
          userName: this.currentUserName,
          timestamp: Date.now()
        },
        priority: options.priority || 'normal',
        messageId: this._generateMessageId()
      }

      // Mesaj boyut kontrolü
      const messageString = JSON.stringify(messagePayload)
      if (messageString.length > RTM_CONFIG.MESSAGE.MAX_SIZE) {
        throw new Error(`Mesaj çok büyük: ${messageString.length} bytes`)
      }

      logDebug('RTM kanal mesajı gönderiliyor - v2.2.2 dokümantasyonuna göre', { 
        messageType, 
        messageId: messagePayload.messageId,
        dataSize: messageString.length 
      })

      // RTM v2.2.2 dokümantasyonuna göre: publish(channelName, message)
      // Options parametresi yok, sadece channelName ve message
      const fullChannelName = `${RTM_CONFIG.CHANNEL.PREFIX}${this.currentChannelName}`
      await this.client.publish(fullChannelName, messageString)

      // Metrics güncelle
      this.metrics.messagesSent++
      this.metrics.lastMessageTime = Date.now()

      logInfo('RTM kanal mesajı başarıyla gönderildi - v2.2.2', { 
        messageType, 
        messageId: messagePayload.messageId 
      })

      return true

    } catch (error) {
      this.metrics.messagesFailed++
      logError('RTM kanal mesajı gönderme hatası - v2.2.2', { error, messageType })
      
      // Retry logic - kritik mesajlar için
      if (options.retry !== false && messageType === RTM_MESSAGE_TYPES.SCREEN_SHARE_STARTED) {
        this._queueMessageForRetry(messageType, data, options)
      }

      return false
    }
  }

  /**
   * Ekran paylaşımı başlama bildirimi gönder
   * @param {Object} screenData - Ekran paylaşımı verisi
   * @returns {Promise<boolean>} Başarı durumu
   */
  async notifyScreenShareStarted(screenData = {}) {
    logInfo('Ekran paylaşımı başlama bildirimi gönderiliyor - v2.2.2', screenData)
    
    return await this.sendChannelMessage(
      RTM_MESSAGE_TYPES.SCREEN_SHARE_STARTED, 
      screenData,
      { priority: 'high', retry: true }
    )
  }

  /**
   * Ekran paylaşımı durdurma bildirimi gönder
   * @param {Object} screenData - Ekran paylaşımı verisi
   * @returns {Promise<boolean>} Başarı durumu
   */
  async notifyScreenShareStopped(screenData = {}) {
    logInfo('Ekran paylaşımı durdurma bildirimi gönderiliyor - v2.2.2', screenData)
    
    return await this.sendChannelMessage(
      RTM_MESSAGE_TYPES.SCREEN_SHARE_STOPPED, 
      screenData,
      { priority: 'normal' }
    )
  }

  /**
   * Whiteboard aktivasyon bildirimi gönder
   * @param {Object} whiteboardData - Whiteboard verisi
   * @returns {Promise<boolean>} Başarı durumu
   */
  async notifyWhiteboardActivated(whiteboardData = {}) {
    logInfo('🎨 Whiteboard aktivasyon bildirimi gönderiliyor - v2.2.2', { 
      whiteboardData,
      messageType: RTM_MESSAGE_TYPES.WHITEBOARD_ACTIVATED,
      timestamp: new Date().toISOString()
    })
    
    const result = await this.sendChannelMessage(
      RTM_MESSAGE_TYPES.WHITEBOARD_ACTIVATED, 
      whiteboardData,
      { priority: 'high', retry: true }
    )
    
    logInfo('🎨 Whiteboard aktivasyon bildirimi sonucu', { 
      success: result,
      whiteboardData,
      timestamp: new Date().toISOString()
    })
    
    return result
  }

  /**
   * Whiteboard deaktivasyon bildirimi gönder
   * @param {Object} whiteboardData - Whiteboard verisi
   * @returns {Promise<boolean>} Başarı durumu
   */
  async notifyWhiteboardDeactivated(whiteboardData = {}) {
    logInfo('Whiteboard deaktivasyon bildirimi gönderiliyor - v2.2.2', whiteboardData)
    
    return await this.sendChannelMessage(
      RTM_MESSAGE_TYPES.WHITEBOARD_DEACTIVATED, 
      whiteboardData,
      { priority: 'high', retry: true }
    )
  }

  /**
   * Event listener ekle
   * @param {string} eventName - Event adı
   * @param {Function} callback - Callback fonksiyonu
   */
  on(eventName, callback) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, [])
    }
    this.eventListeners.get(eventName).push(callback)
  }

  /**
   * Event listener kaldır
   * @param {string} eventName - Event adı
   * @param {Function} callback - Callback fonksiyonu
   */
  off(eventName, callback) {
    if (!this.eventListeners.has(eventName)) return
    
    const listeners = this.eventListeners.get(eventName)
    const index = listeners.indexOf(callback)
    if (index > -1) {
      listeners.splice(index, 1)
    }
  }

  /**
   * RTM bağlantısını kapat ve temizle
   */
  async disconnect() {
    try {
      logInfo('RTM bağlantısı kapatılıyor - v2.2.2')

      // Kanaldan unsubscribe ol
      if (this.isChannelSubscribed) {
        await this.unsubscribeFromChannel()
      }

      // Client logout
      if (this.isClientConnected && this.client) {
        await this.client.logout()
      }

      // State temizle
      this._cleanup()

      logInfo('RTM bağlantısı başarıyla kapatıldı - v2.2.2')

      // Event emit et
      this._emitEvent(RTM_EVENTS.CLIENT_DISCONNECTED, {
        userId: this.currentUserId,
        timestamp: Date.now()
      })

    } catch (error) {
      logError('RTM bağlantısı kapatma hatası - v2.2.2', { error })
    }
  }

  /**
   * Mevcut durumu al
   * @returns {Object} RTM durumu
   */
  getStatus() {
    return {
      isClientConnected: this.isClientConnected,
      isChannelSubscribed: this.isChannelSubscribed, // YENİ: subscribe durumu
      currentUserId: this.currentUserId,
      currentUserName: this.currentUserName,
      currentChannelName: this.currentChannelName,
      connectionState: this.connectionState,
      metrics: { ...this.metrics },
      lastConnectionTime: this.lastConnectionTime
    }
  }

  // ===========================
  // Private Methods
  // ===========================

  /**
   * RTM Client event listener'larını ayarla - RTM v2.2.2 dokümantasyonuna göre
   * @private
   */
  _setupClientEventListeners() {
    if (!this.client) return

    logDebug('🎧 RTM client event listener\'ları ayarlanıyor - v2.2.2 dokümantasyonuna göre', { 
      userId: this.currentUserId,
      timestamp: new Date().toISOString()
    })

    // RTM v2.2.2 dokümantasyonuna göre event listener'lar
    // Message event handler - Dokümantasyona göre: event.publisher, event.message
    this.client.addEventListener("message", event => {
      this.metrics.messagesReceived++
      logDebug('📨 RTM message event alındı - v2.2.2 dokümantasyonuna göre', { 
        event,
        publisher: event.publisher,
        message: event.message,
        timestamp: new Date().toISOString(),
        userId: this.currentUserId
      })
      
      // Dokümantasyona göre: event.publisher ve event.message kullan
      if (event.publisher && event.message) {
        this._handleIncomingMessage(event.message, event.publisher, this.currentChannelName)
      } else {
        logWarn('⚠️ RTM message event\'te publisher veya message bulunamadı', { 
          event,
          timestamp: new Date().toISOString()
        })
      }
    })

    // Presence event handler - Dokümantasyona göre: event.eventType, event.publisher
    this.client.addEventListener("presence", event => {
      logDebug('👥 RTM presence event alındı - v2.2.2 dokümantasyonuna göre', { 
        event,
        eventType: event.eventType,
        publisher: event.publisher,
        timestamp: new Date().toISOString(),
        userId: this.currentUserId
      })
      
      // Dokümantasyona göre presence event yapısı
      if (event.eventType === "SNAPSHOT") {
        logInfo('📸 RTM presence snapshot alındı - dokümantasyona göre', { 
          eventType: event.eventType,
          publisher: event.publisher,
          userId: this.currentUserId,
          timestamp: new Date().toISOString()
        })
        
        // Presence snapshot'da tüm üyeleri al
        if (event.members && Array.isArray(event.members)) {
          logInfo('👥 RTM presence snapshot üyeleri', { 
            memberCount: event.members.length,
            members: event.members,
            timestamp: new Date().toISOString()
          })
          
          // Her üye için event emit et
          event.members.forEach(member => {
            if (member !== this.currentUserId) {
              this._emitEvent(RTM_EVENTS.CHANNEL_MEMBER_JOINED, { 
                memberId: member, 
                timestamp: Date.now() 
              })
            }
          })
        }
      } else if (event.type) {
        // Dokümantasyona göre: event.type ve event.publisher
        const eventType = event.type
        const memberId = event.publisher || 'unknown'
        
        logInfo('👥 RTM presence event - dokümantasyona göre', { 
          eventType,
          memberId,
          userId: this.currentUserId,
          timestamp: new Date().toISOString()
        })
        
        if (eventType === "JOIN" || eventType === "ONLINE") {
          this._emitEvent(RTM_EVENTS.CHANNEL_MEMBER_JOINED, { 
            memberId, 
            timestamp: Date.now() 
          })
        } else if (eventType === "LEAVE" || eventType === "OFFLINE") {
          this._emitEvent(RTM_EVENTS.CHANNEL_MEMBER_LEFT, { 
            memberId, 
            timestamp: Date.now() 
          })
        }
      }
    })

    // Connection state changed event handler - Dokümantasyona göre: event.state, event.reason
    this.client.addEventListener("status", event => {
      logDebug('🔄 RTM status event alındı - v2.2.2 dokümantasyonuna göre', { 
        event,
        state: event.state,
        reason: event.reason,
        timestamp: new Date().toISOString(),
        userId: this.currentUserId
      })
      
      // Dokümantasyona göre: event.state ve event.reason kullan
      const currentState = event.state
      const changeReason = event.reason
      
      logInfo('🔄 RTM connection state değişti - v2.2.2 dokümantasyonuna göre', { 
        previousState: this.connectionState,
        currentState, 
        changeReason,
        userId: this.currentUserId,
        timestamp: new Date().toISOString()
      })
      
      this.connectionState = currentState.toLowerCase()
      
      if (currentState === 'RECONNECTING' || currentState === 'RECONNECT') {
        this.reconnectAttempts++
        logWarn('🔄 RTM client yeniden bağlanıyor', {
          attempt: this.reconnectAttempts,
          maxAttempts: this.maxReconnectAttempts,
          userId: this.currentUserId,
          timestamp: new Date().toISOString()
        })
        this._emitEvent(RTM_EVENTS.CLIENT_RECONNECTING, { 
          attempt: this.reconnectAttempts,
          maxAttempts: this.maxReconnectAttempts 
        })
      }
    })

    // Ek olarak error event'i dinle
    this.client.addEventListener("error", event => {
      logError('❌ RTM error event alındı - v2.2.2 dokümantasyonuna göre', { 
        event,
        timestamp: new Date().toISOString(),
        userId: this.currentUserId
      })
      
      this._emitEvent(RTM_EVENTS.CLIENT_ERROR, {
        error: event.message || event.error || 'Unknown RTM error',
        code: 'RTM_ERROR',
        timestamp: Date.now()
      })
    })

    logDebug('✅ RTM client event listener\'ları başarıyla ayarlandı - v2.2.2 dokümantasyonuna göre', { 
      userId: this.currentUserId,
      timestamp: new Date().toISOString()
    })
  }



  /**
   * Gelen mesajı işle - RTM v2.2.2 için güncellendi
   * @param {string|Object} message - Alınan mesaj (string veya object olabilir)
   * @param {string} publisherId - Gönderen ID
   * @param {string} channelName - Kanal adı
   * @private
   */
  _handleIncomingMessage(message, publisherId, channelName) {
    try {
      // Kendi mesajlarını ignore et
      if (publisherId === this.currentUserId) {
        logDebug('🔄 Kendi mesajım ignore edildi', { 
          publisherId, 
          currentUserId: this.currentUserId,
          timestamp: new Date().toISOString()
        })
        return
      }

      logDebug('📨 RTM mesajı işleniyor - v2.2.2', { 
        message, 
        publisherId, 
        channelName,
        messageType: typeof message,
        timestamp: new Date().toISOString()
      })

      // Mesajı parse et - string veya object olabilir
      let messageData
      
      if (typeof message === 'string') {
        try {
          messageData = JSON.parse(message)
        } catch (parseError) {
          logWarn('⚠️ RTM mesajı JSON parse edilemedi, raw mesaj olarak işleniyor', { 
            message, 
            error: parseError.message,
            timestamp: new Date().toISOString()
          })
          // Raw mesaj olarak işle
          messageData = {
            type: 'raw_message',
            data: { content: message },
            messageId: `raw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        }
      } else if (typeof message === 'object' && message !== null) {
        // Zaten object, direkt kullan
        messageData = message
      } else {
        logWarn('⚠️ RTM mesajı tanınmayan format', { 
          message, 
          type: typeof message,
          timestamp: new Date().toISOString()
        })
        return
      }

      // Type field'ı kontrol et - her zaman olmalı
      if (!messageData.type) {
        logWarn('⚠️ RTM mesajında type field\'ı yok - mesaj işlenemiyor', { 
          messageData,
          publisherId,
          channelName,
          timestamp: new Date().toISOString()
        })
        
        // Event emit et ama type olmadan
        this._emitEvent(RTM_EVENTS.CHANNEL_MESSAGE_RECEIVED, {
          type: 'unknown',
          data: messageData,
          senderId: publisherId,
          channelName,
          timestamp: Date.now(),
          warning: 'Message type field missing'
        })
        
        return // Mesajı işleme, sadece log'da göster
      }

      const { type, data } = messageData

      logDebug('📨 RTM mesajı başarıyla parse edildi - v2.2.2', { 
        type, 
        data,
        publisherId, 
        channelName,
        messageId: messageData.messageId || 'unknown',
        timestamp: new Date().toISOString()
      })

      // Event emit et
      this._emitEvent(RTM_EVENTS.CHANNEL_MESSAGE_RECEIVED, {
        type,
        data,
        senderId: publisherId,
        channelName,
        timestamp: Date.now()
      })

      // Ekran paylaşımı mesajlarını özel olarak işle
      this._handleScreenShareMessage(type, data, publisherId)

      // Whiteboard mesajlarını özel olarak işle
      if (type === RTM_MESSAGE_TYPES.WHITEBOARD_ACTIVATED) {
        logInfo('🎨 Whiteboard aktivasyon mesajı alındı - işleniyor', { 
          type,
          data,
          publisherId,
          timestamp: new Date().toISOString()
        })
      }
      
      this._handleWhiteboardMessage(type, data, publisherId)

    } catch (error) {
      logError('❌ RTM mesaj işleme hatası - v2.2.2', { 
        error: error.message || error,
        errorStack: error.stack,
        errorName: error.name,
        message, 
        publisherId,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Ekran paylaşımı mesajlarını işle ve bildirim göster - RTM v2.2.2 için güncellendi
   * @param {string} messageType - Mesaj tipi
   * @param {Object} data - Mesaj verisi
   * @param {string} senderId - Gönderen ID
   * @private
   */
  _handleScreenShareMessage(messageType, data, senderId) {
    try {
      logDebug('🖥️ Ekran paylaşımı mesajı işleniyor - v2.2.2', { 
        messageType, 
        data, 
        senderId,
        timestamp: new Date().toISOString()
      })

    // Kullanıcı adını al
    let userName = 'Unknown User'
    
    if (data && data.userInfo && data.userInfo.userName) {
      userName = data.userInfo.userName
    } else if (data && data.userName) {
      userName = data.userName
    } else {
      userName = `User-${senderId}`
    }

    logDebug('👤 Ekran paylaşımı kullanıcı adı belirlendi', { 
      userName, 
      senderId,
      data,
      timestamp: new Date().toISOString()
    })

    switch (messageType) {
      case RTM_MESSAGE_TYPES.SCREEN_SHARE_STARTED:
        logInfo('🖥️ Ekran paylaşımı başlama mesajı işleniyor', { 
          userName, 
          senderId,
          timestamp: new Date().toISOString()
        })
        this._showScreenShareNotification('STARTED', userName)
        break
        
      case RTM_MESSAGE_TYPES.SCREEN_SHARE_STOPPED:
        logInfo('🖥️ Ekran paylaşımı durdurma mesajı işleniyor', { 
          userName, 
          senderId,
          timestamp: new Date().toISOString()
        })
        this._showScreenShareNotification('STOPPED', userName)
        break
        
      case RTM_MESSAGE_TYPES.SCREEN_SHARE_PAUSED:
        logInfo('🖥️ Ekran paylaşımı duraklatma mesajı işleniyor', { 
          userName, 
          senderId,
          timestamp: new Date().toISOString()
        })
        this._showScreenShareNotification('PAUSED', userName)
        break
        
      case RTM_MESSAGE_TYPES.SCREEN_SHARE_RESUMED:
        logInfo('🖥️ Ekran paylaşımı devam mesajı işleniyor', { 
          userName, 
          senderId,
          timestamp: new Date().toISOString()
        })
        this._showScreenShareNotification('RESUMED', userName)
        break
        
      default:
        logDebug('ℹ️ Ekran paylaşımı olmayan mesaj tipi', { 
          messageType, 
          userName, 
          senderId,
          timestamp: new Date().toISOString()
        })
        break
    }
    } catch (error) {
      logError('❌ Ekran paylaşımı mesaj işleme hatası - v2.2.2', { 
        error: error.message || error,
        errorStack: error.stack,
        messageType, 
        data, 
        senderId,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Whiteboard mesajlarını işle ve layout değişimi yap - RTM v2.2.2 için güncellendi
   * @param {string} messageType - Mesaj tipi
   * @param {Object} data - Mesaj verisi
   * @param {string} senderId - Gönderen ID
   * @private
   */
  _handleWhiteboardMessage(messageType, data, senderId) {
    try {
      logDebug('🎨 Whiteboard mesajı işleniyor - v2.2.2', { 
        messageType, 
        data, 
        senderId,
        timestamp: new Date().toISOString()
      })

      // Kullanıcı adını al
      let userName = 'Unknown User'
      
      if (data && data.userInfo && data.userInfo.userName) {
        userName = data.userInfo.userName
      } else if (data && data.userName) {
        userName = data.userName
      } else {
        userName = `User-${senderId}`
      }

      logDebug('👤 Whiteboard kullanıcı adı belirlendi', { 
        userName, 
        senderId,
        data,
        timestamp: new Date().toISOString()
      })

      switch (messageType) {
        case RTM_MESSAGE_TYPES.WHITEBOARD_ACTIVATED:
          logInfo('🎨 Whiteboard aktivasyon mesajı işleniyor', { 
            userName, 
            senderId,
            whiteboardInfo: data.whiteboardInfo,
            hasWhiteboardInfo: !!data.whiteboardInfo,
            hasRoomUuid: !!(data.whiteboardInfo && data.whiteboardInfo.roomUuid),
            fullData: data,
            timestamp: new Date().toISOString()
          })
          
          // 🚀 AUTO-JOIN DEVRE DIŞI - sadece bildirim göster
          logInfo('ℹ️ Whiteboard auto-join devre dışı - sadece bildirim gösteriliyor')
          
          // 🚀 SADECE BİLDİRİM GÖSTER - layout değişimi yapma, auto-join yapma
          this._showWhiteboardNotification('ACTIVATED', userName, data)
          break
          
        case RTM_MESSAGE_TYPES.WHITEBOARD_DEACTIVATED:
          logInfo('🎨 Whiteboard deaktivasyon mesajı işleniyor', { 
            userName, 
            senderId,
            timestamp: new Date().toISOString()
          })
          // 🚀 SADECE BİLDİRİM GÖSTER - layout değişimi yapma
          this._showWhiteboardNotification('DEACTIVATED', userName)
          break
          
        default:
          logDebug('ℹ️ Whiteboard olmayan mesaj tipi', { 
            messageType, 
            userName, 
            senderId,
            timestamp: new Date().toISOString()
          })
          break
      }
    } catch (error) {
      logError('❌ Whiteboard mesaj işleme hatası - v2.2.2', { 
        error: error.message || error,
        errorStack: error.stack,
        messageType, 
        data, 
        senderId,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Whiteboard bildirimi göster - RTM v2.2.2 için güncellendi
   * @param {string} action - Aksiyon tipi (ACTIVATED, DEACTIVATED)
   * @param {string} userName - Kullanıcı adı
   * @param {Object} whiteboardData - Whiteboard verisi (opsiyonel)
   * @private
   */
  _showWhiteboardNotification(action, userName, whiteboardData = null) {
    logDebug('🔔 Whiteboard bildirimi gösteriliyor - v2.2.2', { 
      action, 
      userName,
      whiteboardData,
      timestamp: new Date().toISOString()
    })

    try {
      // Bildirim template'ini al
      const template = WHITEBOARD_NOTIFICATIONS[action]
      if (!template) {
        logWarn('⚠️ Whiteboard bildirim template\'i bulunamadı', { 
          action, 
          availableActions: Object.keys(WHITEBOARD_NOTIFICATIONS),
          timestamp: new Date().toISOString()
        })
        return
      }

      // Bildirim mesajını hazırla
      let message = template.message.replace('{userName}', userName)
      
      // 🚀 Whiteboard aktivasyon bildiriminde sadece Room ID'yi ekle
      if (action === 'ACTIVATED' && whiteboardData) {
        // Önce whiteboardInfo'dan al, yoksa root'tan al
        let roomUuid = whiteboardData.whiteboardInfo?.roomUuid || whiteboardData.roomUuid
        
        // Fallback: Eğer hala yoksa bilinmeyen olarak göster
        if (!roomUuid) roomUuid = 'Bilinmiyor'
        
        message += `\n\n📋 Oda Bilgileri:\n• Room ID: ${roomUuid}`
        

      }
      
      // Bildirimi göster
      notification[template.type.toLowerCase()](
        template.title,
        message,
        {
          category: template.category,
          priority: template.priority,
          autoDismiss: template.autoDismiss,
          autoDismissDelay: template.dismissDelay,
          icon: template.icon,
          sound: template.sound,
          metadata: {
            duplicateKey: `whiteboard-${action}-${userName}`,
            action: action,
            userName: userName,
            whiteboardData: whiteboardData
          }
        }
      )

      logInfo('✅ Whiteboard bildirimi başarıyla gösterildi', { 
        action, 
        userName,
        message,
        timestamp: new Date().toISOString()
      })

      // 🚀 Whiteboard aktivasyon bildiriminde auto-join event'i tetikle
      if (action === 'ACTIVATED' && whiteboardData) {
        try {
          logInfo('🚀 Whiteboard auto-join event\'i tetikleniyor', { 
            roomUuid: whiteboardData.whiteboardInfo?.roomUuid || whiteboardData.roomUuid,
            userName,
            timestamp: new Date().toISOString()
          })
          
          // Central emitter ile auto-join event'i tetikle
          centralEmitter.emit('rtm-whiteboard-auto-join', {
            roomInfo: {
              uuid: whiteboardData.whiteboardInfo?.roomUuid || whiteboardData.roomUuid
            },
            userInfo: {
              uid: whiteboardData.userInfo?.videoUID || 'unknown',
              userName: whiteboardData.userInfo?.userName || userName
            },
            source: 'rtm-message',
            trigger: 'whiteboard-activated'
          })
          
          logInfo('✅ Whiteboard auto-join event\'i başarıyla tetiklendi')
        } catch (eventError) {
          logError('❌ Whiteboard auto-join event tetikleme hatası', { 
            error: eventError.message,
            whiteboardData,
            timestamp: new Date().toISOString()
          })
        }
      }

    } catch (error) {
      logError('❌ Whiteboard bildirim gösterme hatası', { 
        error: error.message || error,
        action, 
        userName,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Whiteboard otomatik katılım işlemi - 🚫 DEVRE DIŞI
   * @param {Object} whiteboardInfo - Whiteboard room bilgileri
   * @param {string} userName - Whiteboard açan kullanıcı adı
   * @private
   */
  async _handleWhiteboardAutoJoin(whiteboardInfo, userName) {
    // 🚫 BU FONKSİYON DEVRE DIŞI - sadece bildirim gösteriliyor
    logInfo('🚫 Whiteboard auto-join devre dışı')
    return
  }

  /**
   * Layout değişimi tetikle - 🚫 DEVRE DIŞI
   * @param {string} layoutId - Layout ID
   * @private
   */
  _triggerLayoutChange(layoutId) {
    // 🚫 BU FONKSİYON DEVRE DIŞI - layout değişimi yapılmıyor
    logInfo('🚫 Layout değişimi devre dışı')
    return
  }

  /**
   * Ekran paylaşımı bildirimi göster - RTM v2.2.2 için güncellendi
   * @param {string} action - Aksiyon tipi (STARTED, STOPPED, etc.)
   * @param {string} userName - Kullanıcı adı
   * @private
   */
  _showScreenShareNotification(action, userName) {
    logDebug('🔔 Ekran paylaşımı bildirimi gösteriliyor - v2.2.2', { 
      action, 
      userName,
      timestamp: new Date().toISOString()
    })

    const template = SCREEN_SHARE_NOTIFICATIONS[action]
    if (!template) {
      logWarn('⚠️ Ekran paylaşımı bildirim template\'i bulunamadı', { 
        action, 
        availableActions: Object.keys(SCREEN_SHARE_NOTIFICATIONS),
        timestamp: new Date().toISOString()
      })
      return
    }

    const message = template.message.replace('{userName}', userName)
    
    logInfo('🔔 Ekran paylaşımı bildirimi gösteriliyor', { 
      action, 
      userName, 
      message,
      template,
      timestamp: new Date().toISOString()
    })
    
    try {
      notification.show({
        type: template.type,
        title: template.title,
        message,
        category: template.category,
        autoDismiss: template.autoDismiss,
        dismissDelay: template.dismissDelay,
        icon: template.icon,
        sound: template.sound
      })

      logInfo('✅ Ekran paylaşımı bildirimi başarıyla gösterildi - v2.2.2', { 
        action, 
        userName, 
        message,
        timestamp: new Date().toISOString()
      })
    } catch (notificationError) {
      logError('❌ Ekran paylaşımı bildirimi gösterilemedi', { 
        action, 
        userName, 
        error: notificationError,
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Event emit et
   * @param {string} eventName - Event adı
   * @param {Object} data - Event verisi
   * @private
   */
  _emitEvent(eventName, data) {
    if (!this.eventListeners.has(eventName)) return

    const listeners = this.eventListeners.get(eventName)
    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        logError('Event callback hatası - v2.2.2', { error, eventName })
      }
    })
  }

  /**
   * Mesaj için retry kuyruğuna ekle
   * @param {string} messageType - Mesaj tipi
   * @param {Object} data - Mesaj verisi
   * @param {Object} options - Seçenekler
   * @private
   */
  _queueMessageForRetry(messageType, data, options) {
    const messageId = this._generateMessageId()
    
    this.messageQueue.push({
      id: messageId,
      type: messageType,
      data,
      options,
      attempts: 0,
      maxAttempts: RTM_CONFIG.MESSAGE.RETRY_COUNT,
      nextRetry: Date.now() + RTM_CONFIG.MESSAGE.RETRY_DELAY
    })

    logDebug('Mesaj retry kuyruğuna eklendi - v2.2.2', { messageId, messageType })
    
    if (!this.isProcessingQueue) {
      this._processMessageQueue()
    }
  }

  /**
   * Mesaj kuyruğunu işle
   * @private
   */
  async _processMessageQueue() {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue[0]
      
      // Henüz zamanı gelmemişse bekle
      if (Date.now() < message.nextRetry) {
        break
      }

      // Kuyrudan çıkar
      this.messageQueue.shift()

      try {
        // Mesajı tekrar göndermeyi dene
        const success = await this.sendChannelMessage(
          message.type, 
          message.data, 
          { ...message.options, retry: false }
        )

        if (success) {
          logInfo('Retry mesajı başarıyla gönderildi - v2.2.2', { messageId: message.id })
        } else {
          throw new Error('Mesaj gönderilemedi')
        }

      } catch (error) {
        message.attempts++
        
        if (message.attempts < message.maxAttempts) {
          // Tekrar kuyruğa ekle
          message.nextRetry = Date.now() + (RTM_CONFIG.MESSAGE.RETRY_DELAY * message.attempts)
          this.messageQueue.push(message)
          logWarn('Mesaj retry edilecek - v2.2.2', { 
            messageId: message.id, 
            attempt: message.attempts,
            maxAttempts: message.maxAttempts 
          })
        } else {
          logError('Mesaj retry limiti aşıldı - v2.2.2', { messageId: message.id })
        }
      }
    }

    this.isProcessingQueue = false
  }

  /**
   * Unique mesaj ID oluştur
   * @returns {string} Mesaj ID
   * @private
   */
  _generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Service state'ini temizle
   * @private
   */
  _cleanup() {
    this.client = null
    this.isClientConnected = false
    this.isChannelSubscribed = false // YENİ: subscribe durumu
    this.currentUserId = null
    this.currentUserName = null
    this.currentChannelName = null
    this.currentToken = null
    this.connectionState = 'disconnected'
    this.messageQueue = []
    this.isProcessingQueue = false
    this.retryAttempts.clear()
    this.eventListeners.clear()
    this.reconnectAttempts = 0
  }
}

// Singleton instance
export const rtmService = new RTMService()

// Default export
export default rtmService
