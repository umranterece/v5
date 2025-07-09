import { ref, onUnmounted } from 'vue'
import AgoraRTC from 'agora-rtc-sdk-ng'
import mitt from 'mitt'
import { AGORA_CONFIG, USER_ID_RANGES, CHANNEL_NAMES } from '../constants.js'
import { useTrackManagement } from './useTrackManagement.js'

/**
 * Video/Audio Composable - Video client işlemlerini yönetir
 * @module composables/useVideo
 */
export function useVideo(agoraStore) {
  const client = ref(null)
  const emitter = mitt()
  
  const isJoining = ref(false)
  const isLeaving = ref(false)
  
  // Track management
  const remoteAudioTracks = ref(new Map())
  const remoteVideoTracks = ref(new Map())
  
  // Pending subscriptions
  const pendingSubscriptions = ref(new Map())
  
  // Debounce for camera toggle
  let cameraToggleTimeout = null
  let isCameraToggling = false

  // Track management composable
  const { isTrackValid, createAudioTrack, createVideoTrack, cleanupTrack } = useTrackManagement()

  // Generate UID for video
  const generateVideoUID = () => {
    return Math.floor(Math.random() * (USER_ID_RANGES.VIDEO.MAX - USER_ID_RANGES.VIDEO.MIN)) + USER_ID_RANGES.VIDEO.MIN
  }

  // Initialize client
  const initializeClient = async (appId) => {
    try {
      const agoraClient = AgoraRTC.createClient(AGORA_CONFIG)
      client.value = agoraClient
      agoraStore.setVideoClient(agoraClient)
      setupEventListeners(agoraClient)
      agoraStore.setVideoInitialized(true)
    } catch (error) {
      console.error('Failed to initialize video client:', error)
      throw error
    }
  }

  // Join channel
  const joinChannel = async ({ token, channelName, uid, userName = 'User', appId }) => {
    if (isJoining.value) return

    try {
      isJoining.value = true
      
      if (!client.value) {
        await initializeClient(appId)
      }

      // Clear previous state
      remoteAudioTracks.value.clear()
      remoteVideoTracks.value.clear()
      pendingSubscriptions.value.clear()

      // Set local user
      const localUser = {
        uid,
        name: userName,
        isLocal: true,
        hasVideo: false,
        hasAudio: false,
        isMuted: false,
        isVideoOff: false,
        isScreenShare: false
      }
      agoraStore.setVideoLocalUser(localUser)

      // Join video channel
      const videoChannelName = CHANNEL_NAMES.VIDEO(channelName)
      await client.value.join(appId, videoChannelName, token, uid)
      
      // Create and publish tracks
      await createLocalTracks()
      
      agoraStore.setVideoConnected(true)
      isJoining.value = false
      return { success: true }
      
    } catch (error) {
      isJoining.value = false
      console.error('Failed to join video channel:', error)
      throw error
    }
  }

  // Leave channel
  const leaveChannel = async () => {
    if (!client.value) return

    try {
      isLeaving.value = true
      
      // Stop local tracks
      if (agoraStore.videoLocalTracks.audio) {
        cleanupTrack(agoraStore.videoLocalTracks.audio)
      }
      if (agoraStore.videoLocalTracks.video) {
        cleanupTrack(agoraStore.videoLocalTracks.video)
      }

      await client.value.leave()
      agoraStore.resetVideo()
      
      // Clear state
      remoteAudioTracks.value.clear()
      remoteVideoTracks.value.clear()
      pendingSubscriptions.value.clear()
      
    } catch (error) {
      console.error('Failed to leave video channel:', error)
    } finally {
      isLeaving.value = false
    }
  }

  // Create local tracks
  const createLocalTracks = async () => {
    try {
      // Create audio track
      const audioResult = await createAudioTrack()
      if (audioResult.success) {
        agoraStore.setVideoLocalTrack('audio', audioResult.track)
        agoraStore.setLocalAudioMuted(false)
        emitter.emit('local-audio-ready', { track: audioResult.track })
      } else {
        agoraStore.setVideoLocalTrack('audio', null)
        agoraStore.setLocalAudioMuted(true)
      }

      // Create video track
      const videoResult = await createVideoTrack()
      if (videoResult.success) {
        agoraStore.setVideoLocalTrack('video', videoResult.track)
        agoraStore.setLocalVideoOff(false)
        emitter.emit('local-video-ready', { track: videoResult.track })
      } else {
        agoraStore.setVideoLocalTrack('video', null)
        agoraStore.setLocalVideoOff(true)
      }

      // Publish tracks
      const tracksToPublish = [];
      if (agoraStore.videoLocalTracks.audio) tracksToPublish.push(agoraStore.videoLocalTracks.audio);
      if (agoraStore.videoLocalTracks.video) tracksToPublish.push(agoraStore.videoLocalTracks.video);
      if (tracksToPublish.length) {
        await client.value.publish(tracksToPublish);
      }

    } catch (error) {
      console.error('Failed to create local tracks:', error)
      throw error
    }
  }

  // Toggle camera
  const toggleCamera = async (off) => {
    if (isCameraToggling) return
    
    if (cameraToggleTimeout) {
      clearTimeout(cameraToggleTimeout)
    }
    
    isCameraToggling = true
    
    try {
      if (off) {
        if (agoraStore.videoLocalTracks.video && isTrackValid(agoraStore.videoLocalTracks.video)) {
          await client.value.unpublish(agoraStore.videoLocalTracks.video)
          cleanupTrack(agoraStore.videoLocalTracks.video)
          agoraStore.setVideoLocalTrack('video', null)
        }
        agoraStore.setLocalVideoOff(true)
      } else {
        const videoResult = await createVideoTrack()
        if (videoResult.success) {
          agoraStore.setVideoLocalTrack('video', videoResult.track)
          await client.value.publish(videoResult.track)
          agoraStore.setLocalVideoOff(false)
          emitter.emit('local-video-ready', { track: videoResult.track })
        }
      }
    } catch (error) {
      console.error('Failed to toggle camera:', error)
      throw error
    } finally {
      cameraToggleTimeout = setTimeout(() => {
        isCameraToggling = false
      }, 1000)
    }
  }

  // Toggle microphone
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
      console.error('Failed to toggle microphone:', error)
      throw error
    }
  }

  // Process pending subscriptions
  const processPendingSubscriptions = async (uid) => {
    const pending = pendingSubscriptions.value.get(uid)
    if (!pending) return
    
    for (const mediaType of pending) {
      try {
        await subscribeToUserTrack(uid, mediaType)
      } catch (error) {
        console.error(`Failed to process pending ${mediaType} subscription for user ${uid}:`, error)
      }
    }
    
    pendingSubscriptions.value.delete(uid)
  }

  // Subscribe to user track
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
      console.error(`Failed to subscribe to ${mediaType} from user ${uid}:`, error)
      throw error
    }
  }

  // Setup event listeners
  const setupEventListeners = (client) => {
    if (!client) return

    // User joined
    client.on('user-joined', (user) => {
      if (agoraStore.isLocalUID(user.uid)) return
      
      const remoteUser = {
        uid: user.uid,
        name: `User ${user.uid}`,
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
    })

    // User left
    client.on('user-left', (user) => {
      if (agoraStore.isLocalUID(user.uid)) return
      
      remoteAudioTracks.value.delete(user.uid)
      remoteVideoTracks.value.delete(user.uid)
      agoraStore.removeVideoRemoteUser(user.uid)
      pendingSubscriptions.value.delete(user.uid)
      
      emitter.emit('user-left', { uid: user.uid })
    })

    // User published
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
        console.error('Failed to subscribe to', mediaType, 'from video user', user.uid, ':', error)
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

    // User unpublished
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

    // Connection state
    client.on('connection-state-change', (curState) => {
      const connected = curState === 'CONNECTED'
      agoraStore.setVideoConnected(connected)
      emitter.emit('connection-state-change', { connected })
    })
  }

  // Cleanup
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