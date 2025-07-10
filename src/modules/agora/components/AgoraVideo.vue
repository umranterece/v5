<template>
  <div class="agora-video-container">
    <VideoGrid
      :local-user="localUser"
      :remote-users="remoteUsers"
      :all-users="allUsers"
      :local-tracks="localTracksFromStore"
      :local-video-ref="localVideoRef"
      :local-screen-ref="localScreenRef"
      @set-video-ref="setVideoRef"
      @set-local-video-ref="setLocalVideoRef"
      @set-local-screen-ref="setLocalScreenRef"
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
import { useLogger } from '../composables/index.js'

const { logUI, logError } = useLogger()

// Props
const props = defineProps({
  centralEmitter: { type: Object, default: () => ({}) },
  localUser: { type: Object, default: () => ({}) },
  remoteUsers: { type: Array, default: () => [] },
  allUsers: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  remoteTracks: { type: Object, default: () => new Map() }
})

// Store'dan local tracks'leri al
const agoraStore = useAgoraStore()
const localTracksFromStore = computed(() => ({
  video: agoraStore.tracks.local.video.video,
  screen: {
    video: agoraStore.tracks.local.screen.video
  }
}))

// Refs
const localVideoRef = ref(null)
const localScreenRef = ref(null)
const videoRefs = ref(new Map())
const isSettingUpLocalVideo = ref(false) // Prevent recursive calls

// Methods
const setLocalVideoRef = (el) => {
  logUI('Yerel video referansı ayarlanıyor', { element: !!el, previousRef: !!localVideoRef.value })
  
  // Only update if the element actually changed
  if (localVideoRef.value !== el) {
    localVideoRef.value = el
    logUI('Yerel video referansı güncellendi', { newRef: !!localVideoRef.value })
    
    // Eğer video track varsa hemen oynatmayı dene
    if (el && props.localTracks.video && !isSettingUpLocalVideo.value) {
      logUI('Video elementi ayarlandı, yerel video oynatılmaya çalışılıyor')
      setupLocalVideo()
    }
  } else {
    logUI('Yerel video referansı değişmedi, kurulum atlanıyor')
  }
}

const setLocalScreenRef = (el) => {
  logUI('Yerel ekran paylaşımı referansı ayarlanıyor', { 
    element: !!el, 
    previousRef: !!localScreenRef.value,
    elementType: el?.constructor?.name,
    elementId: el?.id,
    elementClass: el?.className
  })
  
  // Only update if the element actually changed
  if (localScreenRef.value !== el) {
    localScreenRef.value = el
    logUI('Yerel ekran paylaşımı referansı güncellendi', { 
      newRef: !!localScreenRef.value,
      refType: el?.constructor?.name
    })
    
    // Eğer ekran paylaşımı aktifse hemen oynatmayı dene
    const agoraStore = useAgoraStore()
    if (el && agoraStore.isScreenSharing && agoraStore.tracks.local.screen.video) {
      logUI('Ekran paylaşımı elementi ayarlandı, yerel ekran paylaşımı oynatılmaya çalışılıyor', {
        isScreenSharing: agoraStore.isScreenSharing,
        hasScreenTrack: !!agoraStore.tracks.local.screen.video,
        trackId: agoraStore.tracks.local.screen.video?.id
      })
      setupLocalScreenVideo()
    } else {
      logUI('Ekran paylaşımı elementi ayarlandı ama oynatma koşulları sağlanmadı', {
        hasElement: !!el,
        isScreenSharing: agoraStore.isScreenSharing,
        hasScreenTrack: !!agoraStore.tracks.local.screen.video
      })
    }
  } else {
    logUI('Yerel ekran paylaşımı referansı değişmedi, kurulum atlanıyor')
  }
}

const setVideoRef = (el, uid) => {
  logUI('Video referansı ayarlanıyor', { uid, element: !!el, elementType: el?.constructor?.name })
  
  if (el) {
    videoRefs.value.set(uid, el)
    logUI('Video referansı başarıyla ayarlandı', { uid })
  } else {
    logUI('Video referansı temizlendi', { uid })
  }
}

const playVideo = async (track, element) => {
  logUI('Video oynatılıyor', { 
    trackType: track?.constructor?.name, 
    elementType: element?.constructor?.name,
    trackId: track?.id,
    trackEnabled: track?.enabled,
    trackReadyState: track?.readyState,
    elementExists: !!element
  })
  
  if (!track) {
    logUI('Video oynatılamıyor - track sağlanmadı')
    return
  }
  
  if (!element) {
    logUI('Video oynatılamıyor - element sağlanmadı')
    return
  }
  
  try {
    // Track'in durumunu kontrol et
    if (track.readyState === 'ended') {
      logUI('Track sonlandı, oynatılamıyor', { trackId: track.id })
      return
    }
    
    // Track'i etkinleştir (eğer setEnabled fonksiyonu varsa)
    if (!track.enabled && typeof track.setEnabled === 'function') {
      logUI('Track devre dışı, etkinleştiriliyor', { trackId: track.id })
      track.setEnabled(true)
    } else if (!track.enabled) {
      logUI('Track devre dışı ama setEnabled fonksiyonu mevcut değil', { trackId: track.id })
    }
    
    logUI('track.play() çağrılıyor', { trackId: track.id })
    await track.play(element)
    logUI('track.play() başarıyla tamamlandı', { trackId: track.id })
    
  } catch (err) {
    logError(err, { 
      context: 'playVideo',
      trackId: track?.id,
      trackState: track?.readyState,
      trackEnabled: track?.enabled,
      elementType: element?.constructor?.name
    })
    throw err
  }
}

const playAudio = async (track) => {
  if (track) {
    try {
      await track.play()
    } catch (err) {
      logError(err, { context: 'playAudio' })
    }
  }
}

const setupLocalVideo = async () => {
  // Prevent recursive calls
  if (isSettingUpLocalVideo.value) {
    logUI('Yerel video kurulumu atlandı - zaten çalışıyor')
    return
  }
  
  const videoTrack = agoraStore.tracks.local.video.video
  
  logUI('Setup local video debug', {
    videoTrack: !!videoTrack,
    localVideoRef: !!localVideoRef.value,
    hasVideoTrack: !!videoTrack,
    hasVideoRef: !!localVideoRef.value,
    isScreenSharing: agoraStore.isScreenSharing,
    hasScreenTrack: !!agoraStore.tracks.local.screen.video
  })
  
  // Yerel video alanında her zaman kamera track'ini oynat (ekran paylaşımı değil)
  if (videoTrack && localVideoRef.value) {
    try {
      isSettingUpLocalVideo.value = true
      logUI('Yerel kamera track\'i oynatılmaya çalışılıyor', {
        trackId: videoTrack.id,
        trackEnabled: videoTrack.enabled,
        trackReadyState: videoTrack.readyState
      })
      
      // Element'i temizle
      localVideoRef.value.innerHTML = ''
      
      await playVideo(videoTrack, localVideoRef.value)
      logUI('Yerel kamera track\'i başarıyla oynatıldı')
    } catch (error) {
      logError(error, { context: 'setupLocalVideo' })
    } finally {
      isSettingUpLocalVideo.value = false
    }
  } else {
    logUI('Yerel video kurulamıyor - track veya ref eksik', {
      videoTrackExists: !!videoTrack,
      videoRefExists: !!localVideoRef.value,
      screenTrackExists: !!agoraStore.tracks.local.screen.video,
      isScreenSharing: agoraStore.isScreenSharing
    })
  }
}

const setupLocalScreenVideo = async () => {
  const agoraStore = useAgoraStore()
  
  logUI('Setup local screen video debug', {
    localScreenRef: !!localScreenRef.value,
    hasScreenTrack: !!agoraStore.tracks.local.screen.video,
    isScreenSharing: agoraStore.isScreenSharing,
    screenTrackId: agoraStore.tracks.local.screen.video?.id,
    screenTrackEnabled: agoraStore.tracks.local.screen.video?.enabled,
    screenTrackReadyState: agoraStore.tracks.local.screen.video?.readyState,
    refElementType: localScreenRef.value?.constructor?.name,
    refElementId: localScreenRef.value?.id
  })
  
  // Yerel ekran paylaşımı alanında ekran track'ini oynat
  if (agoraStore.isScreenSharing && agoraStore.tracks.local.screen.video && localScreenRef.value) {
    try {
      logUI('Yerel ekran paylaşımı track\'i oynatılmaya çalışılıyor', {
        trackId: agoraStore.tracks.local.screen.video.id,
        trackEnabled: agoraStore.tracks.local.screen.video.enabled,
        trackReadyState: agoraStore.tracks.local.screen.video.readyState,
        elementType: localScreenRef.value.constructor.name,
        elementId: localScreenRef.value.id
      })
      
      // Element'i temizle
      localScreenRef.value.innerHTML = ''
      
      await playVideo(agoraStore.tracks.local.screen.video, localScreenRef.value)
      logUI('Yerel ekran paylaşımı track\'i başarıyla oynatıldı')
    } catch (error) {
      logError(error, { context: 'setupLocalScreenVideo' })
    }
  } else {
    logUI('Yerel ekran paylaşımı kurulamıyor - track veya ref eksik', {
      screenRefExists: !!localScreenRef.value,
      screenTrackExists: !!agoraStore.tracks.local.screen.video,
      isScreenSharing: agoraStore.isScreenSharing,
      missingRef: !localScreenRef.value,
      missingTrack: !agoraStore.tracks.local.screen.video,
      notScreenSharing: !agoraStore.isScreenSharing
    })
  }
}

const setupSpecificRemoteVideo = async (uid) => {
  logUI('Belirli uzak video kurulumu', { uid })
  
  const element = videoRefs.value.get(uid)
  const agoraStore = useAgoraStore()
  
  // Track'i bul - önce remote tracks'tan kontrol et
  let track = props.remoteTracks.get(uid)?.video
  
  // Eğer remote tracks'ta yoksa, store'dan kontrol et
  if (!track) {
    track = agoraStore.tracks.remote.get(uid)?.video
    logUI('Track props\'ta bulunamadı, store kontrol ediliyor', { uid, foundInStore: !!track })
  }
  
  // Eğer hala yoksa, client'ların remote users'larından kontrol et
  if (!track) {
    const videoClient = agoraStore.clients.video.client
    const screenClient = agoraStore.clients.screen.client
    
    if (videoClient && videoClient.remoteUsers) {
      const videoUser = videoClient.remoteUsers.find(u => u.uid === uid)
      if (videoUser && videoUser.videoTrack) {
        track = videoUser.videoTrack
        logUI('Video client uzak kullanıcılarında track bulundu', { uid })
        
        // Track'i store'a da kaydet
        agoraStore.setRemoteTrack(uid, 'video', track)
      }
    }
    
    if (!track && screenClient && screenClient.remoteUsers) {
      const screenUser = screenClient.remoteUsers.find(u => u.uid === uid)
      if (screenUser && screenUser.videoTrack) {
        track = screenUser.videoTrack
        logUI('Ekran client uzak kullanıcılarında track bulundu', { uid })
        
        // Track'i store'a da kaydet
        agoraStore.setRemoteTrack(uid, 'video', track)
      }
    }
  }
  
  // Eğer hala yoksa, local screen track'ini kontrol et
  if (!track) {
    const screenUser = props.allUsers.find(user => user.uid === uid && user.isScreenShare && user.isLocal)
    if (screenUser && agoraStore.tracks.local.screen.video) {
      track = agoraStore.tracks.local.screen.video
      logUI('UID için yerel ekran track\'i bulundu', { uid })
    }
  }
  
  // Son olarak, client'ların remote users'larından kontrol et
  if (!track) {
    const videoClient = agoraStore.clients.video.client
    const screenClient = agoraStore.clients.screen.client
    
    if (videoClient && videoClient.remoteUsers) {
      const videoUser = videoClient.remoteUsers.find(u => u.uid === uid)
      if (videoUser && videoUser.videoTrack) {
        track = videoUser.videoTrack
        logUI('Video client uzak kullanıcılarında track bulundu', { uid })
      }
    }
    
    if (!track && screenClient && screenClient.remoteUsers) {
      const screenUser = screenClient.remoteUsers.find(u => u.uid === uid)
      if (screenUser && screenUser.videoTrack) {
        track = screenUser.videoTrack
        logUI('Ekran client uzak kullanıcılarında track bulundu', { uid })
      }
    }
  }
  
  logUI('Belirli uzak video kurulum detayları', {
    elementFound: !!element,
    trackFound: !!track,
    trackType: track?.constructor?.name,
    trackId: track?.id,
    trackEnabled: track?.enabled,
    trackReadyState: track?.readyState
  })
  
  if (track && element) {
    try {
      // Kullanıcı tipini kontrol et
      const user = props.allUsers.find(u => u.uid === uid)
      const isScreenShare = user?.isScreenShare
      
      logUI('UID için video oynatılıyor', { 
        uid, 
        trackId: track.id, 
        isScreenShare,
        trackEnabled: track.enabled,
        trackReadyState: track.readyState
      })
      
      // Element'i temizle
      element.innerHTML = ''
      
      // Ekran paylaşımı için track'i etkinleştir
      if (isScreenShare && track.setEnabled) {
        try {
          track.setEnabled(true)
          logUI('Ekran paylaşımı track\'i etkinleştirildi', { uid })
        } catch (enableError) {
          logWarn('Ekran paylaşımı track\'i etkinleştirilemedi:', enableError)
        }
      }
      
      // Track'i oynat
      await playVideo(track, element)
      logUI('UID için video başarıyla oynatıldı', { uid, isScreenShare })
      
      // Store'a track'i kaydet
      if (!agoraStore.tracks.remote.has(uid)) {
        agoraStore.tracks.remote.set(uid, {})
      }
      agoraStore.tracks.remote.get(uid).video = track
      
    } catch (error) {
      logError(error, { context: 'setupSpecificRemoteVideo', uid })
    }
  } else {
    logUI(`${uid} UID'si için video kurulamıyor - element veya track eksik`, {
      elementExists: !!element,
      trackExists: !!track,
      uid
    })
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
        logError(error, { context: 'setupRemoteAudios', uid })
      }
    }
  }
}

// Event listeners
const setupEventListeners = () => {
  logUI('Merkezi event sistemi kullanılıyor')
  
  // centralEmitter'ın varlığını kontrol et
  if (!props.centralEmitter || typeof props.centralEmitter.on !== 'function') {
    logUI('centralEmitter mevcut değil veya geçersiz')
    return
  }
  
  // Önceki event listener'ları temizle
  props.centralEmitter.off('setup-remote-video')
  props.centralEmitter.off('local-video-ready')
  props.centralEmitter.off('remote-video-unpublished')
  props.centralEmitter.off('remote-video-ready')
  props.centralEmitter.off('remote-audio-ready')
  props.centralEmitter.off('remote-screen-ready')
  props.centralEmitter.off('screen-share-started')
  props.centralEmitter.off('screen-share-stopped')
  
  props.centralEmitter.on('setup-remote-video', (data) => {
    setupSpecificRemoteVideo(data.uid)
  })
  
  props.centralEmitter.on('local-video-ready', async (data) => {
    logUI('Yerel video hazır event (merkezi)', { data, clientType: data.clientType })
    
    await nextTick()
    await setupLocalVideo()
  })
  
  props.centralEmitter.on('remote-video-unpublished', (data) => {
    const element = videoRefs.value.get(data.uid)
    if (element) {
      element.innerHTML = ''
    }
  })
  
  props.centralEmitter.on('remote-video-ready', async (data) => {
    logUI('Uzak video hazır event (merkezi)', { data, clientType: data.clientType })
    
    // Track'i hemen store'a kaydet
    const agoraStore = useAgoraStore()
    if (data.track) {
      agoraStore.setRemoteTrack(data.uid, 'video', data.track)
      logUI('Track store\'a kaydedildi', { uid: data.uid, trackId: data.track.id })
    }
    
    // Ekran paylaşımı kullanıcısı için özel işlem
    const user = agoraStore.users.remote.find(u => u.uid === data.uid)
    const isScreenShare = user?.isScreenShare
    
    if (isScreenShare) {
      logUI('Ekran paylaşımı kullanıcısı için özel video kurulumu', { uid: data.uid })
      
      // Ekran paylaşımı için daha hızlı kurulum
      setTimeout(async () => {
        await setupSpecificRemoteVideo(data.uid)
      }, 10)
      
      setTimeout(async () => {
        await setupSpecificRemoteVideo(data.uid)
      }, 50)
    } else {
      // Normal video için standart kurulum
      await setupSpecificRemoteVideo(data.uid)
      
      setTimeout(async () => {
        await setupSpecificRemoteVideo(data.uid)
      }, 100)
      
      await nextTick()
      await setupSpecificRemoteVideo(data.uid)
      
      setTimeout(async () => {
        await setupSpecificRemoteVideo(data.uid)
      }, 500)
    }
  })
  
  props.centralEmitter.on('remote-audio-ready', async (data) => {
    const audioTrack = data.track
    if (audioTrack) {
      try {
        await playAudio(audioTrack)
      } catch (error) {
        logError(error, { context: 'remote-audio-ready', uid: data.uid })
      }
    }
  })
  
  props.centralEmitter.on('remote-screen-ready', async (data) => {
    logUI('Uzak ekran hazır event (merkezi)', { data, clientType: data.clientType })
    
    // Hemen video setup'ı dene
    setupSpecificRemoteVideo(data.uid)
    
    // Kısa bir gecikme ile tekrar dene
    setTimeout(async () => {
      await setupSpecificRemoteVideo(data.uid)
    }, 50)
    
    // nextTick ile de tekrar dene
    await nextTick()
    await setupSpecificRemoteVideo(data.uid)
  })
  
  props.centralEmitter.on('screen-share-started', async (data) => {
    logUI('Ekran paylaşımı başladı event (merkezi)', { data, clientType: data.clientType })
    
    const agoraStore = useAgoraStore()
    
    if (agoraStore.isScreenSharing && agoraStore.tracks.local.screen.video) {
      logUI('Yerel ekran paylaşımı başladı, yerel video yeniden kuruluyor')
      
      // Kısa bir gecikme ile yerel video'yu kur (DOM güncellemesi için)
      setTimeout(async () => {
        await setupLocalVideo()
      }, 50)
      
      // Eğer hala çalışmıyorsa, birkaç kez daha dene
      setTimeout(async () => {
        await setupLocalVideo()
      }, 200)
      
      setTimeout(async () => {
        await setupLocalVideo()
      }, 500)
      
      // nextTick ile de tekrar dene
      await nextTick()
      await setupLocalVideo()
    } else {
      logUI('Ekran paylaşımı aktif değil veya ekran track\'i yok', {
        isScreenSharing: agoraStore.isScreenSharing,
        hasScreenTrack: !!agoraStore.tracks.local.screen.video
      })
    }
  })
  
  props.centralEmitter.on('screen-share-stopped', async () => {
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
      logError(err, { context: 'fetchDevices' })
    }
}

function openSettings() {
  logUI('AgoraVideo.vue\'de openSettings çağrıldı')
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

// Ekran paylaşımı için özel watcher
watch(() => props.allUsers, async (newUsers) => {
  const screenUser = newUsers.find(user => user.isScreenShare && user.isLocal)
  if (screenUser && screenUser.hasVideo) {
    logUI('Ekran paylaşımı kullanıcısı tespit edildi, ekran videosu kuruluyor')
    await nextTick()
    await setupSpecificRemoteVideo(screenUser.uid)
  }
}, { deep: true })

// Ekran paylaşımı durumu için özel watcher
watch(() => {
  const agoraStore = useAgoraStore()
  return agoraStore.isScreenSharing
}, async (isScreenSharing) => {
  if (isScreenSharing) {
    logUI('Ekran paylaşımı başladı, yerel ekran paylaşımı kuruluyor')
    await nextTick()
    await setupLocalScreenVideo()
  }
})

// Lifecycle
onMounted(async () => {
  // centralEmitter hazır olduğunda event listener'ları kur
  if (props.centralEmitter && typeof props.centralEmitter.on === 'function') {
    setupEventListeners()
  }
  
  await setupLocalVideo()
  await setupRemoteVideos()
  await setupRemoteAudios()
})

// centralEmitter değiştiğinde event listener'ları yeniden kur
watch(() => props.centralEmitter, (newEmitter, oldEmitter) => {
  if (newEmitter && typeof newEmitter.on === 'function' && newEmitter !== oldEmitter) {
    logUI('centralEmitter değişti, event listener\'lar yeniden kuruluyor')
    setupEventListeners()
  }
}, { immediate: true })

onUnmounted(() => {
  videoRefs.value.clear()
  
  // centralEmitter varsa event listener'ları temizle
  if (props.centralEmitter && typeof props.centralEmitter.off === 'function') {
    props.centralEmitter.off('setup-remote-video')
    props.centralEmitter.off('local-video-ready')
    props.centralEmitter.off('remote-video-unpublished')
    props.centralEmitter.off('remote-video-ready')
    props.centralEmitter.off('remote-audio-ready')
    props.centralEmitter.off('remote-screen-ready')
    props.centralEmitter.off('screen-share-started')
    props.centralEmitter.off('screen-share-stopped')
  }
})
</script>

<style scoped>
.agora-video-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
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