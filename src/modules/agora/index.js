/**
 * Vue 3 Agora Module
 * @module agora
 */

// Sadece ana composable ve ana API'ler dışa açılır
export * from './composables'
export * from './components'
export * from './services'
export * from './store'
export * from './constants'
export * from './types'

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