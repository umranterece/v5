import { ref, onUnmounted, computed } from 'vue'
import AgoraRTC from 'agora-rtc-sdk-ng'
import mitt from 'mitt'
import { AGORA_CONFIG, USER_ID_RANGES, getUserDisplayName, getRemoteUserDisplayName, DEV_CONFIG } from '../constants.js'
import { createToken } from '../services/tokenService.js'
import { useTrackManagement } from './useTrackManagement.js'
import { useLogger } from './useLogger.js'
import { useStreamQuality } from './useStreamQuality.js'

const { logScreen, logError, logWarn } = useLogger()

/**
 * Ekran Paylaşımı Composable - Ekran paylaşımı işlemlerini yönetir
 * Bu composable, kullanıcının ekranını veya uygulama penceresini paylaşmasını sağlar.
 * Ekran paylaşımı için ayrı bir Agora client kullanır ve video kanalı ile aynı kanala katılır.
 * @module composables/useScreenShare
 */
export function useScreenShare(agoraStore) {
  const isJoining = ref(false) // Kanala katılma durumu
  const isLeaving = ref(false) // Kanaldan ayrılma durumu
  
  // Bekleyen abonelikler - Track'ler henüz hazır olmadığında bekletilir
  const pendingSubscriptions = ref(new Map())
  
  // Memory leak önleme - Tüm timeout'ları ve interval'ları takip et
  const activeTimeouts = ref(new Set())
  const activeIntervals = ref(new Set())
  
  // Güvenli timeout oluşturma helper'ı
  const createSafeTimeout = (callback, delay) => {
    const timeoutId = setTimeout(() => {
      callback()
      activeTimeouts.value.delete(timeoutId)
    }, delay)
    activeTimeouts.value.add(timeoutId)
    return timeoutId
  }

  // Track yönetimi composable'ı
  const { 
    isTrackValid, 
    createScreenTrack, 
    cleanupTrack,
    centralEmitter,
    registerClient,
    unregisterClient,
    cleanupCentralEvents
  } = useTrackManagement()

  // Kalite optimizasyonu composable'ı
  const { optimizeScreenShareQuality } = useStreamQuality()

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
      const client = AgoraRTC.createClient(AGORA_CONFIG)
      agoraStore.setClient('screen', client)
      
      // Merkezi event sistemine kaydet
      registerClient(client, 'screen', setupScreenEventListeners)
      
      agoraStore.setClientInitialized('screen', true)
      logScreen('Ekran paylaşımı client\'ı başlatıldı')
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
        logScreen('Client zaten bağlı veya bağlanıyor, kanala katılma atlanıyor')
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
      logScreen('Ekran paylaşımı kanalına başarıyla katılınıyor', { channelName })
      
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
      logScreen('Ekran paylaşımı başlatılıyor (performans optimize edilmiş)')
      
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
      logScreen('Ekran track\'i oluşturuluyor (kullanıcı ekran seçecek)')
      const screenResult = await createScreenTrack()
      if (!screenResult.success) {
        if (screenResult.error && screenResult.error.message.includes('iptal')) {
          throw new Error('Ekran paylaşımı iptal edildi')
        } else {
          throw new Error('Ekran track\'i oluşturulamadı: ' + (screenResult.error?.message || 'Bilinmeyen hata'))
        }
      }
      const screenTrack = screenResult.track

      logScreen('Ekran paylaşımı track\'i başarıyla oluşturuldu - kullanıcı ekran seçti')

      // EKRAN SEÇİMİ BAŞARILI OLDUKTAN SONRA UID VE TOKEN AL
      const screenUID = generateScreenUID()
      logScreen('Ekran UID\'si oluşturuldu:', screenUID)

      // Ekran kanalı için token al
      logScreen('Ekran kanalı için token alınıyor:', baseChannelName)
      const tokenData = await createToken(baseChannelName, screenUID)
      logScreen('Ekran kanalı için token alındı')

      // Ekran client'ını başlat (eğer yoksa)
      if (!agoraStore.clients.screen.client) {
        logScreen('Ekran client\'ı başlatılıyor...')
        await initializeScreenClient(agoraStore.appId)
      }

      // Ekran kanalına katıl
      logScreen('Ekran kanalına katılınıyor:', baseChannelName)
      await joinScreenChannel({
        token: tokenData.token,
        channelName: baseChannelName,
        uid: screenUID,
        userName: getUserDisplayName(screenUID, 'Ekran Paylaşımı'),
        appId: tokenData.app_id
      })

      // Ekran kanalına katıl
      logScreen('Ekran kanalına katılınıyor:', baseChannelName)
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
        logScreen('Chrome tarafından ekran paylaşımı track\'i sonlandırıldı')
        stopScreenShare()
      })
      
      // PERFORMANS OPTİMİZASYONU: Track'i hemen yayınla
      logScreen('Ekran track\'i yayınlanıyor...')
      try {
        await agoraStore.clients.screen.client.publish(screenTrack)
        logScreen('Ekran track\'i başarıyla yayınlandı')
        
        // PERFORMANS OPTİMİZASYONU: Kalite optimizasyonunu başlat
        logScreen('Ekran paylaşımı kalite optimizasyonu başlatılıyor...')
        optimizeScreenShareQuality(screenTrack)
        
      } catch (error) {
        logError('Ekran track\'i yayınlanırken hata:', error)
        throw error
      }
      
      // PERFORMANS OPTİMİZASYONU: Event'leri tek seferde emit et
      logScreen('Ekran paylaşımı başarıyla başlatıldı')
      centralEmitter.emit('screen-share-started', { track: screenTrack, clientType: 'screen' })
      
      logScreen('Ekran paylaşımı kullanıcısı tüm kullanıcılara eklendi:', agoraStore.users.local.screen)
      logScreen('Toplam kullanıcı sayısı:', agoraStore.allUsers.length)
      
      return screenTrack
      
    } catch (error) {
      logError('Ekran paylaşımı başlatılamadı:', error)
      
      // Eğer track oluşturulduysa ama sonrasında hata olduysa, track'i temizle
      if (error.message !== 'Invalid screen track' && error.message !== 'No video channel joined, cannot start screen share!') {
        logScreen('Hata nedeniyle ekran track\'i temizleniyor...')
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
          logScreen('Ekran paylaşımı track\'i yayından kaldırılıyor...')
          try {
            await screenClient.unpublish(screenTrack)
            logScreen('Ekran paylaşımı track\'i başarıyla yayından kaldırıldı')
          } catch (unpublishError) {
            logWarn('Track yayından kaldırılırken hata:', unpublishError)
          }
        }

        // Stop and close track
        try {
          screenTrack.stop()
          screenTrack.close()
          logScreen('Ekran track\'i durduruldu ve kapatıldı')
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
          logScreen('Ekran kanalından ayrılınıyor...')
          try {
            await leaveScreenChannel()
          } catch (leaveError) {
            logWarn('Ekran kanalından ayrılırken hata:', leaveError)
          }
        }
        
        // Store'u güncelle
        agoraStore.setLocalTrack('screen', 'video', null)
        agoraStore.setScreenSharing(false)
        
        logScreen('Ekran paylaşımı başarıyla durduruldu')
        logScreen('Ekran paylaşımı kullanıcısı tüm kullanıcılardan kaldırıldı')
        centralEmitter.emit('screen-share-stopped', { clientType: 'screen' })
      } else {
        logScreen('Ekran track\'i bulunamadı, sadece store temizleniyor')
        agoraStore.setLocalTrack('screen', 'video', null)
        agoraStore.setScreenSharing(false)
        centralEmitter.emit('screen-share-stopped', { clientType: 'screen' })
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
      logScreen('Ekran paylaşımı kullanıcısından abone olundu:', uid)
      
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
        logScreen('remote-screen-ready olayı hemen emit ediliyor, UID:', uid)
        createSafeTimeout(() => {
          centralEmitter.emit('remote-screen-ready', { uid, track, clientType: 'screen' })
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
    if (!client) return

    // Ekran kullanıcısı katıldı
    client.on('user-joined', (user) => {
      logScreen('Ekran kullanıcısı katıldı:', user.uid)
      if (agoraStore.isLocalUID(user.uid)) {
        logScreen('Yerel kullanıcı ekran client\'ında yoksayılıyor:', user.uid)
        return;
      }
      // UID zaten herhangi bir remote listede varsa ekleme
      if (
        agoraStore.users.remote.filter(u => !u.isScreenShare).some(u => u.uid === user.uid) ||
        agoraStore.users.remote.filter(u => u.isScreenShare).some(u => u.uid === user.uid)
      ) {
        logScreen('Uzak kullanıcı zaten mevcut, tekrar eklenmedi (screen):', user.uid)
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
      centralEmitter.emit('user-joined', { ...remoteUser, clientType: 'screen' })
    });

    // Ekran kullanıcısı ayrıldı
    client.on('user-left', (user) => {
      logScreen('Ekran kullanıcısı ayrıldı:', user.uid)
      
      // Eğer bu UID yerel kullanıcının UID'si ise (video veya ekran), çıkar
      if (agoraStore.isLocalUID(user.uid)) {
        logScreen('Yerel kullanıcı ayrıldı ekran client\'ında yoksayılıyor:', user.uid)
        return
      }
      
      agoraStore.removeRemoteUser(user.uid)
      centralEmitter.emit('user-left', { uid: user.uid, clientType: 'screen' })
    })

    // Ekran kullanıcısı yayınlandı
    client.on('user-published', async (user, mediaType) => {
      logScreen('Ekran kullanıcısı yayınlandı:', user.uid, mediaType)
      
      // Eğer bu UID yerel kullanıcının UID'si ise (video veya ekran), işleme
      if (agoraStore.isLocalUID(user.uid)) {
        logScreen('Yerel kullanıcı yayınlandı ekran client\'ında yoksayılıyor:', user.uid, mediaType)
        return
      }
      
      if (mediaType === 'video') {
        try {
          logScreen('Ekran paylaşımı için hemen abone olma işlemi başlatılıyor...')
          // Hemen async olarak başlat
          createSafeTimeout(() => {
            subscribeToRemoteScreen(user.uid)
          }, 0)
        } catch (error) {
          logError('Ekran paylaşımından abone olunamadı:', error)
        }
      }
    })

    // Ekran kullanıcısı yayından kaldırıldı
    client.on('user-unpublished', (user, mediaType) => {
      logScreen('Ekran kullanıcısı yayından kaldırıldı:', user.uid, mediaType)
      
      // Eğer bu UID yerel kullanıcının UID'si ise (video veya ekran), işleme
      if (agoraStore.isLocalUID(user.uid)) {
        logScreen('Yerel kullanıcı yayından kaldırıldı ekran client\'ında yoksayılıyor:', user.uid, mediaType)
        return
      }
      
      if (mediaType === 'video') {
        agoraStore.removeRemoteUser(user.uid)
        centralEmitter.emit('user-unpublished', { user, mediaType, clientType: 'screen' })
      }
    })

    // Bağlantı durumu
    client.on('connection-state-change', (curState) => {
      const connected = curState === 'CONNECTED'
      agoraStore.setClientConnected('screen', connected)
      centralEmitter.emit('connection-state-change', { connected, clientType: 'screen' })
    })
  }

  /**
   * Tüm kaynakları temizler
   * Event listener'ları kaldırır ve client'ı sıfırlar
   */
  const cleanup = () => {
    logScreen('Screen share composable cleanup başlatılıyor')
    
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
    
    logScreen('Screen share composable cleanup tamamlandı')
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
    cleanup
  }
} 