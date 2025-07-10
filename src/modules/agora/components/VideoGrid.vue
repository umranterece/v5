<template>
  <div 
    class="video-grid"
    :data-count="allUsers.length"
  >
    <!-- Local Kamera Video -->
    <VideoItem 
      v-if="localCameraUser"
      :user="localCameraUser"
      :has-video="localCameraHasVideo"
      :video-ref="el => setLocalVideoRef(el)"
      :track="localTracks.video && localTracks.video.video"
      :is-local="true"
    />

    <!-- Local Ekran Paylaşımı Video -->
    <VideoItem 
      v-if="localScreenUser"
      :user="localScreenUser"
      :has-video="localScreenHasVideo"
      :video-ref="el => setLocalScreenRef(el)"
      :track="localTracks.screen && localTracks.screen.video"
      :is-local="true"
      :is-screen-share="true"
    />

    <!-- Remote Users Video -->
    <VideoItem 
      v-for="user in remoteUsers" 
      :key="user.uid"
      :user="user"
      :has-video="getUserHasVideo(user)"
      :video-ref="el => setVideoRef(el, user.uid)"
      :track="user.track"
      :is-local="false"
    />

    <!-- Remote Ekran Paylaşımı Kullanıcıları -->
    <VideoItem 
      v-for="user in remoteScreenShareUsers" 
      :key="`screen-${user.uid}`"
      :user="user"
      :has-video="getUserHasVideo(user)"
      :video-ref="el => setVideoRef(el, user.uid)"
      :track="user.track"
      :is-local="user.isLocal"
      :is-screen-share="true"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VideoItem from './VideoItem.vue'
import { useLogger } from '../composables/index.js'

const { logUI } = useLogger()

// Props
const props = defineProps({
  allUsers: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  localVideoRef: { type: Object, default: null },
  localScreenRef: { type: Object, default: null }
})

// Emits
const emit = defineEmits(['set-video-ref', 'set-local-video-ref', 'set-local-screen-ref'])

// Computed
const localCameraUser = computed(() => props.allUsers.find(u => u.isLocal && !u.isScreenShare))
const localScreenUser = computed(() => props.allUsers.find(u => u.isLocal && u.isScreenShare))
const remoteUsers = computed(() => props.allUsers.filter(u => !u.isLocal && !u.isScreenShare))
const remoteScreenShareUsers = computed(() => props.allUsers.filter(u => !u.isLocal && u.isScreenShare))

const localCameraHasVideo = computed(() => !!props.localTracks.video && !localCameraUser.value?.isVideoOff && !!localCameraUser.value)
const localScreenHasVideo = computed(() => {
  const hasScreenTrack = !!(props.localTracks.screen && props.localTracks.screen.video)
  const notVideoOff = !localScreenUser.value?.isVideoOff
  const userExists = !!localScreenUser.value
  
  logUI('Yerel ekran paylaşımı video durumu hesaplanıyor', {
    hasScreenTrack,
    notVideoOff,
    userExists,
    screenTrack: !!props.localTracks.screen,
    screenVideo: !!props.localTracks.screen?.video,
    localScreenUser: localScreenUser.value
  })
  
  return hasScreenTrack && notVideoOff && userExists
})

const getUserHasVideo = (user) => {
  const hasVideoTrack = !!user.hasVideo
  const notVideoOff = !user.isVideoOff
  const userExists = !!user
  logUI('Kullanıcı video durumu hesaplanıyor', {
    uid: user.uid,
    hasVideoTrack,
    notVideoOff,
    userExists,
    user
  })
  return hasVideoTrack && notVideoOff && userExists
}

const setLocalVideoRef = (el) => {
  logUI('Yerel video referansı ayarlanıyor', { element: !!el, hasRefProp: !!props.localVideoRef })
  if (props.localVideoRef && typeof props.localVideoRef === 'object' && 'value' in props.localVideoRef) {
    props.localVideoRef.value = el
    logUI('Yerel video referansı başarıyla ayarlandı')
  } else {
    logUI('Yerel video referans prop\'u geçerli bir ref objesi değil')
  }
  emit('set-local-video-ref', el)
}

const setLocalScreenRef = (el) => {
  logUI('Yerel ekran paylaşımı referansı ayarlanıyor', { 
    element: !!el, 
    hasRefProp: !!props.localScreenRef,
    elementType: el?.constructor?.name,
    elementId: el?.id,
    elementClass: el?.className
  })
  
  if (props.localScreenRef && typeof props.localScreenRef === 'object' && 'value' in props.localScreenRef) {
    props.localScreenRef.value = el
    logUI('Yerel ekran paylaşımı referansı başarıyla ayarlandı', {
      newRef: !!el,
      refType: el?.constructor?.name
    })
  } else {
    logUI('Yerel ekran paylaşımı referans prop\'u geçerli bir ref objesi değil', {
      hasRefProp: !!props.localScreenRef,
      refType: typeof props.localScreenRef
    })
  }
  emit('set-local-screen-ref', el)
}

const setVideoRef = (el, uid) => {
  emit('set-video-ref', el, uid)
}
</script>

<style scoped>
.video-grid {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  width: 100%;
  grid-auto-rows: 1fr;
  justify-content: center;
  align-items: center;
}

.video-grid[data-count="1"] {
  grid-template-columns: 1fr;
  max-width: 600px;
  margin: 0 auto;
}

.video-grid[data-count="2"] {
  grid-template-columns: repeat(2, 1fr);
  max-width: 1000px;
  margin: 0 auto;
}

.video-grid[data-count="3"],
.video-grid[data-count="4"] {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  max-width: 1000px;
  margin: 0 auto;
}

.video-grid[data-count="5"],
.video-grid[data-count="6"] {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  max-width: 1400px;
  margin: 0 auto;
}

.video-grid[data-count="7"],
.video-grid[data-count="8"],
.video-grid[data-count="9"] {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  max-width: 1400px;
  margin: 0 auto;
}

.video-grid[data-count="10"],
.video-grid[data-count="11"],
.video-grid[data-count="12"] {
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
  max-width: 1600px;
  margin: 0 auto;
}

.video-grid[data-count="13"],
.video-grid[data-count="14"],
.video-grid[data-count="15"],
.video-grid[data-count="16"] {
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  max-width: 1600px;
  margin: 0 auto;
}

/* Büyük ekranlar için daha fazla alan kullan */
@media (min-width: 1920px) {
  .video-grid[data-count="1"] {
    max-width: 800px;
  }
  
  .video-grid[data-count="2"] {
    max-width: 1200px;
  }
  
  .video-grid[data-count="3"],
  .video-grid[data-count="4"] {
    max-width: 1200px;
  }
  
  .video-grid[data-count="5"],
  .video-grid[data-count="6"] {
    max-width: 1600px;
  }
  
  .video-grid[data-count="7"],
  .video-grid[data-count="8"],
  .video-grid[data-count="9"] {
    max-width: 1600px;
  }
  
  .video-grid[data-count="10"],
  .video-grid[data-count="11"],
  .video-grid[data-count="12"] {
    max-width: 1800px;
  }
  
  .video-grid[data-count="13"],
  .video-grid[data-count="14"],
  .video-grid[data-count="15"],
  .video-grid[data-count="16"] {
    max-width: 1800px;
  }
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  
  .video-grid[data-count="2"] {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  
  .video-grid[data-count="3"],
  .video-grid[data-count="4"] {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
</style> 