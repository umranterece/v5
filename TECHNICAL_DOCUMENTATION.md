# Agora Video Konferans Uygulaması - Teknik Dokümantasyon

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Mimari Yapı](#mimari-yapı)
3. [Teknoloji Stack'i](#teknoloji-stacki)
4. [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
5. [Modül Yapısı](#modül-yapısı)
6. [API Dokümantasyonu](#api-dokümantasyonu)
7. [Event Sistemi](#event-sistemi)
8. [Ağ Kalitesi İzleme](#ağ-kalitesi-izleme)
9. [Cloud Recording](#cloud-recording)
10. [Geliştirme Rehberi](#geliştirme-rehberi)
11. [Hata Ayıklama](#hata-ayıklama)
12. [Performans Optimizasyonu](#performans-optimizasyonu)

---

## 🎯 Proje Genel Bakış

Bu proje, **Agora SDK** kullanarak geliştirilmiş modern bir video konferans uygulamasıdır. Vue 3 Composition API ile yazılmış, modüler mimariye sahip ve gerçek zamanlı ağ kalitesi izleme özellikleri içerir.

### 🚀 Özellikler

- ✅ **Gerçek Zamanlı Video Konferans**
- ✅ **Ekran Paylaşımı**
- ✅ **Ağ Kalitesi İzleme**
- ✅ **Cloud Recording**
- ✅ **Modüler Mimari**
- ✅ **Event-Driven Architecture**
- ✅ **Responsive UI**
- ✅ **Türkçe Arayüz**

---

## 🏗️ Mimari Yapı

### Genel Mimari

```
src/
├── modules/
│   └── agora/                    # Agora modülü
│       ├── components/           # UI bileşenleri
│       ├── composables/          # Vue 3 composables
│       ├── services/             # API ve yardımcı servisler
│       ├── store/                # State yönetimi
│       ├── constants.js          # Sabitler
│       └── centralEmitter.js     # Merkezi event sistemi
├── assets/                       # Statik dosyalar
└── App.vue                       # Ana uygulama
```

### Mimari Prensipleri

1. **Modülerlik**: Her özellik ayrı modülde
2. **Separation of Concerns**: UI, logic ve data ayrımı
3. **Event-Driven**: Merkezi event sistemi
4. **Composition API**: Vue 3 modern yaklaşımı
5. **Type Safety**: JSDoc ile tip güvenliği

---

## 🛠️ Teknoloji Stack'i

### Frontend
- **Vue 3.4+**: Modern reactive framework
- **Composition API**: Functional programming yaklaşımı
- **Vite**: Hızlı build tool
- **Tailwind CSS**: Utility-first CSS framework

### Video Konferans
- **Agora SDK 4.x**: Gerçek zamanlı iletişim
- **WebRTC**: Tarayıcı tabanlı iletişim

### State Management
- **Vue Reactive**: Built-in reactive system
- **Custom Store**: Modüler state yönetimi

### Event System
- **Mitt**: Lightweight event emitter
- **Central Event Bus**: Merkezi event yönetimi

---

## ⚙️ Kurulum ve Çalıştırma

### Gereksinimler

- Node.js 18+
- npm veya yarn
- Modern tarayıcı (Chrome, Firefox, Safari, Edge)

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Build'i önizle
npm run preview
```

### Environment Variables

```bash
# .env dosyası oluşturun
VITE_AGORA_APP_ID=your_agora_app_id
VITE_AGORA_TOKEN_SERVER=your_token_server_url
```

---

## 📁 Modül Yapısı

### 1. Components (`src/modules/agora/components/`)

#### AgoraVideo.vue
Ana video konferans bileşeni
- Video grid yönetimi
- Kullanıcı listesi
- Responsive tasarım

#### AgoraControls.vue
Video kontrolleri
- Kamera açma/kapama
- Mikrofon açma/kapama
- Ekran paylaşımı

#### RecordingControls.vue
Kayıt kontrolleri
- Kayıt başlatma/durdurma
- Dosya indirme
- Kayıt durumu

#### LogModal.vue
Log görüntüleme
- Gerçek zamanlı loglar
- Filtreleme
- Export özelliği

### 2. Composables (`src/modules/agora/composables/`)

#### useMeeting.js
Ana orchestrator composable
- Tüm alt composable'ları koordine eder
- Kanala katılma/ayrılma
- State yönetimi

#### useVideo.js
Video işlemleri
- Video client yönetimi
- Track oluşturma
- Remote user yönetimi

#### useScreenShare.js
Ekran paylaşımı
- Ekran seçimi
- Screen track yönetimi
- Optimizasyon

#### useStreamQuality.js
Ağ kalitesi izleme
- Gerçek zamanlı metrikler
- Kalite hesaplama
- Optimizasyon

#### useTrackManagement.js
Track yönetimi
- Audio/Video track oluşturma
- Cihaz kontrolü
- Fallback mekanizmaları

#### useRecording.js
Cloud recording
- Kayıt başlatma/durdurma
- API entegrasyonu
- Dosya yönetimi

### 3. Services (`src/modules/agora/services/`)

#### logger.js
Logging servisi
- Kategorize edilmiş loglar
- Performance tracking
- User action tracking

#### tokenService.js
Token yönetimi
- Agora token oluşturma
- Server-side entegrasyon
- Token yenileme

#### recordingService.js
Recording API
- Cloud recording başlatma
- Kayıt durumu kontrolü
- Dosya indirme

### 4. Store (`src/modules/agora/store/`)

#### agora.js
Merkezi state yönetimi
- Client durumları
- Kullanıcı bilgileri
- Track durumları

---

## 🔌 API Dokümantasyonu

### useMeeting Composable

```javascript
const {
  // State
  isConnected,
  isInitialized,
  localUser,
  remoteUsers,
  allUsers,
  connectedUsersCount,
  
  // Methods
  joinChannel,
  leaveChannel,
  toggleCamera,
  toggleMicrophone,
  cleanup
} = useMeeting()
```

#### joinChannel(channelName)
Kanala katılma
```javascript
await joinChannel('test-channel')
```

#### leaveChannel()
Kanaldan ayrılma
```javascript
await leaveChannel()
```

### useVideo Composable

```javascript
const {
  // State
  isJoining,
  isLeaving,
  
  // Methods
  joinChannel,
  leaveChannel,
  toggleCamera,
  toggleMicrophone,
  checkDeviceStatus
} = useVideo(agoraStore)
```

### useScreenShare Composable

```javascript
const {
  // State
  isScreenSharing,
  screenShareUser,
  
  // Methods
  startScreenShare,
  stopScreenShare,
  toggleScreenShare
} = useScreenShare(agoraStore)
```

### useStreamQuality Composable

```javascript
const {
  // State
  networkQuality,
  bitrate,
  frameRate,
  packetLoss,
  rtt,
  qualityLevel,
  
  // Methods
  startMonitoring,
  stopMonitoring
} = useStreamQuality()
```

---

## 📡 Event Sistemi

### Merkezi Event Emitter

```javascript
import { centralEmitter } from '../centralEmitter.js'

// Event dinleme
centralEmitter.on('USER_JOINED', (data) => {
  console.log('Kullanıcı katıldı:', data)
})

// Event gönderme
centralEmitter.emit('USER_JOINED', { uid: 123, name: 'John' })
```

### Event Türleri

#### Kullanıcı Event'leri
- `USER_JOINED`: Kullanıcı kanala katıldı
- `USER_LEFT`: Kullanıcı kanaldan ayrıldı
- `USER_PUBLISHED`: Kullanıcı yayın başlattı
- `USER_UNPUBLISHED`: Kullanıcı yayını durdurdu

#### Track Event'leri
- `LOCAL_AUDIO_READY`: Yerel ses hazır
- `LOCAL_VIDEO_READY`: Yerel video hazır
- `REMOTE_AUDIO_READY`: Uzak ses hazır
- `REMOTE_VIDEO_READY`: Uzak video hazır

#### Bağlantı Event'leri
- `CONNECTION_STATE_CHANGE`: Bağlantı durumu değişti

#### Recording Event'leri
- `RECORDING_STARTED`: Kayıt başladı
- `RECORDING_STOPPED`: Kayıt durdu
- `RECORDING_ERROR`: Kayıt hatası

---

## 📊 Ağ Kalitesi İzleme

### Metrikler

#### Network Quality (0-6)
- **0-1**: Çok kötü
- **2-3**: Kötü
- **4**: Orta
- **5-6**: İyi/Mükemmel

#### Bitrate (Kbps)
- **< 200**: Düşük
- **200-500**: Orta
- **500-1000**: İyi
- **> 1000**: Mükemmel

#### Frame Rate (FPS)
- **< 10**: Düşük
- **10-15**: Orta
- **15-20**: İyi
- **> 20**: Mükemmel

### Kalite Seviyesi Hesaplama

```javascript
const calculateQualityLevel = (networkQuality, bitrate, frameRate) => {
  if (networkQuality >= 5 && bitrate > 1000 && frameRate > 20) {
    return 'mükemmel'
  } else if (networkQuality >= 3 && bitrate > 500 && frameRate > 15) {
    return 'iyi'
  } else if (networkQuality >= 1 && bitrate > 200 && frameRate > 10) {
    return 'orta'
  } else {
    return 'düşük'
  }
}
```

### Gerçek Zamanlı İzleme

```javascript
// 2 saniyede bir güncelleme
setInterval(async () => {
  const stats = await fetchRealStats(client)
  updateQuality(stats)
}, 2000)
```

---

## 🎥 Cloud Recording

### Özellikler

- ✅ **Otomatik kayıt başlatma**
- ✅ **Çoklu format desteği**
- ✅ **Dosya indirme**
- ✅ **Kayıt durumu takibi**

### API Endpoints

#### Kayıt Başlatma
```javascript
POST /api/recording/start
{
  "channelName": "test-channel",
  "uid": 123,
  "token": "agora_token"
}
```

#### Kayıt Durdurma
```javascript
POST /api/recording/stop
{
  "sid": "recording_sid"
}
```

### Kullanım

```javascript
const {
  isRecording,
  recordingFiles,
  startRecording,
  stopRecording,
  downloadRecording
} = useRecording()

// Kayıt başlat
await startRecording(channelName)

// Kayıt durdur
await stopRecording()

// Dosya indir
await downloadRecording(fileUrl)
```

---

## 👨‍💻 Geliştirme Rehberi

### Kod Standartları

#### 1. Dosya İsimlendirme
- **Composables**: `use[Feature].js`
- **Components**: `PascalCase.vue`
- **Services**: `camelCase.js`

#### 2. Import Sırası
```javascript
// 1. Vue imports
import { ref, computed } from 'vue'

// 2. Third-party libraries
import AgoraRTC from 'agora-rtc-sdk-ng'

// 3. Internal modules
import { centralEmitter } from '../centralEmitter.js'
import { AGORA_EVENTS } from '../constants.js'

// 4. Services
import { logger } from '../services/logger.js'
```

#### 3. JSDoc Kullanımı
```javascript
/**
 * Kullanıcıyı kanala ekler
 * @param {string} channelName - Kanal adı
 * @param {number} uid - Kullanıcı ID'si
 * @returns {Promise<Object>} Katılım sonucu
 */
const joinChannel = async (channelName, uid) => {
  // Implementation
}
```

### Yeni Özellik Ekleme

#### 1. Composable Oluşturma
```javascript
// src/modules/agora/composables/useNewFeature.js
import { ref, computed } from 'vue'
import { centralEmitter } from '../centralEmitter.js'
import { logger } from '../services/logger.js'

export function useNewFeature() {
  const state = ref(null)
  
  const computedValue = computed(() => {
    // Computation logic
  })
  
  const method = async () => {
    try {
      // Implementation
      logger.info('Feature executed successfully')
    } catch (error) {
      logger.error('Feature failed', error)
    }
  }
  
  return {
    state,
    computedValue,
    method
  }
}
```

#### 2. Component Oluşturma
```vue
<!-- src/modules/agora/components/NewFeature.vue -->
<template>
  <div class="new-feature">
    <!-- Template -->
  </div>
</template>

<script setup>
import { useNewFeature } from '../composables/useNewFeature.js'

const { state, method } = useNewFeature()
</script>

<style scoped>
.new-feature {
  /* Styles */
}
</style>
```

#### 3. Event Ekleme
```javascript
// constants.js
export const NEW_FEATURE_EVENTS = {
  FEATURE_STARTED: 'new-feature-started',
  FEATURE_COMPLETED: 'new-feature-completed',
  FEATURE_ERROR: 'new-feature-error'
}

// centralEmitter.js
export const emitNewFeatureEvent = (eventType, data) => {
  centralEmitter.emit(eventType, {
    ...data,
    timestamp: Date.now()
  })
}
```

### Testing

#### Unit Test Örneği
```javascript
// tests/composables/useMeeting.test.js
import { describe, it, expect, vi } from 'vitest'
import { useMeeting } from '@/modules/agora/composables/useMeeting'

describe('useMeeting', () => {
  it('should join channel successfully', async () => {
    const { joinChannel, isConnected } = useMeeting()
    
    await joinChannel('test-channel')
    
    expect(isConnected.value).toBe(true)
  })
})
```

---

## 🐛 Hata Ayıklama

### Log Sistemi

#### Log Kategorileri
```javascript
export const LOG_CATEGORIES = {
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  SCREEN: 'SCREEN',
  NETWORK: 'NETWORK',
  RECORDING: 'RECORDING',
  AGORA: 'AGORA',
  UI: 'UI'
}
```

#### Log Seviyeleri
```javascript
logger.info('Bilgi mesajı', data)
logger.warn('Uyarı mesajı', data)
logger.error('Hata mesajı', error)
logger.debug('Debug mesajı', data)
```

### Hata Ayıklama Araçları

#### 1. LogModal
- Gerçek zamanlı log görüntüleme
- Filtreleme ve arama
- Log export

#### 2. Browser DevTools
```javascript
// Console'da logları görüntüle
console.log('Debug info:', data)

// Network tab'ında API çağrılarını izle
// Performance tab'ında performansı analiz et
```

#### 3. Agora Console
- Agora Dashboard'da kanal durumunu izle
- Kullanıcı bağlantılarını kontrol et
- API kullanımını takip et

### Yaygın Hatalar ve Çözümleri

#### 1. "Cannot read properties of undefined"
```javascript
// Hatalı
centralEmitter.emit('EVENT', data)

// Doğru
import { centralEmitter } from '../centralEmitter.js'
centralEmitter.emit('EVENT', data)
```

#### 2. "Track is not valid"
```javascript
// Track doğrulama
const isValid = isTrackValid(track)
if (!isValid) {
  logger.warn('Track geçersiz, yeniden oluşturuluyor')
  // Fallback logic
}
```

#### 3. "Network quality not updating"
```javascript
// Monitoring başlatma kontrolü
if (!isMonitoring.value) {
  startMonitoring(client)
}
```

---

## ⚡ Performans Optimizasyonu

### 1. Lazy Loading
```javascript
// Composable'ları lazy load et
const useHeavyFeature = () => import('./useHeavyFeature.js')
```

### 2. Debouncing
```javascript
// Hızlı event'leri debounce et
const debouncedFunction = debounce(originalFunction, 300)
```

### 3. Memory Management
```javascript
// Component unmount'ta cleanup
onUnmounted(() => {
  clearInterval(timer)
  cleanupTracks()
  stopMonitoring()
})
```

### 4. Track Optimizasyonu
```javascript
// Düşük kalite durumunda optimizasyon
if (networkQuality.value < 2) {
  track.setEncoderConfiguration({
    bitrateMin: 200,
    bitrateMax: 400,
    frameRate: 10
  })
}
```

### 5. Event Listener Temizleme
```javascript
// Event listener'ları temizle
client.off('user-joined')
client.off('user-left')
```

---

## 📚 Ek Kaynaklar

### Dokümantasyon
- [Agora Web SDK](https://docs.agora.io/en/Video/API%20Reference/web/index.html)
- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)

### Örnekler
- [Agora Sample Apps](https://github.com/AgoraIO-Community/AgoraWebSDK-NG)
- [Vue 3 Examples](https://github.com/vuejs/examples)

### Topluluk
- [Agora Community](https://www.agora.io/en/community/)
- [Vue.js Community](https://vuejs.org/community/)

---

## 🤝 Katkıda Bulunma

### Pull Request Süreci
1. Feature branch oluştur
2. Değişiklikleri yap
3. Test'leri çalıştır
4. PR aç ve açıklama yaz

### Commit Mesajları
```
feat: yeni özellik eklendi
fix: hata düzeltildi
docs: dokümantasyon güncellendi
style: kod formatı düzeltildi
refactor: kod refactor edildi
test: test eklendi
chore: build/config güncellendi
```

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

## 📞 İletişim

- **Geliştirici**: [İsim]
- **Email**: [email@example.com]
- **GitHub**: [github.com/username]

---

*Bu dokümantasyon sürekli güncellenmektedir. Son güncelleme: 2025-01-09* 