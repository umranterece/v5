<template>
  <div class="whiteboard-layout">
    <!-- Loading State - Proje açılış loading UI'ı ile aynı -->
    <div v-if="!isReady" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h3>Whiteboard Yükleniyor...</h3>
        <p>{{ loadingStatus }}</p>
        
        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: loadingProgress }"></div>
          </div>
          <div class="progress-text">{{ loadingProgressText }}</div>
        </div>
        
        <!-- Loading Status -->
        <div class="loading-status">
          <div class="status-item" :class="{ active: loadingStep === 'container', completed: loadingStep === 'token' || loadingStep === 'room' || loadingStep === 'ready' }">
            <span class="status-icon">📦</span>
            <span>Container Hazırlanıyor</span>
          </div>
          <div class="status-item" :class="{ active: loadingStep === 'token', completed: loadingStep === 'ready' }">
            <span class="status-icon">🔑</span>
            <span>Token ve Room Oluşturuluyor</span>
          </div>
          <div class="status-item" :class="{ active: loadingStep === 'ready' }">
            <span class="icon">🎨</span>
            <span>Whiteboard Hazırlanıyor</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Full Screen NetlessWhiteboard - Sadece hazır olduğunda göster -->
    <AdvancedWhiteboard 
      v-if="isReady"
      :users="users"
      :logger="logger"
      @tool-changed="handleToolChange"
      @color-changed="handleColorChange"
      @stroke-changed="handleStrokeChange"
      @canvas-ready="handleCanvasReady"
      @canvas-error="handleCanvasError"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAgoraStore } from '../../store/index.js'
import { AdvancedWhiteboard } from '../whiteboard/index.js'
import { netlessService } from '../../services/netlessService.js'
import { NETLESS_EVENTS } from '../../constants.js'

// Props
const props = defineProps({
  users: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  localVideoRef: { type: Object, default: null },
  logger: { 
    type: Object, 
    default: () => ({
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      fatal: () => {}
    })
  }
})

// Emits
const emit = defineEmits([
  'set-video-ref',
  'set-local-video-ref',
  'set-local-screen-ref',
  'video-click'
])

// Store
const agoraStore = useAgoraStore()

// Local state
const canvasReady = ref(false)
const canvasError = ref(null)

// Loading'i başlat ve token/room işlemlerini yap
onMounted(async () => {
  // 1. CONTAINER HAZIRLANIYOR (başlangıçta seçili)
  loadingStep.value = 'container'
  loadingProgress.value = '25%'
  loadingProgressText.value = 'Container hazırlanıyor...'
  loadingStatus.value = 'Container hazırlanıyor...'
  
  // Container hazır olduğunda kısa bir bekleme
  await new Promise(resolve => setTimeout(resolve, 500))
  
  try {
    // 2. TOKEN VE ROOM OLUŞTURULUYOR (istek gönderilirken seçili)
    loadingStep.value = 'token'
    loadingProgress.value = '50%'
    loadingProgressText.value = 'Token ve Room oluşturuluyor...'
    loadingStatus.value = 'Token ve Room oluşturuluyor...'
    
    const userId = agoraStore.localUser?.uid || `user-${Date.now()}`
    const roomResponse = await netlessService.createRoomWithToken({
      roomName: `agora-whiteboard-${Date.now()}`,
      userId,
      role: 'writer'
    })
    
    // Room bilgilerini store'a kaydet
    agoraStore.setWhiteboardRoom({
      uuid: roomResponse.uuid,
      token: roomResponse.token,
      name: roomResponse.name
    })
    
    // Debug: Store'a kaydedilen bilgileri kontrol et
    props.logger.info('Whiteboard room bilgileri store\'a kaydedildi', {
      uuid: roomResponse.uuid,
      hasToken: !!roomResponse.token,
      storeRoom: agoraStore.whiteboardRoom
    })
    
    // 3. WHITEBOARD HAZIRLANIYOR (istek başarılı olunca seçili)
    loadingStep.value = 'ready'
    loadingProgress.value = '100%'
    loadingProgressText.value = 'Whiteboard hazırlanıyor...'
    loadingStatus.value = 'Whiteboard hazırlanıyor...'
    
    // Kısa bir bekleme sonra component'i render et
    await new Promise(resolve => setTimeout(resolve, 300))
    isReady.value = true
    
  } catch (error) {
    props.logger.error('Whiteboard başlatma hatası', { error: error.message })
    loadingStatus.value = 'Hata oluştu!'
    loadingProgressText.value = 'Bağlantı hatası!'
  }
})

// Loading state
const isReady = ref(false)
const loadingStatus = ref('Container hazırlanıyor...')
const loadingStep = ref('container')
const loadingProgress = ref('25%')
const loadingProgressText = ref('Container hazırlanıyor...')

// Loading aşamaları
const LOADING_STEPS = {
  CONTAINER: 'container',
  TOKEN: 'token', 
  READY: 'ready'
}

// Methods
const handleToolChange = (tool) => {
  props.logger.debug('Whiteboard aracı değişti', { tool })
}

const handleColorChange = (color) => {
  props.logger.debug('Whiteboard rengi değişti', { color })
}

const handleStrokeChange = (width) => {
  props.logger.debug('Whiteboard kalınlığı değişti', { width })
}

const handleCanvasReady = (canvas) => {
  console.log('🎯 Canvas Ready Event Alındı!', canvas)
  canvasReady.value = true
  props.logger.info('Whiteboard canvas hazır', { canvas })
  
  // Loading'i tamamla - Token/room işlemleri bitti!
  loadingStep.value = 'ready'
  loadingProgress.value = '100%'
  loadingProgressText.value = 'Hazır!'
  
  console.log('🚀 Loading tamamlanıyor, component render ediliyor...')
  
  // Loading overlay'i kaldır ve component'i göster
  setTimeout(() => {
    console.log('✅ isReady = true yapılıyor...')
    isReady.value = true
    
    // Component'i görünür yap
    const whiteboardComponent = document.querySelector('.netless-whiteboard')
    if (whiteboardComponent) {
      console.log('🎨 Whiteboard component bulundu, görünür yapılıyor...')
      whiteboardComponent.style.position = 'relative'
      whiteboardComponent.style.top = '0'
      whiteboardComponent.style.left = '0'
    } else {
      console.log('❌ Whiteboard component bulunamadı!')
    }
  }, 1000)
}

const handleCanvasError = (error) => {
  canvasError.value = error
  props.logger.error('Whiteboard canvas hatası', error)
  
  // Hata durumunda loading'i kaldır ve hata mesajı göster
  loadingStatus.value = 'Hata oluştu!'
  loadingProgressText.value = 'Bağlantı hatası!'
}
</script>

<style scoped>
.whiteboard-layout {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

/* Loading Overlay - Proje açılış loading UI'ı ile aynı */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-primary, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  color: var(--text-primary, #212529);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 400px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--border-color, #dee2e6);
  border-top: 4px solid var(--accent, #1971c2);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

/* Progress Bar */
.progress-container {
  width: 100%;
  max-width: 300px;
  margin: 20px auto;
}

.progress-bar {
  width: 100%;
  height: 6px;
  margin-bottom: 8px;
  background: var(--border-color, #dee2e6);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent, #1971c2);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary, #6c757d);
  font-weight: 500;
}

/* Loading Status */
.loading-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-secondary, #6c757d);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.status-item.active {
  opacity: 1;
  background: var(--bg-secondary, #f8f9fa);
  color: var(--accent, #1971c2);
  transform: scale(1.02);
}

.status-item.completed {
  opacity: 0.8;
  color: var(--success, #2f9e44);
}

.status-icon {
  font-size: 18px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-content h3 {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
}

.loading-content p {
  margin: 0;
  font-size: 16px;
  color: var(--text-secondary, #6c757d);
}
</style>
