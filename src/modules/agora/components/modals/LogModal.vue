<template>
  <div class="log-modal-overlay" @click="closeModal" v-if="isVisible">
    <div class="log-modal" @click.stop>
      <!-- Header -->
      <div class="log-modal-header">
        <div class="header-content">
          <div class="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="header-text">
            <h2>Sistem Logları</h2>
          </div>
        </div>
        <div class="header-actions">
          <button @click="toggleFiles" class="btn-toggle" :class="{ active: showFiles }" title="Dosya Paneli">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button @click="toggleFilters" class="btn-toggle" :class="{ active: showFilters }" title="Filtreler">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M7 12H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M10 18H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          <button @click="refreshLogs" class="btn-refresh" title="Logları Yenile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4V10H7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button @click="closeModal" class="btn-close" title="Kapat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="log-stats-bar">
        <div class="stat-item">
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ logStats.totalFiles }}</span>
            <span class="stat-label">Toplam Dosya</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ logStats.totalLogs }}</span>
            <span class="stat-label">Toplam Log</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ logStats.totalSize }}</span>
            <span class="stat-label">Toplam Boyut</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ formatDate(logStats.oldestFile) }}</span>
            <span class="stat-label">En Eski</span>
          </div>
        </div>
      </div>

      <!-- Filters (collapsible, simplified) -->
      <div class="log-filters" v-show="showFilters">
        <div class="filter-group" style="flex:1;min-width:240px;">
          <label>🔍 Arama</label>
          <input 
            type="text" 
            v-model="filters.search" 
            placeholder="Mesaj veya veri içinde ara..."
            class="search-input"
            @input="applyFilters"
          >
        </div>
        <div class="filter-group">
          <label>📊 Seviye</label>
          <select v-model="filters.level" @change="applyFilters" class="level-select">
            <option value="">Tümü</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div class="filter-group">
          <label>🏷️ Kategori</label>
          <select v-model="filters.category" @change="applyFilters" class="category-select">
            <option value="">Tümü</option>
            <option value="agora">Agora</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="screen">Screen</option>
            <option value="network">Network</option>
            <option value="permissions">Permissions</option>
            <option value="ui">UI</option>
            <option value="store">Store</option>
            <option value="device">Device</option>
            <option value="system">System</option>
          </select>
        </div>
        <div class="filter-group" style="min-width:220px;">
          <details>
            <summary>📅 Gelişmiş Tarih Filtresi</summary>
            <div style="display:flex;gap:8px;margin-top:8px;align-items:center;">
              <input type="date" v-model="filters.startDate" class="date-input" @change="applyFilters"/>
              <span>-</span>
              <input type="date" v-model="filters.endDate" class="date-input" @change="applyFilters"/>
            </div>
          </details>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="log-actions">
        <button @click="downloadCurrentLogs" class="btn-download" :disabled="!filteredLogs.length">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>JSON İndir</span>
        </button>
        <button @click="clearAllLogs" class="btn-clear">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="3,6 5,6 21,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M19,6V20C19,20.5304 18.7893,21.0391 18.4142,21.4142C18.0391,21.7893 17.5304,22 17,22H7C6.46957,22 5.96086,21.7893 5.58579,21.4142C5.21071,21.0391 5,20.5304 5,20V6M8,6V4C8,3.46957 8.21071,2.96086 8.58579,2.58579C8.96086,2.21071 9.46957,2 10,2H14C14.5304,2 15.0391,2.21071 15.4142,2.58579C15.7893,2.96086 16,3.46957 16,4V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Tümünü Temizle</span>
        </button>
        <button @click="exportLogsToFile" class="btn-export" :disabled="!filteredLogs.length">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="17,8 12,3 7,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Dışa Aktar</span>
        </button>
      </div>

      <!-- Main Content Area -->
      <div class="main-content">
        <!-- Log Files List -->
        <div class="log-files-section" v-show="showFiles">
          <h3>📁 Log Dosyaları</h3>
          <div class="log-files-list">
            <div 
              v-for="file in logFiles" 
              :key="file.fileName"
              class="log-file-item"
              :class="{ active: selectedFile === file.fileName }"
              @click="selectFile(file.fileName)"
            >
              <div class="file-info">
                <span class="file-name">{{ formatFileName(file.fileName) }}</span>
                <span class="file-stats">
                  {{ file.logCount }} log • {{ formatFileSize(file.fileSize) }}
                </span>
              </div>
              <div class="file-actions">
                <button @click.stop="downloadFile(file.fileName)" class="btn-download-small" title="İndir">
                  💾
                </button>
                <button @click.stop="deleteFile(file.fileName)" class="btn-delete-small" title="Sil">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Logs Display -->
        <div class="logs-display-section">
          <div class="logs-header">
            <h3>📝 Loglar ({{ filteredLogs.length }})</h3>
            <div class="logs-controls">
              <button @click="toggleAutoScroll" class="btn-toggle-scroll" :class="{ active: autoScroll }">
                {{ autoScroll ? '⏸️' : '▶️' }} Otomatik Kaydır
              </button>
              <button @click="clearFilters" class="btn-clear-filters">
                🧹 Filtreleri Temizle
              </button>
            </div>
          </div>
          
          <div class="logs-container" ref="logsContainer">
            <div 
              v-for="log in filteredLogs" 
              :key="log.id"
              class="log-entry"
              :class="`log-${log.level}`"
            >
              <div class="log-header">
                <span class="log-timestamp">{{ formatLogTime(log.timestamp) }}</span>
                <span class="log-level" :class="`level-${log.level}`">
                  {{ log.level.toUpperCase() }}
                </span>
                <span class="log-category">{{ log.category }}</span>
                <span class="log-session">{{ log.sessionId.slice(0, 8) }}</span>
              </div>
              <div class="log-message">{{ log.message }}</div>
              <div v-if="Object.keys(log.data).length > 0" class="log-data">
                <details>
                  <summary>📊 Veri Detayları</summary>
                  <pre>{{ JSON.stringify(log.data, null, 2) }}</pre>
                </details>
              </div>
            </div>
            
            <div v-if="filteredLogs.length === 0" class="no-logs">
              <p>🔍 Filtrelere uygun log bulunamadı</p>
              <p>Filtreleri değiştirmeyi veya tarih aralığını genişletmeyi deneyin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useFileLogger } from '../../composables/useFileLogger.js'

export default {
  name: 'LogModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    // FileLogger composable'ını kullan
    const {
      logs,
      logFiles,
      logStats,
      isLoading,
      selectedFile,
      filters,
      filteredLogs,
      hasActiveFilters,
      refreshLogs,
      applyFilters,
      selectFile,
      downloadFile,
      deleteFile,
      downloadCurrentLogs,
      exportLogsToCSV,
      clearAllLogs,
      clearFilters
    } = useFileLogger()

    // Local state
    const logsContainer = ref(null)
    const autoScroll = ref(true)
    const showFilters = ref(false)
    const showFiles = ref(true)

    // Methods
    const closeModal = () => {
      emit('close')
    }

    const exportLogsToFile = () => {
      exportLogsToCSV()
    }

    const toggleAutoScroll = () => {
      autoScroll.value = !autoScroll.value
      if (autoScroll.value) {
        nextTick(() => scrollToBottom())
      }
    }

    const toggleFilters = () => {
      showFilters.value = !showFilters.value
    }

    const toggleFiles = () => {
      showFiles.value = !showFiles.value
    }

    const scrollToBottom = () => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
      }
    }

    // Utility methods
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A'
      try {
        const date = dateString.replace('agora-logs-', '').replace('.json', '')
        return new Date(date).toLocaleDateString('tr-TR')
      } catch {
        return dateString
      }
    }

    const formatFileName = (fileName) => {
      try {
        const date = fileName.replace('agora-logs-', '').replace('.json', '')
        return new Date(date).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch {
        return fileName
      }
    }

    const formatFileSize = (size) => {
      if (!size) return '0 B'
      const kb = size / 1024
      if (kb < 1024) {
        return `${kb.toFixed(1)} KB`
      }
      const mb = kb / 1024
      return `${mb.toFixed(1)} MB`
    }

    const formatLogTime = (timestamp) => {
      try {
        return new Date(timestamp).toLocaleString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } catch {
        return timestamp
      }
    }

    // Lifecycle
    onMounted(() => {
      refreshLogs()
    })

    // Watchers
    watch(() => props.isVisible, (newVal) => {
      if (newVal) {
        refreshLogs()
      }
    })

    return {
      // Refs
      logsContainer,
      autoScroll,
      showFilters,
      showFiles,
      
      // State from useFileLogger
      logs,
      logFiles,
      logStats,
      isLoading,
      selectedFile,
      filters,
      filteredLogs,
      hasActiveFilters,
      
      // Methods
      closeModal,
      refreshLogs,
      applyFilters,
      selectFile,
      downloadFile,
      deleteFile,
      downloadCurrentLogs,
      exportLogsToFile,
      clearAllLogs,
      clearFilters,
      toggleAutoScroll,
      toggleFilters,
      toggleFiles,
      
      // Utility methods
      formatDate,
      formatFileName,
      formatFileSize,
      formatLogTime
    }
  }
}
</script>

<style scoped>
.log-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--rs-agora-transparent-black-30);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 0; /* tam ekran için padding yok */
  backdrop-filter: var(--rs-agora-backdrop-blur);
  animation: fadeIn 0.3s ease-out;
}

.log-modal {
  background: var(--rs-agora-bg-primary);
  border-radius: 0; /* tam ekran için köşeleri düz */
  max-width: 100vw; /* tam genişlik */
  width: 100vw; /* tam genişlik */
  max-height: 100vh; /* tam yükseklik */
  height: 100vh; /* tam yükseklik */
  overflow-y: auto; /* içerik taştığında scroll */
  display: flex;
  flex-direction: column;
  box-shadow: none; /* tam ekran için gölge yok */
  border: none; /* tam ekran için border yok */
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.log-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 30px 25px;
  background: var(--rs-agora-bg-secondary);
  border-bottom: 1px solid var(--rs-agora-border-primary);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
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

.header-text h2 {
  margin: 0 0 4px 0;
  color: var(--rs-agora-text-primary);
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

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-toggle {
  width: 44px;
  height: 44px;
  background: var(--rs-agora-transparent-white-08);
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 12px;
  color: var(--rs-agora-text-secondary);
  cursor: pointer;
  transition: var(--rs-agora-transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.btn-toggle:hover {
  background: var(--rs-agora-transparent-white-15);
  border-color: var(--rs-agora-border-secondary);
  transform: translateY(-2px);
  box-shadow: var(--rs-agora-shadow-surface);
}

.btn-toggle.active {
  background: var(--rs-agora-gradient-primary);
  border-color: transparent;
  color: var(--rs-agora-white);
  box-shadow: var(--rs-agora-shadow-primary);
}

.btn-refresh, .btn-close {
  width: 44px;
  height: 44px;
  background: var(--rs-agora-transparent-white-08);
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 12px;
  color: var(--rs-agora-text-secondary);
  cursor: pointer;
  transition: var(--rs-agora-transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.btn-refresh:hover, .btn-close:hover {
  background: var(--rs-agora-transparent-white-15);
  border-color: var(--rs-agora-border-secondary);
  transform: translateY(-2px);
  box-shadow: var(--rs-agora-shadow-surface);
}

.btn-refresh:active, .btn-close:active {
  transform: translateY(0);
}

.log-stats-bar {
  display: flex;
  gap: 24px;
  padding: 25px 30px;
  background: var(--rs-agora-bg-tertiary);
  border-bottom: 1px solid var(--rs-agora-border-secondary);
  flex-wrap: wrap;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--rs-agora-transparent-white-05);
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 16px;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
  transition: var(--rs-agora-transition-normal);
  min-width: 160px;
}

.stat-item:hover {
  background: var(--rs-agora-transparent-white-08);
  border-color: var(--rs-agora-border-secondary);
  transform: translateY(-2px);
  box-shadow: var(--rs-agora-shadow-surface);
}

.stat-icon {
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

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-weight: 700;
  color: var(--rs-agora-text-primary);
  font-size: 1.25rem;
  line-height: 1;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--rs-agora-text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-filters {
  display: flex;
  gap: 20px;
  padding: 25px 30px;
  background: var(--rs-agora-bg-tertiary);
  border-bottom: 1px solid var(--rs-agora-border-secondary);
  flex-wrap: wrap;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
}

.filter-group label {
  font-size: 0.85rem;
  color: var(--rs-agora-text-secondary);
  font-weight: 500;
  letter-spacing: 0.3px;
}

.date-input, .search-input, .level-select, .category-select {
  padding: 12px 16px;
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 10px;
  background: var(--rs-agora-transparent-white-05);
  color: var(--rs-agora-text-primary);
  font-size: 0.9rem;
  transition: var(--rs-agora-transition-normal);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.date-input:focus, .search-input:focus, .level-select:focus, .category-select:focus {
  outline: none;
  border-color: var(--rs-agora-primary);
  background: var(--rs-agora-transparent-white-08);
  box-shadow: 0 0 0 3px var(--rs-agora-transparent-white-10);
}

.log-actions {
  display: flex;
  gap: 16px;
  padding: 25px 30px;
  background: var(--rs-agora-bg-tertiary);
  border-bottom: 1px solid var(--rs-agora-border-secondary);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.btn-download, .btn-clear, .btn-export {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: var(--rs-agora-transition-normal);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
  min-width: 140px;
  justify-content: center;
}

.btn-download {
  background: var(--rs-agora-gradient-accent);
  color: var(--rs-agora-white);
  box-shadow: var(--rs-agora-shadow-accent);
}

.btn-download:hover:not(:disabled) {
  background: var(--rs-agora-gradient-accent);
  transform: translateY(-2px);
  box-shadow: var(--rs-agora-shadow-accent);
}

.btn-clear {
  background: var(--rs-agora-gradient-error);
  color: var(--rs-agora-white);
  box-shadow: var(--rs-agora-shadow-error);
}

.btn-clear:hover {
  background: var(--rs-agora-gradient-error);
  transform: translateY(-2px);
  box-shadow: var(--rs-agora-shadow-error);
}

.btn-export {
  background: var(--rs-agora-gradient-info);
  color: var(--rs-agora-white);
  box-shadow: var(--rs-agora-shadow-info);
}

.btn-export:hover:not(:disabled) {
  background: var(--rs-agora-gradient-info);
  transform: translateY(-2px);
  box-shadow: var(--rs-agora-shadow-info);
}

.btn-download:disabled, .btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-download:active, .btn-clear:active, .btn-export:active {
  transform: translateY(0);
}

.main-content {
  display: flex;
  flex: 1;
  gap: 24px;
  padding: 0 30px 30px;
  min-height: 0; /* allow child flex to shrink */
}

.log-files-section {
  width: 320px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
}

.logs-display-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.log-files-section h3, .logs-display-section h3 {
  margin: 0 0 20px 0;
  color: #ffffff;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: -0.3px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-files-section h3::before {
  content: '';
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.log-files-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 16px;
  background: var(--rs-agora-surface-tertiary);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
  padding: 8px;
}

.log-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  margin-bottom: 8px;
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 12px;
  cursor: pointer;
  transition: var(--rs-agora-transition-normal);
  background: var(--rs-agora-surface-tertiary);
}

.log-file-item:hover {
  background: var(--rs-agora-transparent-white-08);
  border-color: var(--rs-agora-border-secondary);
  transform: translateX(4px);
  box-shadow: var(--rs-agora-shadow-surface);
}

.log-file-item.active {
  background: var(--rs-agora-gradient-primary);
  color: var(--rs-agora-white);
  border-color: transparent;
  box-shadow: var(--rs-agora-shadow-primary);
}

.log-file-item:last-child {
  margin-bottom: 0;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-name {
  font-weight: 600;
  color: var(--rs-agora-text-primary);
  font-size: 0.95rem;
}

.file-stats {
  font-size: 0.8rem;
  color: var(--rs-agora-text-muted);
  font-weight: 400;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.btn-download-small, .btn-delete-small {
  width: 32px;
  height: 32px;
  background: var(--rs-agora-transparent-white-05);
  border: 1px solid var(--rs-agora-border-primary);
  cursor: pointer;
  border-radius: 8px;
  transition: var(--rs-agora-transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rs-agora-text-muted);
}

.btn-download-small:hover {
  background: var(--rs-agora-surface-accent);
  border-color: var(--rs-agora-success);
  color: var(--rs-agora-success);
  transform: scale(1.1);
}

.btn-delete-small:hover {
  background: var(--rs-agora-surface-accent);
  border-color: var(--rs-agora-error);
  color: var(--rs-agora-error);
  transform: scale(1.1);
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logs-controls {
  display: flex;
  gap: 12px;
}

.btn-toggle-scroll, .btn-clear-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.btn-toggle-scroll.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-toggle-scroll:hover, .btn-clear-filters:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.logs-container {
  flex: 1 1 auto;
  min-height: 0; /* important for mobile scroll */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* momentum scrolling on iOS */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
  padding: 16px;
  backdrop-filter: blur(10px);
}

.logs-container::-webkit-scrollbar {
  width: 8px;
}

.logs-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.logs-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.logs-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.log-entry {
  margin-bottom: 16px;
  padding: 20px;
  border-radius: 16px;
  border-left: 4px solid;
  background: var(--rs-agora-surface-tertiary);
  border: 1px solid var(--rs-agora-border-primary);
  transition: var(--rs-agora-transition-normal);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.log-entry:hover {
  background: var(--rs-agora-transparent-white-06);
  border-color: var(--rs-agora-border-secondary);
  transform: translateY(-2px);
  box-shadow: var(--rs-agora-shadow-surface);
}

.log-entry.log-debug {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
}

.log-entry.log-info {
  border-left-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%);
}

.log-entry.log-warn {
  border-left-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%);
}

.log-entry.log-error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%);
}

.log-entry.log-critical {
  border-left-color: #dc2626;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
  border-color: rgba(220, 38, 38, 0.3);
}

.log-header {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.log-timestamp {
  color: var(--text-secondary, #aaa);
  font-size: 0.8rem;
}

.log-level {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
}

.level-debug {
  background: var(--rs-agora-gradient-info);
  color: var(--rs-agora-white);
  box-shadow: var(--rs-agora-shadow-info);
}

.level-info {
  background: var(--rs-agora-gradient-accent);
  color: var(--rs-agora-white);
  box-shadow: var(--rs-agora-shadow-accent);
}

.level-warn {
  background: var(--rs-agora-gradient-warning);
  color: var(--rs-agora-white);
  box-shadow: var(--rs-agora-shadow-warning);
}

.level-error, .level-critical {
  background: var(--rs-agora-gradient-error);
  color: var(--rs-agora-white);
  box-shadow: var(--rs-agora-shadow-error);
}

.log-category {
  color: var(--accent-color, #007bff);
  font-weight: 500;
}

.log-session {
  color: var(--text-secondary, #aaa);
  font-family: monospace;
  font-size: 0.8rem;
}

.log-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.log-timestamp {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
  font-weight: 500;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
}

.log-level {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.log-category {
  color: var(--rs-agora-primary);
  font-weight: 600;
  font-size: 0.85rem;
  padding: 2px 8px;
  background: var(--rs-agora-surface-accent);
  border-radius: 6px;
}

.log-session {
  color: var(--rs-agora-text-muted);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.75rem;
  padding: 2px 6px;
  background: var(--rs-agora-transparent-white-05);
  border-radius: 4px;
}

.log-message {
  color: var(--rs-agora-text-primary);
  margin-bottom: 12px;
  line-height: 1.5;
  font-size: 0.95rem;
  font-weight: 400;
}

.log-data {
  margin-top: 12px;
}

.log-data summary {
  cursor: pointer;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  user-select: none;
}

.log-data summary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.log-data pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 16px;
  border-radius: 12px;
  overflow-x: auto;
  font-size: 0.8rem;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  line-height: 1.5;
  backdrop-filter: blur(10px);
}

.no-logs {
  text-align: center;
  padding: 60px 40px;
  color: var(--rs-agora-text-muted);
  background: var(--rs-agora-surface-tertiary);
  border-radius: 16px;
  border: 2px dashed var(--rs-agora-border-primary);
}

.no-logs p {
  margin: 8px 0;
  font-size: 1rem;
  line-height: 1.5;
}

.no-logs p:first-child {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--rs-agora-text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .log-modal {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .log-modal-header {
    padding: 20px 20px 15px;
  }
  
  .header-content {
    gap: 12px;
  }
  
  .header-icon {
    width: 40px;
    height: 40px;
  }
  
  .header-text h2 {
    font-size: 1.3rem;
  }
  
  .log-stats-bar {
    padding: 20px;
    gap: 16px;
  }
  
  .stat-item {
    min-width: 140px;
    padding: 12px 16px;
  }
  
  .main-content {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }
  
  .log-files-section {
    width: 100%;
    min-width: auto;
    max-height: 200px;
  }
  
  .log-filters {
    flex-direction: column;
    gap: 12px;
  }
  
  .log-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .btn-download, .btn-clear, .btn-export {
    min-width: 120px;
    padding: 12px 16px;
  }
  
  .logs-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .logs-container {
    max-height: 400px; /* mobilde log listesi için yükseklik sınırı */
  }
}

@media (max-width: 480px) {
  .log-modal-overlay {
    padding: 0;
  }
  
  .log-modal {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .log-stats-bar {
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-item {
    min-width: 100%;
  }
  
  .log-actions {
    justify-content: center;
  }
  
  .btn-download, .btn-clear, .btn-export {
    min-width: 100px;
    font-size: 0.8rem;
  }
  
  .logs-container {
    max-height: 350px; /* çok küçük ekranlarda daha az yükseklik */
  }
}
</style> 