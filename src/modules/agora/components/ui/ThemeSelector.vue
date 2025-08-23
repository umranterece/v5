<template>
  <div class="rs-agora-theme-selector">
    <!-- Tema Seçici Butonu -->
    <button 
      @click="toggleThemeMenu"
      class="theme-selector-btn"
      :title="`Mevcut Tema: ${currentThemeInfo.name}`"
    >
      <span class="theme-icon">{{ currentThemeInfo.icon }}</span>
      <span class="theme-name">{{ currentThemeInfo.name }}</span>
      <span class="dropdown-arrow">▼</span>
    </button>

    <!-- Tema Menüsü -->
    <div v-if="isThemeMenuOpen" class="theme-menu">
      <div class="theme-menu-header">
        <h4>Tema Seç</h4>
        <button @click="toggleThemeMenu" class="close-btn">
          <XMarkIcon />
        </button>
      </div>
      
      <div class="theme-list">
        <div
          v-for="theme in availableThemes"
          :key="theme.id"
          class="theme-option"
          :class="{ active: theme.id === currentTheme }"
          @click="selectTheme(theme.id)"
          @mouseenter="previewTheme(theme.id)"
          @mouseleave="cancelPreview"
        >
          <span class="theme-icon">{{ theme.icon }}</span>
          <div class="theme-info">
            <span class="theme-name">{{ theme.name }}</span>
            <span class="theme-description">{{ theme.description }}</span>
          </div>
          <span v-if="theme.id === currentTheme" class="current-indicator">✓</span>
        </div>
      </div>
      
      <!-- Custom Tema -->
      <div class="custom-theme-section">
        <h5>Özel Tema</h5>
        <div class="custom-theme-inputs">
          <div class="color-input">
            <label>Ana Renk:</label>
            <input 
              v-model="customColors.primary" 
              type="color" 
              @change="applyCustomTheme"
            />
          </div>
          <div class="color-input">
            <label>İkincil Renk:</label>
            <input 
              v-model="customColors.secondary" 
              type="color" 
              @change="applyCustomTheme"
            />
          </div>
        </div>
        <button @click="resetCustomTheme" class="reset-btn">Sıfırla</button>
      </div>
    </div>

    <!-- Overlay -->
    <div 
      v-if="isThemeMenuOpen" 
      @click="toggleThemeMenu"
      class="theme-overlay"
    ></div>
  </div>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../../composables/index.js'

const {
  currentTheme,
  availableThemes,
  setTheme,
  previewTheme,
  cancelPreview,
  getThemeInfo
} = useTheme()

// Local state
const isThemeMenuOpen = ref(false)
const customColors = ref({
  primary: 'var(--rs-agora-primary)',
  secondary: 'var(--rs-agora-secondary)'
})

// Computed
const currentThemeInfo = computed(() => getThemeInfo(currentTheme.value))

// Methods
const toggleThemeMenu = () => {
  isThemeMenuOpen.value = !isThemeMenuOpen.value
}

const selectTheme = (themeId) => {
  setTheme(themeId)
  toggleThemeMenu()
}

const applyCustomTheme = () => {
  const root = document.documentElement
  
  // Custom renkleri uygula
  root.style.setProperty('--rs-agora-primary', customColors.value.primary)
  root.style.setProperty('--rs-agora-secondary', customColors.value.secondary)
  
  // Gradient'ları güncelle
  root.style.setProperty(
    '--rs-agora-gradient-primary', 
    `linear-gradient(135deg, ${customColors.value.primary} 0%, ${customColors.value.secondary} 100%)`
  )
  root.style.setProperty(
    '--rs-agora-gradient-secondary', 
    `linear-gradient(135deg, ${customColors.value.secondary} 0%, ${customColors.value.primary} 100%)`
  )
  
  console.log('Custom tema uygulandı:', customColors.value)
}

const resetCustomTheme = () => {
  customColors.value = {
    primary: 'var(--rs-agora-primary)',
    secondary: 'var(--rs-agora-secondary)'
  }
  
  // Custom renkleri kaldır
  const root = document.documentElement
  root.style.removeProperty('--rs-agora-primary')
  root.style.removeProperty('--rs-agora-secondary')
  root.style.removeProperty('--rs-agora-gradient-primary')
  root.style.removeProperty('--rs-agora-gradient-secondary')
  
  // Varsayılan temaya dön
  setTheme('default')
}

// Click outside to close
const handleClickOutside = (event) => {
  if (!event.target.closest('.rs-agora-theme-selector')) {
    isThemeMenuOpen.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.rs-agora-theme-selector {
  position: relative;
  display: inline-block;
}

.theme-selector-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--rs-agora-gradient-primary);
  color: var(--rs-agora-white);
  border: none;
  border-radius: var(--rs-agora-radius-md);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--rs-agora-transition-normal);
  box-shadow: var(--rs-agora-shadow-sm);
}

.theme-selector-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--rs-agora-shadow-md);
}

.theme-icon {
  font-size: 18px;
}

.dropdown-arrow {
  font-size: 12px;
  transition: transform var(--rs-agora-transition-normal);
}

.theme-selector-btn:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.theme-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 320px;
  background: var(--rs-agora-surface-primary);
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: var(--rs-agora-radius-lg);
  box-shadow: var(--rs-agora-shadow-lg);
  z-index: 1000;
  margin-top: 8px;
  overflow: hidden;
}

.theme-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--rs-agora-surface-secondary);
  border-bottom: 1px solid var(--rs-agora-border-primary);
}

.theme-menu-header h4 {
  margin: 0;
  color: var(--rs-agora-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: var(--rs-agora-text-secondary);
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  border-radius: var(--rs-agora-radius-sm);
  transition: all var(--rs-agora-transition-fast);
}

.close-btn:hover {
  background: var(--rs-agora-surface-accent);
  color: var(--rs-agora-text-primary);
}

.close-btn svg {
  width: 16px;
  height: 16px;
  color: currentColor;
}

.theme-list {
  max-height: 300px;
  overflow-y: auto;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all var(--rs-agora-transition-fast);
  border-bottom: 1px solid var(--rs-agora-border-primary);
}

.theme-option:hover {
  background: var(--rs-agora-surface-accent);
}

.theme-option.active {
  background: var(--rs-agora-surface-accent);
  border-left: 3px solid var(--rs-agora-primary);
}

.theme-option .theme-icon {
  font-size: 24px;
  width: 32px;
  text-align: center;
}

.theme-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.theme-name {
  font-weight: 600;
  color: var(--rs-agora-text-primary);
  font-size: 14px;
}

.theme-description {
  color: var(--rs-agora-text-secondary);
  font-size: 12px;
}

.current-indicator {
  color: var(--rs-agora-success);
  font-weight: bold;
  font-size: 16px;
}

.custom-theme-section {
  padding: 16px;
  border-top: 1px solid var(--rs-agora-border-primary);
  background: var(--rs-agora-surface-secondary);
}

.custom-theme-section h5 {
  margin: 0 0 12px 0;
  color: var(--rs-agora-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.custom-theme-inputs {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.color-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.color-input label {
  font-size: 12px;
  color: var(--rs-agora-text-secondary);
}

.color-input input[type="color"] {
  width: 40px;
  height: 32px;
  border: none;
  border-radius: var(--rs-agora-radius-sm);
  cursor: pointer;
}

.reset-btn {
  background: var(--rs-agora-surface-tertiary);
  color: var(--rs-agora-text-primary);
  border: 1px solid var(--rs-agora-border-primary);
  padding: 6px 12px;
  border-radius: var(--rs-agora-radius-sm);
  cursor: pointer;
  font-size: 12px;
  transition: all var(--rs-agora-transition-fast);
}

.reset-btn:hover {
  background: var(--rs-agora-surface-accent);
  border-color: var(--rs-agora-border-secondary);
}

.theme-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
}

/* Scrollbar styling */
.theme-list::-webkit-scrollbar {
  width: 6px;
}

.theme-list::-webkit-scrollbar-track {
  background: var(--rs-agora-surface-secondary);
}

.theme-list::-webkit-scrollbar-thumb {
  background: var(--rs-agora-border-secondary);
  border-radius: 3px;
}

.theme-list::-webkit-scrollbar-thumb:hover {
  background: var(--rs-agora-border-accent);
}
</style>
