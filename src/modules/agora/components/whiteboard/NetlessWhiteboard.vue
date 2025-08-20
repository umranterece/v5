<template>
  <div class="simple-test">
    <h1>🧪 Basit Test Sayfası</h1>
    
    <div class="test-buttons">
      <button @click="testButton1" class="test-btn">
        Test Buton 1
      </button>
      
      <button @click="testButton2" class="test-btn">
        Test Buton 2
      </button>
      
      <button @click="testButton3" class="test-btn">
        Test Buton 3
      </button>
    </div>
    
    <!-- Simple Tools -->
    <div class="simple-tools">
      <button @click="selectTool('pen')" class="tool-btn" :class="{ active: activeTool === 'pen' }">
        ✏️ Kalem
      </button>
      <button @click="selectTool('eraser')" class="tool-btn" :class="{ active: activeTool === 'eraser' }">
        🧽 Silgi
      </button>
      <button @click="clearCanvas" class="tool-btn">
        🗑️ Temizle
      </button>
      <button @click="testClick" class="tool-btn">
        🧪 Test Click
      </button>
    </div>
    
    <!-- Simple Canvas -->
    <div class="canvas-area">
      <!-- Netless Container -->
      <div ref="netlessContainer" class="netless-container">
        <div class="container-info">
          <p>📦 Netless Container</p>
          <p>UUID: {{ roomInfo?.uuid || 'Yükleniyor...' }}</p>
          <p>Status: {{ connectionStatus }}</p>
        </div>
      </div>
    </div>
    
    <!-- Debug Info -->
    <div class="debug-info">
      <p>🔍 Debug: activeTool = {{ activeTool }}</p>
      <p>🔍 Debug: isDrawing = {{ isDrawing }}</p>
      <p>🔍 Debug: container = {{ !!netlessContainer ? '✅' : '❌' }}</p>
      <p>🔍 Debug: room = {{ !!room ? '✅' : '❌' }}</p>
      <p>🔍 Debug: fastboard = {{ !!fastboard ? '✅' : '❌' }}</p>
      <p>🔍 Debug: isConnected = {{ isConnected ? '✅' : '❌' }}</p>
    </div>
    
    <div class="test-result">
      <p>Son tıklanan: {{ lastClicked }}</p>
      <p>Click sayısı: {{ clickCount }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useNetlessWhiteboard } from '../../composables/useNetlessWhiteboard.js'
import { useAgoraStore } from '../../store/index.js'

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
  currentTool,
  currentColor,
  currentStrokeWidth,
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

// Basit state
const lastClicked = ref('Hiç tıklanmadı')
const clickCount = ref(0)
const activeTool = ref('pen')
const isDrawing = ref(false)
const netlessContainer = ref(null)

// Test methods
const testButton1 = () => {
  console.log('🧪 Test Button 1 tıklandı!')
  lastClicked.value = 'Test Buton 1'
  clickCount.value++
  alert('Test Buton 1 çalıştı!')
}

const testButton2 = () => {
  console.log('🧪 Test Button 2 tıklandı!')
  lastClicked.value = 'Test Buton 2'
  clickCount.value++
  alert('Test Buton 2 çalıştı!')
}

const testButton3 = () => {
  console.log('🧪 Test Button 3 tıklandı!')
  lastClicked.value = 'Test Buton 3'
  clickCount.value++
  alert('Test Buton 3 çalıştı!')
}

// Drawing methods
const selectTool = (tool) => {
  console.log('🎨 Tool seçildi:', tool)
  activeTool.value = tool
  lastClicked.value = `Tool: ${tool}`
  
  // Netless SDK'ya tool set et
  if (room.value && room.value.isWritable) {
    try {
      const netlessTool = tool === 'pen' ? 'pencil' : 'eraser'
      room.value.setAppliance(netlessTool)
      console.log('✅ Netless tool set edildi:', netlessTool)
    } catch (error) {
      console.error('❌ Netless tool set hatası:', error)
    }
  } else {
    console.log('❌ Room yok veya yazılabilir değil')
  }
}

const clearCanvas = () => {
  console.log('🗑️ Canvas temizleniyor')
  lastClicked.value = 'Canvas temizleniyor...'
  
  // Netless SDK ile temizle
  if (room.value && room.value.isWritable) {
    try {
      clearScene()
      console.log('✅ Netless canvas temizlendi')
      lastClicked.value = 'Canvas temizlendi'
    } catch (error) {
      console.error('❌ Netless clear hatası:', error)
      lastClicked.value = 'Temizleme hatası!'
    }
  } else {
    console.log('❌ Room yok veya yazılabilir değil')
    lastClicked.value = 'Room bağlı değil!'
  }
}

const startDrawing = (event) => {
  console.log('✏️ Çizim başladı')
  isDrawing.value = true
  const canvas = drawingCanvas.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = activeTool.value === 'eraser' ? '#f5f5f5' : '#000000'
    ctx.lineWidth = activeTool.value === 'eraser' ? 20 : 2
    ctx.lineCap = 'round'
  }
}

const draw = (event) => {
  if (!isDrawing.value) return
  
  const canvas = drawingCanvas.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    ctx.lineTo(x, y)
    ctx.stroke()
  }
}

const stopDrawing = () => {
  console.log('✏️ Çizim durdu')
  isDrawing.value = false
}

// Store'dan hazır room bilgilerini al ve Netless'e bağlan
const connectToNetless = async () => {
  console.log('🚀 Store\'dan room bilgileri alınıyor...')
  
  // Store'dan hazır room bilgilerini al (WhiteboardLayout'da oluşturuldu)
  const whiteboardRoom = agoraStore.whiteboardRoom
  if (!whiteboardRoom?.uuid || !whiteboardRoom?.token) {
    console.error('❌ Store\'da room bilgileri yok!', whiteboardRoom)
    lastClicked.value = 'Store\'da room bilgileri yok!'
    return
  }
  
  console.log('✅ Store\'dan room bilgileri alındı:', {
    uuid: whiteboardRoom.uuid,
    hasToken: !!whiteboardRoom.token
  })
  
  // Mevcut room'a bağlan (yeni room oluşturma yok!)
  const success = await joinRoom({
    container: netlessContainer.value,
    uuid: whiteboardRoom.uuid,
    token: whiteboardRoom.token,
    userId: agoraStore.localUser?.uid?.toString() || `agora-user-${Date.now()}`,
    userName: agoraStore.localUser?.name || 'Agora User'
  })
  
  if (success) {
    console.log('✅ Mevcut room\'a başarıyla bağlandı!')
    lastClicked.value = 'Netless bağlandı!'
  } else {
    console.error('❌ Room bağlantısı başarısız!')
    lastClicked.value = 'Bağlantı başarısız!'
  }
}

// Component mount olduğunda Netless'e bağlan
onMounted(async () => {
  console.log('🎯 Component mounted, Netless\'e bağlanılıyor...')
  
  // DOM hazır olduktan sonra bağlan
  setTimeout(async () => {
    if (netlessContainer.value) {
      console.log('✅ Container hazır, Netless\'e bağlanılıyor...')
      await connectToNetless()
    } else {
      console.error('❌ Container bulunamadı!')
    }
  }, 500)
})
</script>

<style scoped>
.simple-test {
  padding: 50px;
  text-align: center;
  background: #f5f5f5;
  min-height: 100vh;
}

.simple-test h1 {
  color: #333;
  margin-bottom: 40px;
}

.test-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 40px;
}

.test-btn {
  padding: 15px 30px;
  font-size: 18px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn:hover {
  background: #0056b3;
  transform: translateY(-2px);
}

.test-btn:active {
  transform: translateY(0);
}

.test-result {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #ddd;
  max-width: 400px;
  margin: 0 auto;
}

.test-result p {
  margin: 10px 0;
  font-size: 16px;
  color: #333;
}

.simple-tools {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 30px;
}

.tool-btn {
  padding: 12px 24px;
  font-size: 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:hover {
  background: #218838;
  transform: translateY(-1px);
}

.tool-btn.active {
  background: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
}

.canvas-area {
  margin: 30px 0;
  text-align: center;
}

.netless-container {
  width: 800px;
  height: 600px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  margin: 0 auto;
  position: relative;
}

.container-info {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 8px;
}

.container-info p {
  margin: 5px 0;
  font-size: 14px;
}

.debug-info {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 15px;
  margin: 20px 0;
  font-family: monospace;
  font-size: 12px;
}

.debug-info p {
  margin: 5px 0;
  color: #495057;
}
</style>
