<template>
  <div id="app">
    <!-- Tema Seçici -->
    <div class="app-header">
      <ThemeSelector />
    </div>
    

    
    <AgoraConference 
      :channelName="channelName"
      :autoJoin="autoJoin"
      :userUid="userUid"
      :tokenEndpoint="tokenEndpoint"
      :debugMode="debugMode"
      @joined="handleJoined"
      @left="handleLeft"
      @error="handleError"
      @user-joined="handleUserJoined"
      @user-left="handleUserLeft"
      @connection-state-change="handleConnectionStateChange"
      @token-requested="handleTokenRequested"
      @token-received="handleTokenReceived"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { AgoraConference, ThemeSelector } from './modules/agora/index.js'
import { useTheme } from './modules/agora/composables/useTheme.js'

// Tema sistemini başlat
const { initializeTheme } = useTheme()

// Kanal ayarları
const channelName = ref('test-252')
const autoJoin = ref(true)  // false yaparak test ediyorum

// Token ayarları
const tokenEndpoint = ref(null) // null = varsayılan API endpoint

// Kullanıcı ayarları
const userUid = ref(null) // null = random UID

// Debug ayarları
const debugMode = ref(false) // true = günlükleri göster, false = gizle

// Event handlers
const handleJoined = (data) => {
  console.log('Kanala katıldı:', data)
}

const handleLeft = (data) => {
  console.log('Kanaldan ayrıldı:', data)
}

const handleError = (data) => {
  console.error('Hata oluştu:', data)
}

const handleUserJoined = (data) => {
  console.log('Kullanıcı katıldı:', data)
}

const handleUserLeft = (data) => {
  console.log('Kullanıcı ayrıldı:', data)
}

const handleConnectionStateChange = (data) => {
  console.log('Bağlantı durumu değişti:', data)
}

const handleTokenRequested = (data) => {
  console.log('Token istendi:', data)
}

const handleTokenReceived = (data) => {
  console.log('Token alındı:', data)
}

// Component mount olduğunda temayı başlat
onMounted(() => {
  initializeTheme()
})
</script>

<style>
/* Tema CSS'ini import et */
@import './assets/themes.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
  height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
}

#app {
  min-height: 100vh;
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

/* App Header */
.app-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1001;
  padding: 16px;
  background: var(--rs-agora-surface-primary);
  border-bottom: 1px solid var(--rs-agora-border-primary);
  border-left: 1px solid var(--rs-agora-border-primary);
  border-bottom-left-radius: var(--rs-agora-radius-lg);
  box-shadow: var(--rs-agora-shadow-md);
}


</style>
