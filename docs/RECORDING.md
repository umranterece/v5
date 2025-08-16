# 📹 Recording Dokümantasyonu

> Vue 3 Agora Video Conference Module - Cloud recording özellikleri ve kullanımı

## 🎯 **Recording Genel Bakış**

Bu dokümantasyon, projenin cloud recording özelliklerini, konfigürasyonlarını ve kullanım senaryolarını detaylandırır.

## 🚀 **Temel Recording Özellikleri**

### **1. Cloud Recording Setup**

#### **Recording Service Configuration**
```javascript
// Recording service konfigürasyonu
export class RecordingService {
  constructor() {
    this.isRecording = false
    this.recordingId = null
    this.recordingStatus = 'IDLE' // IDLE, STARTING, RECORDING, STOPPING, ERROR
    this.recordingConfig = null
    this.recordingFiles = []
    this.error = null
    this.retryCount = 0
    this.maxRetries = DEV_CONFIG.MAX_RETRY_COUNT
  }
  
  // Recording başlatma
  async startRecording(config = {}) {
    try {
      logger.logUI('Recording başlatılıyor...', 'RECORDING')
      
      this.recordingStatus = 'STARTING'
      this.error = null
      
      const recordingConfig = {
        // Varsayılan ayarlar
        maxIdleTime: 30, // 30 saniye boşluk sonrası otomatik durdurma
        streamTypes: 2, // Audio + Video
        channelType: 1, // Live streaming
        subscribeAudioUids: [], // Tüm audio'ları kaydet
        subscribeVideoUids: [], // Tüm video'ları kaydet
        subscribeUidGroup: 0, // Tüm kullanıcıları kaydet
        
        // Kullanıcı ayarları
        ...config
      }
      
      this.recordingConfig = recordingConfig
      
      // Cloud recording API çağrısı
      const response = await this.callRecordingAPI('start', recordingConfig)
      
      if (response.success) {
        this.isRecording = true
        this.recordingId = response.recordingId
        this.recordingStatus = 'RECORDING'
        this.retryCount = 0
        
        logger.logUI(`Recording başlatıldı! ID: ${this.recordingId}`, 'RECORDING')
        
        return {
          success: true,
          recordingId: this.recordingId,
          message: 'Recording başarıyla başlatıldı'
        }
      } else {
        throw new Error(response.message || 'Recording başlatılamadı')
      }
      
    } catch (error) {
      this.handleRecordingError(error, 'startRecording')
      return {
        success: false,
        error: error.message,
        message: 'Recording başlatılamadı'
      }
    }
  }
}
```

#### **Recording Configuration Options**
```javascript
// Recording konfigürasyon seçenekleri
export const RECORDING_CONFIG = {
  // Stream types
  STREAM_TYPES: {
    AUDIO_ONLY: 1,        // Sadece ses
    VIDEO_ONLY: 2,        // Sadece video
    AUDIO_VIDEO: 3        // Ses + video
  },
  
  // Channel types
  CHANNEL_TYPES: {
    COMMUNICATION: 0,     // Communication mode
    LIVE_STREAMING: 1     // Live streaming mode
  },
  
  // Recording file formats
  FILE_FORMATS: {
    HLS: 'hls',           // HLS format
    MP4: 'mp4',           // MP4 format
    FLV: 'flv'            // FLV format
  },
  
  // Storage options
  STORAGE_OPTIONS: {
    AGORA_CLOUD: 0,       // Agora Cloud Storage
    THIRD_PARTY: 1        // Third-party storage
  }
}

// Default recording config
export const DEFAULT_RECORDING_CONFIG = {
  maxIdleTime: 30,
  streamTypes: RECORDING_CONFIG.STREAM_TYPES.AUDIO_VIDEO,
  channelType: RECORDING_CONFIG.CHANNEL_TYPES.LIVE_STREAMING,
  subscribeAudioUids: [],
  subscribeVideoUids: [],
  subscribeUidGroup: 0,
  
  // File configuration
  recordingFileConfig: {
    avFileType: ['hls', 'mp4'],
    fileCompress: false,
    fileMaxSizeMB: 512
  },
  
  // Storage configuration
  storageConfig: {
    vendor: RECORDING_CONFIG.STORAGE_OPTIONS.AGORA_CLOUD,
    region: 0, // Global
    bucket: 'agora-recording-bucket',
    accessKey: '',
    secretKey: ''
  }
}
```

### **2. Recording Controls**

#### **Recording Start/Stop Controls**
```javascript
// Recording kontrol composable
export function useRecording() {
  // Reactive state
  const isRecording = ref(false)
  const recordingStatus = ref('IDLE')
  const recordingId = ref(null)
  const recordingFiles = ref([])
  const recordingError = ref(null)
  const recordingProgress = ref(0)
  const recordingDuration = ref(0)
  const recordingStartTime = ref(null)
  
  // Recording konfigürasyonu
  const recordingConfig = ref({
    ...DEFAULT_RECORDING_CONFIG
  })
  
  // Computed properties
  const canStartRecording = computed(() => {
    return !isRecording.value && recordingStatus.value === 'IDLE'
  })
  
  const canStopRecording = computed(() => {
    return isRecording.value && recordingStatus.value === 'RECORDING'
  })
  
  const recordingTime = computed(() => {
    if (!recordingStartTime.value) return '00:00'
    
    const elapsed = Date.now() - recordingStartTime.value
    const minutes = Math.floor(elapsed / 60000)
    const seconds = Math.floor((elapsed % 60000) / 1000)
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })
  
  const recordingStatusText = computed(() => {
    switch (recordingStatus.value) {
      case 'IDLE': return 'Hazır'
      case 'STARTING': return 'Başlatılıyor...'
      case 'RECORDING': return `Kaydediliyor (${recordingTime.value})`
      case 'STOPPING': return 'Durduruluyor...'
      case 'ERROR': return 'Hata!'
      default: return 'Bilinmiyor'
    }
  })
  
  const hasRecordingFiles = computed(() => {
    return recordingFiles.value.length > 0
  })
  
  // Recording işlemleri
  const startRecording = async (config = {}) => {
    try {
      logger.logUI('Recording başlatma isteği gönderildi', 'RECORDING')
      
      // Konfigürasyonu güncelle
      const finalConfig = {
        ...recordingConfig.value,
        ...config
      }
      
      const result = await recordingService.startRecording(finalConfig)
      
      if (result.success) {
        isRecording.value = true
        recordingId.value = result.recordingId
        recordingStatus.value = 'RECORDING'
        recordingStartTime.value = Date.now()
        recordingError.value = null
        
        // Event emit
        centralEmitter.emit(RECORDING_EVENTS.RECORDING_STARTED, {
          recordingId: result.recordingId,
          config: finalConfig
        })
        
        logger.logUI('Recording başlatıldı', { recordingId: result.recordingId })
      } else {
        throw new Error(result.message || 'Recording başlatılamadı')
      }
      
    } catch (error) {
      logger.error('RECORDING', 'Recording başlatma hatası:', { error })
      recordingError.value = error.message
      recordingStatus.value = 'ERROR'
      
      // Event emit
      centralEmitter.emit(RECORDING_EVENTS.RECORDING_ERROR, { error })
      
      throw error
    }
  }
  
  const stopRecording = async () => {
    try {
      if (!isRecording.value) {
        throw new Error('Recording zaten durdurulmuş')
      }
      
      logger.logUI('Recording durdurma isteği gönderildi', 'RECORDING')
      recordingStatus.value = 'STOPPING'
      
      const result = await recordingService.stopRecording()
      
      if (result.success) {
        isRecording.value = false
        recordingStatus.value = 'IDLE'
        recordingFiles.value = result.files || []
        
        // Event emit
        centralEmitter.emit(RECORDING_EVENTS.RECORDING_STOPPED, {
          files: recordingFiles.value
        })
        
        logger.logUI('Recording durduruldu', { files: recordingFiles.value })
      } else {
        throw new Error(result.message || 'Recording durdurulamadı')
      }
      
    } catch (error) {
      logger.error('RECORDING', 'Recording durdurma hatası:', { error })
      recordingError.value = error.message
      recordingStatus.value = 'ERROR'
      
      // Event emit
      centralEmitter.emit(RECORDING_EVENTS.RECORDING_ERROR, { error })
      
      throw error
    }
  }
  
  const resetRecording = () => {
    isRecording.value = false
    recordingStatus.value = 'IDLE'
    recordingId.value = null
    recordingFiles.value = []
    recordingError.value = null
    recordingProgress.value = 0
    recordingDuration.value = 0
    recordingStartTime.value = null
    
    logger.logUI('Recording state sıfırlandı', 'RECORDING')
  }
  
  return {
    // State
    isRecording: readonly(isRecording),
    recordingStatus: readonly(recordingStatus),
    recordingId: readonly(recordingId),
    recordingFiles: readonly(recordingFiles),
    recordingError: readonly(recordingError),
    recordingProgress: readonly(recordingProgress),
    recordingDuration: readonly(recordingDuration),
    
    // Computed
    canStartRecording,
    canStopRecording,
    recordingTime,
    recordingStatusText,
    hasRecordingFiles,
    
    // Methods
    startRecording,
    stopRecording,
    resetRecording
  }
}
```

## 🎨 **Recording UI Components**

### **1. Recording Controls Component**

#### **Main Recording Controls**
```vue
<template>
  <div class="recording-controls">
    <!-- Recording Durumu -->
    <div class="recording-status" :class="statusClass">
      <div class="status-indicator">
        <div class="recording-dot" v-if="isRecording"></div>
        <span class="status-text">{{ recordingStatusText }}</span>
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

    <!-- Recording Buttons -->
    <div class="recording-buttons">
      <!-- Start Recording -->
      <button 
        @click="handleStartRecording"
        :disabled="!canStartRecording"
        class="btn btn-record btn-start"
        :class="{ disabled: !canStartRecording }"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <span>Kayıt Başlat</span>
      </button>

      <!-- Stop Recording -->
      <button 
        @click="handleStopRecording"
        :disabled="!canStopRecording"
        class="btn btn-record btn-stop"
        :class="{ disabled: !canStopRecording }"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12"/>
        </svg>
        <span>Kayıt Durdur</span>
      </button>

      <!-- Reset Recording -->
      <button 
        @click="handleResetRecording"
        class="btn btn-record btn-reset"
        v-if="hasRecordingFiles"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
        </svg>
        <span>Sıfırla</span>
      </button>
    </div>

    <!-- Error Display -->
    <div class="recording-error" v-if="recordingError">
      <div class="error-message">
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <span>{{ recordingError }}</span>
      </div>
      <button @click="clearError" class="btn btn-clear-error">
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRecording } from '../composables/useRecording.js'
import { logger } from '../services/logger.js'
import { formatDuration as formatDurationFromUtils, formatFileSize as formatFileSizeFromUtils } from '../utils/index.js'

const {
  isRecording,
  recordingStatus,
  recordingFiles,
  recordingError,
  recordingProgress,
  canStartRecording,
  canStopRecording,
  recordingStatusText,
  hasRecordingFiles,
  startRecording,
  stopRecording,
  resetRecording
} = useRecording()

// Computed
const statusClass = computed(() => {
  return {
    'status-idle': recordingStatus.value === 'IDLE',
    'status-starting': recordingStatus.value === 'STARTING',
    'status-recording': recordingStatus.value === 'RECORDING',
    'status-stopping': recordingStatus.value === 'STOPPING',
    'status-error': recordingStatus.value === 'ERROR'
  }
})

// Methods
const handleStartRecording = async () => {
  try {
    logger.logUI('Recording başlatma butonu tıklandı', 'RECORDING')
    await startRecording()
  } catch (error) {
    logger.error('RECORDING', 'Recording başlatma hatası:', { error })
  }
}

const handleStopRecording = async () => {
  try {
    logger.logUI('Recording durdurma butonu tıklandı', 'RECORDING')
    await stopRecording()
  } catch (error) {
    logger.error('RECORDING', 'Recording durdurma hatası:', { error })
  }
}

const handleResetRecording = () => {
  try {
    logger.logUI('Recording sıfırlama butonu tıklandı', 'RECORDING')
    resetRecording()
  } catch (error) {
    logger.error('RECORDING', 'Recording sıfırlama hatası:', { error })
  }
}

const clearError = () => {
  recordingError.value = null
}
</script>

<style scoped>
.recording-controls {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.recording-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 12px;
  border-radius: 8px;
  background: var(--bg-primary);
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
  background: #ff4444;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.status-text {
  font-weight: 600;
  font-size: 14px;
}

.status-idle .status-text {
  color: var(--text-secondary);
}

.status-starting .status-text {
  color: #ffa726;
}

.status-recording .status-text {
  color: #ff4444;
}

.status-stopping .status-text {
  color: #ffa726;
}

.status-error .status-text {
  color: #f44336;
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
  background: var(--bg-tertiary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff4444, #ff6b6b);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 40px;
}

.recording-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-record {
  flex: 1;
  justify-content: center;
}

.btn-start {
  background: #4caf50;
  color: white;
}

.btn-start:hover:not(.disabled) {
  background: #45a049;
  transform: translateY(-1px);
}

.btn-stop {
  background: #f44336;
  color: white;
}

.btn-stop:hover:not(.disabled) {
  background: #da190b;
  transform: translateY(-1px);
}

.btn-reset {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-reset:hover {
  background: var(--bg-quaternary);
  transform: translateY(-1px);
}

.btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.icon {
  width: 16px;
  height: 16px;
}

.recording-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding: 12px;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c62828;
  font-size: 14px;
}

.btn-clear-error {
  background: none;
  border: none;
  color: #c62828;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.btn-clear-error:hover {
  background: rgba(198, 40, 40, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .recording-controls {
    padding: 16px;
  }
  
  .recording-buttons {
    flex-direction: column;
  }
  
  .progress-container {
    margin-left: 12px;
  }
}
</style>
```

### **2. Recording Files Component**

#### **Recording Files Display**
```vue
<template>
  <div class="recording-files" v-if="hasRecordingFiles">
    <h4>Kayıt Dosyaları</h4>
    <div class="files-list">
      <div 
        v-for="file in recordingFiles" 
        :key="file.fileId"
        class="file-item"
      >
        <div class="file-info">
          <span class="file-name">{{ file.fileName }}</span>
          <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
          <span class="file-duration">{{ formatDuration(file.duration) }}</span>
        </div>
        <div class="file-actions">
          <button 
            @click="handleDownloadFile(file.fileId)"
            class="btn btn-download"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
            İndir
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRecording } from '../composables/useRecording.js'
import { formatDuration, formatFileSize } from '../utils/index.js'

const {
  recordingFiles,
  hasRecordingFiles
} = useRecording()

// Methods
const handleDownloadFile = async (fileId) => {
  try {
    // Download işlemi
    console.log('Downloading file:', fileId)
  } catch (error) {
    console.error('Download failed:', error)
  }
}
</script>

<style scoped>
.recording-files {
  margin-top: 20px;
}

.recording-files h4 {
  margin: 0 0 12px 0;
  color: var(--text-primary);
  font-size: 16px;
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
  padding: 12px;
  background: var(--bg-primary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.file-size,
.file-duration {
  font-size: 12px;
  color: var(--text-secondary);
}

.file-actions {
  display: flex;
  gap: 8px;
}

.btn-download {
  background: #2196f3;
  color: white;
  padding: 8px 16px;
  font-size: 12px;
}

.btn-download:hover {
  background: #1976d2;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .file-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
```

## ⚙️ **Recording Configuration**

### **1. Advanced Recording Settings**

#### **Recording Settings Component**
```vue
<template>
  <div class="recording-settings">
    <h3>Kayıt Ayarları</h3>
    
    <!-- Stream Type Selection -->
    <div class="setting-group">
      <label for="streamType">Stream Tipi:</label>
      <select id="streamType" v-model="settings.streamTypes">
        <option :value="1">Sadece Ses</option>
        <option :value="2">Sadece Video</option>
        <option :value="3">Ses + Video</option>
      </select>
    </div>
    
    <!-- File Format Selection -->
    <div class="setting-group">
      <label for="fileFormat">Dosya Formatı:</label>
      <select id="fileFormat" v-model="settings.fileFormat">
        <option value="hls">HLS</option>
        <option value="mp4">MP4</option>
        <option value="flv">FLV</option>
      </select>
    </div>
    
    <!-- Max Idle Time -->
    <div class="setting-group">
      <label for="maxIdleTime">Maksimum Boşluk Süresi (saniye):</label>
      <input 
        id="maxIdleTime" 
        type="number" 
        v-model="settings.maxIdleTime"
        min="10"
        max="300"
      />
    </div>
    
    <!-- File Max Size -->
    <div class="setting-group">
      <label for="fileMaxSize">Maksimum Dosya Boyutu (MB):</label>
      <input 
        id="fileMaxSize" 
        type="number" 
        v-model="settings.fileMaxSize"
        min="100"
        max="2048"
      />
    </div>
    
    <!-- Apply Settings -->
    <button @click="applySettings" class="btn btn-apply">
      Ayarları Uygula
    </button>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { DEFAULT_RECORDING_CONFIG } from '../constants.js'

const emit = defineEmits(['settings-changed'])

// Settings state
const settings = reactive({
  streamTypes: DEFAULT_RECORDING_CONFIG.streamTypes,
  fileFormat: DEFAULT_RECORDING_CONFIG.recordingFileConfig.avFileType[0],
  maxIdleTime: DEFAULT_RECORDING_CONFIG.maxIdleTime,
  fileMaxSize: DEFAULT_RECORDING_CONFIG.recordingFileConfig.fileMaxSizeMB
})

// Methods
const applySettings = () => {
  const updatedConfig = {
    streamTypes: settings.streamTypes,
    maxIdleTime: settings.maxIdleTime,
    recordingFileConfig: {
      avFileType: [settings.fileFormat],
      fileMaxSizeMB: settings.fileMaxSize
    }
  }
  
  emit('settings-changed', updatedConfig)
}
</script>

<style scoped>
.recording-settings {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
}

.recording-settings h3 {
  margin: 0 0 20px 0;
  color: var(--text-primary);
  font-size: 18px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.setting-group label {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 14px;
}

.setting-group select,
.setting-group input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: white;
  font-size: 14px;
}

.btn-apply {
  background: #4caf50;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-apply:hover {
  background: #45a049;
}
</style>
```

### **2. Recording Quality Presets**

#### **Quality Preset Management**
```javascript
// Recording kalite preset'leri
export const RECORDING_QUALITY_PRESETS = {
  LOW: {
    name: 'Düşük Kalite',
    description: 'Hızlı başlatma, düşük dosya boyutu',
    config: {
      streamTypes: 3, // Audio + Video
      recordingFileConfig: {
        avFileType: ['mp4'],
        fileCompress: true,
        fileMaxSizeMB: 256
      }
    }
  },
  
  MEDIUM: {
    name: 'Orta Kalite',
    description: 'Dengeli kalite ve performans',
    config: {
      streamTypes: 3, // Audio + Video
      recordingFileConfig: {
        avFileType: ['mp4', 'hls'],
        fileCompress: false,
        fileMaxSizeMB: 512
      }
    }
  },
  
  HIGH: {
    name: 'Yüksek Kalite',
    description: 'En iyi kalite, yüksek dosya boyutu',
    config: {
      streamTypes: 3, // Audio + Video
      recordingFileConfig: {
        avFileType: ['mp4', 'hls'],
        fileCompress: false,
        fileMaxSizeMB: 1024
      }
    }
  }
}

// Quality preset seçici
const selectRecordingQuality = (presetName) => {
  const preset = RECORDING_QUALITY_PRESETS[presetName]
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`)
  }
  
  return {
    ...DEFAULT_RECORDING_CONFIG,
    ...preset.config
  }
}
```

## 📊 **Recording Analytics**

### **1. Usage Tracking**

#### **Recording Event Tracking**
```javascript
// Recording event tracking
const trackRecordingEvents = () => {
  // Start event
  centralEmitter.on(RECORDING_EVENTS.RECORDING_STARTED, (data) => {
    analyticsService.track('recording_started', {
      timestamp: new Date().toISOString(),
      recordingId: data.recordingId,
      config: data.config,
      sessionId: generateSessionId()
    })
  })
  
  // Stop event
  centralEmitter.on(RECORDING_EVENTS.RECORDING_STOPPED, (data) => {
    analyticsService.track('recording_stopped', {
      timestamp: new Date().toISOString(),
      files: data.files,
      sessionId: generateSessionId()
    })
  })
  
  // Error event
  centralEmitter.on(RECORDING_EVENTS.RECORDING_ERROR, (data) => {
    analyticsService.track('recording_error', {
      timestamp: new Date().toISOString(),
      error: data.error,
      sessionId: generateSessionId()
    })
  })
}
```

### **2. Performance Metrics**

#### **Recording Performance Tracking**
```javascript
// Recording performance tracking
const trackRecordingPerformance = async () => {
  try {
    const recordingStats = await recordingService.getRecordingStats()
    
    const metrics = {
      duration: recordingStats.duration || 0,
      fileSize: recordingStats.fileSize || 0,
      quality: recordingStats.quality || 'unknown',
      timestamp: new Date().toISOString(),
      sessionId: generateSessionId()
    }
    
    // Analytics service'e gönder
    analyticsService.track('recording_performance', metrics)
    
    // Local logging
    logInfo('Recording performance tracked', metrics)
    
  } catch (error) {
    logError(error, { context: 'trackRecordingPerformance' })
  }
}
```

## 🔒 **Recording Security**

### **1. Access Control**

#### **Recording Permission Management**
```javascript
// Recording izin yönetimi
class RecordingPermissionManager {
  constructor() {
    this.permissions = new Map()
    this.defaultPermissions = {
      canStartRecording: false,
      canStopRecording: false,
      canDownloadFiles: false,
      canDeleteFiles: false
    }
  }
  
  // Kullanıcı izinlerini ayarla
  setUserPermissions(userId, permissions) {
    this.permissions.set(userId, {
      ...this.defaultPermissions,
      ...permissions
    })
  }
  
  // Kullanıcı izinlerini kontrol et
  checkPermission(userId, permission) {
    const userPermissions = this.permissions.get(userId)
    if (!userPermissions) {
      return false
    }
    
    return userPermissions[permission] || false
  }
  
  // Recording başlatma izni
  canUserStartRecording(userId) {
    return this.checkPermission(userId, 'canStartRecording')
  }
  
  // Recording durdurma izni
  canUserStopRecording(userId) {
    return this.checkPermission(userId, 'canStopRecording')
  }
  
  // Dosya indirme izni
  canUserDownloadFiles(userId) {
    return this.checkPermission(userId, 'canDownloadFiles')
  }
  
  // Dosya silme izni
  canUserDeleteFiles(userId) {
    return this.checkPermission(userId, 'canDeleteFiles')
  }
}

export const recordingPermissionManager = new RecordingPermissionManager()
```

### **2. File Security**

#### **Secure File Access**
```javascript
// Güvenli dosya erişimi
const secureFileAccess = (fileId, userId) => {
  try {
    // Kullanıcı izinlerini kontrol et
    if (!recordingPermissionManager.canUserDownloadFiles(userId)) {
      throw new Error('Dosya indirme izni yok')
    }
    
    // Dosya erişim log'u
    logger.logUI('Secure file access requested', {
      fileId,
      userId,
      timestamp: new Date().toISOString()
    })
    
    // Güvenli download URL'i oluştur
    const secureUrl = generateSecureDownloadUrl(fileId, userId)
    
    return { success: true, url: secureUrl }
    
  } catch (error) {
    logger.error('RECORDING', 'Secure file access failed:', { error, fileId, userId })
    return { success: false, error: error.message }
  }
}

// Güvenli download URL'i oluştur
const generateSecureDownloadUrl = (fileId, userId) => {
  const token = generateSecureToken(fileId, userId)
  const expires = Date.now() + (5 * 60 * 1000) // 5 dakika geçerli
  
  return `${API_ENDPOINTS.RECORDING}/download/${fileId}?token=${token}&expires=${expires}`
}
```

---

> **💡 İpucu**: Bu recording dokümantasyonu ile tüm cloud recording özelliklerini detaylı olarak öğrenebilirsiniz.

