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
        <!-- Device Settings -->
        <div class="settings-section device-settings">
          <div class="section-header">
            <span class="section-icon">⚙️</span>
            <h3>Cihaz Ayarları</h3>
          </div>
          
          <div class="setting-item">
            <label for="camera-select">Kamera:</label>
            <select 
              id="camera-select" 
              v-model="selectedCamera" 
              class="device-select"
            >
              <option 
                v-for="device in videoInputDevices" 
                :key="device.deviceId" 
                :value="device.deviceId"
              >
                {{ device.label || `Kamera ${device.deviceId.slice(0, 8)}...` }}
              </option>
            </select>
          </div>

          <div class="setting-item">
            <label for="microphone-select">Mikrofon:</label>
            <select 
              id="microphone-select" 
              v-model="selectedMicrophone" 
              class="device-select"
            >
              <option 
                v-for="device in audioInputDevices" 
                :key="device.deviceId" 
                :value="device.deviceId"
              >
                {{ device.label || `Mikrofon ${device.deviceId.slice(0, 8)}...` }}
              </option>
            </select>
          </div>

          <div class="setting-item refresh-section">
            <button 
              @click="refreshDevices" 
              :disabled="isRefreshing"
              class="refresh-btn"
              :class="{ 'refreshing': isRefreshing }"
            >
              <div class="refresh-icon">
                <svg v-if="!isRefreshing" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <div v-else class="spinner"></div>
              </div>
              <span class="refresh-text">
                {{ isRefreshing ? 'Cihazlar Yenileniyor...' : 'Cihazları Yenile' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Quality Settings -->
        <div class="settings-section quality-settings">
          <div class="section-header">
            <span class="section-icon">🎥</span>
            <h3>Kalite Ayarları</h3>
          </div>
          
          <div class="setting-item">
            <label for="video-quality-select">Video Kalitesi:</label>
            <select 
              id="video-quality-select" 
              v-model="selectedVideoQuality" 
              @change="handleVideoQualityChange"
              class="device-select"
            >
              <option value="low">Düşük (720p)</option>
              <option value="medium">Orta (1080p)</option>
              <option value="high">Yüksek (4K)</option>
            </select>
          </div>

          <div class="setting-item">
            <label for="screen-quality-select">Ekran Paylaşım Kalitesi:</label>
            <select 
              id="screen-quality-select" 
              v-model="selectedScreenQuality" 
              @change="handleScreenQualityChange"
              class="device-select"
            >
              <option value="low">Düşük (720p)</option>
              <option value="medium">Orta (1080p)</option>
              <option value="high">Yüksek (4K)</option>
            </select>
          </div>
        </div>

        <!-- Device Status -->
        <div class="settings-section device-status">
          <div class="section-header">
            <span class="section-icon">📊</span>
            <h3>Cihaz Durumu</h3>
          </div>
          
          <div class="status-grid">
            <div class="status-item">
              <span class="status-icon">📹</span>
              <span class="status-label">Kamera:</span>
              <span class="status-value" :class="{ 'status-ok': hasVideoPermission, 'status-error': !hasVideoPermission }">
                {{ hasVideoPermission ? '✅ Çalışıyor' : '❌ İzin Yok' }}
              </span>
            </div>
            <div class="status-item">
              <span class="status-icon">🎤</span>
              <span class="status-label">Mikrofon:</span>
              <span class="status-value" :class="{ 'status-ok': hasAudioPermission, 'status-error': !hasAudioPermission }">
                {{ hasAudioPermission ? '✅ Çalışıyor' : '❌ İzin Yok' }}
              </span>
            </div>
          </div>
        </div>


      </div>


    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useDeviceSettings } from '../../composables/useDeviceSettings.js'
import { VIDEO_CONFIG, SCREEN_SHARE_CONFIG } from '../../constants.js'
import { fileLogger } from '../../services/fileLogger.js'

// Props
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  currentCamera: { type: String, default: '' },
  currentMicrophone: { type: String, default: '' },
  currentVideoQuality: { type: String, default: 'medium' },
  currentScreenQuality: { type: String, default: 'medium' },
  isMobile: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits(['close', 'settings-changed'])

// Device settings composable
const {
  audioInputDevices,
  videoInputDevices,
  currentAudioInputId,
  currentVideoInputId,
  hasAudioPermission,
  hasVideoPermission,
  canSwitchAudio,
  canSwitchVideo,
  initialize: initializeDeviceSettings,
  refreshDevices: refreshDeviceList,
  switchAudioInput,
  switchVideoInput
} = useDeviceSettings()

// Local state
const selectedCamera = ref('')
const selectedMicrophone = ref('')
const selectedVideoQuality = ref('medium')
const selectedScreenQuality = ref('medium')
const isRefreshing = ref(false)

// Computed
const hasChanges = computed(() => {
  return selectedCamera.value !== props.currentCamera ||
         selectedMicrophone.value !== props.currentMicrophone ||
         selectedVideoQuality.value !== props.currentVideoQuality ||
         selectedScreenQuality.value !== props.currentScreenQuality
})

// Quality info functions
const getVideoQualityInfo = (quality) => {
  const qualityMap = {
    low: 'Düşük bant genişliği, hızlı bağlantı',
    medium: 'Dengeli kalite ve performans',
    high: 'Yüksek kalite, orta bant genişliği',
    ultra: 'En yüksek kalite, yüksek bant genişliği'
  }
  return qualityMap[quality] || ''
}

const getScreenQualityInfo = (quality) => {
  const qualityMap = {
    low: 'Düşük bant genişliği, akıcı paylaşım',
    medium: 'Dengeli kalite ve performans',
    high: 'Yüksek kalite, detaylı paylaşım'
  }
  return qualityMap[quality] || ''
}

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const handleCameraChange = async () => {
  try {
    if (selectedCamera.value && selectedCamera.value !== currentVideoInputId.value) {
      await switchVideoInput(selectedCamera.value)
      emit('settings-changed', { camera: selectedCamera.value })
    }
  } catch (error) {
    console.error('Kamera değiştirme hatası:', error)
    // Reset selection
    selectedCamera.value = currentVideoInputId.value
  }
}

const handleMicrophoneChange = async () => {
  try {
    if (selectedMicrophone.value && selectedMicrophone.value !== currentAudioInputId.value) {
      await switchAudioInput(selectedMicrophone.value)
      emit('settings-changed', { microphone: selectedMicrophone.value })
    }
  } catch (error) {
    console.error('Mikrofon değiştirme hatası:', error)
    // Reset selection
    selectedMicrophone.value = currentAudioInputId.value
  }
}

const handleVideoQualityChange = () => {
  console.log('Video quality changed to:', selectedVideoQuality.value)
  // Video quality change logic - implement later
}

const handleScreenQualityChange = () => {
  console.log('Screen quality changed to:', selectedScreenQuality.value)
  // Screen quality change logic - implement later
}

const refreshDevices = async () => {
  try {
    console.log('Refreshing devices...')
    isRefreshing.value = true
    
    await refreshDeviceList()
    
    console.log('Devices refreshed:', {
      audio: audioInputDevices.value,
      video: videoInputDevices.value
    })
    
    // Update selections if current devices are no longer available
    if (!videoInputDevices.value.find(d => d.deviceId === selectedCamera.value)) {
      console.log('Camera device not found, updating selection')
      selectedCamera.value = currentVideoInputId.value
    }
    if (!audioInputDevices.value.find(d => d.deviceId === selectedMicrophone.value)) {
      console.log('Microphone device not found, updating selection')
      selectedMicrophone.value = currentAudioInputId.value
    }
    
    console.log('Selections updated:', {
      camera: selectedCamera.value,
      microphone: selectedMicrophone.value
    })
    
  } catch (error) {
    console.error('Cihaz yenileme hatası:', error)
  } finally {
    isRefreshing.value = false
  }
}

const applySettings = () => {
  const newSettings = {
    camera: selectedCamera.value,
    microphone: selectedMicrophone.value,
    videoQuality: selectedVideoQuality.value,
    screenQuality: selectedScreenQuality.value
  }
  
  emit('settings-changed', newSettings)
  emit('close')
}

// Watch for device changes
watch(videoInputDevices, (newDevices) => {
  if (newDevices.length > 0 && !selectedCamera.value) {
    selectedCamera.value = newDevices[0].deviceId
  }
})

watch(audioInputDevices, (newDevices) => {
  if (newDevices.length > 0 && !selectedMicrophone.value) {
    selectedMicrophone.value = newDevices[0].deviceId
  }
})

// Lifecycle
onMounted(async () => {
  try {
    console.log('SettingsModal mounted, initializing device settings...')
    
    // Initialize device settings
    await initializeDeviceSettings()
    
    console.log('Device settings initialized, devices:', {
      audio: audioInputDevices.value,
      video: videoInputDevices.value
    })
    
    // Initialize with current values
    selectedCamera.value = props.currentCamera || currentVideoInputId.value
    selectedMicrophone.value = props.currentMicrophone || currentAudioInputId.value
    selectedVideoQuality.value = props.currentVideoQuality
    selectedScreenQuality.value = props.currentScreenQuality
    
    console.log('Settings initialized:', {
      camera: selectedCamera.value,
      microphone: selectedMicrophone.value,
      videoQuality: selectedVideoQuality.value,
      screenQuality: selectedScreenQuality.value
    })
    
  } catch (error) {
    console.error('Device settings initialization error:', error)
  }
})
</script>

<style scoped>
/* Modal Backdrop */
.settings-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--rs-agora-transparent-black-30);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* Modal Glass */
.settings-modal-glass {
  background: var(--rs-agora-surface-primary);
  backdrop-filter: var(--rs-agora-backdrop-blur);
  border-radius: 20px;
  max-width: 700px;
  width: 90%;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: var(--rs-agora-shadow-secondary);
  border: 1px solid var(--rs-agora-border-primary);
  display: flex;
  flex-direction: column;
}

/* Header - Sabit */
.settings-modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 30px 30px 25px;
  background: var(--rs-agora-gradient-surface);
  border-bottom: 1px solid var(--rs-agora-border-primary);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
  flex-shrink: 0;
}

.settings-modal-icon {
  width: 48px;
  height: 48px;
  background: var(--rs-agora-gradient-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rs-agora-white);
  box-shadow: var(--rs-agora-shadow-primary);
  font-size: 24px;
}

.settings-modal-header h2 {
  margin: 0 0 4px 0;
  flex: 1;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: var(--rs-agora-gradient-text-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  width: 44px;
  height: 44px;
  background: var(--rs-agora-transparent-white-05);
  border: 1px solid var(--rs-agora-border-primary);
  color: var(--rs-agora-text-secondary);
  cursor: pointer;
  padding: 12px;
  border-radius: 10px;
  transition: var(--rs-agora-transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
  font-size: 20px;
}

.close-btn:hover {
  background: var(--rs-agora-transparent-white-10);
  border-color: var(--rs-agora-border-secondary);
  color: var(--rs-agora-text-primary);
  transform: scale(1.05);
}

/* Content - Scrollable */
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  margin-bottom: 0;
}

.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-content::-webkit-scrollbar-track {
  background: var(--rs-agora-transparent-white-05);
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb {
  background: var(--rs-agora-transparent-white-20);
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: var(--rs-agora-transparent-white-30);
}

.settings-section {
  margin-bottom: 24px;
  padding: 24px;
  background: var(--rs-agora-surface-secondary);
  border-radius: 16px;
  border: 1px solid var(--rs-agora-border-primary);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
  transition: var(--rs-agora-transition-normal);
}

.settings-section:hover {
  background: var(--rs-agora-transparent-white-08);
  border-color: var(--rs-agora-border-secondary);
  transform: translateY(-2px);
  box-shadow: var(--rs-agora-shadow-surface);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--rs-agora-border-primary);
}

.section-icon {
  width: 40px;
  height: 40px;
  background: var(--rs-agora-gradient-primary);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rs-agora-white);
  flex-shrink: 0;
}



.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--rs-agora-text-primary);
}

.setting-item {
  margin-bottom: 16px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--rs-agora-text-primary);
  font-size: 14px;
}

.device-select, .quality-select {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 12px;
  background: var(--rs-agora-surface-primary);
  color: var(--rs-agora-text-primary);
  font-size: 14px;
  transition: var(--rs-agora-transition-normal);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.device-select:focus, .quality-select:focus {
  outline: none;
  border-color: var(--rs-agora-primary);
  background: var(--rs-agora-transparent-white-08);
  box-shadow: 0 0 0 3px var(--rs-agora-transparent-white-10);
}

.device-select:disabled, .quality-select:disabled {
  background: var(--rs-agora-surface-tertiary);
  color: var(--rs-agora-text-muted);
  cursor: not-allowed;
}

.device-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--rs-agora-text-muted);
  font-style: italic;
}

.quality-info {
  margin-top: 6px;
  font-size: 12px;
  color: var(--rs-agora-primary);
  font-weight: 500;
}

.setting-info {
  margin-top: 6px;
  font-size: 12px;
  color: var(--rs-agora-text-secondary);
  font-style: italic;
  line-height: 1.4;
}

/* Device Status */
.status-grid {
  display: grid;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--rs-agora-surface-primary);
  border-radius: 12px;
  border: 1px solid var(--rs-agora-border-primary);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
  transition: var(--rs-agora-transition-normal);
}

.status-item:hover {
  background: var(--rs-agora-transparent-white-08);
  border-color: var(--rs-agora-border-secondary);
  transform: translateY(-1px);
}

.status-icon {
  font-size: 18px;
}

.status-label {
  font-weight: 500;
  color: var(--rs-agora-text-primary);
  flex: 1;
}

.status-value {
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.status-ok {
  background: var(--rs-agora-transparent-success-10);
  color: var(--rs-agora-success);
}

.status-error {
  background: var(--rs-agora-transparent-error-10);
  color: var(--rs-agora-error);
}

/* Refresh Button - Modern Design */
.refresh-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--rs-agora-border-primary);
}

.refresh-btn {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, var(--rs-agora-primary) 0%, var(--rs-agora-secondary) 100%);
  border: none;
  border-radius: 16px;
  color: var(--rs-agora-white);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
}

.refresh-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.refresh-btn:hover::before {
  left: 100%;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
  background: linear-gradient(135deg, var(--rs-agora-secondary) 0%, var(--rs-agora-primary) 100%);
}

.refresh-btn:active:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.refresh-btn.refreshing {
  background: linear-gradient(135deg, var(--rs-agora-success) 0%, var(--rs-agora-primary) 100%);
  box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
}

.refresh-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: currentColor;
  flex-shrink: 0;
}

.refresh-text {
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* Spinner Animation */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}



/* Responsive */
@media (max-width: 768px) {
  .settings-modal-glass {
    margin: 16px;
    max-width: calc(100% - 32px);
    max-height: 90vh;
  }
  
  .settings-modal-header {
    padding: 20px 20px 15px;
  }
  
  .settings-content {
    padding: 20px;
  }
  
  .settings-section {
    padding: 20px;
  }
  
  .settings-actions {
    flex-direction: column;
    padding: 20px;
  }
  
  .save-button, .cancel-button {
    width: 100%;
  }
  
  .status-item {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .section-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
}
</style>
