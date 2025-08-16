# 🖥️ Ekran Paylaşımı Dokümantasyonu

> Vue 3 Agora Video Conference Module - Ekran paylaşımı özellikleri ve kullanımı

## 🎯 **Ekran Paylaşımı Genel Bakış**

Bu dokümantasyon, projenin ekran paylaşımı özelliklerini, optimizasyonlarını ve kullanım senaryolarını detaylandırır.

## 🚀 **Temel Ekran Paylaşımı Özellikleri**

### **1. Ekran Paylaşımı Desteği**

#### **Browser Compatibility Check**
```javascript
// Ekran paylaşımı desteği kontrolü
const checkScreenShareSupport = () => {
  const hasGetDisplayMedia = 'getDisplayMedia' in navigator.mediaDevices
  const hasScreenCapture = 'ScreenCapture' in window
  
  return {
    supported: hasGetDisplayMedia && hasScreenCapture,
    getDisplayMedia: hasGetDisplayMedia,
    screenCapture: hasScreenCapture
  }
}

// Composable'da kullanım
const supportsScreenShare = computed(() => {
  return checkScreenShareSupport().supported
})
```

#### **Screen Share Client Setup**
```javascript
// Ekran paylaşımı client'ı oluşturma
const createScreenClient = () => {
  try {
    const client = AgoraRTC.createClient({
      mode: 'rtc',
      codec: 'h264',
      enableDualStream: false,
      enableAudioRecording: false,
      enableVideoRecording: false,
      enableHighPerformance: IS_PROD,
      enableCloudProxy: false
    })
    
    return { success: true, client }
  } catch (error) {
    logError(error, { context: 'createScreenClient' })
    return { success: false, error }
  }
}
```

### **2. Screen Track Management**

#### **Screen Track Creation**
```javascript
// Ekran paylaşımı track'i oluşturma
const createScreenTrack = async (options = {}) => {
  try {
    const defaultOptions = {
      encoderConfig: '720p_1',
      optimizationMode: 'motion',
      bitrateMin: 800,
      bitrateMax: 1500,
      frameRate: 15
    }
    
    const finalOptions = { ...defaultOptions, ...options }
    
    const screenTrack = await AgoraRTC.createScreenVideoTrack(finalOptions, 'auto')
    
    logScreen('Screen track oluşturuldu', finalOptions)
    return { success: true, track: screenTrack }
    
  } catch (error) {
    logError(error, { context: 'createScreenTrack', options })
    return { success: false, error }
  }
}
```

#### **Quality Presets**
```javascript
// Ekran paylaşımı kalite preset'leri
export const SCREEN_SHARE_CONFIG = {
  FAST_START: {
    encoderConfig: '720p_1',      // 1280x720 çözünürlük
    optimizationMode: 'motion',   // Hareket için optimize
    bitrateMin: 800,              // Minimum bitrate
    bitrateMax: 1500,             // Maksimum bitrate
    frameRate: 15                 // 15 FPS
  },
  
  LOW_QUALITY: {
    encoderConfig: '480p_1',      // 640x480 çözünürlük
    optimizationMode: 'motion',   // Hareket için optimize
    bitrateMin: 400,              // Çok düşük bitrate
    bitrateMax: 800,              // Çok düşük bitrate
    frameRate: 10                 // 10 FPS
  },
  
  HIGH_QUALITY: {
    encoderConfig: '1080p_1',     // 1920x1080 çözünürlük
    optimizationMode: 'detail',   // Detay için optimize
    bitrateMin: 2000,             // Yüksek bitrate
    bitrateMax: 4000,             // Yüksek bitrate
    frameRate: 30                 // 30 FPS
  }
}

// Kalite seçimi
const selectScreenQuality = (networkQuality) => {
  if (networkQuality < 2) {
    return SCREEN_SHARE_CONFIG.LOW_QUALITY
  } else if (networkQuality < 4) {
    return SCREEN_SHARE_CONFIG.FAST_START
  } else {
    return SCREEN_SHARE_CONFIG.HIGH_QUALITY
  }
}
```

## 🔄 **Ekran Paylaşımı İşlemleri**

### **1. Screen Share Start**

#### **Start Screen Sharing Process**
```javascript
// Ekran paylaşımını başlat
const startScreenShare = async () => {
  try {
    if (isScreenSharing.value) {
      logWarn('Ekran paylaşımı zaten aktif')
      return { success: false, error: 'Already sharing' }
    }
    
    // Screen track oluştur
    const { success, track, error } = await createScreenTrack()
    if (!success) {
      throw error
    }
    
    // Screen client'ı başlat
    if (!agoraStore.clients.screen.client) {
      await initializeScreenClient()
    }
    
    // Screen track'i publish et
    await agoraStore.clients.screen.client.publish(track)
    
    // Store'u güncelle
    agoraStore.setLocalTrack('screen', 'video', track)
    agoraStore.setScreenSharing(true)
    
    // Local screen user oluştur
    const screenUser = {
      uid: generateScreenUID(),
      userName: 'Screen Share',
      isLocal: true,
      isScreenShare: true,
      hasVideo: true,
      hasAudio: false,
      joinTime: new Date()
    }
    
    agoraStore.setLocalUser('screen', screenUser)
    
    logScreen('Ekran paylaşımı başlatıldı', { trackId: track.trackId })
    
    // Event emit
    centralEmitter.emit(AGORA_EVENTS.SCREEN_SHARE_STARTED, {
      trackId: track.trackId,
      uid: screenUser.uid
    })
    
    return { success: true, track, user: screenUser }
    
  } catch (error) {
    logError(error, { context: 'startScreenShare' })
    return { success: false, error }
  }
}
```

#### **Screen Selection Dialog**
```javascript
// Ekran seçim dialog'u
const showScreenSelectionDialog = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor',
        logicalSurface: true
      },
      audio: false
    })
    
    // Seçilen ekranı işle
    const videoTrack = stream.getVideoTracks()[0]
    
    // Track'i Agora formatına çevir
    const agoraTrack = AgoraRTC.createCustomVideoTrack({
      mediaStreamTrack: videoTrack
    })
    
    return { success: true, track: agoraTrack, stream }
    
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      logWarn('Ekran paylaşımı kullanıcı tarafından iptal edildi')
    } else {
      logError(error, { context: 'showScreenSelectionDialog' })
    }
    
    return { success: false, error }
  }
}
```

### **2. Screen Share Stop**

#### **Stop Screen Sharing Process**
```javascript
// Ekran paylaşımını durdur
const stopScreenShare = async () => {
  try {
    if (!isScreenSharing.value) {
      logWarn('Ekran paylaşımı zaten kapalı')
      return { success: false, error: 'Not sharing' }
    }
    
    // Screen track'i al
    const screenTrack = agoraStore.tracks.local.screen.video
    
    if (screenTrack) {
      // Track'i unpublish et
      if (agoraStore.clients.screen.client) {
        await agoraStore.clients.screen.client.unpublish(screenTrack)
      }
      
      // Track'i temizle
      if (screenTrack.stop) screenTrack.stop()
      if (screenTrack.close) screenTrack.close()
    }
    
    // Store'u temizle
    agoraStore.setLocalTrack('screen', 'video', null)
    agoraStore.setScreenSharing(false)
    agoraStore.setLocalUser('screen', null)
    
    logScreen('Ekran paylaşımı durduruldu')
    
    // Event emit
    centralEmitter.emit(AGORA_EVENTS.SCREEN_SHARE_STOPPED)
    
    return { success: true }
    
  } catch (error) {
    logError(error, { context: 'stopScreenShare' })
    return { success: false, error }
  }
}
```

#### **Toggle Screen Share**
```javascript
// Ekran paylaşımını aç/kapat
const toggleScreenShare = async () => {
  try {
    if (isScreenSharing.value) {
      return await stopScreenShare()
    } else {
      return await startScreenShare()
    }
  } catch (error) {
    logError(error, { context: 'toggleScreenShare' })
    return { success: false, error }
  }
}
```

## 📱 **Mobile Screen Sharing**

### **1. Mobile-Specific Features**

#### **Mobile Screen Share Support**
```javascript
// Mobile ekran paylaşımı desteği
const checkMobileScreenShare = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  if (isMobile) {
    // Mobile'da sadece belirli browser'lar destekler
    const isChrome = /Chrome/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    
    return {
      supported: isChrome || isSafari,
      browser: isChrome ? 'Chrome' : isSafari ? 'Safari' : 'Unknown',
      limitations: {
        audio: false,
        cursor: false,
        displaySurface: 'monitor'
      }
    }
  }
  
  return { supported: true, browser: 'Desktop', limitations: {} }
}
```

#### **Mobile Screen Share Configuration**
```javascript
// Mobile için optimize edilmiş ayarlar
const getMobileScreenConfig = () => {
  const mobileSupport = checkMobileScreenShare()
  
  if (mobileSupport.supported) {
    return {
      encoderConfig: '480p_1',      // Düşük çözünürlük
      optimizationMode: 'motion',   // Hareket için optimize
      bitrateMin: 400,              // Düşük bitrate
      bitrateMax: 800,              // Düşük bitrate
      frameRate: 10,                // Düşük FPS
      
      // Mobile-specific options
      mobileOptimization: true,
      batteryOptimization: true
    }
  }
  
  return SCREEN_SHARE_CONFIG.FAST_START
}
```

### **2. Touch Gestures for Screen Share**

#### **Mobile Touch Controls**
```javascript
// Mobile touch gesture'ları
const setupMobileScreenControls = (screenElement) => {
  let startY = 0
  let startScale = 1
  
  // Pinch to zoom
  screenElement.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      startY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      startScale = screenElement.style.transform ? 
        parseFloat(screenElement.style.transform.match(/scale\(([^)]+)\)/)[1]) : 1
    }
  })
  
  screenElement.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      
      const currentY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const deltaY = currentY - startY
      const scale = startScale + (deltaY / 200) // Scale sensitivity
      
      // Scale limitleri
      const clampedScale = Math.min(Math.max(scale, 0.5), 2)
      
      screenElement.style.transform = `scale(${clampedScale})`
    }
  })
  
  // Double tap to reset
  let lastTap = 0
  screenElement.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime()
    const tapLength = currentTime - lastTap
    
    if (tapLength < 500 && tapLength > 0) {
      screenElement.style.transform = 'scale(1)'
    }
    
    lastTap = currentTime
  })
}
```

## 🔧 **Advanced Screen Sharing Features**

### **1. Multi-Monitor Support**

#### **Monitor Detection**
```javascript
// Çoklu monitör desteği
const getAvailableDisplays = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'monitor'
      }
    })
    
    // Stream'i hemen kapat (sadece display listesi için)
    stream.getTracks().forEach(track => track.stop())
    
    // Display bilgilerini al
    const displays = []
    
    // Chrome'da display bilgileri
    if (stream.getVideoTracks()[0].getSettings) {
      const settings = stream.getVideoTracks()[0].getSettings()
      displays.push({
        id: settings.displaySurface,
        width: settings.width,
        height: settings.height
      })
    }
    
    return displays
    
  } catch (error) {
    logError(error, { context: 'getAvailableDisplays' })
    return []
  }
}
```

#### **Specific Monitor Selection**
```javascript
// Belirli monitörü seç
const selectSpecificMonitor = async (monitorId) => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'monitor',
        monitorId: monitorId
      }
    })
    
    const videoTrack = stream.getVideoTracks()[0]
    
    // Agora track'e çevir
    const agoraTrack = AgoraRTC.createCustomVideoTrack({
      mediaStreamTrack: videoTrack
    })
    
    return { success: true, track: agoraTrack, stream }
    
  } catch (error) {
    logError(error, { context: 'selectSpecificMonitor', monitorId })
    return { success: false, error }
  }
}
```

### **2. Application Window Sharing**

#### **Window Selection**
```javascript
// Uygulama penceresi seçimi
const selectApplicationWindow = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'window',
        cursor: 'always'
      }
    })
    
    const videoTrack = stream.getVideoTracks()[0]
    
    // Pencere bilgilerini al
    const windowInfo = {
      title: videoTrack.label || 'Unknown Window',
      width: videoTrack.getSettings().width,
      height: videoTrack.getSettings().height
    }
    
    // Agora track'e çevir
    const agoraTrack = AgoraRTC.createCustomVideoTrack({
      mediaStreamTrack: videoTrack
    })
    
    return { 
      success: true, 
      track: agoraTrack, 
      stream, 
      windowInfo 
    }
    
  } catch (error) {
    logError(error, { context: 'selectApplicationWindow' })
    return { success: false, error }
  }
}
```

### **3. Tab Sharing**

#### **Browser Tab Selection**
```javascript
// Browser tab seçimi
const selectBrowserTab = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'browser',
        cursor: 'always'
      }
    })
    
    const videoTrack = stream.getVideoTracks()[0]
    
    // Tab bilgilerini al
    const tabInfo = {
      title: videoTrack.label || 'Unknown Tab',
      url: window.location.href
    }
    
    // Agora track'e çevir
    const agoraTrack = AgoraRTC.createCustomVideoTrack({
      mediaStreamTrack: videoTrack
    })
    
    return { 
      success: true, 
      track: agoraTrack, 
      stream, 
      tabInfo 
    }
    
  } catch (error) {
    logError(error, { context: 'selectBrowserTab' })
    return { success: false, error }
  }
}
```

## 📊 **Screen Share Quality Management**

### **1. Adaptive Quality Control**

#### **Network-Based Quality Adaptation**
```javascript
// Ağ kalitesine göre kalite adaptasyonu
const adaptScreenShareQuality = async (networkQuality) => {
  try {
    const screenTrack = agoraStore.tracks.local.screen.video
    
    if (!screenTrack) return
    
    // Network quality'a göre kalite seç
    const qualityConfig = selectScreenQuality(networkQuality)
    
    // Track kalitesini güncelle
    await screenTrack.setEncoderConfiguration({
      encoderConfig: qualityConfig.encoderConfig,
      bitrateMin: qualityConfig.bitrateMin,
      bitrateMax: qualityConfig.bitrateMax,
      frameRate: qualityConfig.frameRate
    })
    
    logScreen('Screen share kalitesi adapte edildi', {
      networkQuality,
      qualityConfig
    })
    
  } catch (error) {
    logError(error, { context: 'adaptScreenShareQuality', networkQuality })
  }
}

// Network quality monitoring
watch(networkQuality, (quality) => {
  adaptScreenShareQuality(quality)
})
```

#### **Performance-Based Quality Control**
```javascript
// Performance'a göre kalite kontrolü
const monitorScreenSharePerformance = async () => {
  try {
    const screenTrack = agoraStore.tracks.local.screen.video
    
    if (!screenTrack) return
    
    // Performance metrics
    const stats = await screenTrack.getStats()
    
    // Frame rate kontrolü
    if (stats.frameRate < 10) {
      // Düşük FPS - kaliteyi düşür
      await screenTrack.setEncoderConfiguration({
        frameRate: 10,
        bitrateMax: Math.max(400, stats.bitrate * 0.8)
      })
      
      logWarn('Screen share kalitesi düşürüldü - düşük FPS', stats)
    }
    
    // Bitrate kontrolü
    if (stats.bitrate > 3000) {
      // Yüksek bitrate - kaliteyi düşür
      await screenTrack.setEncoderConfiguration({
        bitrateMax: 2000
      })
      
      logWarn('Screen share bitrate düşürüldü', stats)
    }
    
  } catch (error) {
    logError(error, { context: 'monitorScreenSharePerformance' })
  }
}
```

### **2. Quality Presets**

#### **Quality Preset Management**
```javascript
// Kalite preset yönetimi
class ScreenShareQualityManager {
  constructor() {
    this.currentPreset = 'FAST_START'
    this.presets = SCREEN_SHARE_CONFIG
  }
  
  // Preset değiştir
  async changePreset(presetName) {
    try {
      const preset = this.presets[presetName]
      if (!preset) {
        throw new Error(`Unknown preset: ${presetName}`)
      }
      
      const screenTrack = agoraStore.tracks.local.screen.video
      if (!screenTrack) {
        throw new Error('No active screen track')
      }
      
      // Track kalitesini güncelle
      await screenTrack.setEncoderConfiguration(preset)
      
      this.currentPreset = presetName
      
      logScreen('Screen share preset değiştirildi', {
        from: this.currentPreset,
        to: presetName,
        config: preset
      })
      
      return { success: true, preset: presetName }
      
    } catch (error) {
      logError(error, { context: 'changePreset', presetName })
      return { success: false, error }
    }
  }
  
  // Mevcut preset'i al
  getCurrentPreset() {
    return {
      name: this.currentPreset,
      config: this.presets[this.currentPreset]
    }
  }
  
  // Tüm preset'leri listele
  getAllPresets() {
    return Object.keys(this.presets).map(name => ({
      name,
      config: this.presets[name]
    }))
  }
}

export const screenShareQualityManager = new ScreenShareQualityManager()
```

## 🎨 **UI Components for Screen Sharing**

### **1. Screen Share Controls**

#### **Screen Share Button Component**
```vue
<template>
  <button
    @click="toggleScreenShare"
    :class="['screen-share-btn', { active: isScreenSharing }]"
    :disabled="!supportsScreenShare || isJoining"
    :title="buttonTitle"
  >
    <span class="icon">{{ buttonIcon }}</span>
    <span class="label">{{ buttonLabel }}</span>
    
    <!-- Quality indicator -->
    <div v-if="isScreenSharing" class="quality-indicator">
      <span class="quality-dot" :style="{ backgroundColor: qualityColor }"></span>
      <span class="quality-text">{{ qualityLevel }}</span>
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isScreenSharing: Boolean,
  supportsScreenShare: Boolean,
  isJoining: Boolean,
  qualityLevel: String,
  qualityColor: String
})

const emit = defineEmits(['toggle'])

// Computed properties
const buttonTitle = computed(() => {
  if (!props.supportsScreenShare) return 'Ekran paylaşımı desteklenmiyor'
  if (props.isJoining) return 'Ekran paylaşımı başlatılıyor...'
  return props.isScreenSharing ? 'Ekran paylaşımını durdur' : 'Ekran paylaşımını başlat'
})

const buttonIcon = computed(() => {
  if (props.isScreenSharing) return '❌🖥️'
  return '🖥️'
})

const buttonLabel = computed(() => {
  if (props.isJoining) return 'Başlatılıyor...'
  return props.isScreenSharing ? 'Paylaşımı Durdur' : 'Ekranı Paylaş'
})

// Methods
const toggleScreenShare = () => {
  if (props.supportsScreenShare && !props.isJoining) {
    emit('toggle')
  }
}
</script>

<style scoped>
.screen-share-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  background: var(--btn-bg, #4a5568);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.screen-share-btn:hover:not(:disabled) {
  background: var(--btn-hover-bg, #2d3748);
  transform: translateY(-1px);
}

.screen-share-btn.active {
  background: var(--btn-active-bg, #e53e3e);
}

.screen-share-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quality-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.quality-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.quality-text {
  font-size: 12px;
  font-weight: 500;
}
</style>
```

### **2. Screen Share Quality Selector**

#### **Quality Selection Component**
```vue
<template>
  <div class="quality-selector">
    <label for="qualitySelect">Ekran Paylaşımı Kalitesi:</label>
    <select 
      id="qualitySelect" 
      v-model="selectedQuality"
      @change="onQualityChange"
      :disabled="!isScreenSharing"
    >
      <option 
        v-for="preset in availablePresets" 
        :key="preset.name"
        :value="preset.name"
      >
        {{ preset.label }}
      </option>
    </select>
    
    <!-- Quality info -->
    <div v-if="isScreenSharing" class="quality-info">
      <div class="info-item">
        <span class="label">Çözünürlük:</span>
        <span class="value">{{ currentPreset.resolution }}</span>
      </div>
      <div class="info-item">
        <span class="label">Bitrate:</span>
        <span class="value">{{ currentPreset.bitrate }} kbps</span>
      </div>
      <div class="info-item">
        <span class="label">FPS:</span>
        <span class="value">{{ currentPreset.frameRate }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { screenShareQualityManager } from '../utils/screenShareQualityManager'

const props = defineProps({
  isScreenSharing: Boolean
})

const emit = defineEmits(['quality-change'])

// State
const selectedQuality = ref('FAST_START')

// Computed
const availablePresets = computed(() => [
  { name: 'LOW_QUALITY', label: 'Düşük Kalite (Hızlı)' },
  { name: 'FAST_START', label: 'Orta Kalite (Dengeli)' },
  { name: 'HIGH_QUALITY', label: 'Yüksek Kalite (Yavaş)' }
])

const currentPreset = computed(() => {
  const preset = screenShareQualityManager.getCurrentPreset()
  const config = preset.config
  
  return {
    resolution: getResolutionLabel(config.encoderConfig),
    bitrate: `${config.bitrateMin}-${config.bitrateMax}`,
    frameRate: config.frameRate
  }
})

// Methods
const getResolutionLabel = (encoderConfig) => {
  const resolutionMap = {
    '480p_1': '640x480',
    '720p_1': '1280x720',
    '1080p_1': '1920x1080'
  }
  return resolutionMap[encoderConfig] || encoderConfig
}

const onQualityChange = async () => {
  try {
    const result = await screenShareQualityManager.changePreset(selectedQuality.value)
    
    if (result.success) {
      emit('quality-change', {
        quality: selectedQuality.value,
        config: result.preset
      })
    }
  } catch (error) {
    console.error('Quality change failed:', error)
  }
}

// Watch for external quality changes
watch(() => props.isScreenSharing, (sharing) => {
  if (sharing) {
    selectedQuality.value = screenShareQualityManager.getCurrentPreset().name
  }
})
</script>

<style scoped>
.quality-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary, #f7fafc);
  border-radius: 8px;
}

.quality-selector label {
  font-weight: 600;
  color: var(--text-primary, #2d3748);
}

.quality-selector select {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 4px;
  background: white;
  font-size: 14px;
}

.quality-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid var(--border-color, #e2e8f0);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-size: 12px;
  color: var(--text-secondary, #718096);
}

.info-item .value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #2d3748);
}
</style>
```

## 📊 **Screen Share Analytics**

### **1. Usage Tracking**

#### **Screen Share Events**
```javascript
// Screen share event tracking
const trackScreenShareEvents = () => {
  // Start event
  centralEmitter.on(AGORA_EVENTS.SCREEN_SHARE_STARTED, (data) => {
    analyticsService.track('screen_share_started', {
      timestamp: new Date().toISOString(),
      trackId: data.trackId,
      uid: data.uid,
      sessionId: generateSessionId()
    })
  })
  
  // Stop event
  centralEmitter.on(AGORA_EVENTS.SCREEN_SHARE_STOPPED, () => {
    analyticsService.track('screen_share_stopped', {
      timestamp: new Date().toISOString(),
      sessionId: generateSessionId()
    })
  })
  
  // Quality change event
  const trackQualityChange = (quality) => {
    analyticsService.track('screen_share_quality_changed', {
      timestamp: new Date().toISOString(),
      quality,
      sessionId: generateSessionId()
    })
  }
  
  return { trackQualityChange }
}
```

### **2. Performance Metrics**

#### **Screen Share Performance Tracking**
```javascript
// Screen share performance tracking
const trackScreenSharePerformance = async () => {
  try {
    const screenTrack = agoraStore.tracks.local.screen.video
    
    if (!screenTrack) return
    
    const stats = await screenTrack.getStats()
    
    const metrics = {
      bitrate: stats.bitrate || 0,
      frameRate: stats.frameRate || 0,
      resolution: stats.width && stats.height ? `${stats.width}x${stats.height}` : 'unknown',
      timestamp: new Date().toISOString(),
      sessionId: generateSessionId()
    }
    
    // Analytics service'e gönder
    analyticsService.track('screen_share_performance', metrics)
    
    // Local logging
    logInfo('Screen share performance tracked', metrics)
    
  } catch (error) {
    logError(error, { context: 'trackScreenSharePerformance' })
  }
}

// Periodic tracking
const startPerformanceTracking = () => {
  const interval = setInterval(trackScreenSharePerformance, 5000) // 5 saniyede bir
  
  // Cleanup
  onUnmounted(() => {
    clearInterval(interval)
  })
}
```

---

> **💡 İpucu**: Bu ekran paylaşımı dokümantasyonu ile tüm ekran paylaşımı özelliklerini detaylı olarak öğrenebilirsiniz.

