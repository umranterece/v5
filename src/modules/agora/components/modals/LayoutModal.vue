<template>
  <div v-if="isOpen" class="layout-modal-overlay" @click="handleOverlayClick">
    <div class="layout-modal" @click.stop>
      <!-- Modal Header -->
      <div class="layout-modal-header">
        <h2>Görünüm Seçin</h2>
        <button @click="$emit('close')" class="close-modal-btn">×</button>
      </div>
      
      <!-- Tab Navigation -->
      <div class="modal-tabs">
        <button 
          @click="activeTab = 'layout'"
          :class="['tab-btn', { active: activeTab === 'layout' }]"
        >
          <span class="tab-icon">🎨</span>
          Düzen
        </button>
        <button 
          @click="activeTab = 'theme'"
          :class="['tab-btn', { active: activeTab === 'theme' }]"
        >
          <span class="tab-icon">🎭</span>
          Tema
        </button>
      </div>
      
      <!-- Modal Content -->
      <div class="layout-modal-content">
        <!-- Layout Tab -->
        <div v-if="activeTab === 'layout'" class="tab-content">
          <div class="layout-grid">
            <div
              v-for="layout in allLayouts"
              :key="layout.id"
              @click="switchLayoutWithSave(layout.id)"
              :class="['layout-card', { active: currentLayout === layout.id }]"
              :title="layout.name"
            >
              <div class="layout-icon">{{ layout.icon }}</div>
              <div class="layout-name">{{ layout.name }}</div>
              <div v-if="currentLayout === layout.id" class="active-badge">✓</div>
            </div>
          </div>
        </div>
        
        <!-- Theme Tab -->
        <div v-if="activeTab === 'theme'" class="tab-content">
          <div class="theme-section">
            <h3 class="section-title">Tema Seçin</h3>
            <div class="theme-grid">
              <div
                v-for="theme in availableThemes"
                :key="theme.id"
                @click="selectTheme(theme.id)"
                :class="['theme-card', { active: currentTheme === theme.id }]"
                @mouseenter="previewTheme(theme.id)"
                @mouseleave="cancelPreview"
              >
                <div class="theme-icon">{{ theme.icon }}</div>
                <div class="theme-info">
                  <div class="theme-name">{{ theme.name }}</div>
                  <div class="theme-description">{{ theme.description }}</div>
                </div>
                <div v-if="currentTheme === theme.id" class="active-badge">✓</div>
              </div>
            </div>
            
            <!-- Custom Theme Section -->
            <div class="custom-theme-section">
              <h4 class="section-subtitle">Özel Tema</h4>
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useLayoutStore } from '../../store/layout.js'
import { useTheme } from '../../composables/useTheme.js'

// Props
const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits(['close'])

// Stores and composables
const layoutStore = useLayoutStore()
const {
  currentTheme,
  availableThemes,
  setTheme,
  previewTheme,
  cancelPreview
} = useTheme()

// Local state
const activeTab = ref('layout')
const customColors = ref({
  primary: '#3B82F6',
  secondary: '#06B6D4'
})

// Computed
const currentLayout = computed(() => layoutStore.currentLayout)
const allLayouts = computed(() => layoutStore.availableLayouts)

// Methods
const switchLayoutWithSave = (layoutId) => {
  layoutStore.switchLayoutWithSave(layoutId)
  emit('close')
}

const selectTheme = (themeId) => {
  setTheme(themeId)
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
    primary: '#3B82F6',
    secondary: '#06B6D4'
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

const handleOverlayClick = () => {
  emit('close')
}
</script>

<style scoped>
/* Layout Modal - Compact Design with Dark Theme */
.layout-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(8px);
}

.layout-modal {
  background: rgba(30, 30, 30, 0.85);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Modal Header */
.layout-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
}

.layout-modal-header h2 {
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.25rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.close-modal-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

.close-modal-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--rs-agora-white);
}

/* Tab Navigation */
.modal-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0 1.5rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  color: var(--rs-agora-transparent-white-60);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
  position: relative;
}

.tab-btn:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  color: var(--rs-agora-white);
  border-bottom-color: var(--rs-agora-primary);
  background: rgba(255, 255, 255, 0.08);
}

.tab-icon {
  font-size: 1.125rem;
}

/* Modal Content */
.layout-modal-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.layout-modal-content::-webkit-scrollbar {
  width: 6px;
}

.layout-modal-content::-webkit-scrollbar-track {
  background: var(--rs-agora-transparent-white-05);
  border-radius: 3px;
}

.layout-modal-content::-webkit-scrollbar-thumb {
  background: var(--rs-agora-transparent-white-20);
  border-radius: 3px;
}

.layout-modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--rs-agora-transparent-white-30);
}

.tab-content {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Layout Grid */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.layout-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  aspect-ratio: 1;
  min-height: 120px;
  backdrop-filter: blur(8px);
}

.layout-card:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.layout-card.active {
  background: linear-gradient(135deg, var(--rs-agora-transparent-primary-30) 0%, var(--rs-agora-transparent-secondary-30) 100%);
  border-color: var(--rs-agora-transparent-primary-50);
  box-shadow: 0 0 20px var(--rs-agora-transparent-primary-30);
}

.layout-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  transition: transform 0.2s ease;
}

.layout-card:hover .layout-icon {
  transform: scale(1.1);
}

.layout-name {
  margin: 0;
  color: var(--rs-agora-white);
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 1px 2px var(--rs-agora-transparent-black-30);
}

.active-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--rs-agora-success);
  color: var(--rs-agora-black);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  box-shadow: var(--rs-agora-shadow-sm);
}

/* Theme Section */
.theme-section {
  padding: 1rem;
}

.section-title {
  margin: 0 0 1.5rem 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.theme-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  backdrop-filter: blur(8px);
}

.theme-card:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.theme-card.active {
  background: linear-gradient(135deg, var(--rs-agora-transparent-primary-30) 0%, var(--rs-agora-transparent-secondary-30) 100%);
  border-color: var(--rs-agora-transparent-primary-50);
  box-shadow: 0 0 20px var(--rs-agora-transparent-primary-30);
}

.theme-card .theme-icon {
  font-size: 2rem;
  width: 48px;
  text-align: center;
}

.theme-info {
  flex: 1;
}

.theme-info .theme-name {
  margin: 0 0 0.25rem 0;
  color: var(--rs-agora-white);
  font-size: 1rem;
  font-weight: 600;
}

.theme-info .theme-description {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
}

/* Custom Theme Section */
.custom-theme-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
}

.section-subtitle {
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  font-weight: 600;
}

.custom-theme-inputs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.color-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.color-input label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 500;
}

.color-input input[type="color"] {
  width: 48px;
  height: 40px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  background: none;
}

.color-input input[type="color"]:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.reset-btn {
  background: rgba(255, 255, 255, 0.1);
  color: var(--rs-agora-white);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .layout-modal {
    width: 90%;
    max-width: 500px;
    margin: 1rem;
  }
  
  .layout-modal-header {
    padding: 1rem;
  }
  
  .modal-tabs {
    padding: 0 1rem;
  }
  
  .tab-btn {
    padding: 0.75rem 1rem;
    font-size: 0.8rem;
  }
  
  .layout-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0.75rem;
  }
  
  .theme-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .custom-theme-inputs {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .layout-modal-header h2 {
    font-size: 1.125rem;
  }
  
  .layout-icon {
    font-size: 1.5rem;
  }
  
  .layout-name {
    font-size: 0.75rem;
  }
}
</style>
