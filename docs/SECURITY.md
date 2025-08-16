# 🔒 **Güvenlik Rehberi**

> **Context Engineering** yaklaşımı ile hazırlanmış kapsamlı güvenlik dokümantasyonu

## 🎯 **Genel Bakış**

Bu dokümantasyon, **rs-agora-module** projesinin güvenlik açısından nasıl tasarlandığını ve kullanıldığını detaylandırır. **Context Engineering** prensiplerine uygun olarak, güvenlik kararlarının nedenleri ve risk analizleri açıklanmıştır.

## 🛡️ **Güvenlik Mimarisi**

### **1. Defense in Depth (Çok Katmanlı Savunma)**
```
┌─────────────────────────────────────┐
│           Application Layer         │
│  (Vue Components, Composables)     │
├─────────────────────────────────────┤
│           Business Logic            │
│  (Services, Store, Utils)          │
├─────────────────────────────────────┤
│           Communication Layer       │
│  (Agora RTC SDK, HTTP APIs)        │
├─────────────────────────────────────┤
│           Infrastructure Layer      │
│  (HTTPS, CSP, CORS)                │
└─────────────────────────────────────┘
```

### **2. Security Principles**
- **Principle of Least Privilege**: Minimum gerekli yetki
- **Fail Secure**: Hata durumunda güvenli durum
- **Input Validation**: Tüm girdilerin doğrulanması
- **Output Encoding**: Çıktıların güvenli kodlanması

## 🔐 **Authentication & Authorization**

### **1. Agora Token Authentication**
```javascript
// tokenService.js
export class TokenService {
  constructor(tokenServerUrl) {
    this.tokenServerUrl = tokenServerUrl
    this.validateUrl()
  }

  validateUrl() {
    if (!this.tokenServerUrl.startsWith('https://')) {
      throw new Error('Token server must use HTTPS')
    }
  }

  async getToken(channelName, uid) {
    try {
      const response = await fetch(`${this.tokenServerUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey()}`
        },
        body: JSON.stringify({ channelName, uid })
      })

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.status}`)
      }

      const data = await response.json()
      return this.validateToken(data.token)
    } catch (error) {
      console.error('Token retrieval failed:', error)
      throw new Error('Authentication failed')
    }
  }

  validateToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format')
    }
    return token
  }

  getApiKey() {
    const apiKey = import.meta.env.VITE_API_KEY
    if (!apiKey) {
      throw new Error('API key not configured')
    }
    return apiKey
  }
}
```

### **2. User Permission Management**
```javascript
// usePermissions.js
export const usePermissions = () => {
  const permissions = ref({
    canJoinChannel: false,
    canPublishAudio: false,
    canPublishVideo: false,
    canScreenShare: false,
    canRecord: false,
    canModerate: false
  })

  const checkPermissions = async (userId, channelName) => {
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, channelName })
      })

      if (response.ok) {
        const userPermissions = await response.json()
        permissions.value = userPermissions
      }
    } catch (error) {
      console.error('Permission check failed:', error)
      // Fail secure: no permissions
      permissions.value = {
        canJoinChannel: false,
        canPublishAudio: false,
        canPublishVideo: false,
        canScreenShare: false,
        canRecord: false,
        canModerate: false
      }
    }
  }

  return { permissions, checkPermissions }
}
```

## 🚫 **Input Validation & Sanitization**

### **1. Channel Name Validation**
```javascript
// validation.js
export const validateChannelName = (channelName) => {
  if (!channelName || typeof channelName !== 'string') {
    throw new Error('Channel name is required and must be a string')
  }

  // Length validation
  if (channelName.length < 3 || channelName.length > 64) {
    throw new Error('Channel name must be between 3 and 64 characters')
  }

  // Character validation (alphanumeric, underscore, hyphen)
  const validPattern = /^[a-zA-Z0-9_-]+$/
  if (!validPattern.test(channelName)) {
    throw new Error('Channel name contains invalid characters')
  }

  // Reserved words check
  const reservedWords = ['admin', 'system', 'internal', 'test']
  if (reservedWords.includes(channelName.toLowerCase())) {
    throw new Error('Channel name is reserved')
  }

  return channelName.trim()
}
```

### **2. User ID Validation**
```javascript
export const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('User ID is required and must be a string')
  }

  // Length validation
  if (userId.length < 1 || userId.length > 32) {
    throw new Error('User ID must be between 1 and 32 characters')
  }

  // Character validation
  const validPattern = /^[a-zA-Z0-9_-]+$/
  if (!validPattern.test(userId)) {
    throw new Error('User ID contains invalid characters')
  }

  return userId.trim()
}
```

### **3. Configuration Validation**
```javascript
export const validateConfig = (config) => {
  const required = ['appId', 'channelName']
  const missing = required.filter(key => !config[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`)
  }

  // App ID format validation
  if (!/^\d+$/.test(config.appId)) {
    throw new Error('App ID must be numeric')
  }

  // Optional validation
  if (config.uid && !Number.isInteger(Number(config.uid))) {
    throw new Error('UID must be a valid integer')
  }

  return config
}
```

## 🌐 **Network Security**

### **1. HTTPS Enforcement**
```javascript
// security.js
export const enforceHTTPS = () => {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    throw new Error('HTTPS is required for production use')
  }
}

export const validateWebRTCPermissions = async () => {
  try {
    // Check camera permission
    const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true })
    cameraStream.getTracks().forEach(track => track.stop())
    
    // Check microphone permission
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    micStream.getTracks().forEach(track => track.stop())
    
    return true
  } catch (error) {
    console.error('WebRTC permissions failed:', error)
    throw new Error('Camera and microphone permissions are required')
  }
}
```

### **2. CORS Configuration**
```javascript
// CORS headers for token server
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
}

// Token server middleware
app.use((req, res, next) => {
  res.set(corsHeaders)
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  next()
})
```

### **3. Content Security Policy**
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://download.agora.io; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               media-src 'self' blob:; 
               connect-src 'self' https://download.agora.io https://*.agora.io;">
```

## 🔒 **Data Protection**

### **1. Sensitive Data Handling**
```javascript
// dataProtection.js
export class DataProtector {
  constructor() {
    this.encryptionKey = this.getEncryptionKey()
  }

  getEncryptionKey() {
    const key = import.meta.env.VITE_ENCRYPTION_KEY
    if (!key) {
      throw new Error('Encryption key not configured')
    }
    return key
  }

  encryptSensitiveData(data) {
    // Implementation for encrypting sensitive data
    // This is a placeholder - implement actual encryption
    return btoa(JSON.stringify(data))
  }

  decryptSensitiveData(encryptedData) {
    try {
      return JSON.parse(atob(encryptedData))
    } catch (error) {
      throw new Error('Failed to decrypt data')
    }
  }

  sanitizeLogData(data) {
    const sensitive = ['password', 'token', 'key', 'secret']
    const sanitized = { ...data }
    
    sensitive.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***'
      }
    })
    
    return sanitized
  }
}
```

### **2. Log Security**
```javascript
// useLogger.js
export const useLogger = () => {
  const dataProtector = new DataProtector()
  
  const log = (level, message, data = {}) => {
    // Sanitize sensitive data
    const sanitizedData = dataProtector.sanitizeLogData(data)
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: sanitizedData,
      userId: getCurrentUserId(),
      sessionId: getSessionId()
    }
    
    // Send to secure logging service
    sendToLogService(logEntry)
    
    // Console logging (development only)
    if (import.meta.env.DEV) {
      console[level](message, sanitizedData)
    }
  }
  
  return { log }
}
```

## 🚨 **Threat Prevention**

### **1. Rate Limiting**
```javascript
// rateLimiter.js
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = new Map()
  }

  isAllowed(userId) {
    const now = Date.now()
    const userRequests = this.requests.get(userId) || []
    
    // Remove old requests outside window
    const validRequests = userRequests.filter(time => now - time < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      return false
    }
    
    // Add current request
    validRequests.push(now)
    this.requests.set(userId, validRequests)
    
    return true
  }

  reset(userId) {
    this.requests.delete(userId)
  }
}
```

### **2. Session Management**
```javascript
// sessionManager.js
export class SessionManager {
  constructor() {
    this.sessions = new Map()
    this.sessionTimeout = 30 * 60 * 1000 // 30 minutes
  }

  createSession(userId, channelName) {
    const sessionId = this.generateSessionId()
    const session = {
      id: sessionId,
      userId,
      channelName,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      permissions: this.getUserPermissions(userId)
    }
    
    this.sessions.set(sessionId, session)
    return sessionId
  }

  validateSession(sessionId) {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return false
    }
    
    // Check timeout
    if (Date.now() - session.lastActivity > this.sessionTimeout) {
      this.sessions.delete(sessionId)
      return false
    }
    
    // Update last activity
    session.lastActivity = Date.now()
    return true
  }

  generateSessionId() {
    return crypto.randomUUID()
  }
}
```

## 🔍 **Security Monitoring**

### **1. Security Events**
```javascript
// securityMonitor.js
export class SecurityMonitor {
  constructor() {
    this.events = []
    this.suspiciousPatterns = this.defineSuspiciousPatterns()
  }

  defineSuspiciousPatterns() {
    return [
      { name: 'multiple_failed_logins', threshold: 5, window: 300000 },
      { name: 'rapid_channel_joins', threshold: 10, window: 60000 },
      { name: 'unusual_permission_requests', threshold: 3, window: 300000 }
    ]
  }

  trackEvent(event) {
    this.events.push({
      ...event,
      timestamp: Date.now(),
      sessionId: getSessionId(),
      userId: getCurrentUserId()
    })
    
    this.analyzePatterns()
  }

  analyzePatterns() {
    this.suspiciousPatterns.forEach(pattern => {
      const recentEvents = this.events.filter(event => 
        event.type === pattern.name &&
        Date.now() - event.timestamp < pattern.window
      )
      
      if (recentEvents.length >= pattern.threshold) {
        this.triggerAlert(pattern.name, recentEvents)
      }
    })
  }

  triggerAlert(patternName, events) {
    console.warn(`Security alert: ${patternName} detected`, events)
    // Send to security monitoring service
    this.sendSecurityAlert(patternName, events)
  }
}
```

### **2. Audit Trail**
```javascript
// auditTrail.js
export class AuditTrail {
  constructor() {
    this.actions = []
  }

  logAction(action, details) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
      ipAddress: getClientIP(),
      userAgent: navigator.userAgent
    }
    
    this.actions.push(auditEntry)
    this.persistAuditEntry(auditEntry)
  }

  persistAuditEntry(entry) {
    // Send to audit service
    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    }).catch(error => {
      console.error('Failed to persist audit entry:', error)
    })
  }
}
```

## 🧪 **Security Testing**

### **1. Security Test Suite**
```javascript
// security.test.js
describe('Security Tests', () => {
  test('should validate channel names', () => {
    expect(() => validateChannelName('')).toThrow()
    expect(() => validateChannelName('a')).toThrow()
    expect(() => validateChannelName('admin')).toThrow()
    expect(() => validateChannelName('valid-channel_123')).not.toThrow()
  })

  test('should enforce HTTPS in production', () => {
    const originalProtocol = location.protocol
    location.protocol = 'http:'
    
    expect(() => enforceHTTPS()).toThrow()
    
    location.protocol = originalProtocol
  })

  test('should sanitize sensitive data', () => {
    const data = { password: 'secret123', token: 'abc123', name: 'John' }
    const sanitized = sanitizeLogData(data)
    
    expect(sanitized.password).toBe('***REDACTED***')
    expect(sanitized.token).toBe('***REDACTED***')
    expect(sanitized.name).toBe('John')
  })
})
```

### **2. Penetration Testing Checklist**
- [ ] Input validation bypass attempts
- [ ] Authentication bypass attempts
- [ ] Authorization escalation attempts
- [ ] Session hijacking attempts
- [ ] XSS injection attempts
- [ ] CSRF attack attempts
- [ ] SQL injection attempts
- [ ] Rate limiting bypass attempts

## 📋 **Security Checklist**

### **Development**
- [ ] Input validation implemented
- [ ] Output encoding implemented
- [ ] Authentication required
- [ ] Authorization checks implemented
- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented

### **Deployment**
- [ ] Environment variables secured
- [ ] API keys rotated
- [ ] SSL certificates valid
- [ ] Security headers configured
- [ ] Logging enabled
- [ ] Monitoring configured
- [ ] Backup strategy implemented

### **Maintenance**
- [ ] Dependencies updated
- [ ] Security patches applied
- [ ] Logs reviewed regularly
- [ ] Access controls audited
- [ ] Security incidents documented
- [ ] Response plan updated

## 🚨 **Incident Response**

### **1. Security Incident Types**
- **Authentication Bypass**: Unauthorized access
- **Data Breach**: Sensitive data exposure
- **Service Disruption**: DDoS or availability issues
- **Malware**: Malicious code execution

### **2. Response Steps**
1. **Identify**: Detect and classify incident
2. **Contain**: Limit impact and spread
3. **Eradicate**: Remove threat
4. **Recover**: Restore normal operations
5. **Learn**: Document lessons learned

### **3. Contact Information**
- **Security Team**: security@company.com
- **Emergency**: +1-555-SECURITY
- **Incident Report**: /security/incident

## 📚 **Ek Kaynaklar**

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Guidelines](https://web.dev/security/)
- [Agora Security Best Practices](https://docs.agora.io/en/Video/security_overview)
- [Vue.js Security Guide](https://vuejs.org/guide/best-practices/security.html)

---

> **Not**: Bu güvenlik rehberi, **Context Engineering** prensiplerine uygun olarak hazırlanmıştır. Her güvenlik kararının nedenleri ve risk analizleri açıklanmıştır.
