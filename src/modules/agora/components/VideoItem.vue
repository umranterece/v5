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
        :ref="videoRef" 
        class="video-element"
      ></div>
      
      <!-- Placeholder when no video -->
      <div 
        v-else
        class="placeholder-content"
      >
        <div class="avatar">
          {{ getUserInitials(user.name) }}
        </div>
        <div class="user-name">{{ user.name }}{{ isLocal ? ' (You)' : '' }}</div>
        <div class="user-status">
          <span v-if="user.isMuted" class="status-icon muted">🔇</span>
          <span v-if="user.isVideoOff" class="status-icon video-off">📹</span>
          <span v-if="isScreenShare" class="status-icon screen-share">🖥️</span>
        </div>
      </div>
      
      <!-- User Info -->
      <div v-if="hasVideo" class="user-info">
        <div class="user-name">{{ user.name }}{{ isLocal ? ' (You)' : '' }}</div>
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
// Props
const props = defineProps({
  user: { type: Object, required: true },
  hasVideo: { type: Boolean, default: false },
  videoRef: { type: Object, default: null },
  isLocal: { type: Boolean, default: false },
  isScreenShare: { type: Boolean, default: false }
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