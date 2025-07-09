/**
 * Vue 3 Agora Module
 * @module agora
 */

// Main composable - Video konferans işlemlerini yönetir
export { useMeeting } from './composables/useMeeting.js'

// Individual composables (internal use)
export { useVideo } from './composables/useVideo.js'
export { useScreenShare } from './composables/useScreenShare.js'
export { useDeviceDetection } from './composables/useDeviceDetection.js'

// Components
export * from './components/index.js'

// Services
export * from './services/index.js'

// Store exports
export { useAgoraStore } from './store/index.js'

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
  // initializeAgoraStores() // Removed as per edit hint
}

// Import for default export
import { useMeeting } from './composables/useMeeting.js'
import { useVideo } from './composables/useVideo.js'
import { useScreenShare } from './composables/useScreenShare.js'
import { useDeviceDetection } from './composables/useDeviceDetection.js'
import { AgoraVideo, AgoraControls, StreamQualityBar } from './components/index.js'
import { createToken } from './services/index.js'
import { useAgoraStore } from './store/index.js' // Changed from initializeAgoraStores

/**
 * Default export for the entire module
 */
export default {
  useMeeting,
  useVideo,
  useScreenShare,
  useDeviceDetection,
  AgoraVideo,
  AgoraControls,
  StreamQualityBar,
  createToken,
  useAgoraStore,
  initializeAgoraModule
} 