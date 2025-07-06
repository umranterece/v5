/**
 * Vue 3 Agora Module
 * @module agora
 */

// Main composable - Tüm Agora işlemlerini toplar
export { useAgora } from './composables/useAgora.js'

// Components
export { default as AgoraVideo } from './components/AgoraVideo.vue'
export { default as AgoraControls } from './components/AgoraControls.vue'

// Store exports (gerekirse doğrudan erişim için)
export { useVideoStore, initializeAgoraStores, resetAllAgoraStores } from './store/index.js'

// Constants, Events, and Types
export * from './constants.js'
export * from './events.js'
export * from './types.js'

/**
 * Initialize Agora module with Pinia
 * @param {Object} pinia - Pinia instance
 */
export function initializeAgoraModule(pinia) {
  // Pinia is automatically detected in Vue 3
  // This function can be used for additional initialization if needed
  console.log('Agora module initialized with Pinia')
  
  // Store'ları initialize et
  initializeAgoraStores()
}

// Import for default export
import { useAgora } from './composables/useAgora.js'
import AgoraVideo from './components/AgoraVideo.vue'
import AgoraControls from './components/AgoraControls.vue'
import { useVideoStore, initializeAgoraStores, resetAllAgoraStores } from './store/index.js'

/**
 * Default export for the entire module
 */
export default {
  useAgora,
  AgoraVideo,
  AgoraControls,
  useVideoStore,
  initializeAgoraStores,
  resetAllAgoraStores,
  initializeAgoraModule
} 