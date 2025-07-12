import { computed, ref, watch } from 'vue'
import { logger, logManager, LOG_LEVELS, LOG_CATEGORIES } from '../services/logger.js'
import { IS_DEV } from '../constants.js'

export const useLogger = () => {
  // Logları reactive olarak getir
  const logs = computed(() => logManager.getLogs())
  
  // Performance optimizations
  const statsCache = { value: null, timestamp: 0, logsLength: 0 }
  const CACHE_TTL = 500 // 500ms cache TTL
  const searchCache = new Map() // Search result cache
  
  // Debounced log stats to prevent recursive updates
  const debouncedLogStats = ref({
    total: 0,
    byLevel: {},
    byCategory: {}
  })
  
  // Update debounced stats with a delay - Optimized
  let statsUpdateTimeout = null
  const updateStats = () => {
    if (statsUpdateTimeout) {
      clearTimeout(statsUpdateTimeout)
    }
    
    statsUpdateTimeout = setTimeout(() => {
      const currentLogs = logs.value
      const currentLength = currentLogs.length
      
      // Check cache validity
      const now = Date.now()
      if (statsCache.value && 
          now - statsCache.timestamp < CACHE_TTL && 
          statsCache.logsLength === currentLength) {
        debouncedLogStats.value = statsCache.value
        return
      }
      
      // Calculate stats efficiently
      const stats = {
        total: currentLength,
        byLevel: {},
        byCategory: {}
      }
      
      // Single pass through logs for both level and category counting
      currentLogs.forEach(log => {
        // Level counting
        stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1
        
        // Category counting
        stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
      })
      
      // Update cache
      statsCache.value = stats
      statsCache.timestamp = now
      statsCache.logsLength = currentLength
      
      debouncedLogStats.value = stats
    }, 100) // 100ms delay
  }
  
  // Watch logs changes and update stats
  watch(logs, updateStats, { immediate: true })
  
  // Log istatistikleri - optimized to prevent recursive updates
  const logStats = computed(() => debouncedLogStats.value)
  
  // Filtrelenmiş loglar - optimized with search cache
  const getFilteredLogs = (filters = {}) => {
    const currentLogs = logs.value
    let filteredLogs = currentLogs
    
    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level)
    }
    
    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category)
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const cacheKey = `${searchTerm}-${currentLogs.length}`
      
      // Check cache first
      if (searchCache.has(cacheKey)) {
        const cachedResult = searchCache.get(cacheKey)
        // Verify cache is still valid
        if (cachedResult.logsLength === currentLogs.length) {
          filteredLogs = filteredLogs.filter(log => cachedResult.matchingIds.has(log.id))
        } else {
          searchCache.delete(cacheKey)
        }
      }
      
      // If not in cache, calculate and cache
      if (!searchCache.has(cacheKey)) {
        const matchingIds = new Set()
        filteredLogs.forEach(log => {
          const searchableText = logManager.getSearchableText(log.id)
          if (searchableText && searchableText.includes(searchTerm)) {
            matchingIds.add(log.id)
          }
        })
        
        searchCache.set(cacheKey, {
          matchingIds,
          logsLength: currentLogs.length,
          timestamp: Date.now()
        })
        
        // Clean old cache entries (keep only last 10)
        if (searchCache.size > 10) {
          const entries = Array.from(searchCache.entries())
          entries.slice(0, entries.length - 10).forEach(([key]) => searchCache.delete(key))
        }
        
        filteredLogs = filteredLogs.filter(log => matchingIds.has(log.id))
      }
    }
    
    return filteredLogs
  }
  
  // Production logging reduction
  const shouldLog = (level) => {
    if (!IS_DEV) {
      // Production'da sadece error ve warn logları
      return level === 'error' || level === 'warn'
    }
    return true
  }
  
  // Hızlı log fonksiyonları - Production optimized
  const logVideo = (message, data) => {
    if (shouldLog('info')) logger.info(LOG_CATEGORIES.VIDEO, message, data)
  }
  const logAudio = (message, data) => {
    if (shouldLog('info')) logger.info(LOG_CATEGORIES.AUDIO, message, data)
  }
  const logScreen = (message, data) => {
    if (shouldLog('info')) logger.info(LOG_CATEGORIES.SCREEN, message, data)
  }
  const logNetwork = (message, data) => {
    if (shouldLog('info')) logger.info(LOG_CATEGORIES.NETWORK, message, data)
  }
  const logPermissions = (message, data) => {
    if (shouldLog('info')) logger.info(LOG_CATEGORIES.PERMISSIONS, message, data)
  }
  const logUI = (message, data) => {
    if (shouldLog('info')) logger.info(LOG_CATEGORIES.UI, message, data)
  }
  const logStore = (message, data) => {
    if (shouldLog('info')) logger.info(LOG_CATEGORIES.STORE, message, data)
  }
  const logAgora = (message, data) => {
    if (shouldLog('info')) logger.info(LOG_CATEGORIES.AGORA, message, data)
  }
  const logQuality = (message, data) => {
    if (shouldLog('info')) logger.info(LOG_CATEGORIES.NETWORK, message, data)
  }
  
  // Error log fonksiyonları - Always log errors
  const logError = (error, context) => logger.trackError(error, context)
  const logVideoError = (error, context) => logger.error(LOG_CATEGORIES.VIDEO, error.message || error, { error, ...context })
  const logAudioError = (error, context) => logger.error(LOG_CATEGORIES.AUDIO, error.message || error, { error, ...context })
  const logNetworkError = (error, context) => logger.error(LOG_CATEGORIES.NETWORK, error.message || error, { error, ...context })
  
  // Performance tracking
  const trackPerformance = (name, fn) => logger.trackPerformance(name, fn)
  
  // User action tracking
  const trackUserAction = (action, details) => logger.trackUserAction(action, details)
  
  // Agora event tracking
  const trackAgoraEvent = (eventName, data) => logger.trackAgoraEvent(eventName, data)
  
  return {
    // Ana logger fonksiyonları
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
    critical: logger.critical,
    
    // Kategori bazlı log fonksiyonları
    logVideo,
    logAudio,
    logScreen,
    logNetwork,
    logPermissions,
    logUI,
    logStore,
    logAgora,
    logQuality,
    
    // Error log fonksiyonları
    logError,
    logVideoError,
    logAudioError,
    logNetworkError,
    
    // Tracking fonksiyonları
    trackPerformance,
    trackUserAction,
    trackAgoraEvent,
    
    // Log yönetimi
    logs,
    logStats,
    getFilteredLogs,
    clearLogs: logManager.clearLogs,
    exportLogs: logManager.exportLogs,
    
    // Constants
    LOG_LEVELS,
    LOG_CATEGORIES
  }
} 