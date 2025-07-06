/**
 * Agora Store Exports
 * @module store
 */

import { useVideoStore } from './video.js'

export { useVideoStore }

/**
 * Initialize all Agora stores
 * @returns {Object} All store instances
 */
export function initializeAgoraStores() {
  return {
    video: useVideoStore(),
  }
}

/**
 * Reset all Agora stores
 */
export function resetAllAgoraStores() {
  const stores = initializeAgoraStores()
  Object.values(stores).forEach(store => store.reset())
} 