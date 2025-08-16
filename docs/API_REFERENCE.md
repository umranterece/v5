# Vue 3 Agora Video Conference Module - API Referansı

> **Context Engineering** yaklaşımı ile hazırlanmış kapsamlı API dokümantasyonu

## 📚 **API Genel Bakış**

Bu dokümantasyon, Vue 3 Agora Video Conference Module'ünün tüm API'larını detaylandırır. Modül, **barrel export pattern** kullanarak tutarlı bir import/export yapısı sağlar.

## 🔧 **Ana Modül Export**

```javascript
// src/modules/agora/index.js
import { 
  // Core Components
  AgoraConference,
  AgoraVideo,
  
  // Control Components
  AgoraControls,
  RecordingControls,
  
  // Modal Components
  LogModal,
  InfoModal,
  SettingsModal,
  
  // Video Components
  VideoGrid,
  VideoItem,
  StreamQualityBar,
  
  // Form Components
  JoinForm,
  
  // Composables
  useMeeting,
  useVideo,
  useScreenShare,
  useRecording,
  useStreamQuality,
  useTrackManagement,
  useLogger,
  
  // Services
  createToken,
  logger,
  recordingService,
  
  // Store
  useAgoraStore,
  
  // Utils
  emitter,
  AGORA_EVENTS,
  EventDeduplicator,
  
  // Constants
  API_ENDPOINTS,
  USER_ID_RANGES,
  QUALITY_PRESETS
} from 'rs-agora-module'
```

## 🧩 **Component API'ları**

### **1. AgoraConference.vue**

Ana konferans bileşeni, tüm video konferans işlevselliğini koordine eder.

#### **Props**
```typescript
interface AgoraConferenceProps {
  // Kanal ayarları
  channelName: string
  autoJoin?: boolean
  userUid?: string | number
  
  // Token ayarları
  tokenEndpoint?: string | null
  
  // Debug ayarları
  debugMode?: boolean
}
```

#### **Events**
```typescript
interface AgoraConferenceEvents {
  // Bağlantı events
  'joined': (data: { channelName: string, token: string, uid: string | number }) => void
  'left': (data: { channelName: string }) => void
  'error': (data: { error: Error, message: string }) => void
  
  // Kullanıcı events
  'user-joined': (user: User) => void
  'user-left': (user: User) => void
  
  // Bağlantı durumu
  'connection-state-change': (state: ConnectionState) => void
  
  // Token events
  'token-requested': (data: { channelName: string, uid: string | number }) => void
  'token-received': (data: { token: string, channelName: string, uid: string | number }) => void
}
```

#### **Kullanım Örneği**
```vue
<template>
  <AgoraConference
    :channelName="'team-meeting'"
    :autoJoin="false"
    :debugMode="true"
    @joined="handleJoined"
    @user-joined="handleUserJoined"
    @error="handleError"
  />
</template>
```

### **2. AgoraVideo.vue**

Video görüntüleme ve stream yönetimi bileşeni.

#### **Props**
```typescript
interface AgoraVideoProps {
  // User data
  localUser: User | null
  remoteUsers: User[]
  
  // Video settings
  videoQuality?: string
  autoPlay?: boolean
  
  // UI settings
  showControls?: boolean
  showQualityBar?: boolean
}
```

#### **Events**
```typescript
interface AgoraVideoEvents {
  'video-click': (user: User) => void
  'quality-change': (quality: string) => void
  'fullscreen-toggle': (isFullscreen: boolean) => void
}
```

### **3. AgoraControls.vue**

Ana kontrol paneli bileşeni.

#### **Props**
```typescript
interface AgoraControlsProps {
  // Connection state
  isConnected: boolean
  isJoining: boolean
  isLeaving: boolean
  
  // Device state
  isLocalVideoOff: boolean
  isLocalAudioMuted: boolean
  canUseCamera: boolean
  canUseMicrophone: boolean
  
  // Channel info
  channelName: string
  connectedUsersCount: number
  
  // Features
  supportsScreenShare: boolean
  isScreenSharing: boolean
  
  // Network quality
  networkQualityLevel: string
  networkQualityColor: string
  networkBitrate: number
  networkFrameRate: number
  networkRtt: number
  networkPacketLoss: number
  
  // Callbacks
  onJoin: (channelName: string) => Promise<void>
  onLeave: () => Promise<void>
  onToggleCamera: (off: boolean) => Promise<void>
  onToggleMicrophone: (muted: boolean) => Promise<void>
  onToggleScreenShare: () => Promise<void>
  
  // Logging
  logUI: (message: string, data?: any) => void
  logError: (error: Error, context?: any) => void
  trackUserAction: (action: string, data?: any) => void
  
  // Settings
  onOpenSettings: () => void
}
```

### **4. Modal Components**

#### **InfoModal.vue**
```typescript
interface InfoModalProps {
  isOpen: boolean
  channelName: string
  isConnected: boolean
  connectedUsersCount: number
  networkQualityLevel: string
  networkQualityColor: string
  networkBitrate: number
  networkFrameRate: number
  networkRtt: number
  networkPacketLoss: number
  canUseCamera: boolean
  canUseMicrophone: boolean
  isLocalVideoOff: boolean
  isLocalAudioMuted: boolean
  allUsers: User[]
  isMobile: boolean
}
```

#### **LogModal.vue**
```typescript
interface LogModalProps {
  isOpen: boolean
  logs: LogEntry[]
  logStats: LogStats
  getFilteredLogs: () => LogEntry[]
  clearLogs: () => void
  exportLogs: () => void
}
```

#### **SettingsModal.vue**
```typescript
interface SettingsModalProps {
  isOpen: boolean
  currentCamera: string
  currentMicrophone: string
  currentSpeaker: string
  currentVideoQuality: string
  currentAudioQuality: string
  isMobile: boolean
}
```

## 🔧 **Composable API'ları**

### **1. useMeeting()**

Ana meeting state yönetimi composable'ı.

#### **Return Values**
```typescript
interface UseMeetingReturn {
  // Connection state
  isConnected: Ref<boolean>
  isJoining: Ref<boolean>
  isLeaving: Ref<boolean>
  
  // Channel info
  channelName: Ref<string>
  localUser: Ref<User | null>
  remoteUsers: Ref<User[]>
  allUsers: Ref<User[]>
  connectedUsersCount: Ref<number>
  
  // Device state
  isLocalVideoOff: Ref<boolean>
  isLocalAudioMuted: Ref<boolean>
  canUseCamera: Ref<boolean>
  canUseMicrophone: Ref<boolean>
  
  // Tracks
  localTracks: Ref<LocalTracks>
  remoteTracks: Ref<RemoteTracks>
  
  // Screen sharing
  isScreenSharing: Ref<boolean>
  supportsScreenShare: Ref<boolean>
  
  // Methods
  joinChannel: (params: JoinParams) => Promise<void>
  leaveChannel: () => Promise<void>
  toggleCamera: (off: boolean) => Promise<void>
  toggleMicrophone: (muted: boolean) => Promise<void>
  toggleScreenShare: () => Promise<void>
  
  // Cleanup
  cleanup: () => void
  clean: () => void
}
```

#### **Kullanım Örneği**
```javascript
import { useMeeting } from 'rs-agora-module'

const {
  joinChannel,
  isConnected,
  localUser,
  remoteUsers,
  toggleCamera,
  toggleMicrophone
} = useMeeting()

// Channel join
const handleJoin = async () => {
  try {
    await joinChannel({
      channelName: 'test-channel',
      token: 'your-token',
      uid: 'user-123'
    })
  } catch (error) {
    console.error('Join error:', error)
  }
}
```

### **2. useVideo()**

Video stream yönetimi composable'ı.

#### **Return Values**
```typescript
interface UseVideoReturn {
  // Video state
  isVideoEnabled: Ref<boolean>
  isAudioEnabled: Ref<boolean>
  videoDevices: Ref<MediaDeviceInfo[]>
  audioDevices: Ref<MediaDeviceInfo[]>
  
  // Methods
  enableVideo: () => Promise<void>
  disableVideo: () => Promise<void>
  enableAudio: () => Promise<void>
  disableAudio: () => Promise<void>
  switchCamera: (deviceId: string) => Promise<void>
  switchMicrophone: (deviceId: string) => Promise<void>
  
  // Device management
  getDevices: () => Promise<void>
  refreshDevices: () => Promise<void>
}
```

### **3. useScreenShare()**

Ekran paylaşımı composable'ı.

#### **Return Values**
```typescript
interface UseScreenShareReturn {
  // Screen share state
  isScreenSharing: Ref<boolean>
  screenTrack: Ref<LocalTrack | null>
  screenDevices: Ref<MediaDeviceInfo[]>
  
  // Methods
  startScreenShare: (options?: ScreenShareOptions) => Promise<void>
  stopScreenShare: () => Promise<void>
  switchScreenSource: (sourceId: string) => Promise<void>
  
  // Quality settings
  setScreenQuality: (quality: string) => Promise<void>
  getScreenQuality: () => string
}
```

### **4. useRecording()**

Cloud recording yönetimi composable'ı.

#### **Return Values**
```typescript
interface UseRecordingReturn {
  // Recording state
  isRecording: Ref<boolean>
  recordingStatus: Ref<RecordingStatus | null>
  recordingConfig: Ref<RecordingConfig>
  
  // Methods
  startRecording: (config?: RecordingConfig) => Promise<void>
  stopRecording: () => Promise<void>
  pauseRecording: () => Promise<void>
  resumeRecording: () => Promise<void>
  
  // Status
  getRecordingStatus: () => Promise<RecordingStatus>
  getRecordingFiles: () => Promise<RecordingFile[]>
}
```

### **5. useStreamQuality()**

Stream kalite monitoring composable'ı.

#### **Return Values**
```typescript
interface UseStreamQualityReturn {
  // Quality metrics
  networkQuality: Ref<string>
  bitrate: Ref<number>
  frameRate: Ref<number>
  packetLoss: Ref<number>
  rtt: Ref<number>
  
  // Quality color
  qualityColor: Ref<string>
  qualityLevel: Ref<string>
  
  // Methods
  adjustQuality: (quality: string) => Promise<void>
  getQualityStats: () => QualityStats
  startMonitoring: () => void
  stopMonitoring: () => void
}
```

### **6. useLogger()**

Logging sistemi composable'ı.

#### **Return Values**
```typescript
interface UseLoggerReturn {
  // Log methods
  logUI: (message: string, data?: any) => void
  logError: (error: Error, context?: any) => void
  logWarning: (message: string, data?: any) => void
  logInfo: (message: string, data?: any) => void
  logDebug: (message: string, data?: any) => void
  
  // User tracking
  trackUserAction: (action: string, data?: any) => void
  
  // Log management
  logs: Ref<LogEntry[]>
  logStats: Ref<LogStats>
  clearLogs: () => void
  exportLogs: () => void
  getFilteredLogs: (filters?: LogFilters) => LogEntry[]
}
```

## 🗄️ **Store API'ları**

### **useAgoraStore()**

Pinia store for Agora state management.

#### **State**
```typescript
interface AgoraStoreState {
  // Meeting state
  isConnected: boolean
  channelName: string
  localUser: User | null
  remoteUsers: User[]
  
  // Device state
  selectedCamera: string
  selectedMicrophone: string
  selectedSpeaker: string
  
  // Quality state
  videoQuality: string
  audioQuality: string
  
  // Recording state
  isRecording: boolean
  recordingStatus: RecordingStatus | null
  
  // UI state
  showSettings: boolean
  showLogs: boolean
  showInfo: boolean
}
```

#### **Actions**
```typescript
interface AgoraStoreActions {
  // Meeting actions
  setConnectionState: (state: boolean) => void
  setChannelName: (name: string) => void
  setLocalUser: (user: User) => void
  addRemoteUser: (user: User) => void
  removeRemoteUser: (uid: string | number) => void
  
  // Device actions
  setSelectedCamera: (cameraId: string) => void
  setSelectedMicrophone: (micId: string) => void
  setSelectedSpeaker: (speakerId: string) => void
  
  // Quality actions
  setVideoQuality: (quality: string) => void
  setAudioQuality: (quality: string) => void
  
  // Recording actions
  setRecordingState: (state: boolean) => void
  setRecordingStatus: (status: RecordingStatus) => void
  
  // UI actions
  toggleSettings: () => void
  toggleLogs: () => void
  toggleInfo: () => void
}
```

#### **Getters**
```typescript
interface AgoraStoreGetters {
  // Computed values
  totalUsers: number
  hasLocalUser: boolean
  hasRemoteUsers: boolean
  isDeviceReady: boolean
  
  // Filtered users
  videoUsers: User[]
  audioUsers: User[]
  screenShareUsers: User[]
}
```

## 🔌 **Event System API'ları**

### **Central Event Emitter**

```typescript
import { emitter, AGORA_EVENTS } from 'rs-agora-module'

// Event types
const AGORA_EVENTS = {
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  STREAM_PUBLISHED: 'stream-published',
  STREAM_UNPUBLISHED: 'stream-unpublished',
  NETWORK_QUALITY: 'network-quality',
  RECORDING_STATUS: 'recording-status',
  DEVICE_CHANGED: 'device-changed',
  QUALITY_CHANGED: 'quality-changed'
}

// Event listening
emitter.on(AGORA_EVENTS.USER_JOINED, (user) => {
  console.log('User joined:', user)
})

// Event emitting
emitter.emit(AGORA_EVENTS.CUSTOM_EVENT, { data: 'custom-data' })

// Event removal
emitter.off(AGORA_EVENTS.USER_JOINED)
```

### **Event Deduplication**

```typescript
import { EventDeduplicator } from 'rs-agora-module'

const deduplicator = new EventDeduplicator(1000) // 1 second timeout

if (deduplicator.shouldEmit('user-action', { action: 'click' })) {
  // Emit event
  emitter.emit('user-action', { action: 'click' })
}
```

## 🎨 **UI Component API'ları**

### **VideoGrid.vue**

```typescript
interface VideoGridProps {
  allUsers: User[]
  localTracks: LocalTracks
  localVideoRef: Ref<HTMLElement | null>
  localScreenRef: Ref<HTMLElement | null>
  logUI: (message: string, data?: any) => void
}

interface VideoGridEmits {
  'set-video-ref': (element: HTMLElement, uid: string | number) => void
  'set-local-video-ref': (element: HTMLElement) => void
  'set-local-screen-ref': (element: HTMLElement) => void
}
```

### **VideoItem.vue**

```typescript
interface VideoItemProps {
  user: User
  isLocal: boolean
  hasVideo: boolean
  hasAudio: boolean
  isScreenShare: boolean
  showControls: boolean
  logUI: (message: string, data?: any) => void
}

interface VideoItemEmits {
  'video-click': (user: User) => void
  'fullscreen-toggle': (isFullscreen: boolean) => void
}
```

### **StreamQualityBar.vue**

```typescript
interface StreamQualityBarProps {
  quality: string
  bitrate: number
  frameRate: number
  packetLoss: number
  rtt: number
  showDetails: boolean
}
```

## 📊 **Service API'ları**

### **createToken()**

Agora token oluşturma servisi.

```typescript
interface TokenResult {
  token: string
  app_id: string
  channel_name: string
  uid: string | number
  expire_time: number
}

const createToken = async (
  channelName: string,
  uid: string | number,
  customEndpoint?: string
): Promise<TokenResult>
```

#### **Kullanım Örneği**
```javascript
import { createToken } from 'rs-agora-module'

try {
  const tokenResult = await createToken('test-channel', 'user-123')
  console.log('Token created:', tokenResult.token)
} catch (error) {
  console.error('Token creation failed:', error)
}
```

### **logger Service**

```typescript
interface LoggerService {
  log: (level: LogLevel, message: string, data?: any) => void
  info: (message: string, data?: any) => void
  warn: (message: string, data?: any) => void
  error: (message: string, data?: any) => void
  debug: (message: string, data?: any) => void
}
```

### **recordingService**

```typescript
interface RecordingService {
  start: (config: RecordingConfig) => Promise<void>
  stop: () => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  getStatus: () => Promise<RecordingStatus>
  getFiles: () => Promise<RecordingFile[]>
}
```

## 🔧 **Utility API'ları**

### **Common Utils**

```typescript
import { 
  formatTime,
  generateUID,
  validateChannelName,
  sanitizeInput,
  debounce,
  throttle
} from 'rs-agora-module'

// Time formatting
const formattedTime = formatTime(Date.now())

// UID generation
const uid = generateUID()

// Input validation
const isValidChannel = validateChannelName('test-channel')

// Input sanitization
const sanitizedInput = sanitizeInput('<script>alert("xss")</script>')

// Debounced function
const debouncedSearch = debounce(searchFunction, 300)

// Throttled function
const throttledScroll = throttle(scrollHandler, 100)
```

### **Types**

```typescript
import { 
  User,
  LocalTrack,
  RemoteTrack,
  ConnectionState,
  RecordingStatus,
  QualityLevel,
  LogLevel
} from 'rs-agora-module'

// Type definitions
interface User {
  uid: string | number
  isLocal: boolean
  hasVideo: boolean
  hasAudio: boolean
  isScreenShare: boolean
  isVideoOff: boolean
  isAudioMuted: boolean
}

interface LocalTrack {
  video?: MediaStreamTrack
  audio?: MediaStreamTrack
  screen?: MediaStreamTrack
}
```

## 📱 **Responsive Design API'ları**

### **CSS Variables**

```css
.agora-component {
  /* Primary colors */
  --agora-primary-color: #667eea;
  --agora-secondary-color: #764ba2;
  
  /* Background colors */
  --agora-background: #1a1a2e;
  --agora-surface: #16213e;
  --agora-overlay: #0f3460;
  
  /* Border radius */
  --agora-border-radius: 10px;
  --agora-border-radius-large: 20px;
  
  /* Spacing */
  --agora-spacing-xs: 4px;
  --agora-spacing-sm: 8px;
  --agora-spacing-md: 16px;
  --agora-spacing-lg: 24px;
  --agora-spacing-xl: 32px;
  
  /* Breakpoints */
  --agora-mobile: 768px;
  --agora-tablet: 1024px;
  --agora-desktop: 1200px;
}
```

### **Media Queries**

```scss
.agora-component {
  // Mobile first approach
  padding: var(--agora-spacing-sm);
  
  @media (min-width: var(--agora-mobile)) {
    padding: var(--agora-spacing-md);
  }
  
  @media (min-width: var(--agora-tablet)) {
    padding: var(--agora-spacing-lg);
  }
  
  @media (min-width: var(--agora-desktop)) {
    padding: var(--agora-spacing-xl);
  }
}
```

## 🧪 **Testing API'ları**

### **Component Testing**

```typescript
import { mount } from '@vue/test-utils'
import { AgoraConference } from 'rs-agora-module'

describe('AgoraConference', () => {
  it('renders join form when not connected', () => {
    const wrapper = mount(AgoraConference, {
      props: {
        channelName: 'test-channel',
        autoJoin: false
      }
    })
    
    expect(wrapper.find('.join-form').exists()).toBe(true)
  })
})
```

### **Composable Testing**

```typescript
import { useMeeting } from 'rs-agora-module'
import { renderComposable } from '@vue/test-utils'

describe('useMeeting', () => {
  it('initializes with default state', () => {
    const { result } = renderComposable(() => useMeeting())
    
    expect(result.isConnected.value).toBe(false)
    expect(result.channelName.value).toBe('')
  })
})
```

## 🔒 **Security API'ları**

### **Input Validation**

```typescript
import { 
  validateChannelName,
  validateUID,
  sanitizeInput,
  escapeHtml
} from 'rs-agora-module'

// Channel name validation
const isValidChannel = validateChannelName('test-channel-123')

// UID validation
const isValidUID = validateUID('user-123')

// Input sanitization
const sanitizedInput = sanitizeInput(userInput)

// HTML escaping
const escapedHtml = escapeHtml('<script>alert("xss")</script>')
```

### **Permission Handling**

```typescript
import { checkDevicePermissions } from 'rs-agora-module'

const permissions = await checkDevicePermissions({
  video: true,
  audio: true
})

if (permissions.video && permissions.audio) {
  // Proceed with video conference
} else {
  // Handle permission denial
}
```

---

> **Not**: Bu API referansı, projenin **Context Engineering** yaklaşımına uygun olarak hazırlanmıştır. Her API endpoint'i, performans ve maintainability göz önünde bulundurularak tasarlanmıştır.

