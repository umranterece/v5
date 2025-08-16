<template>
  <div class="join-form-container">
    <div class="join-form">
      <div class="join-content">
        <div class="join-header">
          <div class="logo">
            <div class="logo-icon">🎥</div>
            <h2>Video Konferans</h2>
          </div>
          <p class="join-subtitle">Bir toplantıya başlamak veya katılmak için kanal adı girin</p>
        </div>
        
        <div class="form-group">
          <div class="input-wrapper">
            <input
              v-model="channelInput"
              type="text"
              :placeholder="defaultChannel || 'Kanal adı girin'"
              class="channel-input"
              @keyup.enter="handleJoin"
            />
            <div class="input-border"></div>
          </div>
          <button 
            @click="handleJoin" 
            :disabled="isJoining || !channelInput.trim()"
            class="join-button"
          >
            <span class="button-text">{{ isJoining ? 'Katılıyor...' : 'Kanala Katıl' }}</span>
            <div class="button-glow"></div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

// Props
const props = defineProps({
  defaultChannel: { type: String, default: '' },
  isJoining: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits(['join'])

// Local state
const channelInput = ref('')

// Methods
const handleJoin = () => {
  if (channelInput.value.trim() && !props.isJoining) {
    emit('join', channelInput.value.trim())
  }
}

// Lifecycle
onMounted(() => {
  if (props.defaultChannel) {
    channelInput.value = props.defaultChannel
  }
})

// Watch for prop changes
watch(() => props.defaultChannel, (newValue) => {
  if (newValue && newValue !== channelInput.value) {
    channelInput.value = newValue
  }
})
</script>

<style scoped>
/* Join Form Container */
.join-form-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
}

.join-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  max-width: 500px;
  padding: 40px;
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

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Responsive */
@media (max-width: 768px) {
  .join-form {
    padding: 30px 20px;
    margin: 20px;
  }
  
  .join-header h2 {
    font-size: 2rem;
  }
  
  .logo-icon {
    font-size: 3rem;
  }
}
</style>
