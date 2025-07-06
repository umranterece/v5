import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Video/Audio State Store
 * @module store/video
 */
export const useVideoStore = defineStore('video', () => {
  // State
  const isConnected = ref(false)
  const isInitialized = ref(false)
  const localUser = ref(null)
  const remoteUsers = ref([])
  const localTracks = ref({
    audio: null,
    video: null
  })
  const remoteTracks = ref(new Map())
  const isLocalAudioMuted = ref(false)
  const isLocalVideoOff = ref(false)

  // Getters
  const allUsers = computed(() => {
    const users = [...remoteUsers.value]
    if (localUser.value) {
      users.unshift(localUser.value)
    }
    return users
  })

  const connectedUsersCount = computed(() => allUsers.value.length)

  const hasLocalVideo = computed(() => 
    localTracks.value.video && !isLocalVideoOff.value
  )

  const hasLocalAudio = computed(() => 
    localTracks.value.audio && !isLocalAudioMuted.value
  )

  // Actions
  const setConnected = (connected) => {
    isConnected.value = connected
  }

  const setInitialized = (initialized) => {
    isInitialized.value = initialized
  }

  const setLocalUser = (user) => {
    localUser.value = user
  }

  const addRemoteUser = (user) => {
    const existingIndex = remoteUsers.value.findIndex(u => u.uid === user.uid)
    if (existingIndex >= 0) {
      remoteUsers.value[existingIndex] = { ...remoteUsers.value[existingIndex], ...user }
    } else {
      remoteUsers.value.push(user)
    }
  }

  const removeRemoteUser = (uid) => {
    const index = remoteUsers.value.findIndex(u => u.uid === uid)
    if (index >= 0) {
      remoteUsers.value.splice(index, 1)
    }
    remoteTracks.value.delete(uid)
  }

  const updateUser = (uid, updates) => {
    if (localUser.value && localUser.value.uid === uid) {
      localUser.value = { ...localUser.value, ...updates }
    } else {
      const index = remoteUsers.value.findIndex(u => u.uid === uid)
      if (index >= 0) {
        remoteUsers.value[index] = { ...remoteUsers.value[index], ...updates }
      }
    }
  }

  const setLocalTrack = (type, track) => {
    localTracks.value[type] = track
    
    // Update local user status
    if (localUser.value) {
      if (type === 'video') {
        localUser.value.hasVideo = !!track
        localUser.value.isVideoOff = !track || isLocalVideoOff.value
      } else if (type === 'audio') {
        localUser.value.hasAudio = !!track
        localUser.value.isMuted = !track || isLocalAudioMuted.value
      }
    }
  }

  const setRemoteTrack = (uid, type, track) => {
    if (!remoteTracks.value.has(uid)) {
      remoteTracks.value.set(uid, {})
    }
    remoteTracks.value.get(uid)[type] = track
  }

  const removeRemoteTrack = (uid, type) => {
    if (remoteTracks.value.has(uid)) {
      const userTracks = remoteTracks.value.get(uid)
      if (userTracks[type]) {
        userTracks[type].stop()
        userTracks[type].close()
        delete userTracks[type]
      }
    }
  }

  const setLocalAudioMuted = (muted) => {
    isLocalAudioMuted.value = muted
    // Track'i değiştirme - toggleMicrophone fonksiyonu bunu yapıyor
    if (localUser.value) {
      localUser.value.isMuted = muted
    }
  }

  const setLocalVideoOff = (off) => {
    isLocalVideoOff.value = off
    if (localTracks.value.video) {
      localTracks.value.video.setEnabled(!off)
    }
    if (localUser.value) {
      localUser.value.isVideoOff = off
    }
  }

  const reset = () => {
    isConnected.value = false
    isInitialized.value = false
    localUser.value = null
    remoteUsers.value = []
    localTracks.value = { audio: null, video: null }
    remoteTracks.value.clear()
    isLocalAudioMuted.value = false
    isLocalVideoOff.value = false
  }

  return {
    // State
    isConnected,
    isInitialized,
    localUser,
    remoteUsers,
    localTracks,
    remoteTracks,
    isLocalAudioMuted,
    isLocalVideoOff,
    
    // Getters
    allUsers,
    connectedUsersCount,
    hasLocalVideo,
    hasLocalAudio,
    
    // Actions
    setConnected,
    setInitialized,
    setLocalUser,
    addRemoteUser,
    removeRemoteUser,
    updateUser,
    setLocalTrack,
    setRemoteTrack,
    removeRemoteTrack,
    setLocalAudioMuted,
    setLocalVideoOff,
    reset
  }
}) 