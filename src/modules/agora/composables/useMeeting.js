import { computed, ref } from 'vue'
import { useVideo } from './useVideo.js'
import { useScreenShare } from './useScreenShare.js'
import { useStreamQuality } from './useStreamQuality.js'
import { useAgoraStore } from '../store/index.js'
import { DEFAULTS } from '../constants.js'
import { createToken } from '../services/tokenService.js'
import { useLogger } from './useLogger.js'
import { useLayoutStore } from '../store/layout.js'

const { 
  logUI, 
  logError, 
  logWarn, 
  logInfo, 
  logDebug, 
  logVideo, 
  logScreen, 
  logQuality, 
  trackPerformance, 
  trackUserAction,
  logs,
  logStats,
  getFilteredLogs,
  clearLogs,
  exportLogs
} = useLogger()

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
  
  // Ekran paylaşımı desteğini useScreenShare'den al
  const { supportsScreenShare } = useScreenShare(agoraStore)
  
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
    centralEmitter,
    isJoining: isVideoJoining,
    isLeaving: isVideoLeaving,
    generateVideoUID,
    cleanup: cleanupVideo,
    checkDeviceStatus
  } = useVideo(agoraStore)
  
  // Ekran paylaşımı composable'ından tüm işlemleri al
  const {
    joinScreenChannel,
    leaveScreenChannel,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare,
    generateScreenUID,
    isJoining: isScreenJoining,
    isLeaving: isScreenLeaving,
    cleanup: cleanupScreen
  } = useScreenShare(agoraStore)

  // Computed properties - Store'dan gelen değerleri reactive olarak hesapla
  const isConnected = computed(() => agoraStore.clients.video.isConnected) // Video bağlantısı durumu
  const isInitialized = computed(() => agoraStore.clients.video.isInitialized) // Video client başlatma durumu
  const localUser = computed(() => agoraStore.users.local.video) // Yerel kullanıcı bilgileri
  const remoteUsers = computed(() => agoraStore.users.remote.filter(u => !u.isScreenShare)) // Uzak kullanıcılar listesi
  const allUsers = computed(() => agoraStore.allUsers) // Tüm kullanıcılar (yerel + uzak + ekran paylaşımı)
  const connectedUsersCount = computed(() => agoraStore.connectedUsersCount) // Bağlı kullanıcı sayısı
  const isLocalVideoOff = computed(() => agoraStore.isLocalVideoOff) // Yerel video kapalı mı?
  const isLocalAudioMuted = computed(() => agoraStore.isLocalAudioMuted) // Yerel ses kapalı mı?
  const isScreenSharing = computed(() => agoraStore.isScreenSharing) // Ekran paylaşımı aktif mi?
  const screenShareUser = computed(() => agoraStore.users.local.screen) // Ekran paylaşımı kullanıcısı
  const localTracks = computed(() => agoraStore.tracks.local.video) // Yerel track'ler
  const remoteTracks = computed(() => agoraStore.tracks.remote) // Uzak track'ler
  
  // Cihaz durumları
  const canUseCamera = computed(() => {
    return agoraStore.devices?.hasCamera && agoraStore.devices?.cameraPermission === 'granted'
  })
  
  const canUseMicrophone = computed(() => {
    return agoraStore.devices?.hasMicrophone && agoraStore.devices?.microphonePermission === 'granted'
  })

  /**
   * Kapsamlı temizlik işlemi - Tüm kaynakları temizler
   */
  const clean = async () => {
    try {
      logUI('Kapsamlı temizlik başlatılıyor...')
      
      // Önce mevcut bağlantıları kapat
      if (isConnected.value) {
        await leaveChannel()
      }
      
      // Tüm kaynakları temizle
      cleanup()
      
      // Store'u sıfırla
      agoraStore.reset()
      
      // Yayın kalitesi izlemeyi durdur
      stopMonitoring()
      
      // Current channel'ı sıfırla
      currentChannel.value = ''
      
      logUI('Kapsamlı temizlik tamamlandı')
    } catch (error) {
      logError(error, { context: 'clean' })
      // Temizlik hatası olsa bile devam et
    }
  }

  /**
   * Kanala katılma işlemi - Token dışarıdan alınır
   * @param {Object} joinParams - Katılma parametreleri
   * @param {string} joinParams.channelName - Katılınacak kanal adı
   * @param {string} joinParams.token - Token
   * @param {number} joinParams.uid - Kullanıcı ID'si
   * @param {string} [joinParams.appId] - App ID (opsiyonel)
   */
  const joinChannel = async (joinParams) => {
    try {
      const { channelName, token, uid, appId } = joinParams
      
      // Her girişten önce kapsamlı temizlik yap
      await clean()
      
      // Önce store'a kanal adını kaydet
      agoraStore.setVideoChannelName(channelName)
      currentChannel.value = channelName
      
      // App ID'yi store'a kaydet (varsa)
      if (appId) {
        agoraStore.setAppId(appId)
      }
      
      // Layout'u kanala ilk kez katıldığında grid'e sıfırla
      const layoutStore = useLayoutStore()
      if (layoutStore.currentLayout !== 'grid') {
        logUI('Kanala ilk kez katılındı, layout grid\'e sıfırlanıyor')
        layoutStore.switchLayoutWithSave('grid')
      }
      
      // Video client ile kanala katıl
      await joinVideoChannel({
        appId: appId || agoraStore.appId,
        token: token,
        channelName,
        uid: uid,
        userName: `${DEFAULTS.USER_NAME} ${uid}`
      })
      
      // Yayın kalitesi izlemeyi başlat
      if (agoraStore.clients.video.client) {
        startMonitoring(agoraStore.clients.video.client)
      }
      
      logUI('Video kanalına başarıyla katılındı', { channelName, uid })
    } catch (error) {
      logError(error, { context: 'joinChannel', channelName: joinParams.channelName })
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
      
      // Ekran paylaşımı state'ini sıfırla
      agoraStore.setScreenSharing(false)
      
      // Yayın kalitesi izlemeyi durdur
      stopMonitoring()
      
      logUI('Her iki kanaldan da başarıyla ayrıldı')
    } catch (error) {
      logError(error, { context: 'leaveChannel' })
      throw error
    }
  }

  /**
   * Mikrofon durumunu debug etmek için yardımcı fonksiyon
   * Mikrofon track'inin durumunu ve store'daki değerleri kontrol eder
   */
  const debugMicrophoneStatus = () => {
    logUI('=== MİKROFON DURUMU HATA AYIKLAMA ===', {
      isLocalAudioMuted: agoraStore.isLocalAudioMuted,
      hasAudioTrack: !!agoraStore.tracks.local.video.audio
    })
    
    if (agoraStore.tracks.local.video.audio) {
      const audioTrack = agoraStore.tracks.local.video.audio
      logUI('Ses track detayları', {
        enabled: audioTrack.enabled,
        readyState: audioTrack.readyState,
        muted: audioTrack.muted,
        _closed: audioTrack._closed,
        id: audioTrack.id,
        kind: audioTrack.kind
      })
    } else {
      logUI('Store\'da ses track\'i bulunamadı')
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
    // Logger - Logging işlemleri
    logUI,
    logError,
    logWarn,
    logInfo,
    logDebug,
    logVideo,
    logScreen,
    logQuality,
    trackPerformance,
    trackUserAction,
    
    // Log yönetimi - Log management
    logs,
    logStats,
    getFilteredLogs,
    clearLogs,
    exportLogs,
    
    // State - Durum değişkenleri
    isConnected,
    isInitialized,
    localUser,
    remoteUsers,
    allUsers,
    connectedUsersCount,
    isLocalVideoOff,
    isLocalAudioMuted,
    canUseCamera,
    canUseMicrophone,
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
    centralEmitter,
    
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
    clean,
    
    // Debug Metodları - Hata ayıklama işlemleri
    debugMicrophoneStatus,
    checkDeviceStatus
  }
} 