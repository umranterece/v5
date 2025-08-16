<template>
  <div v-if="isOpen" class="settings-modal-backdrop" @click.self="handleOverlayClick">
    <div class="settings-modal-glass">
      <!-- Header -->
      <div class="settings-modal-header">
        <div class="settings-modal-icon">⚙️</div>
        <h2>Video Ayarları</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>

      <!-- Content -->
      <div class="settings-content">
        <!-- Camera Settings -->
        <div class="settings-section">
          <label for="camera-select">Kamera:</label>
          <select 
            id="camera-select" 
            v-model="selectedCamera" 
            @change="handleCameraChange"
          >
            <option v-for="device in cameraDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Kamera ${device.deviceId.slice(0, 8)}...` }}
            </option>
          </select>
        </div>

        <!-- Microphone Settings -->
        <div class="settings-section">
          <label for="microphone-select">Mikrofon:</label>
          <select 
            id="microphone-select" 
            v-model="selectedMicrophone" 
            @change="handleMicrophoneChange"
          >
            <option v-for="device in microphoneDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Mikrofon ${device.deviceId.slice(0, 8)}...` }}
            </option>
          </select>
        </div>

        <!-- Speaker Settings -->
        <div class="settings-section">
          <label for="speaker-select">Hoparlör:</label>
          <select 
            id="speaker-select" 
            v-model="selectedSpeaker" 
            @change="handleSpeakerChange"
          >
            <option v-for="device in speakerDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Hoparlör ${device.deviceId.slice(0, 8)}...` }}
            </option>
          </select>
        </div>

        <!-- Video Quality Settings (Desktop only) -->
        <div class="settings-section" v-if="!isMobile">
          <label for="video-quality-select">Video Kalitesi:</label>
          <select 
            id="video-quality-select" 
            v-model="selectedVideoQuality" 
            @change="handleVideoQualityChange"
          >
            <option value="low">Düşük (240p)</option>
            <option value="medium">Orta (480p)</option>
            <option value="high">Yüksek (720p)</option>
            <option value="ultra">Ultra (1080p)</option>
          </select>
        </div>

        <!-- Audio Quality Settings -->
        <div class="settings-section">
          <label for="audio-quality-select">Ses Kalitesi:</label>
          <select 
            id="audio-quality-select" 
            v-model="selectedAudioQuality" 
            @change="handleAudioQualityChange"
          >
            <option value="low">Düşük (16kHz)</option>
            <option value="medium">Orta (32kHz)</option>
            <option value="high">Yüksek (48kHz)</option>
          </select>
        </div>
      </div>

      <!-- Actions -->
      <div class="settings-actions">
        <button @click="applySettings" class="save-button">Kaydet</button>
        <button @click="$emit('close')" class="cancel-button">İptal</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

// Props
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  currentCamera: { type: String, default: '' },
  currentMicrophone: { type: String, default: '' },
  currentSpeaker: { type: String, default: '' },
  currentVideoQuality: { type: String, default: 'medium' },
  currentAudioQuality: { type: String, default: 'medium' },
  isMobile: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits(['close', 'settings-changed'])

// Local state
const selectedCamera = ref('')
const selectedMicrophone = ref('')
const selectedSpeaker = ref('')
const selectedVideoQuality = ref('medium')
const selectedAudioQuality = ref('medium')

// Device lists
const cameraDevices = ref([])
const microphoneDevices = ref([])
const speakerDevices = ref([])

// Computed
const hasChanges = computed(() => {
  return selectedCamera.value !== props.currentCamera ||
         selectedMicrophone.value !== props.currentMicrophone ||
         selectedSpeaker.value !== props.currentSpeaker ||
         selectedVideoQuality.value !== props.currentVideoQuality ||
         selectedAudioQuality.value !== props.currentAudioQuality
})

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const fetchDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    
    cameraDevices.value = devices.filter(device => device.kind === 'videoinput')
    microphoneDevices.value = devices.filter(device => device.kind === 'audioinput')
    speakerDevices.value = devices.filter(device => device.kind === 'audiooutput')
  } catch (error) {
    console.error('Cihaz listesi alınamadı:', error)
  }
}

const handleCameraChange = () => {
  // Camera change logic
}

const handleMicrophoneChange = () => {
  // Microphone change logic
}

const handleSpeakerChange = () => {
  // Speaker change logic
}

const handleVideoQualityChange = () => {
  // Video quality change logic
}

const handleAudioQualityChange = () => {
  // Audio quality change logic
}

const applySettings = () => {
  const newSettings = {
    camera: selectedCamera.value,
    microphone: selectedMicrophone.value,
    speaker: selectedSpeaker.value,
    videoQuality: selectedVideoQuality.value,
    audioQuality: selectedAudioQuality.value
  }
  
  emit('settings-changed', newSettings)
  emit('close')
}

// Lifecycle
onMounted(() => {
  // Initialize with current values
  selectedCamera.value = props.currentCamera
  selectedMicrophone.value = props.currentMicrophone
  selectedSpeaker.value = props.currentSpeaker
  selectedVideoQuality.value = props.currentVideoQuality
  selectedAudioQuality.value = props.currentAudioQuality
  
  // Fetch devices
  fetchDevices()
})
</script>

<style scoped>
/* Modal Backdrop */
.settings-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

/* Modal Glass */
.settings-modal-glass {
  background: rgba(26, 26, 46, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

/* Header */
.settings-modal-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 25px 25px 20px 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-modal-icon {
  font-size: 28px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
}

.settings-modal-glass h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  flex: 1;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 28px;
  cursor: pointer;
  padding: 5px;
  border-radius: 8px;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* Content */
.settings-content {
  padding: 20px 25px;
}

.settings-section {
  margin-bottom: 20px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.settings-section select {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #ffffff;
  font-size: 14px;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.settings-section select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Actions */
.settings-actions {
  display: flex;
  gap: 15px;
  padding: 20px 25px 25px 25px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.save-button, .cancel-button {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.save-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.cancel-button {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cancel-button:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .settings-modal-glass {
    width: 95%;
    margin: 20px;
  }
  
  .settings-modal-header {
    padding: 20px 20px 15px 20px;
  }
  
  .settings-content {
    padding: 20px 20px;
  }
  
  .settings-actions {
    padding: 20px 20px 25px 20px;
  }
  
  .settings-modal-glass h2 {
    font-size: 20px;
  }
}
</style>
