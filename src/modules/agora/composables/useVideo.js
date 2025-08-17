import { ref, onUnmounted } from 'vue'
import { USER_ID_RANGES, CHANNEL_NAMES, getUserDisplayName, getRemoteUserDisplayName, isScreenShareUser, DEV_CONFIG, AGORA_EVENTS } from '../constants.js'
import { useLayoutStore } from '../store/layout.js'
import { useTrackManagement } from './useTrackManagement.js'
import { centralEmitter } from '../utils/centralEmitter.js'
import { logger, LOG_CATEGORIES } from '../services/logger.js'
import { createSafeTimeout as createSafeTimeoutFromUtils } from '../utils/index.js'

/**
 * Video/Ses Composable - Video client işlemlerini yönetir
 * Bu composable, Agora video client'ının başlatılması, kanala katılma, track yönetimi
 * ve uzak kullanıcılarla iletişim işlemlerini yönetir.
 * @module composables/useVideo
 */
export function useVideo(agoraStore) {
  // Logger fonksiyonları - Direkt service'den al
  const logVideo = (message, data) => logger.info(LOG_CATEGORIES.VIDEO, message, data)
  const logVideoError = (error, context) => logger.error(LOG_CATEGORIES.VIDEO, error.message || error, { error, ...context })
  const logError = (error, context) => logger.error(LOG_CATEGORIES.AGORA, error.message || error, { error, ...context })
  const logWarn = (message, data) => logger.warn(LOG_CATEGORIES.AGORA, message, data)
  const trackPerformance = (name, fn) => logger.trackPerformance(name, fn)
  const trackUserAction = (action, details) => logger.trackUserAction(action, details)
  const client = ref(null) // Agora client referansı
  
  const isJoining = ref(false) // Kanala katılma durumu
  const isLeaving = ref(false) // Kanaldan ayrılma durumu
  
  // Track yönetimi - Uzak kullanıcıların track'lerini saklar
  const remoteAudioTracks = ref(new Map()) // Uzak ses track'leri
  const remoteVideoTracks = ref(new Map()) // Uzak video track'leri
  
  // Bekleyen abonelikler - Track'ler henüz hazır olmadığında bekletilir
  const pendingSubscriptions = ref(new Map())
  
  // Kamera toggle için debounce - Hızlı tıklamaları önler
  let cameraToggleTimeout = null
  let isCameraToggling = false
  
  // Memory leak önleme - Tüm timeout'ları ve interval'ları takip et
  const activeTimeouts = ref(new Set())
  const activeIntervals = ref(new Set())
  
  // Güvenli timeout oluşturma helper'ı - utils'den import edildi
  const createSafeTimeout = (callback, delay) => {
    return createSafeTimeoutFromUtils(callback, delay, activeTimeouts.value)
  }

  // Track yönetimi composable'ı
  const { 
    isTrackValid, 
    createAudioTrack, 
    createVideoTrack, 
    cleanupTrack,
    createVideoClient,
    registerClient,
    unregisterClient,
    cleanupCentralEvents
  } = useTrackManagement()

  /**
   * Video için UID oluşturur
   * @returns {number} Video için benzersiz UID
   */
  const generateVideoUID = () => {
    return Math.floor(Math.random() * (USER_ID_RANGES.VIDEO.MAX - USER_ID_RANGES.VIDEO.MIN)) + USER_ID_RANGES.VIDEO.MIN
  }

  /**
   * Video client'ını başlatır
   * @param {string} appId - Agora uygulama ID'si
   */
  const initializeClient = async (appId) => {
    try {
      logVideo('Video client başlatılıyor', { appId })
      
      const { success, client: agoraClient, error } = createVideoClient()
      if (!success) {
        throw error
      }
      
      client.value = agoraClient
      agoraStore.setClient('video', agoraClient)
      
      // Event listener'ları doğrudan kur
      logVideo('Event listener\'lar doğrudan kuruluyor')
      setupEventListeners(agoraClient)
      
      // Merkezi event sistemine sadece tracking için kaydet (event listener kurma)
      logVideo('Client sadece merkezi takip için kaydediliyor')
      registerClient(agoraClient, 'video', null) // eventHandler = null
      
      agoraStore.setClientInitialized('video', true)
      logVideo('Video client başarıyla başlatıldı')
    } catch (error) {
      logVideoError(error, { context: 'initializeClient', appId })
      throw error
    }
  }

  /**
   * Video kanalına katılır
   * @param {Object} params - Katılma parametreleri
   * @param {string} params.token - Agora token'ı
   * @param {string} params.channelName - Kanal adı
   * @param {number} params.uid - Kullanıcı ID'si
   * @param {string} params.userName - Kullanıcı adı
   * @param {string} params.appId - Agora uygulama ID'si
   */
  const joinChannel = async ({ token, channelName, uid, userName = 'User', appId }) => {
    if (isJoining.value) return

    try {
      isJoining.value = true
      logVideo('Video kanalına katılınıyor', { channelName, uid, userName, appId })
      
      if (!client.value) {
        await initializeClient(appId)
      }

      // Önceki durumu temizle
      remoteAudioTracks.value.clear()
      remoteVideoTracks.value.clear()
      pendingSubscriptions.value.clear()

      // Yerel kullanıcıyı ayarla
      const localUser = {
        uid,
        name: getUserDisplayName(uid, userName),
        isLocal: true,
        hasVideo: false,
        hasAudio: false,
        isMuted: false,
        isVideoOff: false,
        isScreenShare: false
      }
      agoraStore.setLocalUser('video', localUser)
      logVideo('Yerel kullanıcı store\'a ayarlandı', { localUser })

      // Video kanalına katıl
      const videoChannelName = CHANNEL_NAMES.VIDEO(channelName)
      logVideo('Kanal adıyla katılınıyor', { originalChannelName: channelName, videoChannelName, uid })
      await client.value.join(appId, videoChannelName, token, uid)
      logVideo('Video kanalına başarıyla katılınıyor', { videoChannelName, uid })
      
      // Client durumunu kontrol et
      logVideo('Katılım sonrası client durumu', { 
        connectionState: client.value.connectionState,
        remoteUsersCount: client.value.remoteUsers?.length || 0,
        remoteUsers: client.value.remoteUsers?.map(u => ({ uid: u.uid, hasAudio: !!u.audioTrack, hasVideo: !!u.videoTrack })) || []
      })
      
      // Yerel track'leri oluştur ve yayınla
      await createLocalTracks()
      
      // Track'lerin yayınlandığını kontrol et
      logVideo('Oluşturma sonrası yayınlanan track\'ler kontrol ediliyor', {
        audioTrack: !!agoraStore.tracks.local.video.audio,
        videoTrack: !!agoraStore.tracks.local.video.video,
        audioTrackId: agoraStore.tracks.local.video.audio?.id,
        videoTrackId: agoraStore.tracks.local.video.video?.id
      })
      
      // Final client durumunu kontrol et
      logVideo('Katılım ve track oluşturma sonrası final client durumu', {
        connectionState: client.value.connectionState,
        remoteUsersCount: client.value.remoteUsers?.length || 0,
        remoteUsers: client.value.remoteUsers?.map(u => ({ 
          uid: u.uid, 
          hasAudio: !!u.audioTrack, 
          hasVideo: !!u.videoTrack,
          audioTrackId: u.audioTrack?.id,
          videoTrackId: u.videoTrack?.id
        })) || [],
        localTracks: {
          audio: !!agoraStore.tracks.local.video.audio,
          video: !!agoraStore.tracks.local.video.video
        }
      })
      
      agoraStore.setClientConnected('video', true)
      isJoining.value = false
      
      // Bekleyen abonelik kontrolünü başlat
      startPendingCheck()
      
      logVideo('Video kanalı katılımı tamamlandı', { channelName, uid })
      return { success: true }
      
    } catch (error) {
      isJoining.value = false
      logVideoError(error, { channelName, uid, userName })
      throw error
    }
  }

  /**
   * Video kanalından ayrılır
   * Tüm track'leri temizler ve client'ı sıfırlar
   */
  const leaveChannel = async () => {
    if (!client.value) return

    try {
      isLeaving.value = true
      
      // Yerel track'leri durdur
      if (agoraStore.tracks.local.video.audio) {
        cleanupTrack(agoraStore.tracks.local.video.audio)
      }
      if (agoraStore.tracks.local.video.video) {
        cleanupTrack(agoraStore.tracks.local.video.video)
      }

      await client.value.leave()
      agoraStore.resetClient('video')
      agoraStore.resetUsers('video')
      agoraStore.resetTracks('video')
      
      // Ekran paylaşımı state'ini sıfırla
      agoraStore.setScreenSharing(false)
      
      // Bekleyen abonelik kontrolünü durdur
      stopPendingCheck()
      
      // Durumu temizle
      remoteAudioTracks.value.clear()
      remoteVideoTracks.value.clear()
      pendingSubscriptions.value.clear()
      
    } catch (error) {
      logVideoError(error, { context: 'leaveChannel' })
    } finally {
      isLeaving.value = false
    }
  }

  /**
   * Cihaz durumlarını kontrol eder
   */
  const checkDeviceStatus = async () => {
    try {
      // Cihazları listele
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioDevices = devices.filter(d => d.kind === 'audioinput')
      const videoDevices = devices.filter(d => d.kind === 'videoinput')
      
      // İzinleri kontrol et
      let cameraPermission = 'unknown'
      let microphonePermission = 'unknown'
      
      try {
        const cameraPermissionResult = await navigator.permissions.query({ name: 'camera' })
        cameraPermission = cameraPermissionResult.state
      } catch (e) {
        logVideo('Kamera izni kontrol edilemedi, varsayılan olarak unknown', { error: e.message })
      }
      
      try {
        const microphonePermissionResult = await navigator.permissions.query({ name: 'microphone' })
        microphonePermission = microphonePermissionResult.state
      } catch (e) {
        logVideo('Mikrofon izni kontrol edilemedi, varsayılan olarak unknown', { error: e.message })
      }
      
      // Mikrofon durumunu kontrol et
      agoraStore.setDeviceStatus('microphone', {
        hasDevice: audioDevices.length > 0,
        permission: microphonePermission,
        track: null
      })
      
      // Kamera durumunu kontrol et
      agoraStore.setDeviceStatus('camera', {
        hasDevice: videoDevices.length > 0,
        permission: cameraPermission,
        track: null
      })
      
      logVideo('Cihaz durumu kontrol edildi', {
        microphone: { hasDevice: audioDevices.length > 0, count: audioDevices.length, permission: microphonePermission },
        camera: { hasDevice: videoDevices.length > 0, count: videoDevices.length, permission: cameraPermission }
      })
    } catch (error) {
      logVideoError(error, { context: 'checkDeviceStatus' })
    }
  }

  /**
   * Yerel track'leri oluşturur
   * Ses ve video track'lerini oluşturur ve yayınlar
   */
  const createLocalTracks = async () => {
    try {
      logVideo('Yerel track\'ler oluşturuluyor...')
      
      // Önce cihaz durumlarını kontrol et
      await checkDeviceStatus()
      
      // Ses track'i oluştur
      logVideo('Ses track\'i oluşturuluyor...')
      const audioResult = await createAudioTrack()
      if (audioResult.success) {
        agoraStore.setLocalTrack('video', 'audio', audioResult.track)
        agoraStore.setLocalAudioMuted(false)
        // Mikrofon durumunu güncelle
        agoraStore.setDeviceStatus('microphone', {
          hasDevice: true,
          permission: 'granted',
          track: audioResult.track
        })
        logVideo('Ses track\'i başarıyla oluşturuldu', { 
          trackId: audioResult.track.id,
          trackEnabled: audioResult.track.enabled,
          trackReadyState: audioResult.track.readyState,
          trackKind: audioResult.track.kind
        })
        centralEmitter.emit(AGORA_EVENTS.LOCAL_AUDIO_READY, { track: audioResult.track, clientType: 'video' })
      } else {
        agoraStore.setLocalTrack('video', 'audio', null)
        agoraStore.setLocalAudioMuted(true)
        // Mikrofon durumunu güncelle
        agoraStore.setDeviceStatus('microphone', {
          hasDevice: false,
          permission: audioResult.error?.name === 'NotAllowedError' ? 'denied' : 'unknown',
          track: null
        })
        logVideo('Ses track\'i oluşturulamadı', { error: audioResult.error })
      }

      // Video track'i oluştur
      logVideo('Video track\'i oluşturuluyor...')
      const videoResult = await createVideoTrack()
      if (videoResult.success) {
        agoraStore.setLocalTrack('video', 'video', videoResult.track)
        agoraStore.setLocalVideoOff(false)
        // Kamera durumunu güncelle
        agoraStore.setDeviceStatus('camera', {
          hasDevice: true,
          permission: 'granted',
          track: videoResult.track
        })
        logVideo('Video track\'i başarıyla oluşturuldu', { 
          trackId: videoResult.track.id,
          trackEnabled: videoResult.track.enabled,
          trackReadyState: videoResult.track.readyState,
          trackKind: videoResult.track.kind
        })
        centralEmitter.emit(AGORA_EVENTS.LOCAL_VIDEO_READY, { track: videoResult.track, clientType: 'video' })
      } else {
        agoraStore.setLocalTrack('video', 'video', null)
        agoraStore.setLocalVideoOff(true)
        // Kamera durumunu güncelle
        agoraStore.setDeviceStatus('camera', {
          hasDevice: false,
          permission: videoResult.error?.name === 'NotAllowedError' ? 'denied' : 'unknown',
          track: null
        })
        logVideo('Video track\'i oluşturulamadı', { error: videoResult.error })
      }

      // Track'leri yayınla
      const tracksToPublish = [];
      if (agoraStore.tracks.local.video.audio) {
        tracksToPublish.push(agoraStore.tracks.local.video.audio);
        logVideo('Ses track\'i yayınlama listesine eklendi', { 
          trackId: agoraStore.tracks.local.video.audio.id,
          trackEnabled: agoraStore.tracks.local.video.audio.enabled,
          trackReadyState: agoraStore.tracks.local.video.audio.readyState
        })
      }
      if (agoraStore.tracks.local.video.video) {
        tracksToPublish.push(agoraStore.tracks.local.video.video);
        logVideo('Video track\'i yayınlama listesine eklendi', { 
          trackId: agoraStore.tracks.local.video.video.id,
          trackEnabled: agoraStore.tracks.local.video.video.enabled,
          trackReadyState: agoraStore.tracks.local.video.video.readyState
        })
      }
      
      if (tracksToPublish.length > 0) {
        logVideo('Track\'ler kanala yayınlanıyor', { 
          trackCount: tracksToPublish.length,
          trackIds: tracksToPublish.map(t => t.id),
          clientState: client.value.connectionState,
          remoteUsersCount: client.value.remoteUsers?.length || 0
        })
        
        // Her track'i ayrı ayrı yayınla ve sonuçları kontrol et
        for (const track of tracksToPublish) {
          try {
            logVideo('Tekil track yayınlanıyor', { 
              trackId: track.id,
              trackType: track.trackMediaType || 'unknown',
              trackEnabled: track.enabled,
              trackReadyState: track.readyState,
              clientState: client.value.connectionState
            })
            
            await client.value.publish(track)
            logVideo('Track başarıyla yayınlandı', { 
              trackId: track.id, 
              trackType: track.trackMediaType || 'unknown',
              clientState: client.value.connectionState,
              trackEnabled: track.enabled,
              trackReadyState: track.readyState
            })
          } catch (publishError) {
            logVideoError(publishError, { 
              context: 'publishTrack', 
              trackId: track.id,
              trackType: track.trackMediaType || 'unknown',
              clientState: client.value.connectionState
            })
          }
        }
        
        // Yayınlama sonrası client durumunu kontrol et
        logVideo('Yayınlama sonrası client durumu', {
          connectionState: client.value.connectionState,
          remoteUsersCount: client.value.remoteUsers?.length || 0,
          remoteUsers: client.value.remoteUsers?.map(u => ({ 
            uid: u.uid, 
            hasAudio: !!u.audioTrack, 
            hasVideo: !!u.videoTrack 
          })) || []
        })
        
        logVideo('Tüm track\'lerin yayınlanması tamamlandı', { trackCount: tracksToPublish.length })
      } else {
        logVideo('Yayınlanacak track yok')
      }

    } catch (error) {
      logVideoError(error, { context: 'createLocalTracks' })
      throw error
    }
  }

  /**
   * Kamerayı açıp kapatır
   * @param {boolean} off - Kamera kapatılacak mı?
   */
  const toggleCamera = async (off) => {
    if (isCameraToggling) return
    
    if (cameraToggleTimeout) {
      clearTimeout(cameraToggleTimeout)
    }
    
    isCameraToggling = true
    trackUserAction('toggleCamera', { off, timestamp: Date.now() })
    
    try {
      if (off) {
        // Kamerayı kapat
        if (agoraStore.tracks.local.video.video && isTrackValid(agoraStore.tracks.local.video.video)) {
          await client.value.unpublish(agoraStore.tracks.local.video.video)
          cleanupTrack(agoraStore.tracks.local.video.video)
          agoraStore.setLocalTrack('video', 'video', null)
        }
        agoraStore.setLocalVideoOff(true)
      } else {
        // Kamerayı aç
        const videoResult = await createVideoTrack()
        if (videoResult.success) {
          agoraStore.setLocalTrack('video', 'video', videoResult.track)
          await client.value.publish(videoResult.track)
          agoraStore.setLocalVideoOff(false)
          // Kamera durumunu güncelle
          agoraStore.setDeviceStatus('camera', {
            hasDevice: true,
            permission: 'granted',
            track: videoResult.track
          })
          centralEmitter.emit(AGORA_EVENTS.LOCAL_VIDEO_READY, { track: videoResult.track, clientType: 'video' })
        } else {
          // Kamera durumunu güncelle
          agoraStore.setDeviceStatus('camera', {
            hasDevice: false,
            permission: videoResult.error?.name === 'NotAllowedError' ? 'denied' : 'unknown',
            track: null
          })
        }
      }
    } catch (error) {
      logVideoError(error, { context: 'toggleCamera', state: off ? 'off' : 'on' })
      throw error
    } finally {
      cameraToggleTimeout = createSafeTimeout(() => {
        isCameraToggling = false
      }, 1000)
    }
  }

  /**
   * Mikrofonu açıp kapatır
   * @param {boolean} muted - Mikrofon kapatılacak mı?
   */
  const toggleMicrophone = async (muted) => {
    try {
      trackUserAction('toggleMicrophone', { muted, timestamp: Date.now() })
      
      if (muted) {
        // Mikrofonu kapat - sadece unpublish et, track'i devre dışı bırakma
        if (agoraStore.tracks.local.video.audio && isTrackValid(agoraStore.tracks.local.video.audio)) {
          await client.value.unpublish(agoraStore.tracks.local.video.audio)
        }
        agoraStore.setLocalAudioMuted(true)
      } else {
        // Mikrofonu aç - sadece publish et
        if (agoraStore.tracks.local.video.audio && isTrackValid(agoraStore.tracks.local.video.audio)) {
          await client.value.publish(agoraStore.tracks.local.video.audio)
          agoraStore.setLocalAudioMuted(false)
          centralEmitter.emit(AGORA_EVENTS.LOCAL_AUDIO_READY, { track: agoraStore.tracks.local.video.audio, clientType: 'video' })
        } else {
          // Track yoksa yeni track oluştur
          const audioResult = await createAudioTrack()
          if (audioResult.success) {
            agoraStore.setLocalTrack('video', 'audio', audioResult.track)
            await client.value.publish(audioResult.track)
            agoraStore.setLocalAudioMuted(false)
            // Mikrofon durumunu güncelle
            agoraStore.setDeviceStatus('microphone', {
              hasDevice: true,
              permission: 'granted',
              track: audioResult.track
            })
            centralEmitter.emit(AGORA_EVENTS.LOCAL_AUDIO_READY, { track: audioResult.track, clientType: 'video' })
          } else {
            // Mikrofon durumunu güncelle
            agoraStore.setDeviceStatus('microphone', {
              hasDevice: false,
              permission: audioResult.error?.name === 'NotAllowedError' ? 'denied' : 'unknown',
              track: null
            })
          }
        }
      }
    } catch (error) {
      logVideoError(error, { context: 'toggleMicrophone', state: muted ? 'muted' : 'unmuted' })
      throw error
    }
  }

  /**
   * Bekleyen abonelikleri işler
   * @param {number} uid - Kullanıcı ID'si
   */
  const processPendingSubscriptions = async (uid, currentMediaType = null) => {
    const pending = pendingSubscriptions.value.get(uid) || []
    
    logVideo('Bekleyen abonelikler işleniyor', { uid, pending, currentMediaType })
    
    // Mevcut mediaType'ı da işle
    const allMediaTypes = currentMediaType ? [...pending, currentMediaType] : pending
    
    logVideo('İşlenecek tüm mediaType\'lar', { uid, allMediaTypes })
    
    if (allMediaTypes.length === 0) {
      logVideo('İşlenecek mediaType yok', { uid })
      return
    }
    
    for (const mediaType of allMediaTypes) {
      try {
        logVideo('Bekleyen abonelik işleniyor', { uid, mediaType })
        await subscribeToUserTrack(uid, mediaType)
      } catch (error) {
        logVideoError(error, { context: 'processPendingSubscriptions', uid, mediaType })
      }
    }
    
    pendingSubscriptions.value.delete(uid)
    logVideo('Bekleyen abonelikler tamamlandı', { uid })
  }
  
  // Bekleyen abonelikleri periyodik olarak kontrol et
  const checkPendingSubscriptions = async () => {
    for (const [uid, pending] of pendingSubscriptions.value.entries()) {
      if (pending && pending.length > 0) {
        logVideo('Periyodik kontrol: bekleyen abonelikler bulundu', { uid, pending })
        
        // Ekran paylaşımı kullanıcıları için daha agresif kontrol
        const user = agoraStore.users.remote.find(u => u.uid === uid)
        const isScreenShare = user?.isScreenShare
        
        if (isScreenShare) {
          logVideo('Ekran paylaşımı kullanıcısı için hızlı kontrol', { uid })
          // Ekran paylaşımı için hemen dene
          await processPendingSubscriptions(uid)
        } else {
          // Normal kullanıcılar için standart kontrol
          await processPendingSubscriptions(uid)
        }
      }
    }
  }
  
  // Her 500ms'de bir bekleyen abonelikleri kontrol et (daha hızlı)
  let pendingCheckInterval = null
  
  const startPendingCheck = () => {
    if (pendingCheckInterval) {
      clearInterval(pendingCheckInterval)
      activeIntervals.value.delete(pendingCheckInterval)
    }
    pendingCheckInterval = setInterval(checkPendingSubscriptions, DEV_CONFIG.PENDING_CHECK_INTERVAL)
    activeIntervals.value.add(pendingCheckInterval)
    logVideo(`Bekleyen abonelik kontrolü başlatıldı (${DEV_CONFIG.PENDING_CHECK_INTERVAL}ms)`)
  }
  
  const stopPendingCheck = () => {
    if (pendingCheckInterval) {
      clearInterval(pendingCheckInterval)
      activeIntervals.value.delete(pendingCheckInterval)
      pendingCheckInterval = null
      logVideo('Bekleyen abonelik kontrolü durduruldu')
    }
  }

  /**
   * Kullanıcının track'ine abone olur
   * @param {number} uid - Kullanıcı ID'si
   * @param {string} mediaType - Medya türü ('audio' veya 'video')
   * @param {number} retryCount - Tekrar deneme sayısı
   */
  const subscribeToUserTrack = async (uid, mediaType, retryCount = 0) => {
    try {
      logVideo('Kullanıcı track\'ine abone olunuyor', { uid, mediaType, retryCount, clientType: 'video' })
      
      if (!client.value) {
        logVideo('Abonelik için client mevcut değil', { uid, mediaType })
        return
      }
      
      // Client durumunu kontrol et
      logVideo('Abonelik öncesi client durumu', { 
        connectionState: client.value.connectionState,
        remoteUsersCount: client.value.remoteUsers?.length || 0
      })
      
      // Remote user'ı bul
      const remoteUser = client.value.remoteUsers.find(u => u.uid === uid)
      if (!remoteUser) {
        logVideo('Client\'ta uzak kullanıcı bulunamadı', { uid, mediaType, retryCount })
        if (retryCount < DEV_CONFIG.MAX_RETRY_COUNT) {
          logVideo('Abonelik tekrar deneniyor', { uid, mediaType, retryCount: retryCount + 1 })
          createSafeTimeout(() => subscribeToUserTrack(uid, mediaType, retryCount + 1), DEV_CONFIG.RETRY_DELAY)
        } else {
          // Maksimum deneme sayısına ulaşıldı, bekleyen aboneliklere ekle
          logVideo('Maksimum deneme sayısına ulaşıldı, bekleyen aboneliklere ekleniyor', { uid, mediaType })
          if (!pendingSubscriptions.value.has(uid)) {
            pendingSubscriptions.value.set(uid, [])
          }
          if (!pendingSubscriptions.value.get(uid).includes(mediaType)) {
            pendingSubscriptions.value.get(uid).push(mediaType)
          }
        }
        return
      }
      
      logVideo('Uzak kullanıcı bulundu', { 
        uid, 
        mediaType, 
        hasAudio: !!remoteUser.audioTrack, 
        hasVideo: !!remoteUser.videoTrack,
        audioTrackId: remoteUser.audioTrack?.id,
        videoTrackId: remoteUser.videoTrack?.id,
        retryCount
      })
      
      const track = await client.value.subscribe(remoteUser, mediaType)
      logVideo('Track\'e başarıyla abone olundu', { 
        uid, 
        mediaType, 
        trackId: track?.id, 
        trackType: track?.trackMediaType,
        trackExists: !!track,
        trackEnabled: track?.enabled,
        trackReadyState: track?.readyState
      })
      
      // Track'in detaylarını logla
      if (track) {
        logVideo('Abonelik sonrası track detayları', {
          uid,
          mediaType,
          trackId: track.id,
          trackType: track.trackMediaType,
          enabled: track.enabled,
          readyState: track.readyState,
          _closed: track._closed,
          hasSetEnabled: typeof track.setEnabled === 'function',
          hasPlay: typeof track.play === 'function',
          isTrackValid: isTrackValid(track)
        })
      }
      
      if (track && isTrackValid(track)) {
        if (mediaType === 'audio') {
          remoteAudioTracks.value.set(uid, track)
          agoraStore.setRemoteTrack(uid, 'audio', track)
          
          // Audio track'i otomatik olarak çal
          track.play()
          logVideo('Ses track\'i oynatılmaya başlandı', { uid, trackId: track.id })
        } else {
          remoteVideoTracks.value.set(uid, track)
          
          // Ekran paylaşımı kullanıcısı için track'i 'screen' olarak sakla
          const currentUser = agoraStore.users.remote.find(u => u.uid === uid)
          const isScreenShare = currentUser?.isScreenShare
          
          if (isScreenShare) {
            agoraStore.setRemoteTrack(uid, 'screen', track)
            logVideo('Ekran paylaşımı track\'i screen olarak saklandı', { 
              uid, 
              trackId: track.id,
              storeTrackExists: !!agoraStore.tracks.remote.get(uid)?.screen
            })
          } else {
            agoraStore.setRemoteTrack(uid, 'video', track)
            logVideo('Video track saklandı, container bekleniyor', { 
              uid, 
              trackId: track.id,
              storeTrackExists: !!agoraStore.tracks.remote.get(uid)?.video
            })
          }
        }
        
        const currentUser = agoraStore.users.remote.find(u => u.uid === uid && !u.isScreenShare)
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            [mediaType === 'audio' ? 'hasAudio' : 'hasVideo']: true,
            [mediaType === 'audio' ? 'isMuted' : 'isVideoOff']: false
          }
          agoraStore.addRemoteUser(updatedUser)
          logVideo('Track aboneliği sonrası kullanıcı store\'da güncellendi', { uid, mediaType, updates: updatedUser })
        }
        
        if (mediaType === 'audio') {
          logVideo('remote-audio-ready event emit ediliyor', { uid, trackId: track.id })
          centralEmitter.emit(AGORA_EVENTS.REMOTE_AUDIO_READY, { uid, track, clientType: 'video' })
        } else if (mediaType === 'video') {
          logVideo('remote-video-ready event emit ediliyor', { uid, trackId: track.id })
          centralEmitter.emit(AGORA_EVENTS.REMOTE_VIDEO_READY, { uid, track, clientType: 'video' })
        }
      } else {
        logVideo('Abonelik sonrası track mevcut değil', { uid, mediaType, trackValid: isTrackValid(track) })
      }
    } catch (error) {
      logVideoError(error, { context: 'subscribeToUserTrack', uid, mediaType, retryCount })
      throw error
    }
  }

  /**
   * Event listener'ları ayarlar
   * @param {Object} client - Agora client
   */
  const setupEventListeners = (client) => {
    if (!client) return

    logVideo('Video client için event listener\'lar kuruluyor', { clientType: 'video' })

    // Kullanıcı katıldı
    client.on(AGORA_EVENTS.USER_JOINED, async (user) => {
      logVideo('Kullanıcı katıldı event\'i alındı', { uid: user.uid, clientType: 'video' })
      
      if (agoraStore.isLocalUID(user.uid)) {
        logVideo('Yerel kullanıcı katıldı, göz ardı ediliyor', { uid: user.uid })
        return;
      }
      
      // UID zaten herhangi bir remote listede varsa ekleme
      if (agoraStore.users.remote.some(u => u.uid === user.uid)) {
        logVideo('Uzak kullanıcı zaten mevcut, tekrar eklenmiyor', { uid: user.uid })
        return;
      }
      
      // UID'ye göre kullanıcı tipini belirle
      const isScreenShare = isScreenShareUser(user.uid)
      const userName = isScreenShare ? 'Ekran Paylaşımı' : 'User'
      
      const remoteUser = {
        uid: user.uid,
        name: getRemoteUserDisplayName(user.uid, userName),
        isLocal: false,
        hasVideo: false,
        hasAudio: false,
        isMuted: false,
        isVideoOff: false,
        isScreenShare: isScreenShare
      }
      
      agoraStore.addRemoteUser(remoteUser)
      
      console.log('🟢 [VIDEO] Uzak kullanıcı eklendi:', {
        uid: user.uid,
        name: remoteUser.name,
        isScreenShare: remoteUser.isScreenShare,
        userName: userName
      })

      // Layout mantığı: Sadece ekran paylaşımı varsa presentation'a geç
      if (isScreenShare) {
        const layoutStore = useLayoutStore()
        const hasScreenShare = agoraStore.users.remote.some(u => u.isScreenShare) || agoraStore.isScreenSharing
        
        if (hasScreenShare && layoutStore.currentLayout !== 'presentation') {
          console.log('🟢 [VIDEO] Ekran paylaşımı var, layout presentation\'a geçiliyor:', user.uid)
          layoutStore.switchLayoutWithSave('presentation')
        }
      } else {
        // Normal kullanıcı için grid layout'a zorla (eğer ekran paylaşımı yoksa)
        const layoutStore = useLayoutStore()
        const hasScreenShare = agoraStore.users.remote.some(u => u.isScreenShare) || agoraStore.isScreenSharing
        
        if (!hasScreenShare && layoutStore.currentLayout !== 'grid') {
          console.log('🟢 [VIDEO] Normal kullanıcı katıldı, ekran paylaşımı yok, layout grid\'e zorlanıyor:', user.uid)
          layoutStore.switchLayoutWithSave('grid')
        }
      }
      
      logVideo('Uzak kullanıcı store\'a eklendi', { user: remoteUser })
      centralEmitter.emit(AGORA_EVENTS.USER_JOINED, { ...remoteUser, clientType: 'video' })
      
      // Bekleyen abonelikleri işle
      await processPendingSubscriptions(user.uid)
      
      // Eğer bekleyen abonelik varsa, biraz bekleyip tekrar dene
      const pending = pendingSubscriptions.value.get(user.uid)
      if (pending && pending.length > 0) {
        logVideo('Bekleyen abonelikler var, 1 saniye sonra tekrar deneniyor', { uid: user.uid, pending })
        createSafeTimeout(async () => {
          await processPendingSubscriptions(user.uid)
        }, 1000)
      }
    });

    // Kullanıcı ayrıldı
    client.on(AGORA_EVENTS.USER_LEFT, async (user) => {
      logVideo('Kullanıcı ayrıldı event\'i alındı', { uid: user.uid, clientType: 'video' })
      
      if (agoraStore.isLocalUID(user.uid)) {
        logVideo('Yerel kullanıcı ayrıldı, göz ardı ediliyor', { uid: user.uid })
        return
      }
      
      // Ekran paylaşımı kullanıcısı ayrıldığında layout'u kontrol et
      const currentUser = agoraStore.users.remote.find(u => u.uid === user.uid)
      if (currentUser?.isScreenShare) {
        const layoutStore = useLayoutStore()
        if (layoutStore.currentLayout === 'presentation') {
          // Eğer başka ekran paylaşımı kullanıcısı yoksa grid'e dön
          const remainingScreenUsers = agoraStore.users.remote.filter(u => u.isScreenShare)
          if (remainingScreenUsers.length === 0) {
            logVideo('Uzak ekran paylaşımı kullanıcısı ayrıldı, ekran paylaşımı yok, layout grid\'e zorlanıyor')
            layoutStore.switchLayoutWithSave('grid')
          }
        }
        
        // Ekran paylaşımı kullanıcısı için screen track'ini de temizle
        agoraStore.setRemoteTrack(user.uid, 'screen', null)
      }
      
      remoteAudioTracks.value.delete(user.uid)
      remoteVideoTracks.value.delete(user.uid)
      agoraStore.removeRemoteUser(user.uid)
      pendingSubscriptions.value.delete(user.uid)
      
      logVideo('Uzak kullanıcı store\'dan kaldırıldı', { uid: user.uid })
      centralEmitter.emit(AGORA_EVENTS.USER_LEFT, { uid: user.uid, clientType: 'video' })
    })

    // Kullanıcı yayınlandı
    client.on(AGORA_EVENTS.USER_PUBLISHED, async (user, mediaType) => {
      logVideo('Kullanıcı yayınlandı event\'i alındı', { 
        uid: user.uid, 
        mediaType, 
        clientType: 'video',
        userHasAudio: !!user.audioTrack,
        userHasVideo: !!user.videoTrack,
        clientState: client.connectionState
      })
      
      if (agoraStore.isLocalUID(user.uid)) {
        logVideo('Yerel kullanıcı yayınlandı, göz ardı ediliyor', { uid: user.uid, mediaType })
        return
      }
      
      let existingUser = agoraStore.users.remote.find(u => u.uid === user.uid && !u.isScreenShare)
      
      if (!existingUser) {
        logVideo('Kullanıcı store\'da bulunamadı, kullanıcı oluşturuluyor', { uid: user.uid, mediaType })
        
        // Kullanıcıyı oluştur ve store'a ekle
        const remoteUser = {
          uid: user.uid,
          name: getRemoteUserDisplayName(user.uid, 'User'),
          isLocal: false,
          hasVideo: false,
          hasAudio: false,
          isMuted: false,
          isVideoOff: false,
          isScreenShare: false
        }
        
        agoraStore.addRemoteUser(remoteUser)
        existingUser = remoteUser
        logVideo('Kullanıcı store\'a eklendi', { user: remoteUser })
        
        // Track'lerin hazır olup olmadığını kontrol et
        const hasTrack = mediaType === 'audio' ? !!user.audioTrack : !!user.videoTrack
        
        if (hasTrack) {
          // Track'ler hazır, hemen abone ol
          await processPendingSubscriptions(user.uid, mediaType)
        } else {
          // Track'ler henüz hazır değil, bekleyen aboneliklere ekle
          logVideo('Track henüz hazır değil, bekleyen aboneliklere ekleniyor', { uid: user.uid, mediaType })
          if (!pendingSubscriptions.value.has(user.uid)) {
            pendingSubscriptions.value.set(user.uid, [])
          }
          pendingSubscriptions.value.get(user.uid).push(mediaType)
          
          // Basit ve etkili yaklaşım: Hızlı retry
          const remoteUser = agoraStore.users.remote.find(u => u.uid === user.uid)
          if (remoteUser?.isScreenShare) {
            logVideo('Ekran paylaşımı için hızlı retry başlatılıyor', { uid: user.uid })
            
            // Layout'u presentation'a geç (eğer ekran paylaşımı varsa)
            const layoutStore = useLayoutStore()
            const hasScreenShare = agoraStore.users.remote.some(u => u.isScreenShare) || agoraStore.isScreenSharing
            if (hasScreenShare && layoutStore.currentLayout !== 'presentation') {
              logVideo('Ekran paylaşımı kullanıcısı yayınlandı, layout presentation\'a geçiliyor:', user.uid)
              layoutStore.switchLayoutWithSave('presentation')
            }
            
            // Hemen dene
            setTimeout(async () => {
              await processPendingSubscriptions(user.uid, mediaType)
            }, 0)
            
            // 100ms sonra tekrar dene
            setTimeout(async () => {
              await processPendingSubscriptions(user.uid, mediaType)
            }, 100)
            
            // 500ms sonra tekrar dene
            setTimeout(async () => {
              await processPendingSubscriptions(user.uid, mediaType)
            }, 500)
          }
        }
      } else {
        // Kullanıcı zaten mevcut, track'lerin hazır olup olmadığını kontrol et
        const hasTrack = mediaType === 'audio' ? !!user.audioTrack : !!user.videoTrack
        
        if (hasTrack) {
          try {
            logVideo('Kullanıcı track\'ine abone olunuyor', { uid: user.uid, mediaType })
            await subscribeToUserTrack(user.uid, mediaType)
          } catch (error) {
            logVideoError(error, { context: 'user-published', mediaType, uid: user.uid })
          }
        } else {
          logVideo('Track henüz hazır değil, bekleyen aboneliklere ekleniyor', { uid: user.uid, mediaType })
          if (!pendingSubscriptions.value.has(user.uid)) {
            pendingSubscriptions.value.set(user.uid, [])
          }
          pendingSubscriptions.value.get(user.uid).push(mediaType)
          
          // Basit ve etkili yaklaşım: Hızlı retry (mevcut kullanıcı)
          const remoteUser = agoraStore.users.remote.find(u => u.uid === user.uid)
          if (remoteUser?.isScreenShare) {
            logVideo('Ekran paylaşımı için hızlı retry başlatılıyor (mevcut kullanıcı)', { uid: user.uid })
            
            // Layout'u presentation'a geç (eğer ekran paylaşımı varsa)
            const layoutStore = useLayoutStore()
            const hasScreenShare = agoraStore.users.remote.some(u => u.isScreenShare) || agoraStore.isScreenSharing
            if (hasScreenShare && layoutStore.currentLayout !== 'presentation') {
              logVideo('Mevcut ekran paylaşımı kullanıcısı yayınlandı, layout presentation\'a geçiliyor:', user.uid)
              layoutStore.switchLayoutWithSave('presentation')
            }
            
            // Hemen dene
            setTimeout(async () => {
              await processPendingSubscriptions(user.uid, mediaType)
            }, 0)
            
            // 100ms sonra tekrar dene
            setTimeout(async () => {
              await processPendingSubscriptions(user.uid, mediaType)
            }, 100)
            
            // 500ms sonra tekrar dene
            setTimeout(async () => {
              await processPendingSubscriptions(user.uid, mediaType)
            }, 500)
          }
        }
      }

      const updates = {};
      if (mediaType === 'audio') updates.isMuted = false;
      if (mediaType === 'video') updates.isVideoOff = false;
      
      const currentUser = agoraStore.users.remote.find(u => u.uid === user.uid && !u.isScreenShare)
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates }
        agoraStore.addRemoteUser(updatedUser)
        logVideo('Yayınlama sonrası kullanıcı store\'da güncellendi', { uid: user.uid, updates })
      }
    })

    // Kullanıcı yayından kaldırıldı
    client.on(AGORA_EVENTS.USER_UNPUBLISHED, async (user, mediaType) => {
      logVideo('Kullanıcı yayından kaldırıldı event\'i alındı', { uid: user.uid, mediaType, clientType: 'video' })
      
      if (agoraStore.isLocalUID(user.uid)) {
        logVideo('Yerel kullanıcı yayından kaldırıldı, göz ardı ediliyor', { uid: user.uid, mediaType })
        return
      }
      
      if (mediaType === 'audio') {
        remoteAudioTracks.value.delete(user.uid)
        agoraStore.removeRemoteTrack(user.uid, 'audio')
        const currentUser = agoraStore.users.remote.find(u => u.uid === user.uid && !u.isScreenShare)
        if (currentUser) {
          const updatedUser = { ...currentUser, hasAudio: false, isMuted: true }
          agoraStore.addRemoteUser(updatedUser)
        }
      } else if (mediaType === 'video') {
        remoteVideoTracks.value.delete(user.uid)
        
        // Ekran paylaşımı kullanıcısı için screen track'ini de temizle
        const currentUser = agoraStore.users.remote.find(u => u.uid === user.uid)
        if (currentUser?.isScreenShare) {
          agoraStore.removeRemoteTrack(user.uid, 'screen')
          
          // Ekran paylaşımı kullanıcısı yayından kaldırıldığında layout'u kontrol et
          const layoutStore = useLayoutStore()
          if (layoutStore.currentLayout === 'presentation') {
            // Eğer başka ekran paylaşımı kullanıcısı yoksa grid'e dön
            const remainingScreenUsers = agoraStore.users.remote.filter(u => u.isScreenShare)
            if (remainingScreenUsers.length === 0) {
              logVideo('Uzak ekran paylaşımı kullanıcısı yayından kaldırıldı, ekran paylaşımı yok, layout grid\'e zorlanıyor')
              layoutStore.switchLayoutWithSave('grid')
            }
          }
        } else {
          agoraStore.removeRemoteTrack(user.uid, 'video')
        }
        
        if (currentUser) {
          const updatedUser = { ...currentUser, hasVideo: false, isVideoOff: true }
          agoraStore.addRemoteUser(updatedUser)
        }
        
        centralEmitter.emit(AGORA_EVENTS.REMOTE_VIDEO_UNPUBLISHED, { uid: user.uid, clientType: 'video' })
      }
      
      centralEmitter.emit(AGORA_EVENTS.USER_UNPUBLISHED, { user, mediaType, clientType: 'video' })
              logVideo('Yayından kaldırma sonrası kullanıcı store\'da güncellendi', { uid: user.uid, mediaType })
    })

    // Bağlantı durumu
    client.on(AGORA_EVENTS.CONNECTION_STATE_CHANGE, async (curState) => {
      logVideo('Bağlantı durumu değişti', { state: curState, clientType: 'video' })
      const connected = curState === 'CONNECTED'
      agoraStore.setClientConnected('video', connected)
      centralEmitter.emit(AGORA_EVENTS.CONNECTION_STATE_CHANGE, { connected, clientType: 'video' })
    })
    
    logVideo('Video client için event listener kurulumu tamamlandı')
  }

  /**
   * Tüm kaynakları temizler
   * Event listener'ları kaldırır ve client'ı sıfırlar
   */
  const cleanup = () => {
    logVideo('Video composable cleanup başlatılıyor')
    
    // Bekleyen abonelik kontrolünü durdur
    stopPendingCheck()
    
    // Tüm aktif timeout'ları temizle
    activeTimeouts.value.forEach(timeoutId => {
      clearTimeout(timeoutId)
    })
    activeTimeouts.value.clear()
    
    // Tüm aktif interval'ları temizle
    activeIntervals.value.forEach(intervalId => {
      clearInterval(intervalId)
    })
    activeIntervals.value.clear()
    
    // Merkezi sistemden kaldır
    unregisterClient('video')
    
    // Client'ı temizle
    if (client.value) {
      client.value.removeAllListeners()
      client.value = null
    }
    
    // Store'u sıfırla
    agoraStore.resetClient('video')
    agoraStore.resetUsers('video')
    agoraStore.resetTracks('video')
    
    // Ekran paylaşımı state'ini sıfırla
    agoraStore.setScreenSharing(false)
    
    // Track'leri temizle
    remoteAudioTracks.value.clear()
    remoteVideoTracks.value.clear()
    pendingSubscriptions.value.clear()
    
    // Kamera toggle timeout'ını temizle
    if (cameraToggleTimeout) {
      clearTimeout(cameraToggleTimeout)
      cameraToggleTimeout = null
    }
    
    logVideo('Video composable cleanup tamamlandı')
  }

  onUnmounted(cleanup)

  return {
    isJoining,
    isLeaving,
    joinChannel,
    leaveChannel,
    toggleCamera,
    toggleMicrophone,
    generateVideoUID,
    cleanup,
    checkDeviceStatus,
    centralEmitter
  }
} 