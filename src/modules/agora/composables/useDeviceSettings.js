/**
 * Device Settings Composable
 * Kamera, mikrofon ve cihaz ayarlarını yönetir
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAgoraStore } from '../store/index.js'
import { centralEmitter, AGORA_EVENTS } from '../utils/index.js'
import { fileLogger } from '../services/index.js'

export function useDeviceSettings() {
  // Logger fonksiyonları - FileLogger'dan al (tüm seviyeler için)
  const logDebug = (message, data) => fileLogger.log('debug', 'DEVICE', message, data)
  const logInfo = (message, data) => fileLogger.log('info', 'DEVICE', message, data)
  const logWarn = (message, data) => fileLogger.log('warn', 'DEVICE', message, data)
  const logError = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('error', 'DEVICE', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('error', 'DEVICE', errorOrMessage, context)
  }
  const logFatal = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('fatal', 'DEVICE', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('fatal', 'DEVICE', errorOrMessage, context)
  }
  
  const agoraStore = useAgoraStore()

  // Device lists
  const audioInputDevices = ref([])
  const videoInputDevices = ref([])

  // Current device IDs
  const currentAudioInputId = ref('')
  const currentVideoInputId = ref('')

  // Device permissions
  const hasAudioPermission = ref(false)
  const hasVideoPermission = ref(false)

  // Device status
  const isAudioEnabled = ref(true)
  const isVideoEnabled = ref(true)

  // Computed properties
  const hasDevices = computed(() => {
    return audioInputDevices.value.length > 0 || videoInputDevices.value.length > 0
  })

  const canSwitchAudio = computed(() => {
    return audioInputDevices.value.length > 1 && hasAudioPermission.value
  })

  const canSwitchVideo = computed(() => {
    return videoInputDevices.value.length > 1 && hasVideoPermission.value
  })

  const currentAudioDevice = computed(() => {
    return audioInputDevices.value.find(device => device.deviceId === currentAudioInputId.value)
  })

  const currentVideoDevice = computed(() => {
    return videoInputDevices.value.find(device => device.deviceId === currentVideoInputId.value)
  })

  // Get available devices
  const getDevices = async () => {
    try {
      logDebug('Cihaz listesi alınıyor...')
      
      // Önce izinleri kontrol et ve gerekirse al
      await checkPermissions()
      
      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      
      // Filter and categorize devices
      audioInputDevices.value = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Mikrofon ${device.deviceId.slice(0, 8)}`,
          groupId: device.groupId
        }))

      videoInputDevices.value = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Kamera ${device.deviceId.slice(0, 8)}`,
          groupId: device.groupId
        }))

      // Set current devices if not set
      if (!currentAudioInputId.value && audioInputDevices.value.length > 0) {
        currentAudioInputId.value = audioInputDevices.value[0].deviceId
      }

      if (!currentVideoInputId.value && videoInputDevices.value.length > 0) {
        currentVideoInputId.value = videoInputDevices.value[0].deviceId
      }

      logInfo(`Cihaz listesi güncellendi: ${audioInputDevices.value.length} mikrofon, ${videoInputDevices.value.length} kamera`)
      
      return {
        audioInput: audioInputDevices.value,
        videoInput: videoInputDevices.value
      }

    } catch (error) {
      logError('Cihaz listesi alınamadı', { error })
      throw error
    }
  }

  // Check device permissions
  const checkPermissions = async () => {
    try {
      logDebug('Cihaz izinleri kontrol ediliyor...')
      
      // Check audio permission
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        hasAudioPermission.value = true
        // Stream'i hemen durdurma, cihaz listesi için gerekli
        setTimeout(() => {
          audioStream.getTracks().forEach(track => track.stop())
        }, 100)
      } catch (error) {
        hasAudioPermission.value = false
        logError('Mikrofon izni alınamadı', { error })
      }

      // Check video permission
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        hasVideoPermission.value = true
        // Stream'i hemen durdurma, cihaz listesi için gerekli
        setTimeout(() => {
          videoStream.getTracks().forEach(track => track.stop())
        }, 100)
      } catch (error) {
        hasVideoPermission.value = false
        logError('Kamera izni alınamadı', { error })
      }

      logInfo(`İzin durumu: Mikrofon ${hasAudioPermission.value ? '✅' : '❌'}, Kamera ${hasVideoPermission.value ? '✅' : '❌'}`)
      
      return {
        audio: hasAudioPermission.value,
        video: hasVideoPermission.value
      }

    } catch (error) {
      logError('İzin kontrolü hatası', { error })
      throw error
    }
  }

  // Switch audio input device
  const switchAudioInput = async (deviceId) => {
    try {
      if (!hasAudioPermission.value) {
        throw new Error('Mikrofon izni yok')
      }

      if (!deviceId || deviceId === currentAudioInputId.value) {
        return false
      }

      logInfo(`Mikrofon değiştiriliyor: ${deviceId}`)

      // Get current local audio track
      const localAudioTrack = agoraStore.tracks.local.video?.audio
      if (!localAudioTrack) {
        throw new Error('Aktif ses track\'i bulunamadı')
      }

      // Stop current audio track
      localAudioTrack.stop()

      // Create new audio track with new device
      const newAudioTrack = await agoraStore.clients.video.client.createMicrophoneAudioTrack({
        microphoneId: deviceId
      })

      // Update store
      agoraStore.setLocalTracks({
        ...agoraStore.tracks.local.video,
        audio: newAudioTrack
      })

      // Publish new track
      await agoraStore.clients.video.client.publish(newAudioTrack)

      // Update current device
      currentAudioInputId.value = deviceId

      logInfo(`Mikrofon başarıyla değiştirildi: ${currentAudioDevice.value?.label}`)

      // Emit event
      centralEmitter.emit(AGORA_EVENTS.DEVICE_STATUS_CHANGE, {
        type: 'audio-input',
        deviceId,
        device: currentAudioDevice.value
      })

      return true

    } catch (error) {
      logError('Mikrofon değiştirme hatası', { error })
      throw error
    }
  }

  // Switch video input device
  const switchVideoInput = async (deviceId) => {
    try {
      if (!hasVideoPermission.value) {
        throw new Error('Kamera izni yok')
      }

      if (!deviceId || deviceId === currentVideoInputId.value) {
        return false
      }

      logInfo(`Kamera değiştiriliyor: ${deviceId}`)

      // Get current local video track
      const localVideoTrack = agoraStore.tracks.local.video?.video
      if (!localVideoTrack) {
        throw new Error('Aktif video track\'i bulunamadı')
      }

      // Stop current video track
      localVideoTrack.stop()

      // Create new video track with new device
      const newVideoTrack = await agoraStore.clients.video.client.createCameraVideoTrack({
        cameraId: deviceId
      })

      // Update store
      agoraStore.setLocalTracks({
        ...agoraStore.tracks.local.video,
        video: newVideoTrack
      })

      // Publish new track
      await agoraStore.clients.video.client.publish(newVideoTrack)

      // Update current device
      currentVideoInputId.value = deviceId

      logInfo(`Kamera başarıyla değiştirildi: ${currentVideoDevice.value?.label}`)

      // Emit event
      centralEmitter.emit(AGORA_EVENTS.DEVICE_STATUS_CHANGE, {
        type: 'video-input',
        deviceId,
        device: currentVideoDevice.value
      })

      return true

    } catch (error) {
      logError('Kamera değiştirme hatası', { error })
      throw error
    }
  }

  // Toggle audio device
  const toggleAudio = async () => {
    try {
      if (!hasAudioPermission.value) {
        throw new Error('Mikrofon izni yok')
      }

      const newState = !isAudioEnabled.value
      
      if (newState) {
        // Enable audio
        const localAudioTrack = agoraStore.tracks.local.video?.audio
        if (localAudioTrack) {
          await agoraStore.clients.video.client.publish(localAudioTrack)
          logInfo('Mikrofon açıldı')
        }
      } else {
        // Disable audio
        const localAudioTrack = agoraStore.tracks.local.video?.audio
        if (localAudioTrack) {
          await agoraStore.clients.video.client.unpublish(localAudioTrack)
          logInfo('Mikrofon kapatıldı')
        }
      }

      isAudioEnabled.value = newState
      
      // Update store
      agoraStore.setLocalAudioMuted(!newState)

      return newState

    } catch (error) {
      logError('Mikrofon toggle hatası', { error })
      throw error
    }
  }

  // Toggle video device
  const toggleVideo = async () => {
    try {
      if (!hasVideoPermission.value) {
        throw new Error('Kamera izni yok')
      }

      const newState = !isVideoEnabled.value
      
      if (newState) {
        // Enable video
        const localVideoTrack = agoraStore.tracks.local.video?.video
        if (localVideoTrack) {
          await agoraStore.clients.video.client.publish(localVideoTrack)
          logInfo('Kamera açıldı')
        }
      } else {
        // Disable video
        const localVideoTrack = agoraStore.tracks.local.video?.video
        if (localVideoTrack) {
          await agoraStore.clients.video.client.unpublish(localVideoTrack)
          logInfo('Kamera kapatıldı')
        }
      }

      isVideoEnabled.value = newState
      
      // Update store
      agoraStore.setLocalVideoOff(!newState)

      return newState

    } catch (error) {
      logError('Kamera toggle hatası', { error })
      throw error
    }
  }

  // Refresh device list
  const refreshDevices = async () => {
    try {
      logInfo('Cihaz listesi yenileniyor...')
      
      await getDevices()
      await checkPermissions()
      
      logInfo('Cihaz listesi yenilendi')
      
      return true
    } catch (error) {
      logError('Cihaz listesi yenileme hatası', { error })
      throw error
    }
  }

  // Device change event listener
  const handleDeviceChange = async () => {
    logDebug('Cihaz değişikliği tespit edildi, liste yenileniyor...')
    await refreshDevices()
  }

  // Initialize
  const initialize = async () => {
    try {
      logDebug('Device settings başlatılıyor...')
      
      // Get devices (bu fonksiyon zaten izinleri kontrol ediyor)
      await getDevices()
      
      // Listen for device changes
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
      
      logInfo('Device settings başlatıldı')
      
    } catch (error) {
      logError(error, { context: 'DEVICE', info: 'Device settings başlatma hatası' })
      throw error
    }
  }

  // Cleanup
  onUnmounted(() => {
    navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
  })

  return {
    // State
    audioInputDevices,
    videoInputDevices,
    currentAudioInputId,
    currentVideoInputId,
    hasAudioPermission,
    hasVideoPermission,
    isAudioEnabled,
    isVideoEnabled,

    // Computed
    hasDevices,
    canSwitchAudio,
    canSwitchVideo,
    currentAudioDevice,
    currentVideoDevice,

    // Methods
    initialize,
    getDevices,
    checkPermissions,
    switchAudioInput,
    switchVideoInput,
    toggleAudio,
    toggleVideo,
    refreshDevices
  }
}
