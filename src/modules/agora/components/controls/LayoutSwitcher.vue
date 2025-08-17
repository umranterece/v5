<template>
  <div class="layout-switcher">
    <!-- Current Layout Display Button -->
    <button 
      @click="toggleLayoutMenu"
      class="current-layout-btn"
      :title="`Mevcut: ${currentLayoutInfo.name}`"
    >
      <span class="layout-icon">{{ currentLayoutInfo.icon }}</span>
      <span class="layout-name">{{ currentLayoutInfo.name }}</span>
      <span class="modal-arrow">🎨</span>
    </button>

    <!-- Layout Modal Overlay -->
    <div v-if="isLayoutMenuOpen" class="layout-modal-overlay" @click="closeLayoutMenu">
      <div class="layout-modal" @click.stop>
        <!-- Modal Header -->
        <div class="layout-modal-header">
          <div class="header-content">
            <div class="header-icon">🎨</div>
            <div class="header-text">
              <h2>Görünüm Seçenekleri</h2>
              <p>Video konferans görünümünü özelleştirin</p>
            </div>
          </div>
          <button @click="closeLayoutMenu" class="close-modal-btn">
            <span class="close-icon">×</span>
          </button>
        </div>
        
        <!-- Modal Content -->
        <div class="layout-modal-content">
          <div class="layout-categories">
            <div v-for="(layouts, category) in layoutsByCategory" :key="category" class="layout-category">
              <h3 class="category-title">{{ getCategoryTitle(category) }}</h3>
              <div class="layout-grid">
                <div
                  v-for="layout in layouts"
                  :key="layout.id"
                  @click="switchLayoutWithSave(layout.id)"
                  :class="['layout-card', { active: currentLayout === layout.id }]"
                  :title="layout.description"
                >
                  <div class="layout-card-icon">{{ layout.icon }}</div>
                  <div class="layout-card-content">
                    <h4 class="layout-card-name">{{ layout.name }}</h4>
                    <p class="layout-card-desc">{{ layout.description }}</p>
                  </div>
                  <div v-if="currentLayout === layout.id" class="active-badge">
                    <span class="active-check">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="layout-modal-footer">
          <div class="footer-actions">
            <button @click="resetToDefault" class="reset-btn">
              <span class="reset-icon">🔄</span>
              Varsayılana Dön
            </button>
            <button @click="closeLayoutMenu" class="close-btn">
              <span class="close-icon">✕</span>
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useLayoutStore } from '../../store/layout.js'

const layoutStore = useLayoutStore()

// Computed - Store'dan gelen değerleri reactive yap
const currentLayout = computed(() => layoutStore.currentLayout)
const currentLayoutInfo = computed(() => layoutStore.currentLayoutInfo)
const isLayoutMenuOpen = computed(() => layoutStore.isLayoutMenuOpen)
const layoutsByCategory = computed(() => layoutStore.layoutsByCategory)

// Methods - Store'dan gelen method'ları direkt kullan
const toggleLayoutMenu = layoutStore.toggleLayoutMenu
const closeLayoutMenu = layoutStore.closeLayoutMenu
const switchLayoutWithSave = layoutStore.switchLayoutWithSave
const resetToDefault = layoutStore.resetToDefault

const getCategoryTitle = (category) => {
  const titles = {
    standard: 'Standart Görünümler',
    focus: 'Odaklanmış Görünümler',
    professional: 'Profesyonel Görünümler',
    immersive: 'İmmersif Görünümler',
    mobile: 'Mobil Görünümler'
  }
  return titles[category] || category
}
</script>

<style scoped>
.layout-switcher {
  position: relative;
  display: inline-block;
}

.current-layout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.current-layout-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.layout-icon {
  font-size: 1.2rem;
}

.layout-name {
  font-weight: 500;
  font-size: 0.9rem;
}

.dropdown-arrow {
  font-size: 0.8rem;
  opacity: 0.7;
  transition: transform 0.2s ease;
}

.current-layout-btn:hover .modal-arrow {
  transform: scale(1.1);
}

/* Layout Modal */
.layout-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  backdrop-filter: blur(8px);
}

.layout-modal {
  background: rgba(26, 26, 46, 0.98);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.layout-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.layout-menu-header h3 {
  margin: 0;
  color: white;
  font-size: 1.2rem;
}

.close-menu-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.close-menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* Layout Categories */
.layout-categories {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.layout-category {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-title {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.layout-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.layout-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.layout-option:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
}

.layout-option.active {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.5);
}

.layout-option-icon {
  font-size: 1.5rem;
  width: 2rem;
  text-align: center;
}

.layout-option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.layout-option-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.layout-option-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.3;
}

.active-indicator {
  color: #4ade80;
  font-weight: bold;
  font-size: 1.2rem;
}

/* Footer */
.layout-menu-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.reset-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .layout-menu {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
    padding: 1rem;
  }
  
  .layout-option {
    padding: 1rem;
  }
  
  .layout-option-icon {
    font-size: 1.25rem;
    width: 1.5rem;
  }
}
</style>
