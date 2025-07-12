<template>
  <div id="app">
    <div class="app-container">
      <!-- Header -->
    

      <!-- Floating Info Button and Sidebar -->
      <div v-if="isConnected" class="sidebar-float-wrapper">
        <button
          class="log-float-btn log-button-top"
          @click="handleOpenLogs"
          title="Agora Günlükleri"
        >
          <span class="icon">📋</span>
        </button>
        <button
          class="info-float-btn"
          :class="{ 'active': sidebarOpen }"
          @click="toggleSidebar"
          title="Konferans Bilgileri"
        >
          <span class="icon">{{ sidebarOpen ? '✕' : 'ℹ' }}</span>
        </button>
        <div class="sidebar-container" :class="{ 'sidebar-open': sidebarOpen }">
          <div class="sidebar-content">
            <div class="sidebar-header">
              <h3>Konferans Bilgileri</h3>
            </div>
            <div class="sidebar-section">
              <div class="section-title">
                <span class="section-icon">📡</span>
                <span>Kanal Bilgileri</span>
              </div>
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Kanal:</span>
                  <span class="info-value">{{ channelName || 'Bağlı değil' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Katılımcı:</span>
                  <span class="info-value">{{ connectedUsersCount || 0 }} kişi</span>
                </div>
              </div>
            </div>
            <div v-if="isConnected" class="sidebar-section">
              <div class="section-title">
                <span class="section-icon">🌐</span>
                <span>Ağ Kalitesi</span>
              </div>
              <div class="network-widget">
                <div class="network-item">
                  <span class="network-label">Kalite:</span>
                  <div class="quality-indicator" :style="{ backgroundColor: qualityColor }">
                    <span class="quality-text">{{ qualityLevel }}</span>
                  </div>
                </div>
                <div class="network-item">
                  <span class="network-label">Bitrate:</span>
                  <span class="network-value">{{ bitrate || 0 }} kbps</span>
                </div>
                <div class="network-item">
                  <span class="network-label">FPS:</span>
                  <span class="network-value">{{ frameRate || 0 }}</span>
                </div>
                <div class="network-item">
                  <span class="network-label">Gecikme:</span>
                  <span class="network-value">{{ rtt || 0 }}ms</span>
                </div>
                <div class="network-item">
                  <span class="network-label">Paket Kaybı:</span>
                  <span class="network-value">{{ packetLoss || 0 }}%</span>
                </div>
              </div>
            </div>
            <div v-if="isConnected" class="sidebar-section">
              <div class="section-title">
                <span class="section-icon">🔗</span>
                <span>Bağlantı Durumu</span>
              </div>
              <div class="status-card">
                <div class="status-indicator connected">
                  <span class="status-dot"></span>
                  <span class="status-text">Bağlı</span>
                </div>
              </div>
            </div>
            <div class="sidebar-section">
              <div class="section-title">
                <span class="section-icon">📱</span>
                <span>Cihaz Durumu</span>
              </div>
              <div class="device-status">
                <div class="device-item">
                  <span class="device-icon">📹</span>
                  <span class="device-name">Kamera</span>
                  <span class="device-status" :class="{ 'available': canUseCamera, 'unavailable': !canUseCamera }">
                    {{ canUseCamera ? 'Mevcut' : 'Mevcut değil' }}
                  </span>
                </div>
                <div class="device-item">
                  <span class="device-icon">🎤</span>
                  <span class="device-name">Mikrofon</span>
                  <span class="device-status" :class="{ 'available': canUseMicrophone, 'unavailable': !canUseMicrophone }">
                    {{ canUseMicrophone ? 'Mevcut' : 'Mevcut değil' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <main class="app-main">
        <!-- Join Form - Sadece bağlantı yokken -->
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
                  v-model="channelName"
                  type="text"
                  placeholder="Kanal adı girin"
                  class="channel-input"
                  @keyup.enter="handleJoin(channelName)"
                />
                <div class="input-border"></div>
              </div>
              <button 
                @click="handleJoin(channelName)" 
                :disabled="isJoining || !channelName.trim()"
                class="join-button"
              >
                <span class="button-text">{{ isJoining ? 'Katılıyor...' : 'Kanala Katıl' }}</span>
                <div class="button-glow"></div>
              </button>
            </div>
          </div>
        </div>
        <!-- Video Area - Only show when connected -->
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
        <!-- Recording Controls - Sadece bağlantı varken -->
        <div v-if="isConnected" class="recording-area">
          <RecordingControls />
        </div>
        
        <!-- Controls Area - Sadece bağlantı varken -->
        <div v-if="isConnected" class="controls-area">
          <AgoraControls
            :channelName="channelName"
            :isConnected="!!isConnected"
            :isLocalVideoOff="!!isLocalVideoOff"
            :isLocalAudioMuted="!!isLocalAudioMuted"
            :canUseCamera="canUseCamera"
            :canUseMicrophone="canUseMicrophone"
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
            @open-logs="handleOpenLogs"
          />
        </div>
      </main>
      
    
      
      <!-- Log Modal -->
      <LogModal 
        :isOpen="logsOpen" 
        :logs="logs"
        :logStats="logStats"
        :getFilteredLogs="getFilteredLogs"
        :clearLogs="clearLogs"
        :exportLogs="exportLogs"
        @close="logsOpen = false" 
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useMeeting, AgoraVideo, AgoraControls, LogModal, RecordingControls, getErrorMessage } from './modules/agora'
import { AGORA_EVENTS } from './modules/agora/constants.js'

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
  logUI,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logVideo,
  logScreen,
  logQuality,
  trackPerformance,
  trackUserAction,
  logs,
  logStats,
  getFilteredLogs,
  clearLogs,
  exportLogs,
  checkDeviceStatus
} = useMeeting()



const channelName = ref('')

// Join channel handler
const handleJoin = async (name) => {
  try {
    channelName.value = name
    await joinChannel(name)
  } catch (error) {
    logError(error, { context: 'handleJoin', channelName: name })
    const userMessage = getErrorMessage(error)
    alert(userMessage)
  }
}

// Leave channel handler
const handleLeave = async () => {
  try {
    await leaveChannel()
    channelName.value = ''
    clearLogs() // Ayrılınca logları da temizle
  } catch (error) {
    logError(error, { context: 'handleLeave', channelName: channelName.value })
  }
}

// Toggle camera handler
const handleToggleCamera = async (off) => {
  try {
    await toggleCamera(off)
  } catch (error) {
    logError(error, { context: 'handleToggleCamera', state: off ? 'off' : 'on' })
  }
}

// Toggle microphone handler
const handleToggleMicrophone = async (muted) => {
  try {
    await toggleMicrophone(muted)
  } catch (error) {
    logError(error, { context: 'handleToggleMicrophone', state: muted ? 'muted' : 'unmuted' })
  }
}

// Event listeners
const setupEventListeners = () => {
  // Merkezi event sistemi kullanılıyorsa onu dinle
  if (centralEmitter && centralEmitter.on) {
    logUI('Central event system initialized')
    
    centralEmitter.on(AGORA_EVENTS.USER_JOINED, (data) => {
      logUI('User joined', data)
    })

    centralEmitter.on(AGORA_EVENTS.USER_LEFT, (data) => {
      logUI('User left', { uid: data.uid })
    })

    centralEmitter.on(AGORA_EVENTS.LOCAL_VIDEO_READY, (data) => {
      logUI('Local video ready', data)
    })

    centralEmitter.on(AGORA_EVENTS.LOCAL_AUDIO_READY, (data) => {
      logUI('Local audio ready', data)
    })

    centralEmitter.on(AGORA_EVENTS.REMOTE_AUDIO_READY, (data) => {
      logUI('Remote audio ready', data)
    })

    centralEmitter.on(AGORA_EVENTS.CONNECTION_STATE_CHANGE, (data) => {
      logUI('Connection state changed', data)
    })
  }
}

const agoraVideoRef = ref(null)
const logsOpen = ref(false)
const sidebarOpen = ref(false)
const toggleSidebar = () => { sidebarOpen.value = !sidebarOpen.value }

function handleOpenLogs() {
  logsOpen.value = true
}

// Lifecycle
onMounted(async () => {

  logUI('Test logu', { test: true })

  setupEventListeners()
  // Cihaz durumlarını kontrol et
  try {
    await checkDeviceStatus()
  } catch (error) {
    logError(error, { context: 'checkDeviceStatus' })
  }
})

onUnmounted(() => {
  cleanup()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%);
  color: #e0e0e0;
  min-height: 100vh;
  height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-width: 100%;
  margin: 0;
  padding: 10px;
}

.app-header {
  text-align: center;
  margin-bottom: 15px;
}

.app-header h1 {
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  height: 100%;
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

.sidebar-float-wrapper {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
}
.info-float-btn {
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
  margin-bottom: 10px;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  pointer-events: auto;
}
.info-float-btn.active,
.info-float-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(102,126,234,0.25), 0 0 0 4px #764ba2aa;
  transform: scale(1.1);
}
.sidebar-container {
  width: 340px;
  max-height: calc(100vh - 40px);
  background: rgba(26, 26, 46, 0.97);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow-y: auto;
  transform: translateX(120%);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}
.sidebar-open.sidebar-container {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}
.sidebar-content {
  padding: 20px;
}
.sidebar-header {
  text-align: center;
  margin-bottom: 20px;
}
.sidebar-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 10px;
  margin-bottom: 15px;
}
.sidebar-section {
  margin-bottom: 25px;
}
.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  color: #fff;
}
.section-icon {
  font-size: 20px;
  margin-right: 10px;
}
.section-title span {
  font-size: 18px;
  font-weight: 500;
}
.info-card, .network-widget, .status-card, .device-status {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 15px;
  backdrop-filter: blur(5px);
}
.info-card .info-row, .network-widget .network-item, .status-card .status-indicator, .device-status .device-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: #e0e0e0;
}
.info-card .info-row:last-child, .network-widget .network-item:last-child, .status-card .status-indicator:last-child, .device-status .device-item:last-child {
  margin-bottom: 0;
}
.info-label, .network-label, .status-text, .device-name {
  font-size: 14px;
  font-weight: 400;
  color: #a0a0a0;
}
.info-value, .network-value {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}
.network-widget .network-item .quality-indicator {
  width: 60px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 12px;
}
.network-widget .network-item .network-value {
  font-size: 14px;
}
.status-card .status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.status-card .status-indicator.connected {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border-color: rgba(76, 175, 80, 0.3);
}
.status-card .status-indicator .status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #fff;
  margin-right: 8px;
}
.status-card .status-text {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}
.device-status .device-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.device-status .device-item:last-child {
  margin-bottom: 0;
}
.device-icon {
  font-size: 20px;
  margin-right: 10px;
  color: #a0a0a0;
}
.device-name {
  font-size: 14px;
  font-weight: 400;
  color: #e0e0e0;
  margin-right: 10px;
}
.device-status .device-status {
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  padding: 4px 8px;
  border-radius: 6px;
}
.device-status .device-status.available {
  background: rgba(76, 175, 80, 0.2);
  color: #4CAF50;
}
.device-status .device-status.unavailable {
  background: rgba(239, 68, 68, 0.2);
  color: #EF4444;
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
  margin-bottom: 10px;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  pointer-events: auto;
}
.log-float-btn:hover {
  background: linear-gradient(135deg, #ffb347 0%, #ffcc33 100%);
  box-shadow: 0 4px 12px rgba(255,193,7,0.25), 0 0 0 4px #ffc107aa;
  transform: scale(1.1);
}

/* Join (Katıl) Ekranı */
.join-form {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  height: 100%;
  width: 100%;
  flex: 1;
  z-index: 2;
}
.join-content {
  width: 100%;
  max-width: 400px;
  background: linear-gradient(135deg, #23243a 0%, #1a1a2e 100%);
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  padding: 36px 28px 32px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1.5px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(10px);
}
.join-header {
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
}
.logo-icon {
  font-size: 54px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2px;
  filter: drop-shadow(0 2px 8px #667eea44);
}
.join-header h2 {
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}
.join-subtitle {
  color: #b0b0b0;
  font-size: 15px;
  margin: 0;
  line-height: 1.5;
  text-align: center;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  margin-top: 8px;
}
.input-wrapper {
  position: relative;
  width: 100%;
}
.channel-input {
  width: 100%;
  padding: 15px 20px;
  background: rgba(255,255,255,0.06);
  border: 2px solid rgba(255,255,255,0.13);
  border-radius: 12px;
  font-size: 16px;
  color: #fff;
  transition: all 0.3s;
  backdrop-filter: blur(8px);
  outline: none;
}
.channel-input::placeholder {
  color: #a0a0a0;
}
.channel-input:focus {
  border-color: #667eea;
  background: rgba(255,255,255,0.13);
  box-shadow: 0 0 16px #667eea33;
}
.input-border {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
}
.channel-input:focus + .input-border {
  opacity: 0.25;
}
.join-button {
  position: relative;
  width: 100%;
  padding: 15px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  box-shadow: 0 2px 8px #667eea22;
}
.join-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px #764ba244;
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
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
  transition: left 0.5s;
}
.join-button:hover:not(:disabled) .button-glow {
  left: 100%;
}
@media (max-width: 600px) {
  .join-content {
    max-width: 98vw;
    padding: 18px 6px 18px 6px;
  }
  .join-header h2 {
    font-size: 20px;
  }
  .logo-icon {
    font-size: 38px;
  }
  .form-group {
    gap: 12px;
  }
  .channel-input {
    font-size: 14px;
    padding: 12px 10px;
  }
  .join-button {
    font-size: 14px;
    padding: 12px 0;
  }
}

/* Recording Area */
.recording-area {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .app-container {
    padding: 5px;
  }
  
  .app-header h1 {
    font-size: 24px;
  }
  
  .app-main {
    gap: 10px;
  }
  
  .recording-area {
    padding: 0 10px;
  }
  
  .sidebar-float-wrapper {
    top: 8px;
    right: 8px;
  }
  .info-float-btn, .log-float-btn {
    width: 38px;
    height: 38px;
    font-size: 16px;
    margin-bottom: 6px;
  }
  .log-float-btn {
    top: 8px;
    left: 8px;
  }
}
</style>
