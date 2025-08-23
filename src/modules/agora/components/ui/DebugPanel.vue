<template>
  <div class="debug-panel">
    <div class="debug-header">
      <h3>🎨 Whiteboard Debug Panel</h3>
      <div class="debug-controls">
        <button @click="refreshData" class="refresh-btn" title="Refresh Data">
          🔄
        </button>
        <button @click="togglePanel" class="toggle-btn">
          {{ isOpen ? '▼' : '▲' }}
        </button>
      </div>
    </div>
    
    <div v-if="isOpen" class="debug-content">
      <!-- Whiteboard Store Verileri -->
      <div class="debug-section">
        <h4>📊 Whiteboard Store Verileri</h4>
        

        
        <!-- Channel Whiteboard Rooms -->
        <div class="debug-item">
          <strong>Channel Whiteboard Rooms:</strong>
          <pre>{{ JSON.stringify(channelWhiteboardRooms, null, 2) }}</pre>
        </div>
        
        <!-- Current Channel -->
        <div class="debug-item">
          <strong>Current Channel:</strong>
          <span>{{ currentChannel || 'None' }}</span>
        </div>
        
        <!-- Whiteboard Active -->
        <div class="debug-item">
          <strong>Whiteboard Active:</strong>
          <span :class="{ 'active': isWhiteboardActive }">{{ isWhiteboardActive ? '✅ Yes' : '❌ No' }}</span>
        </div>
        

      </div>
      
      <!-- Whiteboard RTM Durumu -->
      <div class="debug-section">
        <h4>📡 Whiteboard RTM Durumu</h4>
        
        <div class="debug-item">
          <strong>RTM Connected:</strong>
          <span :class="{ 'connected': rtmConnected }">{{ rtmConnected ? '✅ Yes' : '❌ No' }}</span>
        </div>
        
        <div class="debug-item">
          <strong>Channel Subscribed:</strong>
          <span :class="{ 'subscribed': channelSubscribed }">{{ channelSubscribed ? '✅ Yes' : '❌ No' }}</span>
        </div>
        
        <!-- RTM Whiteboard Messages -->
        <div class="debug-item">
          <strong>RTM Whiteboard Messages:</strong>
          <pre>{{ JSON.stringify({
            isConnected: agoraStore.clients?.rtm?.isConnected,
            isChannelJoined: agoraStore.clients?.rtm?.isChannelJoined,
            currentChannelName: agoraStore.clients?.rtm?.currentChannelName,
            connectionState: agoraStore.clients?.rtm?.connectionState,
            lastWhiteboardMessage: lastWhiteboardMessage
          }, null, 2) }}</pre>
        </div>
      </div>
      
      <!-- Son Güncelleme -->
      <div class="debug-section">
        <h4>⏰ Son Güncelleme</h4>
        <div class="debug-item">
          <strong>Last Update:</strong>
          <span>{{ lastUpdate }}</span>
        </div>
      </div>
      
      <!-- Hata Durumu -->
      <div class="debug-section">
        <h4>⚠️ Whiteboard Hata Durumu</h4>
        <div class="debug-item">
          <strong>Store Access:</strong>
          <span :class="{ 'error': hasStoreErrors }">{{ hasStoreErrors ? '❌ Errors' : '✅ OK' }}</span>
        </div>
        <div v-if="storeErrors.length > 0" class="debug-item">
          <strong>Errors:</strong>
          <pre class="error-log">{{ storeErrors.join('\n') }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAgoraStore } from '../../store/agora.js'
import { rtmService } from '../../services/rtmService.js'

// Props
const props = defineProps({
  position: {
    type: String,
    default: 'top-right' // top-right, top-left, bottom-right, bottom-left
  }
})

// Store
const agoraStore = useAgoraStore()

// Local state
const isOpen = ref(true)
const lastUpdate = ref(new Date().toLocaleTimeString())
const storeErrors = ref([])
const hasStoreErrors = computed(() => storeErrors.value.length > 0)
const lastWhiteboardMessage = ref('No messages yet')

// Computed
const channelWhiteboardRooms = computed(() => {
  // Store'dan channel whiteboard rooms'ları al
  const rooms = agoraStore.session?.channelWhiteboardRooms
  
  if (!rooms || typeof rooms.entries !== 'function') {
    return []
  }
  
  try {
    return Array.from(rooms.entries()).map(([channel, room]) => ({
      channel,
      room: {
        uuid: room?.uuid || 'N/A',
        name: room?.name || 'N/A',
        memberCount: room?.memberCount || 0,
        createdAt: room?.createdAt || 'N/A',
        isActive: room?.isActive || false
      }
    }))
  } catch (error) {
    console.error('🔍 DEBUG: Error parsing channelWhiteboardRooms:', error)
    return []
  }
})

const currentChannel = computed(() => {
  // Store'dan channel bilgilerini al
  const videoChannel = agoraStore.videoChannelName
  const rtmChannel = agoraStore.clients?.rtm?.currentChannelName
  const sessionChannel = agoraStore.session?.videoChannelName
  
  const channel = videoChannel || rtmChannel || sessionChannel || 'None'
  
  return channel
})

const isWhiteboardActive = computed(() => {
  try {
    return agoraStore.isWhiteboardActive || false
  } catch (error) {
    console.error('🔍 DEBUG: Error getting isWhiteboardActive:', error)
    return false
  }
})

const rtmConnected = computed(() => {
  // Store'dan RTM bağlantı durumunu al
  const connected = agoraStore.clients?.rtm?.isConnected || false
  return connected
})

const channelSubscribed = computed(() => {
  // Store'dan RTM channel durumunu al
  const subscribed = agoraStore.clients?.rtm?.isChannelJoined || false
  return subscribed
})

// Methods
const togglePanel = () => {
  isOpen.value = !isOpen.value
}

const refreshData = () => {
  lastUpdate.value = new Date().toLocaleTimeString()
  storeErrors.value = []
  
  console.log('🎨 WHITEBOARD DEBUG: Manual refresh triggered at:', lastUpdate.value)
  
  try {
    console.log('🎨 WHITEBOARD DEBUG: Current whiteboard store state:', {
      whiteboardRoom: agoraStore.whiteboardRoom,
      isWhiteboardConnected: agoraStore.isWhiteboardConnected,
      whiteboardClient: agoraStore.whiteboardClient,
      whiteboardTools: agoraStore.whiteboardTools,
      channelWhiteboardRooms: agoraStore.session?.channelWhiteboardRooms
    })
  } catch (error) {
    const errorMsg = `Whiteboard store access error: ${error.message}`
    storeErrors.value.push(errorMsg)
    console.error('🎨 WHITEBOARD DEBUG:', errorMsg, error)
  }
}

// Auto-refresh
let refreshInterval
onMounted(() => {
  refreshInterval = setInterval(() => {
    lastUpdate.value = new Date().toLocaleTimeString()
  }, 1000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.debug-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.refresh-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.debug-header h3 {
  margin: 0;
  font-size: 14px;
  color: #00ff88;
}

.toggle-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.debug-content {
  padding: 16px;
  max-height: calc(80vh - 60px);
  overflow-y: auto;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-section h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #00ccff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;
}

.debug-item {
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.debug-item strong {
  display: block;
  margin-bottom: 4px;
  color: #ffcc00;
}

.debug-item span {
  color: #fff;
}

.debug-item pre {
  margin: 8px 0 0 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  font-size: 11px;
  color: #00ff88;
}

/* Status colors */
.active {
  color: #00ff88 !important;
}

.connected {
  color: #00ff88 !important;
}

.subscribed {
  color: #00ff88 !important;
}

.error {
  color: #ff4444 !important;
}

.error-log {
  color: #ff6666 !important;
  background: rgba(255, 68, 68, 0.1) !important;
  border: 1px solid rgba(255, 68, 68, 0.3) !important;
}

/* Scrollbar */
.debug-content::-webkit-scrollbar {
  width: 6px;
}

.debug-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.debug-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.debug-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
