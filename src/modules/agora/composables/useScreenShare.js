import { ref, onUnmounted } from 'vue'
import AgoraRTC from 'agora-rtc-sdk-ng'
import mitt from 'mitt'
import { AGORA_CONFIG, USER_ID_RANGES, getUserDisplayName, getRemoteUserDisplayName } from '../constants.js'
import { createToken } from '../services/tokenService.js'
import { useTrackManagement } from './useTrackManagement.js'

/**
 * Ekran Paylaşımı Composable - Ekran paylaşımı işlemlerini yönetir
 * Bu composable, kullanıcının ekranını veya uygulama penceresini paylaşmasını sağlar.
 * Ekran paylaşımı için ayrı bir Agora client kullanır ve video kanalı ile aynı kanala katılır.
 * @module composables/useScreenShare
 */
export function useScreenShare(agoraStore) {
  const emitter = mitt() // Olay yayıncısı
  const isJoining = ref(false) // Kanala katılma durumu
  const isLeaving = ref(false) // Kanaldan ayrılma durumu
  
  // Bekleyen abonelikler - Track'ler henüz hazır olmadığında bekletilir
  const pendingSubscriptions = ref(new Map())

  // Track yönetimi composable'ı
  const { isTrackValid, createScreenTrack, cleanupTrack } = useTrackManagement()

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
      agoraStore.setScreenClient(client)
      setupScreenEventListeners(client)
      agoraStore.setScreenInitialized(true)
      console.log('Ekran paylaşımı client\'ı başlatıldı')
      return client
    } catch (error) {
      console.error('Ekran paylaşımı client\'ı başlatılamadı:', error)
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
      
      let client = agoraStore.screenClient
      if (!client) {
        client = await initializeScreenClient(appId)
      }

      // Önceki durumu temizle
      pendingSubscriptions.value.clear()

      // Yerel ekran kullanıcısını ayarla
      const localUser = {
        uid,
        name: userName,
        isLocal: true,
        hasVideo: false,
        isScreenShare: true
      }
      agoraStore.setScreenLocalUser(localUser)

      // Ekran paylaşımı kanalına katıl - Video kanalı ile aynı kanala katılır
      await client.join(appId, channelName, token, uid)
      console.log('Ekran paylaşımı kanalına başarıyla katılındı:', channelName)
      
      agoraStore.setScreenConnected(true)
      isJoining.value = false
      return { success: true }
      
    } catch (error) {
      isJoining.value = false
      console.error('Ekran paylaşımı kanalına katılma başarısız:', error)
      throw error
    }
  }

  /**
   * Ekran paylaşımı kanalından ayrılır
   */
  const leaveScreenChannel = async () => {
    const client = agoraStore.screenClient
    if (!client) return

    try {
      isLeaving.value = true
      
      // Ekran track'ini durdur
      if (agoraStore.screenLocalTracks.video) {
        cleanupTrack(agoraStore.screenLocalTracks.video)
      }

      await client.leave()
      agoraStore.resetScreen()
      
      // Durumu temizle
      pendingSubscriptions.value.clear()
      
    } catch (error) {
      console.error('Ekran paylaşımı kanalından ayrılma başarısız:', error)
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
      console.log('Ekran paylaşımı başlatılıyor...')
      
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
      const baseChannelName = agoraStore.videoChannelName
      if (!baseChannelName) {
        throw new Error('Video kanalına katılı değil, ekran paylaşımı başlatılamaz!')
      }

      // ÖNCE EKRAN TRACK'İNİ OLUŞTUR (kullanıcı seçimi burada yapılır)
      console.log('Ekran track\'i oluşturuluyor (kullanıcı ekran seçecek)...')
      const screenResult = await createScreenTrack()
      if (!screenResult.success) {
        if (screenResult.error && screenResult.error.message.includes('iptal')) {
          throw new Error('Ekran paylaşımı iptal edildi')
        } else {
          throw new Error('Ekran track\'i oluşturulamadı: ' + (screenResult.error?.message || 'Bilinmeyen hata'))
        }
      }
      const screenTrack = screenResult.track

      console.log('Ekran paylaşımı track\'i başarıyla oluşturuldu - kullanıcı ekran seçti')

      // EKRAN SEÇİMİ BAŞARILI OLDUKTAN SONRA UID VE TOKEN AL
      const screenUID = generateScreenUID()
      console.log('Ekran UID\'si oluşturuldu:', screenUID)

      // Ekran kanalı için token al
      console.log('Ekran kanalı için token alınıyor:', baseChannelName)
      const tokenData = await createToken(baseChannelName, screenUID)
      console.log('Ekran kanalı için token alındı')

      // Ekran client'ını başlat (eğer yoksa)
      if (!agoraStore.screenClient) {
        console.log('Ekran client\'ı başlatılıyor...')
        await initializeScreenClient(agoraStore.appId)
      }

      // Ekran kanalına katıl
      console.log('Ekran kanalına katılınıyor:', baseChannelName)
      await joinScreenChannel({
        token: tokenData.token,
        channelName: baseChannelName,
        uid: screenUID,
        userName: getUserDisplayName(screenUID, 'Ekran Paylaşımı'),
        appId: tokenData.app_id
      })

      // EKRAN SEÇİMİ BAŞARILI OLDUKTAN SONRA STORE'U GÜNCELLE
      agoraStore.setScreenLocalTrack(screenTrack)
      agoraStore.setScreenSharing(true)
      
      // Ekran track'ini yayınla
      console.log('Ekran track\'i yayınlanıyor...')
      await agoraStore.screenClient.publish(screenTrack)
      console.log('Ekran track\'i başarıyla yayınlandı')
      
      // Chrome'un "Paylaşımı durdur" butonunu handle et
      screenTrack.on('track-ended', () => {
        console.log('Chrome tarafından ekran paylaşımı track\'i sonlandırıldı')
        stopScreenShare()
      })
      
      console.log('Ekran paylaşımı başarıyla başlatıldı')
      console.log('Ekran paylaşımı kullanıcısı tüm kullanıcılara eklendi:', agoraStore.screenLocalUser)
      console.log('Toplam kullanıcı sayısı:', agoraStore.allUsers.length)
      console.log('Tüm kullanıcılar:', agoraStore.allUsers)
      emitter.emit('screen-share-started', { track: screenTrack })
      
      return screenTrack
      
    } catch (error) {
      console.error('Ekran paylaşımı başlatılamadı:', error)
      
      // Eğer track oluşturulduysa ama sonrasında hata olduysa, track'i temizle
      if (error.message !== 'Invalid screen track' && error.message !== 'No video channel joined, cannot start screen share!') {
        console.log('Hata nedeniyle ekran track\'i temizleniyor...')
        try {
          // Track'i temizlemeye çalış (eğer varsa)
          if (agoraStore.screenLocalTracks.video) {
            agoraStore.screenLocalTracks.video.stop()
            agoraStore.screenLocalTracks.video.close()
            agoraStore.setScreenLocalTrack(null)
          }
        } catch (cleanupError) {
          console.warn('Ekran track\'i temizlenirken hata oluştu:', cleanupError)
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
      const screenTrack = agoraStore.screenLocalTracks.video
      const screenClient = agoraStore.screenClient
      
      if (screenTrack) {
        // Unpublish track (eğer client varsa)
        if (screenClient) {
          console.log('Ekran paylaşımı track\'i yayından kaldırılıyor...')
          await screenClient.unpublish(screenTrack)
          console.log('Ekran paylaşımı track\'i başarıyla yayından kaldırıldı')
        }

        // Stop and close track
        screenTrack.stop()
        screenTrack.close()
        
        // Track event listener'ını temizle
        screenTrack.off('track-ended')
        
        // Ekran kanalından çık
        if (screenClient) {
          console.log('Ekran kanalından ayrılınıyor...')
          await leaveScreenChannel()
        }
        
        // Store'u güncelle
        agoraStore.setScreenLocalTrack(null)
        agoraStore.setScreenSharing(false)
        
        console.log('Ekran paylaşımı başarıyla durduruldu')
        console.log('Ekran paylaşımı kullanıcısı tüm kullanıcılardan kaldırıldı')
        emitter.emit('screen-share-stopped')
      }
      
    } catch (error) {
      console.error('Ekran paylaşımı durdurulamadı:', error)
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
      const client = agoraStore.screenClient
      if (!client) return

      const users = client.remoteUsers || []
      const user = users.find(u => u.uid === uid)
      
      if (!user) {
        if (retryCount < 3) {
          console.log(`Ekran paylaşımı kullanıcısı ${uid} bulunamadı, 1 saniye sonra tekrar deneniyor... (deneme ${retryCount + 1})`)
          setTimeout(() => subscribeToRemoteScreen(uid, retryCount + 1), 1000)
          return
        } else {
          console.warn(`Ekran paylaşımı kullanıcısı ${uid} bulunamadı, ${retryCount} denemeden sonra`)
          return
        }
      }

      // Subscribe to screen track
      await client.subscribe(user, 'video')
      console.log('Ekran paylaşımı kullanıcısından abone olundu:', uid)
      
      const track = user.videoTrack
      if (track) {
        agoraStore.setScreenRemoteTrack(uid, track)
        
        // Kullanıcı durumunu güncelle
        const currentUser = agoraStore.screenRemoteUsers.find(u => u.uid === uid)
        if (currentUser) {
          const updatedUser = { ...currentUser, hasVideo: true }
          agoraStore.addScreenRemoteUser(updatedUser)
        }
        
        emitter.emit('remote-screen-ready', { uid, track })
      }
      
    } catch (error) {
      console.error(`Ekran paylaşımı kullanıcısından abone olunamadı ${uid}:`, error)
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
      console.log('Ekran kullanıcısı katıldı:', user.uid)
      if (agoraStore.isLocalUID(user.uid)) {
        console.log('Yerel kullanıcı ekran client\'ında yoksayılıyor:', user.uid)
        return;
      }
      // UID zaten herhangi bir remote listede varsa ekleme
      if (
        agoraStore.videoRemoteUsers.some(u => u.uid === user.uid) ||
        agoraStore.screenRemoteUsers.some(u => u.uid === user.uid)
      ) {
        console.log('Remote user zaten mevcut, tekrar eklenmedi (screen):', user.uid)
        return;
      }
      const remoteUser = {
        uid: user.uid,
        name: getRemoteUserDisplayName(user.uid, 'Ekran Paylaşımı'),
        isLocal: false,
        hasVideo: false,
        isScreenShare: true
      }
      agoraStore.addScreenRemoteUser(remoteUser)
      emitter.emit('screen-user-joined', remoteUser)
    });

    // Ekran kullanıcısı ayrıldı
    client.on('user-left', (user) => {
      console.log('Ekran kullanıcısı ayrıldı:', user.uid)
      
      // Eğer bu UID yerel kullanıcının UID'si ise (video veya ekran), çıkar
      if (agoraStore.isLocalUID(user.uid)) {
        console.log('Yerel kullanıcı ayrıldı ekran client\'ında yoksayılıyor:', user.uid)
        return
      }
      
      agoraStore.removeScreenRemoteUser(user.uid)
      emitter.emit('screen-user-left', { uid: user.uid })
    })

    // Ekran kullanıcısı yayınlandı
    client.on('user-published', async (user, mediaType) => {
      console.log('Ekran kullanıcısı yayınlandı:', user.uid, mediaType)
      
      // Eğer bu UID yerel kullanıcının UID'si ise (video veya ekran), işleme
      if (agoraStore.isLocalUID(user.uid)) {
        console.log('Yerel kullanıcı yayınlandı ekran client\'ında yoksayılıyor:', user.uid, mediaType)
        return
      }
      
      if (mediaType === 'video') {
        try {
          await subscribeToRemoteScreen(user.uid)
        } catch (error) {
          console.error('Ekran paylaşımından abone olunamadı:', error)
        }
      }
    })

    // Ekran kullanıcısı yayından kaldırıldı
    client.on('user-unpublished', (user, mediaType) => {
      console.log('Ekran kullanıcısı yayından kaldırıldı:', user.uid, mediaType)
      
      // Eğer bu UID yerel kullanıcının UID'si ise (video veya ekran), işleme
      if (agoraStore.isLocalUID(user.uid)) {
        console.log('Yerel kullanıcı yayından kaldırıldı ekran client\'ında yoksayılıyor:', user.uid, mediaType)
        return
      }
      
      if (mediaType === 'video') {
        agoraStore.removeScreenRemoteUser(user.uid)
        emitter.emit('screen-user-unpublished', { uid: user.uid })
      }
    })

    // Bağlantı durumu
    client.on('connection-state-change', (curState) => {
      const connected = curState === 'CONNECTED'
      agoraStore.setScreenConnected(connected)
      emitter.emit('screen-connection-state-change', { connected })
    })
  }

  /**
   * Tüm kaynakları temizler
   * Event listener'ları kaldırır ve client'ı sıfırlar
   */
  const cleanup = () => {
    if (agoraStore.screenClient) {
      agoraStore.screenClient.removeAllListeners()
    }
    agoraStore.resetScreen()
    pendingSubscriptions.value.clear()
  }

  onUnmounted(cleanup)

  return {
    emitter,
    isJoining,
    isLeaving,
    joinScreenChannel,
    leaveScreenChannel,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
    generateScreenUID,
    cleanup
  }
} 