import { computed, ref } from 'vue'
import { useVideo } from './useVideo.js'
import { useVideoStore } from '../store/index.js'
import { AGORA_CONFIG, VIDEO_CONFIG, AUDIO_CONFIG, DEFAULTS } from '../constants.js'

/**
 * Main Agora Composable - Tüm Agora işlemlerini toplar
 * @module composables/useAgora
 */
export function useAgora() {
  // Store'ları initialize et
  const videoStore = useVideoStore()
  const currentChannel = ref('')
  
  // Config'i hazırla
  const config = {
    AGORA_CONFIG,
    VIDEO_CONFIG,
    AUDIO_CONFIG
  }
  
  // Video composable'ından tüm işlemleri al
  const {
    joinChannel: joinChannelInternal,
    leaveChannel: leaveChannelInternal,
    toggleCamera,
    toggleMicrophone,
    emitter,
    isJoining,
    isLeaving,
    cleanup
  } = useVideo(videoStore, config)

  // Computed properties
  const isConnected = computed(() => videoStore.isConnected)
  const isInitialized = computed(() => videoStore.isInitialized)
  const localUser = computed(() => videoStore.localUser)
  const remoteUsers = computed(() => videoStore.remoteUsers)
  const allUsers = computed(() => videoStore.allUsers)
  const connectedUsersCount = computed(() => videoStore.connectedUsersCount)
  const isLocalVideoOff = computed(() => videoStore.isLocalVideoOff)
  const isLocalAudioMuted = computed(() => videoStore.isLocalAudioMuted)

  // Get token from API
  const getToken = async (channelName, uid) => {
    try {
      const response = await fetch('https://umranterece.com/test/agora/createToken.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel_name: channelName,
          uid: uid,
          role: DEFAULTS.ROLE_PUBLISHER, // Publisher role
          expire_time: DEFAULTS.TOKEN_EXPIRE_TIME // 24 hours
        })
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get token')
      }

      console.log('Token response:', result)
      return result.data // Return the entire data object (token, app_id, channel_name)
    } catch (error) {
      console.error('Failed to get token:', error)
      throw new Error('Failed to get token from server')
    }
  }

  // Join channel with token handling
  const joinChannel = async (channelName) => {
    try {
      // Generate random UID using constants
      const uid = Math.floor(Math.random() * (DEFAULTS.UID_MAX - DEFAULTS.UID_MIN)) + DEFAULTS.UID_MIN
      
      // Get token and app ID from API
      const tokenData = await getToken(channelName, uid)
      
      // Join channel
      await joinChannelInternal({
        appId: tokenData.app_id,
        token: tokenData.token,
        channelName,
        uid,
        userName: `${DEFAULTS.USER_NAME} ${uid}`
      })
      
      currentChannel.value = channelName
      console.log('Successfully joined channel:', channelName)
      
    } catch (error) {
      console.error('Failed to join channel:', error)
      throw error
    }
  }

  // Leave channel
  const leaveChannel = async () => {
    try {
      await leaveChannelInternal()
      currentChannel.value = ''
      console.log('Successfully left channel')
    } catch (error) {
      console.error('Failed to leave channel:', error)
      throw error
    }
  }

  // Debug function to check microphone status
  const debugMicrophoneStatus = () => {
    console.log('=== MICROPHONE STATUS DEBUG ===')
    console.log('Store isLocalAudioMuted:', videoStore.isLocalAudioMuted)
    console.log('Store localTracks.audio:', videoStore.localTracks.audio)
    
    if (videoStore.localTracks.audio) {
      const audioTrack = videoStore.localTracks.audio
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
    isJoining,
    isLeaving,
    currentChannel,
    
    // Event emitter
    emitter,
    
    // Video Methods
    joinChannel,
    leaveChannel,
    toggleCamera,
    toggleMicrophone,
    cleanup,
    
    // Debug Methods
    debugMicrophoneStatus
  }
} 