<template>
  <div 
    class="video-item"
    :class="{
      'local-video': isLocal,
      'screen-share': isScreenShare,
      'clickable': isClickable
    }"
    @click="handleVideoClick"
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
          <span v-if="user.isMuted" class="status-badge muted">
            <SpeakerXMarkIcon />
          </span>
          <span v-if="user.isVideoOff" class="status-badge video-off">
            <VideoCameraSlashIcon />
          </span>
          <span v-if="isScreenShare" class="status-badge screen-share">
            <ComputerDesktopIcon />
          </span>
        </div>
      </div>
      
      <!-- User Info - Always show when video is on -->
      <div v-if="shouldShowVideo" class="user-info">
        <div class="user-name">{{ displayName }}</div>
        <div class="user-status">
          <span v-if="user.isMuted" class="status-badge muted">
            <SpeakerXMarkIcon />
          </span>
          <span v-if="user.isVideoOff" class="status-badge video-off">
            <VideoCameraSlashIcon />
          </span>
          <span v-if="isScreenShare" class="status-badge screen-share">
            <ComputerDesktopIcon />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { SpeakerXMarkIcon, VideoCameraSlashIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { getUserDisplayName, getRemoteUserDisplayName, isVideoUser, isScreenShareUser } from '../../constants.js'
import { getUserInitials as getUserInitialsFromUtils } from '../../utils/index.js'

// Props
const props = defineProps({
  user: { type: Object, required: true },
  hasVideo: { type: Boolean, default: false },
  videoRef: { type: [Object, Function], default: null },
  track: { type: Object, default: null }, // Yeni track prop'u
  isLocal: { type: Boolean, default: false },
  isScreenShare: { type: Boolean, default: false },
  isClickable: { type: Boolean, default: false }, // Yeni prop: sadece Spotlight modunda true
  logger: {
    type: Object,
    default: () => ({ debug: () => {}, info: () => {}, warn: () => {}, error: () => {}, fatal: () => {} })
  }
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
    props.logger.info('Video öğesi yüklendi', { 
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
    props.logger.info('Video öğesi video durumu değişti', { 
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
  props.logger.info('Kullanıcı video durumu değişti', {
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
    console.log('🟢 [VIDEOITEM] Track/Element değişti:', {
      uid: props.user?.uid,
      name: props.user?.name,
      isScreenShare: props.isScreenShare,
      hasNewTrack: !!newTrack,
      hasElement: !!el,
      trackId: newTrack?.id,
      trackEnabled: newTrack?.enabled,
      trackReadyState: newTrack?.readyState
    })
    
    // Eski track'ı güvenli şekilde durdur
    if (oldTrack && lastPlayedTrack) {
      try { 
        console.log('🟡 [VIDEOITEM] Eski track durduruluyor:', oldTrack.id)
        oldTrack.stop(); 
      } catch (e) {
        console.log('🔴 [VIDEOITEM] Eski track durdurma hatası:', e)
      }
      lastPlayedTrack = null
    }
    
    // Yeni track varsa ve element DOM'da ise
    if (newTrack && el) {
      try {
        console.log('🟢 [VIDEOITEM] Track play edilmeye çalışılıyor:', {
          trackId: newTrack.id,
          trackEnabled: newTrack.enabled,
          trackReadyState: newTrack.readyState,
          elementType: el.constructor.name
        })
        
        await nextTick();
        await newTrack.play(el);
        lastPlayedTrack = newTrack;
        
        console.log('🟢 [VIDEOITEM] Track başarıyla play edildi:', newTrack.id)
      } catch (e) {
        console.error('🔴 [VIDEOITEM] track.play() hatası:', e)
        props.logger.error(e, { context: 'track.play' })
      }
    } else {
      console.log('🟡 [VIDEOITEM] Track play edilemedi:', {
        hasTrack: !!newTrack,
        hasElement: !!el,
        trackId: newTrack?.id
      })
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
  props.logger.info('Video öğesi ref callback', { 
    element: !!el, 
    user: props.user, 
    isLocal: props.isLocal, 
    isScreenShare: props.isScreenShare,
    videoRefType: typeof props.videoRef,
    hasCalledBefore: hasCalledVideoRef.value,
    track: !!props.track
  })
  if (hasCalledVideoRef.value && el === null) {
    props.logger.info('videoRef çağrısı atlanıyor - zaten çağrıldı ve element null')
    return
  }
  if (props.videoRef) {
    if (typeof props.videoRef === 'function') {
      props.logger.info('videoRef fonksiyonu çağrılıyor')
      props.videoRef(el)
      hasCalledVideoRef.value = true
    } else if (props.videoRef && typeof props.videoRef === 'object' && 'value' in props.videoRef) {
      props.logger.info('videoRef.value ayarlanıyor')
      props.videoRef.value = el
      hasCalledVideoRef.value = true
    }
  }
  if (el === null) {
    hasCalledVideoRef.value = false
  }
  if (props.isScreenShare && el) {
    props.logger.info('Ekran paylaşımı video elementi hazır, event gönderiliyor')
  }
}

// Handle video click event
const handleVideoClick = () => {
  // Sadece clickable olduğunda çalışsın
  if (!props.isClickable) {
    return
  }
  
  props.logger.info('Video öğesine tıklandı', {
    user: props.user,
    isLocal: props.isLocal,
    isScreenShare: props.isScreenShare,
    hasVideo: props.hasVideo,
    isVideoOff: props.user?.isVideoOff,
    isClickable: props.isClickable
  })
  emit('video-click', props.user)
}

// Emit video-click event
const emit = defineEmits(['video-click'])
</script>

<style scoped>
.video-item {
  position: relative;
  border-radius: var(--rs-agora-radius-lg);
  overflow: hidden;
  background: var(--rs-agora-gradient-video);
  aspect-ratio: 1;
  width: 100%;
  height: 100%;
  min-height: 200px;
  max-height: 400px;
  border: 1px solid var(--rs-agora-border-primary-light);
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
  border-radius: var(--rs-agora-radius-lg);
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
  background: var(--rs-agora-gradient-placeholder);
  border-radius: var(--rs-agora-radius-lg);
  backdrop-filter: blur(8px);
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--rs-agora-gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: var(--rs-agora-white);
  margin-bottom: 1rem;
  box-shadow: var(--rs-agora-shadow-md);
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--rs-agora-text-primary);
  margin-bottom: 0.5rem;
  text-shadow: 0 1px 2px var(--rs-agora-transparent-black-50);
}

.user-status {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
}

.status-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--rs-agora-transparent-white-10);
  backdrop-filter: blur(10px);
  border: 2px solid var(--rs-agora-transparent-white-20);
  transition: all 0.2s ease;
}

.status-badge.muted {
  color: var(--rs-agora-error);
  background: var(--rs-agora-transparent-error-20);
  border-color: var(--rs-agora-transparent-error-30);
}

.status-badge.muted:hover {
  background: var(--rs-agora-transparent-error-30);
  border-color: var(--rs-agora-transparent-error-40);
  transform: scale(1.1);
}

.status-badge.video-off {
  color: var(--rs-agora-warning);
  background: var(--rs-agora-transparent-warning-20);
  border-color: var(--rs-agora-transparent-warning-30);
}

.status-badge.video-off:hover {
  background: var(--rs-agora-transparent-warning-30);
  border-color: var(--rs-agora-transparent-warning-40);
  transform: scale(1.1);
}

.status-badge.screen-share {
  color: var(--rs-agora-info);
  background: var(--rs-agora-transparent-info-20);
  border-color: var(--rs-agora-transparent-info-30);
}

.status-badge.screen-share:hover {
  background: var(--rs-agora-transparent-info-30);
  border-color: var(--rs-agora-transparent-info-40);
  transform: scale(1.1);
}

.status-badge svg {
  width: 18px;
  height: 18px;
  color: currentColor;
  stroke-width: 2;
}

.user-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, var(--rs-agora-transparent-black-70));
  padding: 1rem;
  color: var(--rs-agora-white);
}

.user-info .user-name {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.user-info .user-status {
  gap: 0.25rem;
}

.user-info .status-badge {
  width: 28px;
  height: 28px;
}

.user-info .status-badge svg {
  width: 16px;
  height: 16px;
}

/* Local video styling */
.local-video {
  border: 2px solid var(--rs-agora-info);
}

/* Screen share styling */
.screen-share {
  border: 2px solid var(--rs-agora-success);
}

/* Clickable styling */
.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable:hover {
  transform: scale(1.02);
  box-shadow: var(--rs-agora-shadow-lg);
}

.clickable:active {
  transform: scale(0.98);
}

/* Focus styling for accessibility */
.clickable:focus {
  outline: 2px solid var(--rs-agora-blue-primary);
  outline-offset: 2px;
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
  
  .status-badge {
    width: 36px;
    height: 36px;
  }
  
  .status-badge svg {
    width: 20px;
    height: 20px;
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
  
  .status-badge {
    width: 24px;
    height: 24px;
  }
  
  .status-badge svg {
    width: 14px;
    height: 14px;
  }
}
</style> 