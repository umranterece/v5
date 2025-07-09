import { computed, ref } from 'vue'
import { useVideo } from './useVideo.js'
import { useScreenShare } from './useScreenShare.js'
import { useDeviceDetection } from './useDeviceDetection.js'
import { useStreamQuality } from './useStreamQuality.js'
import { useAgoraStore } from '../store/index.js'
import { DEFAULTS } from '../constants.js'
import { createToken } from '../services/tokenService.js'

/**
 * Meeting Composable - Video konferans işlemlerini yönetir
 * @module composables/useMeeting
 */
export function useMeeting() {
  // Store'ları initialize et
  const agoraStore = useAgoraStore()
  const currentChannel = ref('')
  
  // Device detection
  const { supportsScreenShare } = useDeviceDetection()
  
  // Stream quality monitoring
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
  
  // Screen share composable'ından tüm işlemleri al
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

  // Computed properties
  const isConnected = computed(() => agoraStore.isVideoConnected)
  const isInitialized = computed(() => agoraStore.isVideoInitialized)
  const localUser = computed(() => agoraStore.videoLocalUser)
  const remoteUsers = computed(() => agoraStore.videoRemoteUsers)
  const allUsers = computed(() => agoraStore.allUsers)
  const connectedUsersCount = computed(() => agoraStore.connectedUsersCount)
  const isLocalVideoOff = computed(() => agoraStore.isLocalVideoOff)
  const isLocalAudioMuted = computed(() => agoraStore.isLocalAudioMuted)
  const isScreenSharing = computed(() => agoraStore.isScreenSharing)
  const screenShareUser = computed(() => agoraStore.screenLocalUser)
  const localTracks = computed(() => agoraStore.videoLocalTracks)
  const remoteTracks = computed(() => agoraStore.videoRemoteTracks)

  // Join channel with token handling
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
      agoraStore.videoChannelName = channelName // <-- store'a kaydet
      currentChannel.value = channelName
      
      // Stream quality monitoring başlat
      if (agoraStore.videoClient) {
        startMonitoring(agoraStore.videoClient)
      }
      
      console.log('Successfully joined video channel:', channelName)
    } catch (error) {
      console.error('Failed to join video channel:', error)
      throw error
    }
  }

  // Leave channel
  const leaveChannel = async () => {
    try {
      await leaveVideoChannel()
      await leaveScreenChannel()
      currentChannel.value = ''
      
      // Stream quality monitoring durdur
      stopMonitoring()
      
      console.log('Successfully left both channels')
    } catch (error) {
      console.error('Failed to leave channels:', error)
      throw error
    }
  }

  // Debug function to check microphone status
  const debugMicrophoneStatus = () => {
    console.log('=== MICROPHONE STATUS DEBUG ===')
    console.log('Store isLocalAudioMuted:', agoraStore.isLocalAudioMuted)
    console.log('Store localTracks.audio:', agoraStore.videoLocalTracks.audio)
    
    if (agoraStore.videoLocalTracks.audio) {
      const audioTrack = agoraStore.videoLocalTracks.audio
      console.log('Audio track details:', {
        enabled: audioTrack.enabled,
        readyState: audioTrack.readyState,
        muted: audioTrack.muted,
        _closed: audioTrack._closed,
        id: audioTrack.id,
        kind: audioTrack.kind
      })
    } else {
      console.log('No audio track found in store')
    }
  }
  
  // Combined cleanup
  const cleanup = () => {
    cleanupVideo()
    cleanupScreen()
  }

  return {
    // State
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
    
    // Stream Quality
    networkQuality,
    bitrate,
    frameRate,
    packetLoss,
    rtt,
    qualityLevel,
    qualityColor,
    qualityPercentage,
    
    // Event emitters
    emitter: videoEmitter,
    screenEmitter,
    
    // Video Methods
    joinChannel,
    leaveChannel,
    toggleCamera,
    toggleMicrophone,
    
    // Screen Share Methods
    toggleScreenShare,
    startScreenShare,
    stopScreenShare,
    
    // Cleanup
    cleanup,
    
    // Debug Methods
    debugMicrophoneStatus
  }
} 