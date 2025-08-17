# Architecture - RS Agora Module

Bu dokümantasyon, RS Agora Module'ün mimari yapısını ve tasarım kararlarını detaylandırır.

## 🏗️ Genel Mimari

### Modüler Yapı
Proje, **barrel export pattern** kullanarak tutarlı bir modül yapısı sunar:

```
src/modules/agora/
├── index.js              # Ana export noktası
├── components/           # Vue bileşenleri
├── composables/          # Vue composables
├── constants.js          # Sabitler ve konfigürasyon
├── services/             # Servis katmanı
├── store/                # Pinia store'ları
└── utils/                # Yardımcı fonksiyonlar
```

### Barrel Export Pattern
Her modül kendi `index.js` dosyasına sahiptir ve tüm public API'ları tek noktadan export eder:

```javascript
// src/modules/agora/index.js
export { AgoraConference, AgoraVideo } from './components/core'
export { AgoraControls, RecordingControls } from './components/controls'
export * from './composables'
export * from './services'
export * from './store'
export * from './constants'
export * from './utils'
```

## 🎯 Core Components

### AgoraConference.vue
Ana konferans bileşeni - tüm video konferans işlemlerini koordine eder:

- **JoinForm**: Kanal katılım formu
- **AgoraVideo**: Video görüntüleme alanı
- **AgoraControls**: Kontrol butonları
- **Modals**: Log, Info, Settings modalları

### AgoraVideo.vue
Video görüntüleme ve layout yönetimi:

- **Dynamic Layouts**: Grid, Spotlight, Presentation
- **Layout Switching**: Modal ile layout değiştirme
- **Settings Integration**: Video ayarları

## 🔄 State Management

### Pinia Store Architecture
Merkezi state yönetimi için Pinia kullanılır:

#### useAgoraStore
```javascript
// Video ve ekran paylaşımı client'ları
clients: {
  video: { client, isConnected, isInitialized },
  screen: { client, isConnected, isInitialized }
}

// Kullanıcı yönetimi
users: {
  local: { video, screen },
  remote: [] // Tüm uzak kullanıcılar
}

// Track yönetimi
tracks: {
  local: { video: { audio, video }, screen: { video } },
  remote: new Map() // UID -> { audio, video, screen }
}
```

#### useLayoutStore
Layout yönetimi için ayrı store:

```javascript
currentLayout: 'grid' | 'spotlight' | 'presentation'
currentLayoutInfo: { name, description, icon }
```

## 🎨 Layout System

### Layout Components
Her layout kendi bileşenine sahiptir:

1. **GridLayout.vue**: Tüm katılımcıları eşit boyutta gösterir
2. **SpotlightLayout.vue**: Ana konuşmacıyı büyük, diğerlerini sidebar'da gösterir
3. **PresentationLayout.vue**: Sunum odaklı, ekran paylaşımı için optimize edilmiş

### Layout Switching
Layout değiştirme modal üzerinden yapılır:

```javascript
// LayoutModal.vue
const layouts = [
  { id: 'grid', name: 'Grid', description: 'Tüm katılımcıları eşit göster' },
  { id: 'spotlight', name: 'Spotlight', description: 'Ana konuşmacıyı vurgula' },
  { id: 'presentation', name: 'Sunum', description: 'Sunum odaklı görünüm' }
]
```

## 🔌 Composable Architecture

### useVideo.js
Video client yönetimi:

- **Client Initialization**: Agora client başlatma
- **Channel Management**: Kanal katılım/ayrılma
- **Track Management**: Video/ses track'leri
- **Event Handling**: Agora event'leri

### useScreenShare.js
Ekran paylaşımı yönetimi:

- **Dual Client System**: Ayrı Agora client
- **Track Management**: Ekran track'leri
- **Quality Optimization**: Ekran paylaşımı kalite ayarları
- **Fallback Handling**: Düşük kalite fallback

### useMeeting.js
Top-level koordinasyon:

- **Composable Integration**: Tüm composable'ları birleştirir
- **State Coordination**: Store state senkronizasyonu
- **Error Handling**: Merkezi hata yönetimi

## 🎥 Video System

### Dual Client Architecture
Video ve ekran paylaşımı için ayrı client'lar:

```javascript
// Video client - normal video konferans
const videoClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' })

// Screen share client - ekran paylaşımı
const screenClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' })
```

### Track Management
Akıllı track yönetimi:

```javascript
// Local tracks
localTracks: {
  video: { audio: AudioTrack, video: VideoTrack },
  screen: { video: VideoTrack }
}

// Remote tracks
remoteTracks: Map<UID, { audio, video, screen }>
```

## 🎛️ Control System

### AgoraControls.vue
Merkezi kontrol bileşeni:

- **Camera Toggle**: Kamera açma/kapama
- **Microphone Toggle**: Mikrofon açma/kapama
- **Screen Share**: Ekran paylaşımı başlatma/durdurma
- **Layout Switch**: Layout değiştirme
- **Settings**: Video ayarları

### Recording Controls
Kayıt kontrolü (opsiyonel):

```javascript
// RecordingControls.vue
const recordingState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  fileUrl: null
}
```

## 🔧 Service Layer

### Token Service
Agora token yönetimi:

```javascript
// tokenService.js
export const createToken = async (channelName, uid) => {
  const response = await fetch(API_ENDPOINTS.CREATE_TOKEN, {
    method: 'POST',
    body: JSON.stringify({ channelName, uid })
  })
  return response.json()
}
```

### Logger Service
Kapsamlı logging sistemi:

```javascript
// logger.js
export const logger = {
  info: (category, message, data) => { /* ... */ },
  error: (category, message, data) => { /* ... */ },
  warn: (category, message, data) => { /* ... */ },
  trackPerformance: (name, fn) => { /* ... */ },
  trackUserAction: (action, details) => { /* ... */ }
}
```

## 🚀 Performance Optimizations

### Memory Leak Prevention
Aktif timeout ve interval takibi:

```javascript
const activeTimeouts = ref(new Set())
const activeIntervals = ref(new Set())

const createSafeTimeout = (callback, delay) => {
  const timeoutId = setTimeout(() => {
    activeTimeouts.value.delete(timeoutId)
    callback()
  }, delay)
  activeTimeouts.value.add(timeoutId)
  return timeoutId
}
```

### Track Cleanup
Otomatik track temizleme:

```javascript
const cleanupTrack = (track) => {
  if (track && track.stop) {
    track.stop()
    track.close()
  }
}
```

### Quality Optimization
Dinamik kalite ayarları:

```javascript
// constants.js
export const VIDEO_CONFIG = {
  encoderConfig: IS_DEV ? '720p_1' : '1080p_1',
  bitrateMin: IS_DEV ? 1000 : 2000,
  bitrateMax: IS_DEV ? 2000 : 4000,
  frameRate: IS_DEV ? 24 : 30
}
```

## 🔄 Event System

### Central Event Emitter
Merkezi event yönetimi:

```javascript
// centralEmitter.js
export const centralEmitter = mitt()

// Event types
export const AGORA_EVENTS = {
  CLIENT_INITIALIZED: 'client-initialized',
  CHANNEL_JOINED: 'channel-joined',
  USER_JOINED: 'user-joined',
  REMOTE_SCREEN_READY: 'remote-screen-ready'
}
```

### Event Deduplication
Tekrarlanan event'leri önleme:

```javascript
// eventDeduplication.js
export const createEventDeduplicator = (timeout = 1000) => {
  const processedEvents = new Set()
  return (eventId, callback) => {
    if (!processedEvents.has(eventId)) {
      processedEvents.add(eventId)
      callback()
      setTimeout(() => processedEvents.delete(eventId), timeout)
    }
  }
}
```

## 🎯 Error Handling

### User-Friendly Errors
Kullanıcı dostu hata mesajları:

```javascript
// constants.js
export const USER_FRIENDLY_ERRORS = {
  CAMERA_PERMISSION_DENIED: 'Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini verin.',
  DEVICE_NOT_FOUND: 'Kamera veya mikrofon bulunamadı. Lütfen cihazlarınızı kontrol edin.',
  NETWORK_ERROR: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.'
}
```

### Error Recovery
Otomatik hata kurtarma:

```javascript
// Retry mechanism
const retryOperation = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

## 📱 Responsive Design

### Mobile-First Approach
Mobil öncelikli tasarım:

```css
/* Base styles for mobile */
.video-grid {
  grid-template-columns: 1fr;
  gap: 8px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
}
```

### Touch-Friendly Controls
Dokunmatik cihazlar için optimize edilmiş kontroller:

```javascript
// Touch event handling
const handleTouchStart = (event) => {
  // Touch-specific logic
}

const handleTouchEnd = (event) => {
  // Touch-specific logic
}
```

## 🔒 Security Considerations

### Token Management
Güvenli token yönetimi:

```javascript
// Token expiration handling
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}
```

### Permission Handling
Cihaz izin yönetimi:

```javascript
// Device permission check
const checkDevicePermissions = async () => {
  const videoPermission = await navigator.permissions.query({ name: 'camera' })
  const audioPermission = await navigator.permissions.query({ name: 'microphone' })
  
  return {
    camera: videoPermission.state,
    microphone: audioPermission.state
  }
}
```

## 🧪 Testing Strategy

### Component Testing
Vue bileşen testleri:

```javascript
// Component test example
import { mount } from '@vue/test-utils'
import AgoraConference from '@/components/AgoraConference.vue'

describe('AgoraConference', () => {
  it('renders join form when not connected', () => {
    const wrapper = mount(AgoraConference)
    expect(wrapper.find('.join-form').exists()).toBe(true)
  })
})
```

### Composable Testing
Composable testleri:

```javascript
// Composable test example
import { useVideo } from '@/composables/useVideo'
import { createPinia, setActivePinia } from 'pinia'

describe('useVideo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('initializes with correct default state', () => {
    const { isJoining, isLeaving } = useVideo()
    expect(isJoining.value).toBe(false)
    expect(isLeaving.value).toBe(false)
  })
})
```

## 🚀 Deployment

### Build Configuration
Vite tabanlı build sistemi:

```javascript
// vite.config.js
export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2015',
    lib: {
      entry: 'src/modules/agora/index.js',
      name: 'RSAgoraModule',
      formats: ['es', 'umd']
    }
  }
})
```

### Environment Configuration
Ortam bazlı konfigürasyon:

```javascript
// constants.js
export const IS_DEV = false
export const IS_PROD = true

export const API_ENDPOINTS = {
  CREATE_TOKEN: IS_DEV 
    ? 'https://dev-api.example.com/token'
    : 'https://api.example.com/token'
}
```

---

Bu mimari, modern web geliştirme prensiplerine uygun olarak tasarlanmış ve production ortamında kullanıma hazırdır.
