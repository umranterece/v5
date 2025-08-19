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
          <div class="section-header">
            <span class="section-icon">📹</span>
            <h3>Kamera Ayarları</h3>
          </div>
          
          <div class="setting-item">
            <label for="camera-select">Kamera Seçimi:</label>
            <select 
              id="camera-select" 
              v-model="selectedCamera" 
              @change="handleCameraChange"
              :disabled="!canSwitchVideo"
              class="device-select"
            >
              <option v-for="device in videoInputDevices" :key="device.deviceId" :value="device.deviceId">
                {{ device.label || `Kamera ${device.deviceId.slice(0, 8)}...` }}
              </option>
            </select>
            <div v-if="!canSwitchVideo" class="device-hint">
              {{ videoInputDevices.length === 0 ? 'Kamera bulunamadı' : 'Tek kamera mevcut' }}
            </div>
          </div>

          <div class="setting-item">
            <label for="video-quality-select">Video Kalitesi:</label>
            <select 
              id="video-quality-select" 
              v-model="selectedVideoQuality" 
              @change="handleVideoQualityChange"
              class="quality-select"
            >
              <option value="low">Düşük (480p, 15fps)</option>
              <option value="medium">Orta (720p, 24fps)</option>
              <option value="high">Yüksek (720p, 30fps)</option>
              <option value="ultra">Ultra (1080p, 30fps)</option>
            </select>
            <div class="quality-info">
              {{ getVideoQualityInfo(selectedVideoQuality) }}
            </div>
          </div>
        </div>

        <!-- Microphone Settings -->
        <div class="settings-section">
          <div class="section-header">
            <span class="section-icon">🎤</span>
            <h3>Mikrofon Ayarları</h3>
          </div>
          
          <div class="setting-item">
            <label for="microphone-select">Mikrofon Seçimi:</label>
            <select 
              id="microphone-select" 
              v-model="selectedMicrophone" 
              @change="handleMicrophoneChange"
              :disabled="!canSwitchAudio"
              class="device-select"
            >
              <option v-for="device in audioInputDevices" :key="device.deviceId" :value="device.deviceId">
                {{ device.label || `Mikrofon ${device.deviceId.slice(0, 8)}...` }}
              </option>
            </select>
            <div v-if="!canSwitchAudio" class="device-hint">
              {{ audioInputDevices.length === 0 ? 'Mikrofon bulunamadı' : 'Tek mikrofon mevcut' }}
            </div>
          </div>
        </div>

        <!-- Screen Share Settings -->
        <div class="settings-section">
          <div class="section-header">
            <span class="section-icon">🖥️</span>
            <h3>Ekran Paylaşımı Ayarları</h3>
          </div>
          
          <div class="setting-item">
            <label for="screen-quality-select">Ekran Paylaşımı Kalitesi:</label>
            <select 
              id="screen-quality-select" 
              v-model="selectedScreenQuality" 
              @change="handleScreenQualityChange"
              class="quality-select"
            >
              <option value="low">Düşük (480p, 10fps)</option>
              <option value="medium">Orta (720p, 15fps)</option>
              <option value="high">Yüksek (1080p, 30fps)</option>
            </select>
            <div class="quality-info">
              {{ getScreenQualityInfo(selectedScreenQuality) }}
            </div>
          </div>
        </div>

        <!-- Log Settings -->
        <div class="settings-section">
          <div class="section-header">
            <span class="section-icon">📝</span>
            <h3>Log Ayarları</h3>
          </div>
          
          <div class="setting-item">
            <label for="log-method-select">Log Yöntemi:</label>
            <select 
              id="log-method-select" 
              v-model="selectedLogMethod" 
              @change="handleLogMethodChange"
              class="device-select"
            >
              <option value="localStorage">LocalStorage (Tarayıcı - Test için)</option>
              <option value="localFolder">Local Klasör (Proje klasörü)</option>
            </select>
            <div class="setting-info">
              {{ getLogMethodInfo(selectedLogMethod) }}
            </div>
          </div>

          <div class="setting-item">
            <label for="log-retention-select">Log Saklama Süresi:</label>
            <select 
              id="log-retention-select" 
              v-model="selectedLogRetention" 
              @change="handleLogRetentionChange"
              class="device-select"
            >
              <option value="7">7 gün</option>
              <option value="15">15 gün</option>
              <option value="30">30 gün (varsayılan)</option>
              <option value="60">60 gün</option>
            </select>
            <div class="setting-info">
              {{ getLogRetentionInfo(selectedLogRetention) }}
            </div>
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
import { fileLogger, localFolderLogger, STORAGE_METHODS } from '../../services/fileLogger.js'

// Props
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  currentCamera: { type: String, default: '' },
  currentMicrophone: { type: String, default: '' },
  currentVideoQuality: { type: String, default: 'medium' },
  currentScreenQuality: { type: String, default: 'medium' },
  currentLogMethod: { type: String, default: 'localStorage' },
  currentLogRetention: { type: Number, default: 30 },
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
const selectedLogMethod = ref('localStorage')
const selectedLogRetention = ref(30)

// Computed
const hasChanges = computed(() => {
  return selectedCamera.value !== props.currentCamera ||
         selectedMicrophone.value !== props.currentMicrophone ||
         selectedVideoQuality.value !== props.currentVideoQuality ||
         selectedScreenQuality.value !== props.currentScreenQuality ||
         selectedLogMethod.value !== props.currentLogMethod ||
         selectedLogRetention.value !== props.currentLogRetention
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

// Log settings info functions
const getLogMethodInfo = (method) => {
  const methodMap = {
    localStorage: 'Loglar tarayıcının LocalStorage\'ında saklanır (test için ideal)',
    localFolder: 'Loglar proje klasöründeki logs/ dizininde saklanır (production için ideal)'
  }
  return methodMap[method] || ''
}

const getLogRetentionInfo = (days) => {
  return `${days} gün sonra eski loglar otomatik olarak silinir`
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

const handleLogMethodChange = () => {
  console.log('Log method changed to:', selectedLogMethod.value)
  
  // Log yöntemini değiştir
  if (selectedLogMethod.value === 'localFolder') {
    localFolderLogger.setStorageMethod(STORAGE_METHODS.LOCAL_FOLDER)
    console.log('Switched to local folder logging')
  } else {
    fileLogger.setStorageMethod(STORAGE_METHODS.LOCAL_STORAGE)
    console.log('Switched to localStorage logging')
  }
}

const handleLogRetentionChange = () => {
  console.log('Log retention changed to:', selectedLogRetention.value)
  
  // Log retention süresini güncelle
  const days = parseInt(selectedLogRetention.value)
  if (selectedLogMethod.value === 'localFolder') {
    localFolderLogger.retentionDays = days
  } else {
    fileLogger.retentionDays = days
  }
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
    screenQuality: selectedScreenQuality.value,
    logMethod: selectedLogMethod.value,
    logRetention: selectedLogRetention.value
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
    selectedLogMethod.value = props.currentLogMethod
    selectedLogRetention.value = props.currentLogRetention
    
    console.log('Settings initialized:', {
      camera: selectedCamera.value,
      microphone: selectedMicrophone.value,
      videoQuality: selectedVideoQuality.value,
      screenQuality: selectedScreenQuality.value,
      logMethod: selectedLogMethod.value,
      logRetention: selectedLogRetention.value
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

/* Refresh Button */
.refresh-button {
  width: 100%;
  padding: 16px 20px;
  background: var(--rs-agora-gradient-primary);
  border: none;
  border-radius: 12px;
  color: var(--rs-agora-white);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--rs-agora-transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: var(--rs-agora-shadow-primary);
}

.refresh-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--rs-agora-shadow-primary);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.refresh-icon {
  font-size: 16px;
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
