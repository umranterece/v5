# Vue 3 Agora Video Conference Module - Geliştirici Rehberi

> **Context Engineering** yaklaşımı ile hazırlanmış kapsamlı geliştirici rehberi

## 🚀 **Geliştirme Ortamı Kurulumu**

### **1. Gereksinimler**
```bash
# Node.js versiyonu
node >= 16.0.0
npm >= 8.0.0

# Tarayıcı desteği
Chrome >= 88
Firefox >= 85
Safari >= 14
Edge >= 88
```

### **2. Proje Kurulumu**
```bash
# Projeyi klonlayın
git clone https://github.com/umranterece/agora-vue-module.git
cd agora-vue-module

# Bağımlılıkları yükleyin
npm install

# Development server'ı başlatın
npm run dev

# HTTPS ile çalıştırın (Agora için gerekli)
npm run dev:https
```

### **3. Environment Variables**
```bash
# .env.local
VITE_AGORA_APP_ID=your-agora-app-id
VITE_AGORA_TOKEN_ENDPOINT=https://your-api.com/createToken.php
VITE_DEBUG_MODE=true
```

## 🏗️ **Proje Yapısı**

### **Modüler Mimari**
```
src/modules/agora/
├── 📁 components/           # UI Bileşenleri
│   ├── 📁 core/            # Ana konferans bileşenleri
│   ├── 📁 controls/        # Kontrol bileşenleri
│   ├── 📁 modals/          # Modal bileşenleri
│   ├── 📁 video/           # Video bileşenleri
│   ├── 📁 forms/           # Form bileşenleri
│   ├── 📁 ui/              # Genel UI bileşenleri
│   └── index.js             # Ana component barrel export
├── 📁 composables/         # Vue 3 Composables
├── 📁 services/            # Servis katmanı
├── 📁 store/               # State management
├── 📁 utils/               # Yardımcı fonksiyonlar
├── 📄 constants.js         # Sabitler ve konfigürasyon
└── 📄 index.js             # Ana modül barrel export
```

### **Barrel Export Pattern**
```javascript
// src/modules/agora/components/core/index.js
export { default as AgoraConference } from './AgoraConference.vue'
export { default as AgoraVideo } from './AgoraVideo.vue'

// src/modules/agora/index.js
export { AgoraConference, AgoraVideo } from './components/core'
export { AgoraControls, RecordingControls } from './components/controls'
export { LogModal, InfoModal, SettingsModal } from './components/modals'
export * from './composables'
export * from './services'
export * from './store'
export * from './utils'
export * from './constants'
```

## 🔧 **Geliştirme Prensipleri**

### **1. Context Engineering**
- **Knowledge Preservation**: Mimari kararların nedenleri dokümante edilir
- **Context Transfer**: Yeni geliştiriciler için hızlı adaptasyon
- **Decision Transparency**: Her önemli karar için ADR (Architecture Decision Records)

### **2. Vue 3 Best Practices**
- **Composition API**: Modern Vue 3 Composition API kullanımı
- **TypeScript-like**: JSDoc ile type safety
- **Reactive Patterns**: Vue 3 reactive system'ın etkin kullanımı

### **3. Performance First**
- **Lazy Loading**: Component'ler ihtiyaç duyulduğunda yüklenir
- **Event Deduplication**: Aynı event'lerin tekrar tetiklenmesi önlenir
- **Memory Management**: Track'ler ve event listener'lar düzgün temizlenir

## 🧩 **Component Geliştirme**

### **1. Component Template Yapısı**
```vue
<template>
  <div class="component-name">
    <!-- Header -->
    <div class="component-header">
      <h3>{{ title }}</h3>
      <button @click="$emit('close')" class="close-btn">×</button>
    </div>
    
    <!-- Content -->
    <div class="component-content">
      <slot />
    </div>
    
    <!-- Footer -->
    <div class="component-footer">
      <slot name="footer" />
    </div>
  </div>
</template>
```

### **2. Component Script Yapısı**
```vue
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLogger } from '../../composables/index.js'

// Props
const props = defineProps({
  title: { type: String, required: true },
  isOpen: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits(['close', 'update'])

// Composables
const { logUI, logError } = useLogger()

// Local state
const isLoading = ref(false)
const error = ref(null)

// Computed
const hasError = computed(() => !!error.value)

// Methods
const handleClose = () => {
  logUI('Component closed', { component: 'ComponentName' })
  emit('close')
}

// Lifecycle
onMounted(() => {
  logUI('Component mounted', { component: 'ComponentName' })
})

onUnmounted(() => {
  logUI('Component unmounted', { component: 'ComponentName' })
})
</script>
```

### **3. Component Styling**
```vue
<style scoped>
.component-name {
  /* CSS Variables */
  --component-bg: rgba(26, 26, 46, 0.98);
  --component-border: rgba(255, 255, 255, 0.1);
  --component-radius: 20px;
  
  /* Base styles */
  background: var(--component-bg);
  border: 1px solid var(--component-border);
  border-radius: var(--component-radius);
  backdrop-filter: blur(20px);
  
  /* Responsive design */
  padding: 16px;
  
  @media (min-width: 768px) {
    padding: 24px;
  }
  
  @media (min-width: 1024px) {
    padding: 32px;
  }
}

/* Glassmorphism effects */
.component-header {
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid var(--component-border);
  padding: 16px 0;
  margin-bottom: 16px;
}

/* Hover effects */
.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
  transition: all 0.2s ease;
}
</style>
```

## 🔧 **Composable Geliştirme**

### **1. Composable Yapısı**
```javascript
// src/modules/agora/composables/useExample.js
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { emitter, AGORA_EVENTS } from '../utils/index.js'
import { useLogger } from './index.js'

export function useExample() {
  // Dependencies
  const { logUI, logError } = useLogger()
  
  // State
  const isLoading = ref(false)
  const data = ref(null)
  const error = ref(null)
  
  // Computed
  const hasData = computed(() => !!data.value)
  const hasError = computed(() => !!error.value)
  
  // Methods
  const fetchData = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      // API call logic
      const result = await apiCall()
      data.value = result
      
      logUI('Data fetched successfully', { data: result })
    } catch (err) {
      error.value = err
      logError(err, { context: 'useExample.fetchData' })
    } finally {
      isLoading.value = false
    }
  }
  
  const resetData = () => {
    data.value = null
    error.value = null
  }
  
  // Event handling
  const handleEvent = (eventData) => {
    logUI('Event received', { event: eventData })
    // Event handling logic
  }
  
  // Lifecycle
  onMounted(() => {
    emitter.on(AGORA_EVENTS.CUSTOM_EVENT, handleEvent)
    logUI('useExample mounted')
  })
  
  onUnmounted(() => {
    emitter.off(AGORA_EVENTS.CUSTOM_EVENT, handleEvent)
    logUI('useExample unmounted')
  })
  
  // Return
  return {
    // State
    isLoading,
    data,
    error,
    
    // Computed
    hasData,
    hasError,
    
    // Methods
    fetchData,
    resetData
  }
}
```

### **2. Composable Testing**
```javascript
// tests/composables/useExample.test.js
import { renderComposable } from '@vue/test-utils'
import { useExample } from '../../src/modules/agora/composables/useExample'

describe('useExample', () => {
  it('initializes with default state', () => {
    const { result } = renderComposable(() => useExample())
    
    expect(result.isLoading.value).toBe(false)
    expect(result.data.value).toBe(null)
    expect(result.error.value).toBe(null)
  })
  
  it('fetches data successfully', async () => {
    const { result } = renderComposable(() => useExample())
    
    await result.fetchData()
    
    expect(result.isLoading.value).toBe(false)
    expect(result.hasData.value).toBe(true)
    expect(result.hasError.value).toBe(false)
  })
  
  it('handles errors gracefully', async () => {
    // Mock API error
    const { result } = renderComposable(() => useExample())
    
    // Trigger error
    await result.fetchData()
    
    expect(result.hasError.value).toBe(true)
    expect(result.isLoading.value).toBe(false)
  })
})
```

## 🗄️ **Store Geliştirme**

### **1. Pinia Store Yapısı**
```javascript
// src/modules/agora/store/agora.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAgoraStore = defineStore('agora', () => {
  // State
  const isConnected = ref(false)
  const channelName = ref('')
  const localUser = ref(null)
  const remoteUsers = ref([])
  
  // Device state
  const selectedCamera = ref('')
  const selectedMicrophone = ref('')
  const selectedSpeaker = ref('')
  
  // Quality state
  const videoQuality = ref('1080p_1')
  const audioQuality = ref('medium')
  
  // Recording state
  const isRecording = ref(false)
  const recordingStatus = ref(null)
  
  // UI state
  const showSettings = ref(false)
  const showLogs = ref(false)
  const showInfo = ref(false)
  
  // Getters (computed)
  const totalUsers = computed(() => {
    return remoteUsers.value.length + (localUser.value ? 1 : 0)
  })
  
  const hasLocalUser = computed(() => !!localUser.value)
  const hasRemoteUsers = computed(() => remoteUsers.value.length > 0)
  
  const videoUsers = computed(() => {
    return [localUser.value, ...remoteUsers.value].filter(user => 
      user && user.hasVideo && !user.isVideoOff
    )
  })
  
  // Actions
  const setConnectionState = (state) => {
    isConnected.value = state
  }
  
  const setChannelName = (name) => {
    channelName.value = name
  }
  
  const setLocalUser = (user) => {
    localUser.value = user
  }
  
  const addRemoteUser = (user) => {
    if (!remoteUsers.value.find(u => u.uid === user.uid)) {
      remoteUsers.value.push(user)
    }
  }
  
  const removeRemoteUser = (uid) => {
    const index = remoteUsers.value.findIndex(u => u.uid === uid)
    if (index > -1) {
      remoteUsers.value.splice(index, 1)
    }
  }
  
  const setSelectedCamera = (cameraId) => {
    selectedCamera.value = cameraId
  }
  
  const setSelectedMicrophone = (micId) => {
    selectedMicrophone.value = micId
  }
  
  const setSelectedSpeaker = (speakerId) => {
    selectedSpeaker.value = speakerId
  }
  
  const setVideoQuality = (quality) => {
    videoQuality.value = quality
  }
  
  const setAudioQuality = (quality) => {
    audioQuality.value = quality
  }
  
  const setRecordingState = (state) => {
    isRecording.value = state
  }
  
  const setRecordingStatus = (status) => {
    recordingStatus.value = status
  }
  
  const toggleSettings = () => {
    showSettings.value = !showSettings.value
  }
  
  const toggleLogs = () => {
    showLogs.value = !showLogs.value
  }
  
  const toggleInfo = () => {
    showInfo.value = !showInfo.value
  }
  
  const reset = () => {
    isConnected.value = false
    channelName.value = ''
    localUser.value = null
    remoteUsers.value = []
    selectedCamera.value = ''
    selectedMicrophone.value = ''
    selectedSpeaker.value = ''
    videoQuality.value = '1080p_1'
    audioQuality.value = 'medium'
    isRecording.value = false
    recordingStatus.value = null
    showSettings.value = false
    showLogs.value = false
    showInfo.value = false
  }
  
  return {
    // State
    isConnected,
    channelName,
    localUser,
    remoteUsers,
    selectedCamera,
    selectedMicrophone,
    selectedSpeaker,
    videoQuality,
    audioQuality,
    isRecording,
    recordingStatus,
    showSettings,
    showLogs,
    showInfo,
    
    // Getters
    totalUsers,
    hasLocalUser,
    hasRemoteUsers,
    videoUsers,
    
    // Actions
    setConnectionState,
    setChannelName,
    setLocalUser,
    addRemoteUser,
    removeRemoteUser,
    setSelectedCamera,
    setSelectedMicrophone,
    setSelectedSpeaker,
    setVideoQuality,
    setAudioQuality,
    setRecordingState,
    setRecordingStatus,
    toggleSettings,
    toggleLogs,
    toggleInfo,
    reset
  }
})
```

### **2. Store Testing**
```javascript
// tests/store/agora.test.js
import { setActivePinia, createPinia } from 'pinia'
import { useAgoraStore } from '../../src/modules/agora/store/agora'

describe('Agora Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('initializes with default state', () => {
    const store = useAgoraStore()
    
    expect(store.isConnected).toBe(false)
    expect(store.channelName).toBe('')
    expect(store.localUser).toBe(null)
    expect(store.remoteUsers).toEqual([])
  })
  
  it('sets connection state', () => {
    const store = useAgoraStore()
    
    store.setConnectionState(true)
    expect(store.isConnected).toBe(true)
  })
  
  it('adds remote user', () => {
    const store = useAgoraStore()
    const user = { uid: '123', name: 'Test User' }
    
    store.addRemoteUser(user)
    expect(store.remoteUsers).toContain(user)
    expect(store.totalUsers).toBe(1)
  })
  
  it('removes remote user', () => {
    const store = useAgoraStore()
    const user = { uid: '123', name: 'Test User' }
    
    store.addRemoteUser(user)
    store.removeRemoteUser('123')
    
    expect(store.remoteUsers).not.toContain(user)
    expect(store.totalUsers).toBe(0)
  })
})
```

## 🔌 **Event System Geliştirme**

### **1. Event Emitter Yapısı**
```javascript
// src/modules/agora/utils/centralEmitter.js
import mitt from 'mitt'

// Create emitter instance
export const emitter = mitt()

// Event types
export const AGORA_EVENTS = {
  // User events
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  USER_UPDATED: 'user-updated',
  
  // Stream events
  STREAM_PUBLISHED: 'stream-published',
  STREAM_UNPUBLISHED: 'stream-unpublished',
  STREAM_SUBSCRIBED: 'stream-subscribed',
  STREAM_UNSUBSCRIBED: 'stream-unsubscribed',
  
  // Network events
  NETWORK_QUALITY: 'network-quality',
  NETWORK_TYPE_CHANGED: 'network-type-changed',
  
  // Recording events
  RECORDING_STATUS: 'recording-status',
  RECORDING_PROGRESS: 'recording-progress',
  
  // Device events
  DEVICE_CHANGED: 'device-changed',
  DEVICE_PERMISSION_CHANGED: 'device-permission-changed',
  
  // Quality events
  QUALITY_CHANGED: 'quality-changed',
  QUALITY_ADAPTATION: 'quality-adaptation',
  
  // Custom events
  CUSTOM_EVENT: 'custom-event'
}

// Event helpers
export const emitUserJoined = (user) => {
  emitter.emit(AGORA_EVENTS.USER_JOINED, user)
}

export const emitUserLeft = (user) => {
  emitter.emit(AGORA_EVENTS.USER_LEFT, user)
}

export const emitStreamPublished = (stream) => {
  emitter.emit(AGORA_EVENTS.STREAM_PUBLISHED, stream)
}

export const emitNetworkQuality = (quality) => {
  emitter.emit(AGORA_EVENTS.NETWORK_QUALITY, quality)
}

export const emitRecordingStatus = (status) => {
  emitter.emit(AGORA_EVENTS.RECORDING_STATUS, status)
}

export const emitDeviceChanged = (device) => {
  emitter.emit(AGORA_EVENTS.DEVICE_CHANGED, device)
}

export const emitQualityChanged = (quality) => {
  emitter.emit(AGORA_EVENTS.QUALITY_CHANGED, quality)
}

export const emitCustomEvent = (eventName, data) => {
  emitter.emit(AGORA_EVENTS.CUSTOM_EVENT, { name: eventName, data })
}
```

### **2. Event Deduplication**
```javascript
// src/modules/agora/utils/eventDeduplication.js
export class EventDeduplicator {
  constructor(timeout = 1000) {
    this.events = new Map()
    this.timeout = timeout
  }
  
  shouldEmit(eventKey, data) {
    const lastEvent = this.events.get(eventKey)
    const now = Date.now()
    
    if (!lastEvent || now - lastEvent.timestamp > this.timeout) {
      this.events.set(eventKey, { data, timestamp: now })
      return true
    }
    
    return false
  }
  
  clearEvent(eventKey) {
    this.events.delete(eventKey)
  }
  
  clearAll() {
    this.events.clear()
  }
  
  getEventCount() {
    return this.events.size
  }
  
  getEventInfo(eventKey) {
    return this.events.get(eventKey)
  }
}

// Usage example
const deduplicator = new EventDeduplicator(1000)

if (deduplicator.shouldEmit('user-action', { action: 'click' })) {
  emitter.emit('user-action', { action: 'click' })
}
```

## 🎨 **UI/UX Geliştirme**

### **1. Design System**
```scss
// src/assets/styles/design-system.scss

// Color palette
:root {
  --agora-primary: #667eea;
  --agora-secondary: #764ba2;
  --agora-success: #4ade80;
  --agora-warning: #fbbf24;
  --agora-error: #f87171;
  --agora-info: #60a5fa;
  
  --agora-bg-primary: #1a1a2e;
  --agora-bg-secondary: #16213e;
  --agora-bg-tertiary: #0f3460;
  
  --agora-text-primary: #ffffff;
  --agora-text-secondary: #e0e0e0;
  --agora-text-muted: #9ca3af;
  
  --agora-border-primary: rgba(255, 255, 255, 0.1);
  --agora-border-secondary: rgba(255, 255, 255, 0.05);
  
  --agora-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --agora-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --agora-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --agora-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
}

// Typography
.agora-text {
  &-xs { font-size: 0.75rem; line-height: 1rem; }
  &-sm { font-size: 0.875rem; line-height: 1.25rem; }
  &-base { font-size: 1rem; line-height: 1.5rem; }
  &-lg { font-size: 1.125rem; line-height: 1.75rem; }
  &-xl { font-size: 1.25rem; line-height: 1.75rem; }
  &-2xl { font-size: 1.5rem; line-height: 2rem; }
  &-3xl { font-size: 1.875rem; line-height: 2.25rem; }
}

// Spacing
.agora-spacing {
  &-xs { margin: 0.25rem; padding: 0.25rem; }
  &-sm { margin: 0.5rem; padding: 0.5rem; }
  &-md { margin: 1rem; padding: 1rem; }
  &-lg { margin: 1.5rem; padding: 1.5rem; }
  &-xl { margin: 2rem; padding: 2rem; }
}

// Border radius
.agora-radius {
  &-sm { border-radius: 0.25rem; }
  &-md { border-radius: 0.5rem; }
  &-lg { border-radius: 0.75rem; }
  &-xl { border-radius: 1rem; }
  &-2xl { border-radius: 1.5rem; }
  &-full { border-radius: 9999px; }
}
```

### **2. Glassmorphism Components**
```scss
// Glassmorphism base class
.agora-glass {
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

// Glassmorphism variants
.agora-glass-light {
  @extend .agora-glass;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.agora-glass-dark {
  @extend .agora-glass;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

// Hover effects
.agora-glass-hover {
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.2);
  }
}
```

### **3. Responsive Design**
```scss
// Mobile-first approach
.agora-component {
  // Base mobile styles
  padding: 1rem;
  margin: 0.5rem;
  font-size: 0.875rem;
  
  // Tablet styles
  @media (min-width: 768px) {
    padding: 1.5rem;
    margin: 1rem;
    font-size: 1rem;
  }
  
  // Desktop styles
  @media (min-width: 1024px) {
    padding: 2rem;
    margin: 1.5rem;
    font-size: 1.125rem;
  }
  
  // Large desktop styles
  @media (min-width: 1280px) {
    padding: 2.5rem;
    margin: 2rem;
    font-size: 1.25rem;
  }
}

// Grid system
.agora-grid {
  display: grid;
  gap: 1rem;
  
  // Mobile: single column
  grid-template-columns: 1fr;
  
  // Tablet: 2 columns
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  
  // Desktop: 3 columns
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }
  
  // Large desktop: 4 columns
  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 2.5rem;
  }
}
```

## 🧪 **Test Geliştirme**

### **1. Test Yapısı**
```
tests/
├── 📁 unit/                # Unit tests
│   ├── 📁 composables/     # Composable tests
│   ├── 📁 utils/           # Utility tests
│   └── 📁 services/        # Service tests
├── 📁 component/            # Component tests
│   ├── 📁 core/            # Core component tests
│   ├── 📁 controls/        # Control component tests
│   ├── 📁 modals/          # Modal component tests
│   └── 📁 video/           # Video component tests
├── 📁 integration/          # Integration tests
├── 📁 e2e/                 # End-to-end tests
└── 📁 fixtures/            # Test data
```

### **2. Test Konfigürasyonu**
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts'
      ]
    }
  }
})
```

### **3. Test Setup**
```javascript
// tests/setup.js
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Mock Agora SDK
vi.mock('agora-rtc-sdk-ng', () => ({
  default: {
    createClient: vi.fn(() => ({
      join: vi.fn(),
      leave: vi.fn(),
      publish: vi.fn(),
      unpublish: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    })),
    createMicrophoneAudioTrack: vi.fn(),
    createCameraVideoTrack: vi.fn(),
    createScreenVideoTrack: vi.fn()
  }
}))

// Mock Web APIs
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn(() => Promise.resolve([]))
  },
  writable: true
})

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Vue Test Utils config
config.global.stubs = {
  'router-link': true,
  'router-view': true
}
```

## 🚀 **Performance Optimizasyonu**

### **1. Bundle Optimization**
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'agora-sdk': ['agora-rtc-sdk-ng'],
          'vue-vendor': ['vue', 'pinia'],
          'utils': ['mitt', 'lodash-es']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['vue', 'pinia', 'mitt']
  }
})
```

### **2. Code Splitting**
```javascript
// Lazy loading components
const AgoraConference = () => import('./components/core/AgoraConference.vue')
const AgoraVideo = () => import('./components/core/AgoraVideo.vue')
const AgoraControls = () => import('./components/controls/AgoraControls.vue')

// Lazy loading composables
const useMeeting = () => import('./composables/useMeeting.js')
const useVideo = () => import('./composables/useVideo.js')
```

### **3. Memory Management**
```javascript
// Track cleanup
const cleanupTracks = (tracks) => {
  tracks.forEach(track => {
    if (track && typeof track.stop === 'function') {
      track.stop()
    }
  })
}

// Event listener cleanup
const cleanupListeners = (emitter, events) => {
  events.forEach(event => {
    emitter.off(event)
  })
}

// Component cleanup
onUnmounted(() => {
  cleanupTracks(localTracks.value)
  cleanupListeners(emitter, [AGORA_EVENTS.USER_JOINED, AGORA_EVENTS.USER_LEFT])
})
```

## 🔒 **Güvenlik Geliştirme**

### **1. Input Validation**
```javascript
// Input sanitization
import { sanitizeInput, validateChannelName } from '../utils/index.js'

const sanitizeUserInput = (input) => {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string')
  }
  
  return sanitizeInput(input.trim())
}

const validateChannelInput = (channelName) => {
  if (!validateChannelName(channelName)) {
    throw new Error('Invalid channel name')
  }
  
  return channelName
}
```

### **2. Permission Handling**
```javascript
// Device permission management
const checkDevicePermissions = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    
    // Stop tracks immediately
    stream.getTracks().forEach(track => track.stop())
    
    return {
      video: true,
      audio: true
    }
  } catch (error) {
    return {
      video: false,
      audio: false,
      error: error.message
    }
  }
}
```

### **3. Token Security**
```javascript
// Secure token handling
const handleToken = (token) => {
  // Validate token format
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token format')
  }
  
  // Check token expiration
  if (isTokenExpired(token)) {
    throw new Error('Token expired')
  }
  
  return token
}
```

## 📱 **Mobile Development**

### **1. Touch Gestures**
```javascript
// Touch gesture handling
const useTouchGestures = () => {
  const touchStart = ref({ x: 0, y: 0 })
  const touchEnd = ref({ x: 0, y: 0 })
  
  const onTouchStart = (event) => {
    touchStart.value = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    }
  }
  
  const onTouchEnd = (event) => {
    touchEnd.value = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY
    }
    
    const gesture = detectGesture()
    handleGesture(gesture)
  }
  
  const detectGesture = () => {
    const deltaX = touchEnd.value.x - touchStart.value.x
    const deltaY = touchEnd.value.y - touchStart.value.y
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'swipe-right' : 'swipe-left'
    } else {
      return deltaY > 0 ? 'swipe-down' : 'swipe-up'
    }
  }
  
  const handleGesture = (gesture) => {
    switch (gesture) {
      case 'swipe-left':
        // Handle swipe left
        break
      case 'swipe-right':
        // Handle swipe right
        break
      case 'swipe-up':
        // Handle swipe up
        break
      case 'swipe-down':
        // Handle swipe down
        break
    }
  }
  
  return {
    onTouchStart,
    onTouchEnd
  }
}
```

### **2. Mobile-Specific Styles**
```scss
// Mobile-specific styles
.agora-mobile {
  // Touch-friendly button sizes
  .agora-button {
    min-height: 44px;
    min-width: 44px;
    padding: 12px;
    
    @media (max-width: 480px) {
      min-height: 48px;
      min-width: 48px;
      padding: 14px;
    }
  }
  
  // Mobile navigation
  .agora-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--agora-bg-primary);
    border-top: 1px solid var(--agora-border-primary);
    padding: 8px;
    z-index: 1000;
  }
  
  // Mobile video grid
  .agora-video-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 8px;
    
    @media (min-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 12px;
    }
  }
}
```

## 🔍 **Debug ve Logging**

### **1. Debug Mode**
```javascript
// Debug mode configuration
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true'

const debugLog = (message, data) => {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data)
  }
}

const debugError = (error, context) => {
  if (DEBUG_MODE) {
    console.error(`[DEBUG ERROR] ${error.message}`, { error, context })
  }
}
```

### **2. Performance Monitoring**
```javascript
// Performance monitoring
const usePerformanceMonitor = () => {
  const metrics = ref({
    fps: 0,
    bitrate: 0,
    packetLoss: 0,
    rtt: 0
  })
  
  const startMonitoring = () => {
    // Start performance monitoring
    const interval = setInterval(() => {
      // Collect metrics
      updateMetrics()
    }, 1000)
    
    return () => clearInterval(interval)
  }
  
  const updateMetrics = () => {
    // Update performance metrics
  }
  
  return {
    metrics,
    startMonitoring
  }
}
```

## 📚 **Dokümantasyon**

### **1. JSDoc Comments**
```javascript
/**
 * Agora video conference composable
 * @description Manages video conference state and operations
 * @author Umran Terece
 * @version 1.0.0
 * @since 2024-01-01
 */
export function useMeeting() {
  /**
   * Join a video conference channel
   * @param {Object} params - Join parameters
   * @param {string} params.channelName - Channel name to join
   * @param {string} params.token - Agora token for authentication
   * @param {string|number} params.uid - User ID
   * @returns {Promise<void>} Join operation result
   * @throws {Error} When join operation fails
   * @example
   * await joinChannel({
   *   channelName: 'test-channel',
   *   token: 'your-token',
   *   uid: 'user-123'
   * })
   */
  const joinChannel = async (params) => {
    // Implementation
  }
  
  return {
    joinChannel
  }
}
```

### **2. README Dosyaları**
```markdown
# Component Name

Brief description of the component.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `propName` | `string` | `''` | Description of the prop |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `event-name` | `{ data: any }` | Description of the event |

## Slots

| Slot | Description |
|------|-------------|
| `default` | Default content |
| `header` | Header content |
| `footer` | Footer content |

## Usage

```vue
<ComponentName
  :prop-name="value"
  @event-name="handleEvent"
>
  <template #header>
    Header content
  </template>
  
  Default content
  
  <template #footer>
    Footer content
  </template>
</ComponentName>
```

## Examples

See `examples/` directory for more usage examples.
```

---

> **Not**: Bu geliştirici rehberi, projenin **Context Engineering** yaklaşımına uygun olarak hazırlanmıştır. Her geliştirme kararı, maintainability ve performance göz önünde bulundurularak alınmıştır.

