# 🏗️ Mimari Dokümantasyonu

Modern video konferans uygulamasının mimari yapısı, grid layout sistemi ve teknik kararlar. Vue 3 Composition API, Agora SDK ve responsive tasarım prensipleri ile geliştirilmiştir.

## 🎯 **Mimari Genel Bakış**

### **Teknoloji Stack**
- **Frontend Framework**: Vue 3 (Composition API)
- **State Management**: Pinia
- **Real-time Communication**: Agora RTC SDK
- **Build Tool**: Vite
- **Styling**: CSS Grid + CSS Custom Properties
- **Type Safety**: JavaScript (TypeScript hazırlığı)

### **Mimari Prensipler**
- **Modular Design**: Her özellik ayrı modülde
- **Composition over Inheritance**: Vue 3 Composition API
- **Responsive First**: Mobile-first responsive tasarım
- **Performance Optimized**: Minimal re-render ve efficient updates
- **Accessibility**: ARIA labels ve keyboard navigation

## 🏗️ **Proje Yapısı**

```
src/
├── modules/
│   └── agora/                    # Agora video konferans modülü
│       ├── components/           # Vue bileşenleri
│       │   ├── layouts/         # Layout bileşenleri
│       │   │   ├── GridLayout.vue      # Ana grid layout
│       │   │   ├── SpotlightLayout.vue # Spotlight layout
│       │   │   └── PresentationLayout.vue # Presentation layout
│       │   ├── video/           # Video bileşenleri
│       │   │   ├── VideoItem.vue       # Tek video item
│       │   │   └── VideoGrid.vue      # Video grid container
│       │   ├── controls/        # Kontrol bileşenleri
│       │   ├── forms/           # Form bileşenleri
│       │   └── ui/              # UI bileşenleri
│       ├── composables/         # Vue composables
│       │   ├── useMeeting.js    # Meeting state management
│       │   ├── useVideo.js      # Video track management
│       │   ├── useScreenShare.js # Screen sharing logic
│       │   └── useTheme.js      # Theme management
│       ├── store/               # Pinia store
│       │   ├── agora.js         # Agora state
│       │   └── layout.js        # Layout state
│       ├── services/            # External services
│       │   ├── tokenService.js  # Agora token service
│       │   └── recordingService.js # Recording service
│       └── utils/               # Utility functions
└── App.vue                      # Ana uygulama bileşeni
```

## 🎯 **Grid Layout Sistemi Mimarisi**

### **Core Grid Layout Component**
```vue
<!-- GridLayout.vue -->
<template>
  <div class="grid-layout">
    <div 
      class="video-grid"
      :data-count="totalVideoCount"
      :data-columns="gridLayout.columns"
      :data-rows="gridLayout.rows"
      :data-orientation="windowSize.height > windowSize.width ? 'portrait' : 'landscape'"
      :style="gridLayoutStyle"
    >
      <!-- Video Items -->
    </div>
  </div>
</template>
```

### **Grid Layout Hesaplama Algoritması**
```javascript
// Ekran oranına göre optimize edilmiş grid hesaplama
const gridLayout = computed(() => {
  const count = totalVideoCount.value
  const screenWidth = windowSize.value.width
  const screenHeight = windowSize.value.height
  const isPortrait = screenHeight > screenWidth
  
  // İçerik türlerini analiz et
  const hasLocalCamera = localCameraUser.value && localCameraHasVideo.value
  const hasLocalScreen = localScreenUser.value && localScreenHasVideo.value
  const remoteCameraCount = remoteUsers.value.filter(u => getUserHasVideo(u)).length
  const remoteScreenCount = remoteScreenShareUsers.value.filter(u => getUserHasVideo(u)).length
  
  // Akıllı grid layout hesaplama...
})
```

### **Responsive Grid Düzenlemeleri**
```css
/* Portrait (yükseklik > genişlik) */
@media (orientation: portrait) {
  .video-grid[data-count="2"] {
    grid-template-columns: 1fr !important;
    grid-template-rows: repeat(2, 1fr) !important;
  }
}

/* Landscape (genişlik > yükseklik) */
@media (orientation: landscape) {
  .video-grid[data-count="2"] {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: 1fr !important;
  }
}
```

## 🔄 **State Management Mimarisi**

### **Pinia Store Yapısı**
```javascript
// store/agora.js
export const useAgoraStore = defineStore('agora', () => {
  // State
  const localUser = ref(null)
  const remoteUsers = ref(new Map())
  const tracks = ref({
    local: new Map(),
    remote: new Map()
  })
  
  // Actions
  const joinChannel = async (channelName, token) => {
    // Channel join logic
  }
  
  const leaveChannel = async () => {
    // Channel leave logic
  }
  
  return {
    localUser,
    remoteUsers,
    tracks,
    joinChannel,
    leaveChannel
  }
})
```

### **Layout Store**
```javascript
// store/layout.js
export const useLayoutStore = defineStore('layout', () => {
  const currentLayout = ref('grid')
  const gridSettings = ref({
    columns: 3,
    rows: 2,
    gap: '0.5rem'
  })
  
  const setLayout = (layout) => {
    currentLayout.value = layout
  }
  
  return {
    currentLayout,
    gridSettings,
    setLayout
  }
})
```

## 🎥 **Video Management Mimarisi**

### **Video Track Management**
```javascript
// composables/useVideo.js
export function useVideo() {
  const localVideoTrack = ref(null)
  const localAudioTrack = ref(null)
  const remoteVideoTracks = ref(new Map())
  
  const publishLocalTracks = async () => {
    if (localVideoTrack.value) {
      await agoraClient.publish(localVideoTrack.value)
    }
    if (localAudioTrack.value) {
      await agoraClient.publish(localAudioTrack.value)
    }
  }
  
  const subscribeToRemoteTrack = async (user, mediaType) => {
    const track = await agoraClient.subscribe(user, mediaType)
    remoteVideoTracks.value.set(user.uid, track)
  }
  
  return {
    localVideoTrack,
    localAudioTrack,
    remoteVideoTracks,
    publishLocalTracks,
    subscribeToRemoteTrack
  }
}
```

### **Screen Sharing Architecture**
```javascript
// composables/useScreenShare.js
export function useScreenShare() {
  const isScreenSharing = ref(false)
  const screenTrack = ref(null)
  
  const startScreenShare = async () => {
    try {
      screenTrack.value = await AgoraRTC.createScreenVideoTrack()
      await agoraClient.publish(screenTrack.value)
      isScreenSharing.value = true
    } catch (error) {
      console.error('Screen share error:', error)
    }
  }
  
  const stopScreenShare = async () => {
    if (screenTrack.value) {
      await agoraClient.unpublish(screenTrack.value)
      screenTrack.value.stop()
      screenTrack.value = null
      isScreenSharing.value = false
    }
  }
  
  return {
    isScreenSharing,
    screenTrack,
    startScreenShare,
    stopScreenShare
  }
}
```

## 🎨 **Theme System Architecture**

### **Theme Management**
```javascript
// composables/useTheme.js
export function useTheme() {
  const currentTheme = ref('auto')
  const availableThemes = ['light', 'dark', 'auto']
  
  const setTheme = (theme) => {
    if (availableThemes.includes(theme)) {
      currentTheme.value = theme
      applyTheme(theme)
    }
  }
  
  const applyTheme = (theme) => {
    const root = document.documentElement
    if (theme === 'auto') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }
  
  return {
    currentTheme,
    availableThemes,
    setTheme
  }
}
```

### **CSS Custom Properties**
```css
:root {
  /* Light Theme */
  --rs-agora-bg-primary: #ffffff;
  --rs-agora-bg-secondary: #f8f9fa;
  --rs-agora-text-primary: #212529;
  --rs-agora-border-primary: #dee2e6;
}

[data-theme="dark"] {
  /* Dark Theme */
  --rs-agora-bg-primary: #1a1a1a;
  --rs-agora-bg-secondary: #2d2d2d;
  --rs-agora-text-primary: #ffffff;
  --rs-agora-border-primary: #404040;
}
```

## 📱 **Responsive Design Architecture**

### **Breakpoint System**
```css
/* Mobile First Approach */
/* Base styles for mobile */
.video-grid {
  grid-template-columns: 1fr;
  gap: 0.5rem;
  padding: 0.5rem;
}

/* Tablet */
@media (min-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0.75rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    padding: 1rem;
  }
}
```

### **Orientation-based Layouts**
```javascript
// Ekran oranına göre layout hesaplama
const getOptimalLayout = (count, isPortrait) => {
  if (count === 2) {
    return isPortrait 
      ? { columns: 1, rows: 2, aspectRatio: '1/2' }
      : { columns: 2, rows: 1, aspectRatio: '2/1' }
  }
  
  if (count === 3 || count === 4) {
    return isPortrait
      ? { columns: 2, rows: 2, aspectRatio: '1/1' }
      : { columns: count, rows: 1, aspectRatio: `${count}/1` }
  }
  
  // Diğer durumlar...
}
```

## 🔧 **Performance Architecture**

### **Optimization Strategies**
```javascript
// Lazy loading ve code splitting
const GridLayout = defineAsyncComponent(() => 
  import('./layouts/GridLayout.vue')
)

// Debounced resize handler
const debouncedResize = debounce(handleResize, 100)

// Computed properties ile memoization
const gridLayout = computed(() => {
  // Grid layout hesaplama
})
```

### **CSS Performance**
```css
/* Hardware acceleration */
.video-grid {
  transform: translateZ(0);
  will-change: transform;
}

/* Efficient transitions */
.video-item {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

/* Grid optimization */
.video-grid {
  grid-auto-rows: minmax(0, 1fr);
  box-sizing: border-box;
}
```

## 🧪 **Testing Architecture**

### **Unit Testing Strategy**
```javascript
// Component testing
import { mount } from '@vue/test-utils'
import GridLayout from '@/components/layouts/GridLayout.vue'

describe('GridLayout', () => {
  it('should render correct grid for 2 users', () => {
    const wrapper = mount(GridLayout, {
      props: { users: mockUsers }
    })
    
    expect(wrapper.find('.video-grid').attributes('data-count')).toBe('2')
  })
})
```

### **Integration Testing**
```javascript
// Store testing
import { setActivePinia, createPinia } from 'pinia'
import { useAgoraStore } from '@/store/agora'

describe('Agora Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should join channel successfully', async () => {
    const store = useAgoraStore()
    await store.joinChannel('test-channel', 'token')
    
    expect(store.isConnected).toBe(true)
  })
})
```

## 🚀 **Deployment Architecture**

### **Build Configuration**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'agora-sdk': ['agora-rtc-sdk-ng'],
          'vue-vendor': ['vue', 'pinia']
        }
      }
    }
  }
})
```

### **Environment Configuration**
```javascript
// constants.js
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production'
}

export const AGORA_CONFIG = {
  appId: import.meta.env.VITE_AGORA_APP_ID,
  token: import.meta.env.VITE_AGORA_TOKEN,
  channel: import.meta.env.VITE_AGORA_CHANNEL
}
```

## 🔒 **Security Architecture**

### **Token Management**
```javascript
// services/tokenService.js
export class TokenService {
  static async generateToken(channelName, uid) {
    // Server-side token generation
    const response = await fetch('/api/agora/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelName, uid })
    })
    
    return response.json()
  }
}
```

### **Input Validation**
```javascript
// utils/validation.js
export const validateChannelName = (channelName) => {
  const pattern = /^[a-zA-Z0-9_-]{3,64}$/
  return pattern.test(channelName)
}

export const sanitizeUserInput = (input) => {
  return input.replace(/[<>]/g, '')
}
```

## 📊 **Monitoring ve Analytics**

### **Performance Monitoring**
```javascript
// utils/performance.js
export const measureGridRenderTime = () => {
  const start = performance.now()
  
  return () => {
    const end = performance.now()
    const duration = end - start
    
    console.log(`Grid render time: ${duration.toFixed(2)}ms`)
    return duration
  }
}
```

### **Error Tracking**
```javascript
// utils/errorTracking.js
export const trackError = (error, context) => {
  console.error('Error occurred:', error)
  
  // Error reporting service
  if (import.meta.env.PROD) {
    // Sentry veya benzeri service
  }
}
```

## 🔮 **Gelecek Mimari Geliştirmeler**

### **Planlanan Özellikler**
- [ ] **Micro-frontend Architecture**: Modüler yapı
- [ ] **WebRTC Fallback**: Agora SDK alternatifi
- [ ] **Service Worker**: Offline capability
- [ ] **WebAssembly**: Performance kritik işlemler
- [ ] **GraphQL**: API optimization

### **Scalability Improvements**
- [ ] **Virtual Scrolling**: Büyük kullanıcı grupları
- [ ] **Lazy Loading**: Component ve asset lazy loading
- [ ] **Code Splitting**: Route-based code splitting
- [ ] **Bundle Optimization**: Tree shaking ve minification

## 📚 **İlgili Dokümantasyon**

- [🎯 Grid Layout Rehberi](RESPONSIVE_DESIGN.md)
- [🎥 Video Konferans Özellikleri](VIDEO_CONFERENCE.md)
- [🖥️ Ekran Paylaşımı](SCREEN_SHARING.md)
- [📱 UI Bileşenleri](UI_COMPONENTS.md)
- [🚀 Performans Optimizasyonu](PERFORMANCE.md)
- [🔧 Geliştirici Rehberi](DEVELOPMENT.md)

---

**Son Güncelleme**: 2025-01-09  
**Versiyon**: v5.0.0  
**Geliştirici**: Umran Terece
