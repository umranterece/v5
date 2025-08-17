<template>
  <div class="spotlight-layout">
    <!-- Main Speaker (Large) -->
    <div class="main-speaker" :class="{ 'expanded': !isSidebarOpen }">
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
    </div>

    <!-- Modern Sidebar -->
    <div class="modern-sidebar" :class="{ 'collapsed': !isSidebarOpen }">
      <!-- Sidebar Toggle Button -->
      <button 
        @click="toggleSidebar" 
        class="sidebar-toggle-btn"
        :title="isSidebarOpen ? 'Sidebar\'ı kapat' : 'Sidebar\'ı aç'"
      >
        <div class="toggle-icon">
          <span v-if="isSidebarOpen">◀</span>
          <span v-else>▶</span>
        </div>
        <span v-if="!isSidebarOpen" class="collapsed-count">{{ otherParticipants.length }}</span>
      </button>

      <!-- Sidebar Content -->
      <div class="sidebar-content">
        <div class="sidebar-header">
          <div class="header-content">
            <div class="header-icon">👥</div>
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
        </div>
      </div>
    </div>

    <!-- No participants message -->
    <div v-if="!mainSpeaker && otherParticipants.length === 0" class="no-participants">
      <div class="no-participants-content">
        <div class="no-participants-icon">👥</div>
        <h3>Henüz katılımcı yok</h3>
        <p>Spotlight modu için katılımcılar bekleniyor...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useAgoraStore } from '../../store/index.js'
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

// State
const selectedMainSpeaker = ref(null)
const isSidebarOpen = ref(true) // New state for sidebar visibility

// Computed
const mainSpeaker = computed(() => {
  // Eğer kullanıcı manuel olarak bir video seçtiyse, onu göster
  if (selectedMainSpeaker.value) {
    const selectedUser = props.users.find(u => u.uid === selectedMainSpeaker.value)
    if (selectedUser) {
      const agoraStore = useAgoraStore()
      let track = null
      
      if (selectedUser.isScreenShare) {
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
  
  // Priority: Screen share > Local user > First remote user
  const screenShareUser = props.users.find(u => u.isScreenShare)
  if (screenShareUser) {
    // Ekran paylaşımı kullanıcısı için track'i store'dan al
    const agoraStore = useAgoraStore()
    let track = null
    
    if (screenShareUser.isLocal) {
      // Yerel ekran paylaşımı için local tracks'dan al
      track = agoraStore.tracks.local.screen.video
    } else {
      // Uzak ekran paylaşımı için remote tracks'dan al
      track = agoraStore.tracks.remote.get(screenShareUser.uid)?.screen
    }
    
    return {
      ...screenShareUser,
      track: track
    }
  }
  
  const localUser = props.users.find(u => u.isLocal)
  if (localUser) {
    // Yerel kullanıcı için track'i store'dan al
    const agoraStore = useAgoraStore()
    const track = agoraStore.tracks.local.video.video
    
    return {
      ...localUser,
      track: track
    }
  }
  
  return props.users[0] || null
})

const otherParticipants = computed(() => {
  if (!mainSpeaker.value) return []
  return props.users.filter(u => u.uid !== mainSpeaker.value.uid)
})

// Watch for screen share changes
watch(() => props.users, (newUsers) => {
  // Ekran paylaşımı kullanıcısı varsa otomatik olarak ana alana taşı
  const screenShareUser = newUsers.find(u => u.isScreenShare)
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

// Methods
const getUserHasVideo = (user) => {
  if (!user) return false
  return !!user.hasVideo && !user.isVideoOff
}

const getUserTrack = (user) => {
  if (!user) return null
  
  const agoraStore = useAgoraStore()
  
  if (user.isScreenShare) {
    if (user.isLocal) {
      // Yerel ekran paylaşımı için local tracks'dan al
      return agoraStore.tracks.local.screen.video
    } else {
      // Uzak ekran paylaşımı için remote tracks'dan al
      return agoraStore.tracks.remote.get(user.uid)?.screen
    }
  } else {
    // Normal video kullanıcısı için
    if (user.isLocal) {
      return agoraStore.tracks.local.video.video
    } else {
      return agoraStore.tracks.remote.get(user.uid)?.video
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
    isScreenShare: user.isScreenShare,
    previousMainSpeaker: selectedMainSpeaker.value
  })
  
  // Eğer tıklanan video zaten ana alandaysa, seçimi kaldır
  if (selectedMainSpeaker.value === user.uid) {
    selectedMainSpeaker.value = null
    props.logUI('Ana alan seçimi kaldırıldı, otomatik seçim aktif')
  } else {
    // Tıklanan videoyu ana alana taşı
    selectedMainSpeaker.value = user.uid
    props.logUI('Video ana alana taşındı', { newMainSpeaker: user.uid })
  }
  
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
  gap: 1rem;
  height: 100%;
  padding: 1rem;
  background: var(--rs-agora-gradient-bg);
  border-radius: var(--rs-agora-radius-lg);
  overflow: hidden;
}

.main-speaker {
  flex: 2;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--rs-agora-radius-lg);
  overflow: hidden;
  box-shadow: var(--rs-agora-shadow-lg);
  position: relative;
  transition: flex 0.3s ease-in-out;
}

.main-speaker.expanded {
  flex: 3; /* Expand when sidebar is closed */
  min-height: 500px; /* Adjust min-height for expanded state */
}

.main-speaker::before {
  content: '🌟 Ana Alan';
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--rs-agora-transparent-black-70);
  color: var(--rs-agora-white);
  padding: 4px 8px;
  border-radius: var(--rs-agora-radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 10;
}

.modern-sidebar {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--rs-agora-gradient-blue);
  border-radius: var(--rs-agora-radius-xl);
  box-shadow: var(--rs-agora-shadow-lg);
  transition: width 0.3s ease-in-out;
  overflow: hidden;
  position: relative; /* Added for toggle button positioning */
  border: 1px solid var(--rs-agora-transparent-white-10);
  backdrop-filter: blur(10px);
}

.modern-sidebar.collapsed {
  width: 60px; /* Collapsed width */
}

.sidebar-toggle-btn {
  background: none;
  border: none;
  color: var(--rs-agora-white);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--rs-agora-radius-md);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 10;
  background: var(--rs-agora-gradient-blue-hover);
  border: 1px solid var(--rs-agora-transparent-white-20);
  backdrop-filter: blur(10px);
}

.sidebar-toggle-btn:hover {
  background: var(--rs-agora-gradient-blue-active);
  border-color: var(--rs-agora-transparent-white-40);
  transform: scale(1.05);
}

.toggle-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.modern-sidebar.collapsed .toggle-icon {
  transform: rotate(180deg);
}

.collapsed-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--rs-agora-white);
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  z-index: 10;
  background: var(--rs-agora-transparent-black-30);
  padding: 0.2rem 0.4rem;
  border-radius: var(--rs-agora-radius-sm);
  backdrop-filter: blur(5px);
}

.sidebar-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-header {
  padding: 0.5rem 0.5rem 0.5rem 0.5rem; /* Adjusted padding */
  border-bottom: 1px solid var(--rs-agora-transparent-white-10);
  background: var(--rs-agora-gradient-blue);
  border-radius: var(--rs-agora-radius-md);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(5px);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-icon {
  font-size: 1.2rem;
  color: var(--rs-agora-white);
}

.header-text h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--rs-agora-white);
}

.header-text .participant-count {
  font-size: 0.7rem;
  color: var(--rs-agora-transparent-white-70);
}

.participants-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-participants {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.no-participants-content {
  text-align: center;
  color: var(--rs-agora-transparent-white-70);
}

.no-participants-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-participants h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.no-participants p {
  margin: 0;
  font-size: 1rem;
  opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .spotlight-layout {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .main-speaker {
    flex: none;
    min-height: 300px;
  }
  
  .main-speaker.expanded {
    flex: none;
    min-height: 300px;
  }
  
  .modern-sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 0.5rem;
    padding: 0.5rem;
    max-height: 120px;
    background: var(--rs-agora-gradient-blue);
  }

  .modern-sidebar.collapsed {
    width: 60px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-height: 60px;
  }

  .sidebar-toggle-btn {
    position: static;
    background: var(--rs-agora-gradient-blue-active);
    border-radius: var(--rs-agora-radius-sm);
    padding: 0.3rem 0.5rem;
    gap: 0.25rem;
    border: 1px solid var(--rs-agora-transparent-white-20);
  }

  .toggle-icon {
    font-size: 1rem;
  }

  .collapsed-count {
    position: static;
    font-size: 0.6rem;
    margin-top: 0.25rem;
    background: var(--rs-agora-transparent-black-50);
  }

  .sidebar-header {
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.3rem 0.3rem;
    background: var(--rs-agora-gradient-blue-hover);
  }

  .header-content {
    flex-direction: column;
    align-items: center;
  }

  .header-icon {
    font-size: 1rem;
  }

  .header-text h4 {
    font-size: 0.7rem;
  }

  .header-text .participant-count {
    font-size: 0.5rem;
  }

  .sidebar-content {
    flex: none;
    width: 100%;
    padding: 0;
    overflow-x: auto;
    overflow-y: hidden;
    opacity: 1;
    visibility: visible;
  }

  .participants-list {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.5rem;
    gap: 0.25rem;
  }
}

@media (max-width: 768px) {
  .spotlight-layout {
    padding: 0.5rem;
  }
  
  .main-speaker {
    min-height: 250px;
  }

  .main-speaker.expanded {
    min-height: 250px;
  }
  
  .modern-sidebar {
    gap: 0.25rem;
    max-height: 100px;
    padding: 0.3rem;
  }

  .modern-sidebar.collapsed {
    width: 60px;
    height: 60px;
    max-height: 60px;
  }

  .sidebar-toggle-btn {
    background: var(--rs-agora-gradient-blue-active);
    border-radius: var(--rs-agora-radius-sm);
    padding: 0.3rem 0.5rem;
    gap: 0.25rem;
    border: 1px solid var(--rs-agora-transparent-white-30);
  }

  .toggle-icon {
    font-size: 1rem;
  }

  .collapsed-count {
    font-size: 0.6rem;
    background: var(--rs-agora-transparent-black-50);
  }

  .sidebar-header {
    padding: 0.2rem 0.2rem;
    background: var(--rs-agora-gradient-blue-active);
  }

  .header-icon {
    font-size: 0.9rem;
  }

  .header-text h4 {
    font-size: 0.6rem;
  }

  .header-text .participant-count {
    font-size: 0.4rem;
  }
  
  .main-speaker::before {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
}
</style>
