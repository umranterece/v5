<template>
  <div class="agora-controls">
    <!-- Top Buttons (top center) -->
    <div v-if="isConnected" class="top-buttons">
      <!-- Layout Button -->
      <button 
        @click="props.onOpenLayoutModal"
        class="layout-button-top"
        title="Görünüm Seçenekleri"
      >
        <ViewColumnsIcon class="icon" />
        <span class="label"></span>
      </button>
      
      <!-- Settings Button -->
      <button 
        @click="props.onOpenSettings"
        class="settings-button-top"
        title="Video Ayarları"
      >
        <Cog6ToothIcon class="icon" />
        <span class="label"></span>
      </button>
      
      <!-- Info Button -->
      <button 
        @click="props.onOpenInfoModal"
        class="info-button-top"
        title="Toplantı Bilgileri"
      >
        <InformationCircleIcon class="icon" />
        <span class="label"></span>
      </button>
      
      <!-- Log Button -->
      <button 
        v-if="props.logActive"
        @click="props.onOpenLogModal"
        class="log-button-top"
        title="Sistem Logları"
      >
        <DocumentTextIcon class="icon" />
        <span class="label"></span>
      </button>
    </div>





    <!-- Controls -->
    <div v-if="isConnected" class="controls">
      <!-- Camera Toggle -->
      <button 
        @click="toggleCamera"
        :disabled="!canUseCamera || isCameraLoading"
        :class="['control-button', { 
          active: !isLocalVideoOff && canUseCamera, 
          disabled: !canUseCamera,
          loading: isCameraLoading 
        }]"
        :title="isCameraLoading ? 'Kamera Yükleniyor...' : getCameraTitle"
      >
        <!-- Loading Spinner -->
        <div v-if="isCameraLoading" class="loading-spinner">
          <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-dasharray="31.416" stroke-dashoffset="31.416" stroke-linecap="round"/>
          </svg>
        </div>
        
        <!-- Normal Icon -->
        <VideoCameraIcon v-else class="icon" />
        
        <span class="label">
          {{ isCameraLoading ? 'Yükleniyor...' : getCameraLabel }}
        </span>
      </button>

      <!-- Microphone Toggle -->
      <button 
        @click="toggleMicrophone"
        :disabled="!canUseMicrophone || isMicrophoneLoading"
        :class="['control-button', { 
          active: !isLocalAudioMuted && canUseCamera, 
          disabled: !canUseMicrophone,
          loading: isMicrophoneLoading 
        }]"
        :title="isMicrophoneLoading ? 'Mikrofon Yükleniyor...' : getMicrophoneTitle"
      >
        <!-- Loading Spinner -->
        <div v-if="isMicrophoneLoading" class="loading-spinner">
          <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-dasharray="31.416" stroke-dashoffset="31.416" stroke-linecap="round"/>
          </svg>
        </div>
        
        <!-- Normal Icon -->
        <MicrophoneIcon v-else class="icon" />
        
        <span class="label">
          {{ isMicrophoneLoading ? 'Yükleniyor...' : getMicrophoneLabel }}
        </span>
      </button>

      <!-- Screen Share Toggle - Only show on desktop -->
      <button
        v-if="props.supportsScreenShare"
        @click="props.onToggleScreenShare"
        :class="['control-button', { active: props.isScreenSharing }]"
        :title="props.isScreenSharing ? 'Ekran Paylaşımını Durdur' : 'Ekran Paylaşımını Başlat'"
      >
        <ComputerDesktopIcon class="icon" />
        <span class="label">{{ props.isScreenSharing ? 'Paylaşımı Durdur' : 'Ekranı Paylaş' }}</span>
      </button>

      <!-- Whiteboard Toggle - 🆕 YENİ -->
      <button
        @click="toggleWhiteboard"
        :disabled="isWhiteboardLoading"
        :class="['control-button', { active: isWhiteboardActive, loading: isWhiteboardLoading }]"
        :title="isWhiteboardLoading ? 'Beyaz Tahta Yükleniyor...' : 'Beyaz Tahta'"
      >
        <!-- Loading Spinner -->
        <div v-if="isWhiteboardLoading" class="loading-spinner">
          <svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-dasharray="31.416" stroke-dashoffset="31.416" stroke-linecap="round"/>
          </svg>
        </div>
        
        <!-- Normal Icon -->
        <PencilIcon v-else class="icon" />
        
        <span class="label">
          {{ isWhiteboardLoading ? 'Yükleniyor...' : 'Beyaz Tahta' }}
        </span>
      </button>

      <!-- Leave Button -->
      <button 
        @click="leaveChannel"
        :disabled="isLeaving"
        class="control-button leave-button"
        title="Kanaldan ayrıl"
      >
        <PhoneIcon class="icon" />
        <span class="label">{{ isLeaving ? 'Ayrılıyor...' : 'Ayrıl' }}</span>
      </button>
    </div>


  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAgoraStore, useLayoutStore } from '../../store/index.js'
import { rtmService } from '../../services/index.js'
import { centralEmitter } from '../../utils/index.js'
import { AGORA_EVENTS } from '../../constants.js'
import { 
  ViewColumnsIcon, 
  Cog6ToothIcon, 
  InformationCircleIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  ComputerDesktopIcon,
  PhoneIcon,
  PencilIcon
} from '@heroicons/vue/24/outline'

// Store
const agoraStore = useAgoraStore()
const layoutStore = useLayoutStore()

// Loading states
const isWhiteboardLoading = ref(false)
const isCameraLoading = ref(false)
const isMicrophoneLoading = ref(false)

// Event listeners
onMounted(() => {
  // Whiteboard ready event
  centralEmitter.on('whiteboard-ready', () => {
    isWhiteboardLoading.value = false
  })
  
  // Camera ready event
  centralEmitter.on(AGORA_EVENTS.LOCAL_VIDEO_READY, () => {
    isCameraLoading.value = false
  })
  
  // Microphone ready event
  centralEmitter.on(AGORA_EVENTS.LOCAL_AUDIO_READY, () => {
    isMicrophoneLoading.value = false
  })
})

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
  onOpenLayoutModal: { type: Function, default: () => {} },
  // Network Quality Props
  networkQualityLevel: { type: String, default: 'Unknown' },
  networkQualityColor: { type: String, default: 'var(--rs-agora-gray-500)' },
  networkBitrate: { type: Number, default: 0 },
  networkFrameRate: { type: Number, default: 0 },
  networkRtt: { type: Number, default: 0 },
  networkPacketLoss: { type: Number, default: 0 },
  // Logger Props
  logger: {
    type: Object,
    default: () => ({
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      fatal: () => {}
    })
  },
  // Settings Props
  onOpenSettings: { type: Function, default: () => {} },
  // Info Modal Props
  onOpenInfoModal: { type: Function, default: () => {} },
  // Log Modal Props
  onOpenLogModal: { type: Function, default: () => {} },
  // Log Active Props
  logActive: { type: Boolean, default: true }
})

// Computed properties
const isWhiteboardActive = computed(() => agoraStore.isWhiteboardActive)

const channelInput = ref(props.channelName || 'test')

const joinChannel = async () => {
  if (!channelInput.value.trim() || props.isJoining) return
  try {
    props.logger.info('joinChannel', { channelName: channelInput.value.trim() })
    await props.onJoin(channelInput.value.trim())
  } catch (error) {
    props.logger.error(error, { context: 'joinChannel', channelName: channelInput.value.trim() })
  }
}

const leaveChannel = async () => {
  if (props.isLeaving) return
  try {
    props.logger.info('leaveChannel', { channelName: props.channelName })
    await props.onLeave()
  } catch (error) {
    props.logger.error(error, { context: 'leaveChannel', channelName: props.channelName })
  }
}

const toggleCamera = async () => {
  const newVideoOffState = !props.isLocalVideoOff
  
  // Loading state'i aktif et
  isCameraLoading.value = true
  
  props.logger.info('Kamera değiştir', {
    currentState: props.isLocalVideoOff ? 'off' : 'on',
    newState: newVideoOffState ? 'off' : 'on',
    canUseCamera: props.canUseCamera
  })
  
  props.logger.info('toggleCamera', { 
    currentState: props.isLocalVideoOff ? 'off' : 'on',
    newState: newVideoOffState ? 'off' : 'on'
  })
  
  try {
    await props.onToggleCamera(newVideoOffState)
    // Loading state'i kaldır (camera hazır olduğunda)
    // Bu işlem parent component'te yapılacak
  } catch (error) {
    props.logger.error('Kamera toggle hatası', { error: error.message })
    // Hata durumunda loading state'i kaldır
    isCameraLoading.value = false
  }
}

const toggleMicrophone = async () => {
  if (props.canUseMicrophone) {
    const newMutedState = !props.isLocalAudioMuted
    
    // Loading state'i aktif et
    isMicrophoneLoading.value = true
    
    props.logger.info('Mikrofon değiştir', {
      currentState: props.isLocalAudioMuted ? 'muted' : 'unmuted',
      newState: newMutedState ? 'muted' : 'unmuted',
      canUseMicrophone: props.canUseMicrophone
    })
    
    props.logger.info('toggleMicrophone', { 
      currentState: props.isLocalAudioMuted ? 'muted' : 'unmuted',
      newState: newMutedState ? 'muted' : 'unmuted'
    })
    
    try {
      await props.onToggleMicrophone(newMutedState)
      // Loading state'i kaldır (microphone hazır olduğunda)
      // Bu işlem parent component'te yapılacak
    } catch (error) {
      props.logger.error('Mikrofon toggle hatası', { error: error.message })
      // Hata durumunda loading state'i kaldır
      isMicrophoneLoading.value = false
    }
  }
}

// Whiteboard toggle function - 🚀 CHANNEL-BASED WHITEBOARD ROOM MANAGEMENT
const toggleWhiteboard = async () => {
  const newWhiteboardState = !isWhiteboardActive.value
  props.logger.info('Whiteboard değiştir', {
    currentState: isWhiteboardActive.value ? 'active' : 'inactive',
    newState: newWhiteboardState ? 'active' : 'inactive'
  })
  
  if (newWhiteboardState) {
    // Whiteboard açılıyorsa
    try {
      // Loading state'i aktif et
      isWhiteboardLoading.value = true
      
      props.logger.info('🚀 Channel-based whiteboard room yönetimi başlatılıyor', {
        channelName: agoraStore.session?.videoChannelName
      })
      
      // Store'a bildir
      agoraStore.setWhiteboardActive(true)
      
      // 🆕 Layout'u WhiteboardLayout'a geç (ekran paylaşımı olsa bile)
      // Ekran paylaşımı varsa bile beyaz tahta moduna geç
      layoutStore.switchLayoutWithSave('whiteboard')
      props.logger.info('Layout WhiteboardLayout\'a değiştirildi (ekran paylaşımı olsa bile)')
      
      // Whiteboard room'a bağlan (channel-based)
      // Bu işlem WhiteboardLayout'ta yapılacak
      props.logger.info('Whiteboard room bağlantısı WhiteboardLayout\'ta yapılacak')
      
      // Loading state'i kaldır (whiteboard hazır olduğunda)
      // Bu işlem AdvancedWhiteboard component'inde yapılacak
      
    } catch (error) {
      props.logger.error('Whiteboard açma hatası', { error: error.message })
      // Hata durumunda state'i geri al
      agoraStore.setWhiteboardActive(false)
      layoutStore.switchLayoutWithSave('grid')
      
      // Loading state'i kaldır
      isWhiteboardLoading.value = false
    }
  } else {
    // Whiteboard kapanıyorsa
    agoraStore.setWhiteboardActive(false)
    
    // Layout'u Grid Layout'a geri dön
    layoutStore.switchLayoutWithSave('grid')
    props.logger.info('Layout Grid Layout\'a geri döndürüldü')
    
    // Loading state'i kaldır
    isWhiteboardLoading.value = false
  }
}

// Helper functions for camera
const getCameraLabel = computed(() => {
  if (!props.canUseCamera) return 'Kamera Yok'
  return props.isLocalVideoOff ? 'Kamera Kapalı' : 'Kamera Açık'
})

const getCameraTitle = computed(() => {
  if (!props.canUseCamera) return 'Kamera mevcut değil'
  return props.isLocalVideoOff ? 'Kamerayı aç' : 'Kamerayı kapat'
})

// Helper functions for microphone
const getMicrophoneLabel = computed(() => {
  if (!props.canUseCamera) return 'Mikrofon Yok'
  return props.isLocalAudioMuted ? 'Sessiz' : 'Sesli'
})

const getMicrophoneTitle = computed(() => {
  if (!props.canUseCamera) return 'Mikrofon mevcut değil'
  return props.isLocalAudioMuted ? 'Mikrofonu aç' : 'Mikrofonu kapat'
})








// Ayarları uygula ve parent'a bildir
const emit = defineEmits(['open-settings', 'open-logs'])
</script>

<style scoped>
.agora-controls {
  padding: 8px;
  background: var(--rs-agora-gradient-controls);
  border-radius: 10px;
  box-shadow: var(--rs-agora-shadow-lg);
  border: 1px solid var(--rs-agora-border-primary);
  backdrop-filter: blur(10px);
  position: relative; /* Added for settings button positioning */
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
  background: var(--rs-agora-transparent-white-05);
  border: 2px solid var(--rs-agora-transparent-white-10);
  border-radius: var(--rs-agora-radius-md);
  cursor: pointer;
  transition: all var(--rs-agora-transition-normal);
  min-width: 70px;
  backdrop-filter: blur(10px);
}

.control-button:hover {
  border-color: var(--rs-agora-primary);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px var(--rs-agora-primary);
  background: var(--rs-agora-transparent-white-10);
}

.control-button.active {
  border-color: var(--rs-agora-success);
  background: var(--rs-agora-transparent-success-20);
  box-shadow: 0 0 20px var(--rs-agora-success);
}

.control-button.active:hover {
  border-color: var(--rs-agora-success);
  background: var(--rs-agora-transparent-success-30);
  box-shadow: 0 8px 25px var(--rs-agora-success);
  transform: translateY(-3px);
}

.control-button.leave-button {
  border-color: var(--rs-agora-error);
  color: var(--rs-agora-error);
}

.control-button.leave-button:hover {
  background: var(--rs-agora-error);
  color: var(--rs-agora-white);
  box-shadow: 0 8px 25px var(--rs-agora-error);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.icon {
  width: 24px;
  height: 24px;
  color: currentColor;
}

.label {
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  color: var(--rs-agora-text-primary);
}





/* Floating settings button (top-right) */
.settings-fab {
  position: fixed;
  top: 32px;
  right: 32px;
  z-index: 1200;
  background: var(--rs-agora-transparent-black-70);
  color: var(--rs-agora-white);
  border: none;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: var(--rs-agora-shadow-lg);
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  backdrop-filter: blur(6px);
}
.settings-fab:hover {
  background: var(--rs-agora-transparent-black-50);
  box-shadow: var(--rs-agora-shadow-xl);
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
  background: var(--rs-agora-dark-surface-20);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  overflow-y: auto;
}
.settings-modal-glass {
  background: var(--rs-agora-dark-surface-44);
  border-radius: 20px;
  box-shadow: 0 12px 48px var(--rs-agora-transparent-black-45);
  padding: 32px 28px 28px 28px;
  width: 100%;
  max-width: 420px;
  color: var(--rs-agora-white);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1.5px solid var(--rs-agora-transparent-white-08);
  backdrop-filter: blur(16px);
  animation: modalPopIn 0.25s cubic-bezier(.4,2,.6,1) 1;
  box-sizing: border-box;
  max-height: 90vh
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
  background: var(--rs-agora-gradient-primary);
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
  color: var(--rs-agora-text-accent);
  margin-bottom: 2px;
}
.settings-section select {
  background: var(--rs-agora-dark-surface-40);
  color: var(--rs-agora-white);
  border: 1.5px solid var(--rs-agora-primary);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
}
.settings-section select:focus {
  border: 1.5px solid var(--rs-agora-secondary);
}
.settings-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 18px;
}
.save-button {
  background: var(--rs-agora-gradient-primary);
  color: var(--rs-agora-white);
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--rs-agora-transparent-primary-12);
  transition: background 0.2s, box-shadow 0.2s;
}
.save-button:hover {
  background: var(--rs-agora-gradient-secondary);
  box-shadow: 0 4px 16px var(--rs-agora-transparent-secondary-18);
}
.cancel-button {
  background: var(--rs-agora-gray-600);
  color: var(--rs-agora-white);
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.cancel-button:hover {
  background: var(--rs-agora-gray-800);
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

/* Layout button (top center) */
.layout-button-top {
  background: var(--rs-agora-dark-surface-34);
  color: var(--rs-agora-white);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--rs-agora-transition-fast), box-shadow var(--rs-agora-transition-fast), transform var(--rs-agora-transition-fast);
  backdrop-filter: blur(6px);
}

.layout-button-top .icon {
  width: 20px;
  height: 20px;
  color: currentColor;
}

/* Settings button (top center) */
.settings-button-top {
  background: var(--rs-agora-dark-surface-34);
  color: var(--rs-agora-white);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--rs-agora-transition-fast), box-shadow var(--rs-agora-transition-fast), transform var(--rs-agora-transition-fast);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px var(--rs-agora-transparent-black-20);
  border: 1px solid var(--rs-agora-transparent-white-10);
}

.settings-button-top .icon {
  width: 20px;
  height: 20px;
  color: currentColor;
}

/* Log button (top center) */
.log-button-top {
  background: var(--rs-agora-dark-surface-34);
  color: var(--rs-agora-white);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--rs-agora-transition-fast), box-shadow var(--rs-agora-transition-fast), transform var(--rs-agora-transition-fast);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px var(--rs-agora-transparent-black-20);
  border: 1px solid var(--rs-agora-transparent-white-10);
}

.log-button-top .icon {
  width: 20px;
  height: 20px;
  color: currentColor;
}
.layout-button-top:hover {
  background: var(--rs-agora-dark-surface-60);
  box-shadow: 0 4px 12px var(--rs-agora-transparent-warning-25), 0 0 0 4px var(--rs-agora-warning);
  transform: scale(1.1);
}

.settings-button-top:hover,
.settings-button-top.active {
  background: var(--rs-agora-dark-surface-60);
  box-shadow: 0 4px 12px var(--rs-agora-transparent-primary-25), 0 0 0 4px var(--rs-agora-secondary);
  transform: scale(1.1);
}

.log-button-top:hover {
  background: var(--rs-agora-dark-surface-60);
  box-shadow: 0 4px 12px var(--rs-agora-transparent-warning-25), 0 0 0 4px var(--rs-agora-warning);
  transform: scale(1.1);
}

.info-button-top:hover,
.info-button-top.active {
  background: var(--rs-agora-dark-surface-60);
  box-shadow: 0 4px 12px var(--rs-agora-transparent-info-25), 0 0 0 4px var(--rs-agora-info);
  transform: scale(1.1);
}

/* Info button (top center) */
.info-button-top {
  background: var(--rs-agora-dark-surface-34);
  color: var(--rs-agora-white);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--rs-agora-transition-fast), box-shadow var(--rs-agora-transition-fast), transform var(--rs-agora-transition-fast);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px var(--rs-agora-transparent-black-20);
  border: 1px solid var(--rs-agora-transparent-white-10);
}

.info-button-top .icon {
  width: 20px;
  height: 20px;
  color: currentColor;
}

.info-button-top:hover,
.info-button-top.active {
  background: var(--rs-agora-dark-surface-60);
  box-shadow: 0 4px 12px var(--rs-agora-transparent-success-25), 0 0 0 4px var(--rs-agora-success);
  transform: scale(1.1);
}


.settings-button-top.purple-glow {
  background: var(--rs-agora-gradient-primary);
  box-shadow: 0 0 0 4px var(--rs-agora-secondary), 0 8px 32px var(--rs-agora-transparent-primary-25);
  color: var(--rs-agora-white);
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
  background: var(--rs-agora-dark-surface-26);
  border: 1px solid var(--rs-agora-transparent-white-10);
  border-radius: var(--rs-agora-radius-xl);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px var(--rs-agora-transparent-black-40);
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
  border-bottom: 1px solid var(--rs-agora-transparent-white-10);
  background: var(--rs-agora-gradient-blue);
}

.sidebar-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--rs-agora-text-primary);
  margin: 0;
  background: var(--rs-agora-gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-section {
  padding: 16px 20px;
  border-bottom: 1px solid var(--rs-agora-transparent-white-05);
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
  color: var(--rs-agora-text-secondary);
}

.section-icon {
  font-size: 16px;
}

.info-card, .network-widget, .status-card, .device-status {
  background: var(--rs-agora-transparent-white-05);
  border-radius: var(--rs-agora-radius-md);
  padding: 12px;
  border: 1px solid var(--rs-agora-transparent-white-10);
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
  color: var(--rs-agora-text-secondary);
  font-weight: 500;
}

.info-value {
  color: var(--rs-agora-text-primary);
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
  color: var(--rs-agora-text-secondary);
  font-weight: 500;
}

.network-value {
  color: var(--rs-agora-text-primary);
  font-weight: 600;
}

.quality-indicator {
  padding: 4px 8px;
  border-radius: var(--rs-agora-radius-sm);
  font-size: 11px;
  font-weight: 600;
  color: var(--rs-agora-white);
  text-align: center;
  min-width: 40px;
}

.quality-text {
  text-shadow: 0 1px 2px var(--rs-agora-transparent-black-30);
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
  background: var(--rs-agora-success);
  box-shadow: 0 0 8px var(--rs-agora-transparent-success-50);
  animation: statusPulse 2s infinite;
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.status-text {
  color: var(--rs-agora-success);
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
  color: var(--rs-agora-text-secondary);
  font-weight: 500;
}

.device-status {
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.device-status.available {
  color: var(--rs-agora-success);
  background: var(--rs-agora-transparent-success-10);
}

.device-status.unavailable {
  color: var(--rs-agora-error);
  background: var(--rs-agora-transparent-error-10);
}

/* Custom scrollbar for sidebar */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: var(--rs-agora-transparent-white-05);
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: var(--rs-agora-transparent-primary-30);
  border-radius: 3px;
  transition: background var(--rs-agora-transition-fast);
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: var(--rs-agora-transparent-primary-50);
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
    border-radius: var(--rs-agora-radius-md);
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
    color: var(--rs-agora-text-primary);
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
  
  .info-row, .network-item,   .device-item {
    font-size: 12px;
  }
}

/* Loading Spinner Styles */
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  color: currentColor;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Loading state for whiteboard button */
.control-button.loading {
  background: var(--rs-agora-gradient-primary);
  color: white;
  cursor: wait;
  position: relative;
  overflow: hidden;
}

.control-button.loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
</style> 