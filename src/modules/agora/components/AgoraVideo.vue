<template>
  <div class="agora-video-container">
    <VideoGrid
      :local-user="localUser"
      :remote-users="remoteUsers"
      :all-users="allUsers"
      :local-tracks="localTracks"
      :local-video-ref="localVideoRef"
      @set-video-ref="setVideoRef"
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

// Methods
const setVideoRef = (el, uid) => {
  if (el) {
    videoRefs.value.set(uid, el)
  }
}

const playVideo = async (track, element) => {
  if (track && element) {
    try {
      await track.play(element)
    } catch (err) {
      console.error('Failed to play video track:', err)
      throw err
    }
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
  const videoTrack = props.localTracks.video
  
  if (videoTrack && localVideoRef.value) {
    try {
      await playVideo(videoTrack, localVideoRef.value)
    } catch (error) {
      console.error('Failed to setup local video:', error)
    }
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
    await nextTick()
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
    await nextTick()
    
    const agoraStore = useAgoraStore()
    
    if (agoraStore.isScreenSharing && agoraStore.screenLocalTracks.video) {
      const screenUser = props.allUsers.find(user => user.isScreenShare && user.isLocal)
      if (screenUser) {
        const element = videoRefs.value.get(screenUser.uid)
        
        if (element) {
          try {
            await playVideo(agoraStore.screenLocalTracks.video, element)
          } catch (error) {
            console.error('Failed to start local screen share video:', error)
          }
        }
      }
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
  if (newTrack) {
    await setupLocalVideo()
  }
}, { immediate: true })

watch(() => props.localUser?.isVideoOff, async (isVideoOff) => {
  if (!isVideoOff && props.localTracks.video) {
    await nextTick()
    await setupLocalVideo()
  }
})

watch(() => props.localUser?.hasVideo, async (hasVideo) => {
  if (hasVideo && props.localTracks.video) {
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