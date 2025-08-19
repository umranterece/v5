import { ref } from 'vue'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { 
  registerClient,
  unregisterClient,
  cleanupCentralEvents
} from '../utils/index.js'
import { VIDEO_CONFIG, AUDIO_CONFIG, SCREEN_SHARE_CONFIG, AGORA_CONFIG } from '../constants.js'
import { fileLogger, LOG_CATEGORIES } from '../services/fileLogger.js'
import { useStreamQuality } from './useStreamQuality.js'

/**
 * Track Yönetimi Composable - Ses, video ve ekran paylaşımı track'lerini oluşturur ve yönetir
 * Bu composable, Agora track'lerinin oluşturulması, doğrulanması ve temizlenmesi işlemlerini yönetir.
 * Farklı cihazlar ve tarayıcılar için fallback mekanizmaları içerir.
 * @module composables/useTrackManagement
 */
export function useTrackManagement() {
  // Logger fonksiyonları - FileLogger'dan al (tüm seviyeler için)
  const logDebug = (message, data) => fileLogger.log('debug', LOG_CATEGORIES.VIDEO, message, data)
  const logInfo = (message, data) => fileLogger.log('info', LOG_CATEGORIES.VIDEO, message, data)
  const logWarn = (message, data) => fileLogger.log('warn', LOG_CATEGORIES.VIDEO, message, data)
  const logError = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('error', LOG_CATEGORIES.VIDEO, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('error', LOG_CATEGORIES.VIDEO, errorOrMessage, context)
  }
  const logFatal = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('fatal', LOG_CATEGORIES.VIDEO, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('fatal', LOG_CATEGORIES.VIDEO, errorOrMessage, context)
  }
  
  // Stream quality monitoring
  const { startMonitoring: startQualityMonitoring, stopMonitoring: stopQualityMonitoring } = useStreamQuality()

  /**
   * Track'in geçerli ve etkin olup olmadığını kontrol eder
   * @param {Object} track - Kontrol edilecek track
   * @returns {boolean} Track geçerli mi?
   */
  const isTrackValid = (track) => {
    if (!track) {
      logInfo('Track null veya tanımsız')
      return false
    }
    
    // Temel kontroller
    const hasSetEnabled = typeof track.setEnabled === 'function'
    const hasPlay = typeof track.play === 'function'
    const isNotClosed = !track._closed
    const hasValidReadyState = track.readyState !== 'ended' && track.readyState !== 'failed'
    
    // Detaylı log
    logInfo('Track doğrulama detayları', {
      trackId: track.id,
      trackType: track.trackMediaType,
      hasSetEnabled,
      hasPlay,
      isNotClosed,
      hasValidReadyState,
      readyState: track.readyState,
      enabled: track.enabled,
      _closed: track._closed
    })
    
    // Daha esnek kontrol - setEnabled opsiyonel, play zorunlu
    const isValid = hasPlay && isNotClosed && hasValidReadyState
    
    logInfo('Track doğrulama sonucu', { isValid, trackId: track.id })
    
    return isValid
  }

  /**
   * Ses track'i oluşturur
   * Mikrofon erişimi alır ve ses track'i oluşturur
   * @returns {Promise<Object>} Oluşturulan ses track'i
   */
  const createAudioTrack = async () => {
    try {
      let audioTrack = await AgoraRTC.createMicrophoneAudioTrack(AUDIO_CONFIG)
      
      if (isTrackValid(audioTrack)) {
        return { success: true, track: audioTrack }
      } else {
        throw new Error('Geçersiz ses track\'i')
      }
    } catch (error) {
      logError(error, { context: 'createAudioTrack', stage: 'default_config' })
      try {
        // Fallback konfigürasyon - Daha basit ayarlarla tekrar dene
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: 'music_standard',
          gain: 1.0
        })
        
        if (isTrackValid(audioTrack)) {
          return { success: true, track: audioTrack }
        } else {
          throw new Error('Geçersiz ses track\'i')
        }
      } catch (fallbackError) {
        return { success: false, error: fallbackError }
      }
    }
  }

  /**
   * Video track'i oluşturur
   * Kamera erişimi alır ve video track'i oluşturur
   * @returns {Promise<Object>} Oluşturulan video track'i
   */
  const createVideoTrack = async () => {
    try {
      logInfo('Video track\'i oluşturuluyor (varsayılan konfigürasyon)')
      let videoTrack = await AgoraRTC.createCameraVideoTrack(VIDEO_CONFIG)
      
      if (isTrackValid(videoTrack)) {
        logInfo('Video track\'i başarıyla oluşturuldu (varsayılan konfigürasyon)', {
          trackId: videoTrack.id,
          trackEnabled: videoTrack.enabled,
          trackReadyState: videoTrack.readyState
        })
        return { success: true, track: videoTrack }
      } else {
        throw new Error('Geçersiz video track\'i')
      }
    } catch (error) {
      logError(error, { context: 'createVideoTrack', stage: 'default_config' })
      
      // İzin hatası kontrolü
      if (error.name === 'NotAllowedError') {
        logInfo('Kamera izni reddedildi', { error: error.message })
        return { success: false, error: new Error('Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini verin.') }
      }
      
      // Cihaz bulunamadı hatası
      if (error.name === 'NotFoundError') {
        logInfo('Kamera cihazı bulunamadı', { error: error.message })
        return { success: false, error: new Error('Kamera cihazı bulunamadı. Lütfen kameranızın bağlı olduğundan emin olun.') }
      }
      
      try {
        logInfo('Fallback konfigürasyon deneniyor (basit ayarlar)')
        // Fallback konfigürasyon - Daha basit ayarlarla tekrar dene
        videoTrack = await AgoraRTC.createCameraVideoTrack({
          facingMode: 'user', // Ön kamerayı kullan
          width: 640,
          height: 480,
          frameRate: 15
        })
        
        if (isTrackValid(videoTrack)) {
          logInfo('Video track\'i başarıyla oluşturuldu (fallback konfigürasyon)', {
            trackId: videoTrack.id,
            trackEnabled: videoTrack.enabled,
            trackReadyState: videoTrack.readyState
          })
          return { success: true, track: videoTrack }
        } else {
          throw new Error('Geçersiz video track\'i (fallback)')
        }
      } catch (fallbackError) {
        logError(fallbackError, { context: 'createVideoTrack', stage: 'fallback' })
        return { success: false, error: fallbackError }
      }
    }
  }

  /**
   * Ekran paylaşımı track'i oluşturur
   * Kullanıcıdan ekran seçmesini ister ve ekran track'i oluşturur
   * @returns {Promise<Object>} Oluşturulan ekran track'i
   */
  const createScreenTrack = async () => {
    try {
      logInfo('Kullanıcıdan ekran seçmesi isteniyor (performans optimize edilmiş)')
      
      // PERFORMANS OPTİMİZASYONU: Hızlı başlatma için optimize edilmiş konfigürasyon
      const screenTrack = await AgoraRTC.createScreenVideoTrack(SCREEN_SHARE_CONFIG.FAST_START)
      
      if (isTrackValid(screenTrack)) {
        // PERFORMANS OPTİMİZASYONU: Track'i hemen etkinleştir ve optimize et
        screenTrack.setEnabled(true)
        
        // PERFORMANS OPTİMİZASYONU: Track kalitesini dinamik olarak ayarla
        if (screenTrack.setEncoderConfiguration) {
          try {
            screenTrack.setEncoderConfiguration({
              bitrateMin: 600,  // Daha düşük minimum bitrate
              bitrateMax: 1200, // Daha düşük maksimum bitrate
              frameRate: 12     // Daha düşük frame rate
            })
            logInfo('Ekran track encoder konfigürasyonu optimize edildi')
          } catch (configError) {
            logWarn('Encoder konfigürasyonu ayarlanamadı:', configError)
          }
        }
        
        // Track event'lerini hemen dinlemeye başla
        screenTrack.on('track-ended', () => {
          logInfo('Ekran track\'i tarayıcı tarafından sonlandırıldı')
        })
        
        logInfo('Ekran track\'i başarıyla oluşturuldu ve optimize edildi')
        return { success: true, track: screenTrack }
      } else {
        throw new Error('Geçersiz ekran track\'i oluşturuldu')
      }
    } catch (error) {
      logWarn('Ekran track\'i oluşturma hatası', error)
      
      // Kullanıcı vazgeçti mi kontrol et
      if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
        logInfo('Kullanıcı ekran seçimini iptal etti veya izin reddetti')
        return { success: false, error: new Error('Kullanıcı ekran seçimini iptal etti') }
      }
      
      if (error.name === 'NotSupportedError') {
        logInfo('Bu tarayıcıda ekran paylaşımı desteklenmiyor')
        return { success: false, error: new Error('Bu tarayıcıda ekran paylaşımı desteklenmiyor') }
      }
      
      logWarn('Hızlı başlatma konfigürasyonu başarısız, düşük kalite deneniyor', error)
      try {
        // PERFORMANS OPTİMİZASYONU: Fallback konfigürasyon - Çok düşük kalite
        const screenTrack = await AgoraRTC.createScreenVideoTrack(SCREEN_SHARE_CONFIG.LOW_QUALITY)
        
        if (isTrackValid(screenTrack)) {
          screenTrack.setEnabled(true)
          
          // PERFORMANS OPTİMİZASYONU: Fallback için daha da düşük kalite
          if (screenTrack.setEncoderConfiguration) {
            try {
              screenTrack.setEncoderConfiguration({
                bitrateMin: 300,  // Çok düşük minimum bitrate
                bitrateMax: 600,  // Çok düşük maksimum bitrate
                frameRate: 8      // Çok düşük frame rate
              })
              logInfo('Ekran track fallback encoder konfigürasyonu optimize edildi')
            } catch (configError) {
              logWarn('Fallback encoder konfigürasyonu ayarlanamadı:', configError)
            }
          }
          
          logInfo('Ekran track\'i düşük kalite ile başarıyla oluşturuldu')
          return { success: true, track: screenTrack }
        } else {
          throw new Error('Geçersiz ekran track\'i oluşturuldu (fallback)')
        }
      } catch (fallbackError) {
        logError(fallbackError, { context: 'createScreenTrack', stage: 'fallback' })
        return { success: false, error: fallbackError }
      }
    }
  }

  /**
   * Track'i durdurur ve temizler
   * Track'i güvenli bir şekilde kapatır ve kaynakları serbest bırakır
   * @param {Object} track - Temizlenecek track
   */
  const cleanupTrack = (track) => {
    if (track && isTrackValid(track)) {
      try {
        track.stop() // Track'i durdur
        track.close() // Track'i kapat
      } catch (error) {
        logWarn('Track temizlenirken hata oluştu', error)
      }
    }
  }

  /**
   * Video client'ı oluşturur
   * Video konferans için Agora client'ı oluşturur
   * @returns {Object} Oluşturulan client
   */
  const createVideoClient = () => {
    try {
      const client = AgoraRTC.createClient(AGORA_CONFIG)
      
      // Network quality monitoring'i başlat
      startQualityMonitoring(client)
      logInfo('Network quality monitoring başlatıldı: video')
      
      // Client'ı merkezi sisteme kaydet
      registerClient(client, 'video')
      
      logInfo('Video client başarıyla oluşturuldu ve kaydedildi')
      return { success: true, client }
    } catch (error) {
      logError(error, { context: 'createVideoClient' })
      return { success: false, error }
    }
  }

  /**
   * Ekran paylaşımı client'ı oluşturur
   * Ekran paylaşımı için Agora client'ı oluşturur
   * @returns {Object} Oluşturulan client
   */
  const createScreenClient = () => {
    try {
      const client = AgoraRTC.createClient(AGORA_CONFIG)
      
      // Client'ı merkezi sisteme kaydet (event handler olmadan)
      registerClient(client, 'screen')
      
      logInfo('Ekran paylaşımı client\'ı başarıyla oluşturuldu ve kaydedildi')
      return { success: true, client }
    } catch (error) {
      logError(error, { context: 'createScreenClient' })
      return { success: false, error }  
    }
  }

  return {
    // Client yönetimi
    registerClient,
    unregisterClient,
    cleanupCentralEvents,
    
    // Client oluşturma
    createVideoClient,
    createScreenClient,
    
    // Track yönetimi
    isTrackValid,
    createAudioTrack,
    createVideoTrack,
    createScreenTrack,
    cleanupTrack
  }
} 