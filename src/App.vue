<template>
  <div id="app">
    <div class="app-container">
      <!-- Header -->
      <header class="app-header">
        <h1>Video Conference</h1>
      </header>

      <!-- Main Content -->
      <main class="app-main">
        <!-- Video Area - Only show when connected -->
        <div v-if="isConnected" class="video-area">
          <AgoraVideo
            ref="agoraVideoRef"
            :emitter="emitter"
            :screenEmitter="screenEmitter"
            :localUser="localUser || {}"
            :remoteUsers="remoteUsers || []"
            :allUsers="allUsers || []"
            :localTracks="localTracks || {}"
            :remoteTracks="remoteTracks || new Map()"
          />
        </div>

        <!-- Controls Area -->
        <div class="controls-area">
          <AgoraControls
            :channelName="channelName"
            :isConnected="!!isConnected"
            :isLocalVideoOff="!!isLocalVideoOff"
            :isLocalAudioMuted="!!isLocalAudioMuted"
            :connectedUsersCount="connectedUsersCount || 0"
            :isJoining="!!isJoining"
            :isLeaving="!!isLeaving"
            :onJoin="handleJoin"
            :onLeave="handleLeave"
            :onToggleCamera="handleToggleCamera"
            :onToggleMicrophone="handleToggleMicrophone"
            :isScreenSharing="isScreenSharing"
            :onToggleScreenShare="toggleScreenShare"
            :supportsScreenShare="supportsScreenShare"
            :settingsOpen="settingsOpen"
            @open-settings="handleOpenSettings"
          />
        </div>
      </main>
      
      <!-- Stream Quality Bar - Temporarily disabled -->
      <!-- <StreamQualityBar
        :networkQuality="networkQuality"
        :bitrate="bitrate"
        :frameRate="frameRate"
        :packetLoss="packetLoss"
        :rtt="rtt"
        :qualityLevel="qualityLevel"
        :qualityColor="qualityColor"
        :qualityPercentage="qualityPercentage"
        :isConnected="!!isConnected"
      /> -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useMeeting, AgoraVideo, AgoraControls, StreamQualityBar, initializeAgoraModule } from './modules/agora'

// initializeAgoraModule sadece başlatma için çağrılır, destructure edilmez!
// initializeAgoraModule(pinia) // Eğer burada gerekiyorsa

// Artık AgoraControls ve StreamQualityBar doğrudan kullanılabilir

// Main Meeting composable - video konferans işlemlerini yönetir
const {
  joinChannel,
  leaveChannel,
  toggleCamera,
  toggleMicrophone,
  toggleScreenShare,
  isScreenSharing,
  emitter,
  screenEmitter,
  isJoining,
  isLeaving,
  cleanup,
  isConnected,
  localUser,
  remoteUsers,
  allUsers,
  connectedUsersCount,
  isLocalVideoOff,
  isLocalAudioMuted,
  localTracks,
  remoteTracks,
  supportsScreenShare,
  // Stream Quality
  networkQuality,
  bitrate,
  frameRate,
  packetLoss,
  rtt,
  qualityLevel,
  qualityColor,
  qualityPercentage,
  debugMicrophoneStatus
} = useMeeting()



const channelName = ref('')

// Join channel handler
const handleJoin = async (name) => {
  try {
    channelName.value = name
    await joinChannel(name)
  } catch (error) {
    console.error('Failed to join channel:', error)
    alert('Failed to join channel: ' + error.message)
  }
}

// Leave channel handler
const handleLeave = async () => {
  try {
    await leaveChannel()
    channelName.value = ''
  } catch (error) {
    console.error('Failed to leave channel:', error)
  }
}

// Toggle camera handler
const handleToggleCamera = async (off) => {
  try {
    await toggleCamera(off)
  } catch (error) {
    console.error('Failed to toggle camera:', error)
  }
}

// Toggle microphone handler
const handleToggleMicrophone = async (muted) => {
  try {
    await toggleMicrophone(muted)
  } catch (error) {
    console.error('Failed to toggle microphone:', error)
  }
}

// Event listeners
const setupEventListeners = () => {
  emitter.on('user-joined', (user) => {
    console.log('User joined:', user)
  })

  emitter.on('user-left', (data) => {
    console.log('User left:', data.uid)
  })

  emitter.on('local-video-ready', (data) => {
    console.log('Local video ready:', data)
  })

  emitter.on('local-audio-ready', (data) => {
    console.log('Local audio ready:', data)
  })



  emitter.on('remote-audio-ready', (data) => {
    console.log('Remote audio ready:', data)
  })

  emitter.on('connection-state-change', (data) => {
    console.log('Connection state changed:', data)
  })

  emitter.on('local-audio-toggled', (data) => {
    console.log('=== APP: LOCAL AUDIO TOGGLED ===')
    console.log('Muted:', data.muted)
    console.log('Track enabled:', data.enabled)
    console.log('Track readyState:', data.readyState)
    console.log('Track object:', data.track)
  })
}

const agoraVideoRef = ref(null)
const settingsOpen = ref(false)

function handleOpenSettings() {
  if (agoraVideoRef.value && agoraVideoRef.value.openSettings) {
    agoraVideoRef.value.openSettings()
    settingsOpen.value = !settingsOpen.value
  }
}

// Lifecycle
onMounted(() => {
  setupEventListeners()
})

onUnmounted(() => {
  cleanup()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%);
  color: #e0e0e0;
  min-height: 100vh;
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;

}

.app-header {
  text-align: center;
  margin-bottom: 20px;
}

.app-header h1 {
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-main {
  flex: 1;
    display: flex;
  flex-direction: column;
  gap: 20px;
}

.video-area {
  flex: 1;
  min-height: 400px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  }

.controls-area {
  background: transparent;
  border-radius: 16px;
  }

/* Responsive */
@media (max-width: 768px) {
  .app-container {
    padding: 10px;
  }
  
  .app-header h1 {
    font-size: 24px;
  }
  
  .video-area {
    min-height: 300px;
  }
}
</style>
