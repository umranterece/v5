import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Agora Store - Video ve Screen Share client'larını yönetir
 * @module store/agora
 */
export const useAgoraStore = defineStore('agora', () => {
  // Video Client State
  const videoClient = ref(null)
  const videoLocalUser = ref(null)
  const videoRemoteUsers = ref([])
  const videoLocalTracks = ref({ audio: null, video: null })
  const videoRemoteTracks = ref(new Map())
  const isVideoConnected = ref(false)
  const isVideoInitialized = ref(false)
  const isLocalVideoOff = ref(false)
  const isLocalAudioMuted = ref(false)

  // Screen Share Client State
  const screenClient = ref(null)
  const screenLocalUser = ref(null)
  const screenRemoteUsers = ref([])
  const screenLocalTracks = ref({ video: null })
  const screenRemoteTracks = ref(new Map())
  const isScreenConnected = ref(false)
  const isScreenInitialized = ref(false)
  const isScreenSharing = ref(false)

  // Computed Properties
  const allVideoUsers = computed(() => {
    const users = [...videoRemoteUsers.value]
    if (videoLocalUser.value) {
      users.unshift(videoLocalUser.value)
    }
    return users
  })

  const allScreenUsers = computed(() => {
    const users = [...screenRemoteUsers.value]
    if (screenLocalUser.value) {
      users.unshift(screenLocalUser.value)
    }
    return users
  })

  const allUsers = computed(() => {
    return [...allVideoUsers.value, ...allScreenUsers.value]
  })

  const connectedUsersCount = computed(() => allUsers.value.length)

  const hasLocalVideo = computed(() => 
    videoLocalTracks.value.video && !isLocalVideoOff.value
  )

  const hasLocalAudio = computed(() => 
    videoLocalTracks.value.audio && !isLocalAudioMuted.value
  )

  const hasLocalScreenShare = computed(() => 
    screenLocalTracks.value.video && isScreenSharing.value
  )

  // Helper functions to check if UID belongs to local user
  const isLocalVideoUID = (uid) => {
    return videoLocalUser.value && videoLocalUser.value.uid === uid
  }

  const isLocalScreenUID = (uid) => {
    return screenLocalUser.value && screenLocalUser.value.uid === uid
  }

  const isLocalUID = (uid) => {
    return isLocalVideoUID(uid) || isLocalScreenUID(uid)
  }

  // Video Actions
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
      videoRemoteUsers.value[existingIndex] = { ...videoRemoteUsers.value[existingIndex], ...user }
    } else {
      videoRemoteUsers.value.push(user)
    }
  }

  const removeVideoRemoteUser = (uid) => {
    const index = videoRemoteUsers.value.findIndex(u => u.uid === uid)
    if (index >= 0) {
      videoRemoteUsers.value.splice(index, 1)
    }
    videoRemoteTracks.value.delete(uid)
  }

  const setVideoLocalTrack = (type, track) => {
    videoLocalTracks.value[type] = track
    
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
      videoRemoteTracks.value.set(uid, {})
    }
    videoRemoteTracks.value.get(uid)[type] = track
  }

  const setLocalVideoOff = (off) => {
    isLocalVideoOff.value = off
    if (videoLocalTracks.value.video) {
      videoLocalTracks.value.video.setEnabled(!off)
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

  // Screen Share Actions
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
      screenRemoteUsers.value[existingIndex] = { ...screenRemoteUsers.value[existingIndex], ...user }
    } else {
      screenRemoteUsers.value.push(user)
    }
  }

  const removeScreenRemoteUser = (uid) => {
    const index = screenRemoteUsers.value.findIndex(u => u.uid === uid)
    if (index >= 0) {
      screenRemoteUsers.value.splice(index, 1)
    }
    screenRemoteTracks.value.delete(uid)
  }

  const setScreenLocalTrack = (track) => {
    screenLocalTracks.value.video = track
    
    if (track) {
      // Track varsa screen share kullanıcısını oluştur veya güncelle
      if (!screenLocalUser.value) {
        const screenUID = Math.floor(Math.random() * (3000 - 2000)) + 2000 // Screen UID range
        screenLocalUser.value = {
          uid: screenUID,
          name: `Screen Share ${screenUID}`,
          isLocal: true,
          hasVideo: true,
          isScreenShare: true
        }
      } else {
        screenLocalUser.value.hasVideo = true
        screenLocalUser.value.isScreenShare = true
      }
    } else {
      // Track yoksa screen share kullanıcısını kaldır
      screenLocalUser.value = null
    }
  }

  const setScreenRemoteTrack = (uid, track) => {
    screenRemoteTracks.value.set(uid, { video: track })
  }

  const setScreenSharing = (sharing) => {
    isScreenSharing.value = sharing
    
    // Screen sharing başladığında local screen share kullanıcısını ekle
    if (sharing && screenLocalTracks.value.video) {
      // Eğer screen local user yoksa oluştur
      if (!screenLocalUser.value) {
        const screenUID = Math.floor(Math.random() * (3000 - 2000)) + 2000 // Screen UID range
        screenLocalUser.value = {
          uid: screenUID,
          name: `Screen Share ${screenUID}`,
          isLocal: true,
          hasVideo: true,
          isScreenShare: true
        }
      } else {
        // Mevcut kullanıcıyı güncelle
        screenLocalUser.value.hasVideo = true
        screenLocalUser.value.isScreenShare = true
      }
    } else if (!sharing) {
      // Screen sharing durduğunda local screen share kullanıcısını kaldır
      screenLocalUser.value = null
    }
  }

  // Reset Actions
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
    resetVideo()
    resetScreen()
  }

  return {
    // Video State
    videoClient,
    videoLocalUser,
    videoRemoteUsers,
    videoLocalTracks,
    videoRemoteTracks,
    isVideoConnected,
    isVideoInitialized,
    isLocalVideoOff,
    isLocalAudioMuted,

    // Screen State
    screenClient,
    screenLocalUser,
    screenRemoteUsers,
    screenLocalTracks,
    screenRemoteTracks,
    isScreenConnected,
    isScreenInitialized,
    isScreenSharing,

    // Computed
    allVideoUsers,
    allScreenUsers,
    allUsers,
    connectedUsersCount,
    hasLocalVideo,
    hasLocalAudio,
    hasLocalScreenShare,

    // Video Actions
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

    // Screen Actions
    setScreenClient,
    setScreenConnected,
    setScreenInitialized,
    setScreenLocalUser,
    addScreenRemoteUser,
    removeScreenRemoteUser,
    setScreenLocalTrack,
    setScreenRemoteTrack,
    setScreenSharing,

    // Reset Actions
    resetVideo,
    resetScreen,
    reset,

    // Helper Functions
    isLocalVideoUID,
    isLocalScreenUID,
    isLocalUID
  }
}) 