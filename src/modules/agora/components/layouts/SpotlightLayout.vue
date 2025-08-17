<template>
  <div class="spotlight-layout">
    <!-- Main Speaker Area -->
    <div class="main-speaker-area" :class="{ 'expanded': !isSidebarOpen }">
      <div class="main-content">
        <VideoItem
          v-if="mainSpeaker"
          :user="mainSpeaker"
          :has-video="getUserHasVideo(mainSpeaker)"
          :video-ref="el => setVideoRef(el, mainSpeaker.uid)"
          :track="mainSpeaker.track"
          :is-local="mainSpeaker.isLocal"
          :is-screen-share="mainSpeaker.isScreenShare"
          :is-clickable="true"
          :logUI="logUI"
          :is-main="true"
          @video-click="handleVideoClick"
        />
        
        <!-- No main speaker message -->
        <div v-else class="no-main-speaker">
          <div class="no-main-speaker-content">
            <div class="no-main-speaker-icon">
              <UsersIcon />
            </div>
            <h3>Spotlight Modu</h3>
            <p>Ana konuşmacı bekleniyor...</p>
            <p class="hint">Herhangi bir katılımcıya tıklayarak ana alana taşıyabilirsiniz</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar Toggle Button - Sadece Desktop'ta görünür -->
    <button 
      v-if="!isMobile"
      @click="toggleSidebar" 
      class="sidebar-toggle-btn"
      :title="isSidebarOpen ? 'Sidebar\'ı kapat' : 'Sidebar\'ı aç'"
    >
      <div class="toggle-icon">
        <ChevronLeftIcon v-if="isSidebarOpen" class="icon-left" />
        <ChevronRightIcon v-else class="icon-right" />
      </div>
    </button>

    <!-- Modern Floating Sidebar -->
    <div class="modern-floating-sidebar" :class="{ 'collapsed': !isSidebarOpen }">

      <!-- Sidebar Content -->
      <div class="sidebar-content">
        <div class="sidebar-header">
          <div class="header-content">
            <UsersIcon class="header-icon" />
            <div class="header-text">
              <h4>Katılımcılar</h4>
              <span class="participant-count">{{ otherParticipants.length }} kişi</span>
            </div>
          </div>
        </div>
        
        <div class="participants-list">
          <VideoItem
            v-for="user in otherParticipants"
            :key="user.uid"
            :user="user"
            :has-video="getUserHasVideo(user)"
            :video-ref="el => setVideoRef(el, user.uid)"
            :track="getUserTrack(user)"
            :is-local="user.isLocal"
            :is-screen-share="user.isScreenShare"
            :is-clickable="true"
            :logUI="logUI"
            :is-small="true"
            @video-click="handleVideoClick"
          />
          
          <!-- No participants message -->
          <div v-if="otherParticipants.length === 0" class="no-participants">
            <p>Henüz katılımcı yok</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { UsersIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAgoraStore } from '../../store/index.js'
import { isScreenShareUser } from '../../constants.js'
import VideoItem from '../video/VideoItem.vue'

// Props
const props = defineProps({
  users: { type: Array, default: () => [] },
  localTracks: { type: Object, default: () => ({}) },
  localVideoRef: { type: Object, default: null },
  localScreenRef: { type: Object, default: null },
  logUI: { type: Function, default: () => {} }
})

// Emits
const emit = defineEmits(['video-click', 'set-video-ref', 'set-local-video-ref', 'set-local-screen-ref'])

// Local state
const selectedMainSpeaker = ref(null)
const isSidebarOpen = ref(true) // New state for sidebar visibility

// Mobil cihaz kontrolü
const isMobile = ref(false)

// Mobil kontrolü yap
const checkMobile = () => {
  const newMobileState = window.innerWidth <= 1024 // Tablet ve mobil için
  isMobile.value = newMobileState
}

// Computed
const mainSpeaker = computed(() => {
  // Eğer kullanıcı manuel olarak bir video seçtiyse, onu göster
  if (selectedMainSpeaker.value) {
    const selectedUser = props.users.find(u => u.uid === selectedMainSpeaker.value)
    if (selectedUser) {
      // Seçilen kullanıcı için track'i store'dan al
      const agoraStore = useAgoraStore()
      let track = null
      
      if (isScreenShareUser(selectedUser.uid)) {
        if (selectedUser.isLocal) {
          track = agoraStore.tracks.local.screen.video
        } else {
          track = agoraStore.tracks.remote.get(selectedUser.uid)?.screen
        }
      } else {
        if (selectedUser.isLocal) {
          track = agoraStore.tracks.local.video.video
        } else {
          track = agoraStore.tracks.remote.get(selectedUser.uid)?.video
        }
      }
      
      return {
        ...selectedUser,
        track: track
      }
    }
  }
  
  // Priority: Screen share (UID'ye göre) > Local user > First user with video
  const screenShareUser = props.users.find(u => isScreenShareUser(u.uid))
  
  if (screenShareUser) {
    console.log('🟢 [SPOTLIGHT] Ekran paylaşımı kullanıcısı bulundu:', screenShareUser.uid)
    
    // Ekran paylaşımı kullanıcısı için track'i store'dan al
    const agoraStore = useAgoraStore()
    let track = null
    
    if (screenShareUser.isLocal) {
      track = agoraStore.tracks.local.screen.video
    } else {
      track = agoraStore.tracks.remote.get(screenShareUser.uid)?.screen
    }
    
    return {
      ...screenShareUser,
      track: track,
      isScreenShare: true
    }
  }
  
  // Ekran paylaşımı yoksa normal video kullanıcısı seç
  const localUser = props.users.find(u => u.isLocal && !isScreenShareUser(u.uid))
  if (localUser) return localUser
  
  return props.users.find(u => u.hasVideo && !u.isVideoOff && !isScreenShareUser(u.uid)) || props.users[0] || null
})

const otherParticipants = computed(() => {
  if (!mainSpeaker.value) return props.users
  
  // Sadece ana konuşmacıyı katılımcılar listesinden çıkar
  // Ekran paylaşımı kullanıcıları da katılımcılar listesinde yer alabilir
  const filteredParticipants = props.users.filter(u => u.uid !== mainSpeaker.value.uid)
  
  console.log('🟢 [SPOTLIGHT] Katılımcılar filtrelendi:', {
    totalUsers: props.users.length,
    mainSpeakerUid: mainSpeaker.value?.uid,
    mainSpeakerIsScreenShare: isScreenShareUser(mainSpeaker.value?.uid),
    filteredParticipantsCount: filteredParticipants.length,
    filteredParticipants: filteredParticipants.map(u => ({
      uid: u.uid,
      name: u.name,
      isScreenShare: isScreenShareUser(u.uid)
    }))
  })
  
  return filteredParticipants
})

// Window resize handler
const handleResize = () => {
  const wasMobile = isMobile.value
  checkMobile() // Mobil durumu güncelle
  
  // Eğer desktop'tan mobil'e geçiş yapıldıysa ve sidebar kapalıysa
  if (!wasMobile && isMobile.value && !isSidebarOpen.value) {
    props.logUI('Desktop\'tan mobil\'e geçiş, sidebar otomatik açılıyor')
    isSidebarOpen.value = true
  }
  
  // Eğer mobil'den desktop'a geçiş yapıldıysa
  if (wasMobile && !isMobile.value) {
    props.logUI('Mobil\'den desktop\'a geçiş')
    // Desktop'ta sidebar durumunu koru (kullanıcı tercihi)
  }
}

// Watch for screen share changes
watch(() => props.users, (newUsers) => {
  // Ekran paylaşımı kullanıcısı varsa otomatik olarak ana alana taşı
  const screenShareUser = newUsers.find(u => isScreenShareUser(u.uid))
  if (screenShareUser && selectedMainSpeaker.value !== screenShareUser.uid) {
    props.logUI('Ekran paylaşımı tespit edildi, otomatik olarak ana alana taşınıyor', {
      screenShareUser: screenShareUser.uid,
      previousMainSpeaker: selectedMainSpeaker.value
    })
    selectedMainSpeaker.value = screenShareUser.uid
  }
}, { deep: true })

// Watch for screen share end
watch(() => {
  const agoraStore = useAgoraStore()
  return agoraStore.isScreenSharing
}, (isScreenSharing) => {
  if (!isScreenSharing) {
    // Ekran paylaşımı bittiğinde, eğer ana alanda ekran paylaşımı varsa seçimi kaldır
    if (selectedMainSpeaker.value && props.users.find(u => u.uid === selectedMainSpeaker.value)?.isScreenShare) {
      props.logUI('Ekran paylaşımı bitti, ana alan seçimi kaldırılıyor')
      selectedMainSpeaker.value = null
    }
  }
})

// Lifecycle hooks
onMounted(() => {
  checkMobile() // İlk mobil kontrolü
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Methods
const getUserHasVideo = (user) => {
  if (!user) return false
  
  if (isScreenShareUser(user.uid)) {
    // Ekran paylaşımı için screen track'ini kontrol et
    const agoraStore = useAgoraStore()
    let hasScreenTrack = false
    
    if (user.isLocal) {
      hasScreenTrack = !!agoraStore.tracks.local.screen.video
    } else {
      hasScreenTrack = !!agoraStore.tracks.remote.get(user.uid)?.screen
    }
    
    return hasScreenTrack
  } else {
    // Normal video kullanıcısı için
    return !!user.hasVideo && !user.isVideoOff
  }
}

const getUserTrack = (user) => {
  if (!user) return null
  
  const agoraStore = useAgoraStore()
  
  if (isScreenShareUser(user.uid)) {
    if (user.isLocal) {
      // Yerel ekran paylaşımı için local tracks'dan al
      const track = agoraStore.tracks.local.screen.video
      console.log('🟢 [SPOTLIGHT] Katılımcı yerel ekran paylaşımı track\'i:', {
        uid: user.uid,
        hasTrack: !!track,
        trackId: track?.id
      })
      return track
    } else {
      // Uzak ekran paylaşımı için remote tracks'dan al
      const track = agoraStore.tracks.remote.get(user.uid)?.screen
      console.log('🟢 [SPOTLIGHT] Katılımcı uzak ekran paylaşımı track\'i:', {
        uid: user.uid,
        hasTrack: !!track,
        trackId: track?.id
      })
      return track
    }
  } else {
    // Normal video kullanıcısı için
    if (user.isLocal) {
      const track = agoraStore.tracks.local.video.video
      console.log('🟢 [SPOTLIGHT] Katılımcı yerel video track\'i:', {
        uid: user.uid,
        hasTrack: !!track,
        trackId: track?.id
      })
      return track
    } else {
      const track = agoraStore.tracks.remote.get(user.uid)?.video
      console.log('🟢 [SPOTLIGHT] Katılımcı uzak video track\'i:', {
        uid: user.uid,
        hasTrack: !!track,
        trackId: track?.id
      })
      return track
    }
  }
}

const setVideoRef = (el, uid) => {
  if (uid === 'local') {
    emit('set-local-video-ref', el)
  } else {
    emit('set-video-ref', el, uid)
  }
}

const handleVideoClick = (user) => {
  props.logUI('Spotlight modunda video tıklandı', { 
    clickedUser: user.uid, 
    isLocal: user.isLocal,
    previousMainSpeaker: selectedMainSpeaker.value
  })
  
  // Tıklanan videoyu ana alana taşı
  selectedMainSpeaker.value = user.uid
  props.logUI('Video ana alana taşındı', { newMainSpeaker: user.uid })
  
  emit('video-click', user)
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
  props.logUI('Spotlight modunda sidebar durumu değiştirildi', { isSidebarOpen: isSidebarOpen.value })
}
</script>

<style scoped>
.spotlight-layout {
  display: flex;
  height: 100%;
  width: 100%;
  gap: 1rem;
  padding: 1rem;
}

.main-speaker-area {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: margin-right 0.3s ease, flex-basis 0.3s ease;
  margin-right: 0; /* Default margin */
  height: 100%; /* Desktop'ta tam yükseklik */
  min-height: 0; /* Flex shrink için gerekli */
}

.main-speaker-area .main-content {
  flex: 1;
  min-height: 0; /* Flex shrink için gerekli */
}

.main-speaker-area.expanded {
  flex-basis: 70%; /* Adjust as needed */
  margin-right: 0; /* No margin when sidebar is collapsed */
}

.main-speaker-area:not(.expanded) {
  margin-right: 320px; /* Add margin when sidebar is open (300px + 20px gap) */
  margin-top: 0; /* No top margin needed */
}

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  height: 100%; /* Desktop'ta tam yükseklik */
  width: 100%; /* Desktop'ta tam genişlik */
}

.main-content .video-item {
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-content .video-item .video-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-content .video-item .video-element {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-main-speaker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.no-main-speaker-content {
  text-align: center;
  color: var(--rs-agora-transparent-white-70);
  max-width: 400px;
}

.no-main-speaker-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  opacity: 0.5;
  color: var(--rs-agora-transparent-white-70);
}

.no-main-speaker h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.no-main-speaker p {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  opacity: 0.8;
}

.no-main-speaker .hint {
  font-size: 0.9rem;
  opacity: 0.6;
  font-style: italic;
}

/* Modern Floating Sidebar */
.modern-floating-sidebar {
  position: fixed;
  top: 1rem; /* Header ile aynı hizada */
  right: 1rem;
  height: calc(100% - 2rem); /* 100% - top ve bottom padding */
  background: var(--rs-agora-gradient-video);
  border-radius: var(--rs-agora-radius-xl);
  border: 1px solid var(--rs-agora-border-primary-light);
  box-shadow: 0 8px 32px var(--rs-agora-border-primary-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 100; /* Lower z-index so it doesn't overlap main content */
  transition: width var(--rs-agora-transition-normal), max-width var(--rs-agora-transition-normal);
  width: 300px; /* Default width */
  max-width: 300px; /* Default max-width */
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.modern-floating-sidebar.collapsed {
  width: 0; /* Tamamen gizle */
  max-width: 0; /* Tamamen gizle */
  overflow: hidden;
  opacity: 0.8; /* Hafif şeffaf */
}

.sidebar-toggle-btn {
  position: fixed;
  top: 50%;
  right: 1rem; /* Sağ tarafta sabit */
  transform: translateY(-50%);
  background: var(--rs-agora-gradient-primary);
  border: 2px solid var(--rs-agora-border-primary-medium);
  color: var(--rs-agora-white);
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px var(--rs-agora-border-primary-medium);
  transition: all 0.3s ease;
  z-index: 9999; /* Çok yüksek z-index */
  backdrop-filter: blur(15px);
  min-width: 60px;
  min-height: 60px;
  opacity: 1;
  visibility: visible;
}

.sidebar-toggle-btn:hover {
  background: var(--rs-agora-gradient-secondary);
  border-color: var(--rs-agora-border-primary-heavy);
  transform: translateY(-50%) scale(1.05);
}

.sidebar-toggle-btn .toggle-icon {
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.sidebar-toggle-btn .toggle-icon .icon-left,
.sidebar-toggle-btn .toggle-icon .icon-right {
  width: 24px;
  height: 24px;
  color: var(--rs-agora-white);
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 4px var(--rs-agora-filter-primary-light));
}

.sidebar-toggle-btn:hover .toggle-icon .icon-left,
.sidebar-toggle-btn:hover .toggle-icon .icon-right {
  color: var(--rs-agora-white);
  transform: scale(1.1);
  filter: drop-shadow(0 4px 8px var(--rs-agora-filter-primary-medium));
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 1rem;
  overflow-y: auto;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  background: var(--rs-agora-gradient-blue-05);
}

.modern-floating-sidebar.collapsed .sidebar-content {
  opacity: 0;
  visibility: hidden;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--rs-agora-border-primary-light);
  background: var(--rs-agora-transparent-primary-10);
  padding: 1rem;
  border-radius: 8px;
  backdrop-filter: blur(5px);
}

.sidebar-header .header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sidebar-header .header-icon {
  width: 28px;
  height: 28px;
  color: var(--rs-agora-primary);
  filter: drop-shadow(0 2px 4px var(--rs-agora-filter-primary-light));
}

.sidebar-header .header-text {
  display: flex;
  flex-direction: column;
}

.sidebar-header h4 {
  margin: 0;
  color: var(--rs-agora-white);
  font-size: 1.1rem;
  font-weight: 600;
}

.sidebar-header .participant-count {
  color: var(--rs-agora-transparent-white-70);
  font-size: 0.8rem;
}

.participants-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto; /* Masaüstünde dikey scrolling */
  overflow-x: hidden; /* Yatay scrolling yok */
}

/* Desktop'ta katılımcı video item'ları sidebar genişliği kadar kare */
.participants-list .video-item {
  width: 100%; /* Sidebar genişliği kadar */
  height: auto;
  aspect-ratio: 1; /* Kare yap */
  min-height: 120px; /* Minimum yükseklik */
}

/* Masaüstünde dikey scrollbar */
.participants-list::-webkit-scrollbar {
  width: 6px; /* Dikey scrollbar genişliği */
}

.participants-list::-webkit-scrollbar-track {
  background: var(--rs-agora-transparent-white-10);
  border-radius: 3px;
}

.participants-list::-webkit-scrollbar-thumb {
  background: var(--rs-agora-transparent-white-30);
  border-radius: 3px;
}

.participants-list::-webkit-scrollbar-thumb:hover {
  background: var(--rs-agora-transparent-white-50);
}

.no-participants {
  text-align: center;
  color: var(--rs-agora-transparent-white-50);
  padding: 2rem 1rem;
}

.no-participants p {
  margin: 0;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .spotlight-layout {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .main-speaker-area {
    flex-basis: 100%;
    margin-right: 0; /* Remove margin on tablet/mobile */
  }

  .main-speaker-area.expanded {
    margin-right: 0;
  }

  .main-speaker-area:not(.expanded) {
    margin-right: 0;
  }

  /* Tablet ve mobilde sidebar toggle button'ı gizle */
  .sidebar-toggle-btn {
    display: none !important;
  }

  .modern-floating-sidebar {
    position: fixed;
    bottom: 1rem; /* Mobilde altta */
    left: 1rem; /* Mobilde sol tarafta */
    right: 1rem; /* Mobilde sağ tarafta */
    top: auto; /* Top'u kaldır */
    width: auto; /* Genişlik otomatik */
    max-width: none; /* Max-width kaldır */
    height: 200px; /* Sabit yükseklik */
    flex-direction: column; /* Dikey layout */
    justify-content: flex-start; /* Üstten başla */
    align-items: stretch; /* Tam genişlik */
    padding: 0.5rem;
    background: var(--rs-agora-gradient-video);
    border-radius: 16px;
    border: 1px solid var(--rs-agora-border-primary-light);
    box-shadow: 0 8px 32px var(--rs-agora-shadow-lg);
    backdrop-filter: blur(10px);
    z-index: 1000; /* Mobilde daha yüksek z-index */
  }

  .modern-floating-sidebar.collapsed {
    height: 200px !important; /* Tablet'te her zaman tam yükseklik */
    overflow: visible !important;
  }

  .sidebar-toggle-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem; /* Mobilde sağ üstte */
    left: auto; /* Sol'u kaldır */
    transform: none; /* Transform kaldır */
    margin-left: 0;
    background: var(--rs-agora-gradient-primary);
    border-radius: 50%;
    padding: 0.3rem;
    gap: 0;
    border: 1px solid var(--rs-agora-border-primary-medium);
    z-index: 1001;
  }

  .sidebar-toggle-btn:hover {
    transform: scale(1.05);
  }

  .sidebar-toggle-btn .toggle-icon .icon-left,
  .sidebar-toggle-btn .toggle-icon .icon-right {
    width: 18px;
    height: 18px;
  }

  .sidebar-content {
    flex: 1;
    width: 100%;
    padding: 0.5rem;
    overflow-y: auto;
    overflow-x: hidden;
    opacity: 1;
    visibility: visible;
    background: transparent;
  }

  .sidebar-header {
    padding: 0.5rem;
    background: var(--rs-agora-transparent-primary-10);
    margin-bottom: 0.5rem;
    border-radius: 8px;
    backdrop-filter: blur(5px);
  }

  .header-content {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
  }

  .header-icon {
    width: 20px;
    height: 20px;
  }

  .header-text h4 {
    font-size: 0.9rem;
  }

  .header-text .participant-count {
    font-size: 0.7rem;
  }

  .participants-list {
    display: flex;
    flex-direction: row; /* Yatay layout */
    overflow-x: auto; /* Yatay scrolling */
    overflow-y: hidden; /* Dikey scrolling yok */
    padding: 0.5rem;
    gap: 0.5rem;
    flex-wrap: nowrap; /* Wrap yapma, scroll yap */
    align-items: center;
    min-height: 80px; /* Thumb yüksekliği için minimum yükseklik */
  }

  /* Tablet'te sidebar altta olduğunda yatay scrolling ve sidebar yüksekliği kadar kare */
  .participants-list .video-item {
    flex-shrink: 0; /* Shrink yapma */
    width: 80px; /* Sidebar yüksekliği kadar kare */
    height: 80px;
    min-width: 80px;
    min-height: 80px;
    aspect-ratio: 1; /* Kare yap */
  }

  /* Tablet'te yatay scrollbar */
  .participants-list::-webkit-scrollbar {
    height: 4px; /* Yatay scrollbar yüksekliği */
  }

  .participants-list::-webkit-scrollbar-track {
    background: var(--rs-agora-transparent-white-10);
    border-radius: 2px;
  }

  .participants-list::-webkit-scrollbar-thumb {
    background: var(--rs-agora-transparent-primary-50);
    border-radius: 2px;
  }

  .participants-list::-webkit-scrollbar-thumb:hover {
    background: var(--rs-agora-transparent-primary-70);
  }
}

@media (max-width: 768px) {
  .spotlight-layout {
    padding: 0.5rem;
  }
  
  .main-speaker-area {
    min-height: 300px;
  }

  .main-speaker-area.expanded {
    min-height: 300px;
  }
  
  .modern-floating-sidebar {
    bottom: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
    height: 180px; /* Mobilde daha küçük */
    padding: 0.3rem;
  }

  .modern-floating-sidebar.collapsed {
    height: 180px !important; /* Mobilde her zaman tam yükseklik */
    max-height: 180px !important;
    overflow: visible !important;
  }

  .sidebar-toggle-btn {
    top: 0.3rem;
    right: 0.3rem;
    padding: 0.25rem;
    background: var(--rs-agora-gradient-primary);
  }

  .sidebar-toggle-btn .toggle-icon .icon-left,
  .sidebar-toggle-btn .toggle-icon .icon-right {
    width: 16px;
    height: 16px;
  }

  .sidebar-content {
    padding: 0.3rem;
  }

  .sidebar-header {
    padding: 0.3rem;
    background: var(--rs-agora-transparent-primary-10);
    margin-bottom: 0.3rem;
  }

  .header-icon {
    width: 18px;
    height: 18px;
  }

  .header-text h4 {
    font-size: 0.8rem;
  }

  .header-text .participant-count {
    font-size: 0.6rem;
  }

  .participants-list {
    padding: 0.3rem;
    gap: 0.3rem;
    min-height: 70px;
  }
  
  /* Mobilde sidebar genişliği kadar kare video item'lar */
  .participants-list .video-item {
    flex-shrink: 0; /* Shrink yapma */
    width: 70px; /* Sidebar yüksekliği kadar kare */
    height: 70px;
    min-width: 70px;
    min-height: 70px;
    aspect-ratio: 1; /* Kare yap */
  }
  
  /* Mobilde yatay scrollbar */
  .participants-list::-webkit-scrollbar {
    height: 3px; /* Mobilde daha ince yatay scrollbar */
  }

  .participants-list::-webkit-scrollbar-track {
    background: var(--rs-agora-transparent-white-10);
    border-radius: 2px;
  }

  .participants-list::-webkit-scrollbar-thumb {
    background: var(--rs-agora-transparent-primary-50);
    border-radius: 2px;
  }

  .participants-list::-webkit-scrollbar-thumb:hover {
    background: var(--rs-agora-transparent-primary-70);
  }
}
</style>
