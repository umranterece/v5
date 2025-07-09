import { ref, onUnmounted } from 'vue'
import AgoraRTC from 'agora-rtc-sdk-ng'
import mitt from 'mitt'
import { AGORA_CONFIG, USER_ID_RANGES, CHANNEL_NAMES, getUserDisplayName, getRemoteUserDisplayName } from '../constants.js'
import { useTrackManagement } from './useTrackManagement.js'

/**
 * Video/Ses Composable - Video client işlemlerini yönetir
 * Bu composable, Agora video client'ının başlatılması, kanala katılma, track yönetimi
 * ve uzak kullanıcılarla iletişim işlemlerini yönetir.
 * @module composables/useVideo
 */
export function useVideo(agoraStore) {
  const client = ref(null) // Agora client referansı
  const emitter = mitt() // Olay yayıncısı
  
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

  // Track yönetimi composable'ı
  const { isTrackValid, createAudioTrack, createVideoTrack, cleanupTrack } = useTrackManagement()

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
      const agoraClient = AgoraRTC.createClient(AGORA_CONFIG)
      client.value = agoraClient
      agoraStore.setVideoClient(agoraClient)
      setupEventListeners(agoraClient)
      agoraStore.setVideoInitialized(true)
    } catch (error) {
      console.error('Video client\'ı başlatılamadı:', error)
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
      agoraStore.setVideoLocalUser(localUser)

      // Video kanalına katıl
      const videoChannelName = CHANNEL_NAMES.VIDEO(channelName)
      await client.value.join(appId, videoChannelName, token, uid)
      
      // Yerel track'leri oluştur ve yayınla
      await createLocalTracks()
      
      agoraStore.setVideoConnected(true)
      isJoining.value = false
      return { success: true }
      
    } catch (error) {
      isJoining.value = false
      console.error('Video kanalına katılma başarısız:', error)
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
      if (agoraStore.videoLocalTracks.audio) {
        cleanupTrack(agoraStore.videoLocalTracks.audio)
      }
      if (agoraStore.videoLocalTracks.video) {
        cleanupTrack(agoraStore.videoLocalTracks.video)
      }

      await client.value.leave()
      agoraStore.resetVideo()
      
      // Durumu temizle
      remoteAudioTracks.value.clear()
      remoteVideoTracks.value.clear()
      pendingSubscriptions.value.clear()
      
    } catch (error) {
      console.error('Video kanalından ayrılma başarısız:', error)
    } finally {
      isLeaving.value = false
    }
  }

  /**
   * Yerel track'leri oluşturur
   * Ses ve video track'lerini oluşturur ve yayınlar
   */
  const createLocalTracks = async () => {
    try {
      // Ses track'i oluştur
      const audioResult = await createAudioTrack()
      if (audioResult.success) {
        agoraStore.setVideoLocalTrack('audio', audioResult.track)
        agoraStore.setLocalAudioMuted(false)
        emitter.emit('local-audio-ready', { track: audioResult.track })
      } else {
        agoraStore.setVideoLocalTrack('audio', null)
        agoraStore.setLocalAudioMuted(true)
      }

      // Video track'i oluştur
      const videoResult = await createVideoTrack()
      if (videoResult.success) {
        agoraStore.setVideoLocalTrack('video', videoResult.track)
        agoraStore.setLocalVideoOff(false)
        emitter.emit('local-video-ready', { track: videoResult.track })
      } else {
        agoraStore.setVideoLocalTrack('video', null)
        agoraStore.setLocalVideoOff(true)
      }

      // Track'leri yayınla
      const tracksToPublish = [];
      if (agoraStore.videoLocalTracks.audio) tracksToPublish.push(agoraStore.videoLocalTracks.audio);
      if (agoraStore.videoLocalTracks.video) tracksToPublish.push(agoraStore.videoLocalTracks.video);
      if (tracksToPublish.length) {
        await client.value.publish(tracksToPublish);
      }

    } catch (error) {
      console.error('Yerel track\'ler oluşturulamadı:', error)
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
    
    try {
      if (off) {
        // Kamerayı kapat
        if (agoraStore.videoLocalTracks.video && isTrackValid(agoraStore.videoLocalTracks.video)) {
          await client.value.unpublish(agoraStore.videoLocalTracks.video)
          cleanupTrack(agoraStore.videoLocalTracks.video)
          agoraStore.setVideoLocalTrack('video', null)
        }
        agoraStore.setLocalVideoOff(true)
      } else {
        // Kamerayı aç
        const videoResult = await createVideoTrack()
        if (videoResult.success) {
          agoraStore.setVideoLocalTrack('video', videoResult.track)
          await client.value.publish(videoResult.track)
          agoraStore.setLocalVideoOff(false)
          emitter.emit('local-video-ready', { track: videoResult.track })
        }
      }
    } catch (error) {
      console.error('Kamera değiştirilemedi:', error)
      throw error
    } finally {
      cameraToggleTimeout = setTimeout(() => {
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
      if (muted) {
        if (agoraStore.videoLocalTracks.audio && isTrackValid(agoraStore.videoLocalTracks.audio)) {
          await client.value.unpublish(agoraStore.videoLocalTracks.audio)
        }
        agoraStore.setLocalAudioMuted(true)
      } else {
        if (agoraStore.videoLocalTracks.audio && isTrackValid(agoraStore.videoLocalTracks.audio)) {
          await client.value.publish(agoraStore.videoLocalTracks.audio)
          agoraStore.setLocalAudioMuted(false)
          emitter.emit('local-audio-ready', { track: agoraStore.videoLocalTracks.audio })
        } else {
          const audioResult = await createAudioTrack()
          if (audioResult.success) {
            agoraStore.setVideoLocalTrack('audio', audioResult.track)
            await client.value.publish(audioResult.track)
            agoraStore.setLocalAudioMuted(false)
            emitter.emit('local-audio-ready', { track: audioResult.track })
          }
        }
      }
    } catch (error) {
      console.error('Mikrofon değiştirilemedi:', error)
      throw error
    }
  }

  /**
   * Bekleyen abonelikleri işler
   * @param {number} uid - Kullanıcı ID'si
   */
  const processPendingSubscriptions = async (uid) => {
    const pending = pendingSubscriptions.value.get(uid)
    if (!pending) return
    
    for (const mediaType of pending) {
      try {
        await subscribeToUserTrack(uid, mediaType)
      } catch (error) {
        console.error(`Bekleyen ${mediaType} aboneliği işlenemedi kullanıcı ${uid} için:`, error)
      }
    }
    
    pendingSubscriptions.value.delete(uid)
  }

  /**
   * Kullanıcının track'ine abone olur
   * @param {number} uid - Kullanıcı ID'si
   * @param {string} mediaType - Medya türü ('audio' veya 'video')
   * @param {number} retryCount - Tekrar deneme sayısı
   */
  const subscribeToUserTrack = async (uid, mediaType, retryCount = 0) => {
    try {
      const users = client.value.remoteUsers || []
      const user = users.find(u => u.uid === uid)
      
      if (!user) {
        if (retryCount < 3) {
          setTimeout(() => subscribeToUserTrack(uid, mediaType, retryCount + 1), 1000)
          return
        } else {
          return
        }
      }

      await client.value.subscribe(user, mediaType)
      
      const track = mediaType === 'audio' ? user.audioTrack : user.videoTrack
      
      if (track) {
        if (mediaType === 'audio') {
          remoteAudioTracks.value.set(uid, track)
          agoraStore.setVideoRemoteTrack(uid, 'audio', track)
        } else {
          remoteVideoTracks.value.set(uid, track)
          agoraStore.setVideoRemoteTrack(uid, 'video', track)
        }
        
        const currentUser = agoraStore.videoRemoteUsers.find(u => u.uid === uid)
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            [mediaType === 'audio' ? 'hasAudio' : 'hasVideo']: true
          }
          agoraStore.addVideoRemoteUser(updatedUser)
        }
        
        if (mediaType === 'audio') {
          emitter.emit('remote-audio-ready', { uid, track })
        } else if (mediaType === 'video') {
          emitter.emit('remote-video-ready', { uid, track })
        }
      }
    } catch (error) {
      console.error(`Kullanıcı ${uid}'den ${mediaType} aboneliği başarısız:`, error)
      throw error
    }
  }

  /**
   * Event listener'ları ayarlar
   * @param {Object} client - Agora client
   */
  const setupEventListeners = (client) => {
    if (!client) return

    // Kullanıcı katıldı
    client.on('user-joined', (user) => {
      if (agoraStore.isLocalUID(user.uid)) return;
      // UID zaten herhangi bir remote listede varsa ekleme
      if (
        agoraStore.videoRemoteUsers.some(u => u.uid === user.uid) ||
        agoraStore.screenRemoteUsers.some(u => u.uid === user.uid)
      ) {
        console.log('Remote user zaten mevcut, tekrar eklenmedi:', user.uid)
        return;
      }
      const remoteUser = {
        uid: user.uid,
        name: getRemoteUserDisplayName(user),
        isLocal: false,
        hasVideo: false,
        hasAudio: false,
        isMuted: false,
        isVideoOff: false,
        isScreenShare: false
      }
      agoraStore.addVideoRemoteUser(remoteUser)
      emitter.emit('user-joined', remoteUser)
      processPendingSubscriptions(user.uid)
    });

    // Kullanıcı ayrıldı
    client.on('user-left', (user) => {
      if (agoraStore.isLocalUID(user.uid)) return
      
      remoteAudioTracks.value.delete(user.uid)
      remoteVideoTracks.value.delete(user.uid)
      agoraStore.removeVideoRemoteUser(user.uid)
      pendingSubscriptions.value.delete(user.uid)
      
      emitter.emit('user-left', { uid: user.uid })
    })

    // Kullanıcı yayınlandı
    client.on('user-published', async (user, mediaType) => {
      if (agoraStore.isLocalUID(user.uid)) return
      
      const existingUser = agoraStore.videoRemoteUsers.find(u => u.uid === user.uid)
      
      if (!existingUser) {
        if (!pendingSubscriptions.value.has(user.uid)) {
          pendingSubscriptions.value.set(user.uid, [])
        }
        pendingSubscriptions.value.get(user.uid).push(mediaType)
        return
      }
      
      try {
        await subscribeToUserTrack(user.uid, mediaType)
      } catch (error) {
        console.error('Video kullanıcısından abone olunamadı', mediaType, user.uid, ':', error)
      }

      const updates = {};
      if (mediaType === 'audio') updates.isMuted = false;
      if (mediaType === 'video') updates.isVideoOff = false;
      
      const currentUser = agoraStore.videoRemoteUsers.find(u => u.uid === user.uid)
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates }
        agoraStore.addVideoRemoteUser(updatedUser)
      }
    })

    // Kullanıcı yayından kaldırıldı
    client.on('user-unpublished', (user, mediaType) => {
      if (agoraStore.isLocalUID(user.uid)) return
      
      if (mediaType === 'audio') {
        remoteAudioTracks.value.delete(user.uid)
        const currentUser = agoraStore.videoRemoteUsers.find(u => u.uid === user.uid)
        if (currentUser) {
          const updatedUser = { ...currentUser, hasAudio: false }
          agoraStore.addVideoRemoteUser(updatedUser)
        }
      } else if (mediaType === 'video') {
        remoteVideoTracks.value.delete(user.uid)
        const currentUser = agoraStore.videoRemoteUsers.find(u => u.uid === user.uid)
        if (currentUser) {
          const updatedUser = { ...currentUser, hasVideo: false }
          agoraStore.addVideoRemoteUser(updatedUser)
        }
        
        emitter.emit('remote-video-unpublished', { uid: user.uid })
      }
      
      emitter.emit('user-unpublished', { user, mediaType })

      const updates = {};
      if (mediaType === 'audio') updates.isMuted = true;
      if (mediaType === 'video') updates.isVideoOff = true;
      
      const currentUser = agoraStore.videoRemoteUsers.find(u => u.uid === user.uid)
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates }
        agoraStore.addVideoRemoteUser(updatedUser)
      }
    })

    // Bağlantı durumu
    client.on('connection-state-change', (curState) => {
      const connected = curState === 'CONNECTED'
      agoraStore.setVideoConnected(connected)
      emitter.emit('connection-state-change', { connected })
    })
  }

  /**
   * Tüm kaynakları temizler
   * Event listener'ları kaldırır ve client'ı sıfırlar
   */
  const cleanup = () => {
    if (client.value) {
      client.value.removeAllListeners()
    }
    agoraStore.resetVideo()
    remoteAudioTracks.value.clear()
    remoteVideoTracks.value.clear()
    pendingSubscriptions.value.clear()
    
    if (cameraToggleTimeout) {
      clearTimeout(cameraToggleTimeout)
    }
  }

  onUnmounted(cleanup)

  return {
    emitter,
    isJoining,
    isLeaving,
    joinChannel,
    leaveChannel,
    toggleCamera,
    toggleMicrophone,
    generateVideoUID,
    cleanup
  }
} 