<template>
  <div v-if="isOpen" class="layout-modal-overlay" @click="handleOverlayClick">
    <div class="layout-modal" @click.stop>
      <!-- Modal Header -->
      <div class="layout-modal-header">
        <h2>Görünüm Seçin</h2>
        <button @click="$emit('close')" class="close-modal-btn">×</button>
      </div>
      
      <!-- Modal Content -->
      <div class="layout-modal-content">
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
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLayoutStore } from '../../store/layout.js'

// Props
const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits(['close'])

// Layout store
const layoutStore = useLayoutStore()

// Computed
const currentLayout = computed(() => layoutStore.currentLayout)
const allLayouts = computed(() => layoutStore.availableLayouts)

// Methods
const switchLayoutWithSave = (layoutId) => {
  layoutStore.switchLayoutWithSave(layoutId)
  emit('close')
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
  background: linear-gradient(135deg, var(--rs-agora-dark-surface-15) 0%, var(--rs-agora-dark-surface-26) 100%);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(20px);
}

.layout-modal {
  background: linear-gradient(135deg, var(--rs-agora-dark-surface-26) 0%, var(--rs-agora-dark-surface-22) 100%);
  backdrop-filter: blur(30px);
  border: 1px solid var(--rs-agora-transparent-white-10);
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 70vh;
  overflow: hidden;
  box-shadow: 
    var(--rs-agora-shadow-xl),
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
  padding: 1.5rem;
  border-bottom: 1px solid var(--rs-agora-transparent-white-08);
  background: linear-gradient(135deg, var(--rs-agora-transparent-white-03) 0%, var(--rs-agora-transparent-white-01) 100%);
}

.layout-modal-header h2 {
  margin: 0;
  color: var(--rs-agora-white);
  font-size: 1.25rem;
  font-weight: 600;
  text-shadow: 0 2px 4px var(--rs-agora-transparent-black-30);
}

.close-modal-btn {
  background: var(--rs-agora-transparent-white-05);
  border: 1px solid var(--rs-agora-transparent-white-10);
  color: var(--rs-agora-transparent-white-80);
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
  backdrop-filter: blur(10px);
}

.close-modal-btn:hover {
  background: var(--rs-agora-transparent-white-10);
  border-color: var(--rs-agora-transparent-white-20);
  color: var(--rs-agora-white);
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
  background: linear-gradient(135deg, var(--rs-agora-transparent-white-10) 0%, var(--rs-agora-transparent-white-05) 100%);
  border: 1px solid var(--rs-agora-transparent-white-15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  aspect-ratio: 1; /* Kare şekil */
  min-height: 120px; /* Minimum yükseklik */
  backdrop-filter: blur(10px);
}

.layout-card:hover {
  background: linear-gradient(135deg, var(--rs-agora-transparent-white-15) 0%, var(--rs-agora-transparent-white-10) 100%);
  border-color: var(--rs-agora-transparent-white-25);
  transform: translateY(-2px);
  box-shadow: var(--rs-agora-shadow-md);
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

/* Responsive */
@media (max-width: 768px) {
  .layout-modal {
    width: 90%;
    max-width: 400px;
    margin: 1rem;
  }
  
  .layout-modal-header {
    padding: 1rem;
  }
  
  .layout-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    padding: 0.75rem;
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
