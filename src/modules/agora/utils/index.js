/**
 * Agora Utils Dışa Aktarımı
 * Bu dosya, tüm Agora utility'lerini merkezi bir noktadan dışa aktarır.
 * Utility'ler modüler yapıda organize edilmiştir ve buradan tek noktadan erişilebilir.
 * @module utils
 */

// Merkezi event emitter - Tüm modüller arası iletişim
export { centralEmitter } from './centralEmitter.js'

// Event deduplication - Aynı event'lerin tekrar işlenmesini önler
export {
  createEventKey,
  registerEvent,
  registerClient,
  unregisterClient,
  cleanupCentralEvents,
  getRegisteredClients,
  getProcessedEvents
} from './eventDeduplication.js'

// Common utility functions - Genel kullanım fonksiyonları
export {
  createSafeTimeout,
  formatTime,
  formatDuration,
  formatFileSize,
  getUserInitials,
  generateSessionId,
  debounce,
  throttle,
  sanitizeString,
  isValidEmail,
  isValidUrl,
  deepClone,
  generateRandomId
} from './common.js'

// Type definitions - Type tanımları
export {
  USER_TYPES,
  TRACK_TYPES,
  CONNECTION_STATES,
  NETWORK_QUALITY,
  DEVICE_TYPES,
  PERMISSION_STATES,
  MEDIA_TYPES,
  EVENT_TYPES,
  DEFAULT_VALUES
} from './types.js' 