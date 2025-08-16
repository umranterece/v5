# 🎥 Video Konferans Dokümantasyonu

> Vue 3 Agora Video Conference Module - Video konferans özellikleri ve kullanımı

## 🎯 **Video Konferans Genel Bakış**

Bu dokümantasyon, projenin video konferans özelliklerini, kullanım senaryolarını ve teknik detaylarını açıklar.

## 🚀 **Temel Video Konferans Özellikleri**

### **1. Çoklu Kullanıcı Desteği**

#### **Kullanıcı Yönetimi**
```javascript
// Kullanıcı tipleri
interface User {
  uid: number                    // Benzersiz kullanıcı ID'si
  userName?: string              // Kullanıcı adı
  isLocal: boolean               // Yerel kullanıcı mı?
  isScreenShare: boolean         // Ekran paylaşımı kullanıcısı mı?
  hasVideo: boolean              // Video var mı?
  hasAudio: boolean              // Ses var mı?
  isMuted: boolean               // Sessiz mi?
  isVideoOff: boolean            // Video kapalı mı?
  networkQuality?: number        // Ağ kalitesi (0-6)
  joinTime: Date                 // Katılma zamanı
}

// Kullanıcı listeleri
const localUser = computed(() => agoraStore.users.local.video)
const remoteUsers = computed(() => agoraStore.users.remote.filter(u => !u.isScreenShare))
const allUsers = computed(() => agoraStore.allUsers)
const connectedUsersCount = computed(() => agoraStore.connectedUsersCount)
```

#### **Kullanıcı Katılma/Ayrılma**
```javascript
// Kullanıcı katılma event'i
centralEmitter.on(AGORA_EVENTS.USER_JOINED, (data) => {
  logUI('Kullanıcı katıldı', data)
  emit('user-joined', data)
  
  // Kullanıcı listesini güncelle
  agoraStore.addRemoteUser({
    uid: data.uid,
    userName: data.userName || `User ${data.uid}`,
    isLocal: false,
    joinTime: new Date()
  })
})

// Kullanıcı ayrılma event'i
centralEmitter.on(AGORA_EVENTS.USER_LEFT, (data) => {
  logUI('Kullanıcı ayrıldı', data)
  emit('user-left', data)
  
  // Kullanıcıyı listeden kaldır
  agoraStore.removeRemoteUser(data.uid)
})
```

### **2. Video Grid Sistemi**

#### **Responsive Video Grid**
```vue
<template>
  <div 
    class="video-grid"
    :data-count="allUsers.length"
    :class="gridClass"
  >
    <!-- Local Video -->
    <VideoItem 
      v-if="localCameraUser"
      :user="localCameraUser"
      :has-video="localCameraHasVideo"
      :video-ref="el => setLocalVideoRef(el)"
      :track="localTracks.video && localTracks.video.video"
      :is-local="true"
    />

    <!-- Remote Users -->
    <VideoItem 
      v-for="user in remoteUsers" 
      :key="user.uid"
      :user="user"
      :has-video="getUserHasVideo(user)"
      :video-ref="el => setVideoRef(el, user.uid)"
      :track="user.track"
      :is-local="false"
    />
  </div>
</template>

<script setup>
// Grid class hesaplama
const gridClass = computed(() => {
  const count = allUsers.value.length
  
  if (count === 1) return 'grid-single'
  if (count === 2) return 'grid-duo'
  if (count <= 4) return 'grid-quad'
  if (count <= 9) return 'grid-nine'
  return 'grid-many'
})
</script>

<style scoped>
.video-grid {
  display: grid;
  gap: var(--video-gap, 16px);
  padding: var(--video-padding, 20px);
}

.grid-single {
  grid-template-columns: 1fr;
  justify-items: center;
}

.grid-duo {
  grid-template-columns: 1fr 1fr;
}

.grid-quad {
  grid-template-columns: repeat(2, 1fr);
}

.grid-nine {
  grid-template-columns: repeat(3, 1fr);
}

.grid-many {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* Mobile responsive */
@media (max-width: 768px) {
  .video-grid {
    gap: var(--mobile-video-gap, 8px);
    padding: var(--mobile-video-padding, 10px);
  }
  
  .grid-many {
    grid-template-columns: 1fr;
  }
}
</style>
```

### **3. Video Quality Management**

#### **Adaptive Quality Control**
```javascript
// Video kalite ayarları
export const VIDEO_CONFIG = {
  // Development vs Production
  encoderConfig: IS_DEV ? '720p_1' : '1080p_1',
  bitrateMin: IS_DEV ? 1000 : 2000,
  bitrateMax: IS_DEV ? 2000 : 4000,
  frameRate: IS_DEV ? 24 : 30,
  
  // Quality presets
  QUALITY_PRESETS: {
    LOW: {
      encoderConfig: '480p_1',
      bitrateMin: 500,
      bitrateMax: 1000,
      frameRate: 15
    },
    MEDIUM: {
      encoderConfig: '720p_1',
      bitrateMin: 1000,
      bitrateMax: 2000,
      frameRate: 24
    },
    HIGH: {
      encoderConfig: '1080p_1',
      bitrateMin: 2000,
      bitrateMax: 4000,
      frameRate: 30
    }
  }
}

// Quality adaptation
const adaptVideoQuality = (networkQuality) => {
  if (networkQuality < 2) {
    // Düşük ağ kalitesi - düşük kalite
    return VIDEO_CONFIG.QUALITY_PRESETS.LOW
  } else if (networkQuality < 4) {
    // Orta ağ kalitesi - orta kalite
    return VIDEO_CONFIG.QUALITY_PRESETS.MEDIUM
  } else {
    // Yüksek ağ kalitesi - yüksek kalite
    return VIDEO_CONFIG.QUALITY_PRESETS.HIGH
  }
}
```

#### **Dynamic Bitrate Control**
```javascript
// Bitrate adaptation
const adaptBitrate = async (client, targetBitrate) => {
  try {
    const currentStats = await client.getLocalVideoStats()
    
    Object.values(currentStats).forEach(stat => {
      if (stat.trackId) {
        // Bitrate'i dinamik olarak ayarla
        client.setVideoEncoderConfiguration({
          bitrateMin: targetBitrate * 0.8,
          bitrateMax: targetBitrate * 1.2
        })
      }
    })
  } catch (error) {
    logError(error, { context: 'adaptBitrate' })
  }
}

// Network quality'a göre bitrate ayarlama
watch(networkQuality, (quality) => {
  if (quality < 2) {
    adaptBitrate(client, 1000) // Düşük bitrate
  } else if (quality < 4) {
    adaptBitrate(client, 2000) // Orta bitrate
  } else {
    adaptBitrate(client, 4000) // Yüksek bitrate
  }
})
```

## 🎤 **Audio Management**

### **1. Audio Track Management**

#### **Audio Track Creation**
```javascript
// Audio track oluşturma
const createAudioTrack = async () => {
  try {
    const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
      encoderConfig: 'music_standard',
      gain: 1.0,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false
    })
    
    // Store'a kaydet
    agoraStore.setLocalTrack('video', 'audio', audioTrack)
    
    return audioTrack
  } catch (error) {
    logError(error, { context: 'createAudioTrack' })
    throw error
  }
}
```

#### **Audio Level Monitoring**
```javascript
// Audio level monitoring
const monitorAudioLevel = (audioTrack) => {
  if (!audioTrack) return
  
  const audioLevelMonitor = setInterval(() => {
    try {
      const level = audioTrack.getVolumeLevel()
      
      // Audio level'a göre UI güncelle
      if (level > 0.8) {
        // Yüksek ses seviyesi
        showAudioLevelIndicator(level)
      }
      
      // Store'a kaydet
      agoraStore.setAudioLevel(level)
    } catch (error) {
      // Track artık mevcut değil
      clearInterval(audioLevelMonitor)
    }
  }, 100)
  
  // Cleanup
  onUnmounted(() => {
    clearInterval(audioLevelMonitor)
  })
}
```

### **2. Audio Controls**

#### **Mute/Unmute Management**
```javascript
// Microphone toggle
const toggleMicrophone = async (muted) => {
  try {
    const audioTrack = agoraStore.tracks.local.video.audio
    
    if (audioTrack) {
      if (muted) {
        audioTrack.setEnabled(false)
        agoraStore.setLocalAudioMuted(true)
        logUI('Mikrofon kapatıldı')
      } else {
        audioTrack.setEnabled(true)
        agoraStore.setLocalAudioMuted(false)
        logUI('Mikrofon açıldı')
      }
    }
  } catch (error) {
    logError(error, { context: 'toggleMicrophone', state: muted ? 'muted' : 'unmuted' })
    throw error
  }
}

// Audio device switching
const switchAudioDevice = async (deviceId) => {
  try {
    const audioTrack = agoraStore.tracks.local.video.audio
    
    if (audioTrack) {
      // Yeni device ile track oluştur
      const newAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: deviceId
      })
      
      // Eski track'i temizle
      if (audioTrack.stop) audioTrack.stop()
      
      // Yeni track'i store'a kaydet
      agoraStore.setLocalTrack('video', 'audio', newAudioTrack)
      
      // Yeni track'i publish et
      await client.publish(newAudioTrack)
      
      logUI('Audio device değiştirildi', { deviceId })
    }
  } catch (error) {
    logError(error, { context: 'switchAudioDevice', deviceId })
    throw error
  }
}
```

## 📹 **Video Device Management**

### **1. Camera Management**

#### **Camera Track Creation**
```javascript
// Video track oluşturma
const createVideoTrack = async (deviceId = null) => {
  try {
    const videoConfig = {
      encoderConfig: VIDEO_CONFIG.encoderConfig,
      facingMode: 'user',
      bitrateMin: VIDEO_CONFIG.bitrateMin,
      bitrateMax: VIDEO_CONFIG.bitrateMax,
      frameRate: VIDEO_CONFIG.frameRate
    }
    
    if (deviceId) {
      videoConfig.cameraId = deviceId
    }
    
    const videoTrack = await AgoraRTC.createCameraVideoTrack(videoConfig)
    
    // Store'a kaydet
    agoraStore.setLocalTrack('video', 'video', videoTrack)
    
    return videoTrack
  } catch (error) {
    logError(error, { context: 'createVideoTrack' })
    throw error
  }
}
```

#### **Camera Device Switching**
```javascript
// Camera device listesi
const getCameraDevices = async () => {
  try {
    const devices = await AgoraRTC.getCameras()
    
    return devices.map(device => ({
      deviceId: device.deviceId,
      label: device.label || `Camera ${device.deviceId}`,
      isDefault: device.deviceId === 'default'
    }))
  } catch (error) {
    logError(error, { context: 'getCameraDevices' })
    return []
  }
}

// Camera switching
const switchCamera = async (deviceId) => {
  try {
    const videoTrack = agoraStore.tracks.local.video.video
    
    if (videoTrack) {
      // Yeni camera ile track oluştur
      const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
        cameraId: deviceId,
        encoderConfig: VIDEO_CONFIG.encoderConfig,
        bitrateMin: VIDEO_CONFIG.bitrateMin,
        bitrateMax: VIDEO_CONFIG.bitrateMax,
        frameRate: VIDEO_CONFIG.frameRate
      })
      
      // Eski track'i temizle
      if (videoTrack.stop) videoTrack.stop()
      
      // Yeni track'i store'a kaydet
      agoraStore.setLocalTrack('video', 'video', newVideoTrack)
      
      // Yeni track'i publish et
      await client.publish(newVideoTrack)
      
      logUI('Camera değiştirildi', { deviceId })
    }
  } catch (error) {
    logError(error, { context: 'switchCamera', deviceId })
    throw error
  }
}
```

### **2. Video Controls**

#### **Camera Toggle**
```javascript
// Camera toggle
const toggleCamera = async (off) => {
  try {
    const videoTrack = agoraStore.tracks.local.video.video
    
    if (videoTrack) {
      if (off) {
        videoTrack.setEnabled(false)
        agoraStore.setLocalVideoOff(true)
        logUI('Kamera kapatıldı')
      } else {
        videoTrack.setEnabled(true)
        agoraStore.setLocalVideoOff(false)
        logUI('Kamera açıldı')
      }
    }
  } catch (error) {
    logError(error, { context: 'toggleCamera', state: off ? 'off' : 'on' })
    throw error
  }
}
```

#### **Video Quality Settings**
```javascript
// Video quality ayarları
const updateVideoQuality = async (quality) => {
  try {
    const videoTrack = agoraStore.tracks.local.video.video
    
    if (videoTrack) {
      const config = VIDEO_CONFIG.QUALITY_PRESETS[quality]
      
      await videoTrack.setEncoderConfiguration({
        encoderConfig: config.encoderConfig,
        bitrateMin: config.bitrateMin,
        bitrateMax: config.bitrateMax,
        frameRate: config.frameRate
      })
      
      logUI('Video kalitesi güncellendi', { quality, config })
    }
  } catch (error) {
    logError(error, { context: 'updateVideoQuality', quality })
    throw error
  }
}
```

## 🔄 **Connection Management**

### **1. Channel Joining**

#### **Join Channel Process**
```javascript
// Kanala katılma
const joinChannel = async (params) => {
  try {
    const { channelName, token, uid, appId, userName } = params
    
    // Client'ı başlat
    if (!client.value) {
      await initializeClient(appId)
    }
    
    // Token'ı doğrula
    if (!token) {
      throw new Error('Token gerekli')
    }
    
    // Kanala katıl
    await client.value.join(appId, channelName, token, uid)
    
    // Local user'ı oluştur
    const localUser = {
      uid,
      userName: userName || `User ${uid}`,
      isLocal: true,
      joinTime: new Date(),
      hasVideo: true,
      hasAudio: true,
      isMuted: false,
      isVideoOff: false
    }
    
    agoraStore.setLocalUser('video', localUser)
    agoraStore.setVideoChannelName(channelName)
    agoraStore.setAppId(appId)
    
    logUI('Kanala başarıyla katıldı', { channelName, uid })
    
    // Event emit
    emit('joined', { channelName, token, uid })
    
  } catch (error) {
    logError(error, { context: 'joinChannel', params })
    throw error
  }
}
```

#### **Connection State Management**
```javascript
// Connection state monitoring
const monitorConnectionState = () => {
  if (!client.value) return
  
  client.value.on('connection-state-change', (curState, prevState, reason) => {
    logUI('Connection state değişti', { curState, prevState, reason })
    
    // Store'u güncelle
    agoraStore.setClientConnected('video', curState === 'CONNECTED')
    
    // Event emit
    emit('connection-state-change', { 
      state: curState, 
      previousState: prevState, 
      reason 
    })
    
    // State'e göre action'lar
    switch (curState) {
      case 'CONNECTED':
        handleConnected()
        break
      case 'DISCONNECTED':
        handleDisconnected()
        break
      case 'RECONNECTING':
        handleReconnecting()
        break
      case 'ABORTED':
        handleAborted()
        break
    }
  })
}

// Connection handlers
const handleConnected = () => {
  logUI('Video kanalına bağlandı')
  // Connected state actions
}

const handleDisconnected = () => {
  logUI('Video kanalından ayrıldı')
  // Disconnected state actions
}

const handleReconnecting = () => {
  logUI('Video kanalına yeniden bağlanılıyor')
  // Reconnecting state actions
}

const handleAborted = () => {
  logUI('Video kanalı bağlantısı kesildi')
  // Aborted state actions
}
```

### **2. Channel Leaving**

#### **Leave Channel Process**
```javascript
// Kanaldan ayrılma
const leaveChannel = async () => {
  try {
    if (!client.value) return
    
    // Client'tan ayrıl
    await client.value.leave()
    
    // Local tracks'leri temizle
    cleanupLocalTracks()
    
    // Store'u temizle
    agoraStore.reset()
    
    logUI('Kanaldan başarıyla ayrıldı')
    
    // Event emit
    emit('left', { channelName: agoraStore.videoChannelName })
    
  } catch (error) {
    logError(error, { context: 'leaveChannel' })
    throw error
  }
}

// Local tracks cleanup
const cleanupLocalTracks = () => {
  const { localTracks } = agoraStore.tracks.local.video
  
  if (localTracks.audio) {
    localTracks.audio.stop()
    localTracks.audio.close()
  }
  
  if (localTracks.video) {
    localTracks.video.stop()
    localTracks.video.close()
  }
  
  // Store'u temizle
  agoraStore.setLocalTrack('video', 'audio', null)
  agoraStore.setLocalTrack('video', 'video', null)
}
```

## 📱 **Mobile Optimization**

### **1. Mobile-Specific Features**

#### **Touch Gestures**
```javascript
// Touch gesture handling
const setupTouchGestures = (videoElement) => {
  let startDistance = 0
  let startScale = 1
  
  // Pinch to zoom
  videoElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      startDistance = getDistance(e.touches[0], e.touches[1])
      startScale = videoElement.style.transform ? 
        parseFloat(videoElement.style.transform.match(/scale\(([^)]+)\)/)[1]) : 1
    }
  })
  
  videoElement.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      
      const currentDistance = getDistance(e.touches[0], e.touches[1])
      const scale = startScale * (currentDistance / startDistance)
      
      // Scale limitleri
      const clampedScale = Math.min(Math.max(scale, 1), 3)
      
      videoElement.style.transform = `scale(${clampedScale})`
    }
  })
  
  // Double tap to reset
  let lastTap = 0
  videoElement.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime()
    const tapLength = currentTime - lastTap
    
    if (tapLength < 500 && tapLength > 0) {
      // Double tap detected
      videoElement.style.transform = 'scale(1)'
    }
    
    lastTap = currentTime
  })
}

// Distance calculation
const getDistance = (touch1, touch2) => {
  const dx = touch1.clientX - touch2.clientX
  const dy = touch1.clientY - touch2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}
```

#### **Mobile Performance Settings**
```javascript
// Mobile için optimize edilmiş ayarlar
export const MOBILE_CONFIG = {
  // Daha düşük kalite
  encoderConfig: '480p_1',
  bitrateMin: 500,
  bitrateMax: 1000,
  frameRate: 15,
  
  // Touch-friendly controls
  touchTargetSize: 44, // iOS/Android minimum touch target
  gestureSensitivity: 0.8,
  
  // Battery optimization
  enableLowPowerMode: true,
  adaptiveFrameRate: true
}

// Mobile detection
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

// Mobile-specific config
const getMobileConfig = () => {
  if (isMobile.value) {
    return {
      ...VIDEO_CONFIG,
      ...MOBILE_CONFIG
    }
  }
  return VIDEO_CONFIG
}
```

## 🔧 **Advanced Features**

### **1. Background Blur/Replacement**

#### **Background Effects**
```javascript
// Background blur
const enableBackgroundBlur = async () => {
  try {
    const videoTrack = agoraStore.tracks.local.video.video
    
    if (videoTrack && videoTrack.setBeautyEffect) {
      await videoTrack.setBeautyEffect({
        lighteningLevel: 0.5,
        smoothnessLevel: 0.5,
        rednessLevel: 0.1
      })
      
      logUI('Background blur etkinleştirildi')
    }
  } catch (error) {
    logError(error, { context: 'enableBackgroundBlur' })
  }
}

// Background replacement
const setBackgroundImage = async (imageUrl) => {
  try {
    const videoTrack = agoraStore.tracks.local.video.video
    
    if (videoTrack && videoTrack.setBackgroundImage) {
      await videoTrack.setBackgroundImage(imageUrl)
      
      logUI('Background image ayarlandı', { imageUrl })
    }
  } catch (error) {
    logError(error, { context: 'setBackgroundImage', imageUrl })
  }
}
```

### **2. Virtual Background**

#### **Virtual Background Setup**
```javascript
// Virtual background
const setupVirtualBackground = async () => {
  try {
    const videoTrack = agoraStore.tracks.local.video.video
    
    if (videoTrack && videoTrack.setVirtualBackground) {
      await videoTrack.setVirtualBackground({
        type: 'img',
        source: 'path/to/background.jpg',
        blurDegree: 3
      })
      
      logUI('Virtual background ayarlandı')
    }
  } catch (error) {
    logError(error, { context: 'setupVirtualBackground' })
  }
}
```

## 📊 **Analytics ve Monitoring**

### **1. Usage Analytics**

#### **User Behavior Tracking**
```javascript
// User action tracking
const trackUserAction = (action, details = {}) => {
  const event = {
    action,
    details,
    timestamp: new Date().toISOString(),
    sessionId: generateSessionId(),
    userId: agoraStore.users.local.video?.uid
  }
  
  // Analytics service'e gönder
  analyticsService.track('user_action', event)
  
  // Local logging
  logUI('User action tracked', event)
}

// Track common actions
const trackCameraToggle = (state) => {
  trackUserAction('camera_toggled', { state })
}

const trackMicrophoneToggle = (state) => {
  trackUserAction('microphone_toggled', { state })
}

const trackQualityChange = (quality) => {
  trackUserAction('quality_changed', { quality })
}
```

### **2. Performance Metrics**

#### **Connection Quality Metrics**
```javascript
// Connection quality tracking
const trackConnectionQuality = async () => {
  try {
    const stats = await client.value.getTransportStats()
    
    const metrics = {
      rtt: stats.Rtt || 0,
      packetLoss: stats.PacketLossRate || 0,
      networkQuality: stats.NetworkQuality || 0,
      timestamp: new Date().toISOString()
    }
    
    // Analytics service'e gönder
    analyticsService.track('connection_quality', metrics)
    
    // Local logging
    logInfo('Connection quality tracked', metrics)
    
  } catch (error) {
    logError(error, { context: 'trackConnectionQuality' })
  }
}

// Periodic tracking
const startQualityTracking = () => {
  const interval = setInterval(trackConnectionQuality, 10000) // 10 saniyede bir
  
  // Cleanup
  onUnmounted(() => {
    clearInterval(interval)
  })
}
```

---

> **💡 İpucu**: Bu video konferans dokümantasyonu ile tüm video konferans özelliklerini detaylı olarak öğrenebilirsiniz.

