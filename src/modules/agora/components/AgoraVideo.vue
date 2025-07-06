<template>
  <div class="agora-video-container">
    <!-- Video Grid -->
    <div 
      class="video-grid"
      :data-count="allUsers.length"
    >
      <!-- Local User Video -->
      <div 
        v-if="localUser"
        class="video-item local-video"
      >
        <div class="video-wrapper">
          <div 
            v-if="hasLocalVideo"
            ref="localVideoRef" 
            class="video-element"
          ></div>
          
          <!-- Placeholder when no video -->
          <div 
            v-else
            class="placeholder-content"
          >
            <div class="avatar">
              {{ getUserInitials(localUser.name) }}
            </div>
            <div class="user-name">{{ localUser.name }} (You)</div>
            <div class="user-status">
              <span v-if="localUser.isMuted" class="status-icon muted">🔇</span>
              <span v-if="localUser.isVideoOff" class="status-icon video-off">📹</span>
            </div>
          </div>
          
          <!-- User Info -->
          <div v-if="hasLocalVideo" class="user-info">
            <div class="user-name">{{ localUser.name }} (You)</div>
            <div class="user-status">
              <span v-if="localUser.isMuted" class="status-icon muted">🔇</span>
              <span v-if="localUser.isVideoOff" class="status-icon video-off">📹</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Remote Users Video -->
      <div 
        v-for="user in remoteUsers" 
        :key="user.uid"
        class="video-item placeholder"
      >
        <div class="placeholder-content">
          <!-- Video element if user has video -->
          <div 
            v-if="user.hasVideo"
            :ref="el => setVideoRef(el, user.uid)" 
            class="video-element"
          ></div>
          
          <!-- Avatar if no video -->
          <div v-else class="avatar">
            {{ getUserInitials(user.name) }}
          </div>
          
          <div class="user-name">{{ user.name }}</div>
          <div class="user-status">
            <span v-if="user.isMuted" class="status-icon muted">🔇</span>
            <span v-if="user.isVideoOff" class="status-icon video-off">📹</span>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useVideoStore } from '../store/video.js'

// Props
const props = defineProps({
  emitter: {
    type: Object,
    required: true
  }
})

// Store
const videoStore = useVideoStore()

// Refs
const localVideoRef = ref(null)
const videoRefs = ref(new Map())

// Computed
const localUser = computed(() => videoStore.localUser)
const remoteUsers = computed(() => videoStore.remoteUsers)
const allUsers = computed(() => videoStore.allUsers)

const hasLocalVideo = computed(() => {
  const hasTrack = !!videoStore.localTracks.video
  const notVideoOff = !localUser.value?.isVideoOff
  const userExists = !!localUser.value
  
  console.log('hasLocalVideo computed:', {
    hasTrack,
    notVideoOff,
    userExists,
    localTracks: videoStore.localTracks.video,
    localUser: localUser.value
  })
  
  return hasTrack && notVideoOff && userExists
})



// Methods
const setVideoRef = (el, uid) => {
  if (el) {
    videoRefs.value.set(uid, el)
  }
}

const getUserInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const playVideo = async (track, element) => {
  if (track && element) {
    try {
      await track.play(element)
    } catch (err) {
      console.error('Failed to play video track:', err)
    }
  }
}

const playAudio = async (track) => {
  if (track) {
    try {
      await track.play()
      console.log('Audio track played successfully')
    } catch (err) {
      console.error('Failed to play audio track:', err)
    }
  }
}

const setupLocalVideo = async () => {
  console.log('Setting up local video...')
  console.log('Local tracks video:', videoStore.localTracks.video)
  console.log('Local video ref:', localVideoRef.value)
  console.log('Local user:', localUser.value)
  console.log('hasLocalVideo:', hasLocalVideo.value)
  
  if (videoStore.localTracks.video && localVideoRef.value) {
    try {
      const videoTrack = videoStore.localTracks.video
      console.log('Playing video track on element:', videoTrack)
      await playVideo(videoTrack, localVideoRef.value)
      console.log('Local video setup successful')
    } catch (error) {
      console.error('Failed to setup local video:', error)
    }
  } else {
    console.log('Cannot setup local video:')
    console.log('- Video track exists:', !!videoStore.localTracks.video)
    console.log('- Video ref exists:', !!localVideoRef.value)
    
    // Video ref yoksa, biraz bekleyip tekrar dene
    if (videoStore.localTracks.video && !localVideoRef.value) {
      console.log('Video ref not ready, retrying in 100ms...')
      setTimeout(async () => {
        await setupLocalVideo()
      }, 100)
    }
  }
}

const setupRemoteVideos = async () => {
  for (const user of remoteUsers.value) {
    if (user.hasVideo) {
      const element = videoRefs.value.get(user.uid)
      const videoTrack = videoStore.remoteTracks.get(user.uid)?.video
      
      if (element && videoTrack) {
        try {
          await playVideo(videoTrack, element)
        } catch (error) {
          console.error(`Failed to setup remote video for user ${user.uid}:`, error)
        }
      }
    }
  }
}

const setupRemoteAudios = async () => {
  for (const user of remoteUsers.value) {
    if (user.hasAudio) {
      const audioTrack = videoStore.remoteTracks.get(user.uid)?.audio
      
      if (audioTrack) {
        try {
          await playAudio(audioTrack)
          console.log(`Remote audio setup successful for user ${user.uid}`)
        } catch (error) {
          console.error(`Failed to setup remote audio for user ${user.uid}:`, error)
        }
      }
    }
  }
}

// Setup specific remote video
const setupSpecificRemoteVideo = async (uid) => {
  await nextTick()
  const user = remoteUsers.value.find(u => u.uid === uid)
  if (user && user.hasVideo) {
    const element = videoRefs.value.get(uid)
    const videoTrack = videoStore.remoteTracks.get(uid)?.video
    
    if (element && videoTrack) {
      try {
        await playVideo(videoTrack, element)
        console.log(`Remote video setup successful for user ${uid}`)
      } catch (error) {
        console.error(`Failed to setup remote video for user ${uid}:`, error)
      }
    }
  }
}

// Event listeners
const setupEventListeners = () => {
  props.emitter.on('setup-remote-video', (data) => {
    setupSpecificRemoteVideo(data.uid)
  })
  
  // Local video ready event
  props.emitter.on('local-video-ready', async (data) => {
    console.log('Local video ready event received:', data)
    await nextTick()
    await setupLocalVideo()
  })
  
  // Local video state changed event
  props.emitter.on('local-video-state-changed', (data) => {
    console.log('Local video state changed:', data)
    // Bu event remote user'lara local user'ın video durumunu bildirmek için kullanılacak
    // Şimdilik sadece logluyoruz, gerçek implementasyon için Agora SDK'nın data channel'ını kullanabiliriz
  })
  
  // Remote video unpublished event
  props.emitter.on('remote-video-unpublished', (data) => {
    console.log('Remote video unpublished:', data.uid)
    // Remote user'ın video element'ini temizle
    const element = videoRefs.value.get(data.uid)
    if (element) {
      element.innerHTML = ''
    }
  })
  
  // Remote audio ready event
  props.emitter.on('remote-audio-ready', async (data) => {
    console.log('Remote audio ready event received:', data)
    const audioTrack = data.track
    if (audioTrack) {
      try {
        await playAudio(audioTrack)
        console.log(`Remote audio played for user ${data.uid}`)
      } catch (error) {
        console.error(`Failed to play remote audio for user ${data.uid}:`, error)
      }
    }
  })
}

// Watchers
watch(() => videoStore.localTracks.video, async (newTrack) => {
  if (newTrack) {
    await setupLocalVideo()
  }
}, { immediate: true })

// Local user video off status changed
watch(() => localUser.value?.isVideoOff, async (isVideoOff) => {
  console.log('Local user video off status changed:', isVideoOff)
  if (!isVideoOff && videoStore.localTracks.video) {
    await nextTick()
    await setupLocalVideo()
  }
})

// Local user hasVideo status changed
watch(() => localUser.value?.hasVideo, async (hasVideo) => {
  console.log('Local user hasVideo status changed:', hasVideo)
  if (hasVideo && videoStore.localTracks.video) {
    await nextTick()
    await setupLocalVideo()
  }
})

// hasLocalVideo computed property'si değiştiğinde
watch(hasLocalVideo, async (hasVideo) => {
  console.log('hasLocalVideo computed changed:', hasVideo)
  if (hasVideo && videoStore.localTracks.video) {
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
})
</script>

<style scoped>
.agora-video-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
}

.video-grid {
  display: grid;
  width: 100%;
  height: 100%;
  gap: 8px;
  padding: 8px;
  box-sizing: border-box;
}

/* Dinamik grid - kaç kişi varsa o kadar kutucuk */
.video-grid[data-count="1"] {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

.video-grid[data-count="2"] {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
}

.video-grid[data-count="3"] {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.video-grid[data-count="4"] {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.video-grid[data-count="5"] {
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.video-grid[data-count="6"] {
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.video-grid[data-count="7"] {
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.video-grid[data-count="8"] {
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.video-grid[data-count="9"] {
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
}

.video-grid[data-count="10"] {
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.video-grid[data-count="11"] {
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
}

.video-grid[data-count="12"] {
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
}

/* 12'den fazla kişi için otomatik grid */
.video-grid[data-count="13"],
.video-grid[data-count="14"],
.video-grid[data-count="15"],
.video-grid[data-count="16"] {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-auto-rows: 1fr;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .video-grid {
    gap: 4px;
    padding: 4px;
  }
  
  .video-grid[data-count="1"],
  .video-grid[data-count="2"],
  .video-grid[data-count="3"],
  .video-grid[data-count="4"] {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(auto-fit, 1fr);
  }
  
  .video-grid[data-count="5"],
  .video-grid[data-count="6"] {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: repeat(auto-fit, 1fr);
  }
  
  .video-grid[data-count="7"],
  .video-grid[data-count="8"],
  .video-grid[data-count="9"],
  .video-grid[data-count="10"],
  .video-grid[data-count="11"],
  .video-grid[data-count="12"] {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: repeat(auto-fit, 1fr);
  }
  
  .video-item {
    min-height: 150px;
  }
}

/* Tablet responsive */
@media (min-width: 769px) and (max-width: 1024px) {
  .video-grid[data-count="1"],
  .video-grid[data-count="2"] {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
  }
  
  .video-grid[data-count="3"],
  .video-grid[data-count="4"] {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
  
  .video-grid[data-count="5"],
  .video-grid[data-count="6"] {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
  
  .video-grid[data-count="7"],
  .video-grid[data-count="8"] {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
}

.video-item {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #2a2a2a;
  transition: all 0.3s ease;
  min-height: 200px;
  aspect-ratio: 1;
}

/* Local kullanıcı video kutusu koyu mor arka plan */
.video-item.local-video {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

/* Remote kullanıcı video kutusu açık mavi arka plan */
.video-item:not(.local-video) {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

.video-item:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  aspect-ratio: 1;
}

/* Remote user video için ayna efekti - simetriyi düzelt */
.placeholder .video-element {
  transform: scaleX(-1);
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%);
  aspect-ratio: 1;
}

.placeholder-content {
  text-align: center;
  color: white;
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.placeholder-content .video-element {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  z-index: 1;
}

.placeholder-content .avatar,
.placeholder-content .user-name,
.placeholder-content .user-status {
  position: relative;
  z-index: 2;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  margin: 0 auto 12px;
  color: #1f2937;
}

/* Local kullanıcı avatar'ı daha koyu mor */
.avatar {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}

.user-info {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 12px;
  border-radius: 6px;
  color: white;
  font-size: 14px;
}

.user-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  display: flex;
  gap: 4px;
}

.status-icon {
  font-size: 16px;
}

.status-icon.muted {
  color: #ff6b6b;
}

.status-icon.video-off {
  color: #ffd93d;
}
</style> 