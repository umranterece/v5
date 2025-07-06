<template>
  <div class="agora-controls">
    <!-- Join Form -->
    <div v-if="!isConnected" class="join-form">
      <div class="join-content">
        <div class="join-header">
          <div class="logo">
            <div class="logo-icon">🎥</div>
            <h2>Video Conference</h2>
          </div>
          <p class="join-subtitle">Enter a channel name to start or join a meeting</p>
        </div>
        
        <div class="form-group">
          <div class="input-wrapper">
            <input
              v-model="channelName"
              type="text"
              value="test"
              placeholder="Enter channel name"
              class="channel-input"
              @keyup.enter="joinChannel"
            />
            <div class="input-border"></div>
          </div>
          <button 
            @click="joinChannel" 
            :disabled="isJoining || !channelName.trim()"
            class="join-button"
          >
            <span class="button-text">{{ isJoining ? 'Joining...' : 'Join Channel' }}</span>
            <div class="button-glow"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div v-else class="controls">
      <!-- Camera Toggle -->
      <button 
        @click="toggleCamera"
        :class="['control-button', { active: !isLocalVideoOff }]"
        :title="isLocalVideoOff ? 'Turn on camera' : 'Turn off camera'"
      >
        <span class="icon">{{ isLocalVideoOff ? '📹' : '📹' }}</span>
        <span class="label">{{ isLocalVideoOff ? 'Camera Off' : 'Camera On' }}</span>
      </button>

      <!-- Microphone Toggle -->
      <button 
        @click="toggleMicrophone"
        :class="['control-button', { active: !isLocalAudioMuted }]"
        :title="isLocalAudioMuted ? 'Unmute microphone' : 'Mute microphone'"
      >
        <span class="icon">{{ isLocalAudioMuted ? '🔇' : '🎤' }}</span>
        <span class="label">{{ isLocalAudioMuted ? 'Muted' : 'Unmuted' }}</span>
      </button>

      <!-- Leave Button -->
      <button 
        @click="leaveChannel"
        :disabled="isLeaving"
        class="control-button leave-button"
        title="Leave channel"
      >
        <span class="icon">📞</span>
        <span class="label">{{ isLeaving ? 'Leaving...' : 'Leave' }}</span>
      </button>
    </div>

    <!-- Status -->
    <div v-if="isConnected" class="status">
      <div class="status-item">
        <span class="status-label">Connected:</span>
        <span class="status-value">{{ channelName }}</span>
      </div>
      <div class="status-item">
        <span class="status-label">Users:</span>
        <span class="status-value">{{ connectedUsersCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useVideoStore } from '../store/video.js'

// Props
const props = defineProps({
  onJoin: {
    type: Function,
    required: true
  },
  onLeave: {
    type: Function,
    required: true
  },
  onToggleCamera: {
    type: Function,
    required: true
  },
  onToggleMicrophone: {
    type: Function,
    required: true
  },
  isJoining: {
    type: Boolean,
    default: false
  },
  isLeaving: {
    type: Boolean,
    default: false
  }
})

// Store
const videoStore = useVideoStore()

// Local state
const channelName = ref('test')

// Computed
const isConnected = computed(() => videoStore.isConnected)
const isLocalVideoOff = computed(() => videoStore.isLocalVideoOff)
const isLocalAudioMuted = computed(() => videoStore.isLocalAudioMuted)
const connectedUsersCount = computed(() => videoStore.connectedUsersCount)

// Methods
const joinChannel = async () => {
  if (!channelName.value.trim() || props.isJoining) return
  
  try {
    await props.onJoin(channelName.value.trim())
  } catch (error) {
    console.error('Failed to join channel:', error)
  }
}

const leaveChannel = async () => {
  if (props.isLeaving) return
  
  try {
    await props.onLeave()
    channelName.value = ''
  } catch (error) {
    console.error('Failed to leave channel:', error)
  }
}

const toggleCamera = () => {
  props.onToggleCamera(!isLocalVideoOff.value)
}

const toggleMicrophone = () => {
  props.onToggleMicrophone(!isLocalAudioMuted.value)
}
</script>

<style scoped>
.agora-controls {
  padding: 20px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.join-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.join-content {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.join-header {
  margin-bottom: 32px;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.logo-icon {
  font-size: 48px;
  animation: pulse 2s infinite;
}

.logo h2 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.join-subtitle {
  color: #a0a0a0;
  font-size: 16px;
  margin: 0;
  line-height: 1.5;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.channel-input {
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 16px;
  color: white;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.channel-input::placeholder {
  color: #a0a0a0;
}

.channel-input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}

.input-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.channel-input:focus + .input-border {
  opacity: 0.3;
}

.join-button {
  position: relative;
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.join-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.join-button:active:not(:disabled) {
  transform: translateY(0);
}

.join-button:disabled {
  background: #444;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.button-text {
  position: relative;
  z-index: 2;
}

.button-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.join-button:hover:not(:disabled) .button-glow {
  left: 100%;
}

.controls {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.control-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
  backdrop-filter: blur(10px);
}

.control-button:hover {
  border-color: #667eea;
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  background: rgba(255, 255, 255, 0.1);
}

.control-button.active {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.2);
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
}

.control-button.active:hover {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.3);
  box-shadow: 0 8px 25px rgba(74, 222, 128, 0.4);
  transform: translateY(-3px);
}

.control-button.leave-button {
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.control-button.leave-button:hover {
  background: #ff6b6b;
  color: white;
  box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.icon {
  font-size: 24px;
}

.label {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: #e0e0e0;
}

.status {
  margin-top: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  font-weight: 500;
  color: #a0a0a0;
}

.status-value {
  font-weight: 600;
  color: #e0e0e0;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .agora-controls {
    padding: 16px;
  }
  
  .logo h2 {
    font-size: 24px;
  }
  
  .join-subtitle {
    font-size: 14px;
  }
  
  .controls {
    gap: 12px;
  }
  
  .control-button {
    min-width: 80px;
    padding: 12px 16px;
  }
  
  .icon {
    font-size: 20px;
  }
  
  .label {
    font-size: 11px;
  }
}
</style> 