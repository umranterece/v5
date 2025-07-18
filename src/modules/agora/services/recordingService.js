/**
 * Agora Cloud Recording Service
 * Cloud recording işlemlerini yönetir
 */

import { AGORA_CONFIG, API_ENDPOINTS, DEV_CONFIG } from '../constants.js'
import { logger } from './logger.js'

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
  }

  /**
   * Recording başlatma
   * @param {Object} config - Recording konfigürasyonu
   * @returns {Promise<Object>} Recording sonucu
   */
  async startRecording(config = {}) {
    try {
      logger.logUI('Recording başlatılıyor...', 'RECORDING')
      
      this.recordingStatus = 'STARTING'
      this.error = null
      
      const recordingConfig = {
        // Varsayılan ayarlar
        maxIdleTime: 30, // 30 saniye boşluk sonrası otomatik durdurma
        streamTypes: 2, // Audio + Video
        channelType: 1, // Live streaming
        subscribeAudioUids: [], // Tüm audio'ları kaydet
        subscribeVideoUids: [], // Tüm video'ları kaydet
        subscribeUidGroup: 0, // Tüm kullanıcıları kaydet
        
        // Kullanıcı ayarları
        ...config
      }

      this.recordingConfig = recordingConfig

      // Cloud recording API çağrısı
      const response = await this.callRecordingAPI('start', recordingConfig)
      
      if (response.success) {
        this.isRecording = true
        this.recordingId = response.recordingId
        this.recordingStatus = 'RECORDING'
        this.retryCount = 0
        
        logger.logUI(`Recording başlatıldı! ID: ${this.recordingId}`, 'RECORDING')
        
        return {
          success: true,
          recordingId: this.recordingId,
          message: 'Recording başarıyla başlatıldı'
        }
      } else {
        throw new Error(response.message || 'Recording başlatılamadı')
      }
      
    } catch (error) {
      this.handleRecordingError(error, 'startRecording')
      return {
        success: false,
        error: error.message,
        message: 'Recording başlatılamadı'
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

      logger.logUI('Recording durduruluyor...', 'RECORDING')
      this.recordingStatus = 'STOPPING'

      const response = await this.callRecordingAPI('stop', {
        recordingId: this.recordingId
      })

      if (response.success) {
        this.isRecording = false
        this.recordingStatus = 'IDLE'
        this.recordingFiles = response.files || []
        
        logger.logUI(`Recording durduruldu! Dosyalar: ${this.recordingFiles.length}`, 'RECORDING')
        
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
      const apiUrl = `${API_ENDPOINTS.CREATE_TOKEN.replace('createToken.php', 'recording.php')}`
      
      const requestData = {
        action,
        ...data,
        timestamp: Date.now()
      }

      logger.logUI(`Recording API çağrısı: ${action}`, 'RECORDING')

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
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
      logger.logError(`Recording API hatası (${action}):`, error, 'RECORDING')
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
    
    logger.logError(`Recording hatası (${operation}):`, error, 'RECORDING')
    
    // Retry logic
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      logger.logUI(`Recording retry ${this.retryCount}/${this.maxRetries}`, 'RECORDING')
      
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
      logger.logError(`Recording retry hatası (${operation}):`, error, 'RECORDING')
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
      retryCount: this.retryCount
    }
  }
}

// Singleton instance
export const recordingService = new RecordingService()
export default recordingService 