<template>
  <div id="app">
    <AgoraConference 
      :options="agoraOptions"
      @change="handleChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { AgoraConference } from './modules/agora/index.js'
import { useTheme } from './modules/agora/composables/useTheme.js'

// Tema sistemini başlat
const { initializeTheme } = useTheme()

// Agora konfigürasyon seçenekleri
const agoraOptions = ref({
  channelName: 'test-123456',
  autoJoin: true,  // true yaparak test ediyorum
  userUid: null,   // null = random UID
  tokenEndpoint: null, // null = varsayılan API endpoint
  logActive: true  // true = loglama aktif, false = loglama pasif
})

// Event handler - Tüm event'leri tek noktadan yönet
const handleChange = (event) => {
  const { type, data } = event
  
  switch (type) {
    case 'joined':
      console.log('Kanala katıldı:', data)
      break
      
    case 'left':
      console.log('Kanaldan ayrıldı:', data)
      break
      
    case 'error':
      console.error('Hata oluştu:', data)
      break
      
    case 'user-joined':
      console.log('Kullanıcı katıldı:', data)
      break
      
    case 'user-left':
      console.log('Kullanıcı ayrıldı:', data)
      break
      
    case 'connection-state-change':
      console.log('Bağlantı durumu değişti:', data)
      break
      
    case 'token-requested':
      console.log('Token istendi:', data)
      break
      
    case 'token-received':
      console.log('Token alındı:', data)
      break
      
    case 'settings-changed':
      console.log('Ayarlar değişti:', data)
      
      // Log ayarları güncellendiğinde local state'i güncelle
      if (data.logActive !== undefined) {
        agoraOptions.value.logActive = data.logActive
        console.log('Log aktifliği değişti:', data.logActive)
      }
      break
      
    default:
      console.log('Bilinmeyen event type:', type, data)
      break
  }
}

// Component mount olduğunda temayı başlat
onMounted(() => {
  initializeTheme()
})
</script>

<style>
/* Tema CSS'ini import et */
@import './modules/agora/assets/themes.css';

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




</style>
