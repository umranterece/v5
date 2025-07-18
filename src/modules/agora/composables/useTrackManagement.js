import { ref } from 'vue'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { 
  registerClient,
  unregisterClient,
  cleanupCentralEvents
} from '../utils/index.js'
import { VIDEO_CONFIG, AUDIO_CONFIG, SCREEN_SHARE_CONFIG, AGORA_CONFIG } from '../constants.js'
import { logger, LOG_CATEGORIES } from '../services/logger.js'
import { useStreamQuality } from './useStreamQuality.js'

/**
 * Track Yönetimi Composable - Ses, video ve ekran paylaşımı track'lerini oluşturur ve yönetir
 * Bu composable, Agora track'lerinin oluşturulması, doğrulanması ve temizlenmesi işlemlerini yönetir.
 * Farklı cihazlar ve tarayıcılar için fallback mekanizmaları içerir.
 * @module composables/useTrackManagement
 */
export function useTrackManagement() {
  // Logger fonksiyonları - Direkt service'den al
  const logVideo = (message, data) => logger.info(LOG_CATEGORIES.VIDEO, message, data)
  const logError = (error, context) => logger.error(LOG_CATEGORIES.AGORA, error.message || error, { error, ...context })
  const logWarn = (message, data) => logger.warn(LOG_CATEGORIES.AGORA, message, data)
  
  // Stream quality monitoring
  const { startMonitoring: startQualityMonitoring, stopMonitoring: stopQualityMonitoring } = useStreamQuality()

  /**
   * Track'in geçerli ve etkin olup olmadığını kontrol eder
   * @param {Object} track - Kontrol edilecek track
   * @returns {boolean} Track geçerli mi?
   */
  const isTrackValid = (track) => {
    if (!track) {
      logVideo('Track null veya tanımsız')
      return false
    }
    
    // Temel kontroller
    const hasSetEnabled = typeof track.setEnabled === 'function'
    const hasPlay = typeof track.play === 'function'
    const isNotClosed = !track._closed
    const hasValidReadyState = track.readyState !== 'ended' && track.readyState !== 'failed'
    
    // Detaylı log
    logVideo('Track doğrulama detayları', {
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
    
    logVideo('Track doğrulama sonucu', { isValid, trackId: track.id })
    
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
      logVideo('Video track\'i oluşturuluyor (varsayılan konfigürasyon)')
      let videoTrack = await AgoraRTC.createCameraVideoTrack(VIDEO_CONFIG)
      
      if (isTrackValid(videoTrack)) {
        logVideo('Video track\'i başarıyla oluşturuldu (varsayılan konfigürasyon)', {
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
        logVideo('Kamera izni reddedildi', { error: error.message })
        return { success: false, error: new Error('Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini verin.') }
      }
      
      // Cihaz bulunamadı hatası
      if (error.name === 'NotFoundError') {
        logVideo('Kamera cihazı bulunamadı', { error: error.message })
        return { success: false, error: new Error('Kamera cihazı bulunamadı. Lütfen kameranızın bağlı olduğundan emin olun.') }
      }
      
      try {
        logVideo('Fallback konfigürasyon deneniyor (basit ayarlar)')
        // Fallback konfigürasyon - Daha basit ayarlarla tekrar dene
        videoTrack = await AgoraRTC.createCameraVideoTrack({
          facingMode: 'user', // Ön kamerayı kullan
          width: 640,
          height: 480,
          frameRate: 15
        })
        
        if (isTrackValid(videoTrack)) {
          logVideo('Video track\'i başarıyla oluşturuldu (fallback konfigürasyon)', {
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
      logVideo('Kullanıcıdan ekran seçmesi isteniyor (performans optimize edilmiş)')
      
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
            logVideo('Ekran track encoder konfigürasyonu optimize edildi')
          } catch (configError) {
            logWarn('Encoder konfigürasyonu ayarlanamadı:', configError)
          }
        }
        
        // Track event'lerini hemen dinlemeye başla
        screenTrack.on('track-ended', () => {
          logVideo('Ekran track\'i tarayıcı tarafından sonlandırıldı')
        })
        
        logVideo('Ekran track\'i başarıyla oluşturuldu ve optimize edildi')
        return { success: true, track: screenTrack }
      } else {
        throw new Error('Geçersiz ekran track\'i oluşturuldu')
      }
    } catch (error) {
      logWarn('Ekran track\'i oluşturma hatası', error)
      
      // Kullanıcı vazgeçti mi kontrol et
      if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
        logVideo('Kullanıcı ekran seçimini iptal etti veya izin reddetti')
        return { success: false, error: new Error('Kullanıcı ekran seçimini iptal etti') }
      }
      
      if (error.name === 'NotSupportedError') {
        logVideo('Bu tarayıcıda ekran paylaşımı desteklenmiyor')
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
              logVideo('Ekran track fallback encoder konfigürasyonu optimize edildi')
            } catch (configError) {
              logWarn('Fallback encoder konfigürasyonu ayarlanamadı:', configError)
            }
          }
          
          logVideo('Ekran track\'i düşük kalite ile başarıyla oluşturuldu')
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
      logVideo('Network quality monitoring başlatıldı: video')
      
      // Client'ı merkezi sisteme kaydet
      registerClient(client, 'video')
      
      logVideo('Video client başarıyla oluşturuldu ve kaydedildi')
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
      
      // Client'ı merkezi sisteme kaydet
      registerClient(client, 'screen')
      
      logVideo('Ekran paylaşımı client\'ı başarıyla oluşturuldu ve kaydedildi')
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