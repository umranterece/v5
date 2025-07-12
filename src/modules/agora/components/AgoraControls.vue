<template>
  <div class="agora-controls">
    <!-- Settings and Log Buttons (top center) -->
    <div v-if="isConnected" class="top-buttons">
    </div>

    <!-- Join Form -->
    <div v-if="!isConnected" class="join-form">
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
              value="test"
              placeholder="Kanal adı girin"
              class="channel-input"
              @keyup.enter="joinChannel"
            />
            <div class="input-border"></div>
          </div>
          <button 
            @click="joinChannel" 
            :disabled="isJoining || !channelInput.trim()"
            class="join-button"
          >
            <span class="button-text">{{ isJoining ? 'Katılıyor...' : 'Kanala Katıl' }}</span>
            <div class="button-glow"></div>
          </button>
        </div>
      </div>
    </div>



    <!-- Controls -->
    <div v-if="isConnected" class="controls">
      <!-- Camera Toggle -->
      <button 
        @click="toggleCamera"
        :class="['control-button', { active: !isLocalVideoOff && canUseCamera, disabled: !canUseCamera }]"
        :disabled="!canUseCamera"
        :title="getCameraTitle"
      >
        <span class="icon">{{ getCameraIcon }}</span>
        <span class="label">{{ getCameraLabel }}</span>
      </button>

      <!-- Microphone Toggle -->
      <button 
        @click="toggleMicrophone"
        :class="['control-button', { active: !isLocalAudioMuted && canUseMicrophone, disabled: !canUseMicrophone }]"
        :disabled="!canUseMicrophone"
        :title="getMicrophoneTitle"
      >
        <span class="icon">{{ getMicrophoneIcon }}</span>
        <span class="label">{{ getMicrophoneLabel }}</span>
      </button>

      <!-- Screen Share Toggle - Only show on desktop -->
      <button
        v-if="props.supportsScreenShare"
        @click="props.onToggleScreenShare"
        :class="['control-button', { active: props.isScreenSharing }]"
        :title="props.isScreenSharing ? 'Ekran Paylaşımını Durdur' : 'Ekran Paylaşımını Başlat'"
      >
        <span class="icon">{{ props.isScreenSharing ? '❌🖥️' : '🖥️' }}</span>
        <span class="label">{{ props.isScreenSharing ? 'Paylaşımı Durdur' : 'Ekranı Paylaş' }}</span>
      </button>

      <!-- Leave Button -->
      <button 
        @click="leaveChannel"
        :disabled="isLeaving"
        class="control-button leave-button"
        title="Kanaldan ayrıl"
      >
        <span class="icon">📞</span>
        <span class="label">{{ isLeaving ? 'Ayrılıyor...' : 'Ayrıl' }}</span>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Props
const props = defineProps({
  channelName: { type: String, default: 'test' },
  isConnected: { type: Boolean, default: false },
  isLocalVideoOff: { type: Boolean, default: false },
  isLocalAudioMuted: { type: Boolean, default: false },
  canUseCamera: { type: Boolean, default: true },
  canUseMicrophone: { type: Boolean, default: true },
  connectedUsersCount: { type: Number, default: 0 },
  isJoining: { type: Boolean, default: false },
  isLeaving: { type: Boolean, default: false },
  onJoin: { type: Function, default: () => {} },
  onLeave: { type: Function, default: () => {} },
  onToggleCamera: { type: Function, default: () => {} },
  onToggleMicrophone: { type: Function, default: () => {} },
  isScreenSharing: { type: Boolean, default: false },
  onToggleScreenShare: { type: Function, default: () => {} },
  supportsScreenShare: { type: Boolean, default: false },
  settingsOpen: { type: Boolean, default: false },
  // Network Quality Props
  networkQualityLevel: { type: String, default: 'Unknown' },
  networkQualityColor: { type: String, default: '#6b7280' },
  networkBitrate: { type: Number, default: 0 },
  networkFrameRate: { type: Number, default: 0 },
  networkRtt: { type: Number, default: 0 },
  networkPacketLoss: { type: Number, default: 0 },
  // Logger Props
  logUI: { type: Function, default: () => {} },
  logError: { type: Function, default: () => {} },
  trackUserAction: { type: Function, default: () => {} }
})

const channelInput = ref(props.channelName || 'test')

const joinChannel = async () => {
  if (!channelInput.value.trim() || props.isJoining) return
  try {
    props.trackUserAction('joinChannel', { channelName: channelInput.value.trim() })
    await props.onJoin(channelInput.value.trim())
  } catch (error) {
    props.logError(error, { context: 'joinChannel', channelName: channelInput.value.trim() })
  }
}

const leaveChannel = async () => {
  if (props.isLeaving) return
  try {
    props.trackUserAction('leaveChannel', { channelName: props.channelName })
    await props.onLeave()
    channelInput.value = ''
  } catch (error) {
    props.logError(error, { context: 'leaveChannel', channelName: props.channelName })
  }
}

const toggleCamera = () => {
  const newVideoOffState = !props.isLocalVideoOff
  props.logUI('Kamera değiştir', {
    currentState: props.isLocalVideoOff ? 'off' : 'on',
    newState: newVideoOffState ? 'off' : 'on',
    canUseCamera: props.canUseCamera
  })
  
  props.trackUserAction('toggleCamera', { 
    currentState: props.isLocalVideoOff ? 'off' : 'on',
    newState: newVideoOffState ? 'off' : 'on'
  })
  props.onToggleCamera(newVideoOffState)
}

const toggleMicrophone = () => {
  if (props.canUseMicrophone) {
    const newMutedState = !props.isLocalAudioMuted
    props.logUI('Mikrofon değiştir', {
      currentState: props.isLocalAudioMuted ? 'muted' : 'unmuted',
      newState: newMutedState ? 'muted' : 'unmuted',
      canUseMicrophone: props.canUseMicrophone
    })
    
    props.trackUserAction('toggleMicrophone', { 
      currentState: props.isLocalAudioMuted ? 'muted' : 'unmuted',
      newState: newMutedState ? 'muted' : 'unmuted'
    })
    props.onToggleMicrophone(newMutedState)
  }
}

// Helper functions for camera
const getCameraIcon = computed(() => {
  if (!props.canUseCamera) return '🚫📹'
  return props.isLocalVideoOff ? '📹' : '📹'
})

const getCameraLabel = computed(() => {
  if (!props.canUseCamera) return 'Kamera Yok'
  return props.isLocalVideoOff ? 'Kamera Kapalı' : 'Kamera Açık'
})

const getCameraTitle = computed(() => {
  if (!props.canUseCamera) return 'Kamera mevcut değil'
  return props.isLocalVideoOff ? 'Kamerayı aç' : 'Kamerayı kapat'
})

// Helper functions for microphone
const getMicrophoneIcon = computed(() => {
  if (!props.canUseMicrophone) return '🚫🎤'
  return props.isLocalAudioMuted ? '🔇' : '🎤'
})

const getMicrophoneLabel = computed(() => {
  if (!props.canUseMicrophone) return 'Mikrofon Yok'
  return props.isLocalAudioMuted ? 'Sessiz' : 'Sesli'
})

const getMicrophoneTitle = computed(() => {
  if (!props.canUseMicrophone) return 'Mikrofon mevcut değil'
  return props.isLocalAudioMuted ? 'Mikrofonu aç' : 'Mikrofonu kapat'
})

// Modal açıldığında body scroll'unu engelle
const openSettings = () => {
  // This function is no longer needed as the modal is removed.
  // Keeping it here for now, but it will be removed in a subsequent edit.
}

// Modal kapandığında body scroll'unu geri aç
const closeSettings = () => {
  // This function is no longer needed as the modal is removed.
  // Keeping it here for now, but it will be removed in a subsequent edit.
}
const videoDevices = ref([])
const audioDevices = ref([])
const selectedCameraId = ref('')
const selectedMicId = ref('')
const selectedVideoQuality = ref('1080p_1')
const selectedScreenQuality = ref('1080p_1')

const videoQualityPresets = [
  { value: '360p_1', label: '360p (Düşük)' },
  { value: '480p_1', label: '480p (Orta)' },
  { value: '720p_1', label: '720p (Yüksek)' },
  { value: '1080p_1', label: '1080p (Çok Yüksek)' }
]
const screenQualityPresets = [
  { value: '360p_1', label: '360p (Düşük)' },
  { value: '480p_1', label: '480p (Orta)' },
  { value: '720p_1', label: '720p (Yüksek)' },
  { value: '1080p_1', label: '1080p (Çok Yüksek)' }
]

// Cihaz listesini al
const getDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  videoDevices.value = devices.filter(d => d.kind === 'videoinput')
  audioDevices.value = devices.filter(d => d.kind === 'audioinput')
  if (!selectedCameraId.value && videoDevices.value.length) selectedCameraId.value = videoDevices.value[0].deviceId
  if (!selectedMicId.value && audioDevices.value.length) selectedMicId.value = audioDevices.value[0].deviceId
}
onMounted(getDevices)

// Ayarları uygula ve parent'a bildir
const emit = defineEmits(['settings-changed', 'open-settings', 'open-logs'])
const applySettings = () => {
  emit('settings-changed', {
    cameraId: selectedCameraId.value,
    micId: selectedMicId.value,
    videoQuality: selectedVideoQuality.value,
    screenQuality: selectedScreenQuality.value
  })
  // showSettings.value = false // This line is no longer needed
}
</script>

<style scoped>
.agora-controls {
  padding: 8px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: relative; /* Added for settings button positioning */
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
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 8px; /* Added margin to separate from settings button */
}

.control-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 70px;
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
  font-size: 18px;
}

.label {
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  color: #e0e0e0;
}





/* Floating settings button (top-right) */
.settings-fab {
  position: fixed;
  top: 32px;
  right: 32px;
  z-index: 1200;
  background: rgba(34, 34, 34, 0.85);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  backdrop-filter: blur(6px);
}
.settings-fab:hover {
  background: rgba(60, 60, 60, 0.95);
  box-shadow: 0 12px 40px rgba(0,0,0,0.35);
  transform: scale(1.07);
}

/* Modern glassmorphic modal - fills .agora-controls */
.agora-controls {
  position: relative;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.settings-modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(20, 20, 40, 0.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  overflow-y: auto;
}
.settings-modal-glass {
  background: rgba(34, 34, 44, 0.85);
  border-radius: 20px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.45);
  padding: 32px 28px 28px 28px;
  width: 100%;
  max-width: 420px;
  color: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1.5px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(16px);
  animation: modalPopIn 0.25s cubic-bezier(.4,2,.6,1) 1;
  box-sizing: border-box;
  max-height: 90vh;
}

@keyframes modalPopIn {
  0% { transform: scale(0.92) translateY(30px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
.settings-modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.settings-modal-icon {
  font-size: 2.7rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2px;
}
.settings-modal-glass h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.5px;
}
.settings-section {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.settings-section label {
  font-size: 1rem;
  font-weight: 500;
  color: #bdbfff;
  margin-bottom: 2px;
}
.settings-section select {
  background: rgba(40,40,60,0.85);
  color: #fff;
  border: 1.5px solid #667eea;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
}
.settings-section select:focus {
  border: 1.5px solid #764ba2;
}
.settings-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 18px;
}
.save-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(102,126,234,0.12);
  transition: background 0.2s, box-shadow 0.2s;
}
.save-button:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  box-shadow: 0 4px 16px rgba(118,75,178,0.18);
}
.cancel-button {
  background: #444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.cancel-button:hover {
  background: #222;
}



/* Top buttons container */
.top-buttons {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

/* Settings button (top center) */
.settings-button-top {
  background: rgba(34, 34, 34, 0.9);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
}

/* Log button (top center) */
.log-button-top {
  background: rgba(34, 34, 34, 0.9);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
}
.settings-button-top:hover,
.settings-button-top.active {
  background: rgba(60, 60, 60, 0.95);
  box-shadow: 0 4px 12px rgba(102,126,234,0.25), 0 0 0 4px #764ba2aa;
  transform: scale(1.1);
}

.log-button-top:hover {
  background: rgba(60, 60, 60, 0.95);
  box-shadow: 0 4px 12px rgba(255,193,7,0.25), 0 0 0 4px #ffc107aa;
  transform: scale(1.1);
}

/* Info button (top center) */
.info-button-top {
  background: rgba(34, 34, 34, 0.9);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
}

.info-button-top:hover,
.info-button-top.active {
  background: rgba(60, 60, 60, 0.95);
  box-shadow: 0 4px 12px rgba(34,197,94,0.25), 0 0 0 4px #22c55eaa;
  transform: scale(1.1);
}


.settings-button-top.purple-glow {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 0 0 4px #764ba2aa, 0 8px 32px rgba(102,126,234,0.25);
  color: #fff;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Collapsible Sidebar */
.sidebar-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-content {
  width: 320px;
  max-height: calc(100vh - 40px);
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow-y: auto;
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-open .sidebar-content {
  transform: translateX(0);
  opacity: 1;
}

.sidebar-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.sidebar-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-section {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.sidebar-section:last-child {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #b0b0b0;
}

.section-icon {
  font-size: 16px;
}

.info-card, .network-widget, .status-card, .device-status {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #b0b0b0;
  font-weight: 500;
}

.info-value {
  color: #e0e0e0;
  font-weight: 600;
}

.network-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.network-item:last-child {
  margin-bottom: 0;
}

.network-label {
  color: #b0b0b0;
  font-weight: 500;
}

.network-value {
  color: #e0e0e0;
  font-weight: 600;
}

.quality-indicator {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-align: center;
  min-width: 40px;
}

.quality-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
  animation: statusPulse 2s infinite;
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.status-text {
  color: #4ade80;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.device-item:last-child {
  margin-bottom: 0;
}

.device-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.device-name {
  flex: 1;
  color: #b0b0b0;
  font-weight: 500;
}

.device-status {
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.device-status.available {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.1);
}

.device-status.unavailable {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
}

/* Custom scrollbar for sidebar */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
  transition: background 0.2s;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
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
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: stretch;
    gap: 6px;
    padding: 0 2px;
  }
  
  .control-button {
    flex: 1 1 0;
    min-width: 0;
    padding: 8px 0;
    font-size: 13px;
    border-radius: 10px;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  
  .icon {
    font-size: 16px;
  }
  
  .label {
    font-size: 9px;
    font-weight: 600;
    text-align: center;
    color: #e0e0e0;
    display: block;
  }
  
  .sidebar-content {
    width: 280px;
    max-height: calc(100vh - 20px);
  }
  
  .sidebar-header {
    padding: 16px 16px 12px;
  }
  
  .sidebar-header h3 {
    font-size: 16px;
  }
  
  .sidebar-section {
    padding: 12px 16px;
  }
  
  .section-title {
    font-size: 13px;
    margin-bottom: 10px;
  }
  
  .info-card, .network-widget, .status-card, .device-status {
    padding: 10px;
  }
  
  .info-row, .network-item, .device-item {
    font-size: 12px;
  }
}
</style> 