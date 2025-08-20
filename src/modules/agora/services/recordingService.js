/**
 * Agora Cloud Recording Service
 * Composite recording işlemlerini yönetir
 * Azure Storage ve Custom Server desteği
 */

import { AGORA_CONFIG, API_ENDPOINTS, DEV_CONFIG, RECORDING_CONFIG } from '../constants.js'
import { fileLogger } from './fileLogger.js'
import { notification } from './notificationService.js'

// Logger helper'ları (modül seviyesi - tutarlı kullanım)
const logDebug = (message, data) => fileLogger.log('debug', 'RECORDING', message, data)
const logInfo = (message, data) => fileLogger.log('info', 'RECORDING', message, data)
const logWarn = (message, data) => fileLogger.log('warn', 'RECORDING', message, data)
const logError = (errorOrMessage, context) => {
  if (errorOrMessage instanceof Error) {
    return fileLogger.log('error', 'RECORDING', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
  }
  return fileLogger.log('error', 'RECORDING', errorOrMessage, context)
}
const logFatal = (errorOrMessage, context) => {
  if (errorOrMessage instanceof Error) {
    return fileLogger.log('fatal', 'RECORDING', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
  }
  return fileLogger.log('fatal', 'RECORDING', errorOrMessage, context)
}

class RecordingService {
  constructor() {
    this.isRecording = false
    this.recordingId = null
    this.recordingStatus = 'IDLE' // IDLE, STARTING, RECORDING, STOPPING, ERROR
    this.recordingConfig = null
    this.recordingFiles = []
    this.error = null
    this.retryCount = 0
    this.maxRetries = DEV_CONFIG.MAX_RETRY_COUNT
    
    // Storage provider selection
    this.storageProvider = RECORDING_CONFIG.STORAGE_PROVIDER
    this.currentPerspective = RECORDING_CONFIG.DEFAULT_PERSPECTIVE
    this.currentQuality = RECORDING_CONFIG.DEFAULT_QUALITY
  }

  /**
   * Storage provider değiştir (tek ayar ile)
   * @param {string} provider - 'azure' veya 'custom'
   */
  setStorageProvider(provider) {
    if (provider === 'azure' || provider === 'custom') {
      this.storageProvider = provider
      logInfo(`Storage provider değiştirildi: ${provider}`)
      return true
    }
    logWarn(`Geçersiz storage provider: ${provider}`)
    return false
  }

  /**
   * Recording perspective değiştir
   * @param {string} perspective - 'host', 'audience', 'whiteboard'
   */
  setRecordingPerspective(perspective) {
    if (Object.values(RECORDING_CONFIG.PERSPECTIVES).includes(perspective)) {
      this.currentPerspective = perspective
      logInfo(`Recording perspective değiştirildi: ${perspective}`)
      return true
    }
    logWarn(`Geçersiz recording perspective: ${perspective}`)
    return false
  }

  /**
   * Recording quality değiştir
   * @param {string} quality - 'high', 'medium', 'low'
   */
  setRecordingQuality(quality) {
    if (Object.keys(RECORDING_CONFIG.QUALITY).includes(quality)) {
      this.currentQuality = quality
      logInfo(`Recording quality değiştirildi: ${quality}`)
      return true
    }
    logWarn(`Geçersiz recording quality: ${quality}`)
    return false
  }

  /**
   * Composite recording konfigürasyonu oluştur
   * @param {Object} customConfig - Özel konfigürasyon
   * @returns {Object} Tam konfigürasyon
   */
  createCompositeConfig(customConfig = {}) {
    const baseConfig = {
      ...RECORDING_CONFIG.COMPOSITE,
      perspective: this.currentPerspective,
      quality: this.currentQuality,
      storageProvider: this.storageProvider
    }

    // Quality ayarlarını uygula
    const qualitySettings = RECORDING_CONFIG.QUALITY[this.currentQuality]
    if (qualitySettings) {
      baseConfig.bitrateMin = qualitySettings.BITRATE_MIN
      baseConfig.bitrateMax = qualitySettings.BITRATE_MAX
      baseConfig.frameRate = qualitySettings.FRAME_RATE
      baseConfig.resolution = qualitySettings.RESOLUTION
    }

    // Perspective'e göre özel ayarlar
    switch (this.currentPerspective) {
      case 'host':
        // En kapsamlı kayıt
        baseConfig.includeAllStreams = true
        baseConfig.includeWhiteboard = true
        baseConfig.includeChat = true
        baseConfig.includeParticipantList = true
        break
        
      case 'audience':
        // Sadece önemli içerik
        baseConfig.includeAllStreams = false
        baseConfig.includeWhiteboard = true
        baseConfig.includeChat = false
        baseConfig.includeParticipantList = false
        break
        
      case 'whiteboard':
        // Sadece whiteboard odaklı
        baseConfig.includeAllStreams = false
        baseConfig.includeWhiteboard = true
        baseConfig.includeChat = false
        baseConfig.includeParticipantList = false
        baseConfig.whiteboardOnly = true
        break
    }

    // Whiteboard ayarlarını ekle
    if (RECORDING_CONFIG.WHITEBOARD.ENABLED) {
      baseConfig.whiteboard = {
        ...RECORDING_CONFIG.WHITEBOARD,
        enabled: true
      }
    }

    // Storage ayarlarını ekle
    if (this.storageProvider === 'azure') {
      baseConfig.storage = {
        vendor: RECORDING_CONFIG.AZURE.VENDOR_ID,
        region: RECORDING_CONFIG.AZURE.REGION,
        bucket: RECORDING_CONFIG.AZURE.CONTAINER,
        accessKey: RECORDING_CONFIG.AZURE.ACCESS_KEY,
        secretKey: RECORDING_CONFIG.AZURE.SECRET_KEY
      }
    } else {
      baseConfig.storage = {
        vendor: RECORDING_CONFIG.CUSTOM.VENDOR_ID,
        endpoint: RECORDING_CONFIG.CUSTOM.ENDPOINT,
        apiKey: RECORDING_CONFIG.CUSTOM.API_KEY,
        format: RECORDING_CONFIG.CUSTOM.FORMAT,
        compression: RECORDING_CONFIG.CUSTOM.COMPRESSION
      }
    }

    return { ...baseConfig, ...customConfig }
  }

  /**
   * Composite recording başlatma
   * @param {Object} config - Recording konfigürasyonu
   * @returns {Promise<Object>} Recording sonucu
   */
  async startRecording(config = {}) {
    try {
      logInfo('Composite recording başlatılıyor...')
      
      this.recordingStatus = 'STARTING'
      this.error = null
      
      // Composite konfigürasyonu oluştur
      const recordingConfig = this.createCompositeConfig(config)
      
      logInfo('Recording konfigürasyonu:', {
        perspective: recordingConfig.perspective,
        quality: recordingConfig.quality,
        storageProvider: recordingConfig.storageProvider,
        includeWhiteboard: recordingConfig.whiteboard?.enabled,
        streamTypes: recordingConfig.streamTypes
      })

      this.recordingConfig = recordingConfig

      // Cloud recording API çağrısı
      const response = await this.callRecordingAPI('start', recordingConfig)
      
      if (response.success) {
        this.isRecording = true
        this.recordingId = response.recordingId
        this.recordingStatus = 'RECORDING'
        this.retryCount = 0
        
        logInfo(`Composite recording başlatıldı! ID: ${this.recordingId}`)
        
        return {
          success: true,
          recordingId: this.recordingId,
          message: 'Composite recording başarıyla başlatıldı',
          config: {
            perspective: recordingConfig.perspective,
            quality: recordingConfig.quality,
            storageProvider: recordingConfig.storageProvider
          }
        }
      } else {
        throw new Error(response.message || 'Recording başlatılamadı')
      }
      
    } catch (error) {
      this.handleRecordingError(error, 'startRecording')
      return {
        success: false,
        error: error.message,
        message: 'Composite recording başlatılamadı'
      }
    }
  }

  /**
   * Recording durdurma
   * @returns {Promise<Object>} Durdurma sonucu
   */
  async stopRecording() {
    try {
      if (!this.isRecording || !this.recordingId) {
        throw new Error('Aktif recording bulunamadı')
      }

      logInfo('Recording durduruluyor...')
      this.recordingStatus = 'STOPPING'

      const response = await this.callRecordingAPI('stop', {
        recordingId: this.recordingId
      })

      if (response.success) {
        this.isRecording = false
        this.recordingStatus = 'IDLE'
        this.recordingFiles = response.files || []
        
        logInfo(`Recording durduruldu! Dosyalar: ${this.recordingFiles.length}`)
        
        return {
          success: true,
          files: this.recordingFiles,
          message: 'Recording başarıyla durduruldu'
        }
      } else {
        throw new Error(response.message || 'Recording durdurulamadı')
      }
      
    } catch (error) {
      this.handleRecordingError(error, 'stopRecording')
      return {
        success: false,
        error: error.message,
        message: 'Recording durdurulamadı'
      }
    }
  }

  /**
   * Recording durumu sorgulama
   * @returns {Promise<Object>} Durum bilgisi
   */
  async getRecordingStatus() {
    try {
      if (!this.recordingId) {
        return {
          success: true,
          status: 'IDLE',
          isRecording: false
        }
      }

      const response = await this.callRecordingAPI('query', {
        recordingId: this.recordingId
      })

      if (response.success) {
        this.recordingStatus = response.status
        this.isRecording = response.status === 'RECORDING'
        
        return {
          success: true,
          status: this.recordingStatus,
          isRecording: this.isRecording,
          files: response.files || []
        }
      } else {
        throw new Error(response.message || 'Durum sorgulanamadı')
      }
      
    } catch (error) {
      this.handleRecordingError(error, 'getRecordingStatus')
      return {
        success: false,
        error: error.message,
        status: 'ERROR'
      }
    }
  }

  /**
   * Recording dosyalarını listele
   * @returns {Promise<Array>} Dosya listesi
   */
  async listRecordingFiles() {
    try {
      const response = await this.callRecordingAPI('list', {})
      
      if (response.success) {
        this.recordingFiles = response.files || []
        return this.recordingFiles
      } else {
        throw new Error(response.message || 'Dosyalar listelenemedi')
      }
      
    } catch (error) {
      this.handleRecordingError(error, 'listRecordingFiles')
      return []
    }
  }

  /**
   * Recording dosyasını indir
   * @param {string} fileId - Dosya ID'si
   * @returns {Promise<Object>} İndirme sonucu
   */
  async downloadRecordingFile(fileId) {
    try {
      const response = await this.callRecordingAPI('download', { fileId })
      
      if (response.success) {
        return {
          success: true,
          downloadUrl: response.downloadUrl,
          fileName: response.fileName
        }
      } else {
        throw new Error(response.message || 'Dosya indirilemedi')
      }
      
    } catch (error) {
      this.handleRecordingError(error, 'downloadRecordingFile')
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Recording API çağrısı
   * @param {string} action - API aksiyonu
   * @param {Object} data - Gönderilecek veri
   * @returns {Promise<Object>} API yanıtı
   */
  async callRecordingAPI(action, data) {
    try {
      const apiUrl = API_ENDPOINTS.RECORDING
      const requestData = {
        action,
        ...data,
        timestamp: Date.now()
      }

      logInfo(`Recording API çağrısı: ${action}`, { apiUrl, data: requestData })

      // Form data olarak gönder (PHP'de JSON parsing sorunu var)
      const formData = new FormData()
      Object.keys(requestData).forEach(key => {
        formData.append(key, requestData[key])
      })

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      return result
      
    } catch (error) {
      logError(`Recording API hatası (${action}): ${error.message || error}`)
      throw error
    }
  }

  /**
   * Recording hata yönetimi
   * @param {Error} error - Hata objesi
   * @param {string} operation - İşlem adı
   */
  handleRecordingError(error, operation) {
    this.error = error
    this.recordingStatus = 'ERROR'
    
    logError(`Recording hatası (${operation}): ${error.message || error}`)
    
    // Retry logic
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      logInfo(`Recording retry ${this.retryCount}/${this.maxRetries}`)
      
      setTimeout(() => {
        this.retryOperation(operation)
      }, DEV_CONFIG.RETRY_DELAY * this.retryCount)
    }
  }

  /**
   * Hatalı işlemi tekrar dene
   * @param {string} operation - Tekrarlanacak işlem
   */
  async retryOperation(operation) {
    try {
      switch (operation) {
        case 'startRecording':
          await this.startRecording(this.recordingConfig)
          break
        case 'stopRecording':
          await this.stopRecording()
          break
        case 'getRecordingStatus':
          await this.getRecordingStatus()
          break
      }
    } catch (error) {
      logError(`Recording retry hatası (${operation}): ${error.message || error}`)
    }
  }

  /**
   * Recording durumunu sıfırla
   */
  reset() {
    this.isRecording = false
    this.recordingId = null
    this.recordingStatus = 'IDLE'
    this.recordingConfig = null
    this.recordingFiles = []
    this.error = null
    this.retryCount = 0
  }

  /**
   * Mevcut durumu al
   * @returns {Object} Durum bilgisi
   */
  getStatus() {
    return {
      isRecording: this.isRecording,
      recordingId: this.recordingId,
      status: this.recordingStatus,
      files: this.recordingFiles,
      error: this.error,
      retryCount: this.retryCount,
      // Storage provider bilgileri
      storageProvider: this.storageProvider,
      currentPerspective: this.currentPerspective,
      currentQuality: this.currentQuality,
      // Recording konfigürasyonu
      config: this.recordingConfig
    }
  }
}

// Singleton instance
export const recordingService = new RecordingService()
export default recordingService 