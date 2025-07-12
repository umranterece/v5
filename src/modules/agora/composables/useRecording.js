/**
 * Recording Composable
 * Cloud recording işlemlerini yönetir
 */

import { ref, computed, watch, onUnmounted, readonly } from 'vue'
import { recordingService } from '../services/recordingService.js'
import { logger } from '../services/logger.js'
import { centralEmitter } from '../centralEmitter.js'
import { RECORDING_EVENTS } from '../constants.js'

export function useRecording() {
  // Reactive state
  const isRecording = ref(false)
  const recordingStatus = ref('IDLE')
  const recordingId = ref(null)
  const recordingFiles = ref([])
  const recordingError = ref(null)
  const recordingProgress = ref(0)
  const recordingDuration = ref(0)
  const recordingStartTime = ref(null)
  
  // Recording konfigürasyonu
  const recordingConfig = ref({
    maxIdleTime: 30,
    streamTypes: 2, // Audio + Video
    channelType: 1, // Live streaming
    subscribeAudioUids: [],
    subscribeVideoUids: [],
    subscribeUidGroup: 0,
    // Ek ayarlar
    recordingFileConfig: {
      avFileType: ['hls', 'mp4'], // HLS ve MP4 formatları
      fileCompress: false, // Sıkıştırma kapalı
      fileMaxSizeMB: 512 // Maksimum dosya boyutu
    },
    storageConfig: {
      vendor: 0, // Agora Cloud Storage
      region: 0, // Global
      bucket: 'agora-recording-bucket',
      accessKey: '',
      secretKey: ''
    }
  })

  // Computed properties
  const canStartRecording = computed(() => {
    return !isRecording.value && recordingStatus.value === 'IDLE'
  })

  const canStopRecording = computed(() => {
    return isRecording.value && recordingStatus.value === 'RECORDING'
  })

  const recordingTime = computed(() => {
    if (!recordingStartTime.value) return '00:00'
    
    const elapsed = Date.now() - recordingStartTime.value
    const minutes = Math.floor(elapsed / 60000)
    const seconds = Math.floor((elapsed % 60000) / 1000)
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const recordingStatusText = computed(() => {
    switch (recordingStatus.value) {
      case 'IDLE': return 'Hazır'
      case 'STARTING': return 'Başlatılıyor...'
      case 'RECORDING': return `Kaydediliyor (${recordingTime.value})`
      case 'STOPPING': return 'Durduruluyor...'
      case 'ERROR': return 'Hata!'
      default: return 'Bilinmiyor'
    }
  })

  const hasRecordingFiles = computed(() => {
    return recordingFiles.value.length > 0
  })

  // Recording işlemleri
  const startRecording = async (config = {}) => {
    try {
      logger.logUI('Recording başlatma isteği gönderildi', 'RECORDING')
      
      // Konfigürasyonu güncelle
      const finalConfig = {
        ...recordingConfig.value,
        ...config
      }

      const result = await recordingService.startRecording(finalConfig)
      
      if (result.success) {
        isRecording.value = true
        recordingId.value = result.recordingId
        recordingStatus.value = 'RECORDING'
        recordingStartTime.value = Date.now()
        recordingError.value = null
        
        // Event emit - centralEmitter kullanmıyoruz
        logger.logUI(`Recording başlatıldı: ${result.recordingId}`, 'RECORDING')
        
        logger.logUI(`Recording başlatıldı: ${result.recordingId}`, 'RECORDING')
        return result
      } else {
        throw new Error(result.error || 'Recording başlatılamadı')
      }
      
    } catch (error) {
      recordingError.value = error.message
      recordingStatus.value = 'ERROR'
      
      logger.logError('Recording başlatma hatası:', error, 'RECORDING')
      
      // Event emit
      centralEmitter.emit(RECORDING_EVENTS.RECORDING_ERROR, {
        error: error.message,
        timestamp: Date.now()
      })
      
      throw error
    }
  }

  const stopRecording = async () => {
    try {
      logger.logUI('Recording durdurma isteği gönderildi', 'RECORDING')
      
      const result = await recordingService.stopRecording()
      
      if (result.success) {
        isRecording.value = false
        recordingStatus.value = 'IDLE'
        recordingFiles.value = result.files || []
        recordingStartTime.value = null
        recordingDuration.value = 0
        recordingError.value = null
        
        // Event emit
        centralEmitter.emit(RECORDING_EVENTS.RECORDING_STOPPED, {
          files: result.files,
          timestamp: Date.now()
        })
        
        logger.logUI(`Recording durduruldu. Dosyalar: ${result.files?.length || 0}`, 'RECORDING')
        return result
      } else {
        throw new Error(result.error || 'Recording durdurulamadı')
      }
      
    } catch (error) {
      recordingError.value = error.message
      
      logger.logError('Recording durdurma hatası:', error, 'RECORDING')
      
      // Event emit
      centralEmitter.emit(RECORDING_EVENTS.RECORDING_ERROR, {
        error: error.message,
        timestamp: Date.now()
      })
      
      throw error
    }
  }

  const getRecordingStatus = async () => {
    try {
      const result = await recordingService.getRecordingStatus()
      
      if (result.success) {
        recordingStatus.value = result.status
        isRecording.value = result.isRecording
        recordingFiles.value = result.files || []
        
        return result
      } else {
        throw new Error(result.error || 'Durum sorgulanamadı')
      }
      
    } catch (error) {
      logger.logError('Recording durum sorgulama hatası:', error, 'RECORDING')
      throw error
    }
  }

  const listRecordingFiles = async () => {
    try {
      const files = await recordingService.listRecordingFiles()
      recordingFiles.value = files
      return files
    } catch (error) {
      logger.logError('Recording dosya listesi hatası:', error, 'RECORDING')
      throw error
    }
  }

  const downloadRecordingFile = async (fileId) => {
    try {
      const result = await recordingService.downloadRecordingFile(fileId)
      
      if (result.success) {
        // Dosya indirme
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = result.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        logger.logUI(`Dosya indirildi: ${result.fileName}`, 'RECORDING')
        return result
      } else {
        throw new Error(result.error || 'Dosya indirilemedi')
      }
      
    } catch (error) {
      logger.logError('Recording dosya indirme hatası:', error, 'RECORDING')
      throw error
    }
  }

  const resetRecording = () => {
    recordingService.reset()
    isRecording.value = false
    recordingStatus.value = 'IDLE'
    recordingId.value = null
    recordingFiles.value = []
    recordingError.value = null
    recordingProgress.value = 0
    recordingDuration.value = 0
    recordingStartTime.value = null
    
    logger.logUI('Recording durumu sıfırlandı', 'RECORDING')
  }

  // Recording progress tracking
  let progressInterval = null
  
  const startProgressTracking = () => {
    if (progressInterval) return
    
    progressInterval = setInterval(() => {
      if (isRecording.value && recordingStartTime.value) {
        const elapsed = Date.now() - recordingStartTime.value
        recordingDuration.value = elapsed
        
        // Progress hesaplama (varsayılan 2 saat maksimum)
        const maxDuration = 2 * 60 * 60 * 1000 // 2 saat
        recordingProgress.value = Math.min((elapsed / maxDuration) * 100, 100)
      }
    }, 1000) // Her saniye güncelle
  }

  const stopProgressTracking = () => {
    if (progressInterval) {
      clearInterval(progressInterval)
      progressInterval = null
    }
  }

  // Event listeners
  const handleRecordingStarted = (data) => {
    logger.logUI('Recording başladı eventi alındı', 'RECORDING')
    startProgressTracking()
  }

  const handleRecordingStopped = (data) => {
    logger.logUI('Recording durdu eventi alındı', 'RECORDING')
    stopProgressTracking()
  }

  const handleRecordingError = (data) => {
    logger.logError('Recording hatası eventi alındı:', data.error, 'RECORDING')
    stopProgressTracking()
  }

  // Event listener'ları ekle
  centralEmitter.on(RECORDING_EVENTS.RECORDING_STARTED, handleRecordingStarted)
  centralEmitter.on(RECORDING_EVENTS.RECORDING_STOPPED, handleRecordingStopped)
  centralEmitter.on(RECORDING_EVENTS.RECORDING_ERROR, handleRecordingError)

  // Cleanup
  onUnmounted(() => {
    stopProgressTracking()
    centralEmitter.off(RECORDING_EVENTS.RECORDING_STARTED, handleRecordingStarted)
    centralEmitter.off(RECORDING_EVENTS.RECORDING_STOPPED, handleRecordingStopped)
    centralEmitter.off(RECORDING_EVENTS.RECORDING_ERROR, handleRecordingError)
  })

  // Recording durumunu izle
  watch(isRecording, (newValue) => {
    if (newValue) {
      startProgressTracking()
    } else {
      stopProgressTracking()
    }
  })

  return {
    // State
    isRecording: readonly(isRecording),
    recordingStatus: readonly(recordingStatus),
    recordingId: readonly(recordingId),
    recordingFiles: readonly(recordingFiles),
    recordingError: readonly(recordingError),
    recordingProgress: readonly(recordingProgress),
    recordingDuration: readonly(recordingDuration),
    recordingConfig,
    
    // Computed
    canStartRecording,
    canStopRecording,
    recordingTime,
    recordingStatusText,
    hasRecordingFiles,
    
    // Methods
    startRecording,
    stopRecording,
    getRecordingStatus,
    listRecordingFiles,
    downloadRecordingFile,
    resetRecording
  }
} 