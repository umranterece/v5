/**
 * Recording Composable
 * Composite recording işlemlerini yönetir
 * Azure Storage ve Custom Server desteği
 */

import { ref, computed, watch, onUnmounted, readonly } from 'vue'
import { recordingService, fileLogger } from '../services/index.js'
import { centralEmitter } from '../utils/index.js'
import { RECORDING_EVENTS, RECORDING_CONFIG } from '../constants.js'

export function useRecording() {
  // Logger fonksiyonları - FileLogger'dan al
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

  // Reactive state
  const isRecording = ref(false)
  const recordingStatus = ref('IDLE')
  const recordingId = ref(null)
  const recordingFiles = ref([])
  const recordingError = ref(null)
  const recordingProgress = ref(0)
  const recordingDuration = ref(0)
  const recordingStartTime = ref(null)
  
  // Storage provider ve recording ayarları
  const storageProvider = ref(RECORDING_CONFIG.STORAGE_PROVIDER)
  const recordingPerspective = ref(RECORDING_CONFIG.DEFAULT_PERSPECTIVE)
  const recordingQuality = ref(RECORDING_CONFIG.DEFAULT_QUALITY)
  
  // Recording konfigürasyonu
  const recordingConfig = ref({
    ...RECORDING_CONFIG.COMPOSITE,
    perspective: recordingPerspective.value,
    quality: recordingQuality.value,
    storageProvider: storageProvider.value
  })

  // Storage provider ve recording ayarlarını değiştir
  const setStorageProvider = (provider) => {
    if (recordingService.setStorageProvider(provider)) {
      storageProvider.value = provider
      recordingConfig.value.storageProvider = provider
      logInfo(`Storage provider değiştirildi: ${provider}`)
    }
  }

  const setRecordingPerspective = (perspective) => {
    if (recordingService.setRecordingPerspective(perspective)) {
      recordingPerspective.value = perspective
      recordingConfig.value.perspective = perspective
      logInfo(`Recording perspective değiştirildi: ${perspective}`)
    }
  }

  const setRecordingQuality = (quality) => {
    if (recordingService.setRecordingQuality(quality)) {
      recordingQuality.value = quality
      recordingConfig.value.quality = quality
      logInfo(`Recording quality değiştirildi: ${quality}`)
    }
  }

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
      logInfo('Recording başlatma isteği gönderildi')
      
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
        logInfo(`Recording başlatıldı: ${result.recordingId}`)
        return result
      } else {
        throw new Error(result.error || 'Recording başlatılamadı')
      }
      
    } catch (error) {
      recordingError.value = error.message
      recordingStatus.value = 'ERROR'
      
      logError(`Recording başlatma hatası: ${error.message || error}`)
      
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
      logInfo('Recording durdurma isteği gönderildi')
      
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
        
        logInfo(`Recording durduruldu. Dosyalar: ${result.files?.length || 0}`)
        return result
      } else {
        throw new Error(result.error || 'Recording durdurulamadı')
      }
      
    } catch (error) {
      recordingError.value = error.message
      
      logError(`Recording durdurma hatası: ${error.message || error}`)
      
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
      logError(`Recording durum sorgulama hatası: ${error.message || error}`)
      throw error
    }
  }

  const listRecordingFiles = async () => {
    try {
      const files = await recordingService.listRecordingFiles()
      recordingFiles.value = files
      return files
    } catch (error) {
      logError(`Recording dosya listesi hatası: ${error.message || error}`)
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
        
        logInfo(`Dosya indirildi: ${result.fileName}`)
        return result
      } else {
        throw new Error(result.error || 'Dosya indirilemedi')
      }
      
    } catch (error) {
      logError(`Recording dosya indirme hatası: ${error.message || error}`)
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
    
          logInfo('Recording durumu sıfırlandı')
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
            logInfo('Recording başladı eventi alındı')
    startProgressTracking()
  }

  const handleRecordingStopped = (data) => {
            logInfo('Recording durdu eventi alındı')
    stopProgressTracking()
  }

  const handleRecordingError = (data) => {
            logError(`Recording hatası eventi alındı: ${data.error}`)
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
    
    // Storage provider ve recording ayarları
    storageProvider: readonly(storageProvider),
    recordingPerspective: readonly(recordingPerspective),
    recordingQuality: readonly(recordingQuality),
    
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
    resetRecording,
    
    // Storage provider ve recording ayarları
    setStorageProvider,
    setRecordingPerspective,
    setRecordingQuality
  }
} 