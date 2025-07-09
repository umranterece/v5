import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useMeeting, AgoraVideo, initializeAgoraModule } from './modules/agora'

const app = createApp(App)
const pinia = createPinia()

// Initialize Pinia
app.use(pinia)

// Initialize Agora module
initializeAgoraModule(pinia)

app.mount('#app')
