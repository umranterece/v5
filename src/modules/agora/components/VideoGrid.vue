<template>
  <div 
    class="video-grid"
    :data-count="allUsers.length"
  >
    <!-- Local User Video -->
    <VideoItem 
      v-if="localUser"
      :user="localUser"
      :has-video="hasLocalVideo"
      :video-ref="localVideoRef"
      :is-local="true"
    />

    <!-- Remote Users Video -->
    <VideoItem 
      v-for="user in remoteUsers" 
      :key="user.uid"
      :user="user"
      :has-video="user.hasVideo"
      :video-ref="el => setVideoRef(el, user.uid)"
      :is-local="false"
    />

    <!-- Screen Share Users -->
    <VideoItem 
      v-for="user in screenShareUsers" 
      :key="`screen-${user.uid}`"
      :user="user"
      :has-video="user.hasVideo"
      :video-ref="el => setVideoRef(el, user.uid)"
      :is-local="user.isLocal"
      :is-screen-share="true"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VideoItem from './VideoItem.vue'

// Props
const props = defineProps({
  localUser: { type: Object, default: () => ({}) },
  remoteUsers: { type: Array, default: () => [] },
  allUsers: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  localVideoRef: { type: Object, default: null }
})

// Emits
const emit = defineEmits(['set-video-ref'])

// Computed
const hasLocalVideo = computed(() => {
  const hasTrack = !!props.localTracks?.video
  const notVideoOff = !props.localUser?.isVideoOff
  const userExists = !!props.localUser
  return hasTrack && notVideoOff && userExists
})

const screenShareUsers = computed(() => {
  return props.allUsers.filter(u => u.isScreenShare && u.isLocal)
})

// Methods
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
}

.video-grid[data-count="1"] {
  grid-template-columns: 1fr;
}

.video-grid[data-count="2"] {
  grid-template-columns: repeat(2, 1fr);
}

.video-grid[data-count="3"],
.video-grid[data-count="4"] {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}

.video-grid[data-count="5"],
.video-grid[data-count="6"] {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
}

.video-grid[data-count="7"],
.video-grid[data-count="8"],
.video-grid[data-count="9"] {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
  }
}
</style> 