import { ref } from 'vue'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { VIDEO_CONFIG, AUDIO_CONFIG, SCREEN_SHARE_CONFIG } from '../constants.js'

/**
 * Track Yönetimi Composable - Ses, video ve ekran paylaşımı track'lerini oluşturur ve yönetir
 * Bu composable, Agora track'lerinin oluşturulması, doğrulanması ve temizlenmesi işlemlerini yönetir.
 * Farklı cihazlar ve tarayıcılar için fallback mekanizmaları içerir.
 * @module composables/useTrackManagement
 */
export function useTrackManagement() {
  /**
   * Track'in geçerli ve etkin olup olmadığını kontrol eder
   * @param {Object} track - Kontrol edilecek track
   * @returns {boolean} Track geçerli mi?
   */
  const isTrackValid = (track) => {
    return track && 
           typeof track.setEnabled === 'function' && 
           typeof track.play === 'function' &&
           !track._closed &&
           track.readyState !== 'ended' &&
           track.readyState !== 'failed'
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
      console.warn('Varsayılan ses konfigürasyonu başarısız, temel konfigürasyon deneniyor:', error)
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
      let videoTrack = await AgoraRTC.createCameraVideoTrack(VIDEO_CONFIG)
      
      if (isTrackValid(videoTrack)) {
        return { success: true, track: videoTrack }
      } else {
        throw new Error('Geçersiz video track\'i')
      }
    } catch (error) {
      console.warn('Varsayılan konfigürasyon başarısız, temel konfigürasyon deneniyor:', error)
      try {
        // Fallback konfigürasyon - Daha basit ayarlarla tekrar dene
        videoTrack = await AgoraRTC.createCameraVideoTrack({
          facingMode: 'user' // Ön kamerayı kullan
        })
        
        if (isTrackValid(videoTrack)) {
          return { success: true, track: videoTrack }
        } else {
          throw new Error('Geçersiz video track\'i')
        }
      } catch (fallbackError) {
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
      console.log('Kullanıcıdan ekran seçimi isteniyor...')
      
      // Hızlı başlatma için optimize edilmiş konfigürasyon
      const screenTrack = await AgoraRTC.createScreenVideoTrack(SCREEN_SHARE_CONFIG.FAST_START)
      
      if (isTrackValid(screenTrack)) {
        // Track hazır olduğunda hemen etkinleştir
        screenTrack.setEnabled(true)
        console.log('Ekran track\'i başarıyla oluşturuldu ve etkinleştirildi')
        return { success: true, track: screenTrack }
      } else {
        throw new Error('Geçersiz ekran track\'i oluşturuldu')
      }
    } catch (error) {
      console.warn('Ekran track oluşturma hatası:', error)
      
      // Kullanıcı vazgeçti mi kontrol et
      if (error.name === 'NotAllowedError' || error.message.includes('Permission denied')) {
        console.log('Kullanıcı ekran seçimini iptal etti veya izin vermedi')
        return { success: false, error: new Error('Kullanıcı ekran seçimini iptal etti') }
      }
      
      if (error.name === 'NotSupportedError') {
        console.log('Bu tarayıcıda ekran paylaşımı desteklenmiyor')
        return { success: false, error: new Error('Bu tarayıcıda ekran paylaşımı desteklenmiyor') }
      }
      
      console.warn('Hızlı başlatma konfigürasyonu başarısız, düşük kalite deneniyor:', error)
      try {
        // Fallback konfigürasyon - Düşük kalite
        const screenTrack = await AgoraRTC.createScreenVideoTrack(SCREEN_SHARE_CONFIG.LOW_QUALITY)
        
        if (isTrackValid(screenTrack)) {
          screenTrack.setEnabled(true)
          console.log('Ekran track\'i düşük kalite ile başarıyla oluşturuldu')
          return { success: true, track: screenTrack }
        } else {
          throw new Error('Geçersiz ekran track\'i oluşturuldu (fallback)')
        }
      } catch (fallbackError) {
        console.error('Fallback ekran track oluşturma da başarısız:', fallbackError)
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
        console.warn('Track temizlenirken hata oluştu:', error)
      }
    }
  }

  return {
    isTrackValid,
    createAudioTrack,
    createVideoTrack,
    createScreenTrack,
    cleanupTrack
  }
} 