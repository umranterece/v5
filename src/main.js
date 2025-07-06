import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import agoraModule from './modules/agora/index.js'

const app = createApp(App)
const pinia = createPinia()

// Initialize Pinia
app.use(pinia)

// Initialize Agora module
agoraModule.initializeAgoraModule(pinia)

app.mount('#app')
