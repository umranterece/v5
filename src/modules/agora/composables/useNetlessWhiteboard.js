/**
 * Netless Whiteboard Composable
 * Netless Fastboard SDK ile whiteboard işlemlerini yönetir
 * @module composables/useNetlessWhiteboard
 */

import { ref, computed, onUnmounted, nextTick, readonly } from 'vue'
import { createFastboard } from '@netless/fastboard'
import { NETLESS_CONFIG, NETLESS_EVENTS, RTM_MESSAGE_TYPES } from '../constants.js'
import { centralEmitter, createSafeTimeout } from '../utils/index.js'
import { fileLogger, LOG_CATEGORIES, netlessService } from '../services/index.js'


/**
 * useNetlessWhiteboard composable
 * Netless whiteboard işlemlerini yönetir ve proje mimarisine uygun yapı sağlar
 * @param {Object} agoraStore - Ana Agora store referansı
 * @returns {Object} Whiteboard state ve metodları
 */
export function useNetlessWhiteboard(agoraStore) {
  // Logger fonksiyonları - Proje standardına uygun
  const logDebug = (message, data) => fileLogger.log('debug', LOG_CATEGORIES.WHITEBOARD, message, data)
  const logInfo = (message, data) => fileLogger.log('info', LOG_CATEGORIES.WHITEBOARD, message, data)
  const logWarn = (message, data) => fileLogger.log('warn', LOG_CATEGORIES.WHITEBOARD, message, data)
  const logError = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('error', LOG_CATEGORIES.WHITEBOARD, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('error', LOG_CATEGORIES.WHITEBOARD, errorOrMessage, context)
  }
  const logFatal = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('fatal', LOG_CATEGORIES.WHITEBOARD, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('fatal', LOG_CATEGORIES.WHITEBOARD, errorOrMessage, context)
  }

  // Reactive State
  const fastboard = ref(null)
  const room = ref(null)
  const isConnecting = ref(false)
  const isConnected = ref(false)
  const isReady = ref(false)
  const connectionError = ref(null)
  const roomPhase = ref('disconnected')
  const members = ref([])
  const currentTool = ref(NETLESS_CONFIG.DEFAULTS.TOOL)
  const currentColor = ref(NETLESS_CONFIG.DEFAULTS.STROKE_COLOR)
  const currentStrokeWidth = ref(NETLESS_CONFIG.DEFAULTS.STROKE_WIDTH)
  const isDarkTheme = ref(false)
  const roomUuid = ref(null)
  const roomToken = ref(null)

  // Computed Properties
  const canDraw = computed(() => {
    return isConnected.value && room.value && room.value.isWritable
  })

  const memberCount = computed(() => {
    return members.value.length
  })

  const connectionStatus = computed(() => {
    if (isConnecting.value) return 'connecting'
    if (isConnected.value) return 'connected'
    if (connectionError.value) return 'error'
    return 'disconnected'
  })

  const roomInfo = computed(() => {
    if (!room.value) return null
    return {
      uuid: roomUuid.value,
      phase: roomPhase.value,
      memberCount: memberCount.value,
      isWritable: room.value.isWritable,
      currentSceneIndex: room.value.state?.sceneState?.index || 0,
      totalScenes: room.value.state?.sceneState?.scenes?.length || 0
    }
  })

  /**
   * 🆕 Channel-based whiteboard room'a bağlan
   * @param {Object} options - Bağlantı seçenekleri
   * @param {string} options.channelName - Agora channel adı (zorunlu)
   * @param {string} options.uuid - Room UUID (opsiyonel, mevcut room için)
   * @param {string} options.token - Room token (opsiyonel, mevcut room için)
   * @param {HTMLElement} options.container - Container element
   * @param {string} options.userId - Kullanıcı ID
   * @param {string} options.userName - Kullanıcı adı
   * @returns {Promise<boolean>} Başarı durumu
   */
  const joinRoom = async (options = {}) => {
    try {
      if (isConnecting.value || isConnected.value) {
        logWarn('Zaten bağlanıyor veya bağlı', { currentState: connectionStatus.value })
        return false
      }

      if (!options.channelName) {
        throw new Error('Channel name gerekli - channel-based whiteboard room için')
      }

      isConnecting.value = true
      connectionError.value = null
      
      const userId = options.userId || agoraStore.users?.local?.video?.uid?.toString() || `user-${Date.now()}`
      const userName = options.userName || agoraStore.users?.local?.video?.name || 'Agora User'
      const channelName = options.channelName
      
      logInfo('🚀 Channel-based whiteboard room bağlantısı başlatılıyor', { 
        channelName,
        hasUuid: !!options.uuid,
        hasToken: !!options.token,
        userId,
        userName
      })

      let roomData, token, isExistingRoom = false

      // Room logic: Mevcut room'a katıl veya yeni oluştur
      if (options.uuid && options.token) {
        // ✅ UUID VE TOKEN VAR → Direkt kullan (mevcut room)
        logInfo('Mevcut Netless room\'a katılım başlatılıyor (token mevcut)', { 
          uuid: options.uuid,
          channelName 
        })
        
        roomData = { uuid: options.uuid }
        token = options.token
        isExistingRoom = true
        
        logInfo('Mevcut room için token kullanılıyor', { 
          uuid: options.uuid,
          hasToken: true,
          channelName
        })
      } else if (options.uuid) {
        // ✅ UUID VAR AMA TOKEN YOK → Token al (mevcut room)
        logInfo('Mevcut Netless room\'a katılım başlatılıyor (token alınıyor)', { 
          uuid: options.uuid,
          channelName 
        })
        
        // Mevcut room için token al
        const userToken = await netlessService.getRoomToken(options.uuid, userId, 'writer')
        roomData = { uuid: options.uuid }
        token = userToken.token || userToken
        isExistingRoom = true
        
        logInfo('Mevcut room için token alındı', { 
          uuid: options.uuid,
          hasToken: !!token,
          channelName
        })
      } else {
        // ❌ UUID ve token gerekli
        logInfo('UUID ve token gerekli', { channelName })
        throw new Error('UUID ve token gerekli - Room bilgileri eksik')
      }

      // Room UUID ve token'ı sakla
      roomUuid.value = roomData.uuid
      roomToken.value = token

      if (!options.container) {
        throw new Error('Container element gerekli')
      }

      // Fastboard oluştur
      logInfo('Fastboard oluşturuluyor', { uuid: roomData.uuid })
      
      const fastboardInstance = await createFastboard({
        sdkConfig: {
          appIdentifier: NETLESS_CONFIG.SDK.APP_IDENTIFIER,
          region: NETLESS_CONFIG.SDK.REGION,
          logLevel: NETLESS_CONFIG.SDK.LOG_LEVEL
        },
        joinRoom: {
          uuid: roomData.uuid,
          roomToken: roomToken.value,
          uid: userId,
          userPayload: {
            name: userName,
            avatar: agoraStore.localUser?.avatar || '',
            role: 'writer'
          }
        },
        managerConfig: {
          container: options.container,
          chessboard: NETLESS_CONFIG.FASTBOARD.THEME === 'auto',
          debug: NETLESS_CONFIG.SDK.LOG_LEVEL === 'debug'
        }
      })

      fastboard.value = fastboardInstance
      room.value = fastboardInstance.room

      // Fastboard'u container'a manuel mount et
      if (options.container) {
        try {
          logInfo('Fastboard container\'a manuel mount ediliyor', { container: options.container })
          await fastboardInstance.mount(options.container)
          logInfo('Fastboard başarıyla container\'a mount edildi')
        } catch (mountError) {
          logError('Fastboard mount hatası', { error: mountError.message })
        }
      } else {
        logWarn('Container bulunamadı, mount edilemedi')
      }

      // Event listeners ekle
      setupEventListeners()

      // Store'u güncelle
      agoraStore.setWhiteboardConnected(true)
      agoraStore.setWhiteboardClient(room.value)
      
      // 🚀 WHITEBOARD ROOM BİLGİLERİNİ STORE'A KAYDET
      agoraStore.setWhiteboardRoom({
        uuid: roomData.uuid,
        token: roomToken.value,
        appIdentifier: NETLESS_CONFIG.SDK.APP_IDENTIFIER,
        region: NETLESS_CONFIG.SDK.REGION,
        name: roomData.name || `agora-whiteboard-${Date.now()}`,
        channelName: agoraStore.session?.videoChannelName || 'unknown'
      })
      
      logInfo('✅ Whiteboard room bilgileri store\'a kaydedildi', { 
        uuid: roomData.uuid,
        appIdentifier: NETLESS_CONFIG.SDK.APP_IDENTIFIER,
        channelName: agoraStore.session?.videoChannelName
      })

      isConnected.value = true
      isReady.value = true
      
      // Debug: Room durumunu kontrol et
      logInfo('Room durumu kontrol ediliyor', {
        isWritable: room.value?.isWritable,
        phase: room.value?.phase,
        memberCount: room.value?.state?.roomMembers?.length || 0,
        currentAppliance: room.value?.state?.memberState?.currentApplianceName
      })
      
      logInfo('Netless room\'a başarıyla bağlandı', { 
        uuid: roomData.uuid, 
        phase: room.value.phase,
        memberCount: room.value.state?.roomMembers?.length || 0
      })

      // ✅ RTM bildirimi artık netlessService seviyesinde yönetiliyor
      logInfo('Whiteboard room bağlantısı başarılı, RTM bildirimi service seviyesinde yönetiliyor')

      // RTM bildirimi: Room'a katıldığını bildir
      try {
        const channelName = agoraStore.session?.videoChannelName
        if (channelName && roomData.uuid) {
          await netlessService.sendRTMMessage({
            messageType: RTM_MESSAGE_TYPES.WHITEBOARD_ROOM_JOINED,
            data: {
              channelName,
              roomUuid: roomData.uuid,
              userId,
              userName,
              timestamp: new Date().toISOString()
            }
          })
          logInfo('✅ RTM whiteboard room joined mesajı gönderildi', { 
            channelName,
            roomUuid: roomData.uuid,
            userId
          })
        }
      } catch (rtmError) {
        logError('❌ RTM whiteboard room joined mesajı gönderilemedi', { 
          error: rtmError.message,
          channelName: agoraStore.session?.videoChannelName
        })
      }
      
      // Central emitter'a event gönder
      centralEmitter.emit(NETLESS_EVENTS.ROOM_JOINED, {
        uuid: roomData.uuid,
        room: room.value,
        fastboard: fastboard.value,
        userId,
        userName
      })

      return true

    } catch (error) {
      connectionError.value = error
      isConnected.value = false
      isReady.value = false
      
      logError('Netless room bağlantısı başarısız', { 
        error: error.message,
        stack: error.stack,
        options: {
          hasUuid: !!options.uuid,
          hasToken: !!options.token,
          hasContainer: !!options.container
        }
      })
      
      centralEmitter.emit(NETLESS_EVENTS.ERROR_OCCURRED, { error })
      
      return false
    } finally {
      isConnecting.value = false
    }
  }

  /**
   * Room'dan ayrıl
   * @returns {Promise<boolean>} Başarı durumu
   */
  const leaveRoom = async () => {
    try {
      if (!isConnected.value) {
        logWarn('Zaten bağlı değil')
        return true
      }

      logInfo('Netless room\'dan ayrılıyor')

      // Event listeners'ı temizle
      removeEventListeners()

      // Fastboard'u kapat
      if (fastboard.value) {
        await fastboard.value.destroy()
        fastboard.value = null
      }

      // Room referansını temizle
      room.value = null

      // State'i sıfırla
      isConnected.value = false
      isReady.value = false
      members.value = []
      roomPhase.value = 'disconnected'
      connectionError.value = null

      // Store'u güncelle
      agoraStore.setWhiteboardConnected(false)
      agoraStore.setWhiteboardClient(null)

      // RTM bildirimi: Room'dan ayrıldığını bildir
      try {
        const channelName = agoraStore.session?.videoChannelName
        if (channelName && roomUuid.value) {
          await netlessService.sendRTMMessage({
            messageType: RTM_MESSAGE_TYPES.WHITEBOARD_ROOM_LEFT,
            data: {
              channelName,
              roomUuid: roomUuid.value,
              userId: agoraStore.users?.local?.video?.uid || 'unknown',
              timestamp: new Date().toISOString()
              }
            })
          logInfo('✅ RTM whiteboard room left mesajı gönderildi', { 
            channelName,
            roomUuid: roomUuid.value
          })
        }
      } catch (rtmError) {
        logError('❌ RTM whiteboard room left mesajı gönderilemedi', { 
          error: rtmError.message,
          channelName: agoraStore.session?.videoChannelName
        })
      }
      
      logInfo('Whiteboard room\'dan ayrılma başarılı')

      logInfo('Netless room\'dan başarıyla ayrıldı')
      
      centralEmitter.emit(NETLESS_EVENTS.ROOM_LEFT, {
        uuid: roomUuid.value
      })

      // Room bilgilerini temizle
      roomUuid.value = null
      roomToken.value = null

      return true

    } catch (error) {
      logError('Room\'dan ayrılma hatası', { error: error.message })
      return false
    }
  }

  /**
   * Çizim aracını değiştir
   * @param {string} tool - Araç adı
   */
  const setTool = async (tool) => {
    if (!canDraw.value) {
      logWarn('Çizim yapma izni yok', { tool })
      return
    }

    try {
      if (fastboard.value && room.value && room.value.isWritable) {
        // Netless SDK'da tool isimlerini düzelt
        let netlessTool = tool
        
        // Tool mapping - Netless SDK'da farklı isimler kullanılıyor
        const toolMapping = {
          'selector': 'selector',
          'pencil': 'pencil',
          'highlighter': 'highlighter',
          'text': 'text',
          'eraser': 'eraser',
          'rectangle': 'rectangle',
          'ellipse': 'ellipse',
          'triangle': 'shape', // Üçgen için shape kullanılıyor
          'line': 'straight',
          'arrow': 'arrow'
        }
        
        netlessTool = toolMapping[tool] || tool
        
        // Netless SDK'da tool member state ile ayarla
        await room.value.setMemberState({
          currentApplianceName: netlessTool
        })
        
        currentTool.value = tool
        
        logDebug('Araç değiştirildi', { tool, netlessTool })
        centralEmitter.emit(NETLESS_EVENTS.TOOL_CHANGED, { tool })
      } else {
        logWarn('Room yazılabilir değil', { tool, isWritable: room.value?.isWritable })
      }
    } catch (error) {
      logError('Araç değiştirme hatası', { tool, error: error.message })
    }
  }

  /**
   * Çizim rengini değiştir
   * @param {string} color - Hex renk kodu
   */
  const setStrokeColor = async (color) => {
    if (!canDraw.value) {
      logWarn('Çizim yapma izni yok', { color })
      return
    }

    try {
      if (fastboard.value && room.value && room.value.isWritable) {
        // Netless SDK'da renk RGB array olarak verilmeli
        const rgb = [
          parseInt(color.substr(1, 2), 16),
          parseInt(color.substr(3, 2), 16),
          parseInt(color.substr(5, 2), 16)
        ]
        
        // Room üzerinden member state ile renk ayarla
        await room.value.setMemberState({
          strokeColor: rgb
        })
        
        currentColor.value = color
        
        logDebug('Renk değiştirildi', { color, rgb })
        centralEmitter.emit(NETLESS_EVENTS.COLOR_CHANGED, { color, rgb })
      } else {
        logWarn('Room yazılabilir değil', { color, isWritable: room.value?.isWritable })
      }
    } catch (error) {
      logError('Renk değiştirme hatası', { color, error: error.message })
    }
  }

  /**
   * Çizgi kalınlığını değiştir
   * @param {number} width - Kalınlık değeri
   */
  const setStrokeWidth = async (width) => {
    if (!canDraw.value) {
      logWarn('Çizim yapma izni yok', { width })
      return
    }

    try {
      if (fastboard.value && room.value && room.value.isWritable) {
        // Netless SDK'da kalınlık member state ile ayarlanır
        await room.value.setMemberState({
          strokeWidth: width
        })
        
        currentStrokeWidth.value = width
        
        logDebug('Kalınlık değiştirildi', { width })
        centralEmitter.emit(NETLESS_EVENTS.STROKE_CHANGED, { width })
      } else {
        logWarn('Room yazılabilir değil', { width, isWritable: room.value?.isWritable })
      }
    } catch (error) {
      logError('Kalınlık değiştirme hatası', { width, error: error.message })
    }
  }

  /**
   * Geri al
   */
  const undo = () => {
    if (!canDraw.value) return

    try {
      if (room.value) {
        room.value.undo()
        logDebug('Geri al işlemi')
      }
    } catch (error) {
      logError('Geri al hatası', { error: error.message })
    }
  }

  /**
   * Tekrarla
   */
  const redo = () => {
    if (!canDraw.value) return

    try {
      if (room.value) {
        room.value.redo()
        logDebug('Tekrarla işlemi')
      }
    } catch (error) {
      logError('Tekrarla hatası', { error: error.message })
    }
  }

  /**
   * Sayfayı temizle
   */
  const clearScene = () => {
    if (!canDraw.value) return

    try {
      if (room.value) {
        room.value.cleanCurrentScene()
        logInfo('Sayfa temizlendi')
      }
    } catch (error) {
      logError('Sayfa temizleme hatası', { error: error.message })
    }
  }

  /**
   * Tema değiştir
   * @param {string} theme - 'light', 'dark' veya 'auto'
   */
  const setTheme = async (theme) => {
    try {
      if (fastboard.value) {
        // Netless Fastboard'da tema değiştirme
        // Fastboard instance üzerinden tema ayarla
        await fastboard.value.setTheme(theme)
        isDarkTheme.value = theme === 'dark'
        
        logDebug('Tema değiştirildi', { theme, isDarkTheme: isDarkTheme.value })
        centralEmitter.emit(NETLESS_EVENTS.THEME_CHANGED, { theme })
      }
    } catch (error) {
      logError('Tema değiştirme hatası', { theme, error: error.message })
      
      // Fallback: Manuel tema değiştirme
      try {
        isDarkTheme.value = theme === 'dark'
        
        // CSS değişkenleri ile tema değiştir
        const root = document.documentElement
        if (theme === 'dark') {
          root.style.setProperty('--whiteboard-bg', '#1a1a1a')
          root.style.setProperty('--whiteboard-text', '#ffffff')
          root.style.setProperty('--whiteboard-border', '#333333')
        } else {
          root.style.setProperty('--whiteboard-bg', '#ffffff')
          root.style.setProperty('--whiteboard-text', '#000000')
          root.style.setProperty('--whiteboard-border', '#e9ecef')
        }
        
        logDebug('Fallback tema değiştirildi', { theme })
      } catch (fallbackError) {
        logError('Fallback tema değiştirme hatası', { theme, error: fallbackError.message })
      }
    }
  }

  /**
   * Event listeners'ı kur
   */
  const setupEventListeners = () => {
    if (!room.value) return

    // Room phase değişiklikleri
    room.value.callbacks.on('onPhaseChanged', (phase) => {
      roomPhase.value = phase
      logDebug('Room phase değişti', { phase })
      
      centralEmitter.emit(NETLESS_EVENTS.PHASE_CHANGED, { phase })
    })

    // Üye join/leave events
    room.value.callbacks.on('onRoomStateChanged', (modifyState) => {
      if (modifyState.roomMembers) {
        members.value = modifyState.roomMembers
        logDebug('Room members güncellendi', { 
          memberCount: members.value.length 
        })
      }
    })

    // Bağlantı kopması
    room.value.callbacks.on('onDisconnectWithError', (error) => {
      connectionError.value = error
      isConnected.value = false
      
      logError('Room bağlantısı koptu', { error: error.message })
      centralEmitter.emit(NETLESS_EVENTS.ROOM_DISCONNECTED, { error })
    })

    // RTM whiteboard room management event'lerini dinle
    centralEmitter.on(RTM_MESSAGE_TYPES.WHITEBOARD_AUTO_JOIN, async (data) => {
      const { roomInfo, userInfo, source, trigger } = data
      
      logInfo('🚀 Whiteboard auto-join request alındı', { 
        roomInfo, 
        userInfo, 
        source, 
        trigger,
        timestamp: new Date().toISOString()
      })
      
      try {
        // Eğer zaten bağlıysa, yeni room'a geç
        if (isConnected.value) {
          logInfo('Zaten whiteboard room\'a bağlı, yeni room\'a geçiliyor', { 
            currentRoom: roomUuid.value,
            newRoom: roomInfo.uuid 
          })
          await leaveRoom()
        }

        // Yeni room'a otomatik katıl
        const joinResult = await joinRoom({
          channelName: agoraStore.session?.videoChannelName || 'unknown',
          uuid: roomInfo.uuid,  // UUID var, mevcut room'a katılacak
          container: document.getElementById('whiteboard-container') || document.body,
          userId: agoraStore.users?.local?.video?.uid || 'unknown',
          userName: agoraStore.users?.local?.video?.name || 'Unknown User'
        })

        if (joinResult) {
          logInfo('✅ Whiteboard auto-join başarılı', { 
            roomUuid: roomInfo.uuid,
            source,
            trigger,
            timestamp: new Date().toISOString()
          })
          
          // Layout'u whiteboard'a geçir
          centralEmitter.emit('layout-change-request', {
            layoutId: 'whiteboard',
            source: 'whiteboard-auto-join',
            trigger: 'rtm-message'
          })
        } else {
          logError('❌ Whiteboard auto-join başarısız', { 
            roomUuid: roomInfo.uuid,
            source,
            trigger,
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        logError('Whiteboard auto-join hatası', { 
          error: error.message,
          roomInfo,
          userInfo,
          source,
          trigger,
          timestamp: new Date().toISOString()
        })
      }
    })

        // RTM whiteboard room created event'ini dinle
    centralEmitter.on(RTM_MESSAGE_TYPES.WHITEBOARD_ROOM_CREATED, async (data) => {
      const { channelName, roomInfo, userInfo, timestamp } = data
      
      logInfo('🎨 RTM whiteboard room oluşturulma bildirimi alındı', { 
        channelName,
        roomInfo, 
        userInfo, 
        timestamp: new Date(timestamp).toISOString()
      })
      
      // Eğer bu channel'daysak ve henüz whiteboard'a bağlı değilsek, otomatik katıl
      if (agoraStore.session?.videoChannelName === channelName && !isConnected.value) {
        logInfo('🚀 Aynı channel\'da whiteboard room oluşturuldu, otomatik katılım başlatılıyor', { 
          channelName,
          roomUuid: roomInfo.uuid
        })
        
        try {
          const joinResult = await joinRoom({
            channelName,
            uuid: roomInfo.uuid,
            container: document.getElementById('whiteboard-container') || document.body,
            userId: agoraStore.users?.local?.video?.uid || 'unknown',
            userName: agoraStore.users?.local?.video?.name || 'Unknown User'
          })

          if (joinResult) {
            logInfo('✅ Otomatik whiteboard room katılımı başarılı', { 
              channelName,
              roomUuid: roomInfo.uuid
            })
          } else {
            logError('❌ Otomatik whiteboard room katılımı başarısız', { 
              channelName,
              roomUuid: roomInfo.uuid
            })
          }
        } catch (error) {
          logError('Otomatik whiteboard room katılım hatası', { 
            error: error.message,
            channelName,
            roomInfo
          })
        }
      }
    })
    
    // RTM whiteboard room joined event'ini dinle
    centralEmitter.on(RTM_MESSAGE_TYPES.WHITEBOARD_ROOM_JOINED, async (data) => {
      const { channelName, userId, timestamp } = data
      
      logInfo('🎨 RTM whiteboard room katılım bildirimi alındı', { 
        channelName,
        userId,
        timestamp: new Date(timestamp).toISOString()
      })
      
      // Store'da member count güncellendi, UI'ı güncelle
      if (agoraStore.session?.videoChannelName === channelName) {
        logInfo('✅ Whiteboard room member count güncellendi', { 
          channelName,
          userId
        })
      }
    })
    
    // RTM whiteboard room left event'ini dinle
    centralEmitter.on(RTM_MESSAGE_TYPES.WHITEBOARD_ROOM_LEFT, async (data) => {
      const { channelName, userId, timestamp } = data
      
      logInfo('🎨 RTM whiteboard room ayrılma bildirimi alındı', { 
        channelName,
        userId,
          timestamp: new Date(timestamp).toISOString()
      })
      
      // Store'da member count güncellendi, UI'ı güncelle
      if (agoraStore.session?.videoChannelName === channelName) {
        logInfo('✅ Whiteboard room member count güncellendi', { 
          channelName,
          userId
        })
      }
    })
    
    // RTM whiteboard room deleted event'ini dinle
    centralEmitter.on(RTM_MESSAGE_TYPES.WHITEBOARD_ROOM_DELETED, async (data) => {
      const { channelName, timestamp } = data
      
      logInfo('🎨 RTM whiteboard room silinme bildirimi alındı', { 
        channelName,
        timestamp: new Date(timestamp).toISOString()
      })
      
      // Eğer bu channel'daysak ve whiteboard'a bağlıysak, bağlantıyı kes
      if (agoraStore.session?.videoChannelName === channelName && isConnected.value) {
        logInfo('🚫 Whiteboard room silindi, bağlantı kesiliyor', { 
          channelName
        })
        
        try {
          await leaveRoom()
          logInfo('✅ Whiteboard room silinme sonrası bağlantı kesildi', { 
            channelName
          })
        } catch (error) {
          logError('❌ Whiteboard room silinme sonrası bağlantı kesme hatası', { 
            error: error.message,
            channelName
          })
        }
      }
    })

    logDebug('Event listeners kuruldu')
  }

  /**
   * Event listeners'ı kaldır
   */
  const removeEventListeners = () => {
    if (room.value?.callbacks) {
      room.value.callbacks.off()
      logDebug('Event listeners kaldırıldı')
    }
    
    // RTM whiteboard room management event listener'larını kaldır
    centralEmitter.off(RTM_MESSAGE_TYPES.WHITEBOARD_AUTO_JOIN)
    centralEmitter.off(RTM_MESSAGE_TYPES.WHITEBOARD_ROOM_CREATED)
    centralEmitter.off(RTM_MESSAGE_TYPES.WHITEBOARD_ROOM_JOINED)
    centralEmitter.off(RTM_MESSAGE_TYPES.WHITEBOARD_ROOM_LEFT)
    centralEmitter.off(RTM_MESSAGE_TYPES.WHITEBOARD_ROOM_DELETED)
    logDebug('Whiteboard room management event listener\'lar kaldırıldı')
  }

  /**
   * Cleanup işlemi
   */
  const cleanup = async () => {
    try {
      await leaveRoom()
      logInfo('Netless whiteboard cleanup tamamlandı')
    } catch (error) {
      logError('Cleanup hatası', { error: error.message })
    }
  }

  // Component unmount olduğunda cleanup yap
  onUnmounted(() => {
    cleanup()
  })

  // Public API - Proje mimarisine uygun
  return {
    // State
    fastboard: readonly(fastboard),
    room: readonly(room),
    isConnecting: readonly(isConnecting),
    isConnected: readonly(isConnected),
    isReady: readonly(isReady),
    connectionError: readonly(connectionError),
    members: readonly(members),
    currentTool: readonly(currentTool),
    currentColor: readonly(currentColor),
    currentStrokeWidth: readonly(currentStrokeWidth),
    isDarkTheme: readonly(isDarkTheme),

    // Computed
    canDraw,
    memberCount,
    connectionStatus,
    roomInfo,

    // Methods
    joinRoom,
    leaveRoom,
    setTool,
    setStrokeColor,
    setStrokeWidth,
    undo,
    redo,
    clearScene,
    setTheme,
    cleanup,

    // Utils
    centralEmitter,
    logDebug,
    logInfo,
    logWarn,
    logError,
    logFatal
  }
}
