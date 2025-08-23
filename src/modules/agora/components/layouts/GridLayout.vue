<template>
  <div class="grid-layout">
    <!-- Debug bilgisi (development'ta göster) -->
    <div v-if="isDevelopment" class="debug-info">
      <div>Ekran: {{ windowSize.width }}x{{ windowSize.height }}</div>
      <div>Oran: {{ windowSize.height > windowSize.width ? 'Portrait' : 'Landscape' }}</div>
      <div>Video Sayısı: {{ totalVideoCount }}</div>
      <div>Grid: {{ gridLayout.columns }}x{{ gridLayout.rows }}</div>
      <div>İçerik Türleri:</div>
      <div>• Local Kamera: {{ localCameraUser && localCameraHasVideo ? '✓' : '✗' }}</div>
      <div>• Local Screen: {{ localScreenUser && localScreenHasVideo ? '✓' : '✗' }}</div>
      <div>• Remote Kamera: {{ remoteUsers.filter(u => getUserHasVideo(u)).length }}</div>
      <div>• Remote Screen: {{ remoteScreenShareUsers.filter(u => getUserHasVideo(u)).length }}</div>
    </div>
    
    <div 
      class="video-grid"
      :data-count="totalVideoCount"
      :data-columns="gridLayout.columns"
      :data-rows="gridLayout.rows"
      :data-orientation="windowSize.height > windowSize.width ? 'portrait' : 'landscape'"
      :style="{
        'grid-template-columns': `repeat(${gridLayout.columns}, 1fr)`,
        'grid-template-rows': `repeat(${gridLayout.rows}, 1fr)`,
        'max-width': gridLayout.maxWidth,
        'aspect-ratio': gridLayout.aspectRatio
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
        :logger="logger"
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
        :logger="logger"
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
        :logger="logger"
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
        :logger="logger"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAgoraStore } from '../../store/index.js'
import { VideoItem } from '../video/index.js'

// Props
const props = defineProps({
  users: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  localVideoRef: { type: Object, default: null },
  localScreenRef: { type: Object, default: null },
  logger: { 
    type: Object, 
    default: () => ({ debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {} })
  }
})

// Emits
const emit = defineEmits(['video-click', 'set-video-ref', 'set-local-video-ref', 'set-local-screen-ref'])

// Reactive window size
const windowSize = ref({
  width: typeof window !== 'undefined' ? window.innerWidth : 1920,
  height: typeof window !== 'undefined' ? window.innerHeight : 1080
})

// Development mode kontrolü
const isDevelopment = computed(() => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development'
})

// Window resize listener
const handleResize = () => {
  windowSize.value = {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
    // Initial size
    handleResize()
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})

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

// Grid layout hesaplası - farklı içerik türlerine göre optimize
const gridLayout = computed(() => {
  const count = totalVideoCount.value
  
  // Ekran boyutlarını al
  const screenWidth = windowSize.value.width
  const screenHeight = windowSize.value.height
  const isPortrait = screenHeight > screenWidth
  
  // İçerik türlerini analiz et
  const hasLocalCamera = localCameraUser.value && localCameraHasVideo.value
  const hasLocalScreen = localScreenUser.value && localScreenHasVideo.value
  const remoteCameraCount = remoteUsers.value.filter(u => getUserHasVideo(u)).length
  const remoteScreenCount = remoteScreenShareUsers.value.filter(u => getUserHasVideo(u)).length
  
  // Toplam içerik türü sayısı
  const contentTypes = [hasLocalCamera, hasLocalScreen, remoteCameraCount > 0, remoteScreenCount > 0].filter(Boolean).length
  
  // 1 kişi her zaman tam ekran
  if (count === 0 || count === 1) {
    return { columns: 1, rows: 1, maxWidth: '100%', aspectRatio: '16/9' }
  }
  
  // 2 kişi - içerik türüne göre optimize
  if (count === 2) {
    // Eğer local kamera + local screen varsa, alta alta (portrait) veya yan yana (landscape)
    if (hasLocalCamera && hasLocalScreen) {
      if (isPortrait) {
        return { columns: 1, rows: 2, maxWidth: '100%', aspectRatio: '1/2' }
      } else {
        return { columns: 2, rows: 1, maxWidth: '100%', aspectRatio: '2/1' }
      }
    }
    
    // Eğer local kamera + remote kamera varsa, yan yana
    if (hasLocalCamera && remoteCameraCount > 0) {
      if (isPortrait) {
        return { columns: 1, rows: 2, maxWidth: '100%', aspectRatio: '1/2' }
      } else {
        return { columns: 2, rows: 1, maxWidth: '100%', aspectRatio: '2/1' }
      }
    }
    
    // Eğer local screen + remote screen varsa, yan yana
    if (hasLocalScreen && remoteScreenCount > 0) {
      if (isPortrait) {
        return { columns: 1, rows: 2, maxWidth: '100%', aspectRatio: '1/2' }
      } else {
        return { columns: 2, rows: 1, maxWidth: '100%', aspectRatio: '2/1' }
      }
    }
    
    // Genel 2 kişi durumu
    if (isPortrait) {
      return { columns: 1, rows: 2, maxWidth: '100%', aspectRatio: '1/2' }
    } else {
      return { columns: 2, rows: 1, maxWidth: '100%', aspectRatio: '2/1' }
    }
  }
  
  // 3-4 kişi - içerik türüne göre optimize
  if (count === 3 || count === 4) {
    // Eğer local kamera + local screen + remote kamera varsa, 2x2 grid
    if (hasLocalCamera && hasLocalScreen && remoteCameraCount > 0) {
      return { columns: 2, rows: 2, maxWidth: '100%', aspectRatio: '1/1' }
    }
    
    // Eğer local kamera + remote kamera + remote screen varsa, 2x2 grid
    if (hasLocalCamera && remoteCameraCount > 0 && remoteScreenCount > 0) {
      return { columns: 2, rows: 2, maxWidth: '100%', aspectRatio: '1/1' }
    }
    
    // Genel 3-4 kişi durumu
    if (isPortrait) {
      return { columns: 2, rows: 2, maxWidth: '100%', aspectRatio: '1/1' }
    } else {
      return { columns: count, rows: 1, maxWidth: '100%', aspectRatio: `${count}/1` }
    }
  }
  
  // 5-6 kişi için 3x2 grid
  if (count === 5 || count === 6) {
    if (isPortrait) {
      return { columns: 2, rows: 3, maxWidth: '100%', aspectRatio: '2/3' }
    } else {
      return { columns: 3, rows: 2, maxWidth: '100%', aspectRatio: '3/2' }
    }
  }
  
  // 7-9 kişi için 3x3 grid
  if (count >= 7 && count <= 9) {
    return { columns: 3, rows: 3, maxWidth: '100%', aspectRatio: '1/1' }
  }
  
  // 10-12 kişi için 4x3 grid
  if (count >= 10 && count <= 12) {
    if (isPortrait) {
      return { columns: 3, rows: 4, maxWidth: '100%', aspectRatio: '3/4' }
    } else {
      return { columns: 4, rows: 3, maxWidth: '100%', aspectRatio: '4/3' }
    }
  }
  
  // 13-16 kişi için 4x4 grid
  if (count >= 13 && count <= 16) {
    return { columns: 4, rows: 4, maxWidth: '100%', aspectRatio: '1/1' }
  }
  
  // 17-20 kişi için 5x4 grid
  if (count >= 17 && count <= 20) {
    if (isPortrait) {
      return { columns: 4, rows: 5, maxWidth: '100%', aspectRatio: '4/5' }
    } else {
      return { columns: 5, rows: 4, maxWidth: '100%', aspectRatio: '5/4' }
    }
  }
  
  // 21-25 kişi için 5x5 grid
  if (count >= 21 && count <= 25) {
    return { columns: 5, rows: 5, maxWidth: '100%', aspectRatio: '1/1' }
  }
  
  // 26-30 kişi için 6x5 grid
  if (count >= 26 && count <= 30) {
    if (isPortrait) {
      return { columns: 5, rows: 6, maxWidth: '100%', aspectRatio: '5/6' }
    } else {
      return { columns: 6, rows: 5, maxWidth: '100%', aspectRatio: '6/5' }
    }
  }
  
  // 31-36 kişi için 6x6 grid
  if (count >= 31 && count <= 36) {
    return { columns: 6, rows: 6, maxWidth: '100%', aspectRatio: '1/1' }
  }
  
  // 37-42 kişi için 7x6 grid
  if (count >= 37 && count <= 42) {
    if (isPortrait) {
      return { columns: 6, rows: 7, maxWidth: '100%', aspectRatio: '6/7' }
    } else {
      return { columns: 7, rows: 6, maxWidth: '100%', aspectRatio: '7/6' }
    }
  }
  
  // 43-49 kişi için 7x7 grid
  if (count >= 43 && count <= 49) {
    return { columns: 7, rows: 7, maxWidth: '100%', aspectRatio: '1/1' }
  }
  
  // 50+ kişi için 8x7 grid (maksimum)
  if (count >= 50) {
    if (isPortrait) {
      return { columns: 7, rows: 8, maxWidth: '100%', aspectRatio: '7/8' }
    } else {
      return { columns: 8, rows: 7, maxWidth: '100%', aspectRatio: '8/7' }
    }
  }
  
  // Fallback - akıllı grid hesaplama
  const sqrt = Math.sqrt(count)
  const columns = Math.ceil(sqrt)
  const rows = Math.ceil(count / columns)
  
  // Aspect ratio'yu optimize et
  let aspectRatio = 'auto'
  if (columns === rows) {
    aspectRatio = '1/1'
  } else if (columns > rows) {
    aspectRatio = `${columns}/${rows}`
  } else {
    aspectRatio = `${rows}/${columns}`
  }
  
  return { 
    columns, 
    rows, 
    maxWidth: '100%', 
    aspectRatio 
  }
})

const localCameraHasVideo = computed(() => !!props.localTracks.video && !localCameraUser.value?.isVideoOff && !!localCameraUser.value)
const localScreenHasVideo = computed(() => {
  const hasScreenTrack = !!(props.localTracks.screen && props.localTracks.screen.video)
  const notVideoOff = !localScreenUser.value?.isVideoOff
  const userExists = !!localScreenUser.value
  
  props.logger.info('Yerel ekran paylaşımı video durumu hesaplanıyor', {
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
  props.logger.info('Kullanıcı video durumu hesaplanıyor', {
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
  props.logger.info('Yerel video referansı ayarlanıyor', { element: !!el, hasRefProp: !!props.localVideoRef })
  if (props.localVideoRef && typeof props.localVideoRef === 'object' && 'value' in props.localVideoRef) {
    props.localVideoRef.value = el
    props.logger.info('Yerel video referansı başarıyla ayarlandı')
  } else {
    props.logger.info('Yerel video referans prop\'u geçerli bir ref objesi değil')
  }
  emit('set-local-video-ref', el)
}

const setLocalScreenRef = (el) => {
  props.logger.info('Yerel ekran paylaşımı referansı ayarlanıyor', { 
    element: !!el, 
    hasRefProp: !!props.localScreenRef,
    elementType: el?.constructor?.name,
    elementId: el?.id,
    elementClass: el?.className
  })
  
  if (props.localScreenRef && typeof props.localScreenRef === 'object' && 'value' in props.localScreenRef) {
    props.localScreenRef.value = el
    props.logger.info('Yerel ekran paylaşımı referansı başarıyla ayarlandı', {
      newRef: !!el,
      refType: el?.constructor?.name
    })
  } else {
    props.logger.info('Yerel ekran paylaşımı referans prop\'u geçerli bir ref objesi değil', {
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
/* Debug bilgisi */
.debug-info {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 12px;
  z-index: 9999;
  backdrop-filter: blur(10px);
}

.debug-info div {
  margin: 2px 0;
}

/* Grid layout container */
.grid-layout {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Grid layout optimizasyonları */
.video-grid {
  display: grid;
  gap: 0.5rem;
  padding: 0.5rem;
  height: 100%;
  width: 100%;
  grid-auto-rows: minmax(0, 1fr);
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  overflow: auto;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

/* Video item'lar için grid'e tam oturma */
.video-grid .video-item {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: none;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: var(--rs-agora-radius-lg);
  transition: all 0.2s ease;
}

/* Tek kişi için tam ekran */
.video-grid[data-count="1"] {
  max-width: 100% !important;
  width: 100% !important;
  height: 100% !important;
  gap: 0 !important;
  padding: 0 !important;
}

.video-grid[data-count="1"] .video-item {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  aspect-ratio: auto !important;
}

/* 2 kişi için özel eşit bölünme */
.video-grid[data-count="2"] {
  grid-template-columns: repeat(2, 1fr) !important;
  grid-template-rows: 1fr !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

.video-grid[data-count="2"] .video-item {
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: none !important;
  max-height: none !important;
  flex: 1 1 0 !important;
}

/* Farklı içerik türleri için özel düzenlemeler */
.video-grid[data-count="2"] .video-item.local-video {
  /* Local video için özel stil */
  border: 2px solid var(--rs-agora-info);
}

.video-grid[data-count="2"] .video-item.screen-share {
  /* Screen share için özel stil */
  border: 2px solid var(--rs-agora-success);
}

/* 2 kişi için aspect ratio optimizasyonu */
.video-grid[data-count="2"] {
  aspect-ratio: 2/1;
}

/* Portrait modda 2 kişi için alta alta */
@media (orientation: portrait) {
  .video-grid[data-count="2"] {
    grid-template-columns: 1fr !important;
    grid-template-rows: repeat(2, 1fr) !important;
    aspect-ratio: 1/2;
  }
  
  .video-grid[data-count="2"] .video-item {
    width: 100% !important;
    height: 100% !important;
  }
}

/* Landscape modda 2 kişi için yan yana */
@media (orientation: landscape) {
  .video-grid[data-count="2"] {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: 1fr !important;
    aspect-ratio: 2/1;
  }
  
  .video-grid[data-count="2"] .video-item {
    width: 100% !important;
    height: 100% !important;
  }
}

/* 3-4 kişi için 2x2 grid */
.video-grid[data-count="3"],
.video-grid[data-count="4"] {
  grid-template-columns: repeat(2, 1fr) !important;
  grid-template-rows: repeat(2, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* 5-6 kişi için 3x2 grid */
.video-grid[data-count="5"],
.video-grid[data-count="6"] {
  grid-template-columns: repeat(3, 1fr) !important;
  grid-template-rows: repeat(2, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* 7-9 kişi için 3x3 grid */
.video-grid[data-count="7"],
.video-grid[data-count="8"],
.video-grid[data-count="9"] {
  grid-template-columns: repeat(3, 1fr) !important;
  grid-template-rows: repeat(3, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* 10-12 kişi için 4x3 grid */
.video-grid[data-count="10"],
.video-grid[data-count="11"],
.video-grid[data-count="12"] {
  grid-template-columns: repeat(4, 1fr) !important;
  grid-template-rows: repeat(3, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* 13-16 kişi için 4x4 grid */
.video-grid[data-count="13"],
.video-grid[data-count="14"],
.video-grid[data-count="15"],
.video-grid[data-count="16"] {
  grid-template-columns: repeat(4, 1fr) !important;
  grid-template-rows: repeat(4, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* 17-20 kişi için 5x4 grid */
.video-grid[data-count="17"],
.video-grid[data-count="18"],
.video-grid[data-count="19"],
.video-grid[data-count="20"] {
  grid-template-columns: repeat(5, 1fr) !important;
  grid-template-rows: repeat(4, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* 21-25 kişi için 5x5 grid */
.video-grid[data-count="21"],
.video-grid[data-count="22"],
.video-grid[data-count="23"],
.video-grid[data-count="24"],
.video-grid[data-count="25"] {
  grid-template-columns: repeat(5, 1fr) !important;
  grid-template-rows: repeat(5, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* 26-30 kişi için 6x5 grid */
.video-grid[data-count="26"],
.video-grid[data-count="27"],
.video-grid[data-count="28"],
.video-grid[data-count="29"],
.video-grid[data-count="30"] {
  grid-template-columns: repeat(6, 1fr) !important;
  grid-template-rows: repeat(5, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* 31-36 kişi için 6x6 grid */
.video-grid[data-count="31"],
.video-grid[data-count="32"],
.video-grid[data-count="33"],
.video-grid[data-count="34"],
.video-grid[data-count="35"],
.video-grid[data-count="36"] {
  grid-template-columns: repeat(6, 1fr) !important;
  grid-template-rows: repeat(6, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* 37-42 kişi için 7x6 grid */
.video-grid[data-count="37"],
.video-grid[data-count="38"],
.video-grid[data-count="39"],
.video-grid[data-count="40"],
.video-grid[data-count="41"],
.video-grid[data-count="42"] {
  grid-template-columns: repeat(7, 1fr) !important;
  grid-template-rows: repeat(6, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* 43-49 kişi için 7x7 grid */
.video-grid[data-count="43"],
.video-grid[data-count="44"],
.video-grid[data-count="45"],
.video-grid[data-count="46"],
.video-grid[data-count="47"],
.video-grid[data-count="48"],
.video-grid[data-count="49"] {
  grid-template-columns: repeat(7, 1fr) !important;
  grid-template-rows: repeat(7, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* 50+ kişi için 8x7 grid */
.video-grid[data-count="50"] {
  grid-template-columns: repeat(8, 1fr) !important;
  grid-template-rows: repeat(7, 1fr) !important;
  gap: 0.5rem !important;
  padding: 0.5rem !important;
}

/* Data attribute'lara göre ek optimizasyonlar */
.video-grid[data-columns="1"] {
  aspect-ratio: 16/9;
}

.video-grid[data-columns="2"] {
  aspect-ratio: 2/1;
}

.video-grid[data-columns="3"] {
  aspect-ratio: 3/2;
}

.video-grid[data-columns="4"] {
  aspect-ratio: 4/3;
}

.video-grid[data-columns="5"] {
  aspect-ratio: 5/4;
}

.video-grid[data-columns="6"] {
  aspect-ratio: 6/5;
}

.video-grid[data-columns="7"] {
  aspect-ratio: 7/6;
}

.video-grid[data-columns="8"] {
  aspect-ratio: 8/7;
}

/* Ekran oranına göre grid düzenlemeleri */
/* Portrait (yükseklik > genişlik) için */
@media (orientation: portrait) {
  /* 2 kişi için alta alta */
  .video-grid[data-count="2"] {
    grid-template-columns: 1fr !important;
    grid-template-rows: repeat(2, 1fr) !important;
  }
  
  /* 3-4 kişi için 2x2 grid */
  .video-grid[data-count="3"],
  .video-grid[data-count="4"] {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: repeat(2, 1fr) !important;
  }
  
  /* 5-6 kişi için 2x3 grid */
  .video-grid[data-count="5"],
  .video-grid[data-count="6"] {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: repeat(3, 1fr) !important;
  }
  
  /* 10-12 kişi için 3x4 grid */
  .video-grid[data-count="10"],
  .video-grid[data-count="11"],
  .video-grid[data-count="12"] {
    grid-template-columns: repeat(3, 1fr) !important;
    grid-template-rows: repeat(4, 1fr) !important;
  }
  
  /* 17-20 kişi için 4x5 grid */
  .video-grid[data-count="17"],
  .video-grid[data-count="18"],
  .video-grid[data-count="19"],
  .video-grid[data-count="20"] {
    grid-template-columns: repeat(4, 1fr) !important;
    grid-template-rows: repeat(5, 1fr) !important;
  }
  
  /* 26-30 kişi için 5x6 grid */
  .video-grid[data-count="26"],
  .video-grid[data-count="27"],
  .video-grid[data-count="28"],
  .video-grid[data-count="29"],
  .video-grid[data-count="30"] {
    grid-template-columns: repeat(5, 1fr) !important;
    grid-template-rows: repeat(6, 1fr) !important;
  }
  
  /* 37-42 kişi için 6x7 grid */
  .video-grid[data-count="37"],
  .video-grid[data-count="38"],
  .video-grid[data-count="39"],
  .video-grid[data-count="40"],
  .video-grid[data-count="41"],
  .video-grid[data-count="42"] {
    grid-template-columns: repeat(6, 1fr) !important;
    grid-template-rows: repeat(7, 1fr) !important;
  }
  
  /* 50+ kişi için 7x8 grid */
  .video-grid[data-count="50"] {
    grid-template-columns: repeat(7, 1fr) !important;
    grid-template-rows: repeat(8, 1fr) !important;
  }
}

/* Landscape (genişlik > yükseklik) için */
@media (orientation: landscape) {
  /* 2 kişi için yan yana */
  .video-grid[data-count="2"] {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: 1fr !important;
  }
  
  /* 3-4 kişi için yan yana */
  .video-grid[data-count="3"] {
    grid-template-columns: repeat(3, 1fr) !important;
    grid-template-rows: 1fr !important;
  }
  
  .video-grid[data-count="4"] {
    grid-template-columns: repeat(4, 1fr) !important;
    grid-template-rows: 1fr !important;
  }
  
  /* 5-6 kişi için 3x2 grid */
  .video-grid[data-count="5"],
  .video-grid[data-count="6"] {
    grid-template-columns: repeat(3, 1fr) !important;
    grid-template-rows: repeat(2, 1fr) !important;
  }
  
  /* 10-12 kişi için 4x3 grid */
  .video-grid[data-count="10"],
  .video-grid[data-count="11"],
  .video-grid[data-count="12"] {
    grid-template-columns: repeat(4, 1fr) !important;
    grid-template-rows: repeat(3, 1fr) !important;
  }
  
  /* 17-20 kişi için 5x4 grid */
  .video-grid[data-count="17"],
  .video-grid[data-count="18"],
  .video-grid[data-count="19"],
  .video-grid[data-count="20"] {
    grid-template-columns: repeat(5, 1fr) !important;
    grid-template-rows: repeat(4, 1fr) !important;
  }
  
  /* 26-30 kişi için 6x5 grid */
  .video-grid[data-count="26"],
  .video-grid[data-count="27"],
  .video-grid[data-count="28"],
  .video-grid[data-count="29"],
  .video-grid[data-count="30"] {
    grid-template-columns: repeat(6, 1fr) !important;
    grid-template-rows: repeat(5, 1fr) !important;
  }
  
  /* 37-42 kişi için 7x6 grid */
  .video-grid[data-count="37"],
  .video-grid[data-count="38"],
  .video-grid[data-count="39"],
  .video-grid[data-count="40"],
  .video-grid[data-count="41"],
  .video-grid[data-count="42"] {
    grid-template-columns: repeat(7, 1fr) !important;
    grid-template-rows: repeat(6, 1fr) !important;
  }
  
  /* 50+ kişi için 8x7 grid */
  .video-grid[data-count="50"] {
    grid-template-columns: repeat(8, 1fr) !important;
    grid-template-rows: repeat(7, 1fr) !important;
  }
}

/* Tablet için orta seviye responsive */
@media (max-width: 1024px) and (min-width: 769px) {
  .video-grid {
    gap: 0.4rem;
    padding: 0.4rem;
  }
}

@media (max-width: 768px) {
  .video-grid {
    gap: 0.3rem;
    padding: 0.3rem;
    /* Mobilde tüm videolar alta alta */
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
  }
  
  /* Mobilde tek kişi için tam ekran */
  .video-grid[data-count="1"] {
    max-width: 100% !important;
    width: 100% !important;
    height: 100% !important;
    gap: 0 !important;
    padding: 0 !important;
  }
  
  .video-grid[data-count="1"] .video-item {
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    max-height: none !important;
    aspect-ratio: auto !important;
  }
  
  /* Mobilde 2 kişi için eşit bölünme - alta alta */
  .video-grid[data-count="2"] {
    grid-template-columns: 1fr !important;
    grid-template-rows: repeat(2, 1fr) !important;
    gap: 0.3rem !important;
    padding: 0.3rem !important;
  }
  
  .video-grid[data-count="2"] .video-item {
    width: 100% !important;
    height: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-width: none !important;
    max-height: none !important;
    flex: 1 1 0 !important;
  }
  
  /* Mobilde 3-4 kişi için 2x2 grid */
  .video-grid[data-count="3"],
  .video-grid[data-count="4"] {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: repeat(2, 1fr) !important;
    gap: 0.3rem !important;
    padding: 0.3rem !important;
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
    gap: 0.3rem !important;
    padding: 0.3rem !important;
  }
}
</style>
