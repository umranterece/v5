# Vue 3 Agora Video Conference Module - Hızlı Başlangıç

> **Context Engineering** yaklaşımı ile hazırlanmış hızlı başlangıç rehberi

## 🚀 **Hızlı Başlangıç**

Bu rehber, Vue 3 Agora Video Conference Module'ünü projenize entegre etmenizi sağlar.

## 📋 **Gereksinimler**

### **Peer Dependencies**
```json
{
  "vue": "^3.0.0",
  "pinia": "^3.0.0",
  "agora-rtc-sdk-ng": "^4.0.0",
  "mitt": "^3.0.0"
}
```

### **Tarayıcı Desteği**
- ✅ **Chrome** 88+
- ✅ **Firefox** 85+
- ✅ **Safari** 14+
- ✅ **Edge** 88+

## 🔧 **Kurulum**

### **1. Paket Kurulumu**
```bash
npm install rs-agora-module
# veya
yarn add rs-agora-module
```

### **2. Pinia Store Kurulumu**
```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

## 🎯 **Temel Kullanım**

### **1. Basit Konferans Bileşeni**
```vue
<template>
  <div id="app">
    <AgoraConference
      :channelName="channelName"
      :autoJoin="autoJoin"
      :debugMode="debugMode"
      @joined="handleJoined"
      @left="handleLeft"
      @error="handleError"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { AgoraConference } from 'rs-agora-module'

// Konferans ayarları
const channelName = ref('test-channel')
const autoJoin = ref(false)
const debugMode = ref(true)

// Event handlers
const handleJoined = (data) => {
  console.log('Kanala katıldı:', data)
}

const handleLeft = (data) => {
  console.log('Kanaldan ayrıldı:', data)
}

const handleError = (data) => {
  console.error('Hata oluştu:', data)
}
</script>
```

### **2. Composable Kullanımı**
```vue
<template>
  <div class="meeting-controls">
    <button @click="joinChannel">Kanala Katıl</button>
    <button @click="leaveChannel">Kanaldan Ayrıl</button>
    <button @click="toggleCamera">Kamerayı Aç/Kapat</button>
    <button @click="toggleMicrophone">Mikrofonu Aç/Kapat</button>
    
    <div v-if="isConnected">
      <p>Bağlı: {{ channelName }}</p>
      <p>Kullanıcı Sayısı: {{ connectedUsersCount }}</p>
    </div>
  </div>
</template>

<script setup>
import { useMeeting } from 'rs-agora-module'

const {
  joinChannel,
  leaveChannel,
  toggleCamera,
  toggleMicrophone,
  isConnected,
  channelName,
  connectedUsersCount,
  localUser,
  remoteUsers
} = useMeeting()

// Channel join
const handleJoin = async () => {
  try {
    await joinChannel({
      channelName: 'test-channel',
      token: 'your-agora-token',
      uid: 'user-123'
    })
  } catch (error) {
    console.error('Katılım hatası:', error)
  }
}
</script>
```

## 🎨 **Özelleştirme**

### **1. Custom Styling**
```vue
<template>
  <AgoraConference
    :channelName="channelName"
    class="custom-conference"
  />
</template>

<style scoped>
.custom-conference {
  --agora-primary-color: #667eea;
  --agora-secondary-color: #764ba2;
  --agora-background: #1a1a2e;
  --agora-border-radius: 20px;
}
</style>
```

### **2. Custom Controls**
```vue
<template>
  <div class="custom-meeting">
    <AgoraVideo
      :localUser="localUser"
      :remoteUsers="remoteUsers"
      class="video-area"
    />
    
    <CustomControls
      :isConnected="isConnected"
      @join="handleJoin"
      @leave="handleLeave"
    />
  </div>
</template>

<script setup>
import { AgoraVideo, useMeeting } from 'rs-agora-module'
import CustomControls from './CustomControls.vue'

const { localUser, remoteUsers, isConnected, joinChannel, leaveChannel } = useMeeting()
</script>
```

## 🔐 **Token Yönetimi**

### **1. Agora Token Servisi**
```javascript
// services/agoraToken.js
import { createToken } from 'rs-agora-module'

export const getAgoraToken = async (channelName, uid) => {
  try {
    const tokenResult = await createToken(channelName, uid)
    return tokenResult.token
  } catch (error) {
    console.error('Token alınamadı:', error)
    throw error
  }
}
```

### **2. Token ile Katılım**
```vue
<script setup>
import { ref } from 'vue'
import { useMeeting } from 'rs-agora-module'
import { getAgoraToken } from './services/agoraToken'

const { joinChannel } = useMeeting()
const channelName = ref('test-channel')

const handleJoin = async () => {
  try {
    const token = await getAgoraToken(channelName.value, 'user-123')
    
    await joinChannel({
      channelName: channelName.value,
      token: token,
      uid: 'user-123'
    })
  } catch (error) {
    console.error('Katılım hatası:', error)
  }
}
</script>
```

## 📱 **Responsive Tasarım**

### **1. Mobile-First Approach**
```vue
<template>
  <div class="meeting-container">
    <AgoraConference
      :channelName="channelName"
      class="responsive-conference"
    />
  </div>
</template>

<style scoped>
.meeting-container {
  width: 100%;
  height: 100vh;
}

.responsive-conference {
  /* Mobile styles */
  padding: 8px;
  
  /* Tablet styles */
  @media (min-width: 768px) {
    padding: 16px;
  }
  
  /* Desktop styles */
  @media (min-width: 1024px) {
    padding: 24px;
  }
}
</style>
```

## 🎥 **Video Kalitesi Ayarları**

### **1. Quality Presets**
```javascript
const qualityPresets = {
  low: '360p_1',
  medium: '720p_1',
  high: '1080p_1',
  ultra: '1080p_2'
}

const selectedQuality = ref(qualityPresets.medium)
```

### **2. Dynamic Quality Adjustment**
```vue
<script setup>
import { useStreamQuality } from 'rs-agora-module'

const { 
  networkQuality, 
  bitrate, 
  frameRate,
  adjustQuality 
} = useStreamQuality()

// Network kalitesine göre otomatik ayarlama
watch(networkQuality, (quality) => {
  if (quality === 'poor') {
    adjustQuality('low')
  } else if (quality === 'excellent') {
    adjustQuality('high')
  }
})
</script>
```

## 🔍 **Debug Mode**

### **1. Debug Özellikleri**
```vue
<template>
  <AgoraConference
    :channelName="channelName"
    :debugMode="true"
    @joined="handleJoined"
  />
</template>
```

**Debug Mode'da Açılan Özellikler:**
- 📝 **Log Modal**: Gerçek zamanlı log görüntüleme
- ℹ️ **Info Modal**: Toplantı bilgileri ve ağ durumu
- 📊 **Performance Metrics**: Stream kalitesi ve network stats
- 🐛 **Error Tracking**: Detaylı hata bilgileri

### **2. Custom Logging**
```javascript
import { useLogger } from 'rs-agora-module'

const { logUI, logError, trackUserAction } = useLogger()

// UI log
logUI('Kullanıcı kamera açtı', { userId: 'user-123' })

// Error log
logError(new Error('Kamera açılamadı'), { context: 'camera-toggle' })

// User action tracking
trackUserAction('join-channel', { channelName: 'test-channel' })
```

## 🎯 **Event Handling**

### **1. Temel Events**
```vue
<template>
  <AgoraConference
    :channelName="channelName"
    @joined="handleJoined"
    @left="handleLeft"
    @error="handleError"
    @user-joined="handleUserJoined"
    @user-left="handleUserLeft"
    @connection-state-change="handleConnectionChange"
  />
</template>

<script setup>
const handleJoined = (data) => {
  console.log('Kanala katıldı:', data)
}

const handleUserJoined = (user) => {
  console.log('Yeni kullanıcı katıldı:', user)
}

const handleConnectionChange = (state) => {
  console.log('Bağlantı durumu değişti:', state)
}
</script>
```

### **2. Custom Event Handling**
```javascript
import { emitter, AGORA_EVENTS } from 'rs-agora-module'

// Event dinleme
emitter.on(AGORA_EVENTS.USER_JOINED, (user) => {
  console.log('Kullanıcı katıldı:', user)
})

// Custom event gönderme
emitter.emit('custom-event', { data: 'custom-data' })
```

## 🧪 **Test Etme**

### **1. Development Server**
```bash
# Projeyi çalıştır
npm run dev

# HTTPS ile çalıştır (Agora için gerekli)
npm run dev:https
```

### **2. Test Senaryoları**
- ✅ **Kanal Katılımı**: Farklı kanal adları ile test
- ✅ **Cihaz Testi**: Kamera ve mikrofon izinleri
- ✅ **Network Testi**: Farklı network koşulları
- ✅ **Multi-User Testi**: Birden fazla tarayıcı ile test

## 🚨 **Yaygın Sorunlar**

### **1. HTTPS Gereksinimi**
```bash
# Development için self-signed certificate
npm run dev:https

# Production için gerçek SSL certificate
npm run build
npm run preview
```

### **2. Cihaz İzinleri**
```javascript
// Cihaz izinlerini kontrol et
const checkPermissions = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Cihaz izinleri alınamadı:', error)
    return false
  }
}
```

### **3. Network Issues**
```javascript
// Network kalitesini kontrol et
import { useStreamQuality } from 'rs-agora-module'

const { networkQuality, bitrate, frameRate } = useStreamQuality()

watch(networkQuality, (quality) => {
  if (quality === 'poor') {
    console.warn('Network kalitesi düşük')
  }
})
```

## 📚 **Sonraki Adımlar**

### **1. Gelişmiş Özellikler**
- [📹 Recording](./RECORDING.md) - Cloud recording özellikleri
- [🖥️ Screen Sharing](./SCREEN_SHARING.md) - Ekran paylaşımı
- [🎨 UI Components](./UI_COMPONENTS.md) - Özelleştirilebilir UI
- [📊 Performance](./PERFORMANCE.md) - Performance optimizasyonları

### **2. Mimari Detayları**
- [🏗️ Architecture](./ARCHITECTURE.md) - Detaylı mimari açıklamaları
- [🔧 Development](./DEVELOPMENT.md) - Geliştirici rehberi
- [📚 API Reference](./API_REFERENCE.md) - Detaylı API dokümantasyonu

### **3. Deployment**
- [🚀 Deployment](./DEPLOYMENT.md) - Production deployment rehberi
- [🔒 Security](./SECURITY.md) - Güvenlik rehberi
- [🧪 Testing](./TESTING.md) - Test stratejileri

---

> **Not**: Bu hızlı başlangıç rehberi, projenin **Context Engineering** yaklaşımına uygun olarak hazırlanmıştır. Daha detaylı bilgi için ilgili dokümantasyon dosyalarını inceleyin.

