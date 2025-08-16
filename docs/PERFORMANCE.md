# 📊 Performance Dokümantasyonu

> Vue 3 Agora Video Conference Module - Performance optimizasyonları ve best practices

## 🎯 **Performance Genel Bakış**

Bu dokümantasyon, projenin performance optimizasyonlarını, memory management stratejilerini ve performance monitoring yaklaşımlarını detaylandırır.

## 🚀 **Performance Optimizasyonları**

### **1. Bundle Optimization**

#### **Code Splitting**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'agora-sdk': ['agora-rtc-sdk-ng'],
          'vue-vendor': ['vue', 'pinia'],
          'utils': ['mitt', 'lodash-es']
        }
      }
    }
  }
})
```

#### **Tree Shaking**
```javascript
// Sadece gerekli fonksiyonları import et
import { createSafeTimeout, formatTime } from './utils/index.js'

// Tüm utils'i import etme
// import * as utils from './utils/index.js'
```

#### **Dynamic Imports**
```javascript
// Lazy loading components
const AgoraConference = () => import('./components/AgoraConference.vue')
const LogModal = () => import('./components/LogModal.vue')
const RecordingControls = () => import('./components/RecordingControls.vue')
```

### **2. Vue Performance Optimizations**

#### **Computed Properties Caching**
```javascript
// ✅ İyi: Computed property ile caching
const allUsers = computed(() => {
  const localUsers = []
  if (users.value.local.screen) localUsers.push(users.value.local.screen)
  if (users.value.local.video) localUsers.push(users.value.local.video)
  return [...localUsers, ...users.value.remote]
})

// ❌ Kötü: Her render'da hesaplama
const allUsers = () => {
  const localUsers = []
  if (users.value.local.screen) localUsers.push(users.value.local.screen)
  if (users.value.local.video) localUsers.push(users.value.local.video)
  return [...localUsers, ...users.value.remote]
}
```

#### **Reactive References Optimization**
```javascript
// ✅ İyi: Shallow ref kullan
const largeObject = shallowRef({ /* büyük obje */ })

// ✅ İyi: Readonly ref'ler
const publicState = readonly(computed(() => store.state))

// ❌ Kötü: Gereksiz reactive wrapping
const simpleValue = ref(42) // Sadece number için ref gerekli değil
```

#### **Event Handler Optimization**
```javascript
// ✅ İyi: Debounced event handlers
const debouncedSearch = debounce((query) => {
  performSearch(query)
}, 300)

// ✅ İyi: Throttled scroll handlers
const throttledScroll = throttle((event) => {
  handleScroll(event)
}, 100)

// ❌ Kötü: Her render'da yeni function
<input @input="(e) => handleInput(e.target.value)" />
```

### **3. Memory Management**

#### **Timeout ve Interval Tracking**
```javascript
// ✅ İyi: Timeout'ları takip et ve temizle
const activeTimeouts = ref(new Set())
const activeIntervals = ref(new Set())

const createSafeTimeout = (callback, delay) => {
  const timeoutId = setTimeout(() => {
    callback()
    activeTimeouts.value.delete(timeoutId)
  }, delay)
  
  activeTimeouts.value.add(timeoutId)
  return timeoutId
}

// Cleanup
onUnmounted(() => {
  activeTimeouts.value.forEach(clearTimeout)
  activeTimeouts.value.clear()
  activeIntervals.value.forEach(clearInterval)
  activeIntervals.value.clear()
})
```

#### **Event Listener Cleanup**
```javascript
// ✅ İyi: Event listener'ları temizle
const cleanupEventListeners = () => {
  if (centralEmitter) {
    centralEmitter.off(AGORA_EVENTS.USER_JOINED, handleUserJoined)
    centralEmitter.off(AGORA_EVENTS.USER_LEFT, handleUserLeft)
  }
}

onUnmounted(() => {
  cleanupEventListeners()
})
```

#### **Track Management**
```javascript
// ✅ İyi: Track'leri düzgün temizle
const cleanupTrack = (track) => {
  if (track && track.stop) {
    track.stop()
  }
  if (track && track.close) {
    track.close()
  }
}

// Store cleanup
const cleanupTracks = () => {
  Object.values(localTracks.value).forEach(track => {
    if (track) cleanupTrack(track)
  })
  
  remoteTracks.value.forEach(track => {
    if (track) cleanupTrack(track)
  })
}
```

### **4. Network Performance**

#### **Agora SDK Optimizations**
```javascript
// ✅ İyi: Agora config optimizasyonları
export const AGORA_CONFIG = {
  mode: 'rtc',
  codec: 'h264', // H264 daha hızlı
  enableDualStream: false, // Tek stream kullan
  enableAudioRecording: false, // Audio recording kapalı
  enableVideoRecording: false, // Video recording kapalı
  enableHighPerformance: IS_PROD, // Production'da yüksek performans
  enableCloudProxy: false // Cloud proxy kapalı - daha hızlı
}

// Video kalite optimizasyonları
export const VIDEO_CONFIG = {
  encoderConfig: IS_DEV ? '720p_1' : '1080p_1', // Development'ta daha düşük kalite
  bitrateMin: IS_DEV ? 1000 : 2000, // Development'ta daha düşük bitrate
  bitrateMax: IS_DEV ? 2000 : 4000, // Development'ta daha düşük bitrate
  frameRate: IS_DEV ? 24 : 30 // Development'ta daha düşük FPS
}
```

#### **Screen Share Optimizations**
```javascript
// ✅ İyi: Ekran paylaşımı için optimize edilmiş ayarlar
export const SCREEN_SHARE_CONFIG = {
  FAST_START: {
    encoderConfig: '720p_1',      // 1280x720 çözünürlük - daha hızlı
    optimizationMode: 'motion',   // Hareket için optimize
    bitrateMin: 800,              // Minimum bitrate
    bitrateMax: 1500,             // Maksimum bitrate
    frameRate: 15                 // 15 FPS - daha düşük, daha akıcı
  },
  
  LOW_QUALITY: {
    encoderConfig: '480p_1',      // 640x480 çözünürlük
    bitrateMin: 400,              // Çok düşük bitrate
    bitrateMax: 800,              // Çok düşük bitrate
    frameRate: 10                 // 10 FPS
  }
}
```

## 📊 **Performance Monitoring**

### **1. Real-time Metrics**

#### **Network Quality Monitoring**
```javascript
// Ağ kalitesi izleme
const monitorNetworkQuality = async (client) => {
  if (!client) return
  
  try {
    const stats = await client.getTransportStats()
    
    // RTT monitoring
    if (stats.Rtt > 200) {
      logWarn('High RTT detected', { rtt: stats.Rtt })
    }
    
    // Packet loss monitoring
    if (stats.PacketLossRate > 5) {
      logWarn('High packet loss detected', { loss: stats.PacketLossRate })
    }
    
    // Bitrate monitoring
    const audioStats = await client.getLocalAudioStats()
    const videoStats = await client.getLocalVideoStats()
    
    const totalBitrate = Object.values(audioStats).reduce((sum, stat) => 
      sum + (stat.sendBitrate || 0), 0
    ) + Object.values(videoStats).reduce((sum, stat) => 
      sum + (stat.sendBitrate || 0), 0
    )
    
    if (totalBitrate > 4000) {
      logWarn('High bitrate detected', { bitrate: totalBitrate })
    }
  } catch (error) {
    logError(error, { context: 'monitorNetworkQuality' })
  }
}
```

#### **Memory Usage Monitoring**
```javascript
// Memory kullanımı izleme
const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memoryInfo = performance.memory
    
    // Memory limit kontrolü
    if (memoryInfo.usedJSHeapSize > memoryInfo.jsHeapSizeLimit * 0.8) {
      logWarn('High memory usage detected', {
        used: formatFileSize(memoryInfo.usedJSHeapSize),
        limit: formatFileSize(memoryInfo.jsHeapSizeLimit),
        percentage: Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100)
      })
    }
    
    // Memory leak detection
    if (memoryInfo.usedJSHeapSize > previousMemoryUsage * 1.5) {
      logWarn('Potential memory leak detected', {
        previous: formatFileSize(previousMemoryUsage),
        current: formatFileSize(memoryInfo.usedJSHeapSize),
        increase: Math.round(((memoryInfo.usedJSHeapSize - previousMemoryUsage) / previousMemoryUsage) * 100)
      })
    }
    
    previousMemoryUsage = memoryInfo.usedJSHeapSize
  }
}
```

### **2. Performance Profiling**

#### **Custom Performance Marks**
```javascript
// Performance mark'ları ekle
const addPerformanceMarks = () => {
  performance.mark('agora-conference-start')
  performance.mark('agora-client-init-start')
  performance.mark('agora-join-channel-start')
}

const measurePerformance = () => {
  performance.mark('agora-join-channel-end')
  performance.measure('join-channel-duration', 'agora-join-channel-start', 'agora-join-channel-end')
  
  const measure = performance.getEntriesByName('join-channel-duration')[0]
  logInfo('Join channel performance', { duration: measure.duration })
}
```

#### **Performance Observer**
```javascript
// Performance observer ile otomatik monitoring
const setupPerformanceObserver = () => {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'measure') {
        logInfo('Performance measurement', {
          name: entry.name,
          duration: entry.duration,
          startTime: entry.startTime
        })
      }
    })
  })
  
  observer.observe({ entryTypes: ['measure'] })
}
```

## 🔧 **Performance Best Practices**

### **1. Component Optimization**

#### **Lazy Loading**
```javascript
// ✅ İyi: Conditional component loading
const LogModal = computed(() => {
  if (isLogOpen.value) {
    return () => import('./LogModal.vue')
  }
  return null
})

// Template'de
<component :is="LogModal" v-if="isLogOpen" />
```

#### **Virtual Scrolling**
```javascript
// ✅ İyi: Büyük listeler için virtual scrolling
const virtualizedUsers = computed(() => {
  const startIndex = Math.floor(scrollTop.value / itemHeight)
  const endIndex = Math.min(startIndex + visibleItems, allUsers.value.length)
  
  return allUsers.value.slice(startIndex, endIndex)
})
```

### **2. State Management Optimization**

#### **Selective State Updates**
```javascript
// ✅ İyi: Sadece gerekli state'i güncelle
const updateUserStatus = (uid, status) => {
  const userIndex = users.value.findIndex(u => u.uid === uid)
  if (userIndex > -1) {
    users.value[userIndex] = { ...users.value[userIndex], status }
  }
}

// ❌ Kötü: Tüm state'i güncelle
const updateUserStatus = (uid, status) => {
  users.value = users.value.map(u => 
    u.uid === uid ? { ...u, status } : u
  )
}
```

#### **Batch Updates**
```javascript
// ✅ İyi: Batch updates ile performans
const batchUpdateUsers = (updates) => {
  nextTick(() => {
    updates.forEach(({ uid, updates }) => {
      updateUser(uid, updates)
    })
  })
}
```

### **3. Event Optimization**

#### **Event Deduplication**
```javascript
// ✅ İyi: Event deduplication ile gereksiz işlemleri önle
const processedEvents = ref(new Set())

const handleEvent = (eventType, data) => {
  const eventKey = createEventKey(eventType, data)
  
  if (processedEvents.value.has(eventKey)) {
    return false // Event zaten işlendi
  }
  
  processedEvents.value.add(eventKey)
  
  // Event'i işle
  processEvent(eventType, data)
  
  // 5 saniye sonra temizle
  setTimeout(() => {
    processedEvents.value.delete(eventKey)
  }, 5000)
}
```

#### **Debounced Updates**
```javascript
// ✅ İyi: UI updates için debouncing
const debouncedUpdateUI = debounce(() => {
  updateVideoGrid()
  updateControls()
}, 100)

// Event handler'da
const handleUserUpdate = () => {
  // State'i güncelle
  updateUserState()
  
  // UI'ı debounced olarak güncelle
  debouncedUpdateUI()
}
```

## 📈 **Performance Metrics**

### **1. Key Performance Indicators (KPIs)**

#### **Connection Performance**
- **Time to First Frame (TTFF)**: İlk video frame'e kadar geçen süre
- **Join Channel Time**: Kanala katılma süresi
- **Network Latency**: Ağ gecikmesi (RTT)

#### **Stream Quality**
- **Bitrate Stability**: Bitrate kararlılığı
- **Frame Rate Consistency**: FPS tutarlılığı
- **Packet Loss Rate**: Paket kaybı oranı

#### **Resource Usage**
- **Memory Usage**: Bellek kullanımı
- **CPU Usage**: CPU kullanımı
- **Bandwidth Usage**: Bant genişliği kullanımı

### **2. Performance Thresholds**

```javascript
// Performance threshold'ları
export const PERFORMANCE_THRESHOLDS = {
  // Connection
  MAX_JOIN_TIME: 5000,        // 5 saniye
  MAX_RTT: 200,               // 200ms
  MAX_PACKET_LOSS: 5,         // %5
  
  // Quality
  MIN_BITRATE: 500,           // 500 kbps
  MIN_FRAME_RATE: 15,         // 15 FPS
  MAX_MEMORY_USAGE: 80,       // %80
  
  // Responsiveness
  MAX_UI_UPDATE_TIME: 100,    // 100ms
  MAX_EVENT_PROCESSING: 50    // 50ms
}
```

## 🛠️ **Performance Tools**

### **1. Development Tools**

#### **Vue DevTools Performance Tab**
```bash
# Vue DevTools extension'ı yükleyin
# Performance tab'ında component render sürelerini izleyin
```

#### **Chrome DevTools Performance**
```bash
# Performance tab'ında recording yapın
# Flame chart ile CPU usage analizi
# Memory tab'ında memory leak detection
```

### **2. Custom Performance Tools**

#### **Performance Logger**
```javascript
// Custom performance logger
class PerformanceLogger {
  constructor() {
    this.marks = new Map()
    this.measures = new Map()
  }
  
  mark(name) {
    performance.mark(name)
    this.marks.set(name, performance.now())
  }
  
  measure(name, startMark, endMark) {
    performance.measure(name, startMark, endMark)
    const measure = performance.getEntriesByName(name)[0]
    this.measures.set(name, measure.duration)
    
    return measure.duration
  }
  
  getMetrics() {
    return {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures)
    }
  }
}

export const performanceLogger = new PerformanceLogger()
```

## 📊 **Performance Monitoring Dashboard**

### **1. Real-time Metrics Display**

```vue
<template>
  <div class="performance-dashboard">
    <div class="metric-card">
      <h3>Network Quality</h3>
      <div class="metric-value">{{ networkQuality }}/6</div>
      <div class="metric-bar">
        <div class="bar-fill" :style="{ width: `${(networkQuality / 6) * 100}%` }"></div>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Bitrate</h3>
      <div class="metric-value">{{ bitrate }} kbps</div>
      <div class="metric-trend" :class="bitrateTrend">
        {{ bitrateChange }}%
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Memory Usage</h3>
      <div class="metric-value">{{ memoryUsage }}%</div>
      <div class="metric-warning" v-if="memoryUsage > 80">
        ⚠️ High memory usage
      </div>
    </div>
  </div>
</template>
```

### **2. Performance Alerts**

```javascript
// Performance alert sistemi
const setupPerformanceAlerts = () => {
  // Network quality alerts
  watch(networkQuality, (quality) => {
    if (quality < 2) {
      showAlert('Low network quality detected', 'warning')
    }
  })
  
  // Memory usage alerts
  watch(memoryUsage, (usage) => {
    if (usage > 80) {
      showAlert('High memory usage detected', 'error')
    }
  })
  
  // Bitrate alerts
  watch(bitrate, (rate) => {
    if (rate < 500) {
      showAlert('Low bitrate detected', 'warning')
    }
  })
}
```

---

> **💡 İpucu**: Bu performance dokümantasyonu ile projenizin performansını optimize edebilir ve monitoring yapabilirsiniz.

