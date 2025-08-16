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
import { logger } from '../../services/logger.js'
import { formatDuration as formatDurationFromUtils, formatFileSize as formatFileSizeFromUtils } from '../../utils/index.js'

export default {
  name: 'RecordingControls',
  
  setup() {
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
      downloadRecordingFile
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

    const handleDownloadFile = async (fileId) => {
      try {
        logger.logUI(`Dosya indirme başlatıldı: ${fileId}`, 'RECORDING')
        await downloadRecordingFile(fileId)
      } catch (error) {
        logger.error('RECORDING', 'Dosya indirme hatası:', { error })
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