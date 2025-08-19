/**
 * File-based Logger Composable
 * Dosya tabanlı JSON log sistemi için Vue composable
 */

import { ref, computed, onMounted, watch } from 'vue'
import { fileLogger, LOG_LEVELS, LOG_CATEGORIES } from '../services/fileLogger.js'

export const useFileLogger = () => {
  // Reactive state
  const logs = ref([])
  const logFiles = ref([])
  const logStats = ref({
    totalFiles: 0,
    totalLogs: 0,
    totalSize: '0 MB',
    oldestFile: null,
    newestFile: null
  })
  
  const isLoading = ref(false)
  const selectedFile = ref('')
  const filters = ref({
    startDate: '',
    endDate: '',
    search: '',
    level: '',
    category: ''
  })

  // Computed
  const hasActiveFilters = computed(() => {
    return filters.value.startDate || 
           filters.value.endDate || 
           filters.value.search || 
           filters.value.level || 
           filters.value.category
  })

  const filteredLogs = computed(() => {
    if (!logs.value.length) return []
    
    let filtered = [...logs.value]
    
    // Level filter
    if (filters.value.level) {
      filtered = filtered.filter(log => log.level === filters.value.level)
    }
    
    // Category filter
    if (filters.value.category) {
      filtered = filtered.filter(log => log.category === filters.value.category)
    }
    
    // Search filter
    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase()
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.data).toLowerCase().includes(searchTerm)
      )
    }
    
    // Date range filter
    if (filters.value.startDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= new Date(filters.value.startDate)
      )
    }
    
    if (filters.value.endDate) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= new Date(filters.value.endDate)
      )
    }
    
    return filtered
  })

  // Methods
  const refreshLogs = async () => {
    try {
      isLoading.value = true
      
      // Log dosyalarını yenile
      logFiles.value = fileLogger.getLogFiles()
      
      // İstatistikleri güncelle
      logStats.value = fileLogger.getLogStats()
      
      // Filtreleri uygula
      await applyFilters()
      
    } catch (error) {
      console.error('Log yenileme hatası:', error)
    } finally {
      isLoading.value = false
    }
  }

  const applyFilters = async () => {
    try {
      let newLogs = []
      
      if (filters.value.startDate && filters.value.endDate) {
        // Tarih aralığı filtreleme
        newLogs = fileLogger.getLogsByDateRange(
          filters.value.startDate, 
          filters.value.endDate
        )
      } else if (selectedFile.value) {
        // Seçili dosyadan logları al
        newLogs = fileLogger.getLogsByDate(
          selectedFile.value.replace('agora-logs-', '').replace('.json', '')
        )
      } else {
        // Bugünün loglarını al
        const today = new Date().toISOString().split('T')[0]
        newLogs = fileLogger.getLogsByDate(today)
      }
      
      logs.value = newLogs
      
    } catch (error) {
      console.error('Filtre uygulama hatası:', error)
    }
  }

  const selectFile = (fileName) => {
    selectedFile.value = fileName
    applyFilters()
  }

  const downloadFile = (fileName) => {
    return fileLogger.downloadLogFile(fileName)
  }

  const deleteFile = async (fileName) => {
    const success = fileLogger.deleteLogFile(fileName)
    if (success) {
      await refreshLogs()
    }
    return success
  }

  const downloadCurrentLogs = () => {
    if (!filteredLogs.value.length) return false
    
    const data = {
      exportTime: new Date().toISOString(),
      filters: filters.value,
      totalLogs: filteredLogs.value.length,
      logs: filteredLogs.value
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agora-filtered-logs-${Date.now()}.json`
    a.click()
    
    URL.revokeObjectURL(url)
    return true
  }

  const exportLogsToCSV = () => {
    if (!filteredLogs.value.length) return false
    
    const csvContent = convertToCSV(filteredLogs.value)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agora-logs-${Date.now()}.csv`
    a.click()
    
    URL.revokeObjectURL(url)
    return true
  }

  const convertToCSV = (logs) => {
    const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Data', 'Session ID']
    const rows = logs.map(log => [
      log.timestamp,
      log.level,
      log.category,
      log.message,
      JSON.stringify(log.data),
      log.sessionId
    ])
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }

  const clearAllLogs = async () => {
    const success = fileLogger.clearAllLogs()
    if (success) {
      await refreshLogs()
    }
    return success
  }

  const clearFilters = () => {
    filters.value = {
      startDate: '',
      endDate: '',
      search: '',
      level: '',
      category: ''
    }
    selectedFile.value = ''
    applyFilters()
  }

  const updateFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters }
    applyFilters()
  }

  // Logging convenience functions
  const logDebug = (category, message, data) => {
    fileLogger.log('debug', category, message, data)
  }

  const logInfo = (category, message, data) => {
    fileLogger.log('info', category, message, data)
  }

  const logWarn = (category, message, data) => {
    fileLogger.log('warn', category, message, data)
  }

  const logError = (category, errorOrMessage, data) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('error', category, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...data })
    }
    return fileLogger.log('error', category, errorOrMessage, data)
  }

  const logCritical = (category, errorOrMessage, data) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('critical', category, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...data })
    }
    return fileLogger.log('critical', category, errorOrMessage, data)
  }

  // Kategori-özel helper fonksiyonlar kaldırıldı (tek tip log-level helper kullanılacak)

  // Kategori-özel error helper'ları kaldırıldı; logError(category, ...) kullanılacak

  // Tracking için doğrudan logInfo/logError kullanılacak

  // Lifecycle
  onMounted(() => {
    refreshLogs()
  })

  // Watchers
  watch(filters, () => {
    applyFilters()
  }, { deep: true })

  return {
    // State
    logs,
    logFiles,
    logStats,
    isLoading,
    selectedFile,
    filters,
    
    // Computed
    filteredLogs,
    hasActiveFilters,
    
    // Methods
    refreshLogs,
    applyFilters,
    selectFile,
    downloadFile,
    deleteFile,
    downloadCurrentLogs,
    exportLogsToCSV,
    clearAllLogs,
    clearFilters,
    updateFilters,
    
    // Logging functions
    logDebug,
    logInfo,
    logWarn,
    logError,
    logCritical,
    
    // Not: Kategori-özel helper ve tracking helper'lar kaldırıldı
    
    // Constants
    LOG_LEVELS,
    LOG_CATEGORIES
  }
}
