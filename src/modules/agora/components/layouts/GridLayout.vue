<template>
  <div class="grid-layout">
    <div 
      class="video-grid"
      :data-count="totalVideoCount"
      :style="{
        'grid-template-columns': `repeat(${gridLayout.columns}, 1fr)`,
        'grid-template-rows': `repeat(${gridLayout.rows}, 1fr)`,
        'max-width': gridLayout.maxWidth
      }"
    >
      <!-- Local Kamera Video -->
      <VideoItem 
        v-if="localCameraUser"
        :user="localCameraUser"
        :has-video="localCameraHasVideo"
        :video-ref="el => setLocalVideoRef(el)"
        :track="localTracks.video && localTracks.video.video"
        :is-local="true"
        :is-clickable="false"
        :logUI="logUI"
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
        :is-clickable="false"
        :logUI="logUI"
      />

      <!-- Remote Users Video -->
      <VideoItem 
        v-for="user in remoteUsers" 
        :key="user.uid"
        :user="user"
        :has-video="getUserHasVideo(user)"
        :video-ref="el => setVideoRef(el, user.uid)"
        :track="getUserTrack(user)"
        :is-local="false"
        :is-clickable="false"
        :logUI="logUI"
      />

      <!-- Remote Ekran Paylaşımı Kullanıcıları -->
      <VideoItem 
        v-for="user in remoteScreenShareUsers" 
        :key="`screen-${user.uid}`"
        :user="user"
        :has-video="getUserHasVideo(user)"
        :video-ref="el => setVideoRef(el, user.uid)"
        :track="getUserTrack(user)"
        :is-local="user.isLocal"
        :is-screen-share="true"
        :is-clickable="false"
        :logUI="logUI"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAgoraStore } from '../../store/index.js'
import VideoItem from '../video/VideoItem.vue'

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

// Computed
const localCameraUser = computed(() => props.users.find(u => u.isLocal && !u.isScreenShare))
const localScreenUser = computed(() => props.users.find(u => u.isLocal && u.isScreenShare))
const remoteUsers = computed(() => props.users.filter(u => !u.isLocal && !u.isScreenShare))
const remoteScreenShareUsers = computed(() => props.users.filter(u => !u.isLocal && u.isScreenShare))

// Toplam video sayısını hesapla
const totalVideoCount = computed(() => {
  let count = 0
  if (localCameraUser.value && localCameraHasVideo.value) count++
  if (localScreenUser.value && localScreenHasVideo.value) count++
  count += remoteUsers.value.filter(u => getUserHasVideo(u)).length
  count += remoteScreenShareUsers.value.filter(u => getUserHasVideo(u)).length
  return count
})

// Grid layout hesaplası - 50+ kişi için optimize
const gridLayout = computed(() => {
  const count = totalVideoCount.value
  
  // 1 kişi her zaman tam ekran
  if (count === 0 || count === 1) {
    return { columns: 1, rows: 1, maxWidth: '100%', aspectRatio: '16/9' }
  }
  
  // 2 kişi yan yana (masaüstünde)
  if (count === 2) {
    return { columns: 2, rows: 1, maxWidth: '100%', aspectRatio: '16/9' }
  }
  
  // 3-4 kişi için 4:1 oranında (yan yana)
  if (count === 3 || count === 4) {
    return { columns: count, rows: 1, maxWidth: '100%', aspectRatio: '4/1' }
  }
  
  // 5-6 kişi için 3x2 grid
  if (count === 5 || count === 6) {
    return { columns: 3, rows: 2, maxWidth: '100%', aspectRatio: '3/2' }
  }
  
  // 7-9 kişi için 3x3 grid
  if (count >= 7 && count <= 9) {
    return { columns: 3, rows: 3, maxWidth: '100%', aspectRatio: '1/1' }
  }
  
  // 10-12 kişi için 4x3 grid
  if (count >= 10 && count <= 12) {
    return { columns: 4, rows: 3, maxWidth: '100%', aspectRatio: '4/3' }
  }
  
  // 13-16 kişi için 4x4 grid
  if (count >= 13 && count <= 16) {
    return { columns: 4, rows: 4, maxWidth: '100%', aspectRatio: '1/1' }
  }
  
  // 17-20 kişi için 5x4 grid
  if (count >= 17 && count <= 20) {
    return { columns: 5, rows: 4, maxWidth: '100%', aspectRatio: '5/4' }
  }
  
  // 21-25 kişi için 5x5 grid
  if (count >= 21 && count <= 25) {
    return { columns: 5, rows: 5, maxWidth: '100%', aspectRatio: '1/1' }
  }
  
  // 26-30 kişi için 6x5 grid
  if (count >= 26 && count <= 30) {
    return { columns: 6, rows: 5, maxWidth: '100%', aspectRatio: '6/5' }
  }
  
  // 31-36 kişi için 6x6 grid
  if (count >= 31 && count <= 36) {
    return { columns: 6, rows: 6, maxWidth: '100%', aspectRatio: '1/1' }
  }
  
  // 37-42 kişi için 7x6 grid
  if (count >= 37 && count <= 42) {
    return { columns: 7, rows: 6, maxWidth: '100%', aspectRatio: '7/6' }
  }
  
  // 43-49 kişi için 7x7 grid
  if (count >= 43 && count <= 49) {
    return { columns: 7, rows: 7, maxWidth: '100%', aspectRatio: '1/1' }
  }
  
  // 50+ kişi için 8x7 grid (maksimum)
  if (count >= 50) {
    return { columns: 8, rows: 7, maxWidth: '100%', aspectRatio: '8/7' }
  }
  
  // Fallback
  const columns = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / columns)
  return { columns, rows, maxWidth: '100%', aspectRatio: 'auto' }
})

const localCameraHasVideo = computed(() => !!props.localTracks.video && !localCameraUser.value?.isVideoOff && !!localCameraUser.value)
const localScreenHasVideo = computed(() => {
  const hasScreenTrack = !!(props.localTracks.screen && props.localTracks.screen.video)
  const notVideoOff = !localScreenUser.value?.isVideoOff
  const userExists = !!localScreenUser.value
  
  props.logUI('Yerel ekran paylaşımı video durumu hesaplanıyor', {
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
  props.logUI('Kullanıcı video durumu hesaplanıyor', {
    uid: user.uid,
    hasVideoTrack,
    notVideoOff,
    userExists,
    user
  })
  return hasVideoTrack && notVideoOff && userExists
}

const getUserTrack = (user) => {
  if (!user) return null
  
  const agoraStore = useAgoraStore()
  
  if (user.isScreenShare) {
    // Ekran paylaşımı kullanıcısı için
    return agoraStore.tracks.remote.get(user.uid)?.screen
  } else {
    // Normal video kullanıcısı için
    return agoraStore.tracks.remote.get(user.uid)?.video
  }
}

const setLocalVideoRef = (el) => {
  props.logUI('Yerel video referansı ayarlanıyor', { element: !!el, hasRefProp: !!props.localVideoRef })
  if (props.localVideoRef && typeof props.localVideoRef === 'object' && 'value' in props.localVideoRef) {
    props.localVideoRef.value = el
    props.logUI('Yerel video referansı başarıyla ayarlandı')
  } else {
    props.logUI('Yerel video referans prop\'u geçerli bir ref objesi değil')
  }
  emit('set-local-video-ref', el)
}

const setLocalScreenRef = (el) => {
  props.logUI('Yerel ekran paylaşımı referansı ayarlanıyor', { 
    element: !!el, 
    hasRefProp: !!props.localScreenRef,
    elementType: el?.constructor?.name,
    elementId: el?.id,
    elementClass: el?.className
  })
  
  if (props.localScreenRef && typeof props.localScreenRef === 'object' && 'value' in props.localScreenRef) {
    props.localScreenRef.value = el
    props.logUI('Yerel ekran paylaşımı referansı başarıyla ayarlandı', {
      newRef: !!el,
      refType: el?.constructor?.name
    })
  } else {
    props.logUI('Yerel ekran paylaşımı referans prop\'u geçerli bir ref objesi değil', {
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
.grid-layout {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-grid {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  height: 100%;
  width: 100%;
  grid-auto-rows: 1fr;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  overflow: auto;
}

/* Video item'lar için aspect ratio desteği */
.video-grid .video-item {
  aspect-ratio: 16/9;
  object-fit: cover;
}

/* Tek kişi için tam ekran */
.video-grid[data-count="1"] {
  max-width: 100% !important;
  width: 100% !important;
  height: 100% !important;
}

.video-grid[data-count="1"] .video-item {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
}

/* Tablet için orta seviye responsive */
@media (max-width: 1024px) and (min-width: 769px) {
  .video-grid {
    gap: 0.75rem;
    padding: 0.75rem;
  }
  
  /* Tablet'te 1-2 kişi için yan yana */
  .video-grid[data-count="1"],
  .video-grid[data-count="2"] {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: 1fr !important;
  }
  
  /* Tablet'te 3-4 kişi için 2x2 */
  .video-grid[data-count="3"],
  .video-grid[data-count="4"] {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: repeat(2, 1fr) !important;
  }
  
  /* Tablet'te 5+ kişi için 3 sütun */
  .video-grid[data-count="5"],
  .video-grid[data-count="6"],
  .video-grid[data-count="7"],
  .video-grid[data-count="8"],
  .video-grid[data-count="9"] {
    grid-template-columns: repeat(3, 1fr) !important;
    grid-template-rows: auto !important;
  }
  
  /* Tablet'te 10+ kişi için 4 sütun */
  .video-grid[data-count="10"],
  .video-grid[data-count="11"],
  .video-grid[data-count="12"] {
    grid-template-columns: repeat(4, 1fr) !important;
    grid-template-rows: auto !important;
  }
  
  /* Tablet'te 13+ kişi için 5 sütun */
  .video-grid[data-count="13"],
  .video-grid[data-count="14"],
  .video-grid[data-count="15"],
  .video-grid[data-count="16"] {
    grid-template-columns: repeat(5, 1fr) !important;
    grid-template-rows: auto !important;
  }
  
  /* Tablet'te 17+ kişi için 6 sütun */
  .video-grid[data-count="17"],
  .video-grid[data-count="18"],
  .video-grid[data-count="19"],
  .video-grid[data-count="20"] {
    grid-template-columns: repeat(6, 1fr) !important;
    grid-template-rows: auto !important;
  }
  
  /* Tablet'te 21+ kişi için 7 sütun */
  .video-grid[data-count="21"],
  .video-grid[data-count="22"],
  .video-grid[data-count="23"],
  .video-grid[data-count="24"],
  .video-grid[data-count="25"] {
    grid-template-columns: repeat(7, 1fr) !important;
    grid-template-rows: auto !important;
  }
  
  /* Tablet'te 26+ kişi için 8 sütun */
  .video-grid[data-count="26"],
  .video-grid[data-count="27"],
  .video-grid[data-count="28"],
  .video-grid[data-count="29"],
  .video-grid[data-count="30"] {
    grid-template-columns: repeat(8, 1fr) !important;
    grid-template-rows: auto !important;
  }
  
  /* Tablet'te 31+ kişi için 9 sütun */
  .video-grid[data-count="31"],
  .video-grid[data-count="32"],
  .video-grid[data-count="33"],
  .video-grid[data-count="34"],
  .video-grid[data-count="35"],
  .video-grid[data-count="36"] {
    grid-template-columns: repeat(9, 1fr) !important;
    grid-template-rows: auto !important;
  }
  
  /* Tablet'te 37+ kişi için 10 sütun */
  .video-grid[data-count="37"],
  .video-grid[data-count="38"],
  .video-grid[data-count="39"],
  .video-grid[data-count="40"],
  .video-grid[data-count="41"],
  .video-grid[data-count="42"] {
    grid-template-columns: repeat(10, 1fr) !important;
    grid-template-rows: auto !important;
  }
  
  /* Tablet'te 43+ kişi için 11 sütun */
  .video-grid[data-count="43"],
  .video-grid[data-count="44"],
  .video-grid[data-count="45"],
  .video-grid[data-count="46"],
  .video-grid[data-count="47"],
  .video-grid[data-count="48"],
  .video-grid[data-count="49"] {
    grid-template-columns: repeat(11, 1fr) !important;
    grid-template-rows: auto !important;
  }
  
  /* Tablet'te 50+ kişi için 12 sütun */
  .video-grid[data-count="50"] {
    grid-template-columns: repeat(12, 1fr) !important;
    grid-template-rows: auto !important;
  }
}

@media (max-width: 768px) {
  .video-grid {
    gap: 0.5rem;
    padding: 0.5rem;
    /* Mobilde tüm videolar alta alta */
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
  }
  
  /* Mobilde tek kişi için tam ekran */
  .video-grid[data-count="1"] {
    max-width: 100% !important;
    width: 100% !important;
    height: 100% !important;
  }
  
  .video-grid[data-count="1"] .video-item {
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    max-height: none !important;
  }
  
  /* Mobilde 2 kişi için yan yana */
  .video-grid[data-count="2"] {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: 1fr !important;
  }
  
  /* Mobilde 3-4 kişi için 2x2 grid */
  .video-grid[data-count="3"],
  .video-grid[data-count="4"] {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: repeat(2, 1fr) !important;
  }
  
  /* Mobilde 5+ kişi için tek sütun */
  .video-grid[data-count="5"],
  .video-grid[data-count="6"],
  .video-grid[data-count="7"],
  .video-grid[data-count="8"],
  .video-grid[data-count="9"],
  .video-grid[data-count="10"],
  .video-grid[data-count="11"],
  .video-grid[data-count="12"],
  .video-grid[data-count="13"],
  .video-grid[data-count="14"],
  .video-grid[data-count="15"],
  .video-grid[data-count="16"],
  .video-grid[data-count="17"],
  .video-grid[data-count="18"],
  .video-grid[data-count="19"],
  .video-grid[data-count="20"],
  .video-grid[data-count="21"],
  .video-grid[data-count="22"],
  .video-grid[data-count="23"],
  .video-grid[data-count="24"],
  .video-grid[data-count="25"],
  .video-grid[data-count="26"],
  .video-grid[data-count="27"],
  .video-grid[data-count="28"],
  .video-grid[data-count="29"],
  .video-grid[data-count="30"],
  .video-grid[data-count="31"],
  .video-grid[data-count="32"],
  .video-grid[data-count="33"],
  .video-grid[data-count="34"],
  .video-grid[data-count="35"],
  .video-grid[data-count="36"],
  .video-grid[data-count="37"],
  .video-grid[data-count="38"],
  .video-grid[data-count="39"],
  .video-grid[data-count="40"],
  .video-grid[data-count="41"],
  .video-grid[data-count="42"],
  .video-grid[data-count="43"],
  .video-grid[data-count="44"],
  .video-grid[data-count="45"],
  .video-grid[data-count="46"],
  .video-grid[data-count="47"],
  .video-grid[data-count="48"],
  .video-grid[data-count="49"],
  .video-grid[data-count="50"] {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
  }
}
</style>
