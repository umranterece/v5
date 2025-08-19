/**
 * File-based JSON Logger Service
 * Tüm logları günlük JSON dosyalarına kaydeder
 * Desteklenen storage yöntemleri: localStorage (varsayılan), localFolder
 */

import { IS_DEV } from '../constants.js'
import { generateSessionId } from '../utils/index.js'

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

// Storage yöntemleri
export const STORAGE_METHODS = {
  LOCAL_STORAGE: 'localStorage',
  LOCAL_FOLDER: 'localFolder'
}

class FileLogger {
  constructor(storageMethod = STORAGE_METHODS.LOCAL_STORAGE) {
    this.sessionId = null // Lazy initialization
    this.logQueue = []
    this.isProcessing = false
    this.maxFileSize = 10 * 1024 * 1024 // 10MB
    this.maxLogsPerFile = 10000
    this.retentionDays = 30
    this.storageMethod = storageMethod
    this.localFolderPath = './logs' // Proje klasöründe logs dizini
    
    this.init()
  }

  init() {
    // Log dizinini oluştur
    this.ensureLogDirectory()
    
    // Eski logları temizle
    this.cleanupOldLogs()
    
    // Queue işlemcisini başlat
    this.processQueue()
  }

  // Log dizinini oluştur
  ensureLogDirectory() {
    try {
      if (this.storageMethod === STORAGE_METHODS.LOCAL_FOLDER) {
        // Local klasör sistemi
        this.storageType = 'localFolder'
        this.createLocalFolder()
      } else {
        // Varsayılan: LocalStorage
        if (typeof window !== 'undefined') {
          this.storageType = 'localStorage'
        } else {
          this.storageType = 'localStorage'
        }
      }
    } catch (error) {
      console.error('Storage type belirlenemedi:', error)
      this.storageType = 'localStorage'
    }
  }

  // Local klasör oluştur
  createLocalFolder() {
    try {
      // Node.js fs modülü ile klasör oluştur
      if (typeof window === 'undefined') {
        const fs = require('fs')
        const path = require('path')
        
        if (!fs.existsSync(this.localFolderPath)) {
          fs.mkdirSync(this.localFolderPath, { recursive: true })
        }
      }
    } catch (error) {
      console.error('Local klasör oluşturma hatası:', error)
      // Fallback: LocalStorage
      this.storageType = 'localStorage'
    }
  }

  // Storage yöntemini değiştir
  setStorageMethod(method) {
    this.storageMethod = method
    this.ensureLogDirectory()
  }

  // Mevcut storage yöntemini al
  getStorageMethod() {
    return this.storageMethod
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
      
      if (this.storageType === 'localStorage') {
        await this.saveToLocalStorage(fileName, logEntry)
      } else if (this.storageType === 'localFolder') {
        await this.saveToLocalFolder(fileName, logEntry)
      }
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
        existingLogs.splice(0, existingLogs.length - this.maxLogsPerFile)
      }
      
      // LocalStorage'a kaydet
      const key = `agora_logs_${fileName}`
      localStorage.setItem(key, JSON.stringify(existingLogs))
      
      // Metadata güncelle
      this.updateLogMetadata(fileName, existingLogs.length)
      
    } catch (error) {
      console.error('LocalStorage kaydetme hatası:', error)
    }
  }

  // Local klasöre kaydetme
  async saveToLocalFolder(fileName, logEntry) {
    try {
      if (typeof window === 'undefined') {
        // Node.js ortamında
        const fs = require('fs')
        const path = require('path')
        
        const filePath = path.join(this.localFolderPath, fileName)
        const existingLogs = this.getLogsFromLocalFolder(fileName)
        existingLogs.push(logEntry)
        
        // Dosya boyutu kontrolü
        if (existingLogs.length > this.maxLogsPerFile) {
          existingLogs.splice(0, existingLogs.length - this.maxLogsPerFile)
        }
        
        // Dosyaya yaz
        fs.writeFileSync(filePath, JSON.stringify(existingLogs, null, 2))
        
        // Metadata güncelle
        this.updateLocalFolderMetadata(fileName, existingLogs.length)
      } else {
        // Browser ortamında - fallback to localStorage
        await this.saveToLocalStorage(fileName, logEntry)
      }
    } catch (error) {
      console.error('Local klasör kaydetme hatası:', error)
      // Fallback: LocalStorage
      await this.saveToLocalStorage(fileName, logEntry)
    }
  }

  // Local klasörden logları getir
  getLogsFromLocalFolder(fileName) {
    try {
      if (typeof window === 'undefined') {
        const fs = require('fs')
        const path = require('path')
        
        const filePath = path.join(this.localFolderPath, fileName)
        
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath, 'utf8')
          return JSON.parse(data)
        }
      }
      return []
    } catch (error) {
      console.error('Local klasörden log okuma hatası:', error)
      return []
    }
  }

  // Local klasör metadata güncelle
  updateLocalFolderMetadata(fileName, logCount) {
    try {
      if (typeof window === 'undefined') {
        const fs = require('fs')
        const path = require('path')
        
        const metadataPath = path.join(this.localFolderPath, 'metadata.json')
        const metadata = this.getLocalFolderMetadata()
        
        metadata[fileName] = {
          lastUpdated: new Date().toISOString(),
          logCount,
          fileSize: this.getLocalFolderFileSize(fileName)
        }
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
      }
    } catch (error) {
      console.error('Local klasör metadata güncelleme hatası:', error)
    }
  }

  // Local klasör metadata getir
  getLocalFolderMetadata() {
    try {
      if (typeof window === 'undefined') {
        const fs = require('fs')
        const path = require('path')
        
        const metadataPath = path.join(this.localFolderPath, 'metadata.json')
        
        if (fs.existsSync(metadataPath)) {
          const data = fs.readFileSync(metadataPath, 'utf8')
          return JSON.parse(data)
        }
      }
      return {}
    } catch (error) {
      return {}
    }
  }

  // Local klasör dosya boyutu
  getLocalFolderFileSize(fileName) {
    try {
      if (typeof window === 'undefined') {
        const fs = require('fs')
        const path = require('path')
        
        const filePath = path.join(this.localFolderPath, fileName)
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath)
          return stats.size
        }
      }
      return 0
    } catch (error) {
      return 0
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
      if (this.storageType === 'localFolder') {
        return this.getLocalFolderMetadata()
      } else {
        const data = localStorage.getItem('agora_logs_metadata')
        return data ? JSON.parse(data) : {}
      }
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
    
    if (this.storageType === 'localFolder') {
      return this.getLogsFromLocalFolder(fileName)
    } else {
      return this.getLogsFromStorage(fileName)
    }
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
      
      if (this.storageType === 'localFolder') {
        logs = this.getLogsFromLocalFolder(fileName)
      } else {
        logs = this.getLogsFromStorage(fileName)
      }
      
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
      if (this.storageType === 'localFolder') {
        if (typeof window === 'undefined') {
          const fs = require('fs')
          const path = require('path')
          
          const filePath = path.join(this.localFolderPath, fileName)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        }
      } else {
        const key = `agora_logs_${fileName}`
        localStorage.removeItem(key)
      }
      
      // Metadata'dan da sil
      const metadata = this.getLogMetadata()
      delete metadata[fileName]
      
      if (this.storageType === 'localFolder') {
        this.updateLocalFolderMetadata(fileName, 0)
      } else {
        localStorage.setItem('agora_logs_metadata', JSON.stringify(metadata))
      }
      
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

  // Eski logları temizle
  cleanupOldLogs() {
    try {
      const metadata = this.getLogMetadata()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays)
      
      Object.keys(metadata).forEach(fileName => {
        const fileDate = fileName.replace('agora-logs-', '').replace('.json', '')
        if (new Date(fileDate) < cutoffDate) {
          this.deleteLogFile(fileName)
        }
      })
    } catch (error) {
      console.error('Eski log temizleme hatası:', error)
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
        storageMethod: this.storageMethod
      }
    } catch (error) {
      console.error('Log istatistikleri alınamadı:', error)
      return {
        totalFiles: 0,
        totalLogs: 0,
        totalSize: '0 B',
        oldestFile: null,
        newestFile: null,
        storageMethod: this.storageMethod
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
}

// Varsayılan fileLogger instance'ı (LocalStorage ile)
export const fileLogger = new FileLogger(STORAGE_METHODS.LOCAL_STORAGE)

// Local klasör ile fileLogger instance'ı
export const localFolderLogger = new FileLogger(STORAGE_METHODS.LOCAL_FOLDER)

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
