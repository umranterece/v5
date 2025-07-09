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
        v-if="hasVideo"
        :ref="handleVideoRef" 
        class="video-element"
      ></div>
      
      <!-- Placeholder when no video -->
      <div 
        v-else
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
      
      <!-- User Info -->
      <div v-if="hasVideo" class="user-info">
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
import { onMounted, watch, ref, computed } from 'vue'
import { getUserDisplayName, getRemoteUserDisplayName, isVideoUser, isScreenShareUser } from '../constants.js'

// Props
const props = defineProps({
  user: { type: Object, required: true },
  hasVideo: { type: Boolean, default: false },
  videoRef: { type: [Object, Function], default: null }, // Allow both Object and Function
  isLocal: { type: Boolean, default: false },
  isScreenShare: { type: Boolean, default: false }
})

// Local ref to track if we've already called the videoRef callback
const hasCalledVideoRef = ref(false)

// Computed
const displayName = computed(() => {
  if (props.isLocal) {
    return getUserDisplayName(props.user.uid, props.user.name?.split(' ')[0] || 'User')
  } else {
    return getRemoteUserDisplayName(props.user.uid, props.user.name?.split(' ')[0] || 'User')
  }
})

const userType = computed(() => {
  if (isVideoUser(props.user.uid)) {
    return 'VIDEO'
  } else if (isScreenShareUser(props.user.uid)) {
    return 'SCREEN_SHARE'
  } else {
    return 'UNKNOWN'
  }
})

// Methods
const getUserInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Debug logging
onMounted(() => {
  console.log('=== VIDEO ITEM MOUNTED ===')
  console.log('User:', props.user)
  console.log('Has video:', props.hasVideo)
  console.log('Is local:', props.isLocal)
  console.log('Video ref function:', props.videoRef)
})

watch(() => props.hasVideo, (newHasVideo) => {
  console.log('=== VIDEO ITEM HAS VIDEO CHANGED ===')
  console.log('New has video:', newHasVideo)
  console.log('User:', props.user)
  console.log('Is local:', props.isLocal)
})

// Video ref callback - optimized to prevent recursive calls
const handleVideoRef = (el) => {
  console.log('=== VIDEO ITEM REF CALLBACK ===')
  console.log('Element:', el)
  console.log('User:', props.user)
  console.log('Is local:', props.isLocal)
  console.log('Is screen share:', props.isScreenShare)
  console.log('Video ref type:', typeof props.videoRef)
  console.log('Has called videoRef before:', hasCalledVideoRef.value)
  
  // Prevent recursive calls
  if (hasCalledVideoRef.value && el === null) {
    console.log('Skipping videoRef call - already called and element is null')
    return
  }
  
  if (props.videoRef) {
    if (typeof props.videoRef === 'function') {
      console.log('Calling videoRef function...')
      props.videoRef(el)
      hasCalledVideoRef.value = true
    } else if (props.videoRef && typeof props.videoRef === 'object' && 'value' in props.videoRef) {
      console.log('Setting videoRef.value...')
      props.videoRef.value = el
      hasCalledVideoRef.value = true
    }
  }
  
  // Reset flag when element is null (component unmounting)
  if (el === null) {
    hasCalledVideoRef.value = false
  }
  
  // Eğer ekran paylaşımı ise ve element varsa, hemen bildir
  if (props.isScreenShare && el) {
    console.log('Screen share video element ready, emitting event...')
    // Burada bir event emit edebiliriz
  }
}
</script>

<style scoped>
.video-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a1a;
  min-height: 200px;
}

.video-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.video-element {
  width: 100%;
  height: 100%;
  min-height: 200px;
  object-fit: cover;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  padding: 1rem;
  text-align: center;
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
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.user-status {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.status-icon {
  font-size: 1.2rem;
}

.status-icon.muted {
  color: #ef4444;
}

.status-icon.video-off {
  color: #f59e0b;
}

.status-icon.screen-share {
  color: #3b82f6;
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

@media (max-width: 768px) {
  .video-item {
    min-height: 150px;
  }
  
  .video-wrapper {
    min-height: 150px;
  }
  
  .video-element {
    min-height: 150px;
  }
  
  .placeholder-content {
    min-height: 150px;
  }
  
  .avatar {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
}
</style> 