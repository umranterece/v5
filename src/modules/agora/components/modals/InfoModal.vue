<template>
  <div v-if="isOpen" class="info-modal-overlay" @click="handleOverlayClick">
    <div class="info-modal" @click.stop>
      <!-- Header -->
      <div class="info-header">
        <div class="header-content">
          <div class="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 16H6L14 8L6 8L6 6L18 6V18L16 18L16 11L8 19L6 17L13 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
         
        </div>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>

      <!-- Content -->
      <div class="info-content">
        <div class="info-grid">
          <!-- Channel Info Widget -->
          <div class="info-widget channel-widget">
            <div class="widget-header">
              <div class="widget-icon"><TvIcon /></div>
              <h4>Kanal Bilgileri</h4>
            </div>
            <div class="widget-content">
              <div class="widget-stat">
                <div class="stat-label">Kanal Adı</div>
                <div class="stat-value">{{ channelName || 'Belirtilmemiş' }}</div>
              </div>
              <div class="widget-stat">
                <div class="stat-label">Bağlı Kullanıcı</div>
                <div class="stat-value">{{ connectedUsersCount || 0 }}</div>
              </div>
              <div class="widget-stat">
                <div class="stat-label">Durum</div>
                <div class="stat-value status-badge" :class="{ 'connected': isConnected, 'disconnected': !isConnected }">
                  {{ isConnected ? 'Bağlı' : 'Bağlı Değil' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Network Quality Widget -->
          <div class="info-widget network-widget">
            <div class="widget-header">
              <div class="widget-icon"><GlobeAltIcon /></div>
              <h4>Ağ Kalitesi</h4>
            </div>
            <div class="widget-content">
              <!-- Kalite Seviyesi ve Progress Bar -->
              <div class="quality-overview">
                <div class="quality-level-display">
                  <span class="quality-level-text" :style="{ color: networkQualityColor }">
                    {{ networkQualityLevel || 'N/A' }}
                  </span>
                  <span class="quality-percentage">{{ networkQualityPercentage || 0 }}%</span>
                </div>
                <div class="quality-progress">
                  <div 
                    class="quality-fill" 
                    :style="{ 
                      width: `${networkQualityPercentage || 0}%`,
                      backgroundColor: networkQualityColor 
                    }"
                  ></div>
                </div>
              </div>
              
              <!-- Detaylı Metrikler -->
              <div class="metrics-grid">
                <div class="metric-item">
                  <div class="metric-icon"><SignalIcon /></div>
                  <div class="metric-content">
                    <div class="metric-label">Ağ Kalitesi</div>
                    <div class="metric-value" :style="{ color: networkQualityColor }">
                      {{ networkQualityScore || 0 }}/6
                    </div>
                  </div>
                </div>
                
                <div class="metric-item">
                  <div class="metric-icon"><BoltIcon /></div>
                  <div class="metric-content">
                    <div class="metric-label">Bit Hızı</div>
                    <div class="metric-value">{{ networkBitrate || 'N/A' }} kbps</div>
                  </div>
                </div>
                
                <div class="metric-item">
                  <div class="metric-icon"><FilmIcon /></div>
                  <div class="metric-content">
                    <div class="metric-label">FPS</div>
                    <div class="metric-value">{{ networkFrameRate || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="metric-item">
                  <div class="metric-icon"><CubeIcon /></div>
                  <div class="metric-content">
                    <div class="metric-label">Paket Kaybı</div>
                    <div class="metric-value" :class="{ 'warning': networkPacketLoss > 5 }">
                      {{ networkPacketLoss || 'N/A' }}%
                    </div>
                  </div>
                </div>
                
                <div class="metric-item">
                  <div class="metric-icon"><ClockIcon /></div>
                  <div class="metric-content">
                    <div class="metric-label">RTT</div>
                    <div class="metric-value">{{ networkRtt || 'N/A' }} ms</div>
                  </div>
                </div>
                
                <div class="metric-item">
                  <div class="metric-icon"><LinkIcon /></div>
                  <div class="metric-content">
                    <div class="metric-label">Bağlantı</div>
                    <div class="metric-value status-badge" :class="{ 'connected': isConnected, 'disconnected': !isConnected }">
                      {{ isConnected ? 'Aktif' : 'Kesik' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Device Status Widget -->
          <div class="info-widget device-widget">
            <div class="widget-header">
              <div class="widget-icon"><MicrophoneIcon /></div>
              <h4>Cihaz Durumu</h4>
            </div>
            <div class="widget-content">
              <div class="widget-stat">
                <div class="stat-label">Kamera</div>
                <div class="stat-value device-badge" :class="{ 'available': canUseCamera, 'unavailable': !canUseCamera }">
                  {{ canUseCamera ? 'Kullanılabilir' : 'Kullanılamıyor' }}
                </div>
              </div>
              <div class="widget-stat">
                <div class="stat-label">Mikrofon</div>
                <div class="stat-value device-badge" :class="{ 'available': canUseMicrophone, 'unavailable': !canUseMicrophone }">
                  {{ canUseMicrophone ? 'Kullanılabilir' : 'Kullanılamıyor' }}
                </div>
              </div>
              <div class="widget-stat">
                <div class="stat-label">Video</div>
                <div class="stat-value device-badge" :class="{ 'available': !isLocalVideoOff, 'unavailable': isLocalVideoOff }">
                  {{ isLocalVideoOff ? 'Kapalı' : 'Açık' }}
                </div>
              </div>
              <div class="widget-stat">
                <div class="stat-label">Ses</div>
                <div class="stat-value device-badge" :class="{ 'available': !isLocalAudioMuted, 'unavailable': isLocalAudioMuted }">
                  {{ isLocalAudioMuted ? 'Sessiz' : 'Açık' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Recording Status Widget -->
          <div class="info-widget recording-widget">
            <div class="widget-header">
              <div class="widget-icon">🎥</div>
              <h4>Kayıt Durumu</h4>
            </div>
            <div class="widget-content">
              <!-- Recording Status -->
              <div class="recording-status" :class="recordingStatusClass">
                <div class="status-indicator">
                  <div class="recording-dot" v-if="isRecording"></div>
                  <span class="status-text">{{ getRecordingStatusText() }}</span>
                </div>
                
                <!-- Progress Bar -->
                <div class="progress-container" v-if="isRecording">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: `${recordingProgress}%` }"
                    ></div>
                  </div>
                  <span class="progress-text">{{ recordingProgress.toFixed(1) }}%</span>
                </div>
              </div>
              
              <!-- Recording Controls -->
              <div class="recording-controls">
                <button 
                  v-if="canStartRecording" 
                  @click="startRecording"
                  :disabled="!canStartRecording"
                  class="recording-btn start-btn"
                  :class="{ disabled: !canStartRecording }"
                >
                  ▶️
                  Kayıt Başlat
                </button>
                
                <button 
                  v-if="canStopRecording" 
                  @click="stopRecording"
                  :disabled="!canStopRecording"
                  class="recording-btn stop-btn"
                  :class="{ disabled: !canStopRecording }"
                >
                  ⏹️
                  Kayıt Durdur
                </button>
                
                <button 
                  @click="resetRecording"
                  class="recording-btn reset-btn"
                  v-if="hasRecordingFiles"
                >
                  🔄
                  Sıfırla
                </button>
              </div>

              <!-- Recording Settings -->
              <div class="recording-settings">
                <h4>🎥 Kayıt Ayarları</h4>
                
                <!-- Storage Provider Selection -->
                <div class="setting-group">
                  <label class="setting-label">Storage Provider:</label>
                  <select 
                    v-model="storageProvider" 
                    @change="handleStorageProviderChange"
                    class="setting-select"
                    :disabled="isRecording"
                  >
                    <option value="azure">Azure Storage</option>
                    <option value="custom">Custom Server</option>
                  </select>
                </div>
                
                <!-- Recording Perspective -->
                <div class="setting-group">
                  <label class="setting-label">Kayıt Perspektifi:</label>
                  <select 
                    v-model="recordingPerspective" 
                    @change="handlePerspectiveChange"
                    class="setting-select"
                    :disabled="isRecording"
                  >
                    <option value="host">Host (Kapsamlı)</option>
                    <option value="audience">Audience (Önemli)</option>
                    <option value="whiteboard">Whiteboard (Odaklı)</option>
                  </select>
                </div>
                
                <!-- Recording Quality -->
                <div class="setting-group">
                  <label class="setting-label">Kayıt Kalitesi:</label>
                  <select 
                    v-model="recordingQuality" 
                    @change="handleQualityChange"
                    class="setting-select"
                    :disabled="isRecording"
                  >
                    <option value="high">Yüksek (1080p)</option>
                    <option value="medium">Orta (720p)</option>
                    <option value="low">Düşük (480p)</option>
                  </select>
                </div>
              </div>
              
              <!-- Recording Files -->
              <div class="recording-files" v-if="hasRecordingFiles">
                <div class="files-header">
                  <FolderIcon class="files-icon" />
                  <span class="files-title">Kayıt Dosyaları</span>
                </div>
                <div class="files-list">
                  <div v-for="file in recordingFiles" :key="file.fileId" class="file-item">
                    <div class="file-info">
                      <span class="file-name">{{ file.fileName }}</span>
                      <span class="file-size">{{ file.fileSize || 'N/A' }}</span>
                      <span class="file-duration">{{ file.duration || 'N/A' }}</span>
                    </div>
                    <button @click="downloadRecordingFile(file.fileId)" class="download-btn">
                      <ArrowDownTrayIcon class="download-icon" /> İndir
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Error Display -->
              <div class="recording-error" v-if="recordingError">
                <div class="error-message">
                  <ExclamationTriangleIcon class="error-icon" />
                  <span class="error-text">{{ recordingError }}</span>
                </div>
                <button @click="clearRecordingError" class="clear-error-btn">
                  <XMarkIcon />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Users List - Full Width -->
        <div class="info-section users-section">
          <h4>👥 Katılımcılar</h4>
          <div class="users-list">
            <div v-for="user in allUsers" :key="user.uid" class="user-item">
              <span class="user-icon">{{ user.isLocal ? '👤' : '👥' }}</span>
              <span class="user-name">{{ user.userName || `User ${user.uid}` }}</span>
              <span class="user-status" :class="{ 'local': user.isLocal }">
                {{ user.isLocal ? 'Siz' : 'Katılımcı' }}
              </span>
            </div>
            <div v-if="allUsers.length === 0" class="no-users">
              Henüz katılımcı yok
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useStreamQuality } from '../../composables/useStreamQuality.js'
import { watch } from 'vue'
import { useAgoraStore } from '../../store/agora.js'
import { 
  PresentationChartBarIcon,
  TvIcon,
  GlobeAltIcon,
  SignalIcon,
  BoltIcon,
  FilmIcon,
  CubeIcon,
  ClockIcon,
  LinkIcon,
  MicrophoneIcon,
  FolderIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

// Props
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  channelName: { type: String, default: '' },
  isConnected: { type: Boolean, default: false },
  connectedUsersCount: { type: Number, default: 0 },
  canUseCamera: { type: Boolean, default: true },
  canUseMicrophone: { type: Boolean, default: true },
  isLocalVideoOff: { type: Boolean, default: false },
  isLocalAudioMuted: { type: Boolean, default: false },
  allUsers: { type: Array, default: () => [] },
  // Recording props
  isRecording: { type: Boolean, default: false },
  recordingStatus: { type: String, default: 'IDLE' },
  recordingFiles: { type: Array, default: () => [] },
  recordingError: { type: String, default: '' },
  recordingProgress: { type: Number, default: 0 },
  canStartRecording: { type: Boolean, default: true },
  canStopRecording: { type: Boolean, default: false },
  hasRecordingFiles: { type: Boolean, default: false }
})

// Stream Quality Composable
const {
  networkQuality,
  bitrate,
  frameRate,
  packetLoss,
  rtt,
  qualityLevel,
  qualityPercentage,
  qualityColor,
  isMonitoring,
  startMonitoring,
  stopMonitoring
} = useStreamQuality()

// Recording Settings State
const storageProvider = ref('azure')
const recordingPerspective = ref('host')
const recordingQuality = ref('medium')

// Agora Store
const agoraStore = useAgoraStore()

// Emits
const emit = defineEmits([
  'close', 
  'startRecording', 
  'stopRecording', 
  'resetRecording', 
  'downloadRecordingFile', 
  'clearRecordingError',
  'storageProviderChanged',
  'recordingPerspectiveChanged',
  'recordingQualityChanged'
])

// Computed
const recordingStatusClass = computed(() => {
  return {
    'status-idle': props.recordingStatus === 'IDLE',
    'status-starting': props.recordingStatus === 'STARTING',
    'status-recording': props.recordingStatus === 'RECORDING',
    'status-stopping': props.recordingStatus === 'STOPPING',
    'status-error': props.recordingStatus === 'ERROR'
  }
})

// Network Quality Computed
const networkQualityLevel = computed(() => qualityLevel.value)
const networkQualityColor = computed(() => qualityColor.value)
const networkQualityScore = computed(() => networkQuality.value)
const networkQualityPercentage = computed(() => qualityPercentage.value)
const networkBitrate = computed(() => bitrate.value)
const networkFrameRate = computed(() => frameRate.value)
const networkRtt = computed(() => rtt.value)
const networkPacketLoss = computed(() => packetLoss.value)

// Helper functions
const getRecordingStatusText = () => {
  switch (props.recordingStatus) {
    case 'IDLE': return 'Hazır'
    case 'STARTING': return 'Başlatılıyor...'
    case 'RECORDING': return 'Kaydediliyor'
    case 'STOPPING': return 'Durduruluyor...'
    case 'ERROR': return 'Hata!'
    default: return 'Bilinmiyor'
  }
}

// Methods
const handleOverlayClick = () => {
  emit('close')
}

const startRecording = () => {
  emit('startRecording')
}

const stopRecording = () => {
  emit('stopRecording')
}

const resetRecording = () => {
  emit('resetRecording')
}

const downloadRecordingFile = (fileId) => {
  emit('downloadRecordingFile', fileId)
}

const clearRecordingError = () => {
  emit('clearRecordingError')
}

// Recording Settings Handlers
const handleStorageProviderChange = () => {
  // Storage provider değişikliğini parent'a bildir
  emit('storageProviderChanged', storageProvider.value)
}

const handlePerspectiveChange = () => {
  // Recording perspective değişikliğini parent'a bildir
  emit('recordingPerspectiveChanged', recordingPerspective.value)
}

const handleQualityChange = () => {
  // Recording quality değişikliğini parent'a bildir
  emit('recordingQualityChanged', recordingQuality.value)
}

// Start monitoring when modal opens
const startQualityMonitoring = () => {
  if (props.isConnected && !isMonitoring.value) {
    // Agora client'ı store'dan al
    const videoClient = agoraStore.clients.video.client
    if (videoClient) {
      startMonitoring(videoClient)
    }
  }
}

// Stop monitoring when modal closes
const stopQualityMonitoring = () => {
  if (isMonitoring.value) {
    stopMonitoring()
  }
}

// Watch modal open/close to start/stop monitoring
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    startQualityMonitoring()
  } else {
    stopQualityMonitoring()
  }
})

// Watch connection status
watch(() => props.isConnected, (isConnected) => {
  if (isConnected && props.isOpen) {
    startQualityMonitoring()
  } else {
    stopQualityMonitoring()
  }
})
</script>

<style scoped>
/* Modal Overlay */
.info-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

/* Modal */
.info-modal {
  background: var(--rs-agora-surface-primary);
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 20px;
  backdrop-filter: var(--rs-agora-backdrop-blur);
  box-shadow: var(--rs-agora-shadow-secondary);
  width: 95%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease;
  display: flex;
  flex-direction: column;
}

/* Header - Sabit */
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 30px 25px;
  background: var(--rs-agora-gradient-surface);
  border-bottom: 1px solid var(--rs-agora-border-primary);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
  border-radius: 20px 20px 0 0;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: var(--rs-agora-gradient-primary);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rs-agora-white);
  box-shadow: var(--rs-agora-shadow-primary);
}

.header-text h3 {
  margin: 0 0 4px 0;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: var(--rs-agora-gradient-text-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-text p {
  margin: 0;
  color: var(--rs-agora-text-muted);
  font-size: 0.95rem;
  font-weight: 400;
}



.header-icon {
  margin-right: 8px;
  font-size: 24px;
  vertical-align: middle;
}

.header-icon svg {
  width: 20px;
  height: 20px;
  color: currentColor;
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
.info-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  margin-bottom: 0;
}

.info-content::-webkit-scrollbar {
  width: 6px;
}

.info-content::-webkit-scrollbar-track {
  background: var(--rs-agora-transparent-white-05);
  border-radius: 3px;
}

.info-content::-webkit-scrollbar-thumb {
  background: var(--rs-agora-transparent-white-20);
  border-radius: 3px;
}

.info-content::-webkit-scrollbar-thumb:hover {
  background: var(--rs-agora-transparent-white-30);
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 25px;
}

/* Widget Styles */
.info-widget {
  background: var(--rs-agora-gradient-surface);
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
  transition: var(--rs-agora-transition-normal);
  position: relative;
  overflow: hidden;
}

.info-widget::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--rs-agora-gradient-primary);
}

.info-widget:hover {
  transform: translateY(-3px);
  box-shadow: var(--rs-agora-shadow-surface);
  border-color: var(--rs-agora-border-secondary);
}

/* Widget Header */
.widget-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
}

.widget-icon {
  font-size: 24px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rs-agora-gradient-primary);
  border-radius: 12px;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
  color: var(--rs-agora-white);
  box-shadow: var(--rs-agora-shadow-primary);
}

.widget-icon svg {
  width: 24px;
  height: 24px;
  color: currentColor;
}

/* Emoji icon için özel stil */
.widget-icon:not(:has(svg)) {
  font-size: 20px;
  line-height: 1;
}

.widget-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--rs-agora-text-primary);
  text-shadow: 0 2px 4px var(--rs-agora-transparent-black-30);
}

/* Widget Content */
.widget-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Widget Stats */
.widget-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--rs-agora-transparent-white-05);
}

.widget-stat:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: var(--rs-agora-transparent-white-70);
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: var(--rs-agora-text-primary);
  font-weight: 600;
  text-align: right;
}

/* Status Badges */
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.connected {
  background: var(--rs-agora-transparent-success-20);
  color: var(--rs-agora-success);
  border: 1px solid var(--rs-agora-transparent-success-30);
}

.status-badge.disconnected {
  background: var(--rs-agora-transparent-error-20);
  color: var(--rs-agora-error);
  border: 1px solid var(--rs-agora-transparent-error-30);
}

/* Quality Badge */
.quality-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: color-mix(in srgb, var(--quality-color) 20%, transparent);
  color: var(--quality-color);
  border: 1px solid color-mix(in srgb, var(--quality-color) 30%, transparent);
}

/* Quality Overview */
.quality-overview {
  margin-bottom: 20px;
}

.quality-level-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quality-level-text {
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.quality-percentage {
  font-size: 16px;
  font-weight: 600;
  color: var(--rs-agora-text-primary);
  background: var(--rs-agora-transparent-white-10);
  padding: 4px 12px;
  border-radius: 20px;
}

.quality-progress {
  position: relative;
  height: 12px;
  background: var(--rs-agora-transparent-white-10);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px var(--rs-agora-transparent-black-20);
}

.quality-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease, background-color 0.3s ease;
  box-shadow: 0 2px 8px var(--rs-agora-transparent-black-30);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--rs-agora-transparent-white-05);
  border-radius: 12px;
  border: 1px solid var(--rs-agora-transparent-white-08);
  transition: all 0.2s ease;
}

.metric-item:hover {
  background: var(--rs-agora-transparent-white-08);
  border-color: var(--rs-agora-transparent-white-15);
  transform: translateY(-1px);
}

.metric-icon {
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rs-agora-transparent-white-10);
  border-radius: 8px;
  flex-shrink: 0;
}

.metric-icon svg {
  width: 20px;
  height: 20px;
  color: currentColor;
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-label {
  font-size: 11px;
  color: var(--rs-agora-text-secondary);
  font-weight: 500;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 14px;
  color: var(--rs-agora-text-primary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-value.warning {
  color: var(--rs-agora-warning);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Recording Widget Styles */
.recording-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 12px;
  border-radius: 8px;
  background: var(--rs-agora-transparent-white-05);
  border: 1px solid var(--rs-agora-transparent-white-10);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recording-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--rs-agora-error);
  animation: recordingPulse 1.5s infinite;
}

@keyframes recordingPulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.status-text {
  font-weight: 600;
  font-size: 14px;
}

.status-idle .status-text {
  color: var(--rs-agora-text-secondary);
}

.status-starting .status-text {
  color: var(--rs-agora-warning);
}

.status-recording .status-text {
  color: var(--rs-agora-error);
}

.status-stopping .status-text {
  color: var(--rs-agora-warning);
}

.status-error .status-text {
  color: var(--rs-agora-error);
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  margin-left: 20px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--rs-agora-transparent-white-10);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--rs-agora-gradient-error);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--rs-agora-text-secondary);
  min-width: 40px;
}

.recording-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.recording-settings {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--rs-agora-surface-secondary);
  border-radius: 12px;
  border: 1px solid var(--rs-agora-border-secondary);
}

.recording-settings h4 {
  margin: 0 0 16px 0;
  color: var(--rs-agora-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.setting-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.setting-label {
  font-size: 14px;
  color: var(--rs-agora-text-secondary);
  min-width: 140px;
  font-weight: 500;
}

.setting-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 8px;
  background: var(--rs-agora-surface-primary);
  color: var(--rs-agora-text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.setting-select:hover:not(:disabled) {
  border-color: var(--rs-agora-primary);
  background: var(--rs-agora-surface-tertiary);
}

.setting-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.recording-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

/* Emoji icon için özel stil */
.recording-btn:first-child {
  font-size: 12px;
}

.recording-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.start-btn {
  background: var(--rs-agora-success);
  color: var(--rs-agora-white);
}

.start-btn:hover:not(.disabled) {
  background: var(--rs-agora-success-light);
  transform: translateY(-1px);
}

.stop-btn {
  background: var(--rs-agora-error);
  color: var(--rs-agora-white);
}

.stop-btn:hover:not(.disabled) {
  background: var(--rs-agora-error-light);
  transform: translateY(-1px);
}

.reset-btn {
  background: var(--rs-agora-transparent-white-10);
  color: var(--rs-agora-text-primary);
}

.reset-btn:hover {
  background: var(--rs-agora-transparent-white-20);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 16px;
}

.btn-icon svg {
  width: 8px;
  height: 8px;
  color: currentColor;
}

.recording-files {
  margin-top: 20px;
}

.files-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--rs-agora-transparent-white-10);
}

.files-icon {
  font-size: 16px;
}

.files-icon svg {
  width: 14px;
  height: 14px;
  color: currentColor;
}

.files-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--rs-agora-text-primary);
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--rs-agora-transparent-white-05);
  border-radius: 8px;
  border: 1px solid var(--rs-agora-transparent-white-08);
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 600;
  color: var(--rs-agora-text-primary);
  font-size: 14px;
}

.file-size,
.file-duration {
  font-size: 12px;
  color: var(--rs-agora-text-secondary);
}

.download-btn {
  background: var(--rs-agora-primary);
  color: var(--rs-agora-white);
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-btn:hover {
  background: var(--rs-agora-primary-light);
  transform: translateY(-1px);
}

.download-icon {
  width: 12px;
  height: 12px;
  color: currentColor;
}

.recording-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding: 12px;
  background: var(--rs-agora-transparent-error-10);
  border: 1px solid var(--rs-agora-error);
  border-radius: 8px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--rs-agora-error);
  font-size: 14px;
}

.error-icon {
  font-size: 16px;
}

.error-icon svg {
  width: 14px;
  height: 14px;
  color: currentColor;
}

.clear-error-btn {
  background: none;
  border: none;
  color: var(--rs-agora-error);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 16px;
}

.clear-error-btn svg {
  width: 14px;
  height: 14px;
  color: currentColor;
}

.clear-error-btn:hover {
  background: var(--rs-agora-transparent-error-20);
}


/* Device Badges */
.device-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.device-badge.available {
  background: var(--rs-agora-transparent-success-20);
  color: var(--rs-agora-success);
  border: 1px solid var(--rs-agora-transparent-success-30);
}

.device-badge.unavailable {
  background: var(--rs-agora-transparent-error-20);
  color: var(--rs-agora-error);
  border: 1px solid var(--rs-agora-transparent-error-30);
}

.users-section {
  grid-column: 1 / -1;
  margin-bottom: 0;
}

.info-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--rs-agora-white);
  border-bottom: 1px solid var(--rs-agora-transparent-white-05);
  padding-bottom: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
}

.info-label {
  color: var(--rs-agora-text-secondary);
  font-size: 14px;
}

.info-value {
  color: var(--rs-agora-white);
  font-size: 14px;
  font-weight: 500;
}

/* Users List */
.users-list {
  max-height: 200px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--rs-agora-transparent-white-05);
}

.user-item:last-child {
  border-bottom: none;
}

.user-icon {
  font-size: 16px;
}

.user-name {
  color: var(--rs-agora-white);
  font-size: 14px;
  flex: 1;
}

.user-status {
  color: var(--rs-agora-text-secondary);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background: var(--rs-agora-transparent-white-10);
}

.user-status.local {
  color: var(--rs-agora-success);
  background: var(--rs-agora-transparent-success-10);
}

.no-users {
  color: var(--rs-agora-text-secondary);
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
  font-style: italic;
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
  .info-modal {
    width: 95%;
    max-height: 90vh;
    margin: 20px;
  }
  
  .info-header {
    padding: 20px 20px 15px 20px;
  }
  
  .info-content {
    padding: 20px 20px 25px 20px;
  }
  
  .header-content {
    gap: 12px;
  }
  
  .header-icon {
    width: 40px;
    height: 40px;
  }
  
  .header-text h3 {
    font-size: 1.5rem;
  }
  
  .header-text p {
    font-size: 0.85rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .info-widget {
    padding: 20px;
  }
  
  .widget-header {
    margin-bottom: 16px;
    gap: 12px;
  }
  
  .widget-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
  
  .widget-header h4 {
    font-size: 16px;
  }
  
  .widget-content {
    gap: 14px;
  }
  
  .widget-stat {
    padding: 10px 0;
  }
  
  .stat-label, .stat-value {
    font-size: 13px;
  }
  
  /* Quality Overview Responsive */
  .quality-level-text {
    font-size: 16px;
  }
  
  .quality-percentage {
    font-size: 14px;
    padding: 3px 10px;
  }
  
  .quality-progress {
    height: 10px;
  }
  
  /* Metrics Grid Responsive */
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }
  
  .metric-item {
    padding: 10px;
    gap: 10px;
  }
  
  .metric-icon {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
  
  .metric-label {
    font-size: 10px;
  }
  
  .metric-value {
    font-size: 13px;
  }
  
  /* Recording Widget Responsive */
  .recording-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .progress-container {
    margin-left: 0;
    width: 100%;
  }
  
  .recording-controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .recording-btn {
    padding: 6px 10px;
    font-size: 13px;
  }
  
  .btn-icon {
    font-size: 14px;
  }
  
  .btn-icon svg {
    width: 6px;
    height: 6px;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .file-info {
    width: 100%;
  }
  
  .download-btn {
    align-self: stretch;
    text-align: center;
  }
}


</style>
