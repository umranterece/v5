import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserDisplayName, getRemoteUserDisplayName, isVideoUser, isScreenShareUser, isWhiteboardUser, NETLESS_CONFIG, USER_ID_RANGES } from '../constants.js'
import { fileLogger, LOG_CATEGORIES } from '../services/index.js'


/**
 * Agora Store - Video ve Ekran Paylaşımı client'larını yönetir
 * Bu store, Agora video konferans uygulamasının tüm state'ini yönetir.
 * Video client, ekran paylaşımı client, kullanıcılar ve track'ler için merkezi state yönetimi sağlar.
 * @module store/agora
 */
export const useAgoraStore = defineStore('agora', () => {
  // Logger fonksiyonları - FileLogger'dan al (tüm seviyeler için)
  const logDebug = (message, data) => fileLogger.log('debug', 'STORE', message, data)
  const logInfo = (message, data) => fileLogger.log('info', 'STORE', message, data)
  const logWarn = (message, data) => fileLogger.log('warn', 'STORE', message, data)
  const logError = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('error', 'STORE', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('error', 'STORE', errorOrMessage, context)
  }
  const logFatal = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('fatal', 'STORE', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('fatal', 'STORE', errorOrMessage, context)
  }
  // Unified Client State - Birleştirilmiş client durumu
  const clients = ref({
    video: {
      client: null,
      isConnected: false,
      isInitialized: false
    },
    screen: {
      client: null,
      isConnected: false,
      isInitialized: false
    },
    rtm: {  // 🆕 RTM CLIENT
      client: null,
      isConnected: false,
      isInitialized: false,
      isChannelJoined: false,
      currentChannelName: null,
      currentUserId: null,
      currentUserName: null,
      connectionState: 'disconnected',
      lastConnectionTime: null,
      metrics: {
        messagesSent: 0,
        messagesReceived: 0,
        messagesFailed: 0,
        connectionAttempts: 0
      }
    },
    whiteboard: {  // 🆕 YENİ
      client: null,
      isConnected: false,
      isInitialized: false,
      isActive: false,
      isPresenter: false,
      dataChannel: null,
      roomId: null
    }
  })

  // Unified User State - Birleştirilmiş kullanıcı durumu
  const users = ref({
    local: {
      video: null,
      screen: null,
      whiteboard: null  // 🆕 YENİ
    },
    remote: [] // Tüm uzak kullanıcılar tek listede
  })

  // Unified Track State - Birleştirilmiş track durumu
  const tracks = ref({
    local: {
      video: { audio: null, video: null },
      screen: { video: null },
      whiteboard: {  // 🆕 YENİ
        canvas: null,
        dataChannel: null,
        drawingData: null,
        history: [],
        currentTool: NETLESS_CONFIG.DEFAULTS.TOOL,
        currentColor: NETLESS_CONFIG.DEFAULTS.STROKE_COLOR,
        currentWidth: NETLESS_CONFIG.DEFAULTS.STROKE_WIDTH
      }
    },
    remote: new Map() // UID -> { audio, video, screen, whiteboard }
  })

  // Unified Control State - Birleştirilmiş kontrol durumu
  const controls = ref({
    isLocalVideoOff: false,
    isLocalAudioMuted: false,
    isScreenSharing: false,
    isWhiteboardActive: false,  // 🆕 YENİ
    isWhiteboardPresenting: false  // 🆕 YENİ
  })

  // Session State - Oturum durumu
  const session = ref({
    videoChannelName: null,
    appId: null,
    whiteboardRoomId: null,  // 🆕 YENİ
    whiteboardSessionId: null,  // 🆕 YENİ
    whiteboardRoom: null,  // 🆕 YENİ - Room bilgileri
    // 🆕 CHANNEL-BASED WHITEBOARD ROOM STATE
    channelWhiteboardRooms: new Map() // channelName -> roomInfo mapping
  })

  // Device State - Cihaz durumu
  const devices = ref({
    hasCamera: false,
    hasMicrophone: false,
    cameraPermission: 'unknown', // 'granted', 'denied', 'unknown'
    microphonePermission: 'unknown', // 'granted', 'denied', 'unknown'
    cameraTrack: null,
    microphoneTrack: null
  })

  // Computed Properties - Hesaplanmış özellikler (Optimized)
  const allUsers = computed(() => {
    const localUsers = []
    
    // Yerel kullanıcıları ekle
    if (users.value.local.screen) {
      localUsers.push(users.value.local.screen)
    }
    if (users.value.local.video) {
      localUsers.push(users.value.local.video)
    }
    
    // Uzak kullanıcıları ekle (array copy yerine spread)
    return [...localUsers, ...users.value.remote]
  })

  const connectedUsersCount = computed(() => allUsers.value.length)

  const hasLocalVideo = computed(() => 
    tracks.value.local.video.video && !controls.value.isLocalVideoOff
  )

  const hasLocalAudio = computed(() => 
    tracks.value.local.video.audio && !controls.value.isLocalAudioMuted
  )

  const hasLocalScreenShare = computed(() => 
    tracks.value.local.screen.video && controls.value.isScreenSharing
  )

  const hasLocalWhiteboard = computed(() =>  // 🆕 YENİ
    tracks.value.local.whiteboard.canvas && controls.value.isWhiteboardActive
  )

  const videoChannelName = computed(() => session.value.videoChannelName)
  const appId = computed(() => session.value.appId)
  const whiteboardRoomId = computed(() => session.value.whiteboardRoomId)  // 🆕 YENİ
  const whiteboardRoom = computed(() => session.value.whiteboardRoom)  // 🆕 YENİ

  // Device computed properties
  const canUseCamera = computed(() => 
    devices.value.hasCamera && devices.value.cameraPermission === 'granted'
  )
  
  const canUseMicrophone = computed(() => 
    devices.value.hasMicrophone && devices.value.microphonePermission === 'granted'
  )
  
  const isLocalVideoOff = computed(() => 
    controls.value.isLocalVideoOff
  )
  
  const isLocalAudioMuted = computed(() => 
    controls.value.isLocalAudioMuted
  )

  const isScreenSharing = computed(() => 
    controls.value.isScreenSharing
  )

  const isWhiteboardActive = computed(() =>  // 🆕 YENİ
    controls.value.isWhiteboardActive
  )

  const isWhiteboardPresenting = computed(() =>  // 🆕 YENİ
    controls.value.isWhiteboardPresenting
  )

  // Helper functions
  const isLocalUID = (uid) => {
    return (users.value.local.video && users.value.local.video.uid === uid) ||
           (users.value.local.screen && users.value.local.screen.uid === uid) ||
           (users.value.local.whiteboard && users.value.local.whiteboard.uid === uid)  // 🆕 YENİ
  }

  const isLocalVideoUID = (uid) => {
    return users.value.local.video && users.value.local.video.uid === uid
  }

  const isLocalScreenUID = (uid) => {
    return users.value.local.screen && users.value.local.screen.uid === uid
  }

  const isLocalWhiteboardUID = (uid) => {  // 🆕 YENİ
    return users.value.local.whiteboard && users.value.local.whiteboard.uid === uid
  }

  // isWhiteboardUser artık constants'tan import ediliyor

  // Client Actions - Client işlemleri
  const setClient = (type, client) => {
    clients.value[type].client = client
  }

  const setClientConnected = (type, connected) => {
    clients.value[type].isConnected = connected
  }

  const setClientInitialized = (type, initialized) => {
    clients.value[type].isInitialized = initialized
  }

  // Whiteboard Client Actions - 🆕 YENİ
  const setWhiteboardClient = (client) => {
    clients.value.whiteboard.client = client
  }

  const setWhiteboardConnected = (connected) => {
    clients.value.whiteboard.isConnected = connected
  }

  const setWhiteboardInitialized = (initialized) => {
    clients.value.whiteboard.isInitialized = initialized
  }

  const setWhiteboardActive = (active) => {
    clients.value.whiteboard.isActive = active
    controls.value.isWhiteboardActive = active

    // ✅ RTM bildirimi artık composable seviyesinde yönetiliyor (useNetlessWhiteboard)
    // Store seviyesinde çift bildirim önleniyor
    logInfo('🎨 Whiteboard durumu güncellendi', { 
      active, 
      source: 'store',
      note: 'RTM bildirimi composable seviyesinde yönetiliyor'
    })
  }

  const setWhiteboardPresenter = (presenter) => {
    clients.value.whiteboard.isPresenter = presenter
    controls.value.isWhiteboardPresenting = presenter
  }

  // RTM Client Actions - 🚀 YENİ RTM ACTIONS
  const setRTMClient = (client) => {
    clients.value.rtm.client = client
    clients.value.rtm.isInitialized = !!client
    logDebug('RTM client store\'da ayarlandı', { hasClient: !!client })
  }

  const setRTMConnected = (connected) => {
    clients.value.rtm.isConnected = connected
    if (connected) {
      clients.value.rtm.lastConnectionTime = Date.now()
      clients.value.rtm.metrics.connectionAttempts++
    }
    logDebug('RTM bağlantı durumu güncellendi', { connected })
  }

  const setRTMChannelJoined = (joined) => {
    clients.value.rtm.isChannelJoined = joined
    logDebug('RTM kanal katılım durumu güncellendi', { joined })
  }

  const setRTMUserInfo = (userId, userName) => {
    clients.value.rtm.currentUserId = userId
    clients.value.rtm.currentUserName = userName
    logDebug('RTM kullanıcı bilgileri güncellendi', { userId, userName })
  }

  const setRTMChannelName = (channelName) => {
    clients.value.rtm.currentChannelName = channelName
    logDebug('RTM kanal adı güncellendi', { channelName })
  }

  const setRTMConnectionState = (state) => {
    clients.value.rtm.connectionState = state
    logDebug('RTM bağlantı durumu güncellendi', { state })
  }

  const updateRTMMetrics = (metricsUpdate) => {
    Object.assign(clients.value.rtm.metrics, metricsUpdate)
    logDebug('RTM metrics güncellendi', metricsUpdate)
  }

  const resetRTM = () => {
    clients.value.rtm = {
      client: null,
      isConnected: false,
      isInitialized: false,
      isChannelJoined: false,
      currentChannelName: null,
      currentUserId: null,
      currentUserName: null,
      connectionState: 'disconnected',
      lastConnectionTime: null,
      metrics: {
        messagesSent: 0,
        messagesReceived: 0,
        messagesFailed: 0,
        connectionAttempts: 0
      }
    }
    logInfo('RTM state sıfırlandı')
  }

  // User Actions - Kullanıcı işlemleri
  const setLocalUser = (type, user) => {
    users.value.local[type] = user
  }

  // Whiteboard User Actions - 🆕 YENİ
  const setLocalWhiteboardUser = (user) => {
    users.value.local.whiteboard = user
  }

  const addWhiteboardUser = (user) => {
    // Whiteboard kullanıcısı ekleme
    if (isWhiteboardUser(user.uid)) {
      user.isWhiteboard = true
      addRemoteUser(user)
    }
  }

  const removeWhiteboardUser = (uid) => {
    if (isWhiteboardUser(uid)) {
      removeRemoteUser(uid)
    }
  }

  // User lookup cache for performance
  const userLookupCache = new Map()
  
  const addRemoteUser = (user) => {
    logInfo('addRemoteUser çağrıldı', {
      uid: user.uid,
      name: user.name,
      isScreenShare: user.isScreenShare,
      isLocal: user.isLocal
    })
    
    // UID'ye göre isScreenShare özelliğini otomatik olarak ayarla
    if (isScreenShareUser(user.uid)) {
      user.isScreenShare = true
      logInfo('UID\'ye göre ekran paylaşımı kullanıcısı olarak işaretlendi', { uid: user.uid })
    }
    
    const existingIndex = users.value.remote.findIndex(u => u.uid === user.uid)
    if (existingIndex >= 0) {
      // Mevcut kullanıcıyı güncelle - Optimized object spread
      const existingUser = users.value.remote[existingIndex]
      Object.assign(existingUser, user)
      
      // Eğer ekran paylaşımı kullanıcısı ise, isScreenShare özelliğini kontrol et
      if (user.isScreenShare) {
        existingUser.isScreenShare = true
        logInfo('Mevcut uzak ekran paylaşımı kullanıcısı güncellendi', { uid: user.uid })
      }
      
      // Update cache
      userLookupCache.set(user.uid, existingIndex)
    } else {
      // Yeni kullanıcı ekle
      users.value.remote.push(user)
      
      // Eğer ekran paylaşımı kullanıcısı ise, log ekle
      if (user.isScreenShare) {
        logInfo('Yeni uzak ekran paylaşımı kullanıcısı eklendi', { uid: user.uid })
      }
      
      // Update cache
      userLookupCache.set(user.uid, users.value.remote.length - 1)
    }
    
    logInfo('Güncel remote users listesi', {
      users: users.value.remote.map(u => ({
        uid: u.uid,
        name: u.name,
        isScreenShare: u.isScreenShare,
        isLocal: u.isLocal
      }))
    })
  }

  const removeRemoteUser = (uid) => {
    // Use cache for faster lookup
    const index = userLookupCache.get(uid) ?? users.value.remote.findIndex(u => u.uid === uid)
    if (index >= 0) {
      users.value.remote.splice(index, 1)
      // Update cache for remaining users
      userLookupCache.delete(uid)
      // Rebuild cache for users after the removed index
      for (let i = index; i < users.value.remote.length; i++) {
        userLookupCache.set(users.value.remote[i].uid, i)
      }
    }
    tracks.value.remote.delete(uid)
  }

  // Track Actions - Track işlemleri
  const setLocalTrack = (type, trackType, track) => {
    tracks.value.local[type][trackType] = track
    
    // Yerel kullanıcı durumunu güncelle
    const localUser = users.value.local[type]
    if (localUser) {
      if (type === 'video') {
        if (trackType === 'video') {
          localUser.hasVideo = !!track
          localUser.isVideoOff = !track || controls.value.isLocalVideoOff
        } else if (trackType === 'audio') {
          localUser.hasAudio = !!track
          localUser.isMuted = !track || controls.value.isLocalAudioMuted
        }
      } else if (type === 'screen') {
        localUser.hasVideo = !!track
      } else if (type === 'whiteboard') {  // 🆕 YENİ
        localUser.hasCanvas = !!track
      }
    }
  }

  // Whiteboard Track Actions - 🆕 YENİ
  const setLocalWhiteboardTrack = (trackType, track) => {
    tracks.value.local.whiteboard[trackType] = track
  }

  const setRemoteTrack = (uid, type, track) => {
    logInfo('setRemoteTrack çağrıldı', {
      uid,
      type,
      hasTrack: !!track,
      trackId: track?.id,
      trackEnabled: track?.enabled,
      trackReadyState: track?.readyState
    })
    
    // Optimized: Single Map operation
    const userTracks = tracks.value.remote.get(uid) || {}
    userTracks[type] = track
    tracks.value.remote.set(uid, userTracks)
    
            // Eğer ekran paylaşımı track'i eklendiyse, kullanıcının isScreenShare özelliğini güncelle
        if (type === 'screen' && track) {
          const remoteUser = users.value.remote.find(u => u.uid === uid)
          if (remoteUser) {
            remoteUser.isScreenShare = true
            remoteUser.hasVideo = true
            logInfo('Uzak ekran paylaşımı kullanıcısı güncellendi', { uid, isScreenShare: true, hasVideo: true })
          } else {
            logInfo('Uzak ekran paylaşımı kullanıcısı bulunamadı, yeni kullanıcı oluşturuluyor', { uid })
            // Eğer kullanıcı yoksa, yeni kullanıcı oluştur
            const newUser = {
              uid: uid,
              name: getRemoteUserDisplayName(uid, 'Ekran Paylaşımı'),
              isLocal: false,
              hasVideo: true,
              isScreenShare: true
            }
            users.value.remote.push(newUser)
            logInfo('Yeni ekran paylaşımı kullanıcısı oluşturuldu', { uid })
          }
        }
        
        // Eğer whiteboard track'i eklendiyse
        if (type === 'whiteboard' && track) {
          const remoteUser = users.value.remote.find(u => u.uid === uid)
          if (remoteUser) {
            remoteUser.isWhiteboard = true
            remoteUser.hasCanvas = true
            logInfo('Uzak whiteboard kullanıcısı güncellendi', { uid, isWhiteboard: true, hasCanvas: true })
          } else {
            logInfo('Uzak whiteboard kullanıcısı bulunamadı, yeni kullanıcı oluşturuluyor', { uid })
            // Eğer kullanıcı yoksa, yeni kullanıcı oluştur
            const newUser = {
              uid: uid,
              name: getRemoteUserDisplayName(uid, 'Whiteboard'),
              isLocal: false,
              hasCanvas: true,
              isWhiteboard: true
            }
            users.value.remote.push(newUser)
            logInfo('Yeni whiteboard kullanıcısı oluşturuldu', { uid })
          }
        }
    
    logInfo('Güncel remote tracks', {
      uid,
      userTracks: Object.keys(userTracks),
      totalRemoteTracks: tracks.value.remote.size
    })
  }

  const setRemoteWhiteboardTrack = (uid, track) => {
    setRemoteTrack(uid, 'whiteboard', track)
  }

  // Yeni eklenen fonksiyon: remote track'i kaldır
  const removeRemoteTrack = (uid, type) => {
    if (tracks.value.remote.has(uid)) {
      const userTracks = tracks.value.remote.get(uid)
      if (userTracks && userTracks[type]) {
        delete userTracks[type]
        
        // Eğer ekran paylaşımı track'i kaldırıldıysa, kullanıcının isScreenShare özelliğini güncelle
        if (type === 'screen') {
          const remoteUser = users.value.remote.find(u => u.uid === uid)
          if (remoteUser) {
            remoteUser.isScreenShare = false
            logInfo('Uzak ekran paylaşımı kullanıcısı güncellendi', { uid, isScreenShare: false })
          }
        }
        
        // Eğer whiteboard track'i kaldırıldıysa
        if (type === 'whiteboard') {
          const remoteUser = users.value.remote.find(u => u.uid === uid)
          if (remoteUser) {
            remoteUser.isWhiteboard = false
            remoteUser.hasCanvas = false
            logInfo('Uzak whiteboard kullanıcısı güncellendi', { uid, isWhiteboard: false, hasCanvas: false })
          }
        }
      }
      // Eğer kullanıcının hiç track'i kalmadıysa, tamamen kaldır
      if (Object.keys(userTracks).length === 0) {
        tracks.value.remote.delete(uid)
      }
    }
  }

  // Control Actions - Kontrol işlemleri
  const setLocalVideoOff = (off) => {
    controls.value.isLocalVideoOff = off
    if (tracks.value.local.video.video) {
      tracks.value.local.video.video.setEnabled(!off)
    }
    if (users.value.local.video) {
      users.value.local.video.isVideoOff = off
    }
  }

  const setLocalAudioMuted = (muted) => {
    controls.value.isLocalAudioMuted = muted
    // Track'i devre dışı bırakma işlemini toggleMicrophone fonksiyonunda yapıyoruz
    // Burada sadece state'i güncelliyoruz
    if (users.value.local.video) {
      users.value.local.video.isMuted = muted
    }
  }

  const setScreenSharing = (sharing) => {
    controls.value.isScreenSharing = sharing
    
    if (sharing && tracks.value.local.screen.video) {
      if (!users.value.local.screen) {
        const screenUID = Math.floor(Math.random() * (USER_ID_RANGES.SCREEN_SHARE.MAX - USER_ID_RANGES.SCREEN_SHARE.MIN)) + USER_ID_RANGES.SCREEN_SHARE.MIN
        users.value.local.screen = {
          uid: screenUID,
          name: getUserDisplayName(screenUID, 'Ekran Paylaşımı'),
          isLocal: true,
          hasVideo: true,
          isScreenShare: true
        }
      } else {
        users.value.local.screen.hasVideo = true
        users.value.local.screen.isScreenShare = true
      }
    } else if (!sharing) {
      users.value.local.screen = null
    }
  }

  // Device Actions - Cihaz işlemleri
  const setDeviceStatus = (deviceType, status) => {
    if (deviceType === 'camera') {
      devices.value.hasCamera = status.hasDevice
      devices.value.cameraPermission = status.permission
      devices.value.cameraTrack = status.track
    } else if (deviceType === 'microphone') {
      devices.value.hasMicrophone = status.hasDevice
      devices.value.microphonePermission = status.permission
      devices.value.microphoneTrack = status.track
    }
  }

  const updateDevicePermissions = async () => {
    try {
      // Kamera izni kontrolü
      const cameraPermission = await navigator.permissions.query({ name: 'camera' })
      devices.value.cameraPermission = cameraPermission.state
      
      // Mikrofon izni kontrolü
      const microphonePermission = await navigator.permissions.query({ name: 'microphone' })
      devices.value.microphonePermission = microphonePermission.state
      
      logInfo('Cihaz izinleri güncellendi', {
        camera: devices.value.cameraPermission,
        microphone: devices.value.microphonePermission
      })
    } catch (error) {
      logError(error, { context: 'updateDevicePermissions' })
    }
  }

  // Reset Actions - Sıfırlama işlemleri
  const resetClient = (type) => {
    clients.value[type] = {
      client: null,
      isConnected: false,
      isInitialized: false
    }
  }

  // Whiteboard Reset Actions - 🆕 YENİ
  const resetWhiteboard = () => {
    clients.value.whiteboard = {
      client: null,
      isConnected: false,
      isInitialized: false,
      isActive: false,
      isPresenter: false,
      dataChannel: null,
      roomId: null
    }
  }

  const resetUsers = (type) => {
    if (type) {
      users.value.local[type] = null
    } else {
      users.value.local = { video: null, screen: null, whiteboard: null }  // 🆕 YENİ
      users.value.remote = []
    }
  }

  // Whiteboard Users Reset - 🆕 YENİ
  const resetWhiteboardUsers = () => {
    users.value.local.whiteboard = null
    // Remote whiteboard users'ları da temizle
    users.value.remote = users.value.remote.filter(u => !isWhiteboardUser(u.uid))
  }

  const resetTracks = (type) => {
    if (type) {
      tracks.value.local[type] = type === 'video' ? { audio: null, video: null } : 
                                  type === 'screen' ? { video: null } : 
                                  { canvas: null, dataChannel: null, drawingData: null, history: [], currentTool: WHITEBOARD_CONFIG.DEFAULTS.TOOL, currentColor: WHITEBOARD_CONFIG.DEFAULTS.PRIMARY_COLOR, currentWidth: WHITEBOARD_CONFIG.WIDTH.DEFAULT }  // 🆕 YENİ
    } else {
      tracks.value.local = {
        video: { audio: null, video: null },
        screen: { video: null },
        whiteboard: {  // 🆕 YENİ
          canvas: null,
          dataChannel: null,
          drawingData: null,
          history: [],
                  currentTool: NETLESS_CONFIG.DEFAULTS.TOOL,
        currentColor: NETLESS_CONFIG.DEFAULTS.STROKE_COLOR,
        currentWidth: NETLESS_CONFIG.DEFAULTS.STROKE_WIDTH
        }
      }
      tracks.value.remote.clear()
    }
  }

  // Whiteboard Tracks Reset - 🆕 YENİ
  const resetWhiteboardTracks = () => {
    tracks.value.local.whiteboard = {
      canvas: null,
      dataChannel: null,
      drawingData: null,
      history: [],
      currentTool: NETLESS_CONFIG.DEFAULTS.TOOL,
      currentColor: NETLESS_CONFIG.DEFAULTS.STROKE_COLOR,
      currentWidth: NETLESS_CONFIG.DEFAULTS.STROKE_WIDTH
    }
    // Remote whiteboard tracks'leri temizle
    for (const [uid, userTracks] of tracks.value.remote) {
      if (userTracks.whiteboard) {
        delete userTracks.whiteboard
      }
    }
  }

  const resetControls = () => {
    controls.value = {
      isLocalVideoOff: false,
      isLocalAudioMuted: false,
      isScreenSharing: false,
      isWhiteboardActive: false,  // 🆕 YENİ
      isWhiteboardPresenting: false  // 🆕 YENİ
    }
  }

  // Whiteboard Controls Reset - 🆕 YENİ
  const resetWhiteboardControls = () => {
    controls.value.isWhiteboardActive = false
    controls.value.isWhiteboardPresenting = false
  }

  // Session Actions - Oturum işlemleri
  const setVideoChannelName = (channelName) => {
    session.value.videoChannelName = channelName
  }

  const setAppId = (appId) => {
    session.value.appId = appId
  }

  // Whiteboard Session Actions - 🆕 YENİ
  const setWhiteboardRoomId = (roomId) => {
    session.value.whiteboardRoomId = roomId
  }

  const setWhiteboardSessionId = (sessionId) => {
    session.value.whiteboardSessionId = sessionId
  }

  const setWhiteboardRoom = (roomData) => {
    session.value.whiteboardRoomId = roomData.uuid
    session.value.whiteboardRoom = roomData
  }

  // 🆕 CHANNEL-BASED WHITEBOARD ROOM METHODS
  const setChannelWhiteboardRoom = (channelName, roomInfo) => {
    // ✅ Mevcut room varsa merge et, yoksa yeni oluştur
    const existingRoom = session.value.channelWhiteboardRooms.get(channelName)
    
    if (existingRoom) {
      // Mevcut room'u güncelle
      const updatedRoom = {
        ...existingRoom,
        ...roomInfo,
        lastUpdated: new Date().toISOString()
      }
      session.value.channelWhiteboardRooms.set(channelName, updatedRoom)
      logInfo('Channel whiteboard room store\'da güncellendi', { 
        channelName, 
        roomUuid: roomInfo.uuid,
        memberCount: updatedRoom.memberCount,
        isActive: updatedRoom.isActive
      })
    } else {
      // Yeni room oluştur
      const newRoom = {
        ...roomInfo,
        createdAt: roomInfo.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
      session.value.channelWhiteboardRooms.set(channelName, newRoom)
      logInfo('Channel whiteboard room store\'a eklendi', { 
        channelName, 
        roomUuid: roomInfo.uuid,
        memberCount: newRoom.memberCount,
        isActive: newRoom.isActive
      })
    }
  }

  const getChannelWhiteboardRoom = (channelName) => {
    return session.value.channelWhiteboardRooms.get(channelName) || null
  }

  const removeChannelWhiteboardRoom = (channelName) => {
    if (session.value.channelWhiteboardRooms.has(channelName)) {
      session.value.channelWhiteboardRooms.delete(channelName)
      logInfo('Channel whiteboard room store\'dan kaldırıldı', { channelName })
    }
  }

  const clearAllChannelWhiteboardRooms = () => {
    session.value.channelWhiteboardRooms.clear()
    logInfo('Tüm channel whiteboard room\'lar store\'dan temizlendi')
  }

  const resetSession = () => {
    session.value = {
      videoChannelName: null,
      appId: null,
      whiteboardRoomId: null,  // 🆕 YENİ
      whiteboardSessionId: null,  // 🆕 YENİ
      whiteboardRoom: null,  // 🆕 YENİ
      // 🆕 CHANNEL-BASED WHITEBOARD ROOM STATE
      channelWhiteboardRooms: new Map() // channelName -> roomInfo mapping
    }
  }

  // Whiteboard Session Reset - 🆕 YENİ
  const resetWhiteboardSession = () => {
    session.value.whiteboardRoomId = null
    session.value.whiteboardSessionId = null
  }

  const resetDevices = () => {
    devices.value = {
      hasCamera: false,
      hasMicrophone: false,
      cameraPermission: 'unknown',
      microphonePermission: 'unknown',
      cameraTrack: null,
      microphoneTrack: null
    }
  }

  const reset = () => {
    resetClient('video')
    resetClient('screen')
    resetWhiteboard()        // 🆕 YENİ
    resetUsers()
    resetWhiteboardUsers()   // 🆕 YENİ
    resetTracks()
    resetWhiteboardTracks()  // 🆕 YENİ
    resetControls()
    resetWhiteboardControls() // 🆕 YENİ
    resetSession()
    resetWhiteboardSession() // 🆕 YENİ
    resetDevices()
  }



  return {
    // Unified State - Birleştirilmiş durum
    clients,
    users,
    tracks,
    controls,
    session,
    devices,

    // Computed - Hesaplanmış değerler
    allUsers,
    connectedUsersCount,
    hasLocalVideo,
    hasLocalAudio,
    hasLocalScreenShare,
    hasLocalWhiteboard,        // 🆕 YENİ
    videoChannelName,
    appId,
    whiteboardRoomId,          // 🆕 YENİ
    whiteboardRoom,            // 🆕 YENİ
    canUseCamera,
    canUseMicrophone,
    isLocalVideoOff,
    isLocalAudioMuted,
    isScreenSharing,
    isWhiteboardActive,        // 🆕 YENİ
    isWhiteboardPresenting,    // 🆕 YENİ

    // Unified Actions - Birleştirilmiş işlemler
    setClient,
    setClientConnected,
    setClientInitialized,
    setWhiteboardClient,       // 🆕 YENİ
    setWhiteboardConnected,    // 🆕 YENİ
    setWhiteboardInitialized,  // 🆕 YENİ
    setWhiteboardActive,       // 🆕 YENİ
    setWhiteboardPresenter,    // 🆕 YENİ
    setLocalUser,
    setLocalWhiteboardUser,    // 🆕 YENİ
    addRemoteUser,
    addWhiteboardUser,         // 🆕 YENİ
    removeRemoteUser,
    removeWhiteboardUser,      // 🆕 YENİ
    setLocalTrack,
    setLocalWhiteboardTrack,   // 🆕 YENİ
    setRemoteTrack,
    setRemoteWhiteboardTrack,  // 🆕 YENİ
    removeRemoteTrack,
    setLocalVideoOff,
    setLocalAudioMuted,
    setScreenSharing,
    setDeviceStatus,
    updateDevicePermissions,
    setVideoChannelName,
    setAppId,
    setWhiteboardRoomId,       // 🆕 YENİ
    setWhiteboardSessionId,    // 🆕 YENİ
    setWhiteboardRoom,         // 🆕 YENİ
    // 🆕 CHANNEL-BASED WHITEBOARD ROOM METHODS
    setChannelWhiteboardRoom,  // 🆕 YENİ
    getChannelWhiteboardRoom,  // 🆕 YENİ
    removeChannelWhiteboardRoom, // 🆕 YENİ
    clearAllChannelWhiteboardRooms, // 🆕 YENİ
    
    // RTM Actions - 🚀 YENİ
    setRTMClient,
    setRTMConnected,
    setRTMChannelJoined,
    setRTMUserInfo,
    setRTMChannelName,
    setRTMConnectionState,
    updateRTMMetrics,
    resetRTM,
    
    resetClient,
    resetWhiteboard,           // 🆕 YENİ
    resetUsers,
    resetWhiteboardUsers,      // 🆕 YENİ
    resetTracks,
    resetWhiteboardTracks,     // 🆕 YENİ
    resetControls,
    resetWhiteboardControls,   // 🆕 YENİ
    resetSession,
    resetWhiteboardSession,    // 🆕 YENİ
    resetDevices,
    reset,

    // Helper
    isLocalUID,
    isLocalVideoUID,
    isLocalScreenUID,
    isLocalWhiteboardUID,      // 🆕 YENİ
    isWhiteboardUser           // 🆕 YENİ
  }
}) 