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
  // Video Client State - Video client durumu
  const videoClient = ref(null) // Agora video client referansı
  const videoLocalUser = ref(null) // Yerel video kullanıcısı
  const videoRemoteUsers = ref([]) // Uzak video kullanıcıları listesi
  const videoLocalTracks = ref({ audio: null, video: null }) // Yerel video track'leri
  const videoRemoteTracks = ref(new Map()) // Uzak video track'leri
  const isVideoConnected = ref(false) // Video bağlantı durumu
  const isVideoInitialized = ref(false) // Video client başlatma durumu
  const isLocalVideoOff = ref(false) // Yerel video kapalı mı?
  const isLocalAudioMuted = ref(false) // Yerel ses kapalı mı?

  // Screen Share Client State - Ekran paylaşımı client durumu
  const screenClient = ref(null) // Agora ekran paylaşımı client referansı
  const screenLocalUser = ref(null) // Yerel ekran paylaşımı kullanıcısı
  const screenRemoteUsers = ref([]) // Uzak ekran paylaşımı kullanıcıları
  const screenLocalTracks = ref({ video: null }) // Yerel ekran paylaşımı track'leri
  const screenRemoteTracks = ref(new Map()) // Uzak ekran paylaşımı track'leri
  const isScreenConnected = ref(false) // Ekran paylaşımı bağlantı durumu
  const isScreenInitialized = ref(false) // Ekran paylaşımı client başlatma durumu
  const isScreenSharing = ref(false) // Ekran paylaşımı aktif mi?

  // Computed Properties - Hesaplanmış özellikler
  const allVideoUsers = computed(() => {
    const users = [...videoRemoteUsers.value]
    if (videoLocalUser.value) {
      users.unshift(videoLocalUser.value) // Yerel kullanıcıyı başa ekle
    }
    return users
  })

  const allScreenUsers = computed(() => {
    const users = [...screenRemoteUsers.value]
    if (screenLocalUser.value) {
      users.unshift(screenLocalUser.value) // Yerel ekran kullanıcısını başa ekle
    }
    return users
  })

  const allUsers = computed(() => {
    return [...allVideoUsers.value, ...allScreenUsers.value] // Tüm kullanıcıları birleştir
  })

  const connectedUsersCount = computed(() => allUsers.value.length) // Bağlı kullanıcı sayısı

  const hasLocalVideo = computed(() => 
    videoLocalTracks.value.video && !isLocalVideoOff.value // Yerel video var mı?
  )

  const hasLocalAudio = computed(() => 
    videoLocalTracks.value.audio && !isLocalAudioMuted.value // Yerel ses var mı?
  )

  const hasLocalScreenShare = computed(() => 
    screenLocalTracks.value.video && isScreenSharing.value // Yerel ekran paylaşımı var mı?
  )

  // Helper functions to check if UID belongs to local user - UID'nin yerel kullanıcıya ait olup olmadığını kontrol eder
  const isLocalVideoUID = (uid) => {
    return videoLocalUser.value && videoLocalUser.value.uid === uid
  }

  const isLocalScreenUID = (uid) => {
    return screenLocalUser.value && screenLocalUser.value.uid === uid
  }

  const isLocalUID = (uid) => {
    return isLocalVideoUID(uid) || isLocalScreenUID(uid) // Video veya ekran paylaşımı yerel UID'si mi?
  }

  // Video Actions - Video işlemleri
  const setVideoClient = (client) => {
    videoClient.value = client
  }

  const setVideoConnected = (connected) => {
    isVideoConnected.value = connected
  }

  const setVideoInitialized = (initialized) => {
    isVideoInitialized.value = initialized
  }

  const setVideoLocalUser = (user) => {
    videoLocalUser.value = user
  }

  const addVideoRemoteUser = (user) => {
    const existingIndex = videoRemoteUsers.value.findIndex(u => u.uid === user.uid)
    if (existingIndex >= 0) {
      // Mevcut kullanıcıyı güncelle
      videoRemoteUsers.value[existingIndex] = { ...videoRemoteUsers.value[existingIndex], ...user }
    } else {
      // Yeni kullanıcı ekle
      videoRemoteUsers.value.push(user)
    }
  }

  const removeVideoRemoteUser = (uid) => {
    const index = videoRemoteUsers.value.findIndex(u => u.uid === uid)
    if (index >= 0) {
      videoRemoteUsers.value.splice(index, 1) // Kullanıcıyı listeden çıkar
    }
    videoRemoteTracks.value.delete(uid) // Track'leri de temizle
  }

  const setVideoLocalTrack = (type, track) => {
    videoLocalTracks.value[type] = track
    
    // Yerel kullanıcı durumunu güncelle
    if (videoLocalUser.value) {
      if (type === 'video') {
        videoLocalUser.value.hasVideo = !!track
        videoLocalUser.value.isVideoOff = !track || isLocalVideoOff.value
      } else if (type === 'audio') {
        videoLocalUser.value.hasAudio = !!track
        videoLocalUser.value.isMuted = !track || isLocalAudioMuted.value
      }
    }
  }

  const setVideoRemoteTrack = (uid, type, track) => {
    if (!videoRemoteTracks.value.has(uid)) {
      videoRemoteTracks.value.set(uid, {}) // Kullanıcı için track objesi oluştur
    }
    videoRemoteTracks.value.get(uid)[type] = track
  }

  const setLocalVideoOff = (off) => {
    isLocalVideoOff.value = off
    if (videoLocalTracks.value.video) {
      videoLocalTracks.value.video.setEnabled(!off) // Track'i etkinleştir/devre dışı bırak
    }
    if (videoLocalUser.value) {
      videoLocalUser.value.isVideoOff = off
    }
  }

  const setLocalAudioMuted = (muted) => {
    isLocalAudioMuted.value = muted
    if (videoLocalUser.value) {
      videoLocalUser.value.isMuted = muted
    }
  }

  // Screen Share Actions - Ekran paylaşımı işlemleri
  const setScreenClient = (client) => {
    screenClient.value = client
  }

  const setScreenConnected = (connected) => {
    isScreenConnected.value = connected
  }

  const setScreenInitialized = (initialized) => {
    isScreenInitialized.value = initialized
  }

  const setScreenLocalUser = (user) => {
    screenLocalUser.value = user
  }

  const addScreenRemoteUser = (user) => {
    const existingIndex = screenRemoteUsers.value.findIndex(u => u.uid === user.uid)
    if (existingIndex >= 0) {
      // Mevcut kullanıcıyı güncelle
      screenRemoteUsers.value[existingIndex] = { ...screenRemoteUsers.value[existingIndex], ...user }
    } else {
      // Yeni kullanıcı ekle
      screenRemoteUsers.value.push(user)
    }
  }

  const removeScreenRemoteUser = (uid) => {
    const index = screenRemoteUsers.value.findIndex(u => u.uid === uid)
    if (index >= 0) {
      screenRemoteUsers.value.splice(index, 1) // Kullanıcıyı listeden çıkar
    }
    screenRemoteTracks.value.delete(uid) // Track'leri de temizle
  }

  const setScreenLocalTrack = (track) => {
    console.log('=== SET SCREEN LOCAL TRACK ===')
    console.log('Track:', track)
    console.log('Track valid:', track && typeof track.setEnabled === 'function')
    
    screenLocalTracks.value.video = track
    
    if (track && typeof track.setEnabled === 'function') {
      // Sadece geçerli track varsa ekran paylaşımı kullanıcısını oluştur
      if (!screenLocalUser.value) {
        const screenUID = Math.floor(Math.random() * (3000 - 2000)) + 2000 // Ekran UID aralığı
        const screenUser = {
          uid: screenUID,
          name: getUserDisplayName(screenUID, 'Ekran Paylaşımı'),
          isLocal: true,
          hasVideo: true,
          isScreenShare: true
        }
        screenLocalUser.value = screenUser
        console.log('Screen local user created (valid track):', screenUser)
      } else {
        screenLocalUser.value.hasVideo = true
        screenLocalUser.value.isScreenShare = true
        console.log('Screen local user updated (valid track):', screenLocalUser.value)
      }
    } else {
      // Track yoksa veya geçersizse ekran paylaşımı kullanıcısını kaldır
      console.log('Removing screen local user (no valid track)')
      screenLocalUser.value = null
    }
  }

  const setScreenRemoteTrack = (uid, track) => {
    screenRemoteTracks.value.set(uid, { video: track })
  }

  const setScreenSharing = (sharing) => {
    console.log('=== SET SCREEN SHARING ===')
    console.log('Sharing:', sharing)
    console.log('Has valid track:', screenLocalTracks.value.video && typeof screenLocalTracks.value.video.setEnabled === 'function')
    
    isScreenSharing.value = sharing
    
    // Ekran paylaşımı başladığında yerel ekran paylaşımı kullanıcısını ekle
    if (sharing && screenLocalTracks.value.video && typeof screenLocalTracks.value.video.setEnabled === 'function') {
      // Eğer ekran yerel kullanıcı yoksa oluştur
      if (!screenLocalUser.value) {
        const screenUID = Math.floor(Math.random() * (3000 - 2000)) + 2000 // Ekran UID aralığı
        screenLocalUser.value = {
          uid: screenUID,
          name: getUserDisplayName(screenUID, 'Ekran Paylaşımı'),
          isLocal: true,
          hasVideo: true,
          isScreenShare: true
        }
        console.log('Screen local user created in setScreenSharing:', screenLocalUser.value)
      } else {
        // Mevcut kullanıcıyı güncelle
        screenLocalUser.value.hasVideo = true
        screenLocalUser.value.isScreenShare = true
        console.log('Screen local user updated in setScreenSharing:', screenLocalUser.value)
      }
    } else if (!sharing) {
      // Ekran paylaşımı durduğunda yerel ekran paylaşımı kullanıcısını kaldır
      console.log('Removing screen local user (sharing stopped)')
      screenLocalUser.value = null
    } else {
      console.log('Not creating screen user - no valid track or sharing not active')
    }
  }

  // Reset Actions - Sıfırlama işlemleri
  const resetVideo = () => {
    videoClient.value = null
    videoLocalUser.value = null
    videoRemoteUsers.value = []
    videoLocalTracks.value = { audio: null, video: null }
    videoRemoteTracks.value.clear()
    isVideoConnected.value = false
    isVideoInitialized.value = false
    isLocalVideoOff.value = false
    isLocalAudioMuted.value = false
  }

  const resetScreen = () => {
    screenClient.value = null
    screenLocalUser.value = null
    screenRemoteUsers.value = []
    screenLocalTracks.value = { video: null }
    screenRemoteTracks.value.clear()
    isScreenConnected.value = false
    isScreenInitialized.value = false
    isScreenSharing.value = false
  }

  const reset = () => {
    resetVideo() // Video durumunu sıfırla
    resetScreen() // Ekran paylaşımı durumunu sıfırla
  }

  return {
    // Video State - Video durumu
    videoClient,
    videoLocalUser,
    videoRemoteUsers,
    videoLocalTracks,
    videoRemoteTracks,
    isVideoConnected,
    isVideoInitialized,
    isLocalVideoOff,
    isLocalAudioMuted,

    // Screen State - Ekran paylaşımı durumu
    screenClient,
    screenLocalUser,
    screenRemoteUsers,
    screenLocalTracks,
    screenRemoteTracks,
    isScreenConnected,
    isScreenInitialized,
    isScreenSharing,

    // Computed - Hesaplanmış değerler
    allVideoUsers,
    allScreenUsers,
    allUsers,
    connectedUsersCount,
    hasLocalVideo,
    hasLocalAudio,
    hasLocalScreenShare,

    // Video Actions - Video işlemleri
    setVideoClient,
    setVideoConnected,
    setVideoInitialized,
    setVideoLocalUser,
    addVideoRemoteUser,
    removeVideoRemoteUser,
    setVideoLocalTrack,
    setVideoRemoteTrack,
    setLocalVideoOff,
    setLocalAudioMuted,

    // Screen Actions - Ekran paylaşımı işlemleri
    setScreenClient,
    setScreenConnected,
    setScreenInitialized,
    setScreenLocalUser,
    addScreenRemoteUser,
    removeScreenRemoteUser,
    setScreenLocalTrack,
    setScreenRemoteTrack,
    setScreenSharing,

    // Reset Actions - Sıfırlama işlemleri
    resetVideo,
    resetScreen,
    reset,

    // Helper Functions - Yardımcı fonksiyonlar
    isLocalVideoUID,
    isLocalScreenUID,
    isLocalUID
  }
}) 