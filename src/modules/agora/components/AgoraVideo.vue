<template>
  <div class="agora-video-container">
    <VideoGrid
      :local-user="localUser"
      :remote-users="remoteUsers"
      :all-users="allUsers"
      :local-tracks="localTracks"
      :local-video-ref="localVideoRef"
      @set-video-ref="setVideoRef"
      @set-local-video-ref="setLocalVideoRef"
    />

    <!-- Settings Modal Overlay -->
    <div v-if="showSettings" class="settings-modal-backdrop" @click.self="closeSettings">
      <div class="settings-modal-glass">
       
        <div class="settings-section">
          <label for="cameraSelect">Kamera</label>
          <select id="cameraSelect" v-model="selectedCameraId">
            <option v-for="device in videoDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || 'Kamera ' + device.deviceId }}
            </option>
          </select>
        </div>
        <div class="settings-section">
          <label for="micSelect">Mikrofon</label>
          <select id="micSelect" v-model="selectedMicId">
            <option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || 'Mikrofon ' + device.deviceId }}
            </option>
          </select>
        </div>
        <div class="settings-section">
          <label for="videoQuality">Kamera Kalitesi</label>
          <select id="videoQuality" v-model="selectedVideoQuality">
            <option v-for="preset in videoQualityPresets" :key="preset.value" :value="preset.value">
              {{ preset.label }}
            </option>
          </select>
        </div>
        <div class="settings-section" v-if="!isMobile">
          <label for="screenQuality">Ekran Paylaşımı Kalitesi</label>
          <select id="screenQuality" v-model="selectedScreenQuality">
            <option v-for="preset in screenQualityPresets" :key="preset.value" :value="preset.value">
              {{ preset.label }}
            </option>
          </select>
        </div>
        <div class="settings-actions">
          <button @click="applySettings" class="save-button">Kaydet</button>
          <button @click="closeSettings" class="cancel-button">İptal</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useAgoraStore } from '../store/index.js'
import VideoGrid from './VideoGrid.vue'

// Props
const props = defineProps({
  emitter: { type: Object, default: () => ({}) },
  screenEmitter: { type: Object, default: () => ({}) },
  localUser: { type: Object, default: () => ({}) },
  remoteUsers: { type: Array, default: () => [] },
  allUsers: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  remoteTracks: { type: Object, default: () => new Map() }
})

// Refs
const localVideoRef = ref(null)
const videoRefs = ref(new Map())
const isSettingUpLocalVideo = ref(false) // Prevent recursive calls

// Methods
const setLocalVideoRef = (el) => {
  console.log('=== SET LOCAL VIDEO REF IN AGORA VIDEO ===')
  console.log('Element:', el)
  console.log('Previous local video ref:', localVideoRef.value)
  
  // Only update if the element actually changed
  if (localVideoRef.value !== el) {
    localVideoRef.value = el
    console.log('New local video ref:', localVideoRef.value)
    
    // Eğer video track varsa hemen oynatmayı dene
    if (el && props.localTracks.video && !isSettingUpLocalVideo.value) {
      console.log('Video element set, attempting to play local video...')
      setupLocalVideo()
    }
  } else {
    console.log('Local video ref unchanged, skipping setup')
  }
}

const setVideoRef = (el, uid) => {
  console.log('=== SET VIDEO REF DEBUG ===')
  console.log('Setting video ref for UID:', uid)
  console.log('Element:', el)
  console.log('Element type:', el?.constructor?.name)
  
  if (el) {
    videoRefs.value.set(uid, el)
    console.log('Video ref set successfully for UID:', uid)
  } else {
    console.log('Video ref cleared for UID:', uid)
  }
}

const playVideo = async (track, element) => {
  console.log('=== PLAY VIDEO DEBUG ===')
  console.log('Track:', track)
  console.log('Element:', element)
  console.log('Track type:', track?.constructor?.name)
  console.log('Element type:', element?.constructor?.name)
  
  if (track && element) {
    try {
      console.log('Calling track.play()...')
      await track.play(element)
      console.log('Track.play() completed successfully')
    } catch (err) {
      console.error('Failed to play video track:', err)
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        trackState: track?.readyState,
        trackEnabled: track?.enabled,
        elementInnerHTML: element?.innerHTML
      })
      throw err
    }
  } else {
    console.warn('Cannot play video - missing track or element')
  }
}

const playAudio = async (track) => {
  if (track) {
    try {
      await track.play()
    } catch (err) {
      console.error('Failed to play audio track:', err)
    }
  }
}

const setupLocalVideo = async () => {
  // Prevent recursive calls
  if (isSettingUpLocalVideo.value) {
    console.log('=== SETUP LOCAL VIDEO SKIPPED - ALREADY RUNNING ===')
    return
  }
  
  const videoTrack = props.localTracks.video
  
  console.log('=== SETUP LOCAL VIDEO DEBUG ===')
  console.log('Video track:', videoTrack)
  console.log('Local video ref:', localVideoRef.value)
  console.log('Has video track:', !!videoTrack)
  console.log('Has video ref:', !!localVideoRef.value)
  
  if (videoTrack && localVideoRef.value) {
    try {
      isSettingUpLocalVideo.value = true
      console.log('Attempting to play local video track...')
      await playVideo(videoTrack, localVideoRef.value)
      console.log('Local video track played successfully')
    } catch (error) {
      console.error('Failed to setup local video:', error)
    } finally {
      isSettingUpLocalVideo.value = false
    }
  } else {
    console.warn('Cannot setup local video - missing track or ref')
    console.log('Video track exists:', !!videoTrack)
    console.log('Video ref exists:', !!localVideoRef.value)
  }
}

const setupSpecificRemoteVideo = async (uid) => {
  const element = videoRefs.value.get(uid)
  const track = props.remoteTracks.get(uid)?.video
  
  if (track && element) {
    try {
      await playVideo(track, element)
    } catch (error) {
      console.error(`Failed to setup video for user ${uid}:`, error)
    }
  }
}

const setupRemoteVideos = async () => {
  for (const [uid, tracks] of props.remoteTracks) {
    if (tracks.video) {
      await setupSpecificRemoteVideo(uid)
    }
  }
}

const setupRemoteAudios = async () => {
  for (const [uid, tracks] of props.remoteTracks) {
    if (tracks.audio) {
      try {
        await playAudio(tracks.audio)
      } catch (error) {
        console.error(`Failed to setup audio for user ${uid}:`, error)
      }
    }
  }
}

// Event listeners
const setupEventListeners = () => {
  props.emitter.on('setup-remote-video', (data) => {
    setupSpecificRemoteVideo(data.uid)
  })
  
  props.emitter.on('local-video-ready', async (data) => {
    console.log('=== LOCAL VIDEO READY EVENT ===')
    console.log('Event data:', data)
    console.log('Local video ref before nextTick:', localVideoRef.value)
    
    await nextTick()
    console.log('Local video ref after nextTick:', localVideoRef.value)
    
    await setupLocalVideo()
  })
  
  props.emitter.on('remote-video-unpublished', (data) => {
    const element = videoRefs.value.get(data.uid)
    if (element) {
      element.innerHTML = ''
    }
  })
  
  props.emitter.on('remote-video-ready', async (data) => {
    await nextTick()
    await setupSpecificRemoteVideo(data.uid)
  })
  
  props.emitter.on('remote-audio-ready', async (data) => {
    const audioTrack = data.track
    if (audioTrack) {
      try {
        await playAudio(audioTrack)
      } catch (error) {
        console.error(`Failed to play remote audio for user ${data.uid}:`, error)
      }
    }
  })
  
  // Screen share events
  props.screenEmitter.on('remote-screen-ready', async (data) => {
    await nextTick()
    await setupSpecificRemoteVideo(data.uid)
  })
  
  props.screenEmitter.on('screen-share-started', async (data) => {
    console.log('=== SCREEN SHARE STARTED EVENT ===')
    console.log('Event data:', data)
    
    const agoraStore = useAgoraStore()
    
    if (agoraStore.isScreenSharing && agoraStore.screenLocalTracks.video) {
      const screenUser = props.allUsers.find(user => user.isScreenShare && user.isLocal)
      if (screenUser) {
        console.log('Screen user found:', screenUser)
        
        // Video element'i hemen bul ve track'i oynat
        const element = videoRefs.value.get(screenUser.uid)
        if (element) {
          console.log('Video element found, playing screen track immediately...')
          try {
            await playVideo(agoraStore.screenLocalTracks.video, element)
            console.log('Screen track played successfully')
          } catch (error) {
            console.error('Failed to start local screen share video:', error)
          }
        } else {
          console.log('Video element not found, waiting for next tick...')
          await nextTick()
          const elementAfterTick = videoRefs.value.get(screenUser.uid)
          if (elementAfterTick) {
            try {
              await playVideo(agoraStore.screenLocalTracks.video, elementAfterTick)
              console.log('Screen track played successfully after nextTick')
            } catch (error) {
              console.error('Failed to start local screen share video after nextTick:', error)
            }
          } else {
            console.warn('Video element still not found after nextTick')
          }
        }
      } else {
        console.warn('Screen user not found in allUsers')
      }
    } else {
      console.warn('Screen sharing not active or no screen track')
    }
  })
  
  props.screenEmitter.on('screen-share-stopped', async () => {
    await nextTick()
    
    const agoraStore = useAgoraStore()
    const screenUser = props.allUsers.find(user => user.isScreenShare && user.isLocal)
    if (screenUser) {
      const element = videoRefs.value.get(screenUser.uid)
      if (element) {
        element.innerHTML = ''
      }
    }
  })
}

// Settings modal state and logic
const showSettings = ref(false)

// Dummy device/preset data for demonstration (replace with real data as needed)
const videoDevices = ref([])
const audioDevices = ref([])
const videoQualityPresets = ref([
  { value: '360p', label: '360p (Düşük)' },
  { value: '480p', label: '480p (Orta)' },
  { value: '720p', label: '720p (Yüksek)' },
  { value: '1080p', label: '1080p (Çok Yüksek)' }
])
const screenQualityPresets = ref([
  { value: '360p', label: '360p (Düşük)' },
  { value: '480p', label: '480p (Orta)' },
  { value: '720p', label: '720p (Yüksek)' },
  { value: '1080p', label: '1080p (Çok Yüksek)' }
])
const selectedCameraId = ref('')
const selectedMicId = ref('')
const selectedVideoQuality = ref('1080p')
const selectedScreenQuality = ref('1080p')

const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

async function fetchDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    videoDevices.value = devices.filter(d => d.kind === 'videoinput')
    audioDevices.value = devices.filter(d => d.kind === 'audioinput')
    // Varsayılan olarak ilk cihazı seçili yap
    if (!selectedCameraId.value && videoDevices.value.length > 0) {
      selectedCameraId.value = videoDevices.value[0].deviceId
    }
    if (!selectedMicId.value && audioDevices.value.length > 0) {
      selectedMicId.value = audioDevices.value[0].deviceId
    }
  } catch (err) {
    console.error('Cihazlar alınamadı:', err)
  }
}

function openSettings() {
  console.log('openSettings called in AgoraVideo.vue')
  showSettings.value = !showSettings.value
  if (showSettings.value) fetchDevices()
}
function closeSettings() {
  showSettings.value = false
}
function applySettings() {
  // Uygulama ayarlarını burada işle
  closeSettings()
}

defineExpose({ openSettings })

// Watchers
watch(() => props.localTracks.video, async (newTrack) => {
  if (newTrack && !isSettingUpLocalVideo.value) {
    await setupLocalVideo()
  }
}, { immediate: true })

watch(() => props.localUser?.isVideoOff, async (isVideoOff) => {
  if (!isVideoOff && props.localTracks.video && !isSettingUpLocalVideo.value) {
    await nextTick()
    await setupLocalVideo()
  }
})

watch(() => props.localUser?.hasVideo, async (hasVideo) => {
  if (hasVideo && props.localTracks.video && !isSettingUpLocalVideo.value) {
    await nextTick()
    await setupLocalVideo()
  }
})

// Lifecycle
onMounted(async () => {
  setupEventListeners()
  await setupLocalVideo()
  await setupRemoteVideos()
  await setupRemoteAudios()
})

onUnmounted(() => {
  videoRefs.value.clear()
  props.emitter.off('setup-remote-video')
  props.screenEmitter.off('remote-screen-ready')
  props.screenEmitter.off('screen-share-started')
  props.screenEmitter.off('screen-share-stopped')
})
</script>

<style scoped>
.agora-video-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0f0f0f;
  overflow: hidden;
}

.settings-modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(20, 20, 40, 0.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  overflow-y: auto;
}
.settings-modal-glass {
  background: rgba(34, 34, 44, 0.85);
  border-radius: 20px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.45);
  padding: 40px 32px 32px 32px;
  width: 100%;
  max-width: 420px;
  color: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  border: 1.5px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(16px);
  animation: modalPopIn 0.25s cubic-bezier(.4,2,.6,1) 1;
  box-sizing: border-box;
  max-height: 90vh;
}
@keyframes modalPopIn {
  0% { transform: scale(0.92) translateY(30px); opacity: 0; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
.settings-modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.settings-modal-icon {
  font-size: 2.7rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2px;
  margin-top: 100px;
}
.settings-modal-glass h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.5px;
}
.settings-section {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.settings-section label {
  font-size: 1rem;
  font-weight: 500;
  color: #bdbfff;
  margin-bottom: 2px;
}
.settings-section select {
  background: rgba(40,40,60,0.85);
  color: #fff;
  border: 1.5px solid #667eea;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 1rem;
  outline: none;
  transition: border 0.2s;
}
.settings-section select:focus {
  border: 1.5px solid #764ba2;
}
.settings-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 18px;
}
.save-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(102,126,234,0.12);
  transition: background 0.2s, box-shadow 0.2s;
}
.save-button:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  box-shadow: 0 4px 16px rgba(118,75,178,0.18);
}
.cancel-button {
  background: #444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.cancel-button:hover {
  background: #222;
}
</style> 