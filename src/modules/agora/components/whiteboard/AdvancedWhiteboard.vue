<template>
  <div class="advanced-whiteboard">
    <!-- Loading State - Temiz Loading UI -->
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
            <span class="status-icon">🎨</span>
            <span>Whiteboard Hazırlanıyor</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Header Info Bar -->
    <div v-if="isReady" class="header-info-bar">
      <!-- Connection Status -->
      <div class="status-badge connection-status" :class="connectionStatus">
        <div class="status-dot"></div>
        <span class="status-text">{{ getStatusText() }}</span>
      </div>
      
      <!-- Toolbar Toggle Button - Header'da -->
      <button 
        @click="toggleToolbar" 
        class="toolbar-toggle-btn"
        :title="isToolbarCollapsed ? 'Kontrolleri Aç' : 'Kontrolleri Gizle'"
      >
        <!-- Yukarı yönlü icon (açık durumda - gizle) -->
        <svg 
          v-if="!isToolbarCollapsed"
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path d="M6 15l6-6 6 6"/>
        </svg>
        
        <!-- Aşağı yönlü icon (kapalı durumda - aç) -->
        <svg 
          v-else
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>
      
      <!-- Member Count -->
      <div class="status-badge member-count" v-if="memberCount > 0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span class="member-text">{{ memberCount }} katılımcı</span>
      </div>
    </div>

    <!-- Professional Toolbar -->
    <div v-if="isReady" class="whiteboard-toolbar" :class="{ 'collapsed': isToolbarCollapsed }">
      <!-- Left Tools - Drawing Tools -->
      <div class="toolbar-section">
        <div class="tool-group">
          <!-- Selector -->
          <button 
            @click="selectTool('selector')" 
            class="tool-btn" 
            :class="{ active: currentTool === 'selector' }" 
            title="Seçim Aracı (V)"
          >
            <CursorArrowRaysIcon class="tool-icon" />
          </button>

          <!-- Pencil -->
          <button 
            @click="selectTool('pencil')" 
            class="tool-btn" 
            :class="{ active: currentTool === 'pencil' }" 
            title="Kalem (P)"
          >
            <PencilIcon class="tool-icon" />
          </button>

          <!-- Text -->
          <button 
            @click="selectTool('text')" 
            class="tool-btn" 
            :class="{ active: currentTool === 'text' }"
            title="Metin (T)"
          >
            <DocumentTextIcon class="tool-icon" />
          </button>

          <!-- Eraser -->
          <button 
            @click="selectTool('eraser')" 
            class="tool-btn" 
            :class="{ active: currentTool === 'eraser' }"
            title="Silgi (E)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13L11 20L4 13L11 6L18 13Z"/>
              <path d="M22 22L16 16"/>
              <path d="M8 6L2 12L8 18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Shapes Section -->
      <div class="toolbar-section">
        <div class="tool-group">
          <!-- Rectangle -->
          <button 
            @click="selectTool('rectangle')" 
            class="tool-btn" 
            :class="{ active: currentTool === 'rectangle' }"
            title="Dikdörtgen (R)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            </svg>
          </button>

          <!-- Circle -->
          <button 
            @click="selectTool('ellipse')" 
            class="tool-btn" 
            :class="{ active: currentTool === 'ellipse' }"
            title="Daire (C)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </button>

          <!-- Triangle -->
          <button 
            @click="selectTool('triangle')" 
            class="tool-btn" 
            :class="{ active: currentTool === 'triangle' }"
            title="Üçgen (T)"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L22 20H2L12 2Z"/>
            </svg>
          </button>

          <!-- Line -->
          <button 
            @click="selectTool('line')" 
            class="tool-btn" 
            :class="{ active: currentTool === 'line' }"
            title="Çizgi (L)"
          >
            <MinusIcon class="tool-icon" />
          </button>

          <!-- Arrow -->
          <button 
            @click="selectTool('arrow')" 
            class="tool-btn" 
            :class="{ active: currentTool === 'arrow' }"
            title="Ok (A)"
          >
            <ArrowLongRightIcon class="tool-icon" />
          </button>
        </div>
      </div>

      <!-- Style Controls - Compact -->
      <div class="toolbar-section style-section">
        <div class="style-controls">
          <!-- Color Picker - Compact with Dropdown -->
          <div class="color-control-compact">
            <div class="color-picker-wrapper">
              <button 
                @click="toggleColorPalette" 
                class="color-picker-toggle"
                :title="isColorPaletteOpen ? 'Renk Paletini Kapat' : 'Renk Paletini Aç'"
              >
                <div class="current-color-display" :style="{ backgroundColor: currentColor }"></div>
                <svg 
                  :class="{ 'rotated': isColorPaletteOpen }"
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  stroke-width="2"
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              
              <!-- Color Palette Dropdown -->
              <div v-if="isColorPaletteOpen" class="color-palette-dropdown">
                <div class="color-palette-content">
                  <div class="color-palette-header">
                    <span>Renk Seç</span>
                    <button @click="toggleColorPalette" class="close-palette-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  
                  <!-- Custom Color Picker -->
                  <div class="custom-color-section">
                    <label>Özel Renk:</label>
                    <input 
                      type="color" 
                      v-model="currentColor" 
                      @input="updateColor"
                      class="custom-color-picker"
                      title="Özel Renk Seç"
                    />
                  </div>
                  
                  <!-- Color Presets Grid -->
                  <div class="color-presets-grid">
                    <button 
                      v-for="color in colorPresets" 
                      :key="color"
                      @click="selectColor(color)"
                      class="color-preset-btn"
                      :style="{ backgroundColor: color }"
                      :title="color"
                      :class="{ active: currentColor === color }"
                    ></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stroke Width - Compact -->
          <div class="stroke-control-compact">
            <button 
              @click="decreaseStrokeWidth" 
              class="stroke-btn decrease"
              title="Kalınlığı Azalt"
              :disabled="currentStrokeWidth <= 1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14"/>
              </svg>
            </button>
            
            <input type="range" min="1" max="20" v-model="currentStrokeWidth" @input="updateStrokeWidth" class="stroke-slider-compact" title="Kalınlık"/>
            
            <button 
              @click="increaseStrokeWidth" 
              class="stroke-btn increase"
              title="Kalınlığı Artır"
              :disabled="currentStrokeWidth >= 20"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
            
            <span class="stroke-value-compact">{{ currentStrokeWidth }}px</span>
          </div>
        </div>
      </div>

      <!-- Right Controls -->
      <div class="toolbar-section">
        <div class="control-group">
          <!-- Undo/Redo -->
          <button @click="undo" class="control-btn" title="Geri Al (Ctrl+Z)" :disabled="!canUndo">
            <ArrowUturnLeftIcon class="control-icon" />
          </button>
          
          <button @click="redo" class="control-btn" title="Yinele (Ctrl+Y)" :disabled="!canRedo">
            <ArrowPathIcon class="control-icon" />
          </button>

          <!-- Clear Canvas -->
          <button @click="clearCanvas" class="control-btn danger" title="Temizle">
            <TrashIcon class="control-icon" />
          </button>

          <!-- Theme Toggle -->
          <button @click="toggleTheme" class="control-btn" :title="isDarkTheme ? 'Açık Tema' : 'Koyu Tema'">
            <SunIcon v-if="!isDarkTheme" class="control-icon" />
            <MoonIcon v-else class="control-icon" />
          </button>
        </div>
      </div>
    </div>

    <!-- Main Canvas Area -->
    <div class="canvas-container" :class="{ fullscreen: isFullscreen }">
      <!-- Netless Container -->
      <div 
        ref="netlessContainer" 
        class="netless-container"
        :class="{ 'with-toolbar': !isToolbarCollapsed }"
      ></div>
    </div>

    <!-- Bottom Info Bar -->
    <div class="info-bar">
      <div class="room-info">
        <span class="room-label">Oda:</span>
        <span class="room-name">{{ roomInfo?.uuid || 'Yükleniyor...' }}</span>
      </div>
      
      <div class="tool-info">
        <span class="tool-label">Araç:</span>
        <span class="tool-name">{{ getToolDisplayName(currentTool) }}</span>
      </div>
      
      <div class="user-info">
        <span class="user-label">Kullanıcı:</span>
        <span class="user-name">{{ currentUserName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useNetlessWhiteboard } from '../../composables/index.js'
import { useAgoraStore } from '../../store/index.js'
import { NETLESS_CONFIG } from '../../constants.js'
import { netlessService } from '../../services/index.js'
import { 
  CursorArrowRaysIcon,
  PencilIcon,
  SwatchIcon,
  DocumentTextIcon,
  PencilSquareIcon, // Eraser yerine
  RectangleStackIcon,
  CircleStackIcon,
  PlayIcon,
  MinusIcon,
  ArrowLongRightIcon,
  HandRaisedIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  TrashIcon,
  SunIcon,
  MoonIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/vue/24/outline'

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

// Netless Whiteboard Composable
const {
  fastboard,
  room,
  isConnecting,
  isConnected,
  connectionError,
  members,
  currentTool: netlessTool,
  currentColor: netlessColor,
  currentStrokeWidth: netlessStrokeWidth,
  canDraw,
  memberCount,
  connectionStatus,
  roomInfo,
  joinRoom,
  leaveRoom,
  setTool,
  setStrokeColor,
  setStrokeWidth,
  undo,
  redo,
  clearScene,
  setTheme,
  cleanup
} = useNetlessWhiteboard(agoraStore)

// State
const isReady = ref(false)
const loadingStatus = ref('Container hazırlanıyor...')
const loadingStep = ref('container')
const loadingProgress = ref('25%')
const loadingProgressText = ref('Container hazırlanıyor...')
const netlessContainer = ref(null)
const isShapeMenuOpen = ref(false)
const isDarkTheme = ref(true) // Varsayılan gece modu
const isToolbarCollapsed = ref(false) // Toolbar'ın geniş/daraltılma durumu
const isColorPaletteOpen = ref(false) // Renk paleti açık/kapalı durumu

// Tool State
const currentTool = ref('pencil')
const currentColor = ref('#ff0000') // Varsayılan kırmızı
const currentStrokeWidth = ref(2)

// Color Presets
const colorPresets = [
  '#1e1e1e', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
  '#008000', '#000080', '#800000', '#808000', '#008080'
]

// Computed
const currentUserName = computed(() => {
  return agoraStore.localUser?.name || 'Anonim Kullanıcı'
})

const canUndo = computed(() => {
  return room.value && room.value.isWritable
})

const canRedo = computed(() => {
  return room.value && room.value.isWritable
})

// Methods
const selectTool = async (tool) => {
  console.log('🎨 Tool seçiliyor:', tool)
  console.log('🔍 Room durumu:', {
    hasRoom: !!room.value,
    isWritable: room.value?.isWritable,
    phase: room.value?.phase
  })
  
  currentTool.value = tool
  props.logger.info('Tool seçildi', { tool })
  
  if (room.value && room.value.isWritable) {
    try {
      console.log('✅ Room yazılabilir, tool set ediliyor...')
      await setTool(tool)
      props.logger.info('Netless tool set edildi', { tool })
      console.log('✅ Tool başarıyla set edildi:', tool)
    } catch (error) {
      console.error('❌ Tool set hatası:', error)
      props.logger.error('Tool set hatası', { tool, error: error.message })
    }
  } else {
    console.warn('⚠️ Room yazılabilir değil veya yok')
  }
}

const updateStrokeWidth = async () => {
  try {
    await setStrokeWidth(currentStrokeWidth.value)
  } catch (error) {
    console.error('Kalınlık güncelleme hatası:', error)
  }
}

const increaseStrokeWidth = async () => {
  if (currentStrokeWidth.value < 20) {
    currentStrokeWidth.value++
    await updateStrokeWidth()
  }
}

const decreaseStrokeWidth = async () => {
  if (currentStrokeWidth.value > 1) {
    currentStrokeWidth.value--
    await updateStrokeWidth()
  }
}

const updateColor = async (event) => {
  const color = event.target.value
  console.log('🎨 Renk güncelleniyor:', color)
  
  // RGB değerlerini hesapla
  const rgb = [
    parseInt(color.substr(1, 2), 16),
    parseInt(color.substr(3, 2), 16),
    parseInt(color.substr(5, 2), 16)
  ]
  console.log('🔴 RGB değerleri:', rgb)
  
  currentColor.value = color
  
  if (room.value && room.value.isWritable) {
    try {
      console.log('✅ Room yazılabilir, renk güncelleniyor...')
      console.log('🔍 Room member state öncesi:', room.value.state?.memberState)
      
      await setStrokeColor(color)
      
      console.log('🔍 Room member state sonrası:', room.value.state?.memberState)
      props.logger.info('Renk güncellendi', { color })
      console.log('✅ Renk başarıyla güncellendi:', color)
      
      // Test çizimi yap
      console.log('🧪 Test çizimi yapılıyor...')
      
    } catch (error) {
      console.error('❌ Renk güncelleme hatası:', error)
      props.logger.error('Renk güncelleme hatası', { color, error: error.message })
    }
  } else {
    console.warn('⚠️ Room yazılabilir değil veya yok')
  }
}

const selectColor = async (color) => {
  console.log('🎨 Hazır renk seçildi:', color)
  currentColor.value = color
  await updateColor({ target: { value: color } })
}

const toggleShapeMenu = () => {
  isShapeMenuOpen.value = !isShapeMenuOpen.value
}

const clearCanvas = async () => {
  console.log('🗑️ Canvas temizleniyor...')
  
  if (room.value && room.value.isWritable) {
    try {
      console.log('✅ Room yazılabilir, canvas temizleniyor...')
      await clearScene()
      props.logger.info('Canvas temizlendi')
      console.log('✅ Canvas başarıyla temizlendi')
    } catch (error) {
      console.error('❌ Canvas temizleme hatası:', error)
      props.logger.error('Canvas temizleme hatası', { error: error.message })
    }
  } else {
    console.warn('⚠️ Room yazılabilir değil veya yok')
  }
}

const toggleTheme = async () => {
  try {
    const newTheme = isDarkTheme.value ? 'light' : 'dark'
    await setTheme(newTheme)
    
    // State'i güncelle
    isDarkTheme.value = newTheme === 'dark'
    
    // SADECE whiteboard component'inin data-whiteboard-theme attribute'unu güncelle
    // Ana projenin data-theme attribute'unu ETKİLEME!
    const whiteboardComponent = document.querySelector('.advanced-whiteboard')
    if (whiteboardComponent) {
      if (newTheme === 'dark') {
        whiteboardComponent.setAttribute('data-whiteboard-theme', 'dark')
      } else {
        whiteboardComponent.removeAttribute('data-whiteboard-theme')
      }
    }
    
    console.log('✅ Whiteboard teması başarıyla değiştirildi:', newTheme, 'isDarkTheme:', isDarkTheme.value)
  } catch (error) {
    console.error('Tema değiştirme hatası:', error)
  }
}

const toggleToolbar = () => {
  isToolbarCollapsed.value = !isToolbarCollapsed.value
  console.log('Toolbar durumu değiştirildi:', isToolbarCollapsed.value)
}

const toggleColorPalette = () => {
  isColorPaletteOpen.value = !isColorPaletteOpen.value
}

const getStatusText = () => {
  switch (connectionStatus.value) {
    case 'connecting': return 'Bağlanıyor...'
    case 'connected': return 'Bağlı'
    case 'error': return 'Hata!'
    default: return 'Bağlantı yok'
  }
}

const getToolDisplayName = (tool) => {
  const toolNames = {
    selector: 'Seçim',
    pencil: 'Kalem',
    highlighter: 'Fosforlu',
    rectangle: 'Dikdörtgen',
    ellipse: 'Daire',
    triangle: 'Üçgen',
    line: 'Çizgi',
    arrow: 'Ok',
    text: 'Metin',
    eraser: 'Silgi',
    laserPointer: 'Lazer',
    hand: 'El'
  }
  return toolNames[tool] || tool
}

// Connect to Netless
const connectToNetless = async () => {
  try {
    console.log('🚀 AdvancedWhiteboard Netless\'e bağlanıyor...')
    
    // 1. CONTAINER HAZIRLANIYOR (başlangıçta seçili)
    loadingStep.value = 'container'
    loadingProgress.value = '25%'
    loadingProgressText.value = 'Container hazırlanıyor...'
    loadingStatus.value = 'Container hazırlanıyor...'
    
    // Container hazır olduğunda kısa bir bekleme
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 2. TOKEN VE ROOM OLUŞTURULUYOR (istek gönderilirken seçili)
    loadingStep.value = 'token'
    loadingProgress.value = '50%'
    loadingProgressText.value = 'Token ve Room oluşturuluyor...'
    loadingStatus.value = 'Token ve Room oluşturuluyor...'
    
    const userId = agoraStore.localUser?.uid || `user-${Date.now()}`
    const roomResponse = await netlessService.createRoomWithToken({
      roomName: `agora-whiteboard-${Date.now()}`,
      userId,
      role: 'writer',
      agoraInfo: {
        channelName: agoraStore.session?.videoChannelName || 'unknown',
        videoUID: agoraStore.users?.local?.video?.uid,
        userName: agoraStore.users?.local?.video?.name || userName
      }
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
    loadingProgress.value = '75%'
    loadingProgressText.value = 'Whiteboard hazırlanıyor...'
    loadingStatus.value = 'Whiteboard hazırlanıyor...'
    
    // Netless'e bağlan
    const success = await joinRoom({
      container: netlessContainer.value,
      uuid: roomResponse.uuid,
      token: roomResponse.token,
      userId: userId,
      userName: agoraStore.localUser?.name || 'Agora User'
    })
    
    console.log('🔗 joinRoom sonucu:', success)
    
    if (success) {
      loadingProgress.value = '100%'
      loadingProgressText.value = 'Hazırlanıyor...'
      console.log('✅ Room bağlantısı başarılı, hazırlanıyor...')
      
      // Room durumunu kontrol et
      console.log('🔍 Room durumu:', {
        hasRoom: !!room.value,
        isWritable: room.value?.isWritable,
        phase: room.value?.phase,
        memberCount: memberCount.value
      })
      
      await nextTick()
      isReady.value = true
      props.logger.info('Advanced whiteboard başarıyla başlatıldı')
      console.log('🎉 AdvancedWhiteboard başarıyla başlatıldı!')
    } else {
      throw new Error('Room bağlantısı başarısız')
    }
    
  } catch (error) {
    console.error('❌ AdvancedWhiteboard başlatma hatası:', error)
    props.logger.error('Advanced whiteboard başlatma hatası', { error: error.message })
    loadingStatus.value = `Hata: ${error.message}`
    loadingProgressText.value = 'Bağlantı hatası!'
  }
}

// Keyboard shortcuts
const setupKeyboardShortcuts = () => {
  const handleKeyDown = (event) => {
    // ESC: Tam ekrandan çık
    if (event.key === 'Escape' && isToolbarCollapsed.value) {
      event.preventDefault()
      toggleToolbar()
    }
    
    // Ctrl/Cmd + Z: Undo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
      event.preventDefault()
      if (canUndo.value) undo()
    }
    
    // Ctrl/Cmd + Y: Redo
    if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
      event.preventDefault()
      if (canRedo.value) redo()
    }
    
    // Ctrl/Cmd + Shift + Z: Redo (alternative)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') {
      event.preventDefault()
      if (canRedo.value) redo()
    }
    
    // F11: Fullscreen
    if (event.key === 'F11') {
      event.preventDefault()
      // Fullscreen kaldırıldı
    }
    
    // Tool shortcuts
    switch (event.key.toLowerCase()) {
      case 'v':
        event.preventDefault()
        selectTool('selector')
        break
      case 'p':
        event.preventDefault()
        selectTool('pencil')
        break
      case 'h':
        event.preventDefault()
        selectTool('highlighter')
        break
      case 't':
        event.preventDefault()
        selectTool('text')
        break
      case 'r':
        event.preventDefault()
        selectTool('rectangle')
        break
      case 'c':
        event.preventDefault()
        selectTool('ellipse')
        break
      case 'l':
        event.preventDefault()
        selectTool('line')
        break
      case 'a':
        event.preventDefault()
        selectTool('arrow')
        break
      case 'e':
        event.preventDefault()
        selectTool('eraser')
        break
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}

// Lifecycle
onMounted(async () => {
  try {
    // Varsayılan gece modunu ayarla - SADECE whiteboard component'inde!
    // Ana projenin data-theme attribute'unu ETKİLEME!
    const whiteboardComponent = document.querySelector('.advanced-whiteboard')
    if (whiteboardComponent) {
      whiteboardComponent.setAttribute('data-whiteboard-theme', 'dark')
    }
    
    console.log('🌙 Whiteboard varsayılan gece modu ayarlandı')
    
    // Loading'i başlat ve room/token işlemlerini yap
    await connectToNetless()
    
    // Keyboard shortcuts'ları ayarla
    const cleanupShortcuts = setupKeyboardShortcuts()
    
    // Component unmount olduğunda cleanup yap
    onUnmounted(() => {
      cleanupShortcuts()
    })
  } catch (error) {
    console.error('❌ Component mount hatası:', error)
  }
})

onUnmounted(() => {
  props.logger.info('Advanced whiteboard component unmounted')
  cleanup()
})

// Close shape menu when clicking outside
const closeShapeMenu = (event) => {
  if (!event.target.closest('.tool-dropdown')) {
    isShapeMenuOpen.value = false
  }
}

// Close color palette when clicking outside
const closeColorPalette = (event) => {
  if (!event.target.closest('.color-picker-wrapper')) {
    isColorPaletteOpen.value = false
  }
}

// Global click listener
onMounted(() => {
  document.addEventListener('click', closeShapeMenu)
  document.addEventListener('click', closeColorPalette)
})

onUnmounted(() => {
  document.removeEventListener('click', closeShapeMenu)
  document.removeEventListener('click', closeColorPalette)
})
</script>

<style scoped>
.advanced-whiteboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--whiteboard-bg, #f8f9fa);
  color: var(--whiteboard-text, #495057);
}

/* CSS Variables for Theme - SADECE WHITEBOARD COMPONENT'İ İÇİN */
.advanced-whiteboard {
  /* Light Theme (Varsayılan) */
  --whiteboard-bg: #f8f9fa;
  --whiteboard-text: #495057;
  --whiteboard-border: #e9ecef;
  --whiteboard-toolbar-bg: #ffffff;
  --whiteboard-toolbar-border: #dee2e6;
  --whiteboard-canvas-bg: #ffffff;
}

/* Dark Theme - SADECE WHITEBOARD COMPONENT'İ İÇİN */
.advanced-whiteboard[data-whiteboard-theme="dark"] {
  --whiteboard-bg: #1a1a1a;
  --whiteboard-text: #ffffff;
  --whiteboard-border: #333333;
  --whiteboard-toolbar-bg: #2d2d2d;
  --whiteboard-toolbar-border: #404040;
  --whiteboard-canvas-bg: #1a1a1a;
}

/* Toolbar Styles */
.whiteboard-toolbar {
  position: fixed;
  top: 40px; /* Header yüksekliği kadar margin */
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--whiteboard-toolbar-bg, #ffffff);
  border-bottom: 1px solid var(--whiteboard-border, #e9ecef);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 1000;
  gap: 16px;
  height: 56px;
  min-height: 56px;
  transition: height 0.3s ease;
}

.whiteboard-toolbar.collapsed {
  height: 0; /* Toolbar'ı tamamen gizle */
  min-height: 0;
  padding: 0;
  overflow: hidden;
  border: none;
  box-shadow: none;
}

.whiteboard-toolbar.collapsed .toolbar-section {
  opacity: 0;
  transform: translateY(-20px);
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Toolbar açılırken güzel efekt */
.whiteboard-toolbar:not(.collapsed) .toolbar-section {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Toggle button hover efekti */
.toolbar-toggle-btn:hover {
  background: var(--whiteboard-bg, #f8f9fa);
  border-color: var(--whiteboard-border, #adb5bd);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.toolbar-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--whiteboard-border, #dee2e6);
  border-radius: 6px;
  background: var(--whiteboard-toolbar-bg, #ffffff);
  color: var(--whiteboard-text, #495057);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--whiteboard-border, #dee2e6);
  border-radius: 8px;
  background: var(--whiteboard-toolbar-bg, #ffffff);
  color: var(--whiteboard-text, #495057);
  cursor: pointer;
  transition: all 0.2s;
  position: relative; /* Shortcut için relative */
}

.tool-btn:hover {
  background: var(--whiteboard-bg, #f8f9fa);
  border-color: var(--whiteboard-border, #adb5bd);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tool-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0,123,255,0.3);
}

/* Shape Menu */
.shape-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px 0;
  min-width: 150px;
  z-index: 1001;
}

.shape-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  transition: background 0.2s;
}

.shape-option:hover {
  background: #f8f9fa;
}

/* Style Section - Compact */
.style-section {
  flex: 1;
  justify-content: center;
  max-width: 400px;
}

.style-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  justify-content: center;
}

/* Responsive adjustments for style section */
@media (max-width: 1200px) {
  .style-section {
    max-width: 350px;
  }
  
  .style-controls {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .style-section {
    max-width: 100%;
    order: 3; /* Mobile'da en alta taşı */
  }
  
  .style-controls {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
  
  .color-control-compact,
  .stroke-control-compact {
    width: 100%;
    justify-content: center;
  }
}

/* Color Control - Compact */
.color-control-compact {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker-wrapper {
  position: relative;
  width: 28px;
  height: 28px;
}

.color-picker-toggle {
  width: 100%;
  height: 100%;
  border: 2px solid var(--whiteboard-border, #dee2e6);
  border-radius: 6px;
  cursor: pointer;
  background: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.current-color-display {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
}

.color-palette-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--whiteboard-toolbar-bg, #ffffff);
  border: 1px solid var(--whiteboard-border, #dee2e6);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 12px;
  min-width: 200px;
  z-index: 1002;
  margin-top: 4px;
  transform-origin: top left;
  animation: dropdownSlideIn 0.3s ease forwards;
}

@keyframes dropdownSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Dropdown arrow indicator */
.color-palette-dropdown::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 20px;
  width: 12px;
  height: 12px;
  background: var(--whiteboard-toolbar-bg, #ffffff);
  border-left: 1px solid var(--whiteboard-border, #dee2e6);
  border-top: 1px solid var(--whiteboard-border, #dee2e6);
  transform: rotate(45deg);
}

/* Toggle button arrow rotation */
.color-picker-toggle svg {
  position: absolute;
  right: 4px;
  bottom: 4px;
  transition: transform 0.3s ease;
}

.color-picker-toggle svg.rotated {
  transform: rotate(180deg);
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .whiteboard-toolbar {
    gap: 12px;
    padding: 6px 12px;
  }
  
  .style-section {
    max-width: 350px;
  }
  
  .style-controls {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .whiteboard-toolbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    height: auto;
    min-height: auto;
  }
  
  .toolbar-section {
    width: 100%;
    justify-content: center;
  }
  
  .tool-group {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .style-section {
    max-width: 100%;
    order: 3; /* Mobile'da en alta taşı */
  }
  
  .style-controls {
    flex-direction: column;
    gap: 16px;
    align-items: center;
    width: 100%;
  }
  
  .color-control-compact,
  .stroke-control-compact {
    width: 100%;
    justify-content: center;
  }
  
  .control-group {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .info-bar {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  
  /* Mobilde renk paleti ekranın tam ortasında olsun */
  .color-palette-dropdown {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent; /* Siyahlık yok */
    margin: 0;
    padding: 20px;
    border: none;
    border-radius: 0;
    min-width: auto;
    max-width: none;
    max-height: none;
    overflow: visible;
    z-index: 10000; /* En üstte olsun */
  }
  
  .color-palette-dropdown::before {
    display: none; /* Mobile'da arrow gösterme */
  }
  
  /* Mobilde palette content'i ortala */
  .color-palette-content {
    background: var(--whiteboard-toolbar-bg, #ffffff);
    border: 1px solid var(--whiteboard-border, #dee2e6);
    border-radius: 12px;
    padding: 24px;
    min-width: 320px;
    max-width: 90vw;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  .color-presets-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
    padding: 16px 0;
  }
  
  .color-preset-btn {
    width: 36px;
    height: 36px;
  }
  
  .custom-color-picker {
    height: 36px;
  }
}

@media (max-width: 480px) {
  .tool-btn {
    width: 32px;
    height: 32px;
  }
  
  .control-btn {
    width: 28px;
    height: 28px;
  }
  
  .color-picker-wrapper {
    width: 32px;
    height: 32px;
  }
  
  /* Mobilde palette content'i daha büyük */
  .color-palette-content {
    min-width: 280px;
    padding: 20px;
    max-height: 85vh;
  }
  
  .color-presets-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }
  
  .color-preset-btn {
    width: 40px;
    height: 40px;
  }
  
  .custom-color-picker {
    height: 40px;
  }
  
  .stroke-slider-compact {
    width: 60px;
  }
  
  /* Mobilde toolbar daha kompakt */
  .whiteboard-toolbar {
    padding: 8px;
    gap: 8px;
  }
  
  .toolbar-section {
    gap: 6px;
  }
  
  .tool-group {
    gap: 3px;
  }
}

@media (max-width: 360px) {
  /* Çok küçük ekranlarda palette content'i daha da büyük */
  .color-palette-content {
    min-width: 260px;
    padding: 16px;
    max-height: 90vh;
  }
  
  .color-presets-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  
  .color-preset-btn {
    width: 44px;
    height: 44px;
  }
  
  .custom-color-picker {
    height: 44px;
  }
  
  .tool-btn {
    width: 28px;
    height: 28px;
  }
  
  .control-btn {
    width: 24px;
    height: 24px;
  }
}

/* Color Palette */
.color-palette-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--whiteboard-border, #dee2e6);
}

.color-palette-header span {
  font-size: 14px;
  font-weight: 600;
  color: var(--whiteboard-text, #495057);
}

.close-palette-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--whiteboard-text, #495057);
  transition: color 0.2s;
}

.close-palette-btn:hover {
  color: #dc3545;
}

.custom-color-section {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--whiteboard-border, #dee2e6);
}

.custom-color-section label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--whiteboard-text, #6c757d);
}

.custom-color-picker {
  width: 100%;
  height: 28px;
  border: 2px solid var(--whiteboard-border, #dee2e6);
  border-radius: 6px;
  cursor: pointer;
  background: none;
  padding: 0;
  box-sizing: border-box; /* Input'un border'ını dahil et */
}

.color-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(24px, 1fr));
  gap: 4px;
  padding: 8px 0;
}

.color-preset-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--whiteboard-border, #dee2e6);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.color-preset-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.color-preset-btn.active {
  border: 2px solid #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.3);
}

/* Stroke Control - Compact */
.stroke-control-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.05);
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.stroke-slider-compact {
  width: 60px;
  height: 4px;
  border-radius: 2px;
  background: var(--whiteboard-border, #dee2e6);
  outline: none;
  -webkit-appearance: none;
}

.stroke-slider-compact::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #007bff;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.stroke-value-compact {
  font-size: 11px;
  color: var(--whiteboard-text, #6c757d);
  min-width: 25px;
  font-weight: 500;
}

/* Stroke Control Buttons */
.stroke-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--whiteboard-border, #dee2e6);
  border-radius: 4px;
  background: var(--whiteboard-toolbar-bg, #ffffff);
  color: var(--whiteboard-text, #495057);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.stroke-btn:hover:not(:disabled) {
  background: var(--whiteboard-bg, #f8f9fa);
  border-color: var(--whiteboard-border, #adb5bd);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stroke-btn:active:not(:disabled) {
  transform: translateY(0);
}

.stroke-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--whiteboard-bg, #f8f9fa);
}

/* Control Group */
.control-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--whiteboard-border, #dee2e6);
  border-radius: 6px;
  background: var(--whiteboard-toolbar-bg, #ffffff);
  color: var(--whiteboard-text, #495057);
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover:not(:disabled) {
  background: var(--whiteboard-bg, #f8f9fa);
  border-color: var(--whiteboard-border, #adb5bd);
  transform: translateY(-1px);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn.danger:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

/* Canvas Container */
.canvas-container {
  flex: 1;
  position: relative;
  margin-top: 96px; /* Header (40px) + Toolbar (56px) */
  background: var(--whiteboard-canvas-bg, #ffffff);
  transition: margin-top 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Loading durumunda margin'i sıfırla */
.loading-overlay ~ .canvas-container {
  margin-top: 0;
}

/* Toolbar kapandığında canvas'ı yukarı çek */
.whiteboard-toolbar.collapsed ~ .canvas-container {
  margin-top: 40px; /* Sadece header yüksekliği */
}

/* Loading Overlay - Orijinal Loading UI */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--rs-agora-gradient-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  color: var(--rs-agora-text-primary);
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
  border: 4px solid var(--rs-agora-border-primary);
  border-top: 4px solid var(--rs-agora-primary);
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
  background: var(--rs-agora-border-primary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--rs-agora-primary);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  text-align: center;
  font-size: 12px;
  color: var(--rs-agora-text-secondary);
  font-weight: 500;
}

/* Loading Status */
.loading-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
  font-size: 14px;
  color: var(--rs-agora-text-secondary);
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
  background: var(--rs-agora-surface-accent);
  color: var(--rs-agora-primary);
  transform: scale(1.02);
}

.status-item.completed {
  opacity: 0.8;
  color: var(--rs-agora-success);
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
  color: var(--rs-agora-text-primary);
}

.loading-content p {
  margin: 0;
  font-size: 16px;
  color: var(--rs-agora-text-secondary);
}

.netless-container {
  width: 100%;
  height: 100%;
  background: var(--whiteboard-canvas-bg, #ffffff);
}

.netless-container.with-toolbar {
  height: calc(100% - 56px);
}

/* Netless SDK Generated Elements - Full Screen Support */
.netless-container :deep(.netless-window-manager-wrapper) {
  width: 100% !important;
  height: 100% !important;
}

/* Header Info Bar */
.header-info-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: var(--whiteboard-toolbar-bg, #ffffff);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--whiteboard-border, #e9ecef);
  display: flex;
  align-items: center; /* Dikey olarak ortala */
  justify-content: flex-start; /* Sola yasla */
  padding: 0 20px;
  z-index: 2000;
  pointer-events: none; /* Canvas ile etkileşimi engelle */
}

/* Header'da toggle button'ı ortala */
.header-info-bar .toolbar-toggle-btn {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto; /* Button'a tıklanabilir yap */
}

/* Header'da badge'leri daha iyi ortalayacak */
.header-info-bar .status-badge {
  margin: 0 10px; /* Badge'ler arasında boşluk */
  pointer-events: auto; /* Badge'lere tıklanabilir yap */
  align-self: center; /* Dikey olarak ortala */
}

/* Connection status'u sola, member count'u sağa yasla */
.header-info-bar .connection-status {
  margin-left: 0;
  margin-right: auto;
}

.header-info-bar .member-count {
  margin-left: auto;
  margin-right: 0;
}

/* Status Badges */
.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;
  pointer-events: auto; /* Badge'lere tıklanabilir yap */
  border: 1px solid transparent;
}

.status-badge.connection-status {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.2);
}

.status-badge.connection-status.connected {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.2);
}

.status-badge.connection-status.connecting {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.2);
}

.status-badge.connection-status.error {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.status-badge.member-count {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border-color: rgba(107, 114, 128, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.status-text {
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

.member-text {
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

/* Fullscreen'de header'ı gizle */
.canvas-container.fullscreen ~ .header-info-bar {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

/* Fullscreen'de toolbar'ı gizle */
.canvas-container.fullscreen ~ .whiteboard-toolbar {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

/* Connection Status */
.connection-status {
  position: absolute;
  
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--whiteboard-toolbar-bg, #ffffff);
  border: 1px solid var(--whiteboard-border, #e9ecef);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  font-size: 12px;
  color: var(--whiteboard-text, #6c757d);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6c757d;
}

.connection-status.connecting .status-dot {
  background: #ffc107;
}

.connection-status.connected .status-dot {
  background: #28a745;
}

.connection-status.error .status-dot {
  background: #dc3545;
}

/* Member Count */
.member-count {
  position: absolute;

  left: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0,0,0,0.7);
  color: white;
  border-radius: 16px;
  font-size: 12px;
}

/* Info Bar */
.info-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--whiteboard-toolbar-bg, #ffffff);
  border-top: 1px solid var(--whiteboard-border, #e9ecef);
  font-size: 12px;
  color: var(--whiteboard-text, #6c757d);
}

.room-info, .tool-info, .user-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.room-label, .tool-label, .user-label {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-size: 11px;
}

.room-name, .tool-name, .user-name {
  color: var(--whiteboard-text, #495057);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 1200px) {
  .whiteboard-toolbar {
    gap: 12px;
    padding: 6px 12px;
  }
  
  .style-section {
    max-width: 300px;
  }
  
  .color-presets-compact {
    max-width: 150px;
  }
}

@media (max-width: 768px) {
  .whiteboard-toolbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    height: auto;
    min-height: auto;
  }
  
  .toolbar-section {
    width: 100%;
    justify-content: center;
  }
  
  .tool-group {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .style-section {
    max-width: 100%;
  }
  
  .style-controls {
    flex-direction: column;
    gap: 12px;
  }
  
  .control-group {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .info-bar {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .tool-btn {
    width: 28px;
    height: 28px;
  }
  
  .control-btn {
    width: 24px;
    height: 24px;
  }
  
  .color-picker-compact {
    width: 24px;
    height: 24px;
  }
  
  .color-preset-compact {
    width: 16px;
    height: 16px;
  }
  
  .stroke-slider-compact {
    width: 50px;
  }
}

/* Tool Icons */
.tool-icon {
  width: 18px;
  height: 18px;
  color: currentColor;
}

.control-icon {
  width: 16px;
  height: 16px;
  color: currentColor;
}
</style>
