<template>
  <div class="agora-video-container">
    <VideoGrid
      :local-user="localUser"
      :remote-users="remoteUsers"
      :all-users="allUsers"
      :local-tracks="localTracks"
      :local-video-ref="localVideoRef"
      @set-video-ref="setVideoRef"
      @set-local-video-ref="setLocalVideoRef"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useAgoraStore } from '../store/index.js'
import VideoGrid from './VideoGrid.vue'

// Props
const props = defineProps({
  emitter: { type: Object, default: () => ({}) },
  screenEmitter: { type: Object, default: () => ({}) },
  localUser: { type: Object, default: () => ({}) },
  remoteUsers: { type: Array, default: () => [] },
  allUsers: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  remoteTracks: { type: Object, default: () => new Map() }
})

// Refs
const localVideoRef = ref(null)
const videoRefs = ref(new Map())
const isSettingUpLocalVideo = ref(false) // Prevent recursive calls

// Methods
const setLocalVideoRef = (el) => {
  console.log('=== SET LOCAL VIDEO REF IN AGORA VIDEO ===')
  console.log('Element:', el)
  console.log('Previous local video ref:', localVideoRef.value)
  
  // Only update if the element actually changed
  if (localVideoRef.value !== el) {
    localVideoRef.value = el
    console.log('New local video ref:', localVideoRef.value)
    
    // Eğer video track varsa hemen oynatmayı dene
    if (el && props.localTracks.video && !isSettingUpLocalVideo.value) {
      console.log('Video element set, attempting to play local video...')
      setupLocalVideo()
    }
  } else {
    console.log('Local video ref unchanged, skipping setup')
  }
}

const setVideoRef = (el, uid) => {
  console.log('=== SET VIDEO REF DEBUG ===')
  console.log('Setting video ref for UID:', uid)
  console.log('Element:', el)
  console.log('Element type:', el?.constructor?.name)
  
  if (el) {
    videoRefs.value.set(uid, el)
    console.log('Video ref set successfully for UID:', uid)
  } else {
    console.log('Video ref cleared for UID:', uid)
  }
}

const playVideo = async (track, element) => {
  console.log('=== PLAY VIDEO DEBUG ===')
  console.log('Track:', track)
  console.log('Element:', element)
  console.log('Track type:', track?.constructor?.name)
  console.log('Element type:', element?.constructor?.name)
  
  if (track && element) {
    try {
      console.log('Calling track.play()...')
      await track.play(element)
      console.log('Track.play() completed successfully')
    } catch (err) {
      console.error('Failed to play video track:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        trackState: track?.readyState,
        trackEnabled: track?.enabled,
        elementInnerHTML: element?.innerHTML
      })
      throw err
    }
  } else {
    console.warn('Cannot play video - missing track or element')
  }
}

const playAudio = async (track) => {
  if (track) {
    try {
      await track.play()
    } catch (err) {
      console.error('Failed to play audio track:', err)
    }
  }
}

const setupLocalVideo = async () => {
  // Prevent recursive calls
  if (isSettingUpLocalVideo.value) {
    console.log('=== SETUP LOCAL VIDEO SKIPPED - ALREADY RUNNING ===')
    return
  }
  
  const videoTrack = props.localTracks.video
  
  console.log('=== SETUP LOCAL VIDEO DEBUG ===')
  console.log('Video track:', videoTrack)
  console.log('Local video ref:', localVideoRef.value)
  console.log('Has video track:', !!videoTrack)
  console.log('Has video ref:', !!localVideoRef.value)
  
  if (videoTrack && localVideoRef.value) {
    try {
      isSettingUpLocalVideo.value = true
      console.log('Attempting to play local video track...')
      await playVideo(videoTrack, localVideoRef.value)
      console.log('Local video track played successfully')
    } catch (error) {
      console.error('Failed to setup local video:', error)
    } finally {
      isSettingUpLocalVideo.value = false
    }
  } else {
    console.warn('Cannot setup local video - missing track or ref')
    console.log('Video track exists:', !!videoTrack)
    console.log('Video ref exists:', !!localVideoRef.value)
  }
}

const setupSpecificRemoteVideo = async (uid) => {
  const element = videoRefs.value.get(uid)
  const track = props.remoteTracks.get(uid)?.video
  
  if (track && element) {
    try {
      await playVideo(track, element)
    } catch (error) {
      console.error(`Failed to setup video for user ${uid}:`, error)
    }
  }
}

const setupRemoteVideos = async () => {
  for (const [uid, tracks] of props.remoteTracks) {
    if (tracks.video) {
      await setupSpecificRemoteVideo(uid)
    }
  }
}

const setupRemoteAudios = async () => {
  for (const [uid, tracks] of props.remoteTracks) {
    if (tracks.audio) {
      try {
        await playAudio(tracks.audio)
      } catch (error) {
        console.error(`Failed to setup audio for user ${uid}:`, error)
      }
    }
  }
}

// Event listeners
const setupEventListeners = () => {
  props.emitter.on('setup-remote-video', (data) => {
    setupSpecificRemoteVideo(data.uid)
  })
  
  props.emitter.on('local-video-ready', async (data) => {
    console.log('=== LOCAL VIDEO READY EVENT ===')
    console.log('Event data:', data)
    console.log('Local video ref before nextTick:', localVideoRef.value)
    
    await nextTick()
    console.log('Local video ref after nextTick:', localVideoRef.value)
    
    await setupLocalVideo()
  })
  
  props.emitter.on('remote-video-unpublished', (data) => {
    const element = videoRefs.value.get(data.uid)
    if (element) {
      element.innerHTML = ''
    }
  })
  
  props.emitter.on('remote-video-ready', async (data) => {
    await nextTick()
    await setupSpecificRemoteVideo(data.uid)
  })
  
  props.emitter.on('remote-audio-ready', async (data) => {
    const audioTrack = data.track
    if (audioTrack) {
      try {
        await playAudio(audioTrack)
      } catch (error) {
        console.error(`Failed to play remote audio for user ${data.uid}:`, error)
      }
    }
  })
  
  // Screen share events
  props.screenEmitter.on('remote-screen-ready', async (data) => {
    await nextTick()
    await setupSpecificRemoteVideo(data.uid)
  })
  
  props.screenEmitter.on('screen-share-started', async (data) => {
    console.log('=== SCREEN SHARE STARTED EVENT ===')
    console.log('Event data:', data)
    
    const agoraStore = useAgoraStore()
    
    if (agoraStore.isScreenSharing && agoraStore.screenLocalTracks.video) {
      const screenUser = props.allUsers.find(user => user.isScreenShare && user.isLocal)
      if (screenUser) {
        console.log('Screen user found:', screenUser)
        
        // Video element'i hemen bul ve track'i oynat
        const element = videoRefs.value.get(screenUser.uid)
        if (element) {
          console.log('Video element found, playing screen track immediately...')
          try {
            await playVideo(agoraStore.screenLocalTracks.video, element)
            console.log('Screen track played successfully')
          } catch (error) {
            console.error('Failed to start local screen share video:', error)
          }
        } else {
          console.log('Video element not found, waiting for next tick...')
          await nextTick()
          const elementAfterTick = videoRefs.value.get(screenUser.uid)
          if (elementAfterTick) {
            try {
              await playVideo(agoraStore.screenLocalTracks.video, elementAfterTick)
              console.log('Screen track played successfully after nextTick')
            } catch (error) {
              console.error('Failed to start local screen share video after nextTick:', error)
            }
          } else {
            console.warn('Video element still not found after nextTick')
          }
        }
      } else {
        console.warn('Screen user not found in allUsers')
      }
    } else {
      console.warn('Screen sharing not active or no screen track')
    }
  })
  
  props.screenEmitter.on('screen-share-stopped', async () => {
    await nextTick()
    
    const agoraStore = useAgoraStore()
    const screenUser = props.allUsers.find(user => user.isScreenShare && user.isLocal)
    if (screenUser) {
      const element = videoRefs.value.get(screenUser.uid)
      if (element) {
        element.innerHTML = ''
      }
    }
  })
}

// Watchers
watch(() => props.localTracks.video, async (newTrack) => {
  if (newTrack && !isSettingUpLocalVideo.value) {
    await setupLocalVideo()
  }
}, { immediate: true })

watch(() => props.localUser?.isVideoOff, async (isVideoOff) => {
  if (!isVideoOff && props.localTracks.video && !isSettingUpLocalVideo.value) {
    await nextTick()
    await setupLocalVideo()
  }
})

watch(() => props.localUser?.hasVideo, async (hasVideo) => {
  if (hasVideo && props.localTracks.video && !isSettingUpLocalVideo.value) {
    await nextTick()
    await setupLocalVideo()
  }
})

// Lifecycle
onMounted(async () => {
  setupEventListeners()
  await setupLocalVideo()
  await setupRemoteVideos()
  await setupRemoteAudios()
})

onUnmounted(() => {
  videoRefs.value.clear()
  props.emitter.off('setup-remote-video')
  props.screenEmitter.off('remote-screen-ready')
  props.screenEmitter.off('screen-share-started')
  props.screenEmitter.off('screen-share-stopped')
})
</script>

<style scoped>
.agora-video-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0f0f0f;
  overflow: hidden;
}
</style> 