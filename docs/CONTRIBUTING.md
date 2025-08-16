# 🤝 Katkıda Bulunma Rehberi

> Vue 3 Agora Video Conference Module - Geliştirici katkı rehberi

## 🎯 **Katkıda Bulunma Genel Bakış**

Bu dokümantasyon, projeye katkıda bulunmak isteyen geliştiriciler için rehber niteliğindedir. Proje standartları, geliştirme süreçleri ve katkı yöntemleri detaylandırılmıştır.

## 🚀 **Başlangıç**

### **1. Proje Kurulumu**

#### **Development Environment Setup**
```bash
# Projeyi fork edin
# GitHub'da projeyi fork edin

# Projeyi klonlayın
git clone https://github.com/YOUR_USERNAME/agora-vue-module.git
cd agora-vue-module

# Remote origin'i ekleyin
git remote add upstream https://github.com/ORIGINAL_OWNER/agora-vue-module.git

# Bağımlılıkları yükleyin
npm install

# Development server'ı başlatın
npm run dev

# Test'leri çalıştırın
npm run test
```

#### **Required Tools**
```bash
# Node.js 18+ gerekli
node --version

# npm 8+ gerekli
npm --version

# Git gerekli
git --version

# VS Code (önerilen)
# ESLint extension
# Prettier extension
# Vue Language Features extension
```

### **2. Proje Yapısını Anlama**

#### **Klasör Organizasyonu**
```
src/
├── modules/
│   └── agora/              # Ana Agora modülü
│       ├── components/      # Vue component'leri
│       ├── composables/     # Vue composable'ları
│       ├── store/           # Pinia store'ları
│       ├── services/        # API servisleri
│       ├── utils/           # Utility fonksiyonları
│       └── constants.js     # Sabitler
├── assets/                  # Statik dosyalar
└── main.js                  # Ana entry point

docs/                        # Dokümantasyon
tests/                       # Test dosyaları
examples/                    # Örnek kullanımlar
```

#### **Architecture Principles**
- **Modüler Yapı**: Her özellik ayrı modülde
- **Separation of Concerns**: Her dosya tek sorumluluğa sahip
- **Composition over Inheritance**: Vue 3 Composition API kullanımı
- **Reactive State Management**: Pinia ile state yönetimi
- **Event-Driven Architecture**: Central emitter ile event yönetimi

## 🔧 **Geliştirme Standartları**

### **1. Code Style Guidelines**

#### **JavaScript/Vue Standards**
```javascript
// ✅ İyi: Descriptive naming
const handleUserJoined = (userData) => {
  // Implementation
}

// ❌ Kötü: Kısa ve belirsiz
const handle = (data) => {
  // Implementation
}

// ✅ İyi: Consistent formatting
const userConfig = {
  name: 'John Doe',
  role: 'participant',
  permissions: ['video', 'audio']
}

// ✅ İyi: JSDoc documentation
/**
 * Kullanıcıyı kanala ekler
 * @param {Object} user - Kullanıcı bilgileri
 * @param {string} user.name - Kullanıcı adı
 * @param {string} user.role - Kullanıcı rolü
 * @returns {Promise<boolean>} Başarı durumu
 */
const addUserToChannel = async (user) => {
  // Implementation
}
```

#### **Vue Component Standards**
```vue
<!-- ✅ İyi: Consistent component structure -->
<template>
  <div class="component-name">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <LoadingSpinner />
    </div>
    
    <!-- Main content -->
    <main v-else class="main-content">
      <slot />
    </main>
    
    <!-- Error state -->
    <div v-if="error" class="error">
      <ErrorMessage :error="error" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ErrorMessage from './ErrorMessage.vue'

// Props
const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits([
  'data-loaded',
  'error'
])

// Reactive state
const isLoading = ref(false)
const error = ref(null)
const data = ref(props.initialData)

// Computed properties
const hasData = computed(() => Object.keys(data.value).length > 0)

// Methods
const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // Data loading logic
    const result = await fetchData()
    data.value = result
    
    emit('data-loaded', result)
  } catch (err) {
    error.value = err
    emit('error', err)
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  if (!hasData.value) {
    loadData()
  }
})
</script>

<style scoped>
.component-name {
  /* Component styles */
}

.loading {
  /* Loading styles */
}

.error {
  /* Error styles */
}
</style>
```

### **2. Naming Conventions**

#### **File Naming**
```bash
# ✅ İyi: PascalCase for components
AgoraConference.vue
VideoGrid.vue
RecordingControls.vue

# ✅ İyi: camelCase for utilities
useMeeting.js
useVideo.js
formatTime.js

# ✅ İyi: kebab-case for CSS classes
.video-grid
.recording-controls
.error-message

# ✅ İyi: UPPER_SNAKE_CASE for constants
AGORA_EVENTS.js
RECORDING_CONFIG.js
VIDEO_QUALITY_PRESETS.js
```

#### **Variable Naming**
```javascript
// ✅ İyi: Descriptive variable names
const isUserConnected = ref(false)
const videoTrack = ref(null)
const networkQualityLevel = computed(() => getQualityLevel())

// ❌ Kötü: Abbreviated names
const connected = ref(false)
const track = ref(null)
const quality = computed(() => getLevel())

// ✅ İyi: Boolean variables start with is/has/can
const isLoading = ref(false)
const hasVideo = ref(true)
const canShareScreen = ref(false)

// ✅ İyi: Function names are verbs
const joinChannel = async () => { /* ... */ }
const toggleCamera = () => { /* ... */ }
const updateUserPermissions = () => { /* ... */ }
```

### **3. Documentation Standards**

#### **JSDoc Documentation**
```javascript
/**
 * Agora video client yönetimi
 * @module composables/useVideo
 * @description Video client'ı oluşturur, yönetir ve temizler
 * @example
 * ```javascript
 * const { client, joinChannel, leaveChannel } = useVideo()
 * await joinChannel({ channelName: 'test', token: 'xxx' })
 * ```
 */

/**
 * Kullanıcıyı kanala ekler
 * @async
 * @function joinChannel
 * @param {Object} params - Katılma parametreleri
 * @param {string} params.channelName - Kanal adı
 * @param {string} params.token - Agora token
 * @param {number} params.uid - Kullanıcı ID'si
 * @param {string} params.appId - Agora App ID
 * @returns {Promise<void>} Katılma işlemi sonucu
 * @throws {Error} Token geçersiz veya network hatası
 * @example
 * ```javascript
 * try {
 *   await joinChannel({
 *     channelName: 'team-meeting',
 *     token: 'your-token',
 *     uid: 12345,
 *     appId: 'your-app-id'
 *   })
 *   console.log('Kanala başarıyla katıldı')
 * } catch (error) {
 *   console.error('Katılma hatası:', error)
 * }
 * ```
 */
export const joinChannel = async (params) => {
  // Implementation
}
```

#### **README Documentation**
```markdown
# Component Name

Kısa açıklama - bu component ne yapar?

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `channelName` | `string` | `''` | Video konferans kanal adı |
| `autoJoin` | `boolean` | `false` | Otomatik kanala katılma |
| `userUid` | `number` | `null` | Kullanıcı benzersiz ID'si |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `joined` | `{ channelName, token, uid }` | Kanala başarıyla katıldığında |
| `left` | `{ channelName }` | Kanaldan ayrıldığında |
| `error` | `{ error, message }` | Hata oluştuğunda |

## Slots

| Slot | Description |
|------|-------------|
| `default` | Ana içerik |
| `controls` | Kontrol butonları |
| `footer` | Alt bilgi alanı |

## Usage

```vue
<template>
  <AgoraConference
    :channelName="'team-meeting'"
    :autoJoin="true"
    @joined="onJoined"
    @error="onError"
  >
    <template #controls>
      <button @click="toggleCamera">Kamera</button>
    </template>
  </AgoraConference>
</template>
```

## Examples

- [Basic Usage](./examples/basic-usage.md)
- [Advanced Configuration](./examples/advanced-config.md)
- [Custom Controls](./examples/custom-controls.md)
```

## 🧪 **Testing Standards**

### **1. Test Structure**

#### **Test File Organization**
```javascript
// tests/unit/composables/useVideo.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVideo } from '@/composables/useVideo'
import { createPinia, setActivePinia } from 'pinia'

describe('useVideo', () => {
  let pinia
  let mockStore
  
  beforeEach(() => {
    // Pinia store'u kur
    pinia = createPinia()
    setActivePinia(pinia)
    
    // Mock store oluştur
    mockStore = {
      clients: {
        video: { client: null, isConnected: false }
      },
      tracks: {
        local: { video: null, audio: null }
      }
    }
  })
  
  describe('joinChannel', () => {
    it('should join channel successfully', async () => {
      // Arrange
      const { joinChannel } = useVideo(mockStore)
      const params = {
        channelName: 'test-channel',
        token: 'test-token',
        uid: 12345,
        appId: 'test-app-id'
      }
      
      // Act
      const result = await joinChannel(params)
      
      // Assert
      expect(result.success).toBe(true)
      expect(mockStore.clients.video.isConnected).toBe(true)
    })
    
    it('should handle join channel error', async () => {
      // Arrange
      const { joinChannel } = useVideo(mockStore)
      const invalidParams = {
        channelName: '',
        token: '',
        uid: null,
        appId: ''
      }
      
      // Act & Assert
      await expect(joinChannel(invalidParams)).rejects.toThrow('Invalid parameters')
    })
  })
  
  describe('leaveChannel', () => {
    it('should leave channel successfully', async () => {
      // Arrange
      mockStore.clients.video.isConnected = true
      const { leaveChannel } = useVideo(mockStore)
      
      // Act
      await leaveChannel()
      
      // Assert
      expect(mockStore.clients.video.isConnected).toBe(false)
    })
  })
})
```

#### **Test Coverage Requirements**
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  },
  "coverage": {
    "thresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### **2. Testing Best Practices**

#### **Test Writing Guidelines**
```javascript
// ✅ İyi: Descriptive test names
it('should disable camera when user has no permission', async () => {
  // Test implementation
})

// ✅ İyi: Arrange-Act-Assert pattern
it('should update user status when connection changes', async () => {
  // Arrange
  const { updateConnectionStatus } = useConnection()
  const mockStatus = 'connected'
  
  // Act
  updateConnectionStatus(mockStatus)
  
  // Assert
  expect(connectionStatus.value).toBe(mockStatus)
})

// ✅ İyi: Mock external dependencies
it('should handle API error gracefully', async () => {
  // Arrange
  vi.spyOn(api, 'createToken').mockRejectedValue(new Error('API Error'))
  
  // Act & Assert
  await expect(createToken('channel', 123)).rejects.toThrow('API Error')
})

// ✅ İyi: Test edge cases
it('should handle empty user list', () => {
  // Arrange
  const users = []
  
  // Act
  const result = processUsers(users)
  
  // Assert
  expect(result).toEqual([])
  expect(result.length).toBe(0)
})
```

## 🔄 **Git Workflow**

### **1. Branch Strategy**

#### **Branch Naming Convention**
```bash
# Feature branches
feature/user-authentication
feature/screen-sharing
feature/recording-controls

# Bug fix branches
fix/video-quality-issue
fix/audio-permission-bug
fix/connection-timeout

# Hotfix branches
hotfix/critical-security-issue
hotfix/production-crash

# Documentation branches
docs/api-reference-update
docs/component-examples
docs/performance-guide
```

#### **Commit Message Format**
```bash
# Conventional Commits format
feat: add screen sharing functionality
fix: resolve video quality degradation
docs: update API documentation
style: improve button styling
refactor: optimize video track management
test: add unit tests for useVideo composable
chore: update dependencies
```

### **2. Pull Request Process**

#### **PR Template**
```markdown
## Description
Bu PR ne yapıyor? Hangi özelliği ekliyor/düzeltiyor?

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Corresponding changes to documentation made
- [ ] No console errors or warnings
- [ ] Performance impact considered

## Screenshots (if applicable)
[Ekran görüntüleri ekleyin]

## Additional Notes
[Ek notlar]
```

#### **Code Review Guidelines**
```markdown
## Code Review Checklist

### Code Quality
- [ ] Code is readable and well-structured
- [ ] Naming conventions followed
- [ ] No code duplication
- [ ] Error handling implemented
- [ ] Performance considerations addressed

### Testing
- [ ] Tests cover new functionality
- [ ] Tests are meaningful and descriptive
- [ ] Edge cases considered
- [ ] Mock usage appropriate

### Documentation
- [ ] JSDoc comments added
- [ ] README updated if needed
- [ ] API changes documented
- [ ] Examples provided

### Security
- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] Error messages don't leak information
- [ ] Permissions properly checked
```

## 📚 **Documentation Standards**

### **1. Code Documentation**

#### **Component Documentation**
```vue
<!--
  @component AgoraConference
  @description Ana video konferans component'i. Tüm konferans işlevselliğini birleştirir.
  @example
  ```vue
  <AgoraConference
    :channelName="'team-meeting'"
    :autoJoin="true"
    @joined="onJoined"
  />
  ```
  @author Your Name
  @since v1.0.0
  @version 1.0.0
-->
<template>
  <!-- Component template -->
</template>
```

#### **API Documentation**
```javascript
/**
 * @api {post} /api/recording/start Recording başlat
 * @apiName StartRecording
 * @apiGroup Recording
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} channelName Kanal adı
 * @apiParam {String} token Agora token
 * @apiParam {Object} config Recording konfigürasyonu
 * @apiParam {Number} config.maxIdleTime Maksimum boşluk süresi
 * @apiParam {Number} config.streamTypes Stream tipleri
 * 
 * @apiSuccess {Boolean} success İşlem başarı durumu
 * @apiSuccess {String} recordingId Recording ID'si
 * @apiSuccess {String} message Başarı mesajı
 * 
 * @apiError {Object} error Hata objesi
 * @apiError {String} error.message Hata mesajı
 * @apiError {Number} error.code Hata kodu
 * 
 * @apiExample {curl} Example usage:
 * curl -X POST https://api.example.com/recording/start \
 *   -H "Content-Type: application/json" \
 *   -d '{"channelName":"test","token":"xxx","config":{"maxIdleTime":30}}'
 */
```

### **2. Project Documentation**

#### **README Structure**
```markdown
# Project Name

Kısa proje açıklaması

## Features

- ✅ Video konferans
- ✅ Ekran paylaşımı
- ✅ Cloud recording
- ✅ Real-time logging

## Quick Start

```bash
npm install
npm run dev
```

## Documentation

- [Getting Started](./docs/GETTING_STARTED.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Component Guide](./docs/UI_COMPONENTS.md)
- [Deployment](./docs/DEPLOYMENT.md)

## Contributing

[Contributing Guide](./docs/CONTRIBUTING.md)

## License

MIT License
```

## 🚀 **Performance Guidelines**

### **1. Code Optimization**

#### **Performance Best Practices**
```javascript
// ✅ İyi: Computed properties kullan
const expensiveValue = computed(() => {
  return heavyCalculation(data.value)
})

// ❌ Kötü: Her render'da hesaplama
const expensiveValue = heavyCalculation(data.value)

// ✅ İyi: Event debouncing
const debouncedSearch = debounce((query) => {
  performSearch(query)
}, 300)

// ✅ İyi: Lazy loading
const HeavyComponent = () => import('./HeavyComponent.vue')

// ✅ İyi: Memory cleanup
onUnmounted(() => {
  clearInterval(timer)
  clearTimeout(timeout)
})
```

#### **Bundle Optimization**
```javascript
// ✅ İyi: Tree shaking için named imports
import { createClient, joinChannel } from 'agora-rtc-sdk-ng'

// ❌ Kötü: Tüm modülü import et
import * as AgoraRTC from 'agora-rtc-sdk-ng'

// ✅ İyi: Dynamic imports
const RecordingControls = () => import('./RecordingControls.vue')

// ✅ İyi: Chunk splitting
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

## 🔒 **Security Guidelines**

### **1. Security Best Practices**

#### **Input Validation**
```javascript
// ✅ İyi: Input validation
const validateChannelName = (channelName) => {
  if (!channelName || typeof channelName !== 'string') {
    throw new Error('Channel name must be a non-empty string')
  }
  
  if (channelName.length > 64) {
    throw new Error('Channel name too long')
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(channelName)) {
    throw new Error('Channel name contains invalid characters')
  }
  
  return true
}

// ✅ İyi: XSS prevention
const sanitizeInput = (input) => {
  return input.replace(/[<>]/g, '')
}

// ✅ İyi: CSRF protection
const addCSRFToken = (headers) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.content
  if (token) {
    headers['X-CSRF-Token'] = token
  }
  return headers
}
```

#### **Permission Management**
```javascript
// ✅ İyi: Permission checking
const checkPermission = (action, resource) => {
  const userPermissions = getUserPermissions()
  return userPermissions.includes(`${action}:${resource}`)
}

// ✅ İyi: Role-based access control
const canAccessFeature = (feature, userRole) => {
  const rolePermissions = {
    admin: ['all'],
    moderator: ['video', 'audio', 'screen-share'],
    participant: ['video', 'audio']
  }
  
  return rolePermissions[userRole]?.includes(feature) || false
}
```

## 📊 **Quality Assurance**

### **1. Code Quality Tools**

#### **ESLint Configuration**
```json
{
  "extends": [
    "@vue/eslint-config-prettier",
    "plugin:vue/vue3-essential"
  ],
  "rules": {
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "vue/component-definition-name-casing": ["error", "PascalCase"],
    "vue/require-default-prop": "error",
    "vue/require-prop-types": "error",
    "vue/require-valid-default-prop": "error",
    "vue/no-unused-vars": "error",
    "vue/no-unused-components": "error"
  }
}
```

#### **Prettier Configuration**
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "vueIndentScriptAndStyle": true
}
```

### **2. Quality Gates**

#### **Pre-commit Hooks**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{md,json}": [
      "prettier --write"
    ]
  }
}
```

## 🎉 **Recognition**

### **1. Contributor Recognition**

#### **Contributors List**
```markdown
## Contributors

Bu projeye katkıda bulunan herkese teşekkürler!

### Core Contributors
- [@umranterece](https://github.com/umranterece) - Project Lead
- [@contributor1](https://github.com/contributor1) - Video Module
- [@contributor2](https://github.com/contributor2) - UI Components

### Contributors
- [@contributor3](https://github.com/contributor3) - Bug fixes
- [@contributor4](https://github.com/contributor4) - Documentation
- [@contributor5](https://github.com/contributor5) - Testing
```

#### **Contribution Badges**
```markdown
## Contribution Badges

- 🥇 **Gold Contributor**: 50+ commits, major features
- 🥈 **Silver Contributor**: 20+ commits, significant improvements
- 🥉 **Bronze Contributor**: 5+ commits, bug fixes
- 📚 **Documentation Hero**: Major documentation contributions
- 🧪 **Testing Champion**: Comprehensive test coverage
- 🎨 **UI/UX Master**: Design and user experience improvements
```

---

> **💡 İpucu**: Bu katkıda bulunma rehberi ile projeye değerli katkılar sağlayabilir ve toplulukta aktif rol alabilirsiniz.

