import { computed, ref, watch } from 'vue'
import { logger, logManager, LOG_LEVELS, LOG_CATEGORIES } from '../services/logger.js'

export const useLogger = () => {
  // Logları reactive olarak getir
  const logs = computed(() => logManager.getLogs())
  
  // Debounced log stats to prevent recursive updates
  const debouncedLogStats = ref({
    total: 0,
    byLevel: {},
    byCategory: {}
  })
  
  // Update debounced stats with a delay
  let statsUpdateTimeout = null
  const updateStats = () => {
    if (statsUpdateTimeout) {
      clearTimeout(statsUpdateTimeout)
    }
    
    statsUpdateTimeout = setTimeout(() => {
      const currentLogs = logs.value
      const stats = {
        total: currentLogs.length,
        byLevel: {},
        byCategory: {}
      }
      
      // Seviye bazında sayım - use reduce for better performance
      Object.values(LOG_LEVELS).forEach(level => {
        stats.byLevel[level] = currentLogs.reduce((count, log) => 
          log.level === level ? count + 1 : count, 0
        )
      })
      
      // Kategori bazında sayım - use reduce for better performance
      Object.values(LOG_CATEGORIES).forEach(category => {
        stats.byCategory[category] = currentLogs.reduce((count, log) => 
          log.category === category ? count + 1 : count, 0
        )
      })
      
      debouncedLogStats.value = stats
    }, 100) // 100ms delay
  }
  
  // Watch logs changes and update stats
  watch(logs, updateStats, { immediate: true })
  
  // Log istatistikleri - optimized to prevent recursive updates
  const logStats = computed(() => debouncedLogStats.value)
  
  // Filtrelenmiş loglar - optimized to prevent recursive updates
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
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.data).toLowerCase().includes(searchTerm)
      )
    }
    
    return filteredLogs
  }
  
  // Hızlı log fonksiyonları
  const logVideo = (message, data) => logger.info(LOG_CATEGORIES.VIDEO, message, data)
  const logAudio = (message, data) => logger.info(LOG_CATEGORIES.AUDIO, message, data)
  const logScreen = (message, data) => logger.info(LOG_CATEGORIES.SCREEN, message, data)
  const logNetwork = (message, data) => logger.info(LOG_CATEGORIES.NETWORK, message, data)
  const logPermissions = (message, data) => logger.info(LOG_CATEGORIES.PERMISSIONS, message, data)
  const logUI = (message, data) => logger.info(LOG_CATEGORIES.UI, message, data)
  const logStore = (message, data) => logger.info(LOG_CATEGORIES.STORE, message, data)
  const logAgora = (message, data) => logger.info(LOG_CATEGORIES.AGORA, message, data)
  
  // Error log fonksiyonları
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