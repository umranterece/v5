# 🧪 **Test Stratejileri Rehberi**

> **Context Engineering** yaklaşımı ile hazırlanmış kapsamlı test dokümantasyonu

## 🎯 **Genel Bakış**

Bu dokümantasyon, **rs-agora-module** projesinin test stratejilerini ve test yaklaşımlarını detaylandırır. **Context Engineering** prensiplerine uygun olarak, test kararlarının nedenleri ve test senaryolarının mantığı açıklanmıştır.

## 🏗️ **Test Mimarisi**

### **1. Test Piramidi**
```
        ┌─────────────┐
        │   E2E Tests │ ← Kullanıcı deneyimi odaklı
        │   (5-10%)   │
        └─────────────┘
               │
        ┌─────────────┐
        │Integration  │ ← Component interaction
        │  Tests      │   (15-20%)
        │ (15-20%)    │
        └─────────────┘
               │
        ┌─────────────┐
        │  Unit Tests │ ← Fonksiyonel doğruluk
        │  (70-80%)   │
        └─────────────┘
```

### **2. Test Stratejisi Prensipleri**
- **Test First**: TDD/BDD yaklaşımı
- **Comprehensive Coverage**: Kapsamlı test coverage
- **Realistic Scenarios**: Gerçekçi test senaryoları
- **Performance Testing**: Performance regression testleri
- **Security Testing**: Güvenlik testleri

## 🧩 **Unit Testing**

### **1. Composable Testing**
```javascript
// useMeeting.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMeeting } from '../useMeeting'
import { AgoraRTC } from 'agora-rtc-sdk-ng'

// Mock Agora RTC
vi.mock('agora-rtc-sdk-ng', () => ({
  AgoraRTC: {
    createClient: vi.fn(),
    createMicrophoneAndCameraTracks: vi.fn()
  }
}))

describe('useMeeting', () => {
  let meeting

  beforeEach(() => {
    vi.clearAllMocks()
    meeting = useMeeting()
  })

  describe('joinChannel', () => {
    it('should join channel successfully with valid parameters', async () => {
      const mockClient = {
        join: vi.fn().mockResolvedValue(),
        publish: vi.fn().mockResolvedValue()
      }
      
      AgoraRTC.createClient.mockReturnValue(mockClient)
      
      const result = await meeting.joinChannel('test-channel', 'test-token')
      
      expect(result.success).toBe(true)
      expect(mockClient.join).toHaveBeenCalledWith('test-token', 'test-channel', null)
    })

    it('should handle join failure gracefully', async () => {
      const mockClient = {
        join: vi.fn().mockRejectedValue(new Error('Join failed'))
      }
      
      AgoraRTC.createClient.mockReturnValue(mockClient)
      
      const result = await meeting.joinChannel('test-channel', 'test-token')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Join failed')
    })

    it('should validate channel name before joining', async () => {
      const result = await meeting.joinChannel('', 'test-token')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Channel name is required')
    })
  })

  describe('leaveChannel', () => {
    it('should leave channel and cleanup resources', async () => {
      const mockClient = {
        leave: vi.fn().mockResolvedValue(),
        unpublish: vi.fn().mockResolvedValue()
      }
      
      meeting.client = mockClient
      meeting.localTracks = [{ stop: vi.fn() }]
      
      await meeting.leaveChannel()
      
      expect(mockClient.leave).toHaveBeenCalled()
      expect(mockClient.unpublish).toHaveBeenCalled()
      expect(meeting.localTracks[0].stop).toHaveBeenCalled()
    })
  })
})
```

### **2. Component Testing**
```javascript
// AgoraConference.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AgoraConference from '../AgoraConference.vue'
import { useMeeting } from '../composables/useMeeting'

// Mock composable
vi.mock('../composables/useMeeting', () => ({
  useMeeting: vi.fn()
}))

describe('AgoraConference', () => {
  let wrapper
  let mockMeeting

  beforeEach(() => {
    mockMeeting = {
      joinChannel: vi.fn(),
      leaveChannel: vi.fn(),
      isConnected: ref(false),
      localUser: ref(null),
      remoteUsers: ref([]),
      error: ref(null)
    }
    
    useMeeting.mockReturnValue(mockMeeting)
  })

  it('should render conference interface', () => {
    wrapper = mount(AgoraConference, {
      props: {
        channelName: 'test-channel',
        autoJoin: false
      }
    })
    
    expect(wrapper.find('.agora-conference').exists()).toBe(true)
    expect(wrapper.find('.video-grid').exists()).toBe(true)
    expect(wrapper.find('.controls').exists()).toBe(true)
  })

  it('should auto-join channel when autoJoin is true', async () => {
    wrapper = mount(AgoraConference, {
      props: {
        channelName: 'test-channel',
        autoJoin: true
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(mockMeeting.joinChannel).toHaveBeenCalledWith('test-channel')
  })

  it('should emit joined event when successfully connected', async () => {
    mockMeeting.isConnected.value = true
    mockMeeting.localUser.value = { uid: '123', name: 'Test User' }
    
    wrapper = mount(AgoraConference, {
      props: {
        channelName: 'test-channel',
        autoJoin: false
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('joined')).toBeTruthy()
    expect(wrapper.emitted('joined')[0][0]).toEqual({
      channelName: 'test-channel',
      user: { uid: '123', name: 'Test User' }
    })
  })

  it('should handle connection errors', async () => {
    mockMeeting.error.value = 'Connection failed'
    
    wrapper = mount(AgoraConference, {
      props: {
        channelName: 'test-channel',
        autoJoin: false
      }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.emitted('error')).toBeTruthy()
    expect(wrapper.emitted('error')[0][0]).toBe('Connection failed')
  })
})
```

### **3. Service Testing**
```javascript
// tokenService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TokenService } from '../tokenService'

// Mock fetch
global.fetch = vi.fn()

describe('TokenService', () => {
  let tokenService

  beforeEach(() => {
    vi.clearAllMocks()
    tokenService = new TokenService('https://token-server.com')
  })

  describe('getToken', () => {
    it('should fetch token successfully', async () => {
      const mockResponse = { token: 'test-token-123' }
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })
      
      const token = await tokenService.getToken('test-channel', 'user-123')
      
      expect(token).toBe('test-token-123')
      expect(fetch).toHaveBeenCalledWith(
        'https://token-server.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            channelName: 'test-channel',
            uid: 'user-123'
          })
        })
      )
    })

    it('should handle server errors', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })
      
      await expect(
        tokenService.getToken('test-channel', 'user-123')
      ).rejects.toThrow('Token request failed: 500')
    })

    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'))
      
      await expect(
        tokenService.getToken('test-channel', 'user-123')
      ).rejects.toThrow('Authentication failed')
    })
  })

  describe('validation', () => {
    it('should validate HTTPS URLs', () => {
      expect(() => new TokenService('http://insecure.com')).toThrow(
        'Token server must use HTTPS'
      )
    })

    it('should validate token format', async () => {
      const mockResponse = { token: null }
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })
      
      await expect(
        tokenService.getToken('test-channel', 'user-123')
      ).rejects.toThrow('Invalid token format')
    })
  })
})
```

## 🔗 **Integration Testing**

### **1. Component Interaction Testing**
```javascript
// integration.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AgoraConference from '../AgoraConference.vue'
import AgoraControls from '../AgoraControls.vue'
import { useMeeting } from '../composables/useMeeting'

describe('Component Integration', () => {
  let wrapper
  let mockMeeting

  beforeEach(() => {
    mockMeeting = {
      toggleAudio: vi.fn(),
      toggleVideo: vi.fn(),
      toggleScreenShare: vi.fn(),
      leaveChannel: vi.fn(),
      isAudioEnabled: ref(true),
      isVideoEnabled: ref(true),
      isScreenSharing: ref(false)
    }
    
    useMeeting.mockReturnValue(mockMeeting)
  })

  it('should sync audio state between conference and controls', async () => {
    wrapper = mount(AgoraConference, {
      props: { channelName: 'test-channel' }
    })
    
    const controls = wrapper.findComponent(AgoraControls)
    
    // Toggle audio from controls
    await controls.vm.toggleAudio()
    
    expect(mockMeeting.toggleAudio).toHaveBeenCalled()
  })

  it('should handle screen share toggle correctly', async () => {
    wrapper = mount(AgoraConference, {
      props: { channelName: 'test-channel' }
    })
    
    const controls = wrapper.findComponent(AgoraControls)
    
    // Enable screen sharing
    await controls.vm.toggleScreenShare()
    
    expect(mockMeeting.toggleScreenShare).toHaveBeenCalled()
    expect(mockMeeting.isScreenSharing.value).toBe(true)
  })
})
```

### **2. Store Integration Testing**
```javascript
// store.integration.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAgoraStore } from '../store/agora'
import { useMeeting } from '../composables/useMeeting'

describe('Store Integration', () => {
  let store
  let mockMeeting

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAgoraStore()
    
    mockMeeting = {
      joinChannel: vi.fn(),
      leaveChannel: vi.fn()
    }
    
    useMeeting.mockReturnValue(mockMeeting)
  })

  it('should update store when joining channel', async () => {
    await store.joinChannel('test-channel', 'test-token')
    
    expect(store.currentChannel).toBe('test-channel')
    expect(store.isConnected).toBe(true)
    expect(mockMeeting.joinChannel).toHaveBeenCalledWith('test-channel', 'test-token')
  })

  it('should update store when leaving channel', async () => {
    store.currentChannel = 'test-channel'
    store.isConnected = true
    
    await store.leaveChannel()
    
    expect(store.currentChannel).toBe(null)
    expect(store.isConnected).toBe(false)
    expect(mockMeeting.leaveChannel).toHaveBeenCalled()
  })
})
```

## 🌐 **E2E Testing**

### **1. Playwright Test Setup**
```javascript
// e2e/conference.spec.js
import { test, expect } from '@playwright/test'

test.describe('Agora Conference E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should join conference successfully', async ({ page }) => {
    // Navigate to conference page
    await page.click('[data-testid="join-conference"]')
    
    // Fill channel details
    await page.fill('[data-testid="channel-name"]', 'test-e2e-channel')
    await page.fill('[data-testid="user-name"]', 'Test User')
    
    // Join channel
    await page.click('[data-testid="join-button"]')
    
    // Wait for connection
    await expect(page.locator('[data-testid="connection-status"]')).toHaveText('Connected')
    
    // Verify video elements
    await expect(page.locator('[data-testid="local-video"]')).toBeVisible()
    await expect(page.locator('[data-testid="video-grid"]')).toBeVisible()
  })

  test('should handle audio/video controls', async ({ page }) => {
    // Join channel first
    await page.click('[data-testid="join-conference"]')
    await page.fill('[data-testid="channel-name"]', 'test-e2e-channel')
    await page.click('[data-testid="join-button"]')
    
    // Wait for connection
    await expect(page.locator('[data-testid="connection-status"]')).toHaveText('Connected')
    
    // Toggle audio
    await page.click('[data-testid="audio-toggle"]')
    await expect(page.locator('[data-testid="audio-status"]')).toHaveText('Muted')
    
    // Toggle video
    await page.click('[data-testid="video-toggle"]')
    await expect(page.locator('[data-testid="video-status"]')).toHaveText('Video Off')
  })

  test('should handle screen sharing', async ({ page }) => {
    // Join channel first
    await page.click('[data-testid="join-conference"]')
    await page.fill('[data-testid="channel-name"]', 'test-e2e-channel')
    await page.click('[data-testid="join-button"]')
    
    // Wait for connection
    await expect(page.locator('[data-testid="connection-status"]')).toHaveText('Connected')
    
    // Start screen sharing
    await page.click('[data-testid="screen-share-toggle"]')
    
    // Handle screen share permission dialog
    const permissionPromise = page.waitForEvent('dialog')
    await page.click('[data-testid="screen-share-toggle"]')
    const dialog = await permissionPromise
    await dialog.accept()
    
    // Verify screen sharing is active
    await expect(page.locator('[data-testid="screen-share-status"]')).toHaveText('Sharing')
  })
})
```

### **2. Test Configuration**
```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
})
```

## 📊 **Performance Testing**

### **1. Bundle Size Testing**
```javascript
// performance.test.js
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Bundle Performance', () => {
  it('should have acceptable bundle size', () => {
    const bundlePath = resolve(__dirname, '../dist/index.umd.js')
    const bundleContent = readFileSync(bundlePath, 'utf-8')
    const bundleSize = Buffer.byteLength(bundleContent, 'utf-8')
    
    // Bundle should be under 500KB
    expect(bundleSize).toBeLessThan(500 * 1024)
  })

  it('should have tree-shaking friendly exports', () => {
    const indexPath = resolve(__dirname, '../src/modules/agora/index.js')
    const indexContent = readFileSync(indexPath, 'utf-8')
    
    // Should use named exports for tree shaking
    expect(indexContent).toMatch(/export\s+\{[^}]*\}/)
    expect(indexContent).not.toMatch(/export\s+default/)
  })
})
```

### **2. Runtime Performance Testing**
```javascript
// runtime.performance.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMeeting } from '../useMeeting'

describe('Runtime Performance', () => {
  let meeting

  beforeEach(() => {
    meeting = useMeeting()
  })

  it('should join channel within acceptable time', async () => {
    const startTime = performance.now()
    
    await meeting.joinChannel('test-channel', 'test-token')
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Should join within 5 seconds
    expect(duration).toBeLessThan(5000)
  })

  it('should handle multiple rapid operations', async () => {
    const operations = []
    
    for (let i = 0; i < 10; i++) {
      operations.push(meeting.toggleAudio())
    }
    
    const startTime = performance.now()
    await Promise.all(operations)
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Should handle 10 operations within 1 second
    expect(duration).toBeLessThan(1000)
  })
})
```

## 🔒 **Security Testing**

### **1. Input Validation Testing**
```javascript
// security.test.js
import { describe, it, expect } from 'vitest'
import { validateChannelName, validateUserId } from '../validation'

describe('Security Validation', () => {
  describe('Channel Name Validation', () => {
    it('should reject SQL injection attempts', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO channels VALUES ('hacked'); --"
      ]
      
      maliciousInputs.forEach(input => {
        expect(() => validateChannelName(input)).toThrow()
      })
    })

    it('should reject XSS attempts', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">'
      ]
      
      maliciousInputs.forEach(input => {
        expect(() => validateChannelName(input)).toThrow()
      })
    })

    it('should reject path traversal attempts', () => {
      const maliciousInputs = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc/passwd'
      ]
      
      maliciousInputs.forEach(input => {
        expect(() => validateChannelName(input)).toThrow()
      })
    })
  })

  describe('User ID Validation', () => {
    it('should reject overly long inputs', () => {
      const longInput = 'a'.repeat(100)
      expect(() => validateUserId(longInput)).toThrow()
    })

    it('should reject special characters', () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')']
      
      specialChars.forEach(char => {
        expect(() => validateUserId(`user${char}name`)).toThrow()
      })
    })
  })
})
```

## 🧹 **Test Utilities**

### **1. Test Helpers**
```javascript
// test-utils.js
import { vi } from 'vitest'

export const createMockAgoraClient = () => ({
  join: vi.fn().mockResolvedValue(),
  leave: vi.fn().mockResolvedValue(),
  publish: vi.fn().mockResolvedValue(),
  unpublish: vi.fn().mockResolvedValue(),
  subscribe: vi.fn().mockResolvedValue(),
  unsubscribe: vi.fn().mockResolvedValue(),
  on: vi.fn(),
  off: vi.fn()
})

export const createMockMediaStream = () => ({
  getTracks: () => [
    {
      kind: 'audio',
      stop: vi.fn(),
      enabled: true
    },
    {
      kind: 'video',
      stop: vi.fn(),
      enabled: true
    }
  ],
  getAudioTracks: () => [],
  getVideoTracks: () => []
})

export const createMockUser = (overrides = {}) => ({
  uid: 'test-uid',
  name: 'Test User',
  hasAudio: true,
  hasVideo: true,
  ...overrides
})

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))
```

### **2. Test Data Factories**
```javascript
// test-factories.js
export const createChannelConfig = (overrides = {}) => ({
  appId: 'test-app-id',
  channelName: 'test-channel',
  token: 'test-token',
  uid: null,
  ...overrides
})

export const createMeetingState = (overrides = {}) => ({
  isConnected: false,
  isConnecting: false,
  error: null,
  localUser: null,
  remoteUsers: [],
  localTracks: [],
  ...overrides
})

export const createTestEvent = (type, data = {}) => ({
  type,
  timestamp: Date.now(),
  data,
  sessionId: 'test-session',
  userId: 'test-user'
})
```

## 📋 **Test Checklist**

### **Unit Tests**
- [ ] Composables tested
- [ ] Components tested
- [ ] Services tested
- [ ] Utils tested
- [ ] Store tested
- [ ] Edge cases covered
- [ ] Error handling tested

### **Integration Tests**
- [ ] Component interactions tested
- [ ] Store integration tested
- [ ] API integration tested
- [ ] Event handling tested

### **E2E Tests**
- [ ] User workflows tested
- [ ] Cross-browser compatibility tested
- [ ] Mobile responsiveness tested
- [ ] Performance scenarios tested

### **Security Tests**
- [ ] Input validation tested
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] XSS prevention tested

## 🚀 **Test Automation**

### **1. CI/CD Pipeline**
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### **2. Test Scripts**
```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest --config vitest.unit.config.js",
    "test:integration": "vitest --config vitest.integration.config.js",
    "test:e2e": "playwright test",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui"
  }
}
```

## 📚 **Ek Kaynaklar**

- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Playwright Testing](https://playwright.dev/)
- [Testing Best Practices](https://web.dev/testing/)

---

> **Not**: Bu test rehberi, **Context Engineering** prensiplerine uygun olarak hazırlanmıştır. Her test kararının nedenleri ve test senaryolarının mantığı açıklanmıştır.
