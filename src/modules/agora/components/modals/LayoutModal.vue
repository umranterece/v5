<template>
  <div v-if="isOpen" class="layout-modal-overlay" @click="handleOverlayClick">
    <div class="layout-modal" @click.stop>
      <!-- Modal Header -->
      <div class="layout-modal-header">
        <div class="header-content">
          <div class="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="header-text">
          
          </div>
        </div>
        <button @click="$emit('close')" class="close-modal-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      
      <!-- Tab Navigation -->
      <div class="modal-tabs">
        <button 
          @click="activeTab = 'layout'"
          :class="['tab-btn', { active: activeTab === 'layout' }]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Düzen</span>
        </button>
        <button 
          @click="activeTab = 'theme'"
          :class="['tab-btn', { active: activeTab === 'theme' }]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Tema</span>
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
              <div class="layout-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="layout-name">{{ layout.name }}</div>
              <div v-if="currentLayout === layout.id" class="active-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
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
  primary: 'var(--rs-agora-primary)',
  secondary: 'var(--rs-agora-secondary)'
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

const handleOverlayClick = () => {
  emit('close')
}
</script>

<style scoped>
/* Layout Modal - Tema Sistemi ile Uyumlu */
.layout-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--rs-agora-transparent-black-30);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.layout-modal {
  background: var(--rs-agora-surface-primary);
  backdrop-filter: var(--rs-agora-backdrop-blur);
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: var(--rs-agora-border-radius-md);
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 
    var(--rs-agora-shadow-secondary),
    0 0 0 1px var(--rs-agora-transparent-white-05),
    inset 0 1px 0 var(--rs-agora-transparent-white-10);
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
  padding: 30px 30px 25px;
  background: var(--rs-agora-gradient-surface);
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
  border-radius: var(--rs-agora-border-radius-md);
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

.close-modal-btn {
  background: var(--rs-agora-transparent-white-05);
  border: 1px solid var(--rs-agora-border-primary);
  color: var(--rs-agora-text-secondary);
  cursor: pointer;
  padding: 12px;
  border-radius: var(--rs-agora-border-radius-sm);
  transition: var(--rs-agora-transition-normal);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.close-modal-btn:hover {
  background: var(--rs-agora-transparent-white-10);
  border-color: var(--rs-agora-border-secondary);
  color: var(--rs-agora-text-primary);
  transform: scale(1.05);
}

/* Tab Navigation */
.modal-tabs {
  display: flex;
  background: var(--rs-agora-gradient-surface);
  border-bottom: 1px solid var(--rs-agora-border-secondary);
  padding: 0 30px;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: none;
  border: none;
  color: var(--rs-agora-text-muted);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: var(--rs-agora-transition-normal);
  border-bottom: 3px solid transparent;
  position: relative;
  letter-spacing: 0.3px;
}

.tab-btn:hover {
  color: var(--rs-agora-text-secondary);
  background: var(--rs-agora-transparent-white-05);
  transform: translateY(-1px);
}

.tab-btn.active {
  color: var(--rs-agora-text-primary);
  border-bottom-color: var(--rs-agora-primary);
  background: var(--rs-agora-surface-accent);
}

.tab-btn svg {
  width: 20px;
  height: 20px;
  transition: var(--rs-agora-transition-normal);
}

.tab-btn:hover svg {
  transform: scale(1.1);
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
  padding: 24px 20px;
  background: var(--rs-agora-surface-tertiary);
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 20px;
  cursor: pointer;
  transition: var(--rs-agora-transition-normal);
  position: relative;
  aspect-ratio: 1;
  min-height: 140px;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.layout-card:hover {
  background: var(--rs-agora-transparent-white-08);
  border-color: var(--rs-agora-border-secondary);
  transform: translateY(-4px);
  box-shadow: var(--rs-agora-shadow-surface);
}

.layout-card.active {
  background: var(--rs-agora-surface-accent);
  border-color: var(--rs-agora-primary);
  box-shadow: var(--rs-agora-shadow-primary);
}

.layout-icon {
  margin-bottom: 16px;
  transition: var(--rs-agora-transition-normal);
  color: var(--rs-agora-text-secondary);
}

.layout-card:hover .layout-icon {
  transform: scale(1.1);
}

.layout-name {
  margin: 0;
  color: var(--rs-agora-text-primary);
  font-size: 0.95rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.3px;
}

.active-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--rs-agora-gradient-accent);
  color: var(--rs-agora-white);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--rs-agora-shadow-accent);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Theme Section */
.theme-section {
  padding: 24px;
}

.section-title {
  margin: 0 0 24px 0;
  color: var(--rs-agora-text-primary);
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  background: var(--rs-agora-gradient-text-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.3px;
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
  gap: 16px;
  padding: 20px;
  background: var(--rs-agora-surface-tertiary);
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 20px;
  cursor: pointer;
  transition: var(--rs-agora-transition-normal);
  position: relative;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.theme-card:hover {
  background: var(--rs-agora-transparent-white-08);
  border-color: var(--rs-agora-border-secondary);
  transform: translateY(-3px);
  box-shadow: var(--rs-agora-shadow-surface);
}

.theme-card.active {
  background: var(--rs-agora-surface-accent);
  border-color: var(--rs-agora-primary);
  box-shadow: var(--rs-agora-shadow-primary);
}

.theme-card .theme-icon {
  font-size: 2rem;
  width: 48px;
  text-align: center;
  color: var(--rs-agora-text-secondary);
}

.theme-info {
  flex: 1;
}

.theme-info .theme-name {
  margin: 0 0 8px 0;
  color: var(--rs-agora-text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.theme-info .theme-description {
  margin: 0;
  color: var(--rs-agora-text-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Custom Theme Section */
.custom-theme-section {
  background: var(--rs-agora-gradient-surface);
  border: 1px solid var(--rs-agora-border-primary);
  border-radius: 20px;
  padding: 24px;
  margin-top: 24px;
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.section-subtitle {
  margin: 0 0 20px 0;
  color: var(--rs-agora-text-primary);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.2px;
}

.custom-theme-inputs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.color-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-input label {
  color: var(--rs-agora-text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.color-input input[type="color"] {
  width: 56px;
  height: 48px;
  border: 2px solid var(--rs-agora-border-secondary);
  border-radius: var(--rs-agora-border-radius-md);
  cursor: pointer;
  background: none;
  transition: var(--rs-agora-transition-normal);
}

.color-input input[type="color"]:hover {
  border-color: var(--rs-agora-border-accent);
  transform: scale(1.05);
}

.reset-btn {
  background: var(--rs-agora-gradient-surface);
  color: var(--rs-agora-text-primary);
  border: 1px solid var(--rs-agora-border-secondary);
  padding: 12px 20px;
  border-radius: var(--rs-agora-border-radius-sm);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--rs-agora-transition-normal);
  backdrop-filter: var(--rs-agora-backdrop-blur-light);
}

.reset-btn:hover {
  background: var(--rs-agora-transparent-white-10);
  border-color: var(--rs-agora-border-accent);
  transform: translateY(-1px);
  box-shadow: var(--rs-agora-shadow-surface);
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
