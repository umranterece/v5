<template>
  <div class="grid-layout">
    <VideoGrid
      :all-users="users"
      :local-tracks="localTracks"
      :local-video-ref="localVideoRef"
      :local-screen-ref="localScreenRef"
      :logUI="logUI"
      @set-video-ref="handleSetVideoRef"
      @set-local-video-ref="handleSetLocalVideoRef"
      @set-local-screen-ref="handleSetLocalScreenRef"
    />
  </div>
</template>

<script setup>
import VideoGrid from '../video/VideoGrid.vue'

// Props
const props = defineProps({
  users: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  localVideoRef: { type: Object, default: null },
  localScreenRef: { type: Object, default: null },
  logUI: { type: Function, default: () => {} }
})

// Emits
const emit = defineEmits(['video-click', 'set-video-ref', 'set-local-video-ref', 'set-local-screen-ref'])

// Methods
const handleSetVideoRef = (el, uid) => {
  emit('set-video-ref', el, uid)
}

const handleSetLocalVideoRef = (el) => {
  emit('set-local-video-ref', el)
}

const handleSetLocalScreenRef = (el) => {
  emit('set-local-screen-ref', el)
}
</script>

<style scoped>
.grid-layout {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
