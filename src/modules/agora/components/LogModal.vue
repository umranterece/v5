<template>
  <div v-if="isOpen" class="log-modal-overlay" @click="closeModal">
    <div class="log-modal" @click.stop>
      <!-- Header -->
      <div class="log-modal-header">
        <h2>📋 Agora Günlükleri</h2>
        <div class="log-modal-controls">
          <button @click="exportLogs" class="btn-export">
            📥 JSON Dışa Aktar
          </button>
          <button @click="clearLogs" class="btn-clear">
            🗑️ Temizle
          </button>
          <button @click="closeModal" class="btn-close">
            ❌ Kapat
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="log-stats">
        <div class="stat-item">
          <span class="stat-label">Toplam:</span>
          <span class="stat-value">{{ logStats.total }}</span>
        </div>
        <div class="stat-item" v-for="(count, level) in logStats.byLevel" :key="level">
          <span class="stat-label">{{ level }}:</span>
          <span class="stat-value" :class="`level-${level}`">{{ count }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="log-filters">
        <select v-model="filters.level" class="filter-select">
          <option value="">Tüm Seviyeler</option>
          <option v-for="level in logLevels" :key="level" :value="level">
            {{ level.toUpperCase() }}
          </option>
        </select>
        
        <select v-model="filters.category" class="filter-select">
          <option value="">Tüm Kategoriler</option>
          <option v-for="category in logCategories" :key="category" :value="category">
            {{ category.toUpperCase() }}
          </option>
        </select>
        
        <input 
          v-model="filters.search" 
          type="text" 
          placeholder="Günlüklerde ara..." 
          class="filter-search"
        />
      </div>

      <!-- Logs -->
      <div class="log-container">
        <div 
          v-for="log in filteredLogs" 
          :key="log.id" 
          class="log-item"
          :class="`level-${log.level}`"
        >
          <div class="log-header">
            <span class="log-timestamp">{{ formatTime(log.timestamp) }}</span>
            <span class="log-level">{{ log.level.toUpperCase() }}</span>
            <span class="log-category">{{ log.category }}</span>
          </div>
          <div class="log-message">{{ log.message }}</div>
          <div v-if="log.data && Object.keys(log.data).length > 0" class="log-data">
            <pre>{{ JSON.stringify(log.data, null, 2) }}</pre>
          </div>
        </div>
        
        <div v-if="filteredLogs.length === 0" class="no-logs">
          Günlük bulunamadı
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { LOG_LEVELS, LOG_CATEGORIES } from '../services/logger.js'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  logs: { type: Array, default: () => [] },
  logStats: { type: Object, default: () => ({}) },
  getFilteredLogs: { type: Function, default: () => [] },
  clearLogs: { type: Function, default: () => {} },
  exportLogs: { type: Function, default: () => {} }
})

const emit = defineEmits(['close'])

// Use props instead of useLogger
const {
  logs,
  logStats,
  getFilteredLogs,
  clearLogs: clearAllLogs,
  exportLogs: exportAllLogs
} = props

// Memoize LOG_LEVELS and LOG_CATEGORIES to prevent reactive updates
const logLevels = Object.values(LOG_LEVELS)
const logCategories = Object.values(LOG_CATEGORIES)

// Component state
const filters = ref({
  level: '',
  category: '',
  search: ''
})

// Computed - optimized to prevent recursive updates
const filteredLogs = computed(() => {
  const currentFilters = filters.value
  return getFilteredLogs(currentFilters)
})

// Methods
const closeModal = () => {
  emit('close')
}

const clearLogs = () => {
  if (confirm('Tüm günlükleri temizlemek istediğinizden emin misiniz?')) {
    clearAllLogs()
  }
}

const exportLogs = () => {
  exportAllLogs()
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}
</script>

<style scoped>
.log-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.log-modal {
  width: 95vw;
  height: 90vh;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.log-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: #2a2a2a;
  border-bottom: 1px solid #333;
  border-radius: 12px 12px 0 0;
  flex-shrink: 0;
}

.log-modal-header h2 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.log-modal-controls {
  display: flex;
  gap: 10px;
}

.log-modal-controls button {
  padding: 8px 12px;
  border: 1px solid #555;
  background: #333;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  font-weight: 500;
}

.log-modal-controls button:hover {
  background: #444;
  border-color: #666;
  transform: translateY(-1px);
}

.btn-export {
  background: #2d5a2d !important;
  border-color: #4a7c4a !important;
}

.btn-export:hover {
  background: #3a6a3a !important;
}

.btn-clear {
  background: #5a2d2d !important;
  border-color: #7c4a4a !important;
}

.btn-clear:hover {
  background: #6a3a3a !important;
}

.btn-close {
  background: #2d2d5a !important;
  border-color: #4a4a7c !important;
}

.btn-close:hover {
  background: #3a3a6a !important;
}

.log-stats {
  display: flex;
  gap: 20px;
  padding: 15px 25px;
  background: #252525;
  border-bottom: 1px solid #333;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  color: #ccc;
  font-weight: 500;
}

.stat-value {
  color: #fff;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: #333;
}

.stat-value.level-error {
  background: #5a2d2d;
  color: #ff6b6b;
}

.stat-value.level-warn {
  background: #5a4a2d;
  color: #ffd93d;
}

.stat-value.level-info {
  background: #2d5a2d;
  color: #6bcf7f;
}

.stat-value.level-debug {
  background: #2d4a5a;
  color: #6bb5ff;
}

.log-filters {
  display: flex;
  gap: 15px;
  padding: 15px 25px;
  background: #202020;
  border-bottom: 1px solid #333;
  flex-shrink: 0;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #555;
  background: #333;
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  min-width: 120px;
}

.filter-search {
  padding: 8px 12px;
  border: 1px solid #555;
  background: #333;
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  flex: 1;
  min-width: 200px;
}

.filter-select:focus,
.filter-search:focus {
  outline: none;
  border-color: #666;
  background: #3a3a3a;
}

.log-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 25px;
  background: #1a1a1a;
}

.log-item {
  margin-bottom: 15px;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #555;
  background: #252525;
  transition: all 0.2s;
}

.log-item:hover {
  background: #2a2a2a;
  transform: translateX(2px);
}

.log-item.level-error {
  border-left-color: #ff6b6b;
  background: #2a1a1a;
}

.log-item.level-warn {
  border-left-color: #ffd93d;
  background: #2a251a;
}

.log-item.level-info {
  border-left-color: #6bcf7f;
  background: #1a2a1a;
}

.log-item.level-debug {
  border-left-color: #6bb5ff;
  background: #1a1f2a;
}

.log-item .log-header {
  display: flex;
  gap: 15px;
  margin-bottom: 8px;
  font-size: 11px;
}

.log-timestamp {
  color: #888;
  font-weight: 500;
}

.log-level {
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  text-transform: uppercase;
}

.level-error .log-level {
  background: #5a2d2d;
  color: #ff6b6b;
}

.level-warn .log-level {
  background: #5a4a2d;
  color: #ffd93d;
}

.level-info .log-level {
  background: #2d5a2d;
  color: #6bcf7f;
}

.level-debug .log-level {
  background: #2d4a5a;
  color: #6bb5ff;
}

.log-category {
  color: #aaa;
  font-weight: 500;
}

.log-message {
  color: #fff;
  font-weight: 500;
  margin-bottom: 8px;
  line-height: 1.4;
}

.log-data {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 10px;
  margin-top: 8px;
}

.log-data pre {
  margin: 0;
  color: #ccc;
  font-size: 11px;
  line-height: 1.3;
  white-space: pre-wrap;
  word-break: break-word;
}

.no-logs {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px;
  font-size: 14px;
}

/* Scrollbar styling */
.log-container::-webkit-scrollbar {
  width: 8px;
}

.log-container::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.log-container::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

.log-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Responsive design */
@media (max-width: 768px) {
  .log-modal {
    width: 98vw;
    height: 95vh;
  }
  
  .log-modal-header {
    padding: 15px 20px;
  }
  
  .log-modal-header h2 {
    font-size: 16px;
  }
  
  .log-modal-controls {
    gap: 8px;
  }
  
  .log-modal-controls button {
    padding: 6px 10px;
    font-size: 11px;
  }
  
  .log-stats {
    padding: 12px 20px;
    gap: 15px;
  }
  
  .log-filters {
    padding: 12px 20px;
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .filter-select,
  .filter-search {
    padding: 6px 10px;
    font-size: 11px;
  }
  
  .log-container {
    padding: 15px 20px;
  }
}
</style> 