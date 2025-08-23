<template>
  <div class="agora-video-container">

    
    <!-- Dynamic Layouts -->
    <component 
      :is="currentLayoutComponent" 
      :users="usersFromStore"
      :local-tracks="localTracksFromStore"
      :local-video-ref="localVideoRef"
      :local-screen-ref="localScreenRef"
      :logger="props.logger"
      @set-video-ref="setVideoRef"
      @set-local-video-ref="setLocalVideoRef"
      @set-local-screen-ref="setLocalScreenRef"
      @video-click="handleVideoClick"
    />
    
    <!-- Layout Modal -->
    <LayoutModal
      :isOpen="isLayoutModalOpen"
      @close="closeLayoutModal"
    />

    <!-- Settings Modal -->
    <SettingsModal
      :isOpen="showSettings"
      :isMobile="isMobile"
      @close="closeSettings"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useAgoraStore, useLayoutStore } from '../../store/index.js'
import { LayoutModal, SettingsModal } from '../modals/index.js'
import { GridLayout, SpotlightLayout, PresentationLayout, WhiteboardLayout } from '../layouts/index.js'
import { AGORA_EVENTS } from '../../constants.js'

// Props
const props = defineProps({
  centralEmitter: { type: Object, default: () => ({}) },
  localUser: { type: Object, default: () => ({}) },
  remoteUsers: { type: Array, default: () => [] },
  allUsers: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  remoteTracks: { type: Object, default: () => new Map() },
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

// Store'dan local tracks'leri al
const agoraStore = useAgoraStore()
const layoutStore = useLayoutStore()

const localTracksFromStore = computed(() => ({
  video: agoraStore.tracks.local.video.video,
  screen: {
    video: agoraStore.tracks.local.screen.video
  }
}))

// Store'dan users'ları al - ekran paylaşımı kullanıcıları dahil
const usersFromStore = computed(() => {
  return agoraStore.allUsers
})

// Layout component selection
const currentLayoutComponent = computed(() => {
  switch (layoutStore.currentLayout) {
    case 'grid': return GridLayout
    case 'spotlight': return SpotlightLayout
    case 'presentation': return PresentationLayout
    case 'whiteboard': return WhiteboardLayout
    
    default: return GridLayout
  }
})

// Layout modal state
const isLayoutModalOpen = ref(false)
const currentLayoutInfo = computed(() => layoutStore.currentLayoutInfo)

// Layout modal methods
const toggleLayoutModal = () => {
  isLayoutModalOpen.value = !isLayoutModalOpen.value
}

const closeLayoutModal = () => {
  isLayoutModalOpen.value = false
}

// Video click handler
const handleVideoClick = (user) => {
  props.logger.info('Video tıklandı', { 
    user: user.uid, 
    isLocal: user.isLocal,
    isScreenShare: user.isScreenShare,
    currentLayout: layoutStore.currentLayout
  })
  
  // Eğer spotlight modundaysa, layout'a video-click event'ini ilet
  if (layoutStore.currentLayout === 'spotlight') {
    // Spotlight layout'ta zaten handle ediliyor
    props.logger.info('Spotlight modunda video tıklandı, layout handle ediyor')
  }
}

// Refs
const localVideoRef = ref(null)
const localScreenRef = ref(null)
const videoRefs = ref(new Map())
const isSettingUpLocalVideo = ref(false) // Prevent recursive calls

// Methods
const setLocalVideoRef = (el) => {
  props.logger.info('Yerel video referansı ayarlanıyor', { element: !!el, previousRef: !!localVideoRef.value })
  
  // Only update if the element actually changed
  if (localVideoRef.value !== el) {
    localVideoRef.value = el
    props.logger.info('Yerel video referansı güncellendi', { newRef: !!localVideoRef.value })
    
    // Eğer video track varsa hemen oynatmayı dene
    if (el && agoraStore.tracks.local.video.video && !isSettingUpLocalVideo.value) {
      props.logger.info('Video elementi ayarlandı, yerel video oynatılmaya çalışılıyor')
      setupLocalVideo()
    } else if (el) {
      // Track henüz hazır değilse, biraz bekleyip tekrar dene
      props.logger.info('Video elementi ayarlandı ama track henüz hazır değil, 500ms sonra tekrar deneniyor')
      setTimeout(() => {
        if (agoraStore.tracks.local.video.video && !isSettingUpLocalVideo.value) {
          props.logger.info('Track hazır, yerel video oynatılmaya çalışılıyor (retry)')
          setupLocalVideo()
        }
      }, 500)
    }
  } else {
    props.logger.info('Yerel video referansı değişmedi, kurulum atlanıyor')
  }
}

const setLocalScreenRef = (el) => {
  props.logger.info('Yerel ekran paylaşımı referansı ayarlanıyor', { 
    element: !!el, 
    previousRef: !!localScreenRef.value,
    elementType: el?.constructor?.name,
    elementId: el?.id,
    elementClass: el?.className
  })
  
  // Only update if the element actually changed
  if (localScreenRef.value !== el) {
    localScreenRef.value = el
    props.logger.info('Yerel ekran paylaşımı referansı güncellendi', { 
      newRef: !!localScreenRef.value,
      refType: el?.constructor?.name
    })
    
    // Eğer ekran paylaşımı aktifse hemen oynatmayı dene
    const agoraStore = useAgoraStore()
    if (el && agoraStore.isScreenSharing && agoraStore.tracks.local.screen.video) {
      props.logger.info('Ekran paylaşımı elementi ayarlandı, yerel ekran paylaşımı oynatılmaya çalışılıyor', {
        isScreenSharing: agoraStore.isScreenSharing,
        hasScreenTrack: !!agoraStore.tracks.local.screen.video,
        trackId: agoraStore.tracks.local.screen.video?.id
      })
      setupLocalScreenVideo()
    } else {
      props.logger.info('Ekran paylaşımı elementi ayarlandı ama oynatma koşulları sağlanmadı', {
        hasElement: !!el,
        isScreenSharing: agoraStore.isScreenSharing,
        hasScreenTrack: !!agoraStore.tracks.local.screen.video
      })
    }
  } else {
    props.logger.info('Yerel ekran paylaşımı referansı değişmedi, kurulum atlanıyor')
  }
}

const setVideoRef = (el, uid) => {
  props.logger.info('Video referansı ayarlanıyor', { uid, element: !!el, elementType: el?.constructor?.name })
  
  if (el) {
    videoRefs.value.set(uid, el)
    props.logger.info('Video referansı başarıyla ayarlandı', { uid })
  } else {
    props.logger.info('Video referansı temizlendi', { uid })
  }
}

const playVideo = async (track, element) => {
  props.logger.info('Video oynatılıyor', { 
    trackType: track?.constructor?.name, 
    elementType: element?.constructor?.name,
    trackId: track?.id,
    trackEnabled: track?.enabled,
    trackReadyState: track?.readyState,
    elementExists: !!element
  })
  
  if (!track) {
    props.logger.info('Video oynatılamıyor - track sağlanmadı')
    return
  }
  
  if (!element) {
    props.logger.info('Video oynatılamıyor - element sağlanmadı')
    return
  }
  
  try {
    // Track'in durumunu kontrol et
    if (track.readyState === 'ended') {
      props.logger.info('Track sonlandı, oynatılamıyor', { trackId: track.id })
      return
    }
    
    // Track'i etkinleştir (eğer setEnabled fonksiyonu varsa)
    if (!track.enabled && typeof track.setEnabled === 'function') {
      props.logger.info('Track devre dışı, etkinleştiriliyor', { trackId: track.id })
      track.setEnabled(true)
    } else if (!track.enabled) {
      props.logger.info('Track devre dışı ama setEnabled fonksiyonu mevcut değil', { trackId: track.id })
    }
    
    props.logger.info('track.play() çağrılıyor', { trackId: track.id })
    await track.play(element)
    props.logger.info('track.play() başarıyla tamamlandı', { trackId: track.id })
    
  } catch (err) {
    props.logger.error(err, { 
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
      props.logger.error(err, { context: 'playAudio' })
    }
  }
}

const setupLocalVideo = async () => {
  // Prevent recursive calls
  if (isSettingUpLocalVideo.value) {
    props.logger.info('Yerel video kurulumu atlandı - zaten çalışıyor')
    return
  }
  
  const videoTrack = agoraStore.tracks.local.video.video
  
  props.logger.info('Setup local video debug', {
    videoTrack: !!videoTrack,
    localVideoRef: !!localVideoRef.value,
    hasVideoTrack: !!videoTrack,
    hasVideoRef: !!localVideoRef.value,
    isScreenSharing: agoraStore.isScreenSharing,
    hasScreenTrack: !!agoraStore.tracks.local.screen.video,
    trackEnabled: videoTrack?.enabled,
    trackReadyState: videoTrack?.readyState
  })
  
  // Yerel video alanında her zaman kamera track'ini oynat (ekran paylaşımı değil)
  if (videoTrack && localVideoRef.value) {
    try {
      isSettingUpLocalVideo.value = true
      props.logger.info('Yerel kamera track\'i oynatılmaya çalışılıyor', {
        trackId: videoTrack.id,
        trackEnabled: videoTrack.enabled,
        trackReadyState: videoTrack.readyState
      })
      
      // Element'i temizle
      localVideoRef.value.innerHTML = ''
      
      await playVideo(videoTrack, localVideoRef.value)
      props.logger.info('Yerel kamera track\'i başarıyla oynatıldı')
    } catch (error) {
      props.logger.error(error, { context: 'setupLocalVideo' })
    } finally {
      isSettingUpLocalVideo.value = false
    }
  } else {
    props.logger.info('Yerel video kurulamıyor - track veya ref eksik', {
      videoTrackExists: !!videoTrack,
      videoRefExists: !!localVideoRef.value,
      trackEnabled: videoTrack?.enabled,
      trackReadyState: videoTrack?.readyState,
      screenTrackExists: !!agoraStore.tracks.local.screen.video,
      isScreenSharing: agoraStore.isScreenSharing
    })
    
    // Track henüz hazır değilse, biraz bekleyip tekrar dene
    if (!videoTrack && localVideoRef.value) {
      props.logger.info('Track henüz hazır değil, 1 saniye sonra tekrar deneniyor')
      setTimeout(() => {
        if (agoraStore.tracks.local.video.video && !isSettingUpLocalVideo.value) {
          props.logger.info('Track hazır, yerel video oynatılmaya çalışılıyor (retry)')
          setupLocalVideo()
        }
      }, 1000)
    }
  }
}

const setupLocalScreenVideo = async () => {
  const agoraStore = useAgoraStore()
  
  props.logger.info('Setup local screen video debug', {
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
      props.logger.info('Yerel ekran paylaşımı track\'i oynatılmaya çalışılıyor', {
        trackId: agoraStore.tracks.local.screen.video.id,
        trackEnabled: agoraStore.tracks.local.screen.video.enabled,
        trackReadyState: agoraStore.tracks.local.screen.video.readyState,
        elementType: localScreenRef.value.constructor.name,
        elementId: localScreenRef.value.id
      })
      
      // Element'i temizle
      localScreenRef.value.innerHTML = ''
      
      await playVideo(agoraStore.tracks.local.screen.video, localScreenRef.value)
      props.logger.info('Yerel ekran paylaşımı track\'i başarıyla oynatıldı')
    } catch (error) {
      props.logger.error(error, { context: 'setupLocalScreenVideo' })
    }
  } else {
    props.logger.info('Yerel ekran paylaşımı kurulamıyor - track veya ref eksik', {
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
  props.logger.info('Belirli uzak video kurulumu', { uid })
  
  const element = videoRefs.value.get(uid)
  const agoraStore = useAgoraStore()
  
  // Track'i bul - önce remote tracks'tan kontrol et
  let track = props.remoteTracks.get(uid)?.video
  
  // Eğer remote tracks'ta yoksa, store'dan kontrol et
  if (!track) {
    track = agoraStore.tracks.remote.get(uid)?.video
    props.logger.info('Track props\'ta bulunamadı, store kontrol ediliyor', { uid, foundInStore: !!track })
  }
  
  // Eğer hala yoksa, client'ların remote users'larından kontrol et
  if (!track) {
    const videoClient = agoraStore.clients.video.client
    const screenClient = agoraStore.clients.screen.client
    
    if (videoClient && videoClient.remoteUsers) {
      const videoUser = videoClient.remoteUsers.find(u => u.uid === uid)
      if (videoUser && videoUser.videoTrack) {
        track = videoUser.videoTrack
        props.logger.info('Video client uzak kullanıcılarında track bulundu', { uid })
        
        // Track'i store'a da kaydet
        agoraStore.setRemoteTrack(uid, 'video', track)
      }
    }
    
    if (!track && screenClient && screenClient.remoteUsers) {
      const screenUser = screenClient.remoteUsers.find(u => u.uid === uid)
      if (screenUser && screenUser.videoTrack) {
        track = screenUser.videoTrack
        props.logger.info('Ekran client uzak kullanıcılarında track bulundu', { uid })
        
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
      props.logger.info('UID için yerel ekran track\'i bulundu', { uid })
    }
  }
  
  // Son olarak, client'ların remote users'larından kontrol et
  if (!track) {
    const videoClient = agoraStore.clients.video.client
    const screenClient = agoraStore.clients.screen.client
    
    if (videoClient && videoClient.remoteUsers) {
      const videoUser = videoClient.remoteUsers.find(u => u.uid === uid)
      if (videoUser && videoUser.videoTrack) {
        track = screenUser.videoTrack
        props.logger.info('Video client uzak kullanıcılarında track bulundu', { uid })
      }
    }
    
    if (!track && screenClient && screenClient.remoteUsers) {
      const screenUser = screenClient.remoteUsers.find(u => u.uid === uid)
      if (screenUser && screenUser.videoTrack) {
        track = screenUser.videoTrack
        props.logger.info('Ekran client uzak kullanıcılarında track bulundu', { uid })
      }
    }
  }
  
  props.logger.info('Belirli uzak video kurulum detayları', {
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
      
      props.logger.info('UID için video oynatılıyor', { 
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
          props.logger.info('Ekran paylaşımı track\'i etkinleştirildi', { uid })
        } catch (enableError) {
          props.logger.warn('Ekran paylaşımı track\'i etkinleştirilemedi:', enableError)
        }
      }
      
      // Track'i oynat
      await playVideo(track, element)
      props.logger.info('UID için video başarıyla oynatıldı', { uid, isScreenShare })
      
      // Store'a track'i kaydet
      if (!agoraStore.tracks.remote.has(uid)) {
        agoraStore.tracks.remote.set(uid, {})
      }
      agoraStore.tracks.remote.get(uid).video = track
      
    } catch (error) {
      props.logger.error(error, { context: 'setupSpecificRemoteVideo', uid })
    }
  } else {
    props.logger.info(`${uid} UID'si için video kurulamıyor - element veya track eksik`, {
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
        props.logger.error(error, { context: 'setupRemoteAudios', uid })
      }
    }
  }
}

// Event listeners
const setupEventListeners = () => {
  props.logger.info('Merkezi event sistemi kullanılıyor')
  
  // centralEmitter'ın varlığını kontrol et
  if (!props.centralEmitter || typeof props.centralEmitter.on !== 'function') {
    props.logger.info('centralEmitter mevcut değil veya geçersiz')
    return
  }
  
  // Önceki event listener'ları temizle
  props.centralEmitter.off(AGORA_EVENTS.SETUP_REMOTE_VIDEO)
  props.centralEmitter.off(AGORA_EVENTS.LOCAL_VIDEO_READY)
  props.centralEmitter.off(AGORA_EVENTS.REMOTE_VIDEO_UNPUBLISHED)
  props.centralEmitter.off(AGORA_EVENTS.REMOTE_VIDEO_READY)
  props.centralEmitter.off(AGORA_EVENTS.REMOTE_AUDIO_READY)
  props.centralEmitter.off(AGORA_EVENTS.REMOTE_SCREEN_READY)
  props.centralEmitter.off(AGORA_EVENTS.SCREEN_SHARE_STARTED)
  props.centralEmitter.off(AGORA_EVENTS.SCREEN_SHARE_STOPPED)
  
  props.centralEmitter.on(AGORA_EVENTS.SETUP_REMOTE_VIDEO, (data) => {
    setupSpecificRemoteVideo(data.uid)
  })
  
  props.centralEmitter.on(AGORA_EVENTS.LOCAL_VIDEO_READY, async (data) => {
    props.logger.info('Yerel video hazır event (merkezi)', { data, clientType: data.clientType })
    
    await nextTick()
    await setupLocalVideo()
  })
  
  props.centralEmitter.on(AGORA_EVENTS.REMOTE_VIDEO_UNPUBLISHED, (data) => {
    const element = videoRefs.value.get(data.uid)
    if (element) {
      element.innerHTML = ''
    }
  })
  
  props.centralEmitter.on(AGORA_EVENTS.REMOTE_VIDEO_READY, async (data) => {
    props.logger.info('Uzak video hazır event (merkezi)', { data, clientType: data.clientType })
    
    // Track'i hemen store'a kaydet
    const agoraStore = useAgoraStore()
    if (data.track) {
      agoraStore.setRemoteTrack(data.uid, 'video', data.track)
      props.logger.info('Track store\'a kaydedildi', { uid: data.uid, trackId: data.track.id })
    }
    
    // Ekran paylaşımı kullanıcısı için özel işlem
    const user = agoraStore.users.remote.find(u => u.uid === data.uid)
    const isScreenShare = user?.isScreenShare
    
    if (isScreenShare) {
      props.logger.info('Ekran paylaşımı kullanıcısı için özel video kurulumu', { uid: data.uid })
      
      // Ekran paylaşımı için tek seferlik kurulum
      await setupSpecificRemoteVideo(data.uid)
    } else {
      // Normal video için tek seferlik kurulum
      await setupSpecificRemoteVideo(data.uid)
    }
  })
  
  props.centralEmitter.on(AGORA_EVENTS.REMOTE_AUDIO_READY, async (data) => {
    const audioTrack = data.track
    if (audioTrack) {
      try {
        await playAudio(audioTrack)
      } catch (error) {
        props.logger.error(error, { context: 'remote-audio-ready', uid: data.uid })
      }
    }
  })
  
  props.centralEmitter.on(AGORA_EVENTS.REMOTE_SCREEN_READY, async (data) => {
    props.logger.info('Uzak ekran hazır event (merkezi)', { data, clientType: data.clientType })
    
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
  
  props.centralEmitter.on(AGORA_EVENTS.SCREEN_SHARE_STARTED, async (data) => {
    props.logger.info('Ekran paylaşımı başladı event (merkezi)', { data, clientType: data.clientType })
    
    const agoraStore = useAgoraStore()
    
    if (agoraStore.isScreenSharing && agoraStore.tracks.local.screen.video) {
      props.logger.info('Yerel ekran paylaşımı başladı, yerel video yeniden kuruluyor')
      
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
      props.logger.info('Ekran paylaşımı aktif değil veya ekran track\'i yok', {
        isScreenSharing: agoraStore.isScreenSharing,
        hasScreenTrack: !!agoraStore.tracks.local.screen.video
      })
    }
  })
  
  props.centralEmitter.on(AGORA_EVENTS.SCREEN_SHARE_STOPPED, async () => {
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

const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

function closeSettings() {
  showSettings.value = false
}



// Watchers
// Watch local video track changes
watch(() => agoraStore.tracks.local.video.video, (newTrack) => {
  if (newTrack && localVideoRef.value && !isSettingUpLocalVideo.value) {
    props.logger.info('Yerel video track değişti, setup başlatılıyor')
    setupLocalVideo()
  }
}, { immediate: false })

// Watch local video ref changes
watch(localVideoRef, (newRef) => {
  if (newRef && agoraStore.tracks.local.video.video && !isSettingUpLocalVideo.value) {
    props.logger.info('Yerel video ref değişti, setup başlatılıyor')
    setupLocalVideo()
  }
}, { immediate: false })

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
    props.logger.info('Ekran paylaşımı kullanıcısı tespit edildi, ekran videosu kuruluyor')
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
    props.logger.info('Ekran paylaşımı başladı, yerel ekran paylaşımı kuruluyor')
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
    props.logger.info('centralEmitter değişti, event listener\'lar yeniden kuruluyor')
    setupEventListeners()
  }
}, { immediate: true })

onUnmounted(() => {
  videoRefs.value.clear()
  
  // centralEmitter varsa event listener'ları temizle
  if (props.centralEmitter && typeof props.centralEmitter.off === 'function') {
          props.centralEmitter.off(AGORA_EVENTS.SETUP_REMOTE_VIDEO)
      props.centralEmitter.off(AGORA_EVENTS.LOCAL_VIDEO_READY)
      props.centralEmitter.off(AGORA_EVENTS.REMOTE_VIDEO_UNPUBLISHED)
      props.centralEmitter.off(AGORA_EVENTS.REMOTE_VIDEO_READY)
      props.centralEmitter.off(AGORA_EVENTS.REMOTE_AUDIO_READY)
      props.centralEmitter.off(AGORA_EVENTS.REMOTE_SCREEN_READY)
      props.centralEmitter.off(AGORA_EVENTS.SCREEN_SHARE_STARTED)
      props.centralEmitter.off(AGORA_EVENTS.SCREEN_SHARE_STOPPED)
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
  position: relative;
}




</style> 