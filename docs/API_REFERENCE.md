# API Reference - RS Agora Module

Bu dokümantasyon, RS Agora Module'ün tüm public API'larını detaylandırır.

## 📦 Module Exports

### Main Components
```javascript
import { 
  AgoraConference,
  AgoraVideo 
} from 'rs-agora-module'
```
  
### Control Components
```javascript
import { 
  AgoraControls,
  RecordingControls 
} from 'rs-agora-module'
```
  
### Modal Components
```javascript
import { 
  LogModal,
  InfoModal,
  SettingsModal 
} from 'rs-agora-module'
```
  
### Video Components
```javascript
import { 
  VideoGrid,
  VideoItem,
  StreamQualityBar 
} from 'rs-agora-module'
```

### Form Components
```javascript
import { JoinForm } from 'rs-agora-module'
```

### Composables
```javascript
import { 
  useMeeting,
  useVideo,
  useScreenShare,
  useRecording,
  useStreamQuality,
  useTrackManagement,
  useLogger
} from 'rs-agora-module'
```
  
### Services
```javascript
import { 
  createToken,
  logger,
  startRecording,
  stopRecording
} from 'rs-agora-module'
```
  
### Store
```javascript
import { 
  useAgoraStore,
  useLayoutStore
} from 'rs-agora-module'
```
  
### Constants
```javascript
import { 
  AGORA_EVENTS,
  USER_FRIENDLY_ERRORS,
  VIDEO_CONFIG,
  SCREEN_SHARE_CONFIG
} from 'rs-agora-module'
```

### Utils
```javascript
import { 
  centralEmitter,
  createSafeTimeout,
  getUserInitials
} from 'rs-agora-module'
```

## 🎯 Core Components API

### AgoraConference.vue

Ana konferans bileşeni - tüm video konferans işlemlerini koordine eder.

#### Props
```javascript
// Props yok - tüm state internal olarak yönetilir
```

#### Events
```javascript
// Events yok - tüm işlemler internal olarak yapılır
```

#### Slots
```javascript
// Slots yok - tüm içerik internal olarak render edilir
```

#### Usage
```vue
<template>
  <AgoraConference />
</template>

<script setup>
import { AgoraConference } from 'rs-agora-module'
</script>
```

### AgoraVideo.vue

Video görüntüleme ve layout yönetimi bileşeni.

#### Props
```javascript
{
  centralEmitter: { type: Object, default: () => ({}) },
  localUser: { type: Object, default: () => ({}) },
  remoteUsers: { type: Array, default: () => [] },
  allUsers: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  remoteTracks: { type: Object, default: () => new Map() },
  logUI: { type: Function, default: () => {} },
  logError: { type: Function, default: () => {} }
}
```

#### Events
```javascript
{
  'set-video-ref': (el, uid) => void,
  'set-local-video-ref': (el) => void,
  'set-local-screen-ref': (el) => void,
  'video-click': (user) => void
}
```

#### Usage
```vue
<template>
  <AgoraVideo
    :centralEmitter="centralEmitter"
    :localUser="localUser"
    :remoteUsers="remoteUsers"
    :allUsers="allUsers"
    :localTracks="localTracks"
    :remoteTracks="remoteTracks"
    :logUI="logUI"
    :logError="logError"
    @set-video-ref="handleSetVideoRef"
    @video-click="handleVideoClick"
  />
</template>
```

## 🎨 Layout Components API

### GridLayout.vue

Tüm katılımcıları eşit boyutta gösteren grid layout.

#### Props
```javascript
{
  users: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  localVideoRef: { type: Object, default: null },
  localScreenRef: { type: Object, default: null },
  logUI: { type: Function, default: () => {} }
}
```

#### Events
```javascript
{
  'video-click': (user) => void,
  'set-video-ref': (el, uid) => void,
  'set-local-video-ref': (el) => void,
  'set-local-screen-ref': (el) => void
}
```

### SpotlightLayout.vue

Ana konuşmacıyı büyük gösteren, diğerlerini sidebar'da listeleyen layout.

#### Props
```javascript
{
  users: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  localVideoRef: { type: Object, default: null },
  localScreenRef: { type: Object, default: null },
  logUI: { type: Function, default: () => {} }
}
```

#### Events
```javascript
{
  'video-click': (user) => void,
  'set-video-ref': (el, uid) => void,
  'set-local-video-ref': (el) => void,
  'set-local-screen-ref': (el) => void
}
```

#### Features
- **Main Speaker**: Ana konuşmacı büyük gösterilir
- **Sidebar**: Diğer katılımcılar sidebar'da listelenir
- **Toggle**: Sidebar açılıp kapatılabilir
- **Responsive**: Mobil ve desktop uyumlu

### PresentationLayout.vue

Sunum odaklı, ekran paylaşımı için optimize edilmiş layout.

#### Props
```javascript
{
  users: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  localVideoRef: { type: Object, default: null },
  localScreenRef: { type: Object, default: null },
  logUI: { type: Function, default: () => {} }
}
```

#### Events
```javascript
{
  'video-click': (user) => void,
  'set-video-ref': (el, uid) => void,
  'set-local-video-ref': (el) => void,
  'set-local-screen-ref': (el) => void
}
```

#### Features
- **Presentation Area**: Ana sunum alanı
- **Floating Sidebar**: Katılımcılar floating sidebar'da
- **Screen Share Focus**: Ekran paylaşımı öncelikli
- **Collapsible**: Sidebar gizlenebilir

## 🎛️ Control Components API

### AgoraControls.vue

Merkezi kontrol bileşeni - kamera, mikrofon, ekran paylaşımı kontrolleri.

#### Props
```javascript
{
  channelName: { type: String, default: 'test' },
  isConnected: { type: Boolean, default: false },
  isLocalVideoOff: { type: Boolean, default: false },
  isLocalAudioMuted: { type: Boolean, default: false },
  canUseCamera: { type: Boolean, default: true },
  canUseMicrophone: { type: Boolean, default: true },
  connectedUsersCount: { type: Number, default: 0 },
  isJoining: { type: Boolean, default: false },
  isLeaving: { type: Boolean, default: false },
  onJoin: { type: Function, default: () => {} },
  onLeave: { type: Function, default: () => {} },
  onToggleCamera: { type: Function, default: () => {} },
  onToggleMicrophone: { type: Function, default: () => {} },
  isScreenSharing: { type: Boolean, default: false },
  onToggleScreenShare: { type: Function, default: () => {} },
  supportsScreenShare: { type: Boolean, default: true },
  networkQualityLevel: { type: String, default: 'unknown' },
  networkQualityColor: { type: String, default: '#666' },
  networkBitrate: { type: Number, default: 0 },
  networkFrameRate: { type: Number, default: 0 },
  networkRtt: { type: Number, default: 0 },
  networkPacketLoss: { type: Number, default: 0 },
  logUI: { type: Function, default: () => {} },
  logError: { type: Function, default: () => {} },
  trackUserAction: { type: Function, default: () => {} },
  onOpenSettings: { type: Function, default: () => {} },
  onOpenLayoutModal: { type: Function, default: () => {} }
}
```

#### Events
```javascript
// Events yok - tüm işlemler prop callback'ler ile yapılır
```

#### Features
- **Camera Toggle**: Kamera açma/kapama
- **Microphone Toggle**: Mikrofon açma/kapama
- **Screen Share**: Ekran paylaşımı başlatma/durdurma
- **Layout Switch**: Layout değiştirme butonu
- **Settings**: Video ayarları butonu
- **Leave**: Kanaldan ayrılma butonu
- **Network Quality**: Ağ kalitesi göstergesi

### RecordingControls.vue

Kayıt kontrol bileşeni.

#### Props
```javascript
{
  isRecording: { type: Boolean, default: false },
  isPaused: { type: Boolean, default: false },
  duration: { type: Number, default: 0 },
  onStart: { type: Function, default: () => {} },
  onStop: { type: Function, default: () => {} },
  onPause: { type: Function, default: () => {} },
  onResume: { type: Function, default: () => {} }
}
```

## 📝 Form Components API

### JoinForm.vue

Kanal katılım formu.

#### Props
```javascript
{
  defaultChannel: { type: String, default: '' },
  isJoining: { type: Boolean, default: false }
}
```

#### Events
```javascript
{
  'join': (channelName) => void
}
```

#### Usage
```vue
<template>
  <JoinForm
    :defaultChannel="'test-channel'"
    :isJoining="isJoining"
    @join="handleJoin"
  />
</template>
```

## 🎥 Video Components API

### VideoGrid.vue

Video grid düzeni yönetimi.

#### Props
```javascript
{
  allUsers: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  localVideoRef: { type: Object, default: null },
  localScreenRef: { type: Object, default: null },
  logUI: { type: Function, default: () => {} }
}
```

#### Events
```javascript
{
  'set-video-ref': (el, uid) => void,
  'set-local-video-ref': (el) => void,
  'set-local-screen-ref': (el) => void
}
```

### VideoItem.vue

Tek video öğesi render'ı.

#### Props
```javascript
{
  user: { type: Object, required: true },
  hasVideo: { type: Boolean, default: false },
  videoRef: { type: [Object, Function], default: null },
  track: { type: Object, default: null },
  isLocal: { type: Boolean, default: false },
  isScreenShare: { type: Boolean, default: false },
  isClickable: { type: Boolean, default: false },
  logUI: { type: Function, default: () => {} }
}
```

#### Events
```javascript
{
  'video-click': (user) => void
}
```

#### Features
- **Video Rendering**: Video track render'ı
- **Placeholder**: Video yokken placeholder gösterimi
- **User Info**: Kullanıcı bilgileri
- **Status Icons**: Mute, video off, screen share durumları
- **Click Handling**: Tıklanabilir video desteği

## 🔌 Composable API

### useMeeting()

Top-level koordinasyon composable'ı.

#### Returns
```javascript
{
  // Connection state
  isConnected: ComputedRef<boolean>,
  isInitialized: ComputedRef<boolean>,
  
  // Users
  localUser: ComputedRef<Object>,
  remoteUsers: ComputedRef<Array>,
  allUsers: ComputedRef<Array>,
  connectedUsersCount: ComputedRef<number>,
  
  // Controls
  isLocalVideoOff: ComputedRef<boolean>,
  isLocalAudioMuted: ComputedRef<boolean>,
  isScreenSharing: ComputedRef<boolean>,
  
  // Tracks
  localTracks: ComputedRef<Object>,
  remoteTracks: ComputedRef<Map>,
  
  // Actions
  joinChannel: (channelName, appId) => Promise<void>,
  leaveChannel: () => Promise<void>,
  toggleCamera: () => Promise<void>,
  toggleMicrophone: () => Promise<void>,
  toggleScreenShare: () => Promise<void>,
  
  // Quality
  networkQuality: ComputedRef<Object>,
  bitrate: ComputedRef<number>,
  frameRate: ComputedRef<number>,
  packetLoss: ComputedRef<number>,
  rtt: ComputedRef<number>,
  qualityLevel: ComputedRef<string>,
  qualityColor: ComputedRef<string>,
  
  // Utilities
  supportsScreenShare: ComputedRef<boolean>,
  canUseCamera: ComputedRef<boolean>,
  canUseMicrophone: ComputedRef<boolean>,
  
  // Cleanup
  cleanup: () => void
}
```

#### Usage
```javascript
import { useMeeting } from 'rs-agora-module'

const {
  isConnected,
  localUser,
  remoteUsers,
  joinChannel,
  toggleCamera,
  toggleMicrophone
} = useMeeting()

// Join channel
await joinChannel('test-channel', 'your-app-id')

// Toggle controls
await toggleCamera()
await toggleMicrophone()
```

### useVideo()

Video client yönetimi composable'ı.

#### Returns
```javascript
{
  // State
  isJoining: Ref<boolean>,
  isLeaving: Ref<boolean>,
  
  // Actions
  initializeClient: (appId) => Promise<void>,
  joinChannel: (channelName, appId, uid) => Promise<void>,
  leaveChannel: () => Promise<void>,
  toggleCamera: () => Promise<void>,
  toggleMicrophone: () => Promise<void>,
  
  // Utilities
  generateVideoUID: () => number,
  checkDeviceStatus: () => Promise<Object>,
  
  // Cleanup
  cleanup: () => void
}
```

### useScreenShare()

Ekran paylaşımı yönetimi composable'ı.

#### Returns
```javascript
{
  // State
  isJoining: Ref<boolean>,
  isLeaving: Ref<boolean>,
  
  // Actions
  joinScreenChannel: (channelName, appId, uid) => Promise<void>,
  leaveScreenChannel: () => Promise<void>,
  startScreenShare: () => Promise<void>,
  stopScreenShare: () => Promise<void>,
  toggleScreenShare: () => Promise<void>,
  
  // Utilities
  generateScreenUID: () => number,
  supportsScreenShare: ComputedRef<boolean>,
  
  // Cleanup
  cleanup: () => void
}
```

### useStreamQuality()

Stream kalite izleme composable'ı.

#### Returns
```javascript
{
  // Quality metrics
  networkQuality: Ref<Object>,
  bitrate: Ref<number>,
  frameRate: Ref<number>,
  packetLoss: Ref<number>,
  rtt: Ref<number>,
  qualityLevel: ComputedRef<string>,
  qualityColor: ComputedRef<string>,
  qualityPercentage: ComputedRef<number>,
  
  // State
  isMonitoring: Ref<boolean>,
  
  // Actions
  startMonitoring: (client) => void,
  stopMonitoring: () => void,
  
  // Utilities
  optimizeScreenShareQuality: (client, quality) => void
}
```

### useTrackManagement()

Track yönetimi composable'ı.

#### Returns
```javascript
{
  // Track validation
  isTrackValid: (track) => boolean,
  
  // Track creation
  createAudioTrack: (options) => Promise<AudioTrack>,
  createVideoTrack: (options) => Promise<VideoTrack>,
  createScreenTrack: (options) => Promise<VideoTrack>,
  
  // Client management
  createVideoClient: () => { success: boolean, client: Client, error: Error },
  createScreenClient: () => { success: boolean, client: Client, error: Error },
  
  // Registration
  registerClient: (client, type, eventHandler) => void,
  unregisterClient: (client, type) => void,
  
  // Cleanup
  cleanupTrack: (track) => void,
  cleanupCentralEvents: () => void
}
```

### useLogger()

Logging sistemi composable'ı.

#### Returns
```javascript
{
  // Log functions
  logUI: (message, data) => void,
  logError: (error, context) => void,
  logWarn: (message, data) => void,
  logInfo: (message, data) => void,
  logDebug: (message, data) => void,
  logVideo: (message, data) => void,
  logScreen: (message, data) => void,
  logQuality: (message, data) => void,
  
  // Performance tracking
  trackPerformance: (name, fn) => any,
  trackUserAction: (action, details) => void,
  
  // Log management
  logs: Ref<Array>,
  logStats: ComputedRef<Object>,
  getFilteredLogs: (filter) => Array,
  clearLogs: () => void,
  exportLogs: () => void
}
```

## 🗄️ Store API

### useAgoraStore()

Ana Agora store - video ve ekran paylaşımı state'ini yönetir.

#### State
```javascript
{
  // Clients
  clients: {
    video: { client, isConnected, isInitialized },
    screen: { client, isConnected, isInitialized }
  },
  
  // Users
  users: {
    local: { video, screen },
    remote: []
  },
  
  // Tracks
  tracks: {
    local: { video: { audio, video }, screen: { video } },
    remote: Map<UID, { audio, video, screen }>
  },
  
  // Controls
  controls: {
    isLocalVideoOff: false,
    isLocalAudioMuted: false,
    isScreenSharing: false
  },
  
  // Session
  session: {
    videoChannelName: null,
    appId: null
  },
  
  // Devices
  devices: {
    hasCamera: false,
    hasMicrophone: false,
    cameraPermission: 'unknown',
    microphonePermission: 'unknown'
  }
}
```

#### Actions
```javascript
{
  // Client management
  setClient: (type, client) => void,
  setClientConnected: (type, connected) => void,
  setClientInitialized: (type, initialized) => void,
  
  // User management
  setLocalUser: (type, user) => void,
  addRemoteUser: (user) => void,
  removeRemoteUser: (uid) => void,
  updateRemoteUser: (uid, updates) => void,
  
  // Track management
  setLocalTrack: (type, trackType, track) => void,
  setRemoteTrack: (uid, type, track) => void,
  removeRemoteTrack: (uid, type) => void,
  
  // Control management
  setLocalVideoOff: (off) => void,
  setLocalAudioMuted: (muted) => void,
  setScreenSharing: (sharing) => void,
  
  // Session management
  setVideoChannelName: (name) => void,
  setAppId: (appId) => void,
  
  // Device management
  setDeviceStatus: (device, status) => void,
  setDevicePermission: (device, permission) => void,
  
  // Cleanup
  reset: () => void
}
```

#### Getters
```javascript
{
  // Computed properties
  allUsers: ComputedRef<Array>,
  connectedUsersCount: ComputedRef<number>,
  hasLocalVideo: ComputedRef<boolean>,
  hasLocalAudio: ComputedRef<boolean>,
  hasLocalScreenShare: ComputedRef<boolean>,
  videoChannelName: ComputedRef<string>,
  isLocalVideoOff: ComputedRef<boolean>,
  isLocalAudioMuted: ComputedRef<boolean>,
  isScreenSharing: ComputedRef<boolean>
}
```

### useLayoutStore()

Layout yönetimi store'u.

#### State
```javascript
{
  currentLayout: 'grid' | 'spotlight' | 'presentation',
  currentLayoutInfo: {
    name: string,
    description: string,
    icon: string
  }
}
```

#### Actions
```javascript
{
  setLayout: (layout) => void,
  setLayoutInfo: (info) => void
}
```

## 🔧 Services API

### Token Service

#### createToken(channelName, uid)
Agora token oluşturur.

```javascript
import { createToken } from 'rs-agora-module'

const token = await createToken('test-channel', 12345)
```

### Logger Service

#### logger.info(category, message, data)
Info level log kaydı.

```javascript
import { logger } from 'rs-agora-module'

logger.info('VIDEO', 'Video track created', { trackId: '123' })
```

#### logger.error(category, message, data)
Error level log kaydı.

```javascript
logger.error('AGORA', 'Failed to join channel', { error: 'Network error' })
```

#### logger.trackPerformance(name, fn)
Performance tracking.

```javascript
const result = await logger.trackPerformance('joinChannel', () => 
  client.join(token, channelName, uid)
)
```

#### logger.trackUserAction(action, details)
Kullanıcı aksiyon tracking'i.

```javascript
logger.trackUserAction('camera_toggle', { from: 'off', to: 'on' })
```

## 📊 Constants API

### AGORA_EVENTS
Event type sabitleri.

```javascript
import { AGORA_EVENTS } from 'rs-agora-module'

// Event types
AGORA_EVENTS.CLIENT_INITIALIZED
AGORA_EVENTS.CHANNEL_JOINED
AGORA_EVENTS.USER_JOINED
AGORA_EVENTS.REMOTE_SCREEN_READY
AGORA_EVENTS.CAMERA_TOGGLED
AGORA_EVENTS.MICROPHONE_TOGGLED
AGORA_EVENTS.SCREEN_SHARE_STARTED
AGORA_EVENTS.SCREEN_SHARE_STOPPED
```

### USER_FRIENDLY_ERRORS
Kullanıcı dostu hata mesajları.

```javascript
import { USER_FRIENDLY_ERRORS, getErrorMessage } from 'rs-agora-module'

// Direct access
USER_FRIENDLY_ERRORS.CAMERA_PERMISSION_DENIED

// Helper function
const message = getErrorMessage(error)
```

### VIDEO_CONFIG
Video konfigürasyon sabitleri.

```javascript
import { VIDEO_CONFIG } from 'rs-agora-module'

// Video settings
VIDEO_CONFIG.encoderConfig    // '720p_1' | '1080p_1'
VIDEO_CONFIG.facingMode       // 'user' | 'environment'
VIDEO_CONFIG.bitrateMin       // 1000 | 2000
VIDEO_CONFIG.bitrateMax       // 2000 | 4000
VIDEO_CONFIG.frameRate        // 24 | 30
```

### SCREEN_SHARE_CONFIG
Ekran paylaşımı konfigürasyon sabitleri.

```javascript
import { SCREEN_SHARE_CONFIG } from 'rs-agora-module'

// Quality presets
SCREEN_SHARE_CONFIG.FAST_START    // Hızlı başlatma
SCREEN_SHARE_CONFIG.LOW_QUALITY   // Düşük kalite
SCREEN_SHARE_CONFIG.HIGH_QUALITY  // Yüksek kalite
```

## 🛠️ Utils API

### centralEmitter
Merkezi event emitter.

```javascript
import { centralEmitter, AGORA_EVENTS } from 'rs-agora-module'

// Event emit
centralEmitter.emit(AGORA_EVENTS.USER_JOINED, { uid: 123 })

// Event listen
centralEmitter.on(AGORA_EVENTS.USER_JOINED, (data) => {
  console.log('User joined:', data.uid)
})

// Event off
centralEmitter.off(AGORA_EVENTS.USER_JOINED)
```

### createSafeTimeout
Güvenli timeout oluşturma.

```javascript
import { createSafeTimeout } from 'rs-agora-module'

const timeoutId = createSafeTimeout(() => {
  console.log('Timeout completed')
}, 5000)

// Timeout otomatik olarak cleanup edilir
```

### getUserInitials
Kullanıcı adından baş harfler oluşturma.

```javascript
import { getUserInitials } from 'rs-agora-module'

const initials = getUserInitials('John Doe') // 'JD'
const initials2 = getUserInitials('Ahmet Yılmaz') // 'AY'
```

## 🔄 Event System

### Event Types
Tüm event type'ları `AGORA_EVENTS` constant'ında tanımlanmıştır.

### Event Handling
Event'ler `centralEmitter` üzerinden yönetilir.

```javascript
import { centralEmitter, AGORA_EVENTS } from 'rs-agora-module'

// Listen to events
centralEmitter.on(AGORA_EVENTS.USER_JOINED, (data) => {
  console.log('User joined:', data.uid)
})

centralEmitter.on(AGORA_EVENTS.REMOTE_SCREEN_READY, (data) => {
  console.log('Screen share ready:', data.uid)
})

// Emit events
centralEmitter.emit(AGORA_EVENTS.CAMERA_TOGGLED, { 
  from: 'off', 
  to: 'on' 
})
```

## 🎯 Error Handling

### Error Types
Hata türleri `USER_FRIENDLY_ERRORS` constant'ında tanımlanmıştır.

### Error Recovery
Otomatik hata kurtarma mekanizmaları:

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

## 🚀 Performance

### Memory Management
Memory leak önleme:

```javascript
// Safe timeout creation
const activeTimeouts = ref(new Set())

const createSafeTimeout = (callback, delay) => {
  const timeoutId = setTimeout(() => {
    activeTimeouts.value.delete(timeoutId)
    callback()
  }, delay)
  activeTimeouts.value.add(timeoutId)
  return timeoutId
}

// Cleanup on unmount
onUnmounted(() => {
  activeTimeouts.value.forEach(id => clearTimeout(id))
  activeTimeouts.value.clear()
})
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

---

Bu API referansı, RS Agora Module'ün tüm public API'larını kapsar. Detaylı kullanım örnekleri için [examples/](../examples/) klasörüne bakın.

