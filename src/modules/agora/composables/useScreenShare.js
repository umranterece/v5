import { ref, onUnmounted, computed } from 'vue'
import { USER_ID_RANGES, getUserDisplayName, getRemoteUserDisplayName, DEV_CONFIG, AGORA_EVENTS } from '../constants.js'
import { createToken } from '../services/tokenService.js'
import { useTrackManagement } from './useTrackManagement.js'
import { useStreamQuality } from './useStreamQuality.js'
import { centralEmitter } from '../utils/centralEmitter.js'
import { fileLogger, LOG_CATEGORIES } from '../services/fileLogger.js'
import { createSafeTimeout as createSafeTimeoutFromUtils } from '../utils/index.js'
import { useLayoutStore } from '../store/layout.js'

/**
 * Ekran Paylaşımı Composable - Ekran paylaşımı işlemlerini yönetir
 * Bu composable, kullanıcının ekranını veya uygulama penceresini paylaşmasını sağlar.
 * Ekran paylaşımı için ayrı bir Agora client kullanır ve video kanalı ile aynı kanala katılır.
 * @module composables/useScreenShare
 */
export function useScreenShare(agoraStore) {
  // Logger fonksiyonları - FileLogger'dan al (tüm seviyeler için)
  const logDebug = (message, data) => fileLogger.log('debug', LOG_CATEGORIES.SCREEN, message, data)
  const logInfo = (message, data) => fileLogger.log('info', LOG_CATEGORIES.SCREEN, message, data)
  const logWarn = (message, data) => fileLogger.log('warn', LOG_CATEGORIES.SCREEN, message, data)
  const logError = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('error', LOG_CATEGORIES.SCREEN, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('error', LOG_CATEGORIES.SCREEN, errorOrMessage, context)
  }
  const logFatal = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('fatal', LOG_CATEGORIES.SCREEN, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('fatal', LOG_CATEGORIES.SCREEN, errorOrMessage, context)
  }
  const isJoining = ref(false) // Kanala katılma durumu
  const isLeaving = ref(false) // Kanaldan ayrılma durumu
  
  // Bekleyen abonelikler - Track'ler henüz hazır olmadığında bekletilir
  const pendingSubscriptions = ref(new Map())
  
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
    createScreenTrack, 
    cleanupTrack,
    createScreenClient,
    registerClient,
    unregisterClient,
    cleanupCentralEvents
  } = useTrackManagement()

  // Kalite optimizasyonu composable'ı
  const { optimizeScreenShareQuality } = useStreamQuality()

  /**
   * Ekran paylaşımı kullanıcısına abone olur
   * @param {number} uid - Kullanıcı ID'si
   */
  const subscribeToScreenUser = async (uid) => {
    try {
      console.log('🟢 [SCREEN] subscribeToScreenUser BAŞLADI:', uid)
      
      const client = agoraStore.clients.screen.client
      if (!client) {
        console.log('🔴 [SCREEN] Ekran client mevcut değil:', uid)
        return
      }

      const users = client.remoteUsers || []
      const user = users.find(u => u.uid === uid)
      
      if (!user) {
        console.log('🔴 [SCREEN] Ekran paylaşımı kullanıcısı bulunamadı:', uid)
        return
      }

      // Subscribe to screen track
      console.log('🟡 [SCREEN] Track subscribe başlıyor:', uid)
      await client.subscribe(user, 'video')
      console.log('🟢 [SCREEN] Track subscribe tamamlandı:', uid)
      
      const track = user.videoTrack
      if (track) {
        // Store'u hemen güncelle
        agoraStore.setRemoteTrack(uid, 'screen', track)
        console.log('🟢 [SCREEN] Store güncellendi:', uid)
        
        // Kullanıcı durumunu hemen güncelle
        const currentUser = agoraStore.users.remote.filter(u => u.isScreenShare).find(u => u.uid === uid)
        if (currentUser) {
          const updatedUser = { ...currentUser, hasVideo: true }
          agoraStore.addRemoteUser(updatedUser)
        }
        
        // Event'i hemen emit et
        console.log('🟢 [SCREEN] remote-screen-ready emit ediliyor:', uid)
        centralEmitter.emit(AGORA_EVENTS.REMOTE_SCREEN_READY, { uid, track, clientType: 'screen' })
        
        console.log('🎉 [SCREEN] subscribeToScreenUser BAŞARILI:', uid)
      }
      
    } catch (error) {
      console.log('🔴 [SCREEN] subscribeToScreenUser HATA:', uid, error)
      throw error
    }
  }

  /**
   * Ekran paylaşımı için UID oluşturur
   * @returns {number} Ekran paylaşımı için benzersiz UID
   */
  const generateScreenUID = () => {
    return Math.floor(Math.random() * (USER_ID_RANGES.SCREEN_SHARE.MAX - USER_ID_RANGES.SCREEN_SHARE.MIN)) + USER_ID_RANGES.SCREEN_SHARE.MIN
  }

  /**
   * Ekran paylaşımı client'ını başlatır
   * @param {string} appId - Agora uygulama ID'si
   * @returns {Promise<Object>} Başlatılan client
   */
  const initializeScreenClient = async (appId) => {
    try {
      const { success, client, error } = createScreenClient()
      if (!success) {
        throw error
      }
      
      agoraStore.setClient('screen', client)
      
      // Merkezi event sistemine kaydet (event handler olmadan)
      registerClient(client, 'screen')
      
      // Event listener'ları manuel olarak ekle
      setupScreenEventListeners(client)
      
      agoraStore.setClientInitialized('screen', true)
      logInfo('Ekran paylaşımı client\'ı başlatıldı')
      return client
    } catch (error) {
      logError(error, { context: 'initializeScreenClient', appId })
      throw error
    }
  }

  /**
   * Ekran paylaşımı kanalına katılır
   * @param {Object} params - Katılma parametreleri
   * @param {string} params.token - Agora token'ı
   * @param {string} params.channelName - Kanal adı
   * @param {number} params.uid - Kullanıcı ID'si
   * @param {string} params.userName - Kullanıcı adı
   * @param {string} params.appId - Agora uygulama ID'si
   */
  const joinScreenChannel = async ({ token, channelName, uid, userName = 'Screen User', appId }) => {
    if (isJoining.value) return

    try {
      isJoining.value = true
      
      let client = agoraStore.clients.screen.client
      if (!client) {
        client = await initializeScreenClient(appId)
      }

      // Önceki durumu temizle
      pendingSubscriptions.value.clear()

      // Client'ın bağlantı durumunu kontrol et
      if (client.connectionState === 'CONNECTED' || client.connectionState === 'CONNECTING') {
        logInfo('Client zaten bağlı veya bağlanıyor, kanala katılma atlanıyor')
        isJoining.value = false
        return { success: true }
      }

      // Yerel ekran kullanıcısını ayarla (sadece bağlantı başarılı olduktan sonra)
      const localUser = {
        uid,
        name: userName,
        isLocal: true,
        hasVideo: false,
        isScreenShare: true
      }

      // Ekran paylaşımı kanalına katıl - Video kanalı ile aynı kanala katılır
      await client.join(appId, channelName, token, uid)
      logInfo('Ekran paylaşımı kanalına başarıyla katılınıyor', { channelName })
      
      // Bağlantı başarılı olduktan sonra kullanıcıyı ayarla
      agoraStore.setLocalUser('screen', localUser)
      agoraStore.setClientConnected('screen', true)
      
      isJoining.value = false
      return { success: true }
      
    } catch (error) {
      isJoining.value = false
      logError(error, { context: 'joinScreenChannel', channelName })
      throw error
    }
  }

  /**
   * Ekran paylaşımı kanalından ayrılır
   */
  const leaveScreenChannel = async () => {
    const client = agoraStore.clients.screen.client
    if (!client) return

    try {
      isLeaving.value = true
      
      // Ekran track'ini durdur
      if (agoraStore.tracks.local.screen.video) {
        cleanupTrack(agoraStore.tracks.local.screen.video)
      }

      await client.leave()
      agoraStore.resetClient('screen')
      agoraStore.resetUsers('screen')
      agoraStore.resetTracks('screen')
      
      // Ekran paylaşımı state'ini sıfırla
      agoraStore.setScreenSharing(false)
      
      // Durumu temizle
      pendingSubscriptions.value.clear()
      
    } catch (error) {
      logError(error, { context: 'leaveScreenChannel' })
    } finally {
      isLeaving.value = false
    }
  }

  /**
   * Ekran paylaşımını başlatır
   * Kullanıcıdan ekran seçmesini ister ve seçilen ekranı yayınlar
   * @returns {Promise<Object>} Ekran track'i
   */
  const startScreenShare = async () => {
    try {
      logInfo('Ekran paylaşımı başlatılıyor (performans optimize edilmiş)')
      
      // Mobil cihaz kontrolü - Mobil cihazlarda ekran paylaşımı desteklenmez
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = ['mobile', 'android', 'iphone', 'ipad', 'ipod'].some(keyword => userAgent.includes(keyword))
      
      if (isMobile) {
        throw new Error('Mobil cihazlarda ekran paylaşımı desteklenmez')
      }
      
      // getDisplayMedia desteği kontrolü - Tarayıcı desteğini kontrol eder
      if (!('getDisplayMedia' in navigator.mediaDevices)) {
        throw new Error('Bu tarayıcıda ekran paylaşımı desteklenmez')
      }
      
      // Önce video kanalına katılıp katılmadığını kontrol et
      if (!agoraStore.clients.video.isConnected) {
        throw new Error('Önce video kanalına katılmanız gerekiyor. Lütfen önce "Kanala Katıl" butonuna tıklayın.')
      }
      
      const baseChannelName = agoraStore.videoChannelName
      if (!baseChannelName) {
        throw new Error('Video kanal adı bulunamadı. Lütfen önce video kanalına katılın.')
      }

      // ÖNCE EKRAN TRACK'İNİ OLUŞTUR (kullanıcı seçimi burada yapılır)
      logInfo('Ekran track\'i oluşturuluyor (kullanıcı ekran seçecek)')
      const screenResult = await createScreenTrack()
      if (!screenResult.success) {
        if (screenResult.error && screenResult.error.message.includes('iptal')) {
          throw new Error('Ekran paylaşımı iptal edildi')
        } else {
          throw new Error('Ekran track\'i oluşturulamadı: ' + (screenResult.error?.message || 'Bilinmeyen hata'))
        }
      }
      const screenTrack = screenResult.track

      logInfo('Ekran paylaşımı track\'i başarıyla oluşturuldu - kullanıcı ekran seçti')

      // EKRAN SEÇİMİ BAŞARILI OLDUKTAN SONRA UID VE TOKEN AL
      const screenUID = generateScreenUID()
      logInfo('Ekran UID\'si oluşturuldu:', screenUID)

      // Ekran kanalı için token al
      logInfo('Ekran kanalı için token alınıyor:', baseChannelName)
      const tokenData = await createToken(baseChannelName, screenUID)
      logInfo('Ekran kanalı için token alındı')

      // Ekran client'ını başlat (eğer yoksa)
      if (!agoraStore.clients.screen.client) {
        logInfo('Ekran client\'ı başlatılıyor...')
        await initializeScreenClient(agoraStore.appId)
      }

      // Ekran kanalına katıl
      logInfo('Ekran kanalına katılınıyor:', baseChannelName)
      await joinScreenChannel({
        token: tokenData.token,
        channelName: baseChannelName,
        uid: screenUID,
        userName: getUserDisplayName(screenUID, 'Ekran Paylaşımı'),
        appId: tokenData.app_id
      })

      // Ekran kanalına katıl
      logInfo('Ekran kanalına katılınıyor:', baseChannelName)
      await joinScreenChannel({
        token: tokenData.token,
        channelName: baseChannelName,
        uid: screenUID,
        userName: getUserDisplayName(screenUID, 'Ekran Paylaşımı'),
        appId: tokenData.app_id
      })

      // PERFORMANS OPTİMİZASYONU: Store'u hemen güncelle
      agoraStore.setLocalTrack('screen', 'video', screenTrack)
      agoraStore.setScreenSharing(true)
      
      // PERFORMANS OPTİMİZASYONU: Track event'lerini hemen dinle
      screenTrack.on('track-ended', () => {
        logInfo('Chrome tarafından ekran paylaşımı track\'i sonlandırıldı')
        stopScreenShare()
      })
      
      // PERFORMANS OPTİMİZASYONU: Track'i hemen yayınla
      logInfo('Ekran track\'i yayınlanıyor...')
      try {
        await agoraStore.clients.screen.client.publish(screenTrack)
        logInfo('Ekran track\'i başarıyla yayınlandı')
        
        // PERFORMANS OPTİMİZASYONU: Kalite optimizasyonunu başlat
        logInfo('Ekran paylaşımı kalite optimizasyonu başlatılıyor...')
        optimizeScreenShareQuality(screenTrack)
        
      } catch (error) {
        logError('Ekran track\'i yayınlanırken hata:', error)
        throw error
      }
      
      // PERFORMANS OPTİMİZASYONU: Event'leri tek seferde emit et
      logInfo('Ekran paylaşımı başarıyla başlatıldı')
      centralEmitter.emit(AGORA_EVENTS.SCREEN_SHARE_STARTED, { track: screenTrack, clientType: 'screen' })
      
      // Layout mantığı: Ekran paylaşımı başladığında presentation'a geç
      const layoutStore = useLayoutStore()
      if (layoutStore.currentLayout !== 'presentation') {
        console.log('🟢 [SCREEN] Yerel ekran paylaşımı başladı, layout presentation\'a geçiliyor')
        layoutStore.switchLayoutWithSave('presentation')
      }
      
      logInfo('Ekran paylaşımı kullanıcısı tüm kullanıcılara eklendi:', agoraStore.users.local.screen)
      logInfo('Toplam kullanıcı sayısı:', agoraStore.allUsers.length)
      
      return screenTrack
      
    } catch (error) {
      logError('Ekran paylaşımı başlatılamadı:', error)
      
      // Eğer track oluşturulduysa ama sonrasında hata olduysa, track'i temizle
      if (error.message !== 'Invalid screen track' && error.message !== 'No video channel joined, cannot start screen share!') {
        logInfo('Hata nedeniyle ekran track\'i temizleniyor...')
        try {
                  // Track'i temizlemeye çalış (eğer varsa)
        if (agoraStore.tracks.local.screen.video) {
          agoraStore.tracks.local.screen.video.stop()
          agoraStore.tracks.local.screen.video.close()
          agoraStore.setLocalTrack('screen', 'video', null)
        }
        } catch (cleanupError) {
          logWarn('Ekran track\'i temizlenirken hata oluştu:', cleanupError)
        }
      }
      
      throw error
    }
  }

  /**
   * Ekran paylaşımını durdurur
   * Track'i yayından kaldırır, durdurur ve temizler
   */
  const stopScreenShare = async () => {
    try {
      const screenTrack = agoraStore.tracks.local.screen.video
      const screenClient = agoraStore.clients.screen.client
      
      if (screenTrack) {
        // Unpublish track (eğer client varsa)
        if (screenClient) {
          logInfo('Ekran paylaşımı track\'i yayından kaldırılıyor...')
          try {
            await screenClient.unpublish(screenTrack)
            logInfo('Ekran paylaşımı track\'i başarıyla yayından kaldırıldı')
          } catch (unpublishError) {
            logWarn('Track yayından kaldırılırken hata:', unpublishError)
          }
        }

        // Stop and close track
        try {
          screenTrack.stop()
          screenTrack.close()
          logInfo('Ekran track\'i durduruldu ve kapatıldı')
        } catch (trackError) {
          logWarn('Track durdurulurken hata:', trackError)
        }
        
        // Track event listener'ını temizle
        try {
          screenTrack.off('track-ended')
        } catch (listenerError) {
          logWarn('Track listener temizlenirken hata:', listenerError)
        }
        
        // Ekran kanalından çık
        if (screenClient) {
          logInfo('Ekran kanalından ayrılınıyor...')
          try {
            await leaveScreenChannel()
          } catch (leaveError) {
            logWarn('Ekran kanalından ayrılırken hata:', leaveError)
          }
        }
        
        // Store'u güncelle
        agoraStore.setLocalTrack('screen', 'video', null)
        agoraStore.setScreenSharing(false)
        
        // Layout mantığı: Ekran paylaşımı durduğunda grid'e dön (eğer başka ekran paylaşımı yoksa)
        const layoutStore = useLayoutStore()
        const hasScreenShare = agoraStore.users.remote.some(u => u.isScreenShare) || agoraStore.isScreenSharing
        
        if (!hasScreenShare && layoutStore.currentLayout === 'presentation') {
          console.log('🟢 [SCREEN] Yerel ekran paylaşımı durdu, ekran paylaşımı yok, layout grid\'e zorlanıyor')
          layoutStore.switchLayoutWithSave('grid')
        }
        
        logInfo('Ekran paylaşımı başarıyla durduruldu')
        logInfo('Ekran paylaşımı kullanıcısı tüm kullanıcılardan kaldırıldı')
        centralEmitter.emit(AGORA_EVENTS.SCREEN_SHARE_STOPPED, { clientType: 'screen' })
      } else {
        logInfo('Ekran track\'i bulunamadı, sadece store temizleniyor')
        agoraStore.setLocalTrack('screen', 'video', null)
        agoraStore.setScreenSharing(false)
        centralEmitter.emit(AGORA_EVENTS.SCREEN_SHARE_STOPPED, { clientType: 'screen' })
      }
      
    } catch (error) {
      logError('Ekran paylaşımı durdurulamadı:', error)
      // Hata olsa bile store'u temizle
      agoraStore.setLocalTrack('screen', 'video', null)
      agoraStore.setScreenSharing(false)
      throw error
    }
  }

  /**
   * Ekran paylaşımını açıp kapatır
   * Eğer aktifse durdurur, değilse başlatır
   */
  const toggleScreenShare = async () => {
    if (agoraStore.isScreenSharing) {
      await stopScreenShare()
    } else {
      await startScreenShare()
    }
  }

  /**
   * Uzak ekran paylaşımına abone olur
   * @param {number} uid - Kullanıcı ID'si
   * @param {number} retryCount - Tekrar deneme sayısı
   */
  const subscribeToRemoteScreen = async (uid, retryCount = 0) => {
    try {
      const client = agoraStore.clients.screen.client
      if (!client) return

      const users = client.remoteUsers || []
      const user = users.find(u => u.uid === uid)
      
      if (!user) {
        if (retryCount < DEV_CONFIG.MAX_RETRY_COUNT) {
          logWarn(`Ekran paylaşımı kullanıcısı ${uid} bulunamadı, ${DEV_CONFIG.SCREEN_SHARE_RETRY_DELAY}ms sonra tekrar deneniyor... (deneme ${retryCount + 1})`)
          createSafeTimeout(() => subscribeToRemoteScreen(uid, retryCount + 1), DEV_CONFIG.SCREEN_SHARE_RETRY_DELAY)
          return
        } else {
          logWarn(`Ekran paylaşımı kullanıcısı ${uid} bulunamadı, ${retryCount} denemeden sonra`)
          return
        }
      }

      // Subscribe to screen track
      await client.subscribe(user, 'video')
      logInfo('Ekran paylaşımı kullanıcısından abone olundu:', uid)
      
      const track = user.videoTrack
      if (track) {
        // Store'u hemen güncelle
        agoraStore.setRemoteTrack(uid, 'screen', track)
        
        // Kullanıcı durumunu hemen güncelle
        const currentUser = agoraStore.users.remote.filter(u => u.isScreenShare).find(u => u.uid === uid)
        if (currentUser) {
          const updatedUser = { ...currentUser, hasVideo: true }
          agoraStore.addRemoteUser(updatedUser)
        }
        
        // Event'i hemen emit et - setTimeout ile async olarak
        logInfo('remote-screen-ready olayı hemen emit ediliyor, UID:', uid)
        createSafeTimeout(() => {
          centralEmitter.emit(AGORA_EVENTS.REMOTE_SCREEN_READY, { uid, track, clientType: 'screen' })
        }, 0)
      }
      
    } catch (error) {
      logError(`Ekran paylaşımı kullanıcısından abone olunamadı ${uid}:`, error)
      throw error
    }
  }

  /**
   * Ekran paylaşımı event listener'larını ayarlar
   * @param {Object} client - Agora client
   */
  const setupScreenEventListeners = (client) => {
    if (!client || !client.on) return

    // Ekran kullanıcısı katıldı
    client.on(AGORA_EVENTS.USER_JOINED, (user) => {
      console.log('🟢 [SCREEN] USER_JOINED:', user.uid)
      if (agoraStore.isLocalUID(user.uid)) {
        logInfo('Yerel kullanıcı ekran client\'ında yoksayılıyor:', user.uid)
        return;
      }
      // UID zaten herhangi bir remote listede varsa ekleme
      if (
        agoraStore.users.remote.filter(u => !u.isScreenShare).some(u => u.uid === user.uid) ||
        agoraStore.users.remote.filter(u => u.isScreenShare).some(u => u.uid === user.uid)
      ) {
        logInfo('Uzak kullanıcı zaten mevcut, tekrar eklenmedi (screen):', user.uid)
        return;
      }
      

      
      const remoteUser = {
        uid: user.uid,
        name: getRemoteUserDisplayName(user.uid, 'Ekran Paylaşımı'),
        isLocal: false,
        hasVideo: false,
        isScreenShare: true
      }
      agoraStore.addRemoteUser(remoteUser)
      
      console.log('🟢 [SCREEN] Uzak ekran paylaşımı kullanıcısı eklendi:', {
        uid: user.uid,
        name: remoteUser.name,
        isScreenShare: remoteUser.isScreenShare
      })
      
      // Layout mantığı: Sadece ekran paylaşımı varsa presentation'a geç
      const layoutStore = useLayoutStore()
      const hasScreenShare = agoraStore.users.remote.some(u => u.isScreenShare) || agoraStore.isScreenSharing
      
      if (hasScreenShare && layoutStore.currentLayout !== 'presentation') {
        console.log('🟢 [SCREEN] Ekran paylaşımı var, layout presentation\'a geçiliyor:', user.uid)
        layoutStore.switchLayoutWithSave('presentation')
      } else if (!hasScreenShare && layoutStore.currentLayout !== 'grid') {
        console.log('🟢 [SCREEN] Ekran paylaşımı yok, layout grid\'e zorlanıyor:', user.uid)
        layoutStore.switchLayoutWithSave('grid')
      }
      
                    // Basit ve etkili yaklaşım: Hızlı retry
      if (user.videoTrack) {
        console.log('🟢 [SCREEN] Track hazır, hemen abone olunuyor:', user.uid)
        subscribeToScreenUser(user.uid)
      } else {
        console.log('🟡 [SCREEN] Track hazır değil, retry başlatılıyor:', user.uid)
        
        // Hemen dene
        setTimeout(() => subscribeToScreenUser(user.uid), 0)
        
        // 100ms sonra tekrar dene
        setTimeout(() => subscribeToScreenUser(user.uid), 100)
        
        // 500ms sonra tekrar dene
        setTimeout(() => subscribeToScreenUser(user.uid), 500)
      }
      
              centralEmitter.emit(AGORA_EVENTS.USER_JOINED, { ...remoteUser, clientType: 'screen' })
    });

    // Ekran kullanıcısı ayrıldı
    client.on(AGORA_EVENTS.USER_LEFT, (user) => {
      logInfo('Ekran kullanıcısı ayrıldı:', user.uid)
      
      // Eğer bu UID yerel kullanıcının UID'si ise (video veya ekran), çıkar
      if (agoraStore.isLocalUID(user.uid)) {
        logInfo('Yerel kullanıcı ayrıldı ekran client\'ında yoksayılıyor:', user.uid)
        return
      }
      
      // Uzak ekran paylaşımı kullanıcısı ayrıldığında layout'u kontrol et
      const layoutStore = useLayoutStore()
      if (layoutStore.currentLayout === 'presentation') {
        // Eğer başka ekran paylaşımı kullanıcısı yoksa grid'e dön
        const remainingScreenUsers = agoraStore.users.remote.filter(u => u.isScreenShare)
        if (remainingScreenUsers.length === 0) {
          logInfo('Uzak ekran paylaşımı kullanıcısı ayrıldı, ekran paylaşımı yok, layout grid\'e zorlanıyor')
          layoutStore.switchLayoutWithSave('grid')
        }
      }
      
      // Screen track'ini temizle
      agoraStore.setRemoteTrack(user.uid, 'screen', null)
      agoraStore.removeRemoteUser(user.uid)
      centralEmitter.emit(AGORA_EVENTS.USER_LEFT, { uid: user.uid, clientType: 'screen' })
    })

    // Ekran kullanıcısı yayınlandı
    client.on(AGORA_EVENTS.USER_PUBLISHED, async (user, mediaType) => {
      logInfo('Ekran kullanıcısı yayınlandı:', user.uid, mediaType)
      
      // Eğer bu UID yerel kullanıcının UID'si ise (video veya ekran), işleme
      if (agoraStore.isLocalUID(user.uid)) {
        logInfo('Yerel kullanıcı yayınlandı ekran client\'ında yoksayılıyor:', user.uid, mediaType)
        return
      }
      
      if (mediaType === 'video') {
        try {
          logInfo('Ekran paylaşımı için hızlı abone olma işlemi başlatılıyor...')
          
          // Layout'u presentation'a geç (eğer ekran paylaşımı varsa)
          const layoutStore = useLayoutStore()
          const hasScreenShare = agoraStore.users.remote.some(u => u.isScreenShare) || agoraStore.isScreenSharing
          if (hasScreenShare && layoutStore.currentLayout !== 'presentation') {
            logInfo('Ekran paylaşımı kullanıcısı yayınlandı, layout presentation\'a geçiliyor:', user.uid)
            layoutStore.switchLayoutWithSave('presentation')
          }
          
          // Hemen dene
          setTimeout(() => subscribeToRemoteScreen(user.uid), 0)
          
          // 100ms sonra tekrar dene
          setTimeout(() => subscribeToRemoteScreen(user.uid), 100)
          
          // 500ms sonra tekrar dene
          setTimeout(() => subscribeToRemoteScreen(user.uid), 500)
          
        } catch (error) {
          logError('Ekran paylaşımından abone olunamadı:', error)
        }
      }
    })

    // Ekran kullanıcısı yayından kaldırıldı
    client.on(AGORA_EVENTS.USER_UNPUBLISHED, (user, mediaType) => {
      logInfo('Ekran kullanıcısı yayından kaldırıldı:', user.uid, mediaType)
      
      // Eğer bu UID yerel kullanıcının UID'si ise (video veya ekran), işleme
      if (agoraStore.isLocalUID(user.uid)) {
        logInfo('Yerel kullanıcı yayından kaldırıldı ekran client\'ında yoksayılıyor:', user.uid, mediaType)
        return
      }
      
      if (mediaType === 'video') {
        // Uzak ekran paylaşımı durduğunda grid layout'a geri dön
        const layoutStore = useLayoutStore()
        if (layoutStore.currentLayout === 'presentation') {
          // Eğer başka ekran paylaşımı kullanıcısı yoksa grid'e dön
          const remainingScreenUsers = agoraStore.users.remote.filter(u => u.isScreenShare)
          if (remainingScreenUsers.length === 0) {
            logInfo('Uzak ekran paylaşımı durdu, ekran paylaşımı yok, layout grid\'e zorlanıyor')
            layoutStore.switchLayoutWithSave('grid')
          }
        }
        
        // Screen track'ini temizle
        agoraStore.setRemoteTrack(user.uid, 'screen', null)
        agoraStore.removeRemoteUser(user.uid)
        centralEmitter.emit(AGORA_EVENTS.USER_UNPUBLISHED, { user, mediaType, clientType: 'screen' })
      }
    })

    // Bağlantı durumu
    client.on(AGORA_EVENTS.CONNECTION_STATE_CHANGE, (curState) => {
      const connected = curState === 'CONNECTED'
      agoraStore.setClientConnected('screen', connected)
      centralEmitter.emit(AGORA_EVENTS.CONNECTION_STATE_CHANGE, { connected, clientType: 'screen' })
    })
  }

  /**
   * Tüm kaynakları temizler
   * Event listener'ları kaldırır ve client'ı sıfırlar
   */
  const cleanup = () => {
    logInfo('Screen share composable cleanup başlatılıyor')
    
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
    unregisterClient('screen')
    
    // Client'ı temizle
    if (agoraStore.clients.screen.client) {
      agoraStore.clients.screen.client.removeAllListeners()
    }
    
    // Store'u sıfırla
    agoraStore.resetClient('screen')
    agoraStore.resetUsers('screen')
    agoraStore.resetTracks('screen')
    
    // Ekran paylaşımı state'ini sıfırla
    agoraStore.setScreenSharing(false)
    
    // Track'leri temizle
    pendingSubscriptions.value.clear()
    
    logInfo('Screen share composable cleanup tamamlandı')
  }

  onUnmounted(cleanup)

  // Ekran paylaşımı desteği kontrolü
  const supportsScreenShare = computed(() => {
    // Mobil cihaz kontrolü
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = ['mobile', 'android', 'iphone', 'ipad', 'ipod'].some(keyword => userAgent.includes(keyword))
    
    // getDisplayMedia desteği kontrolü
    const hasGetDisplayMedia = 'getDisplayMedia' in navigator.mediaDevices
    
    return !isMobile && hasGetDisplayMedia
  })

  return {
    isJoining,
    isLeaving,
    joinScreenChannel,
    leaveScreenChannel,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
    generateScreenUID,
    supportsScreenShare,
    subscribeToScreenUser,
    cleanup
  }
} 