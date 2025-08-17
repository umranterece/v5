<template>
  <div class="presentation-layout">
    <!-- Main Presentation Area -->
    <div class="presentation-area" :class="{ 'expanded': isSidebarCollapsed }">
      <div class="main-content">
        <VideoItem
          v-if="presenter"
          :user="presenter"
          :has-video="getUserHasVideo(presenter)"
          :video-ref="el => setVideoRef(el, presenter.uid)"
          :track="getPresenterTrack(presenter)"
          :is-local="presenter.isLocal"
          :is-screen-share="isScreenShareUser(presenter.uid)"
          :is-clickable="false"
          :logUI="logUI"
          :is-presenter="true"
          @video-click="handleVideoClick"
        />
        
        <!-- No presenter message -->
        <div v-else class="no-presenter">
          <div class="no-presenter-content">
            <div class="no-presenter-icon">
              <PresentationChartBarIcon />
            </div>
            <h3>Sunum Modu</h3>
            <p>Sunum yapacak kişi bekleniyor...</p>
            <p class="hint">Ekran paylaşımı yaparak sunuma başlayabilirsiniz</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar Toggle Button - Always Visible -->
    <!-- Toggle Button - Sadece Desktop'ta görünür -->
    <button 
      v-if="!isMobile"
      @click="toggleSidebar" 
      class="sidebar-toggle-btn"
      :title="isSidebarCollapsed ? 'Katılımcıları göster' : 'Katılımcıları gizle'"
    >
      <div class="toggle-icon">
        <UsersIcon v-if="isSidebarCollapsed" class="icon-open" />
        <XMarkIcon v-else class="icon-close" />
      </div>
    </button>

    <!-- Modern Floating Sidebar -->
    <div class="modern-floating-sidebar" :class="{ 'collapsed': isSidebarCollapsed }">

      <!-- Sidebar Content -->
      <div class="sidebar-content">
        <div class="sidebar-header">
          <div class="header-content">
            <UsersIcon class="header-icon" />
            <div class="header-text">
              <h4>Katılımcılar</h4>
              <span class="participant-count">{{ participants.length }} kişi</span>
            </div>
          </div>
        </div>
        
        <div class="participants-list">
          <VideoItem
            v-for="user in participants"
            :key="user.uid"
            :user="user"
            :has-video="getUserHasVideo(user)"
            :video-ref="el => setVideoRef(el, user.uid)"
            :track="getUserTrack(user)"
            :is-local="user.isLocal"
            :is-screen-share="isScreenShareUser(user.uid)"
            :is-clickable="false"
            :logUI="logUI"
            :is-small="true"
            @video-click="handleVideoClick"
          />
          
          <!-- No participants message -->
          <div v-if="participants.length === 0" class="no-participants">
            <p>Henüz katılımcı yok</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { PresentationChartBarIcon, UsersIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
const isSidebarCollapsed = ref(false)

// Mobil cihaz kontrolü
const isMobile = ref(false)

// Mobil kontrolü yap
const checkMobile = () => {
  const newMobileState = window.innerWidth <= 1024 // Tablet ve mobil için
  isMobile.value = newMobileState
}

// Computed
const presenter = computed(() => {
  // Priority: Screen share (UID'ye göre) > Local user > First user with video
  const screenShareUser = props.users.find(u => isScreenShareUser(u.uid))
  
  // Debug log
  console.log('🟢 [PRESENTATION] Users listesi:', props.users.map(u => ({
    uid: u.uid,
    name: u.name,
    isScreenShare: u.isScreenShare,
    isLocal: u.isLocal,
    hasVideo: u.hasVideo,
    isVideoOff: u.isVideoOff,
    isScreenShareByUID: isScreenShareUser(u.uid)
  })))
  
  if (screenShareUser) {
    console.log('🟢 [PRESENTATION] Ekran paylaşımı kullanıcısı bulundu (UID\'ye göre):', screenShareUser.uid)
    
    // Ekran paylaşımı kullanıcısı için track'i store'dan al
    const agoraStore = useAgoraStore()
    let track = null
    
    if (screenShareUser.isLocal) {
      // Yerel ekran paylaşımı için local tracks'dan al
      track = agoraStore.tracks.local.screen.video
      console.log('🟢 [PRESENTATION] Yerel ekran paylaşımı track\'i:', !!track)
    } else {
      // Uzak ekran paylaşımı için remote tracks'dan al
      track = agoraStore.tracks.remote.get(screenShareUser.uid)?.screen
      console.log('🟢 [PRESENTATION] Uzak ekran paylaşımı track\'i:', !!track)
    }
    
    return {
      ...screenShareUser,
      track: track,
      isScreenShare: true // UID'ye göre ekran paylaşımı olduğunu garanti et
    }
  }
  
  console.log('🟡 [PRESENTATION] Ekran paylaşımı kullanıcısı bulunamadı')
  
  // Ekran paylaşımı yoksa normal video kullanıcısı seç
  const localUser = props.users.find(u => u.isLocal && !isScreenShareUser(u.uid))
  if (localUser) return localUser
  
  return props.users.find(u => u.hasVideo && !u.isVideoOff && !isScreenShareUser(u.uid)) || props.users[0] || null
})

const participants = computed(() => {
  if (!presenter.value) return props.users
  
  // Ekran paylaşımı kullanıcısını katılımcılar listesinden çıkar
  const filteredParticipants = props.users.filter(u => u.uid !== presenter.value.uid && !isScreenShareUser(u.uid))
  
  // Debug log
  console.log('🟢 [PRESENTATION] Katılımcılar filtrelendi:', {
    totalUsers: props.users.length,
    presenterUid: presenter.value?.uid,
    presenterIsScreenShare: isScreenShareUser(presenter.value?.uid),
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
  if (!wasMobile && isMobile.value && isSidebarCollapsed.value) {
    props.logUI('Desktop\'tan mobil\'e geçiş, sidebar otomatik açılıyor')
    isSidebarCollapsed.value = false
  }
  
  // Eğer mobil'den desktop'a geçiş yapıldıysa
  if (wasMobile && !isMobile.value) {
    props.logUI('Mobil\'den desktop\'a geçiş')
    // Desktop'ta sidebar durumunu koru (kullanıcı tercihi)
  }
}

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

const getPresenterTrack = (user) => {
  if (!user) return null
  
  const agoraStore = useAgoraStore()
  
  if (isScreenShareUser(user.uid)) {
    if (user.isLocal) {
      // Yerel ekran paylaşımı için local tracks'dan al
      const track = agoraStore.tracks.local.screen.video
      console.log('🟢 [PRESENTATION] Yerel ekran paylaşımı track\'i:', {
        uid: user.uid,
        hasTrack: !!track,
        trackId: track?.id,
        trackEnabled: track?.enabled,
        trackReadyState: track?.readyState
      })
      return track
    } else {
      // Uzak ekran paylaşımı için remote tracks'dan al
      const track = agoraStore.tracks.remote.get(user.uid)?.screen
      console.log('🟢 [PRESENTATION] Uzak ekran paylaşımı track\'i:', {
        uid: user.uid,
        hasTrack: !!track,
        trackId: track?.id,
        trackEnabled: track?.enabled,
        trackReadyState: track?.readyState
      })
      return track
    }
  } else {
    // Normal video kullanıcısı için
    if (user.isLocal) {
      const track = agoraStore.tracks.local.video.video
      console.log('🟢 [PRESENTATION] Yerel video track\'i:', {
        uid: user.uid,
        hasTrack: !!track,
        trackId: track?.id
      })
      return track
    } else {
      const track = agoraStore.tracks.remote.get(user.uid)?.video
      console.log('🟢 [PRESENTATION] Uzak video track\'i:', {
        uid: user.uid,
        hasTrack: !!track,
        trackId: track?.id
      })
      return track
    }
  }
}

const getUserTrack = (user) => {
  if (!user) return null
  
  const agoraStore = useAgoraStore()
  
  if (isScreenShareUser(user.uid)) {
    if (user.isLocal) {
      // Yerel ekran paylaşımı için local tracks'dan al
      const track = agoraStore.tracks.local.screen.video
      console.log('🟢 [PRESENTATION] Katılımcı yerel ekran paylaşımı track\'i:', {
        uid: user.uid,
        hasTrack: !!track,
        trackId: track?.id
      })
      return track
    } else {
      // Uzak ekran paylaşımı için remote tracks'dan al
      const track = agoraStore.tracks.remote.get(user.uid)?.screen
      console.log('🟢 [PRESENTATION] Katılımcı uzak ekran paylaşımı track\'i:', {
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
      console.log('🟢 [PRESENTATION] Katılımcı yerel video track\'i:', {
        uid: user.uid,
        hasTrack: !!track,
        trackId: track?.id
      })
      return track
    } else {
      const track = agoraStore.tracks.remote.get(user.uid)?.video
      console.log('🟢 [PRESENTATION] Katılımcı uzak video track\'i:', {
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
  emit('video-click', user)
}

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
  props.logUI('Sunum modunda sidebar durumu değiştirildi', { 
    isSidebarCollapsed: isSidebarCollapsed.value,
    participantsCount: participants.value.length
  })
}
</script>

<style scoped>
.presentation-layout {
  display: flex;
  height: 100%;
  width: 100%;
  gap: 1rem;
  padding: 1rem;
}

.presentation-area {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: margin-right 0.3s ease, flex-basis 0.3s ease;
  margin-right: 0; /* Default margin */
  height: 100%; /* Desktop'ta tam yükseklik */
  min-height: 0; /* Flex shrink için gerekli */
}

.presentation-area .main-content {
  flex: 1;
  min-height: 0; /* Flex shrink için gerekli */
}

.presentation-area.expanded {
  flex-basis: 70%; /* Adjust as needed */
  margin-right: 0; /* No margin when sidebar is collapsed */
}

.presentation-area:not(.expanded) {
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

.no-presenter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.no-presenter-content {
  text-align: center;
  color: var(--rs-agora-transparent-white-70);
  max-width: 400px;
}

.no-presenter-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-presenter-icon svg {
  width: 48px;
  height: 48px;
  color: var(--rs-agora-text-secondary);
}

.no-presenter h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.no-presenter p {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  opacity: 0.8;
}

.no-presenter .hint {
  font-size: 0.9rem;
  opacity: 0.6;
  font-style: italic;
}

/* Modern Floating Sidebar */
.modern-floating-sidebar {
  position: fixed;
  top: 1rem; /* Header ile aynı hizada (presentation-layout padding: 1rem) */
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
  font-size: 1.1rem;
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
  /* Buton her zaman görünür */
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

.sidebar-toggle-btn .toggle-icon .icon-open,
.sidebar-toggle-btn .toggle-icon .icon-close {
  width: 24px;
  height: 24px;
  color: var(--rs-agora-white);
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 4px var(--rs-agora-filter-primary-light));
}

.sidebar-toggle-btn:hover .toggle-icon .icon-open {
  color: var(--rs-agora-white);
  transform: scale(1.1);
  filter: drop-shadow(0 4px 8px var(--rs-agora-filter-primary-medium));
}

.sidebar-toggle-btn:hover .toggle-icon .icon-close {
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
  .presentation-layout {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .presentation-area {
    flex-basis: 100%;
    margin-right: 0; /* Remove margin on tablet/mobile */
  }

  .presentation-area.expanded {
    margin-right: 0;
  }

  .presentation-area:not(.expanded) {
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
  
  /* Mobilde collapsed state'i devre dışı bırak */
  @media (max-width: 768px) {
    .modern-floating-sidebar.collapsed {
      height: 180px !important; /* Mobilde her zaman tam yükseklik */
      overflow: visible !important;
    }
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

  .sidebar-toggle-btn .toggle-icon {
    font-size: 1rem;
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
    font-size: 1.2rem;
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
  .presentation-layout {
    padding: 0.5rem;
  }
  
  .presentation-area {
    min-height: 300px;
  }
  
  .modern-floating-sidebar {
    bottom: 0.5rem;
    left: 0.5rem;
    right: 0.5rem;
    height: 180px; /* Mobilde daha küçük */
    padding: 0.3rem;
  }

  /* Mobilde collapsed state yok - her zaman açık */
  .modern-floating-sidebar.collapsed {
    height: 180px !important; /* Mobilde her zaman tam yükseklik */
    overflow: visible !important;
  }
  
  /* Mobilde toggle button'ı gizle */
  .sidebar-toggle-btn {
    display: none !important;
  }

  .sidebar-toggle-btn {
    top: 0.3rem;
    right: 0.3rem;
    padding: 0.25rem;
    background: var(--rs-agora-gradient-primary);
  }

  .sidebar-toggle-btn .toggle-icon {
    font-size: 0.9rem;
  }
  
  .sidebar-toggle-btn .toggle-icon .icon-open {
    font-size: 1rem;
    color: var(--rs-agora-white);
  }
  
  .sidebar-toggle-btn .toggle-icon .icon-close {
    font-size: 0.9rem;
    color: var(--rs-agora-white);
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
    font-size: 1rem;
  }

  .header-text h4 {
    font-size: 0.8rem;
  }

  .header-text .participant-count {
    font-size: 0.6rem;
  }

  .participants-list {
    display: flex;
    flex-direction: row; /* Yatay layout */
    overflow-x: auto; /* Yatay scrolling */
    overflow-y: hidden; /* Dikey scrolling yok */
    padding: 0.3rem;
    gap: 0.3rem;
    flex-wrap: nowrap; /* Wrap yapma, scroll yap */
    align-items: center;
    min-height: 70px; /* Mobilde daha küçük thumb */
  }
  
  /* Mobilde sidebar altta olduğunda yatay scrolling ve sidebar yüksekliği kadar kare */
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
