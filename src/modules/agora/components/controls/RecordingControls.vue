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

    <!-- Recording Settings -->
    <div class="recording-settings">
      <h4>Kayıt Ayarları</h4>
      
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

<script>
import { computed } from 'vue'
import { useRecording } from '../../composables/useRecording.js'
import { fileLogger } from '../../services/fileLogger.js'
import { formatDuration as formatDurationFromUtils, formatFileSize as formatFileSizeFromUtils } from '../../utils/index.js'

export default {
  name: 'RecordingControls',
  
  setup() {
    // Logger fonksiyonları - FileLogger'dan al (tüm seviyeler için)
    const logDebug = (message, data) => fileLogger.log('debug', 'RECORDING', message, data)
    const logInfo = (message, data) => fileLogger.log('info', 'RECORDING', message, data)
    const logWarn = (message, data) => fileLogger.log('warn', 'RECORDING', message, data)
    const logError = (errorOrMessage, context) => {
      if (errorOrMessage instanceof Error) {
        return fileLogger.log('error', 'RECORDING', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
      }
      return fileLogger.log('error', 'RECORDING', errorOrMessage, context)
    }
    const logFatal = (errorOrMessage, context) => {
      if (errorOrMessage instanceof Error) {
        return fileLogger.log('fatal', 'RECORDING', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
      }
      return fileLogger.log('fatal', 'RECORDING', errorOrMessage, context)
    }

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
      resetRecording,
      downloadRecordingFile,
      // Storage provider ve recording ayarları
      storageProvider,
      recordingPerspective,
      recordingQuality,
      setStorageProvider,
      setRecordingPerspective,
      setRecordingQuality
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
        logInfo('Recording başlatma butonu tıklandı')
        await startRecording()
      } catch (error) {
        logError(error, { context: 'startRecording' })
      }
    }

    const handleStopRecording = async () => {
      try {
        logInfo('Recording durdurma butonu tıklandı')
        await stopRecording()
      } catch (error) {
        logError(error, { context: 'stopRecording' })
      }
    }

    const handleResetRecording = () => {
      try {
        logInfo('Recording sıfırlama butonu tıklandı')
        resetRecording()
      } catch (error) {
        logError(error, { context: 'resetRecording' })
      }
    }

    // Storage provider ve recording ayarları handlers
    const handleStorageProviderChange = () => {
      try {
        logInfo(`Storage provider değiştiriliyor: ${storageProvider.value}`)
        setStorageProvider(storageProvider.value)
      } catch (error) {
        logError(error, { context: 'setStorageProvider' })
      }
    }

    const handlePerspectiveChange = () => {
      try {
        logInfo(`Recording perspective değiştiriliyor: ${recordingPerspective.value}`)
        setRecordingPerspective(recordingPerspective.value)
      } catch (error) {
        logError(error, { context: 'setRecordingPerspective' })
      }
    }

    const handleQualityChange = () => {
      try {
        logInfo(`Recording quality değiştiriliyor: ${recordingQuality.value}`)
        setRecordingQuality(recordingQuality.value)
      } catch (error) {
        logError(error, { context: 'setRecordingQuality' })
      }
    }

    const handleDownloadFile = async (fileId) => {
      try {
        logInfo(`Dosya indirme başlatıldı: ${fileId}`)
        await downloadRecordingFile(fileId)
      } catch (error) {
        logError(error, { context: 'downloadFile', fileId })
      }
    }

    const clearError = () => {
      recordingError.value = null
    }

    const formatFileSize = (bytes) => {
      return formatFileSizeFromUtils(bytes)
    }

    const formatDuration = (seconds) => {
      return formatDurationFromUtils(seconds)
    }

    return {
      // State
      isRecording,
      recordingStatus,
      recordingFiles,
      recordingError,
      recordingProgress,
      
      // Computed
      canStartRecording,
      canStopRecording,
      recordingStatusText,
      hasRecordingFiles,
      statusClass,
      
      // Methods
      handleStartRecording,
      handleStopRecording,
      handleResetRecording,
      handleDownloadFile,
      clearError,
      formatFileSize,
      formatDuration
    }
  }
}
</script>

<style scoped>
.recording-controls {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: var(--rs-agora-shadow-sm);
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
  background: var(--rs-agora-error);
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
  background: var(--bg-tertiary);
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
  background: var(--rs-agora-success);
  color: var(--rs-agora-white);
}

.btn-start:hover:not(.disabled) {
  background: var(--rs-agora-success-light);
  transform: translateY(-1px);
}

.btn-stop {
  background: var(--rs-agora-error);
  color: var(--rs-agora-white);
}

.btn-stop:hover:not(.disabled) {
  background: var(--rs-agora-error-light);
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

.recording-settings {
  margin-top: 20px;
  padding: 16px;
  background: var(--bg-primary);
  border-radius: 8px;
  box-shadow: var(--rs-agora-shadow-sm);
}

.recording-settings h4 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
  font-size: 16px;
}

.setting-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 10px;
}

.setting-label {
  font-size: 14px;
  color: var(--text-secondary);
  min-width: 120px;
}

.setting-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.setting-select:hover:not(:disabled) {
  border-color: var(--rs-agora-info);
  background: var(--bg-quaternary);
}

.setting-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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
  background: var(--rs-agora-info);
  color: var(--rs-agora-white);
  padding: 8px 16px;
  font-size: 12px;
}

.btn-download:hover {
  background: var(--rs-agora-info-light);
  transform: translateY(-1px);
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

.btn-clear-error {
  background: none;
  border: none;
  color: var(--rs-agora-error);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.btn-clear-error:hover {
  background: var(--rs-agora-transparent-error-20);
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