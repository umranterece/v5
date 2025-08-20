/**
 * LocalStorage-based JSON Logger Service
 * Tüm logları localStorage'da JSON formatında saklar
 * Browser ortamında çalışır
 */

import { IS_DEV, LOG_CONFIG } from '../constants.js'
import { generateSessionId } from '../utils/index.js'
import { notification } from './notificationService.js'

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
  STORE: 'store',
  DEVICE: 'device',
  SYSTEM: 'system'
}

class FileLogger {
  constructor() {
    this.sessionId = null // Lazy initialization
    this.logQueue = []
    this.isProcessing = false
    this.maxLogsPerFile = LOG_CONFIG.MAX_LOGS_PER_FILE
    
    // localStorage'dan log aktiflik durumunu oku
    try {
      const savedLogActive = localStorage.getItem('agora_logging_active')
      this.logActive = savedLogActive ? savedLogActive === 'true' : true
    } catch (error) {
      this.logActive = true // Varsayılan olarak aktif
    }
    
    this.init()
  }

  // Log aktifliğini ayarla
  setLogActive(active) {
    this.logActive = active
    
    // localStorage'a kaydet
    try {
      localStorage.setItem('agora_logging_active', active.toString())
    } catch (error) {
      console.error('Log aktiflik durumu kaydedilemedi:', error)
    }
    
    if (!active) {
      // Log aktif değilse queue'yu temizle
      this.logQueue = []
      this.isProcessing = false
    }
  }

  init() {
    // Eski logları temizle
    this.cleanupOldLogs()
    
    // Queue işlemcisini başlat
    this.processQueue()
  }

  // Log dizinini oluştur
  ensureLogDirectory() {
    // Browser ortamında sadece localStorage kullanılıyor
    this.storageType = 'localStorage'
  }

  // Session ID'yi lazy olarak al
  getSessionId() {
    if (!this.sessionId) {
      try {
        this.sessionId = generateSessionId()
      } catch (error) {
        // Fallback: basit bir session ID oluştur
        this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      }
    }
    return this.sessionId
  }

  // Log ekleme
  log(level, category, message, data = {}) {
    // Log aktif değilse hiçbir şey yapma
    if (!this.logActive) {
      return
    }
    
    
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      userAgent: navigator?.userAgent || 'unknown',
      url: window?.location?.href || 'unknown'
    }

    // Queue'ya ekle
    this.logQueue.push(logEntry)
    
    // Development'ta console'a da yaz
    if (IS_DEV) {
      this.logToConsole(logEntry)
    }

    // Queue işlemini tetikle
    this.processQueue()
  }

  // Console'a log yazma (development için)
  logToConsole(logEntry) {
    const { level, category, message, data } = logEntry
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString()
    
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warn' ? 'warn' : 
                         level === 'debug' ? 'debug' : 'log'
    
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${category}]`
    
    if (Object.keys(data).length > 0) {
      console[consoleMethod](`${prefix}: ${message}`, data)
    } else {
      console[consoleMethod](`${prefix}: ${message}`)
    }
  }

  // Queue işleme
  async processQueue() {
    if (this.isProcessing || this.logQueue.length === 0) return
    
    this.isProcessing = true
    
    try {
      while (this.logQueue.length > 0) {
        const logEntry = this.logQueue.shift()
        await this.saveLog(logEntry)
        
        // Küçük bir gecikme ile performans optimizasyonu
        if (this.logQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }
    } catch (error) {
      console.error('Log queue işleme hatası:', error)
    } finally {
      this.isProcessing = false
    }
  }

  // Log kaydetme
  async saveLog(logEntry) {
    try {
      const currentDate = new Date().toISOString().split('T')[0]
      const fileName = `agora-logs-${currentDate}.json`
      
      // Sadece localStorage kullanılıyor
      await this.saveToLocalStorage(fileName, logEntry)
      
    } catch (error) {
      console.error('Log kaydetme hatası:', error)
    }
  }

  // LocalStorage'a kaydetme
  async saveToLocalStorage(fileName, logEntry) {
    try {
      const existingLogs = this.getLogsFromStorage(fileName)
      existingLogs.push(logEntry)
      
      // Dosya boyutu kontrolü
      if (existingLogs.length > this.maxLogsPerFile) {
        const removedCount = existingLogs.length - this.maxLogsPerFile
        existingLogs.splice(0, removedCount)
        
        // Log limit aşıldığında notification gönder
        notification.warning(
          'Log Limit Aşıldı!',
          `Maksimum ${this.maxLogsPerFile} log limiti aşıldı. ${removedCount} eski log temizlendi.`,
          {
            category: 'storage',
            priority: 'high',
            // Duplicate prevention için unique key
            metadata: {
              duplicateKey: 'log-limit-warning',
              timestamp: Date.now()
            },
            actions: [
              {
                label: 'Log İstatistiklerini Gör',
                action: () => this.showLogStats()
              }
            ]
          }
        )
        
        logInfo('Max logs per file exceeded, old ones removed', { 
          removed: removedCount, 
          remaining: this.maxLogsPerFile,
          limit: this.maxLogsPerFile
        })
      }
      
      // LocalStorage'a kaydet
      const key = `agora_logs_${fileName}`
      
      try {
        localStorage.setItem(key, JSON.stringify(existingLogs))
      } catch (quotaError) {
        if (quotaError.name === 'QuotaExceededError') {
          // Quota hatası - notification gönder
          this.handleQuotaError(fileName, existingLogs.length)
          
          // Eski logları temizle ve tekrar dene
          this.cleanupOldLogsForQuota()
          
          try {
            localStorage.setItem(key, JSON.stringify(existingLogs))
          } catch (retryError) {
            console.error('Retry after quota cleanup failed:', retryError)
          }
        } else {
          throw quotaError
        }
      }
      
      // Metadata güncelle
      this.updateLogMetadata(fileName, existingLogs.length)
      
    } catch (error) {
      //console.error('LocalStorage kaydetme hatası:', error)
    }
  }

  // Storage'dan logları getir
  getLogsFromStorage(fileName) {
    try {
      const key = `agora_logs_${fileName}`
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Storage\'dan log okuma hatası:', error)
      return []
    }
  }

  // Log metadata güncelle
  updateLogMetadata(fileName, logCount) {
    try {
      const metadata = this.getLogMetadata()
      metadata[fileName] = {
        lastUpdated: new Date().toISOString(),
        logCount,
        fileSize: JSON.stringify(this.getLogsFromStorage(fileName)).length
      }
      localStorage.setItem('agora_logs_metadata', JSON.stringify(metadata))
    } catch (error) {
      console.error('Metadata güncelleme hatası:', error)
    }
  }

  // Log metadata getir
  getLogMetadata() {
    try {
      const data = localStorage.getItem('agora_logs_metadata')
      return data ? JSON.parse(data) : {}
    } catch (error) {
      return {}
    }
  }

  // Tüm log dosyalarını listele
  getLogFiles() {
    try {
      const metadata = this.getLogMetadata()
      const files = Object.keys(metadata).map(fileName => ({
        fileName,
        ...metadata[fileName]
      }))
      
      // Tarihe göre sırala (en yeni önce)
      return files.sort((a, b) => 
        new Date(b.lastUpdated) - new Date(a.lastUpdated)
      )
    } catch (error) {
      console.error('Log dosyaları listelenemedi:', error)
      return []
    }
  }

  // Belirli tarihteki logları getir
  getLogsByDate(date) {
    const fileName = `agora-logs-${date}.json`
    
    return this.getLogsFromStorage(fileName)
  }

  // Belirli tarih aralığındaki logları getir
  getLogsByDateRange(startDate, endDate) {
    const logs = []
    const currentDate = new Date(startDate)
    const end = new Date(endDate)
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dateLogs = this.getLogsByDate(dateStr)
      logs.push(...dateLogs)
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }

  // Log dosyasını indir
  downloadLogFile(fileName) {
    try {
      let logs
      
      logs = this.getLogsFromStorage(fileName)
      
      const data = {
        fileName,
        exportTime: new Date().toISOString(),
        sessionId: this.sessionId,
        totalLogs: logs.length,
        logs
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Log dosyası indirme hatası:', error)
      return false
    }
  }

  // Log dosyasını sil
  deleteLogFile(fileName) {
    try {
      const key = `agora_logs_${fileName}`
      localStorage.removeItem(key)
      
      // Metadata'dan da sil
      const metadata = this.getLogMetadata()
      delete metadata[fileName]
      
      localStorage.setItem('agora_logs_metadata', JSON.stringify(metadata))
      
      return true
    } catch (error) {
      console.error('Log dosyası silme hatası:', error)
      return false
    }
  }

  // Tüm logları temizle
  clearAllLogs() {
    try {
      const metadata = this.getLogMetadata()
      Object.keys(metadata).forEach(fileName => {
        this.deleteLogFile(fileName)
      })
      
      return true
    } catch (error) {
      console.error('Tüm logları temizleme hatası:', error)
      return false
    }
  }

  // Eski logları temizle (sadece log sayısı kontrolü)
  cleanupOldLogs() {
    try {
      // Sadece log sayısı kontrolü yap, tarih kontrolü yok
      // Bu metod artık sadece init'te çağrılıyor
      console.log('Log cleanup initialized - max logs per file:', this.maxLogsPerFile)
    } catch (error) {
      console.error('Log cleanup initialization error:', error)
    }
  }

  // Kullanıcı ID'sini al
  getUserId() {
    try {
      // Store'dan user ID'yi al
      return 'anonymous'
    } catch (error) {
      return 'anonymous'
    }
  }

  // Log istatistikleri
  getLogStats() {
    try {
      const metadata = this.getLogMetadata()
      const totalFiles = Object.keys(metadata).length
      const totalLogs = Object.values(metadata).reduce((sum, file) => sum + file.logCount, 0)
      const totalSize = Object.values(metadata).reduce((sum, file) => sum + file.fileSize, 0)
      
      return {
        totalFiles,
        totalLogs,
        totalSize: this.formatFileSize(totalSize),
        oldestFile: this.getOldestFile(metadata),
        newestFile: this.getNewestFile(metadata),
        storageMethod: 'localStorage'
      }
    } catch (error) {
      console.error('Log istatistikleri alınamadı:', error)
      return {
        totalFiles: 0,
        totalLogs: 0,
        totalSize: '0 B',
        oldestFile: null,
        newestFile: null,
        storageMethod: 'localStorage'
      }
    }
  }

  // En eski dosyayı bul
  getOldestFile(metadata) {
    try {
      const files = Object.keys(metadata)
      if (files.length === 0) return null
      
      return files.reduce((oldest, current) => {
        const oldestDate = new Date(metadata[oldest].lastUpdated)
        const currentDate = new Date(metadata[current].lastUpdated)
        return oldestDate < currentDate ? oldest : current
      })
    } catch (error) {
      return null
    }
  }

  // En yeni dosyayı bul
  getNewestFile(metadata) {
    try {
      const files = Object.keys(metadata)
      if (files.length === 0) return null
      
      return files.reduce((newest, current) => {
        const newestDate = new Date(metadata[newest].lastUpdated)
        const currentDate = new Date(metadata[current].lastUpdated)
        return newestDate > currentDate ? newest : current
      })
    } catch (error) {
      return null
    }
  }

  // Dosya boyutunu formatla
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Quota hatası için notification gönder
   * @param {string} fileName - Dosya adı
   * @param {number} logCount - Log sayısı
   */
  handleQuotaError(fileName, logCount) {
    try {
      // Direkt notification kullan
      notification.warning(
        'Storage Quota Aşıldı',
        `Log dosyası ${fileName} için storage alanı yetersiz. Eski loglar temizleniyor...`,
        {
          category: 'storage',
          priority: 'high',
          // Duplicate prevention için unique key
          metadata: {
            duplicateKey: 'storage-quota-warning',
            timestamp: Date.now()
          },
          actions: [
            {
              label: 'Tüm Logları Temizle',
              action: () => this.clearAllLogs()
            }
          ]
        }
      )
    } catch (error) {
      console.error('Quota error handling hatası:', error)
      // Fallback: console warning
      console.warn('Storage quota aşıldı, eski loglar temizleniyor...')
    }
  }

  /**
   * Quota için eski logları temizle
   */
  cleanupOldLogsForQuota() {
    try {
      // En eski logları bul ve temizle
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('agora_logs_'))
      
      if (allKeys.length > 0) {
        // Tarihe göre sırala (en eski önce)
        allKeys.sort((a, b) => {
          const dateA = this.extractDateFromKey(a)
          const dateB = this.extractDateFromKey(b)
          return dateA - dateB
        })
        
        // En eski 3 dosyayı kaldır
        const toRemove = allKeys.slice(0, Math.min(3, allKeys.length))
        toRemove.forEach(key => {
          localStorage.removeItem(key)
          console.log(`Quota için eski log dosyası kaldırıldı: ${key}`)
        })
      }
    } catch (error) {
      console.error('Quota cleanup hatası:', error)
    }
  }

  /**
   * Log key'inden tarih çıkar
   * @param {string} key - LocalStorage key
   * @returns {number} Timestamp
   */
  extractDateFromKey(key) {
    try {
      const match = key.match(/agora_logs_.*?(\d{4}-\d{2}-\d{2})\.json/)
      if (match) {
        return new Date(match[1]).getTime()
      }
      return 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Log istatistiklerini göster
   */
  showLogStats() {
    try {
      const stats = this.getLogStats()
      
      notification.info(
        'Log İstatistikleri',
        `Toplam: ${stats.totalFiles} dosya, ${stats.totalLogs} log, ${stats.totalSize}`,
        {
          category: 'storage',
          priority: 'normal',
          autoDismiss: true,
          actions: [
            {
              label: 'Tüm Logları Temizle',
              action: () => this.clearAllLogs()
            }
          ]
        }
      )
    } catch (error) {
      console.error('Log istatistikleri gösterilemedi:', error)
    }
  }

  /**
   * Tüm logları temizle
   */
  clearAllLogs() {
    try {
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('agora_logs_'))
      allKeys.forEach(key => localStorage.removeItem(key))
      
      console.log('Tüm loglar temizlendi')
      
      // Başarı notification'ı gönder
      notification.success(
        'Loglar Temizlendi',
        'Tüm log dosyaları başarıyla temizlendi',
        {
          category: 'storage',
          priority: 'normal',
          autoDismiss: true
        }
      )
    } catch (error) {
      console.error('Log temizleme hatası:', error)
      
      // Hata notification'ı gönder
      notification.error(
        'Log Temizleme Hatası',
        'Loglar temizlenirken hata oluştu',
        {
          category: 'storage',
          priority: 'high'
        }
      )
    }
  }
}

// Varsayılan fileLogger instance'ı (LocalStorage ile)
export const fileLogger = new FileLogger()

// Logger helper fonksiyonları
export const logger = {
  debug: (category, message, data) => fileLogger.log(LOG_LEVELS.DEBUG, category, message, data),
  info: (category, message, data) => fileLogger.log(LOG_LEVELS.INFO, category, message, data),
  warn: (category, message, data) => fileLogger.log(LOG_LEVELS.WARN, category, message, data),
  error: (category, message, data) => fileLogger.log(LOG_LEVELS.ERROR, category, message, data),
  critical: (category, message, data) => fileLogger.log(LOG_LEVELS.CRITICAL, category, message, data)
  
  // Not: Kategori-özel tracking fonksiyonları kaldırıldı
  // Performance, UserAction, AgoraEvent, Error tracking için doğrudan logInfo/logError kullanılacak
}
