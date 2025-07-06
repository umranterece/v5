import { ref, onUnmounted } from 'vue'
import AgoraRTC from 'agora-rtc-sdk-ng'
import mitt from 'mitt'

/**
 * Video/Audio Composable
 * @module composables/useVideo
 */
export function useVideo(videoStore, config) {
  const client = ref(null)
  const emitter = mitt()
  
  const isJoining = ref(false)
  const isLeaving = ref(false)
  
  // Track management
  const remoteAudioTracks = ref(new Map())
  const remoteVideoTracks = ref(new Map())
  
  // Pending subscriptions - wait for user to be confirmed in channel
  const pendingSubscriptions = ref(new Map())
  
  // Debounce for camera toggle to prevent rapid switching
  let cameraToggleTimeout = null
  let isCameraToggling = false

  // Helper function to check if track is valid and enabled
  const isTrackValid = (track) => {
    return track && 
           typeof track.setEnabled === 'function' && 
           typeof track.play === 'function' &&
           !track._closed &&
           track.readyState !== 'ended' &&
           track.readyState !== 'failed'
  }

  // Initialize client
  const initializeClient = async (appId) => {
    try {
      client.value = AgoraRTC.createClient(config.AGORA_CONFIG)
      setupEventListeners()
      videoStore.setInitialized(true)
      console.log('Client initialized')
    } catch (error) {
      console.error('Failed to initialize client:', error)
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
        isVideoOff: false
      }
      videoStore.setLocalUser(localUser)

      // Join channel
      await client.value.join(appId, channelName, token, uid)
      console.log('Joined channel successfully')
      
      // Create and publish tracks
      await createLocalTracks()
      
      isJoining.value = false
      return { success: true }
      
    } catch (error) {
      isJoining.value = false
      console.error('Failed to join channel:', error)
      throw error
    }
  }

  // Leave channel
  const leaveChannel = async () => {
    if (!client.value) return

    try {
      isLeaving.value = true
      
      // Stop local tracks
      if (videoStore.localTracks.audio) {
        videoStore.localTracks.audio.stop()
        videoStore.localTracks.audio.close()
      }
      if (videoStore.localTracks.video) {
        videoStore.localTracks.video.stop()
        videoStore.localTracks.video.close()
      }

      await client.value.leave()
      videoStore.reset()
      
      // Clear state
      remoteAudioTracks.value.clear()
      remoteVideoTracks.value.clear()
      pendingSubscriptions.value.clear()
      
    } catch (error) {
      console.error('Failed to leave channel:', error)
    } finally {
      isLeaving.value = false
    }
  }

  // Create local tracks
  const createLocalTracks = async () => {
    try {
      console.log('Creating local tracks...')
      let audioTrack = null;
      let newVideoTrack = null;
      // Create audio track
      try {
        console.log('Creating audio track...')
        // Audio track oluştur - tutarlı konfigürasyon kullan
        try {
          console.log('Creating audio track with config:', config.AUDIO_CONFIG)
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack(config.AUDIO_CONFIG)
        } catch (error) {
          console.warn('Failed with default audio config, trying basic config:', error)
          // Fallback: daha basit konfigürasyon ama gain ayarları ile
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
            encoderConfig: 'music_standard',
            gain: 1.0 // Normal gain seviyesi
          })
        }
        // Track'in geçerli olduğundan emin ol
        if (isTrackValid(audioTrack)) {
          console.log('Audio track created successfully:', {
            enabled: audioTrack.enabled,
            readyState: audioTrack.readyState,
            muted: audioTrack.muted,
            id: audioTrack.id,
            gain: audioTrack.getVolumeLevel ? audioTrack.getVolumeLevel() : 'N/A'
          })
          videoStore.setLocalTrack('audio', audioTrack)
          videoStore.setLocalAudioMuted(false)  // Başlangıçta mikrofon açık
          emitter.emit('local-audio-ready', { track: audioTrack })
        } else {
          console.error('Created audio track is not valid')
          videoStore.setLocalTrack('audio', null)
          videoStore.setLocalAudioMuted(true)
          console.warn('No microphone device found or permission denied. Microphone is OFF.')
          throw new Error('Invalid audio track')
        }
      } catch (error) {
        console.error('Failed to create audio track:', error)
        videoStore.setLocalTrack('audio', null)
        videoStore.setLocalAudioMuted(true)
        console.warn('No microphone device found or permission denied. Microphone is OFF.')
        // Audio track olmadan devam et
      }

      // Create video track
      try {
        console.log('Creating new video track...')
        // Video track oluştur - tutarlı konfigürasyon kullan
        try {
          newVideoTrack = await AgoraRTC.createCameraVideoTrack(config.VIDEO_CONFIG)
        } catch (error) {
          console.warn('Failed with default config, trying basic config:', error)
          // Fallback: daha basit konfigürasyon
          newVideoTrack = await AgoraRTC.createCameraVideoTrack({
            facingMode: 'user'
          })
        }
        if (isTrackValid(newVideoTrack)) {
          videoStore.setLocalTrack('video', newVideoTrack)
          videoStore.setLocalVideoOff(false)
          emitter.emit('local-video-ready', { track: newVideoTrack })
        } else {
          console.error('Created video track is not valid')
          videoStore.setLocalTrack('video', null)
          videoStore.setLocalVideoOff(true)
          console.warn('No camera device found or permission denied. Camera is OFF.')
          throw new Error('Invalid video track')
        }
      } catch (error) {
        console.error('Failed to create new video track:', error)
        videoStore.setLocalTrack('video', null)
        videoStore.setLocalVideoOff(true)
        console.warn('No camera device found or permission denied. Camera is OFF.')
        // Video track olmadan devam et
      }

      // === YENİ: Audio ve video track'leri aynı anda publish et ===
      const tracksToPublish = [];
      if (isTrackValid(audioTrack)) tracksToPublish.push(audioTrack);
      if (isTrackValid(newVideoTrack)) tracksToPublish.push(newVideoTrack);
      if (tracksToPublish.length) {
        await client.value.publish(tracksToPublish);
        console.log('Published tracks:', tracksToPublish.map(t => t && t.getTrackId ? t.getTrackId() : t))
      }
      // ==========================================================

    } catch (error) {
      console.error('Failed to create local tracks:', error)
      throw error
    }
  }

  // Toggle camera
  const toggleCamera = async (off) => {
    // Prevent rapid toggling
    if (isCameraToggling) {
      console.log('Camera toggle in progress, ignoring request')
      return
    }
    
    // Clear any pending timeout
    if (cameraToggleTimeout) {
      clearTimeout(cameraToggleTimeout)
    }
    
    isCameraToggling = true
    
    try {
      if (off) {
        // Kamerayı kapat
        if (videoStore.localTracks.video && isTrackValid(videoStore.localTracks.video)) {
          try {
            await client.value.unpublish(videoStore.localTracks.video)
            console.log('Video track unpublished')
          } catch (error) {
            console.warn('Failed to unpublish video track:', error)
          }
          
          // Track'i tamamen sil
          try {
            videoStore.localTracks.video.stop()
            videoStore.localTracks.video.close()
            videoStore.setLocalTrack('video', null)
            console.log('Video track stopped and closed')
          } catch (error) {
            console.warn('Failed to stop/close video track:', error)
          }
        } else {
          console.log('No valid video track to close')
        }
        videoStore.setLocalVideoOff(true)
        console.log('Camera turned off')
        
      } else {
        // Kamerayı aç - her zaman yeni track oluştur
        try {
          console.log('Creating new video track...')
          
          // Önce varsayılan konfigürasyon ile dene
          let newVideoTrack
          try {
            newVideoTrack = await AgoraRTC.createCameraVideoTrack(config.VIDEO_CONFIG)
          } catch (error) {
            console.warn('Failed with default config, trying basic config:', error)
            // Fallback: daha basit konfigürasyon
            newVideoTrack = await AgoraRTC.createCameraVideoTrack({
              facingMode: 'user'
            })
          }
          
          videoStore.setLocalTrack('video', newVideoTrack)
          await client.value.publish(newVideoTrack)
          videoStore.setLocalVideoOff(false)
          
          console.log('New video track created and published')
          emitter.emit('local-video-ready', { track: newVideoTrack })
          
        } catch (error) {
          console.error('Failed to create new video track:', error)
          throw error
        }
      }
      
    } catch (error) {
      console.error('Failed to toggle camera:', error)
      throw error
    } finally {
      // Add debounce delay before allowing next toggle
      cameraToggleTimeout = setTimeout(() => {
        isCameraToggling = false
      }, 1000) // 1 saniye debounce - daha uzun süre
    }
  }

  // Toggle microphone - Basit enable/disable yaklaşımı
  const toggleMicrophone = async (muted) => {
    try {
      if (muted) {
        // Mikrofonu kapat - sadece unpublish yap, track'i silme
        if (videoStore.localTracks.audio && isTrackValid(videoStore.localTracks.audio)) {
          try {
            await client.value.unpublish(videoStore.localTracks.audio)
            console.log('Audio track unpublished (but not closed)')
          } catch (error) {
            console.warn('Failed to unpublish audio track:', error)
          }
        } else {
          console.log('No valid audio track to unpublish')
        }
        videoStore.setLocalAudioMuted(true)
        console.log('Microphone turned off')
        
      } else {
        // Mikrofonu aç - mevcut track'i tekrar publish et
        if (videoStore.localTracks.audio && isTrackValid(videoStore.localTracks.audio)) {
          try {
            console.log('Re-publishing existing audio track...')
            await client.value.publish(videoStore.localTracks.audio)
            videoStore.setLocalAudioMuted(false)
            
            console.log('Audio track re-published:', {
              id: videoStore.localTracks.audio.id,
              gain: videoStore.localTracks.audio.getVolumeLevel ? videoStore.localTracks.audio.getVolumeLevel() : 'N/A',
              enabled: videoStore.localTracks.audio.enabled
            })
            emitter.emit('local-audio-ready', { track: videoStore.localTracks.audio })
            
          } catch (error) {
            console.error('Failed to re-publish audio track:', error)
            throw error
          }
        } else {
          // Track yoksa yeni oluştur
          try {
            console.log('Creating new audio track...')
            
            // Audio track oluştur - tutarlı konfigürasyon kullan
            let newAudioTrack
            try {
              console.log('Creating new audio track with config:', config.AUDIO_CONFIG)
              newAudioTrack = await AgoraRTC.createMicrophoneAudioTrack(config.AUDIO_CONFIG)
            } catch (error) {
              console.warn('Failed with default audio config, trying basic config:', error)
              // Fallback: daha basit konfigürasyon ama gain ayarları ile
              newAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                encoderConfig: 'music_standard',
                gain: 1.0 // Normal gain seviyesi
              })
            }
            
            videoStore.setLocalTrack('audio', newAudioTrack)
            await client.value.publish(newAudioTrack)
            videoStore.setLocalAudioMuted(false)
            
            console.log('New audio track created and published:', {
              id: newAudioTrack.id,
              gain: newAudioTrack.getVolumeLevel ? newAudioTrack.getVolumeLevel() : 'N/A',
              enabled: newAudioTrack.enabled
            })
            emitter.emit('local-audio-ready', { track: newAudioTrack })
            
          } catch (error) {
            console.error('Failed to create new audio track:', error)
            throw error
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to toggle microphone:', error)
      throw error
    }
  }

  // Process pending subscriptions for a user
  const processPendingSubscriptions = async (uid) => {
    const pending = pendingSubscriptions.value.get(uid)
    if (!pending) return

    console.log('Processing pending subscriptions for user:', uid)
    
    for (const mediaType of pending) {
      try {
        await subscribeToUserTrack(uid, mediaType)
      } catch (error) {
        console.error(`Failed to process pending ${mediaType} subscription for user ${uid}:`, error)
      }
    }
    
    pendingSubscriptions.value.delete(uid)
  }

  // Subscribe to user track with retry mechanism
  const subscribeToUserTrack = async (uid, mediaType, retryCount = 0) => {
    try {
      // Find the user in the client's user list
      const users = client.value.remoteUsers || []
      const user = users.find(u => u.uid === uid)
      
      if (!user) {
        if (retryCount < 3) {
          console.log(`User ${uid} not found, retrying in 1 second... (attempt ${retryCount + 1})`)
          setTimeout(() => subscribeToUserTrack(uid, mediaType, retryCount + 1), 1000)
          return
        } else {
          console.warn(`User ${uid} not found after ${retryCount} retries, skipping subscription`)
          return
        }
      }

      // Subscribe to the track
      await client.value.subscribe(user, mediaType)
      console.log('Subscribed to', mediaType, 'from user', uid)
      
      // Get the track
      const track = mediaType === 'audio' ? user.audioTrack : user.videoTrack
      
      if (track) {
        // Store the track
        if (mediaType === 'audio') {
          remoteAudioTracks.value.set(uid, track)
          videoStore.setRemoteTrack(uid, 'audio', track)
        } else {
          remoteVideoTracks.value.set(uid, track)
          videoStore.setRemoteTrack(uid, 'video', track)
        }
        
        // Update user state
        const currentUser = videoStore.remoteUsers.find(u => u.uid === uid)
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            [mediaType === 'audio' ? 'hasAudio' : 'hasVideo']: true
          }
          videoStore.addRemoteUser(updatedUser)
        }
        
        // Emit event for UI updates
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
  const setupEventListeners = () => {
    if (!client.value) return

    // User joined
    client.value.on('user-joined', (user) => {
      console.log('User joined:', user.uid)
      
      const remoteUser = {
        uid: user.uid,
        name: `User ${user.uid}`,
        isLocal: false,
        hasVideo: false,
        hasAudio: false,
        isMuted: false,
        isVideoOff: false
      }
      videoStore.addRemoteUser(remoteUser)
      emitter.emit('user-joined', remoteUser)
      
      // Process any pending subscriptions for this user
      processPendingSubscriptions(user.uid)
    })

    // User left
    client.value.on('user-left', (user) => {
      console.log('User left:', user.uid)
      
      // Clear remote tracks
      remoteAudioTracks.value.delete(user.uid)
      remoteVideoTracks.value.delete(user.uid)
      videoStore.removeRemoteTrack(user.uid, 'audio')
      videoStore.removeRemoteTrack(user.uid, 'video')
      pendingSubscriptions.value.delete(user.uid)
      
      videoStore.removeRemoteUser(user.uid)
      emitter.emit('user-left', { uid: user.uid })
    })

    // User published - queue subscription until user is confirmed
    client.value.on('user-published', async (user, mediaType) => {
      console.log('User published:', user.uid, mediaType)
      
      // Check if user is already in our remote users list
      const existingUser = videoStore.remoteUsers.find(u => u.uid === user.uid)
      
      if (!existingUser) {
        // User not yet confirmed, queue the subscription
        if (!pendingSubscriptions.value.has(user.uid)) {
          pendingSubscriptions.value.set(user.uid, [])
        }
        pendingSubscriptions.value.get(user.uid).push(mediaType)
        console.log('Queued subscription for user', user.uid, mediaType)
        return
      }
      
      // User is confirmed, subscribe immediately
      try {
        await subscribeToUserTrack(user.uid, mediaType)
      } catch (error) {
        console.error('Failed to subscribe to', mediaType, 'from user', user.uid, ':', error)
      }

      // --- DURUM GÜNCELLEME ---
      // Remote user'ın kamera/mikrofon durumu güncelleniyor
      const updates = {};
      if (mediaType === 'audio') updates.isMuted = false;
      if (mediaType === 'video') updates.isVideoOff = false;
      videoStore.updateUser(user.uid, updates);
    })

    // User unpublished
    client.value.on('user-unpublished', (user, mediaType) => {
      console.log('User unpublished:', user.uid, mediaType)
      
      if (mediaType === 'audio') {
        remoteAudioTracks.value.delete(user.uid)
        videoStore.removeRemoteTrack(user.uid, 'audio')
        // Update user state
        const currentUser = videoStore.remoteUsers.find(u => u.uid === user.uid)
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            hasAudio: false
          }
          videoStore.addRemoteUser(updatedUser)
        }
      } else if (mediaType === 'video') {
        remoteVideoTracks.value.delete(user.uid)
        videoStore.removeRemoteTrack(user.uid, 'video')
        // Update user state
        const currentUser = videoStore.remoteUsers.find(u => u.uid === user.uid)
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            hasVideo: false
          }
          videoStore.addRemoteUser(updatedUser)
        }
        
        // Emit event for UI updates
        emitter.emit('remote-video-unpublished', { uid: user.uid })
      }
      
      emitter.emit('user-unpublished', { user, mediaType })

      // --- DURUM GÜNCELLEME ---
      // Remote user'ın kamera/mikrofon durumu güncelleniyor
      const updates = {};
      if (mediaType === 'audio') updates.isMuted = true;
      if (mediaType === 'video') updates.isVideoOff = true;
      videoStore.updateUser(user.uid, updates);
    })

    // Connection state
    client.value.on('connection-state-change', (curState) => {
      const connected = curState === 'CONNECTED'
      videoStore.setConnected(connected)
      emitter.emit('connection-state-change', { connected })
    })
  }

  // Cleanup
  const cleanup = () => {
    if (client.value) {
      client.value.removeAllListeners()
    }
    videoStore.reset()
    remoteAudioTracks.value.clear()
    remoteVideoTracks.value.clear()
    pendingSubscriptions.value.clear()
  }

  onUnmounted(cleanup)

  return {
    client,
    isJoining,
    isLeaving,
    emitter,
    joinChannel,
    leaveChannel,
    toggleCamera,
    toggleMicrophone,
    cleanup
  }
} 