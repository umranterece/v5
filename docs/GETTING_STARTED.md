# Getting Started - RS Agora Module

Bu rehber, RS Agora Module'ü projenize entegre etmek için gerekli adımları detaylandırır.

## 📋 Gereksinimler

### Minimum Gereksinimler
- **Node.js**: 18.x veya üzeri
- **Vue**: 3.x
- **Agora Account**: [Agora.io](https://www.agora.io/) üzerinden ücretsiz hesap

### Peer Dependencies
```json
{
  "vue": "^3.0.0",
  "pinia": "^3.0.0",
  "agora-rtc-sdk-ng": "^4.0.0",
  "mitt": "^3.0.0"
}
```

## 🚀 Kurulum

### 1. Paket Kurulumu
```bash
npm install rs-agora-module
```

### 2. Agora Hesap Kurulumu
1. [Agora.io](https://www.agora.io/) adresine gidin
2. Ücretsiz hesap oluşturun
3. Yeni bir proje oluşturun
4. **App ID**'yi not alın
5. **Token Server** kurulumu yapın (opsiyonel)

### 3. Environment Variables
`.env` dosyası oluşturun:

```env
VITE_AGORA_APP_ID=your_agora_app_id_here
VITE_AGORA_TOKEN_ENDPOINT=https://your-token-server.com/token
```

## 🎯 Hızlı Başlangıç

### Basit Kullanım
En basit haliyle modülü kullanmak için:

```vue
<template>
  <div class="app">
    <h1>Video Konferans</h1>
    <AgoraConference />
  </div>
</template>

<script setup>
import { AgoraConference } from 'rs-agora-module'
</script>
```

### Composable ile Kullanım
Daha fazla kontrol için composable kullanın:

```vue
<template>
  <div class="app">
    <div v-if="!isConnected">
      <JoinForm @join="handleJoin" />
    </div>
    
    <div v-else>
      <AgoraVideo
        :localUser="localUser"
        :remoteUsers="remoteUsers"
        :allUsers="allUsers"
        :localTracks="localTracks"
        :remoteTracks="remoteTracks"
      />
      
      <AgoraControls
        :isConnected="isConnected"
        :isLocalVideoOff="isLocalVideoOff"
        :isLocalAudioMuted="isLocalAudioMuted"
        :onToggleCamera="toggleCamera"
        :onToggleMicrophone="toggleMicrophone"
        :onLeave="leaveChannel"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  AgoraVideo, 
  AgoraControls, 
  JoinForm,
  useMeeting 
} from 'rs-agora-module'

const {
  isConnected,
  localUser,
  remoteUsers,
  allUsers,
  localTracks,
  remoteTracks,
  isLocalVideoOff,
  isLocalAudioMuted,
  joinChannel,
  leaveChannel,
  toggleCamera,
  toggleMicrophone,
  cleanup
} = useMeeting()

const handleJoin = async (channelName) => {
  try {
    await joinChannel(channelName, 'your-app-id')
  } catch (error) {
    console.error('Join failed:', error)
  }
}

onUnmounted(() => {
  cleanup()
})
</script>
```

## 🔧 Konfigürasyon

### Constants Konfigürasyonu
Modül davranışını özelleştirmek için constants'ları override edin:

```javascript
// constants-override.js
import { 
  VIDEO_CONFIG, 
  SCREEN_SHARE_CONFIG,
  AGORA_CONFIG 
} from 'rs-agora-module'

// Video kalitesini artır
export const CUSTOM_VIDEO_CONFIG = {
  ...VIDEO_CONFIG,
  encoderConfig: '1080p_1',
  bitrateMin: 3000,
  bitrateMax: 6000,
  frameRate: 30
}

// Ekran paylaşımı kalitesini artır
export const CUSTOM_SCREEN_CONFIG = {
  ...SCREEN_SHARE_CONFIG.HIGH_QUALITY,
  encoderConfig: '1080p_1',
  bitrateMin: 3000,
  bitrateMax: 6000
}
```

### Store Konfigürasyonu
Pinia store'larını özelleştirin:

```javascript
// store-override.js
import { useAgoraStore } from 'rs-agora-module'

export const useCustomAgoraStore = () => {
  const store = useAgoraStore()
  
  // Custom actions
  const customJoinChannel = async (channelName, appId) => {
    // Custom logic before joining
    console.log('Custom join logic:', channelName)
    
    // Call original method
    return store.joinChannel(channelName, appId)
  }
  
  return {
    ...store,
    customJoinChannel
  }
}
```

## 🎨 Layout Sistemi

### Layout Seçimi
Üç farklı layout arasından seçim yapın:

```vue
<template>
  <div class="conference">
    <!-- Layout Seçici -->
    <div class="layout-selector">
      <button @click="setLayout('grid')">Grid</button>
      <button @click="setLayout('spotlight')">Spotlight</button>
      <button @click="setLayout('presentation')">Presentation</button>
    </div>
    
    <!-- Layout Modal -->
    <LayoutModal
      :isOpen="showLayoutModal"
      @close="showLayoutModal = false"
    />
    
    <!-- Video Area -->
    <AgoraVideo
      :users="allUsers"
      :localTracks="localTracks"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLayoutStore } from 'rs-agora-module'

const layoutStore = useLayoutStore()
const showLayoutModal = ref(false)

const setLayout = (layout) => {
  layoutStore.setLayout(layout)
}
</script>
```

### Custom Layout
Kendi layout'ınızı oluşturun:

```vue
<template>
  <div class="custom-layout">
    <!-- Ana video alanı -->
    <div class="main-video">
      <VideoItem
        v-if="mainUser"
        :user="mainUser"
        :track="getUserTrack(mainUser)"
        :is-main="true"
      />
    </div>
    
    <!-- Yan video alanı -->
    <div class="side-videos">
      <VideoItem
        v-for="user in sideUsers"
        :key="user.uid"
        :user="user"
        :track="getUserTrack(user)"
        :is-small="true"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAgoraStore } from 'rs-agora-module'
import VideoItem from './VideoItem.vue'

const agoraStore = useAgoraStore()

const allUsers = computed(() => agoraStore.allUsers)
const mainUser = computed(() => allUsers.value[0])
const sideUsers = computed(() => allUsers.value.slice(1))

const getUserTrack = (user) => {
  return agoraStore.tracks.remote.get(user.uid)?.video
}
</script>
```

## 🎥 Ekran Paylaşımı

### Ekran Paylaşımı Başlatma
Ekran paylaşımı özelliğini kullanın:

```vue
<template>
  <div class="controls">
    <button 
      @click="toggleScreenShare"
      :class="{ active: isScreenSharing }"
    >
      {{ isScreenSharing ? 'Paylaşımı Durdur' : 'Ekranı Paylaş' }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMeeting } from 'rs-agora-module'

const { isScreenSharing, toggleScreenShare } = useMeeting()
</script>
```

### Ekran Paylaşımı Kalite Ayarları
Ekran paylaşımı kalitesini optimize edin:

```javascript
import { SCREEN_SHARE_CONFIG } from 'rs-agora-module'

// Hızlı başlatma için
const fastStartConfig = SCREEN_SHARE_CONFIG.FAST_START

// Yüksek kalite için
const highQualityConfig = SCREEN_SHARE_CONFIG.HIGH_QUALITY

// Düşük kalite fallback için
const lowQualityConfig = SCREEN_SHARE_CONFIG.LOW_QUALITY
```

## 📱 Responsive Tasarım

### CSS Variables
Responsive tasarım için CSS variables kullanın:

```css
:root {
  --agora-primary-color: #667eea;
  --agora-secondary-color: #764ba2;
  --agora-background: #1a1a2e;
  --agora-surface: #16213e;
  --agora-border-radius: 10px;
  --agora-spacing: 16px;
}

.agora-component {
  background: var(--agora-surface);
  border-radius: var(--agora-border-radius);
  padding: var(--agora-spacing);
}
```

### Media Queries
Mobil uyumluluk için media queries:

```css
.agora-controls {
  /* Mobile first */
  padding: 8px;
  gap: 8px;
}

@media (min-width: 768px) {
  .agora-controls {
    padding: 16px;
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  .agora-controls {
    padding: 24px;
    gap: 24px;
  }
}
```

## 🔒 Güvenlik

### Token Yönetimi
Güvenli token yönetimi:

```javascript
import { createToken } from 'rs-agora-module'

const getSecureToken = async (channelName, uid) => {
  try {
    // Token'ı güvenli endpoint'den al
    const token = await createToken(channelName, uid)
    
    // Token expiration kontrolü
    if (isTokenExpired(token)) {
      throw new Error('Token expired')
    }
    
    return token
  } catch (error) {
    console.error('Token error:', error)
    throw error
  }
}

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
Cihaz izinlerini güvenli şekilde yönetin:

```javascript
const checkDevicePermissions = async () => {
  try {
    const videoPermission = await navigator.permissions.query({ name: 'camera' })
    const audioPermission = await navigator.permissions.query({ name: 'microphone' })
    
    return {
      camera: videoPermission.state,
      microphone: audioPermission.state
    }
  } catch (error) {
    console.error('Permission check failed:', error)
    return { camera: 'denied', microphone: 'denied' }
  }
}
```

## 🧪 Test

### Component Testing
Vue bileşenlerini test edin:

```javascript
// AgoraConference.test.js
import { mount } from '@vue/test-utils'
import { AgoraConference } from 'rs-agora-module'

describe('AgoraConference', () => {
  it('renders join form when not connected', () => {
    const wrapper = mount(AgoraConference)
    expect(wrapper.find('.join-form').exists()).toBe(true)
  })
  
  it('shows video area when connected', async () => {
    const wrapper = mount(AgoraConference)
    
    // Mock connection state
    await wrapper.setData({ isConnected: true })
    
    expect(wrapper.find('.video-area').exists()).toBe(true)
  })
})
```

### Composable Testing
Composable'ları test edin:

```javascript
// useMeeting.test.js
import { useMeeting } from 'rs-agora-module'
import { createPinia, setActivePinia } from 'pinia'

describe('useMeeting', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('initializes with default state', () => {
    const { isConnected, localUser } = useMeeting()
    
    expect(isConnected.value).toBe(false)
    expect(localUser.value).toBeNull()
  })
})
```

## 🚀 Performance

### Memory Management
Memory leak'leri önleyin:

```javascript
import { onUnmounted } from 'vue'
import { useMeeting } from 'rs-agora-module'

const { cleanup } = useMeeting()

onUnmounted(() => {
  // Tüm resources'ları temizle
  cleanup()
})
```

### Lazy Loading
Component'leri lazy load edin:

```javascript
// Lazy loading
const AgoraConference = defineAsyncComponent(() => 
  import('rs-agora-module').then(m => m.AgoraConference)
)

const AgoraVideo = defineAsyncComponent(() => 
  import('rs-agora-module').then(m => m.AgoraVideo)
)
```

## 🔍 Debug

### Logging Sistemi
Debug için logging sistemini kullanın:

```javascript
import { useLogger } from 'rs-agora-module'

const { logUI, logError, logDebug } = useLogger()

// UI log
logUI('User clicked join button', { channelName: 'test' })

// Error log
logError(new Error('Join failed'), { context: 'joinChannel' })

// Debug log
logDebug('Video track created', { trackId: '123' })
```

### Log Modal
Gerçek zamanlı log görüntüleme:

```vue
<template>
  <LogModal
    :isOpen="showLogs"
    :logs="logs"
    :logStats="logStats"
    @close="showLogs = false"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useLogger, LogModal } from 'rs-agora-module'

const { logs, logStats } = useLogger()
const showLogs = ref(false)
</script>
```

## 📚 Örnekler

### Basic Conference
Temel konferans örneği:

```vue
<template>
  <div class="basic-conference">
    <AgoraConference />
  </div>
</template>

<script setup>
import { AgoraConference } from 'rs-agora-module'
</script>
```

### Advanced Conference
Gelişmiş konferans örneği:

```vue
<template>
  <div class="advanced-conference">
    <div class="header">
      <h1>Team Meeting</h1>
      <div class="stats">
        <span>Users: {{ connectedUsersCount }}</span>
        <span>Quality: {{ qualityLevel }}</span>
      </div>
    </div>
    
    <div class="main-content">
      <AgoraVideo
        :users="allUsers"
        :localTracks="localTracks"
      />
      
      <AgoraControls
        :isConnected="isConnected"
        :onToggleCamera="toggleCamera"
        :onToggleMicrophone="toggleMicrophone"
        :onToggleScreenShare="toggleScreenShare"
      />
    </div>
    
    <div class="sidebar">
      <InfoModal
        :isOpen="showInfo"
        :channelName="channelName"
        :isConnected="isConnected"
        :connectedUsersCount="connectedUsersCount"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  AgoraVideo, 
  AgoraControls, 
  InfoModal,
  useMeeting 
} from 'rs-agora-module'

const {
  isConnected,
  channelName,
  allUsers,
  localTracks,
  connectedUsersCount,
  qualityLevel,
  toggleCamera,
  toggleMicrophone,
  toggleScreenShare
} = useMeeting()

const showInfo = ref(false)
</script>
```

## 🆘 Sorun Giderme

### Yaygın Sorunlar

#### 1. Kamera/Mikrofon İzni
```javascript
// İzin kontrolü
const checkPermissions = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Permission denied:', error)
    return false
  }
}
```

#### 2. Network Bağlantısı
```javascript
// Network quality monitoring
const { networkQuality, qualityLevel } = useStreamQuality()

watch(qualityLevel, (newLevel) => {
  if (newLevel === 'poor') {
    console.warn('Poor network quality detected')
  }
})
```

#### 3. Token Hatası
```javascript
// Token validation
const validateToken = (token) => {
  if (!token) return false
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp > Date.now() / 1000
  } catch {
    return false
  }
}
```

## 📖 Sonraki Adımlar

1. **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md) dosyasını okuyun
2. **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md) ile mimariyi anlayın
3. **Examples**: [examples/](../examples/) klasöründeki örnekleri inceleyin
4. **Performance**: [PERFORMANCE.md](./PERFORMANCE.md) ile optimizasyonları öğrenin

---

Bu rehber ile RS Agora Module'ü projenize entegre edebilir ve video konferans özelliklerini kullanmaya başlayabilirsiniz.

