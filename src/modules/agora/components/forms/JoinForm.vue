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
  gap: 2rem;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background: var(--rs-agora-gradient-surface);
  border-radius: var(--rs-agora-radius-xl);
  box-shadow: var(--rs-agora-shadow-xl);
  backdrop-filter: blur(20px);
  border: 1px solid var(--rs-agora-border-primary);
}

.form-header {
  text-align: center;
  margin-bottom: 1rem;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: var(--rs-agora-gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.form-subtitle {
  color: var(--rs-agora-text-secondary);
  font-size: 1rem;
  opacity: 0.8;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: var(--rs-agora-text-primary);
  font-size: 0.9rem;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.channel-input {
  width: 100%;
  padding: 16px 20px;
  background: var(--rs-agora-transparent-white-05);
  border: 2px solid var(--rs-agora-transparent-white-10);
  border-radius: var(--rs-agora-radius-lg);
  font-size: 16px;
  color: var(--rs-agora-white);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.channel-input::placeholder {
  color: var(--rs-agora-text-secondary);
}

.channel-input:focus {
  outline: none;
  border-color: var(--rs-agora-primary);
  background: var(--rs-agora-transparent-white-10);
  box-shadow: 0 0 20px var(--rs-agora-primary);
}

.input-border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: var(--rs-agora-radius-lg);
  background: var(--rs-agora-gradient-primary);
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
  background: var(--rs-agora-gradient-primary);
  color: var(--rs-agora-white);
  border: none;
  border-radius: var(--rs-agora-radius-lg);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.join-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--rs-agora-primary);
}

.join-button:active:not(:disabled) {
  transform: translateY(0);
}

.join-button:disabled {
  background: var(--rs-agora-medium-gray);
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
  background: linear-gradient(90deg, transparent, var(--rs-agora-transparent-white-20), transparent);
  transition: left 0.5s ease;
}

.join-button:hover:not(:disabled) .button-glow {
  left: 100%;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.join-button:disabled {
  animation: pulse 2s infinite;
}

/* Responsive Design */
@media (max-width: 768px) {
  .join-form {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .form-title {
    font-size: 1.5rem;
  }
  
  .form-subtitle {
    font-size: 0.9rem;
  }
  
  .channel-input {
    padding: 14px 16px;
    font-size: 14px;
  }
  
  .join-button {
    padding: 14px 20px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .join-form {
    padding: 1rem;
    margin: 0.5rem;
  }
  
  .form-title {
    font-size: 1.25rem;
  }
  
  .form-subtitle {
    font-size: 0.8rem;
  }
}
</style>
