import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Video/Ses State Store - Video ve ses durumu yönetimi
 * Bu store, video konferans uygulamasının temel video ve ses state'ini yönetir.
 * Yerel ve uzak kullanıcılar, track'ler ve bağlantı durumları için state yönetimi sağlar.
 * @module store/video
 */
export const useVideoStore = defineStore('video', () => {
  // State - Durum değişkenleri
  const isConnected = ref(false) // Bağlantı durumu
  const isInitialized = ref(false) // Başlatma durumu
  const localUser = ref(null) // Yerel kullanıcı
  const remoteUsers = ref([]) // Uzak kullanıcılar listesi
  const localTracks = ref({
    audio: null, // Yerel ses track'i
    video: null  // Yerel video track'i
  })
  const remoteTracks = ref(new Map()) // Uzak kullanıcıların track'leri
  const isLocalAudioMuted = ref(false) // Yerel ses kapalı mı?
  const isLocalVideoOff = ref(false) // Yerel video kapalı mı?

  // Getters - Hesaplanmış değerler
  const allUsers = computed(() => {
    const users = [...remoteUsers.value]
    if (localUser.value) {
      users.unshift(localUser.value) // Yerel kullanıcıyı başa ekle
    }
    return users
  })

  const connectedUsersCount = computed(() => allUsers.value.length) // Bağlı kullanıcı sayısı

  const hasLocalVideo = computed(() => 
    localTracks.value.video && !isLocalVideoOff.value // Yerel video var mı?
  )

  const hasLocalAudio = computed(() => 
    localTracks.value.audio && !isLocalAudioMuted.value // Yerel ses var mı?
  )

  // Actions - İşlemler
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
      // Mevcut kullanıcıyı güncelle
      remoteUsers.value[existingIndex] = { ...remoteUsers.value[existingIndex], ...user }
    } else {
      // Yeni kullanıcı ekle
      remoteUsers.value.push(user)
    }
  }

  const removeRemoteUser = (uid) => {
    const index = remoteUsers.value.findIndex(u => u.uid === uid)
    if (index >= 0) {
      remoteUsers.value.splice(index, 1) // Kullanıcıyı listeden çıkar
    }
    remoteTracks.value.delete(uid) // Track'leri de temizle
  }

  const updateUser = (uid, updates) => {
    if (localUser.value && localUser.value.uid === uid) {
      // Yerel kullanıcıyı güncelle
      localUser.value = { ...localUser.value, ...updates }
    } else {
      // Uzak kullanıcıyı güncelle
      const index = remoteUsers.value.findIndex(u => u.uid === uid)
      if (index >= 0) {
        remoteUsers.value[index] = { ...remoteUsers.value[index], ...updates }
      }
    }
  }

  const setLocalTrack = (type, track) => {
    localTracks.value[type] = track
    
    // Yerel kullanıcı durumunu güncelle
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
      remoteTracks.value.set(uid, {}) // Kullanıcı için track objesi oluştur
    }
    remoteTracks.value.get(uid)[type] = track
  }

  const removeRemoteTrack = (uid, type) => {
    if (remoteTracks.value.has(uid)) {
      const userTracks = remoteTracks.value.get(uid)
      if (userTracks[type]) {
        userTracks[type].stop() // Track'i durdur
        userTracks[type].close() // Track'i kapat
        delete userTracks[type] // Track'i sil
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
      localTracks.value.video.setEnabled(!off) // Track'i etkinleştir/devre dışı bırak
    }
    if (localUser.value) {
      localUser.value.isVideoOff = off
    }
  }

  const reset = () => {
    // Tüm durumu sıfırla
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
    // State - Durum değişkenleri
    isConnected,
    isInitialized,
    localUser,
    remoteUsers,
    localTracks,
    remoteTracks,
    isLocalAudioMuted,
    isLocalVideoOff,
    
    // Getters - Hesaplanmış değerler
    allUsers,
    connectedUsersCount,
    hasLocalVideo,
    hasLocalAudio,
    
    // Actions - İşlemler
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