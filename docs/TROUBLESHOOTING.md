# 🔧 Sorun Giderme Rehberi

> Vue 3 Agora Video Conference Module - Yaygın sorunlar ve çözümleri

## 🎯 **Sorun Giderme Genel Bakış**

Bu dokümantasyon, projede karşılaşılabilecek yaygın sorunları, hata mesajlarını ve çözüm yöntemlerini detaylandırır.

## 🚨 **Yaygın Sorunlar ve Çözümleri**

### **1. Bağlantı Sorunları**

#### **"Failed to join channel" Hatası**
```javascript
// Hata: Failed to join channel
// Sebepler ve çözümler:

// 1. Token hatası
const checkToken = async () => {
  try {
    // Token'ı doğrula
    const token = await createToken(channelName, uid)
    
    if (!token.success) {
      throw new Error('Token oluşturulamadı')
    }
    
    // Token süresini kontrol et
    if (isTokenExpired(token.data.token)) {
      throw new Error('Token süresi dolmuş')
    }
    
    return token.data.token
  } catch (error) {
    logger.error('TOKEN', 'Token kontrol hatası:', error)
    throw error
  }
}

// 2. App ID hatası
const validateAppId = (appId) => {
  if (!appId || appId.length < 10) {
    throw new Error('Geçersiz App ID')
  }
  
  // App ID format kontrolü
  const appIdRegex = /^[a-f0-9]{32}$/
  if (!appIdRegex.test(appId)) {
    throw new Error('App ID formatı hatalı')
  }
  
  return true
}

// 3. Network bağlantısı kontrolü
const checkNetworkConnection = async () => {
  try {
    const response = await fetch('https://www.google.com', { 
      mode: 'no-cors',
      cache: 'no-cache'
    })
    return true
  } catch (error) {
    throw new Error('İnternet bağlantısı yok')
  }
}
```

#### **"Connection timeout" Hatası**
```javascript
// Hata: Connection timeout
// Çözüm: Timeout ayarlarını artır

const AGORA_CONFIG = {
  // Timeout ayarları
  connectionTimeout: 30000, // 30 saniye
  operationTimeout: 10000,  // 10 saniye
  
  // Retry ayarları
  maxRetries: 3,
  retryDelay: 2000,
  
  // Network ayarları
  enableCloudProxy: false, // Daha hızlı bağlantı
  enableHighPerformance: true
}

// Retry logic
const joinChannelWithRetry = async (params, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.logUI(`Kanal katılma denemesi ${attempt}/${maxRetries}`, 'CONNECTION')
      
      const result = await joinChannel(params)
      return result
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      
      // Bekle ve tekrar dene
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt))
    }
  }
}
```

### **2. Cihaz İzin Sorunları**

#### **"Permission denied" Hatası**
```javascript
// Hata: Permission denied for camera/microphone
// Çözüm: İzin yönetimi

class DevicePermissionManager {
  constructor() {
    this.permissions = {
      camera: 'unknown',
      microphone: 'unknown'
    }
  }
  
  // İzin durumlarını kontrol et
  async checkPermissions() {
    try {
      // Camera izni
      const cameraPermission = await navigator.permissions.query({ name: 'camera' })
      this.permissions.camera = cameraPermission.state
      
      // Microphone izni
      const microphonePermission = await navigator.permissions.query({ name: 'microphone' })
      this.permissions.microphone = microphonePermission.state
      
      return this.permissions
    } catch (error) {
      logger.error('PERMISSIONS', 'İzin kontrol hatası:', error)
      return this.permissions
    }
  }
  
  // İzin isteme
  async requestPermissions() {
    try {
      // Camera izni iste
      if (this.permissions.camera === 'prompt') {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true })
        cameraStream.getTracks().forEach(track => track.stop())
        this.permissions.camera = 'granted'
      }
      
      // Microphone izni iste
      if (this.permissions.microphone === 'prompt') {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioStream.getTracks().forEach(track => track.stop())
        this.permissions.microphone = 'granted'
      }
      
      return this.permissions
    } catch (error) {
      logger.error('PERMISSIONS', 'İzin isteme hatası:', error)
      throw error
    }
  }
  
  // İzin durumunu kontrol et
  hasRequiredPermissions() {
    return this.permissions.camera === 'granted' && 
           this.permissions.microphone === 'granted'
  }
}

export const devicePermissionManager = new DevicePermissionManager()
```

#### **"No devices found" Hatası**
```javascript
// Hata: No camera/microphone devices found
// Çözüm: Cihaz tespiti ve fallback

const detectDevices = async () => {
  try {
    // Mevcut cihazları listele
    const devices = await navigator.mediaDevices.enumerateDevices()
    
    const cameraDevices = devices.filter(device => device.kind === 'videoinput')
    const audioDevices = devices.filter(device => device.kind === 'audioinput')
    
    if (cameraDevices.length === 0) {
      logger.warn('DEVICES', 'Kamera cihazı bulunamadı')
      
      // Fallback: Virtual camera veya placeholder
      return {
        camera: null,
        microphone: audioDevices[0] || null,
        hasCamera: false,
        hasMicrophone: audioDevices.length > 0
      }
    }
    
    if (audioDevices.length === 0) {
      logger.warn('DEVICES', 'Mikrofon cihazı bulunamadı')
      
      return {
        camera: cameraDevices[0] || null,
        microphone: null,
        hasCamera: cameraDevices.length > 0,
        hasMicrophone: false
      }
    }
    
    return {
      camera: cameraDevices[0],
      microphone: audioDevices[0],
      hasCamera: true,
      hasMicrophone: true
    }
    
  } catch (error) {
    logger.error('DEVICES', 'Cihaz tespit hatası:', error)
    throw error
  }
}
```

### **3. Video/Audio Sorunları**

#### **"No video stream" Hatası**
```javascript
// Hata: No video stream available
// Çözüm: Video track yönetimi

const createVideoTrackWithFallback = async (deviceId = null) => {
  try {
    // İlk deneme: Belirtilen cihaz ile
    if (deviceId) {
      const track = await AgoraRTC.createCameraVideoTrack({
        cameraId: deviceId,
        encoderConfig: '720p_1'
      })
      return { success: true, track, deviceId }
    }
    
    // İkinci deneme: Varsayılan cihaz ile
    const defaultTrack = await AgoraRTC.createCameraVideoTrack({
      encoderConfig: '720p_1'
    })
    return { success: true, track: defaultTrack, deviceId: 'default' }
    
  } catch (error) {
    logger.error('VIDEO', 'Video track oluşturma hatası:', error)
    
    // Fallback: Düşük kalite ile dene
    try {
      const fallbackTrack = await AgoraRTC.createCameraVideoTrack({
        encoderConfig: '480p_1',
        facingMode: 'user'
      })
      return { success: true, track: fallbackTrack, deviceId: 'fallback' }
    } catch (fallbackError) {
      return { success: false, error: fallbackError }
    }
  }
}

// Video track durumunu izle
const monitorVideoTrack = (track) => {
  if (!track) return
  
  track.on('track-ended', () => {
    logger.warn('VIDEO', 'Video track sona erdi')
    // Track'i yeniden oluştur
    recreateVideoTrack()
  })
  
  track.on('track-mute', () => {
    logger.info('VIDEO', 'Video track sessize alındı')
  })
  
  track.on('track-unmute', () => {
    logger.info('VIDEO', 'Video track sesi açıldı')
  })
}
```

#### **"Audio not working" Hatası**
```javascript
// Hata: Audio not working
// Çözüm: Audio track yönetimi

const createAudioTrackWithFallback = async (deviceId = null) => {
  try {
    // Audio track oluştur
    const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
      microphoneId: deviceId,
      encoderConfig: 'music_standard',
      gain: 1.0,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: false
    })
    
    // Audio level monitoring
    const audioLevelMonitor = setInterval(() => {
      try {
        const level = audioTrack.getVolumeLevel()
        
        if (level === 0) {
          logger.warn('AUDIO', 'Audio level 0 - ses yok')
        }
        
        // Store'a kaydet
        agoraStore.setAudioLevel(level)
        
      } catch (error) {
        // Track artık mevcut değil
        clearInterval(audioLevelMonitor)
      }
    }, 1000)
    
    return { success: true, track: audioTrack, monitor: audioLevelMonitor }
    
  } catch (error) {
    logger.error('AUDIO', 'Audio track oluşturma hatası:', error)
    
    // Fallback: Basit audio track
    try {
      const fallbackTrack = await AgoraRTC.createMicrophoneAudioTrack({
        encoderConfig: 'speech_standard'
      })
      return { success: true, track: fallbackTrack, monitor: null }
    } catch (fallbackError) {
      return { success: false, error: fallbackError }
    }
  }
}
```

### **4. Network Kalite Sorunları**

#### **"Poor network quality" Hatası**
```javascript
// Hata: Poor network quality
// Çözüm: Network adaptasyonu

const adaptToNetworkQuality = async (networkQuality) => {
  try {
    const videoTrack = agoraStore.tracks.local.video.video
    const audioTrack = agoraStore.tracks.local.video.audio
    
    if (networkQuality < 2) {
      // Düşük ağ kalitesi - kaliteyi düşür
      logger.warn('NETWORK', 'Düşük ağ kalitesi tespit edildi, kalite düşürülüyor')
      
      if (videoTrack) {
        await videoTrack.setEncoderConfiguration({
          encoderConfig: '480p_1',
          bitrateMin: 500,
          bitrateMax: 1000,
          frameRate: 15
        })
      }
      
      // Audio kalitesini de düşür
      if (audioTrack) {
        // Audio için kalite ayarı yok, sadece log
        logger.info('AUDIO', 'Audio kalitesi korunuyor')
      }
      
    } else if (networkQuality > 4) {
      // Yüksek ağ kalitesi - kaliteyi artır
      logger.info('NETWORK', 'Yüksek ağ kalitesi tespit edildi, kalite artırılıyor')
      
      if (videoTrack) {
        await videoTrack.setEncoderConfiguration({
          encoderConfig: '1080p_1',
          bitrateMin: 2000,
          bitrateMax: 4000,
          frameRate: 30
        })
      }
    }
    
  } catch (error) {
    logger.error('NETWORK', 'Network adaptasyon hatası:', error)
  }
}

// Network quality monitoring
const monitorNetworkQuality = async () => {
  try {
    const client = agoraStore.clients.video.client
    if (!client) return
    
    const stats = await client.getTransportStats()
    
    // RTT kontrolü
    if (stats.Rtt > 200) {
      logger.warn('NETWORK', 'Yüksek RTT tespit edildi:', stats.Rtt)
    }
    
    // Packet loss kontrolü
    if (stats.PacketLossRate > 5) {
      logger.warn('NETWORK', 'Yüksek paket kaybı tespit edildi:', stats.PacketLossRate)
    }
    
    // Network quality'a göre adaptasyon
    const quality = Math.floor((6 - stats.Rtt / 100) * (1 - stats.PacketLossRate / 100) * 6)
    adaptToNetworkQuality(quality)
    
  } catch (error) {
    logger.error('NETWORK', 'Network monitoring hatası:', error)
  }
}
```

### **5. Screen Share Sorunları**

#### **"Screen share failed" Hatası**
```javascript
// Hata: Screen share failed
// Çözüm: Screen share fallback

const startScreenShareWithFallback = async () => {
  try {
    // İlk deneme: Normal screen share
    const result = await startScreenShare()
    
    if (result.success) {
      return result
    }
    
    // Fallback 1: Düşük kalite ile dene
    logger.warn('SCREEN_SHARE', 'Normal screen share başarısız, düşük kalite deneniyor')
    
    const lowQualityResult = await startScreenShare({
      encoderConfig: '480p_1',
      bitrateMin: 400,
      bitrateMax: 800,
      frameRate: 10
    })
    
    if (lowQualityResult.success) {
      return lowQualityResult
    }
    
    // Fallback 2: Sadece video ile dene
    logger.warn('SCREEN_SHARE', 'Düşük kalite başarısız, sadece video deneniyor')
    
    const videoOnlyResult = await startScreenShare({
      streamTypes: 2, // Sadece video
      encoderConfig: '480p_1'
    })
    
    if (videoOnlyResult.success) {
      return videoOnlyResult
    }
    
    throw new Error('Tüm screen share yöntemleri başarısız')
    
  } catch (error) {
    logger.error('SCREEN_SHARE', 'Screen share fallback hatası:', error)
    throw error
  }
}
```

#### **"Screen share permission denied" Hatası**
```javascript
// Hata: Screen share permission denied
// Çözüm: İzin yönetimi

const checkScreenSharePermission = async () => {
  try {
    // Screen share desteğini kontrol et
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error('Screen share desteklenmiyor')
    }
    
    // İzin durumunu kontrol et
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor'
      },
      audio: false
    })
    
    // Stream'i hemen kapat (sadece izin kontrolü için)
    stream.getTracks().forEach(track => track.stop())
    
    return { supported: true, permission: 'granted' }
    
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      return { supported: true, permission: 'denied' }
    } else if (error.name === 'NotSupportedError') {
      return { supported: false, permission: 'not_supported' }
    } else {
      return { supported: false, permission: 'error', error: error.message }
    }
  }
}

// Screen share izin yardımı
const showScreenShareHelp = () => {
  const helpMessage = `
    Screen share izni verilmedi. Lütfen:
    
    1. Tarayıcı izinlerini kontrol edin
    2. "Allow" butonuna tıklayın
    3. Ekranı seçin
    4. "Share" butonuna tıklayın
    
    Eğer izin verilmezse, sayfayı yenileyin ve tekrar deneyin.
  `
  
  // Modal veya alert göster
  showModal('Screen Share İzni Gerekli', helpMessage)
}
```

## 🛠️ **Debug Araçları**

### **1. Logging ve Monitoring**

#### **Enhanced Logging System**
```javascript
// Gelişmiş logging sistemi
class EnhancedLogger {
  constructor() {
    this.logs = []
    this.maxLogs = 1000
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    }
    this.currentLevel = this.logLevels.INFO
  }
  
  // Log seviyesini ayarla
  setLogLevel(level) {
    if (this.logLevels[level] !== undefined) {
      this.currentLevel = this.logLevels[level]
      logger.logUI(`Log seviyesi ${level} olarak ayarlandı`, 'LOGGER')
    }
  }
  
  // Log ekle
  addLog(level, category, message, data = null) {
    if (this.logLevels[level] <= this.currentLevel) {
      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level,
        category,
        message,
        data,
        stack: new Error().stack
      }
      
      this.logs.push(logEntry)
      
      // Maksimum log sayısını aş
      if (this.logs.length > this.maxLogs) {
        this.logs.shift()
      }
      
      // Console'a yazdır
      this.writeToConsole(logEntry)
    }
  }
  
  // Console'a yazdır
  writeToConsole(logEntry) {
    const { level, category, message, data } = logEntry
    
    const logMethod = level === 'ERROR' ? 'error' : 
                     level === 'WARN' ? 'warn' : 
                     level === 'INFO' ? 'info' : 'log'
    
    const prefix = `[${level}] [${category}]`
    
    if (data) {
      console[logMethod](prefix, message, data)
    } else {
      console[logMethod](prefix, message)
    }
  }
  
  // Log'ları filtrele
  filterLogs(filters = {}) {
    return this.logs.filter(log => {
      if (filters.level && log.level !== filters.level) return false
      if (filters.category && log.category !== filters.category) return false
      if (filters.search && !log.message.includes(filters.search)) return false
      return true
    })
  }
  
  // Log'ları temizle
  clearLogs() {
    this.logs = []
    logger.logUI('Loglar temizlendi', 'LOGGER')
  }
  
  // Log'ları export et
  exportLogs() {
    const logData = {
      exportTime: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    }
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agora-logs-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    URL.revokeObjectURL(url)
  }
}

export const enhancedLogger = new EnhancedLogger()
```

### **2. Performance Monitoring**

#### **Performance Metrics Collector**
```javascript
// Performance metrics toplayıcı
class PerformanceMetricsCollector {
  constructor() {
    this.metrics = {
      connection: {},
      video: {},
      audio: {},
      network: {},
      memory: {}
    }
    this.collectionInterval = null
  }
  
  // Metrics toplamayı başlat
  startCollection() {
    if (this.collectionInterval) return
    
    this.collectionInterval = setInterval(() => {
      this.collectMetrics()
    }, 5000) // 5 saniyede bir
    
    logger.logUI('Performance metrics toplama başlatıldı', 'PERFORMANCE')
  }
  
  // Metrics toplamayı durdur
  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval)
      this.collectionInterval = null
      logger.logUI('Performance metrics toplama durduruldu', 'PERFORMANCE')
    }
  }
  
  // Metrics topla
  async collectMetrics() {
    try {
      // Connection metrics
      this.metrics.connection = await this.getConnectionMetrics()
      
      // Video metrics
      this.metrics.video = await this.getVideoMetrics()
      
      // Audio metrics
      this.metrics.audio = await this.getAudioMetrics()
      
      // Network metrics
      this.metrics.network = await this.getNetworkMetrics()
      
      // Memory metrics
      this.metrics.memory = this.getMemoryMetrics()
      
      // Metrics'i log'la
      this.logMetrics()
      
      // Threshold kontrolü
      this.checkThresholds()
      
    } catch (error) {
      logger.error('PERFORMANCE', 'Metrics toplama hatası:', error)
    }
  }
  
  // Connection metrics
  async getConnectionMetrics() {
    const client = agoraStore.clients.video.client
    if (!client) return {}
    
    try {
      const stats = await client.getTransportStats()
      return {
        rtt: stats.Rtt || 0,
        packetLoss: stats.PacketLossRate || 0,
        networkQuality: stats.NetworkQuality || 0,
        timestamp: Date.now()
      }
    } catch (error) {
      return { error: error.message }
    }
  }
  
  // Video metrics
  async getVideoMetrics() {
    const videoTrack = agoraStore.tracks.local.video.video
    if (!videoTrack) return {}
    
    try {
      const stats = await videoTrack.getStats()
      return {
        bitrate: stats.bitrate || 0,
        frameRate: stats.frameRate || 0,
        resolution: stats.width && stats.height ? `${stats.width}x${stats.height}` : 'unknown',
        timestamp: Date.now()
      }
    } catch (error) {
      return { error: error.message }
    }
  }
  
  // Audio metrics
  async getAudioMetrics() {
    const audioTrack = agoraStore.tracks.local.video.audio
    if (!audioTrack) return {}
    
    try {
      const level = audioTrack.getVolumeLevel()
      return {
        volumeLevel: level || 0,
        timestamp: Date.now()
      }
    } catch (error) {
      return { error: error.message }
    }
  }
  
  // Network metrics
  async getNetworkMetrics() {
    try {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      
      if (connection) {
        return {
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          timestamp: Date.now()
        }
      }
      
      return { notSupported: true }
    } catch (error) {
      return { error: error.message }
    }
  }
  
  // Memory metrics
  getMemoryMetrics() {
    if ('memory' in performance) {
      const memory = performance.memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      }
    }
    
    return { notSupported: true }
  }
  
  // Metrics'i log'la
  logMetrics() {
    logger.debug('PERFORMANCE', 'Performance metrics collected:', this.metrics)
  }
  
  // Threshold kontrolü
  checkThresholds() {
    // RTT threshold
    if (this.metrics.connection.rtt > 200) {
      logger.warn('PERFORMANCE', 'Yüksek RTT tespit edildi:', this.metrics.connection.rtt)
    }
    
    // Memory threshold
    if (this.metrics.memory.usedJSHeapSize) {
      const memoryUsage = (this.metrics.memory.usedJSHeapSize / this.metrics.memory.jsHeapSizeLimit) * 100
      if (memoryUsage > 80) {
        logger.warn('PERFORMANCE', 'Yüksek memory kullanımı:', `${memoryUsage.toFixed(1)}%`)
      }
    }
  }
  
  // Metrics'i al
  getMetrics() {
    return this.metrics
  }
  
  // Metrics'i temizle
  clearMetrics() {
    this.metrics = {
      connection: {},
      video: {},
      audio: {},
      network: {},
      memory: {}
    }
  }
}

export const performanceMetricsCollector = new PerformanceMetricsCollector()
```

## 📱 **Mobile-Specific Sorunlar**

### **1. Mobile Performance Issues**

#### **Mobile Performance Optimizations**
```javascript
// Mobile performance optimizasyonları
const optimizeForMobile = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  if (isMobile) {
    // Video kalitesini düşür
    const videoConfig = {
      encoderConfig: '480p_1',
      bitrateMin: 500,
      bitrateMax: 1000,
      frameRate: 15
    }
    
    // Audio kalitesini düşür
    const audioConfig = {
      encoderConfig: 'speech_standard',
      gain: 0.8,
      echoCancellation: true,
      noiseSuppression: true
    }
    
    // Screen share kalitesini düşür
    const screenConfig = {
      encoderConfig: '480p_1',
      bitrateMin: 400,
      bitrateMax: 800,
      frameRate: 10
    }
    
    logger.logUI('Mobile optimizasyonları uygulandı', 'MOBILE')
    
    return { videoConfig, audioConfig, screenConfig }
  }
  
  return null
}

// Mobile touch gesture handling
const setupMobileTouchHandlers = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  if (!isMobile) return
  
  // Touch event handlers
  document.addEventListener('touchstart', handleTouchStart, { passive: false })
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd, { passive: false })
  
  logger.logUI('Mobile touch handlers kuruldu', 'MOBILE')
}

// Touch event handlers
let touchStartY = 0
let touchStartTime = 0

const handleTouchStart = (e) => {
  touchStartY = e.touches[0].clientY
  touchStartTime = Date.now()
}

const handleTouchMove = (e) => {
  // Prevent default scroll on video elements
  if (e.target.closest('.video-container')) {
    e.preventDefault()
  }
}

const handleTouchEnd = (e) => {
  const touchEndY = e.changedTouches[0].clientY
  const touchEndTime = Date.now()
  const touchDuration = touchEndTime - touchStartTime
  
  // Long press detection
  if (touchDuration > 500) {
    handleLongPress(e)
  }
  
  // Swipe detection
  const deltaY = touchEndY - touchStartY
  if (Math.abs(deltaY) > 50) {
    handleSwipe(deltaY > 0 ? 'down' : 'up')
  }
}

const handleLongPress = (e) => {
  logger.logUI('Long press detected', 'MOBILE')
  // Long press actions
}

const handleSwipe = (direction) => {
  logger.logUI(`Swipe detected: ${direction}`, 'MOBILE')
  // Swipe actions
}
```

### **2. Mobile Browser Compatibility**

#### **Browser Compatibility Check**
```javascript
// Browser uyumluluk kontrolü
const checkBrowserCompatibility = () => {
  const userAgent = navigator.userAgent
  const compatibility = {
    browser: 'unknown',
    version: 'unknown',
    supported: false,
    features: {
      webRTC: false,
      getUserMedia: false,
      getDisplayMedia: false,
      mediaRecorder: false
    }
  }
  
  // Browser detection
  if (userAgent.includes('Chrome')) {
    compatibility.browser = 'Chrome'
    const match = userAgent.match(/Chrome\/(\d+)/)
    compatibility.version = match ? match[1] : 'unknown'
  } else if (userAgent.includes('Firefox')) {
    compatibility.browser = 'Firefox'
    const match = userAgent.match(/Firefox\/(\d+)/)
    compatibility.version = match ? match[1] : 'unknown'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    compatibility.browser = 'Safari'
    const match = userAgent.match(/Version\/(\d+)/)
    compatibility.version = match ? match[1] : 'unknown'
  } else if (userAgent.includes('Edge')) {
    compatibility.browser = 'Edge'
    const match = userAgent.match(/Edge\/(\d+)/)
    compatibility.version = match ? match[1] : 'unknown'
  }
  
  // Feature detection
  compatibility.features.webRTC = !!window.RTCPeerConnection
  compatibility.features.getUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  compatibility.features.getDisplayMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)
  compatibility.features.mediaRecorder = !!window.MediaRecorder
  
  // Support determination
  compatibility.supported = compatibility.features.webRTC && 
                           compatibility.features.getUserMedia &&
                           compatibility.features.getDisplayMedia
  
  // Version requirements
  if (compatibility.browser === 'Chrome' && parseInt(compatibility.version) < 88) {
    compatibility.supported = false
    compatibility.reason = 'Chrome 88+ gerekli'
  } else if (compatibility.browser === 'Firefox' && parseInt(compatibility.version) < 85) {
    compatibility.supported = false
    compatibility.reason = 'Firefox 85+ gerekli'
  } else if (compatibility.browser === 'Safari' && parseInt(compatibility.version) < 14) {
    compatibility.supported = false
    compatibility.reason = 'Safari 14+ gerekli'
  }
  
  return compatibility
}

// Compatibility warning
const showCompatibilityWarning = (compatibility) => {
  if (compatibility.supported) return
  
  const warningMessage = `
    Tarayıcınız tam olarak desteklenmiyor.
    
    Browser: ${compatibility.browser} ${compatibility.version}
    Desteklenen özellikler: ${Object.entries(compatibility.features)
      .filter(([_, supported]) => supported)
      .map(([feature]) => feature)
      .join(', ')}
    
    ${compatibility.reason ? `Sebep: ${compatibility.reason}` : ''}
    
    Lütfen güncel bir tarayıcı kullanın.
  `
  
  showModal('Uyumluluk Uyarısı', warningMessage)
}
```

## 🔍 **Diagnostic Tools**

### **1. System Information Collector**

#### **System Info Component**
```javascript
// Sistem bilgisi toplayıcı
class SystemInfoCollector {
  constructor() {
    this.systemInfo = {}
  }
  
  // Sistem bilgilerini topla
  collectSystemInfo() {
    this.systemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      
      // Screen info
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
        pixelDepth: screen.pixelDepth
      },
      
      // Window info
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight
      },
      
      // Performance info
      performance: {
        timeOrigin: performance.timeOrigin,
        navigation: performance.navigation ? {
          type: performance.navigation.type,
          redirectCount: performance.navigation.redirectCount
        } : null
      },
      
      // WebRTC support
      webRTC: {
        RTCPeerConnection: !!window.RTCPeerConnection,
        RTCSessionDescription: !!window.RTCSessionDescription,
        RTCIceCandidate: !!window.RTCIceCandidate
      },
      
      // Media devices
      mediaDevices: {
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        getDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
        enumerateDevices: !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)
      }
    }
    
    return this.systemInfo
  }
  
  // Sistem bilgilerini al
  getSystemInfo() {
    if (Object.keys(this.systemInfo).length === 0) {
      this.collectSystemInfo()
    }
    return this.systemInfo
  }
  
  // Sistem bilgilerini export et
  exportSystemInfo() {
    const info = this.getSystemInfo()
    const blob = new Blob([JSON.stringify(info, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-info-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    
    URL.revokeObjectURL(url)
  }
}

export const systemInfoCollector = new SystemInfoCollector()
```

### **2. Network Diagnostic Tool**

#### **Network Diagnostic Component**
```javascript
// Network diagnostic aracı
class NetworkDiagnosticTool {
  constructor() {
    this.testResults = {}
  }
  
  // Ping testi
  async pingTest(url = 'https://www.google.com') {
    const startTime = performance.now()
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      })
      
      const endTime = performance.now()
      const pingTime = endTime - startTime
      
      return {
        success: true,
        url,
        pingTime: Math.round(pingTime),
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        success: false,
        url,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }
  
  // Bandwidth testi
  async bandwidthTest() {
    const testUrl = 'https://httpbin.org/bytes/1048576' // 1MB test
    const startTime = performance.now()
    
    try {
      const response = await fetch(testUrl)
      const data = await response.blob()
      const endTime = performance.now()
      
      const duration = (endTime - startTime) / 1000 // seconds
      const sizeInMB = data.size / (1024 * 1024)
      const bandwidthMbps = (sizeInMB * 8) / duration
      
      return {
        success: true,
        bandwidthMbps: Math.round(bandwidthMbps * 100) / 100,
        duration: Math.round(duration * 100) / 100,
        sizeMB: Math.round(sizeInMB * 100) / 100,
        timestamp: Date.now()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: Date.now()
      }
    }
  }
  
  // Connection quality testi
  async connectionQualityTest() {
    const results = {
      ping: await this.pingTest(),
      bandwidth: await this.bandwidthTest(),
      timestamp: Date.now()
    }
    
    // Quality score hesapla
    let qualityScore = 100
    
    if (results.ping.success) {
      if (results.ping.pingTime > 200) qualityScore -= 20
      if (results.ping.pingTime > 500) qualityScore -= 30
    } else {
      qualityScore -= 50
    }
    
    if (results.bandwidth.success) {
      if (results.bandwidth.bandwidthMbps < 5) qualityScore -= 20
      if (results.bandwidth.bandwidthMbps < 2) qualityScore -= 30
    } else {
      qualityScore -= 30
    }
    
    results.qualityScore = Math.max(0, qualityScore)
    results.qualityLevel = this.getQualityLevel(results.qualityScore)
    
    this.testResults = results
    return results
  }
  
  // Quality level belirle
  getQualityLevel(score) {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    if (score >= 20) return 'Poor'
    return 'Very Poor'
  }
  
  // Test sonuçlarını al
  getTestResults() {
    return this.testResults
  }
  
  // Test sonuçlarını temizle
  clearTestResults() {
    this.testResults = {}
  }
}

export const networkDiagnosticTool = new NetworkDiagnosticTool()
```

---

> **💡 İpucu**: Bu sorun giderme rehberi ile projede karşılaşılan yaygın sorunları çözebilir ve debug yapabilirsiniz.

