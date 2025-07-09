import { ref, onUnmounted } from 'vue'
import AgoraRTC from 'agora-rtc-sdk-ng'
import mitt from 'mitt'
import { AGORA_CONFIG, USER_ID_RANGES } from '../constants.js'
import { createToken } from '../services/tokenService.js'
import { useTrackManagement } from './useTrackManagement.js'

/**
 * Screen Share Composable - Ekran paylaşımı işlemlerini yönetir
 * @module composables/useScreenShare
 */
export function useScreenShare(agoraStore) {
  const emitter = mitt()
  const isJoining = ref(false)
  const isLeaving = ref(false)
  
  // Pending subscriptions
  const pendingSubscriptions = ref(new Map())

  // Track management composable
  const { isTrackValid, createScreenTrack, cleanupTrack } = useTrackManagement()

  // Generate UID for screen share
  const generateScreenUID = () => {
    return Math.floor(Math.random() * (USER_ID_RANGES.SCREEN_SHARE.MAX - USER_ID_RANGES.SCREEN_SHARE.MIN)) + USER_ID_RANGES.SCREEN_SHARE.MIN
  }

  // Initialize screen client
  const initializeScreenClient = async (appId) => {
    try {
      const client = AgoraRTC.createClient(AGORA_CONFIG)
      agoraStore.setScreenClient(client)
      setupScreenEventListeners(client)
      agoraStore.setScreenInitialized(true)
      console.log('Screen client initialized')
      return client
    } catch (error) {
      console.error('Failed to initialize screen client:', error)
      throw error
    }
  }

  // Join screen channel
  const joinScreenChannel = async ({ token, channelName, uid, userName = 'Screen User', appId }) => {
    if (isJoining.value) return

    try {
      isJoining.value = true
      
      let client = agoraStore.screenClient
      if (!client) {
        client = await initializeScreenClient(appId)
      }

      // Clear previous state
      pendingSubscriptions.value.clear()

      // Set local screen user
      const localUser = {
        uid,
        name: userName,
        isLocal: true,
        hasVideo: false,
        isScreenShare: true
      }
      agoraStore.setScreenLocalUser(localUser)

      // Join screen channel - aynı channel'a katıl
      await client.join(appId, channelName, token, uid)
      console.log('Joined screen channel successfully:', channelName)
      
      agoraStore.setScreenConnected(true)
      isJoining.value = false
      return { success: true }
      
    } catch (error) {
      isJoining.value = false
      console.error('Failed to join screen channel:', error)
      throw error
    }
  }

  // Leave screen channel
  const leaveScreenChannel = async () => {
    const client = agoraStore.screenClient
    if (!client) return

    try {
      isLeaving.value = true
      
      // Stop screen track
      if (agoraStore.screenLocalTracks.video) {
        cleanupTrack(agoraStore.screenLocalTracks.video)
      }

      await client.leave()
      agoraStore.resetScreen()
      
      // Clear state
      pendingSubscriptions.value.clear()
      
    } catch (error) {
      console.error('Failed to leave screen channel:', error)
    } finally {
      isLeaving.value = false
    }
  }

  // Start screen share
  const startScreenShare = async () => {
    try {
      console.log('Starting screen share with publish...')
      
      // Mobil cihaz kontrolü
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobile = ['mobile', 'android', 'iphone', 'ipad', 'ipod'].some(keyword => userAgent.includes(keyword))
      
      if (isMobile) {
        throw new Error('Screen sharing is not supported on mobile devices')
      }
      
      // getDisplayMedia desteği kontrolü
      if (!('getDisplayMedia' in navigator.mediaDevices)) {
        throw new Error('Screen sharing is not supported in this browser')
      }
      
      // Önce video channel'a katılıp katılmadığını kontrol et
      const baseChannelName = agoraStore.videoChannelName
      if (!baseChannelName) {
        throw new Error('No video channel joined, cannot start screen share!')
      }

      // Screen share track'ini oluştur (kullanıcı ekran seçimi yapar)
      const screenResult = await createScreenTrack()
      if (!screenResult.success) {
        throw new Error('Failed to create screen track')
      }
      const screenTrack = screenResult.track

      console.log('Screen share track created successfully')

      // Screen client'ı initialize et (eğer yoksa)
      if (!agoraStore.screenClient) {
        console.log('Initializing screen client...')
        await initializeScreenClient(agoraStore.appId)
      }

      // Screen UID oluştur
      const screenUID = generateScreenUID()
      console.log('Generated screen UID:', screenUID)

      // Screen channel için token al
      console.log('Getting token for screen channel:', baseChannelName)
      const tokenData = await createToken(baseChannelName, screenUID)
      console.log('Token received for screen channel')

      // Screen channel'a katıl
      console.log('Joining screen channel:', baseChannelName)
      await joinScreenChannel({
        token: tokenData.token,
        channelName: baseChannelName,
        uid: screenUID,
        userName: `Screen Share ${screenUID}`,
        appId: tokenData.app_id
      })

      // Screen track'i publish et
      console.log('Publishing screen track...')
      await agoraStore.screenClient.publish(screenTrack)
      console.log('Screen track published successfully')

      // Update store
      agoraStore.setScreenLocalTrack(screenTrack)
      agoraStore.setScreenSharing(true)
      
      // Chrome'un "Paylaşımı durdur" butonunu handle et
      screenTrack.on('track-ended', () => {
        console.log('Screen share track ended by Chrome')
        stopScreenShare()
      })
      
      console.log('Screen share started successfully with publish')
      console.log('Screen share user added to allUsers:', agoraStore.screenLocalUser)
      console.log('All users count:', agoraStore.allUsers.length)
      console.log('All users:', agoraStore.allUsers)
      emitter.emit('screen-share-started', { track: screenTrack })
      
      return screenTrack
      
    } catch (error) {
      console.error('Failed to start screen share:', error)
      
      // Eğer track oluşturulduysa ama sonrasında hata olduysa, track'i temizle
      if (error.message !== 'Invalid screen track' && error.message !== 'No video channel joined, cannot start screen share!') {
        console.log('Cleaning up screen track due to error...')
        try {
          // Track'i temizlemeye çalış (eğer varsa)
          if (agoraStore.screenLocalTracks.video) {
            agoraStore.screenLocalTracks.video.stop()
            agoraStore.screenLocalTracks.video.close()
            agoraStore.setScreenLocalTrack(null)
          }
        } catch (cleanupError) {
          console.warn('Failed to cleanup screen track:', cleanupError)
        }
      }
      
      throw error
    }
  }

  // Stop screen share
  const stopScreenShare = async () => {
    try {
      const screenTrack = agoraStore.screenLocalTracks.video
      const screenClient = agoraStore.screenClient
      
      if (screenTrack) {
        // Unpublish track (eğer client varsa)
        if (screenClient) {
          console.log('Unpublishing screen track...')
          await screenClient.unpublish(screenTrack)
          console.log('Screen track unpublished successfully')
        }

        // Stop and close track
        screenTrack.stop()
        screenTrack.close()
        
        // Track event listener'ını temizle
        screenTrack.off('track-ended')
        
        // Screen channel'dan çık
        if (screenClient) {
          console.log('Leaving screen channel...')
          await leaveScreenChannel()
        }
        
        // Update store
        agoraStore.setScreenLocalTrack(null)
        agoraStore.setScreenSharing(false)
        
        console.log('Screen share stopped successfully with unpublish')
        console.log('Screen share user removed from allUsers')
        emitter.emit('screen-share-stopped')
      }
      
    } catch (error) {
      console.error('Failed to stop screen share:', error)
      throw error
    }
  }

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (agoraStore.isScreenSharing) {
      await stopScreenShare()
    } else {
      await startScreenShare()
    }
  }

  // Subscribe to remote screen share
  const subscribeToRemoteScreen = async (uid, retryCount = 0) => {
    try {
      const client = agoraStore.screenClient
      if (!client) return

      const users = client.remoteUsers || []
      const user = users.find(u => u.uid === uid)
      
      if (!user) {
        if (retryCount < 3) {
          console.log(`Screen user ${uid} not found, retrying in 1 second... (attempt ${retryCount + 1})`)
          setTimeout(() => subscribeToRemoteScreen(uid, retryCount + 1), 1000)
          return
        } else {
          console.warn(`Screen user ${uid} not found after ${retryCount} retries`)
          return
        }
      }

      // Subscribe to screen track
      await client.subscribe(user, 'video')
      console.log('Subscribed to screen share from user', uid)
      
      const track = user.videoTrack
      if (track) {
        agoraStore.setScreenRemoteTrack(uid, track)
        
        // Update user state
        const currentUser = agoraStore.screenRemoteUsers.find(u => u.uid === uid)
        if (currentUser) {
          const updatedUser = { ...currentUser, hasVideo: true }
          agoraStore.addScreenRemoteUser(updatedUser)
        }
        
        emitter.emit('remote-screen-ready', { uid, track })
      }
      
    } catch (error) {
      console.error(`Failed to subscribe to screen share from user ${uid}:`, error)
      throw error
    }
  }

  // Setup event listeners
  const setupScreenEventListeners = (client) => {
    if (!client) return

    // Screen user joined
    client.on('user-joined', (user) => {
      console.log('Screen user joined:', user.uid)
      
      // Eğer bu UID local kullanıcının UID'si ise (video veya screen), remote olarak ekleme
      if (agoraStore.isLocalUID(user.uid)) {
        console.log('Ignoring local user in screen client:', user.uid)
        return
      }
      
      const remoteUser = {
        uid: user.uid,
        name: `Screen Share ${user.uid}`,
        isLocal: false,
        hasVideo: false,
        isScreenShare: true
      }
      agoraStore.addScreenRemoteUser(remoteUser)
      emitter.emit('screen-user-joined', remoteUser)
    })

    // Screen user left
    client.on('user-left', (user) => {
      console.log('Screen user left:', user.uid)
      
      // Eğer bu UID local kullanıcının UID'si ise (video veya screen), çıkarma
      if (agoraStore.isLocalUID(user.uid)) {
        console.log('Ignoring local user left in screen client:', user.uid)
        return
      }
      
      agoraStore.removeScreenRemoteUser(user.uid)
      emitter.emit('screen-user-left', { uid: user.uid })
    })

    // Screen user published
    client.on('user-published', async (user, mediaType) => {
      console.log('Screen user published:', user.uid, mediaType)
      
      // Eğer bu UID local kullanıcının UID'si ise (video veya screen), işleme
      if (agoraStore.isLocalUID(user.uid)) {
        console.log('Ignoring local user published in screen client:', user.uid, mediaType)
        return
      }
      
      if (mediaType === 'video') {
        try {
          await subscribeToRemoteScreen(user.uid)
        } catch (error) {
          console.error('Failed to subscribe to screen share:', error)
        }
      }
    })

    // Screen user unpublished
    client.on('user-unpublished', (user, mediaType) => {
      console.log('Screen user unpublished:', user.uid, mediaType)
      
      // Eğer bu UID local kullanıcının UID'si ise (video veya screen), işleme
      if (agoraStore.isLocalUID(user.uid)) {
        console.log('Ignoring local user unpublished in screen client:', user.uid, mediaType)
        return
      }
      
      if (mediaType === 'video') {
        agoraStore.removeScreenRemoteUser(user.uid)
        emitter.emit('screen-user-unpublished', { uid: user.uid })
      }
    })

    // Connection state
    client.on('connection-state-change', (curState) => {
      const connected = curState === 'CONNECTED'
      agoraStore.setScreenConnected(connected)
      emitter.emit('screen-connection-state-change', { connected })
    })
  }

  // Cleanup
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