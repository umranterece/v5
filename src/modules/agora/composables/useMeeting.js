import { computed, ref } from 'vue'
import { useVideo } from './useVideo.js'
import { useScreenShare } from './useScreenShare.js'
import { useDeviceDetection } from './useDeviceDetection.js'
import { useStreamQuality } from './useStreamQuality.js'
import { useAgoraStore } from '../store/index.js'
import { DEFAULTS } from '../constants.js'
import { createToken } from '../services/tokenService.js'

/**
 * Toplantı Composable - Video konferans işlemlerini yönetir ve tüm alt composable'ları koordine eder
 * Bu composable, video, ekran paylaşımı, cihaz tespiti ve yayın kalitesi işlemlerini birleştirir
 * ve tek bir interface üzerinden tüm toplantı işlemlerini yönetir.
 * @module composables/useMeeting
 */
export function useMeeting() {
  // Store'ları initialize et
  const agoraStore = useAgoraStore()
  const currentChannel = ref('') // Mevcut kanal adını tutar
  
  // Cihaz tespiti composable'ından ekran paylaşımı desteğini al
  const { supportsScreenShare } = useDeviceDetection()
  
  // Yayın kalitesi izleme composable'ından tüm özellikleri al
  const {
    networkQuality,
    bitrate,
    frameRate,
    packetLoss,
    rtt,
    qualityLevel,
    isMonitoring,
    qualityColor,
    qualityPercentage,
    startMonitoring,
    stopMonitoring
  } = useStreamQuality()
  
  // Video composable'ından tüm işlemleri al
  const {
    joinChannel: joinVideoChannel,
    leaveChannel: leaveVideoChannel,
    toggleCamera,
    toggleMicrophone,
    emitter: videoEmitter,
    isJoining: isVideoJoining,
    isLeaving: isVideoLeaving,
    generateVideoUID,
    cleanup: cleanupVideo
  } = useVideo(agoraStore)
  
  // Ekran paylaşımı composable'ından tüm işlemleri al
  const {
    joinScreenChannel,
    leaveScreenChannel,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
    generateScreenUID,
    emitter: screenEmitter,
    isJoining: isScreenJoining,
    isLeaving: isScreenLeaving,
    cleanup: cleanupScreen
  } = useScreenShare(agoraStore)

  // Computed properties - Store'dan gelen değerleri reactive olarak hesapla
  const isConnected = computed(() => agoraStore.isVideoConnected) // Video bağlantısı durumu
  const isInitialized = computed(() => agoraStore.isVideoInitialized) // Video client başlatma durumu
  const localUser = computed(() => agoraStore.videoLocalUser) // Yerel kullanıcı bilgileri
  const remoteUsers = computed(() => agoraStore.videoRemoteUsers) // Uzak kullanıcılar listesi
  const allUsers = computed(() => agoraStore.allUsers) // Tüm kullanıcılar (yerel + uzak + ekran paylaşımı)
  const connectedUsersCount = computed(() => agoraStore.connectedUsersCount) // Bağlı kullanıcı sayısı
  const isLocalVideoOff = computed(() => agoraStore.isLocalVideoOff) // Yerel video kapalı mı?
  const isLocalAudioMuted = computed(() => agoraStore.isLocalAudioMuted) // Yerel ses kapalı mı?
  const isScreenSharing = computed(() => agoraStore.isScreenSharing) // Ekran paylaşımı aktif mi?
  const screenShareUser = computed(() => agoraStore.screenLocalUser) // Ekran paylaşımı kullanıcısı
  const localTracks = computed(() => agoraStore.videoLocalTracks) // Yerel track'ler
  const remoteTracks = computed(() => agoraStore.videoRemoteTracks) // Uzak track'ler

  /**
   * Kanala katılma işlemi - Token yönetimi ile birlikte
   * @param {string} channelName - Katılınacak kanal adı
   */
  const joinChannel = async (channelName) => {
    try {
      // Sadece video için UID oluştur
      const videoUID = generateVideoUID()
      // Sadece video için token al
      const videoTokenData = await createToken(channelName, videoUID)
      // Video client ile kanala katıl
      await joinVideoChannel({
        appId: videoTokenData.app_id,
        token: videoTokenData.token,
        channelName,
        uid: videoUID,
        userName: `${DEFAULTS.USER_NAME} ${videoUID}`
      })
      agoraStore.videoChannelName = channelName // Store'a kanal adını kaydet
      currentChannel.value = channelName
      
      // Yayın kalitesi izlemeyi başlat
      if (agoraStore.videoClient) {
        startMonitoring(agoraStore.videoClient)
      }
      
      console.log('Video kanalına başarıyla katılındı:', channelName)
    } catch (error) {
      console.error('Video kanalına katılma başarısız:', error)
      throw error
    }
  }

  /**
   * Kanaldan ayrılma işlemi - Hem video hem ekran paylaşımı kanallarından çıkar
   */
  const leaveChannel = async () => {
    try {
      await leaveVideoChannel()
      await leaveScreenChannel()
      currentChannel.value = ''
      
      // Yayın kalitesi izlemeyi durdur
      stopMonitoring()
      
      console.log('Her iki kanaldan da başarıyla ayrılındı')
    } catch (error) {
      console.error('Kanallardan ayrılma başarısız:', error)
      throw error
    }
  }

  /**
   * Mikrofon durumunu debug etmek için yardımcı fonksiyon
   * Mikrofon track'inin durumunu ve store'daki değerleri kontrol eder
   */
  const debugMicrophoneStatus = () => {
    console.log('=== MİKROFON DURUMU DEBUG ===')
    console.log('Store isLocalAudioMuted:', agoraStore.isLocalAudioMuted)
    console.log('Store localTracks.audio:', agoraStore.videoLocalTracks.audio)
    
    if (agoraStore.videoLocalTracks.audio) {
      const audioTrack = agoraStore.videoLocalTracks.audio
      console.log('Ses track detayları:', {
        enabled: audioTrack.enabled,
        readyState: audioTrack.readyState,
        muted: audioTrack.muted,
        _closed: audioTrack._closed,
        id: audioTrack.id,
        kind: audioTrack.kind
      })
    } else {
      console.log('Store\'da ses track\'i bulunamadı')
    }
  }
  
  /**
   * Tüm kaynakları temizle - Video ve ekran paylaşımı composable'larını temizler
   */
  const cleanup = () => {
    cleanupVideo()
    cleanupScreen()
  }

  return {
    // State - Durum değişkenleri
    isConnected,
    isInitialized,
    localUser,
    remoteUsers,
    allUsers,
    connectedUsersCount,
    isLocalVideoOff,
    isLocalAudioMuted,
    isScreenSharing,
    screenShareUser,
    localTracks,
    remoteTracks,
    supportsScreenShare,
    isJoining: isVideoJoining,
    isLeaving: isVideoLeaving,
    currentChannel,
    
    // Yayın Kalitesi - Stream quality değerleri
    networkQuality,
    bitrate,
    frameRate,
    packetLoss,
    rtt,
    qualityLevel,
    qualityColor,
    qualityPercentage,
    
    // Event emitters - Olay yayıncıları
    emitter: videoEmitter,
    screenEmitter,
    
    // Video Metodları - Video işlemleri
    joinChannel,
    leaveChannel,
    toggleCamera,
    toggleMicrophone,
    
    // Ekran Paylaşımı Metodları - Screen share işlemleri
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
    
    // Temizlik - Cleanup işlemleri
    cleanup,
    
    // Debug Metodları - Hata ayıklama işlemleri
    debugMicrophoneStatus
  }
} 