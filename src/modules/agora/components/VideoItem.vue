<template>
  <div 
    class="video-item"
    :class="{
      'local-video': isLocal,
      'screen-share': isScreenShare
    }"
  >
    <div class="video-wrapper">
      <div 
        v-show="shouldShowVideo"
        ref="videoElement"
        class="video-element"
      ></div>
      
      <!-- Placeholder when no video -->
      <div 
        v-if="shouldShowPlaceholder"
        class="placeholder-content"
      >
        <div class="avatar">
          {{ getUserInitials(displayName) }}
        </div>
        <div class="user-name">{{ displayName }}</div>
        <div class="user-status">
          <span v-if="user.isMuted" class="status-icon muted">🔇</span>
          <span v-if="user.isVideoOff" class="status-icon video-off">📹</span>
          <span v-if="isScreenShare" class="status-icon screen-share">🖥️</span>
        </div>
      </div>
      
      <!-- User Info - Always show when video is on -->
      <div v-if="shouldShowVideo" class="user-info">
        <div class="user-name">{{ displayName }}</div>
        <div class="user-status">
          <span v-if="user.isMuted" class="status-icon muted">🔇</span>
          <span v-if="user.isVideoOff" class="status-icon video-off">📹</span>
          <span v-if="isScreenShare" class="status-icon screen-share">🖥️</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch, ref, computed, onBeforeUnmount, nextTick } from 'vue'
import { getUserDisplayName, getRemoteUserDisplayName, isVideoUser, isScreenShareUser } from '../constants.js'
import { getUserInitials as getUserInitialsFromUtils } from '../utils/index.js'

// Props
const props = defineProps({
  user: { type: Object, required: true },
  hasVideo: { type: Boolean, default: false },
  videoRef: { type: [Object, Function], default: null },
  track: { type: Object, default: null }, // Yeni track prop'u
  isLocal: { type: Boolean, default: false },
  isScreenShare: { type: Boolean, default: false },
  logUI: { type: Function, default: () => {} }
})

const hasCalledVideoRef = ref(false)
const videoElement = ref(null)
let lastPlayedTrack = null

const displayName = computed(() => {
  if (props.isLocal) {
    return getUserDisplayName(props.user.uid, props.user.name?.split(' ')[0] || 'User')
  } else {
    return getRemoteUserDisplayName(props.user.uid, props.user.name?.split(' ')[0] || 'User')
  }
})

const shouldShowVideo = computed(() => {
  return !!props.hasVideo && !props.user?.isVideoOff && !!props.user
})

const shouldShowPlaceholder = computed(() => {
  return !!props.user && !shouldShowVideo.value
})

const userType = computed(() => {
  if (isVideoUser(props.user.uid)) {
    return 'VIDEO'
  } else if (isScreenShareUser(props.user.uid)) {
    return 'SCREEN_SHARE'
  } else {
    return 'BİLİNMEYEN'
  }
})

const getUserInitials = (name) => {
  return getUserInitialsFromUtils(name)
}

onMounted(async () => {
  // Production'da excessive logging'i azalt
  if (process.env.NODE_ENV === 'development') {
    props.logUI('Video öğesi yüklendi', { 
      user: props.user, 
      hasVideo: props.hasVideo, 
      isLocal: props.isLocal,
      shouldShowVideo: shouldShowVideo.value,
      shouldShowPlaceholder: shouldShowPlaceholder.value,
      track: !!props.track
    })
  }
  
  // Video element'inin oluşturulmasını bekle
  await nextTick()
  
  // Video ref callback'ini çağır
  if (videoElement.value) {
    handleVideoRef(videoElement.value)
  }
})

watch(() => props.hasVideo, async (newHasVideo) => {
  // Production'da excessive logging'i azalt
  if (process.env.NODE_ENV === 'development') {
    props.logUI('Video öğesi video durumu değişti', { 
      newHasVideo, 
      user: props.user, 
      isLocal: props.isLocal,
      shouldShowVideo: shouldShowVideo.value,
      shouldShowPlaceholder: shouldShowPlaceholder.value,
      track: !!props.track
    })
  }
  
  // Video durumu değiştiğinde ref callback'ini çağır
  if (newHasVideo && shouldShowVideo.value) {
    await nextTick()
    if (videoElement.value && !hasCalledVideoRef.value) {
      handleVideoRef(videoElement.value)
    }
  }
})

watch(() => props.user?.isVideoOff, (newVideoOff) => {
  props.logUI('Kullanıcı video durumu değişti', {
    newVideoOff,
    user: props.user,
    isLocal: props.isLocal,
    shouldShowVideo: shouldShowVideo.value,
    shouldShowPlaceholder: shouldShowPlaceholder.value,
    track: !!props.track
  })
})

// Track değiştiğinde veya videoElement oluştuğunda play et
watch(
  [() => props.track, videoElement],
  async ([newTrack, el], [oldTrack]) => {
    // Eski track'ı güvenli şekilde durdur
    if (oldTrack && lastPlayedTrack) {
      try { lastPlayedTrack.stop(); } catch (e) {}
      lastPlayedTrack = null
    }
    // Yeni track varsa ve element DOM'da ise
    if (newTrack && el) {
      try {
        await nextTick();
        await newTrack.play(el);
        lastPlayedTrack = newTrack;
      } catch (e) {
        props.logUI('track.play() hatası', e)
      }
    }
    // Video element değiştiğinde ref callback'ini çağır
    if (el && !hasCalledVideoRef.value) {
      handleVideoRef(el)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (lastPlayedTrack) {
    try { lastPlayedTrack.stop(); } catch (e) {}
    lastPlayedTrack = null
  }
})

// Video ref callback - optimized to prevent recursive calls
const handleVideoRef = (el) => {
  props.logUI('Video öğesi ref callback', { 
    element: !!el, 
    user: props.user, 
    isLocal: props.isLocal, 
    isScreenShare: props.isScreenShare,
    videoRefType: typeof props.videoRef,
    hasCalledBefore: hasCalledVideoRef.value,
    track: !!props.track
  })
  if (hasCalledVideoRef.value && el === null) {
    props.logUI('videoRef çağrısı atlanıyor - zaten çağrıldı ve element null')
    return
  }
  if (props.videoRef) {
    if (typeof props.videoRef === 'function') {
      props.logUI('videoRef fonksiyonu çağrılıyor')
      props.videoRef(el)
      hasCalledVideoRef.value = true
    } else if (props.videoRef && typeof props.videoRef === 'object' && 'value' in props.videoRef) {
      props.logUI('videoRef.value ayarlanıyor')
      props.videoRef.value = el
      hasCalledVideoRef.value = true
    }
  }
  if (el === null) {
    hasCalledVideoRef.value = false
  }
  if (props.isScreenShare && el) {
    props.logUI('Ekran paylaşımı video elementi hazır, event gönderiliyor')
  }
}
</script>

<style scoped>
.video-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a1a;
  aspect-ratio: 1;
  width: 100%;
  height: 100%;
  min-height: 200px;
  max-height: 400px;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

/* Yerel video için normal mod (sağ el sağda) - ayna modu yok */
.local-video .video-element {
  transform: none;
}

/* Uzak video için normal mod (sağ el sağda) - ayna modu yok */
.video-item:not(.local-video) .video-element {
  transform: none;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 1rem;
  text-align: center;
  width: 100%;
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-radius: 12px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: white;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.user-status {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
}

.status-icon {
  font-size: 1.2rem;
  padding: 0.25rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.status-icon.muted {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
}

.status-icon.video-off {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.2);
}

.status-icon.screen-share {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.2);
}

.user-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 1rem;
  color: white;
}

.user-info .user-name {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.user-info .user-status {
  gap: 0.25rem;
}

.user-info .status-icon {
  font-size: 1rem;
}

/* Local video styling */
.local-video {
  border: 2px solid #3b82f6;
}

/* Screen share styling */
.screen-share {
  border: 2px solid #10b981;
}

/* Büyük ekranlar için daha büyük video alanları */
@media (min-width: 1920px) {
  .video-item {
    min-height: 250px;
    max-height: 500px;
  }
  
  .avatar {
    width: 100px;
    height: 100px;
    font-size: 2.5rem;
  }
}

@media (max-width: 768px) {
  .video-item {
    aspect-ratio: 1;
    min-height: 150px;
    max-height: 300px;
  }
  
  .avatar {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .user-name {
    font-size: 0.9rem;
  }
  
  .status-icon {
    font-size: 1rem;
  }
}
</style> 