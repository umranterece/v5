<template>
  <div class="agora-conference">
    <!-- Loading Screen -->
    <div v-if="isLoading" class="loading-screen">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <img src="https://www.rehberimsensin.com/assets/images/logo.svg" alt="Rehberim Sensin" class="loading-logo" />
        <h3>Agora Konferans Yükleniyor...</h3>
        <p>Lütfen bekleyin, sistem hazırlanıyor</p>
      </div>
    </div>

    <!-- Main Content -->
    <main v-else class="conference-main">
      <!-- Join Form - Bağlı olmadığında göster -->
      <JoinForm
        v-if="!isConnected"
        :defaultChannel="channelName"
        :isJoining="!!isJoining"
        @join="handleJoin"
      />
      
      <!-- Video Area - Bağlı olduğunda göster -->
      <div v-if="isConnected" class="video-area">
        <AgoraVideo
          ref="agoraVideoRef"
          :centralEmitter="centralEmitter"
          :localUser="localUser || {}"
          :remoteUsers="remoteUsers || []"
          :allUsers="allUsers || []"
          :localTracks="localTracks || {}"
          :remoteTracks="remoteTracks || new Map()"
          :logUI="logUI"
          :logError="logError"
        />
      </div>
      
      <!-- Controls Area - Sadece bağlı olduğunda göster -->
      <div v-if="isConnected" class="controls-area">
        <AgoraControls
          :channelName="channelName"
          :isConnected="!!isConnected"
          :isLocalVideoOff="!!isLocalVideoOff"
          :isLocalAudioMuted="!!isLocalAudioMuted"
          :canUseCamera="canUseCamera"
          :canUseMicrophone="canUseCamera"
          :connectedUsersCount="connectedUsersCount || 0"
          :isJoining="!!isJoining"
          :isLeaving="!!isLeaving"
          :onJoin="handleJoin"
          :onLeave="handleLeave"
          :onToggleCamera="handleToggleCamera"
          :onToggleMicrophone="handleToggleMicrophone"
          :isScreenSharing="isScreenSharing"
          :onToggleScreenShare="toggleScreenShare"
          :supportsScreenShare="supportsScreenShare"
          :networkQualityLevel="qualityLevel"
          :networkQualityColor="qualityColor"
          :networkBitrate="bitrate"
          :networkFrameRate="frameRate"
          :networkRtt="rtt"
          :networkPacketLoss="packetLoss"
          :logUI="logUI"
          :logError="logError"
          :trackUserAction="trackUserAction"
          :onOpenSettings="toggleSettings"
        />
      </div>
    </main>

    <!-- Log Modal - Sadece debug mode açıkken göster -->
    <LogModal
      v-if="debugMode"
      :isOpen="isLogOpen"
      :logs="logs"
      :logStats="logStats"
      :getFilteredLogs="getFilteredLogs"
      :clearLogs="clearLogs"
      :exportLogs="exportLogs"
      @close="closeLog"
    />

    <!-- Info Modal - Sadece debug mode açıkken göster -->
    <InfoModal
      v-if="debugMode"
      :isOpen="isInfoOpen"
      :channelName="channelName"
      :isConnected="!!isConnected"
      :connectedUsersCount="connectedUsersCount || 0"
      :networkQualityLevel="qualityLevel"
      :networkQualityColor="qualityColor"
      :networkBitrate="bitrate"
      :networkFrameRate="frameRate"
      :networkRtt="rtt"
      :networkPacketLoss="packetLoss"
      :canUseCamera="canUseCamera"
      :canUseMicrophone="canUseMicrophone"
      :isLocalVideoOff="!!isLocalVideoOff"
      :isLocalAudioMuted="!!isLocalAudioMuted"
      :allUsers="allUsers || []"
      @close="toggleInfo"
    />

    <!-- Settings Modal -->
    <SettingsModal
      :isOpen="isSettingsOpen"
      :currentCamera="selectedCameraId"
      :currentMicrophone="selectedMicId"
      :currentSpeaker="selectedSpeakerId"
      :currentVideoQuality="selectedVideoQuality"
      :currentAudioQuality="'medium'"
      :isMobile="false"
      @close="toggleSettings"
      @settings-changed="handleSettingsChanged"
    />

    <!-- Info Button - Sadece debug mode açıkken göster -->
    <button 
      v-if="debugMode"
      class="info-float-btn" 
      :class="{ active: isInfoOpen }"
      @click="toggleInfo"
      title="Toplantı Bilgileri"
    >
      <span>ℹ️</span>
    </button>

    <!-- Log Button - Sadece debug mode açıkken göster -->
    <button 
      v-if="debugMode"
      class="log-float-btn" 
      :class="{ active: isLogOpen }"
      @click="toggleLog"
      title="Log Ekranı"
    >
      <span>📝</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useMeeting } from '../../composables/index.js'
import { AgoraVideo } from './index.js'
import { AgoraControls } from '../controls/index.js'
import { JoinForm } from '../forms/index.js'
import { InfoModal, SettingsModal, LogModal } from '../modals/index.js'
import { createToken } from '../../services/tokenService.js'
import { AGORA_EVENTS, USER_ID_RANGES, API_ENDPOINTS } from '../../constants.js'

// Random UID oluşturma fonksiyonu
const generateRandomUID = () => {
  const min = USER_ID_RANGES.VIDEO.MIN
  const max = USER_ID_RANGES.VIDEO.MAX
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Props - Component dışından alınacak değerler
const props = defineProps({
  // Token ve API ayarları
  tokenEndpoint: {
    type: String,
    default: null
  },
  
  // Kanal ayarları
  channelName: {
    type: String,
    default: ''
  },
  autoJoin: {
    type: Boolean,
    default: false
  },
  
  // Kullanıcı ayarları
  userUid: {
    type: [String, Number],
    default: null
  },
  
  // Debug ayarları
  debugMode: {
    type: Boolean,
    default: false
  }
})

// Emits - Component dışına gönderilecek eventler
const emit = defineEmits([
  'joined',
  'left', 
  'error',
  'user-joined',
  'user-left',
  'connection-state-change',
  'token-requested',
  'token-received'
])

const {
  joinChannel,
  leaveChannel,
  toggleCamera,
  toggleMicrophone,
  toggleScreenShare,
  isScreenSharing,
  centralEmitter,
  isJoining,
  isLeaving,
  cleanup,
  clean,
  isConnected,
  localUser,
  remoteUsers,
  allUsers,
  connectedUsersCount,
  isLocalVideoOff,
  isLocalAudioMuted,
  canUseCamera,
  canUseMicrophone,
  localTracks,
  remoteTracks,
  supportsScreenShare,
  // Stream Quality
  bitrate,
  frameRate,
  packetLoss,
  rtt,
  qualityLevel,
  qualityColor,
  // Logger
  logUI,
  logError,
  trackUserAction,
  logs,
  logStats,
  getFilteredLogs,
  clearLogs,
  exportLogs
} = useMeeting()

const channelName = ref(props.channelName || '')



// Loading state
const isLoading = ref(true)

// Log state
const isLogOpen = ref(false)
const logsContainer = ref(null)

// Info sidebar state
const isInfoOpen = ref(false)

// Settings modal state
const isSettingsOpen = ref(false)

// Device selection state
const selectedCameraId = ref('')
const selectedMicId = ref('')
const selectedSpeakerId = ref('')
const selectedVideoQuality = ref('1080p_1')

// Props değişikliklerini dinle
watch(() => props.channelName, (newValue) => {
  if (newValue && newValue !== channelName.value) {
    channelName.value = newValue
  }
})

// Log toggle
const toggleLog = () => {
  isLogOpen.value = !isLogOpen.value
  logUI('Log modal toggled', { isOpen: isLogOpen.value })
}

// Close log modal
const closeLog = () => {
  isLogOpen.value = false
  logUI('Log modal closed')
}

// Info sidebar toggle
const toggleInfo = () => {
  isInfoOpen.value = !isInfoOpen.value
  logUI('Info sidebar toggled', { isOpen: isInfoOpen.value })
}

// Settings modal toggle
const toggleSettings = () => {
  isSettingsOpen.value = !isSettingsOpen.value
  logUI('Settings modal toggled', { isOpen: isSettingsOpen.value })
}

// Handle settings changed
const handleSettingsChanged = (newSettings) => {
  logUI('Settings changed', newSettings)
  // Burada gerekli ayarları uygulayabiliriz
}

// Auto-scroll logs to bottom
watch(logs, () => {
  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight
    }
  })
})



// Join channel handler
const handleJoin = async (name) => {
  try {
    const channelToJoin = name || channelName.value
    channelName.value = channelToJoin
    
    // Eğer userUid null ise random UID oluştur
    const finalUid = props.userUid || generateRandomUID()
    
    // Token al - createToken servisinden tüm veriyi al
    emit('token-requested', { channelName: channelToJoin, uid: finalUid })
    const tokenResult = await createToken(channelToJoin, finalUid, props.tokenEndpoint)
    emit('token-received', { token: tokenResult.token, channelName: channelToJoin, uid: finalUid })
    
    // Join parametreleri
    const joinParams = {
      channelName: channelToJoin,
      token: tokenResult.token,
      uid: finalUid,
      appId: tokenResult.app_id
    }
    
    // joinChannel içinde zaten clean() çağrılıyor
    await joinChannel(joinParams)
    emit('joined', { channelName: channelToJoin, token: tokenResult.token, uid: finalUid })
  } catch (error) {
    logError(error, { context: 'handleJoin', channelName: name })
    emit('error', { error, message: error.message })
  }
}

// Leave channel handler
const handleLeave = async () => {
  try {
    await leaveChannel()
    emit('left', { channelName: channelName.value })
    channelName.value = ''
    clearLogs() // Ayrılınca logları da temizle
  } catch (error) {
    logError(error, { context: 'handleLeave', channelName: channelName.value })
    emit('error', { error })
  }
}

// Toggle camera handler
const handleToggleCamera = async (off) => {
  try {
    await toggleCamera(off)
  } catch (error) {
    logError(error, { context: 'handleToggleCamera', state: off ? 'off' : 'on' })
    emit('error', { error })
  }
}

// Toggle microphone handler
const handleToggleMicrophone = async (muted) => {
  try {
    await toggleMicrophone(muted)
  } catch (error) {
    logError(error, { context: 'handleToggleMicrophone', state: muted ? 'muted' : 'unmuted' })
    emit('error', { error })
  }
}

// Event listeners
const setupEventListeners = () => {
  // Merkezi event sistemi kullanılıyorsa onu dinle
  if (centralEmitter && centralEmitter.on) {
    logUI('Central event system initialized')
    
    centralEmitter.on(AGORA_EVENTS.USER_JOINED, (data) => {
      logUI('User joined', data)
      emit('user-joined', data)
    })

    centralEmitter.on(AGORA_EVENTS.USER_LEFT, (data) => {
      logUI('User left', { uid: data.uid })
      emit('user-left', data)
    })

    centralEmitter.on(AGORA_EVENTS.CONNECTION_STATE_CHANGE, (data) => {
      logUI('Connection state changed', data)
      emit('connection-state-change', data)
    })
  }
}

const agoraVideoRef = ref(null)

// Auto join if enabled
const handleAutoJoin = async () => {
  if (props.autoJoin && channelName.value && !isConnected.value) {
    logUI('Auto joining channel...', { channelName: channelName.value })
    await handleJoin(channelName.value)
  }
}

// Lifecycle
onMounted(async () => {
  logUI('AgoraConference component mounted', { 
    channelName: channelName.value,
    autoJoin: props.autoJoin
  })

  setupEventListeners()
  
  // Loading'i biraz daha uzun göster (1 saniye)
  await new Promise(resolve => setTimeout(resolve, 1000))
  isLoading.value = false
  
  // Auto join if enabled - nextTick ile güvenli çalıştır
  if (props.autoJoin && channelName.value) {
    await nextTick()
    await handleAutoJoin()
  }
})

onUnmounted(() => {
  cleanup()
})

// Expose methods for parent component
defineExpose({
  joinChannel: handleJoin,
  leaveChannel: handleLeave,
  toggleCamera: handleToggleCamera,
  toggleMicrophone: handleToggleMicrophone,
  toggleScreenShare,
  clean,
  isConnected,
  channelName,
  connectedUsersCount,
  localUser,
  remoteUsers,
  allUsers
})
</script>

<style scoped>
.agora-conference {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%);
  color: #e0e0e0;
  min-height: 100vh;
  position: relative;
}

/* Loading Screen */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 400px;
}

.loading-logo {
  width: 300px;
  height: auto;
  margin-bottom: 30px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-content h3 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 10px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-content p {
  font-size: 16px;
  color: #a0a0a0;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.conference-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  height: 100%;
  padding: 10px;
}

.video-area {
  flex: 1;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.controls-area {
  background: transparent;
  border-radius: 16px;
}










/* Float Buttons */
.info-float-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  background: rgba(34, 34, 34, 0.9);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
}

.info-float-btn.active,
.info-float-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102,126,234,0.25), 0 0 0 4px #764ba2aa;
  transform: scale(1.1);
}

.log-float-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 2000;
  background: rgba(34, 34, 34, 0.9);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
}

.log-float-btn.active,
.log-float-btn:hover {
  background: linear-gradient(135deg, #ffb347 0%, #ffcc33 100%);
  box-shadow: 0 4px 12px rgba(255,193,7,0.25), 0 0 0 4px #ffc107aa;
  transform: scale(1.1);
}

















/* Responsive */
@media (max-width: 768px) {
  .conference-main {
    gap: 10px;
    padding: 5px;
  }
  
  .info-float-btn, .log-float-btn {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }
  

}
</style> 