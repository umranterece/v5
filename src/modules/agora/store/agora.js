import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserDisplayName, getRemoteUserDisplayName, isVideoUser, isScreenShareUser } from '../constants.js'

/**
 * Agora Store - Video ve Ekran Paylaşımı client'larını yönetir
 * Bu store, Agora video konferans uygulamasının tüm state'ini yönetir.
 * Video client, ekran paylaşımı client, kullanıcılar ve track'ler için merkezi state yönetimi sağlar.
 * @module store/agora
 */
export const useAgoraStore = defineStore('agora', () => {
  // Logger fonksiyonları - Varsayılan boş fonksiyonlar
  const logStore = () => {}
  const logError = () => {}
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
    }
  })

  // Unified User State - Birleştirilmiş kullanıcı durumu
  const users = ref({
    local: {
      video: null,
      screen: null
    },
    remote: [] // Tüm uzak kullanıcılar tek listede
  })

  // Unified Track State - Birleştirilmiş track durumu
  const tracks = ref({
    local: {
      video: { audio: null, video: null },
      screen: { video: null }
    },
    remote: new Map() // UID -> { audio, video, screen }
  })

  // Unified Control State - Birleştirilmiş kontrol durumu
  const controls = ref({
    isLocalVideoOff: false,
    isLocalAudioMuted: false,
    isScreenSharing: false
  })

  // Session State - Oturum durumu
  const session = ref({
    videoChannelName: null,
    appId: null
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

  const videoChannelName = computed(() => session.value.videoChannelName)
  const appId = computed(() => session.value.appId)

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

  // Helper functions
  const isLocalUID = (uid) => {
    return (users.value.local.video && users.value.local.video.uid === uid) ||
           (users.value.local.screen && users.value.local.screen.uid === uid)
  }

  const isLocalVideoUID = (uid) => {
    return users.value.local.video && users.value.local.video.uid === uid
  }

  const isLocalScreenUID = (uid) => {
    return users.value.local.screen && users.value.local.screen.uid === uid
  }

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

  // User Actions - Kullanıcı işlemleri
  const setLocalUser = (type, user) => {
    users.value.local[type] = user
  }

  // User lookup cache for performance
  const userLookupCache = new Map()
  
  const addRemoteUser = (user) => {
    console.log('🟢 [STORE] addRemoteUser çağrıldı:', {
      uid: user.uid,
      name: user.name,
      isScreenShare: user.isScreenShare,
      isLocal: user.isLocal
    })
    
    // UID'ye göre isScreenShare özelliğini otomatik olarak ayarla
    if (isScreenShareUser(user.uid)) {
      user.isScreenShare = true
      console.log('🟢 [STORE] UID\'ye göre ekran paylaşımı kullanıcısı olarak işaretlendi:', user.uid)
    }
    
    const existingIndex = users.value.remote.findIndex(u => u.uid === user.uid)
    if (existingIndex >= 0) {
      // Mevcut kullanıcıyı güncelle - Optimized object spread
      const existingUser = users.value.remote[existingIndex]
      Object.assign(existingUser, user)
      
      // Eğer ekran paylaşımı kullanıcısı ise, isScreenShare özelliğini kontrol et
      if (user.isScreenShare) {
        existingUser.isScreenShare = true
        console.log('🟢 [STORE] Mevcut uzak ekran paylaşımı kullanıcısı güncellendi:', user.uid)
      }
      
      // Update cache
      userLookupCache.set(user.uid, existingIndex)
    } else {
      // Yeni kullanıcı ekle
      users.value.remote.push(user)
      
      // Eğer ekran paylaşımı kullanıcısı ise, log ekle
      if (user.isScreenShare) {
        console.log('🟢 [STORE] Yeni uzak ekran paylaşımı kullanıcısı eklendi:', user.uid)
      }
      
      // Update cache
      userLookupCache.set(user.uid, users.value.remote.length - 1)
    }
    
    console.log('🟢 [STORE] Güncel remote users listesi:', users.value.remote.map(u => ({
      uid: u.uid,
      name: u.name,
      isScreenShare: u.isScreenShare,
      isLocal: u.isLocal
    })))
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
      }
    }
  }

  const setRemoteTrack = (uid, type, track) => {
    console.log('🟢 [STORE] setRemoteTrack çağrıldı:', {
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
        console.log('🟢 [STORE] Uzak ekran paylaşımı kullanıcısı güncellendi:', uid, {
          isScreenShare: true,
          hasVideo: true
        })
      } else {
        console.log('🟡 [STORE] Uzak ekran paylaşımı kullanıcısı bulunamadı, yeni kullanıcı oluşturuluyor:', uid)
        // Eğer kullanıcı yoksa, yeni kullanıcı oluştur
        const newUser = {
          uid: uid,
          name: `Ekran Paylaşımı ${uid}`,
          isLocal: false,
          hasVideo: true,
          isScreenShare: true
        }
        users.value.remote.push(newUser)
        console.log('🟢 [STORE] Yeni ekran paylaşımı kullanıcısı oluşturuldu:', uid)
      }
    }
    
    console.log('🟢 [STORE] Güncel remote tracks:', {
      uid,
      userTracks: Object.keys(userTracks),
      totalRemoteTracks: tracks.value.remote.size
    })
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
            console.log('🟢 [STORE] Uzak ekran paylaşımı kullanıcısı güncellendi:', uid, {
              isScreenShare: false
            })
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
        const screenUID = Math.floor(Math.random() * (3000 - 2000)) + 2000
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
      
      logStore('Cihaz izinleri güncellendi', {
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

  const resetUsers = (type) => {
    if (type) {
      users.value.local[type] = null
    } else {
      users.value.local = { video: null, screen: null }
      users.value.remote = []
    }
  }

  const resetTracks = (type) => {
    if (type) {
      tracks.value.local[type] = type === 'video' ? { audio: null, video: null } : { video: null }
    } else {
      tracks.value.local = {
        video: { audio: null, video: null },
        screen: { video: null }
      }
      tracks.value.remote.clear()
    }
  }

  const resetControls = () => {
    controls.value = {
      isLocalVideoOff: false,
      isLocalAudioMuted: false,
      isScreenSharing: false
    }
  }

  // Session Actions - Oturum işlemleri
  const setVideoChannelName = (channelName) => {
    session.value.videoChannelName = channelName
  }

  const setAppId = (appId) => {
    session.value.appId = appId
  }

  const resetSession = () => {
    session.value = {
      videoChannelName: null,
      appId: null
    }
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
    resetUsers()
    resetTracks()
    resetControls()
    resetSession()
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
    videoChannelName,
    appId,
    canUseCamera,
    canUseMicrophone,
    isLocalVideoOff,
    isLocalAudioMuted,
    isScreenSharing,

    // Unified Actions - Birleştirilmiş işlemler
    setClient,
    setClientConnected,
    setClientInitialized,
    setLocalUser,
    addRemoteUser,
    removeRemoteUser,
    setLocalTrack,
    setRemoteTrack,
    removeRemoteTrack,
    setLocalVideoOff,
    setLocalAudioMuted,
    setScreenSharing,
    setDeviceStatus,
    updateDevicePermissions,
    setVideoChannelName,
    setAppId,
    resetClient,
    resetUsers,
    resetTracks,
    resetControls,
    resetSession,
    resetDevices,
    reset,

    // Helper
    isLocalUID,
    isLocalVideoUID,
    isLocalScreenUID
  }
}) 