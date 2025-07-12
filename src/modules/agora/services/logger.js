import { ref } from 'vue'
import { IS_DEV } from '../constants.js'

// Log seviyeleri
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
}

// Log kategorileri
export const LOG_CATEGORIES = {
  AGORA: 'agora',
  VIDEO: 'video',
  AUDIO: 'audio',
  SCREEN: 'screen',
  NETWORK: 'network',
  PERMISSIONS: 'permissions',
  UI: 'ui',
  STORE: 'store'
}

// Log store
const logs = ref([])
const maxLogs = IS_DEV ? 1000 : 500 // Development'ta daha fazla log, production'da daha az

// Performance optimizations
const logDataCache = new Map() // JSON.stringify cache
const searchIndex = new Map() // Search term index
const statsCache = { value: null, timestamp: 0 } // Stats memoization
const CACHE_TTL = 1000 // 1 second cache TTL

// Logging queue to prevent rapid successive entries
let logQueue = []
let isProcessingQueue = false
const queueDelay = IS_DEV ? 50 : 100 // Development'ta daha hızlı, production'da daha yavaş

// Local storage save debouncing
let saveToLocalStorageTimeout = null

// Process log queue
const processLogQueue = () => {
  if (isProcessingQueue || logQueue.length === 0) return
  
  isProcessingQueue = true
  
  const processNext = () => {
    if (logQueue.length === 0) {
      isProcessingQueue = false
      return
    }
    
    const log = logQueue.shift()
    addLogImmediate(log)
    
    setTimeout(processNext, queueDelay)
  }
  
  processNext()
}

// Log oluşturma fonksiyonu
const createLog = (level, category, message, data = {}) => {
  const log = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
    sessionId: generateSessionId()
  }
  
  // Cache JSON string for search optimization
  const dataKey = JSON.stringify(data)
  if (!logDataCache.has(dataKey)) {
    logDataCache.set(dataKey, dataKey.toLowerCase())
  }
  
  // Update search index
  const searchableText = `${message} ${dataKey}`.toLowerCase()
  searchIndex.set(log.id, searchableText)
  
  return log
}

// Session ID oluşturma
const generateSessionId = () => {
  if (!window.agoraSessionId) {
    window.agoraSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
  return window.agoraSessionId
}

// Immediate log addition (for critical logs)
const addLogImmediate = (log) => {
  logs.value.push(log)
  
  // Invalidate stats cache
  statsCache.value = null
  
  // Maksimum log sayısını aşarsa eski logları sil (performance optimizasyonu)
  if (logs.value.length > maxLogs) {
    const removedLogs = logs.value.slice(0, logs.value.length - maxLogs)
    logs.value = logs.value.slice(-maxLogs)
    
    // Clean up cache for removed logs
    removedLogs.forEach(removedLog => {
      searchIndex.delete(removedLog.id)
    })
  }
  
  // Local storage'a kaydet (debounced)
  if (!saveToLocalStorageTimeout) {
    saveToLocalStorageTimeout = setTimeout(() => {
      saveToLocalStorage()
      saveToLocalStorageTimeout = null
    }, 100)
  }
  
  // Development modunda console'a yaz
  if (IS_DEV) {
    const consoleMethod = log.level === 'error' ? 'error' : 
                         log.level === 'warn' ? 'warn' : 'log'
    console[consoleMethod](`[${log.level.toUpperCase()}] ${log.category}: ${log.message}`, log.data)
  }
}

// Log ekleme - with queue mechanism
const addLog = (log) => {
  // Critical and error logs are processed immediately
  if (log.level === 'critical' || log.level === 'error') {
    addLogImmediate(log)
    return
  }
  
  // Other logs are queued to prevent rapid updates
  logQueue.push(log)
  processLogQueue()
}

// Local storage'a kaydetme
const saveToLocalStorage = () => {
  try {
    localStorage.setItem('agora_logs', JSON.stringify(logs.value))
  } catch (error) {
          // Fallback to console.error for logger errors
      console.error('Loglar localStorage\'a kaydedilemedi:', error)
  }
}

// Local storage'dan yükleme
const loadFromLocalStorage = () => {
  try {
    const savedLogs = localStorage.getItem('agora_logs')
    if (savedLogs) {
      logs.value = JSON.parse(savedLogs)
    }
  } catch (error) {
          // Fallback to console.error for logger errors
      console.error('Loglar localStorage\'dan yüklenemedi:', error)
  }
}

// Ana log fonksiyonları
export const logger = {
  debug: (category, message, data) => {
    const log = createLog(LOG_LEVELS.DEBUG, category, message, data)
    addLog(log)
  },
  
  info: (category, message, data) => {
    const log = createLog(LOG_LEVELS.INFO, category, message, data)
    addLog(log)
  },
  
  warn: (category, message, data) => {
    const log = createLog(LOG_LEVELS.WARN, category, message, data)
    addLog(log)
  },
  
  error: (category, message, data) => {
    const log = createLog(LOG_LEVELS.ERROR, category, message, data)
    addLog(log)
  },
  
  critical: (category, message, data) => {
    const log = createLog(LOG_LEVELS.CRITICAL, category, message, data)
    addLog(log)
  },
  
  // Performance tracking
  trackPerformance: (name, fn) => {
    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()
    const duration = endTime - startTime
    
    logger.info('performance', `${name} completed`, {
      name,
      duration: `${duration.toFixed(2)}ms`,
      startTime,
      endTime
    })
    
    return result
  },
  
  // User action tracking
  trackUserAction: (action, details = {}) => {
    logger.info('ui', `User action: ${action}`, {
      action,
      ...details
    })
  },
  
  // Agora event tracking
  trackAgoraEvent: (eventName, data = {}) => {
    logger.info('agora', `Agora event: ${eventName}`, {
      eventName,
      ...data
    })
  },
  
  // Error tracking
  trackError: (error, context = {}) => {
    logger.error('error', error.message || 'Bilinmeyen hata', {
      error: error.toString(),
      stack: error.stack,
      ...context
    })
  }
}

// Log yönetimi fonksiyonları
export const logManager = {
  // Tüm logları getir
  getLogs: () => logs.value,
  
  // Logları temizle
  clearLogs: () => {
    logs.value = []
    logQueue = [] // Clear queue as well
    localStorage.removeItem('agora_logs')
  },
  
  // JSON olarak export et
  exportLogs: () => {
    const logData = {
      exportTime: new Date().toISOString(),
      sessionId: generateSessionId(),
      totalLogs: logs.value.length,
      logs: logs.value
    }
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agora-logs-${Date.now()}.json`
    a.click()
    
    URL.revokeObjectURL(url)
    
    // Don't log the export action to prevent recursive updates
    // logger.info('ui', 'Logs exported', {
    //   fileName: a.download,
    //   logCount: logs.value.length
    // })
  },
  
  // Logları filtrele - Optimized with search index
  filterLogs: (filters = {}) => {
    let filteredLogs = logs.value
    
    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level)
    }
    
    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category)
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredLogs = filteredLogs.filter(log => {
        const searchableText = searchIndex.get(log.id)
        return searchableText && searchableText.includes(searchTerm)
      })
    }
    
    return filteredLogs
  },
  
  // Logları yükle
  loadLogs: loadFromLocalStorage
}

// Sayfa yüklendiğinde logları yükle
if (typeof window !== 'undefined') {
  loadFromLocalStorage()
} 