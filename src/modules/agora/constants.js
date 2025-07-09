/**
 * Agora SDK Constants
 */

// API Endpoints
export const API_ENDPOINTS = {
  CREATE_TOKEN: 'https://umranterece.com/test/agora/createToken.php'
}

// Agora Client Configuration
export const AGORA_CONFIG = {
  mode: 'rtc',
  codec: 'h264', // H264 daha hızlı
  enableDualStream: false, // Tek stream kullan - daha iyi performans
  enableAudioRecording: false, // Audio recording kapalı
  enableVideoRecording: false, // Video recording kapalı
  enableHighPerformance: true, // Yüksek performans modu
  enableCloudProxy: false // Cloud proxy kapalı - daha hızlı
}

// Kamera (video) için yüksek kalite ayarları
export const VIDEO_CONFIG = {
  encoderConfig: '1080p_1', // 1920x1080 çözünürlük
  facingMode: 'user',       // Ön kamera (mobilde)
  bitrateMin: 2000,         // Minimum bitrate (kbps)
  bitrateMax: 4000,         // Maksimum bitrate (kbps)
  frameRate: 30             // 30 FPS
}

// Audio Configuration
export const AUDIO_CONFIG = {
  encoderConfig: 'music_standard',
  gain: 1.0, // Normal gain seviyesi - ses seviyesini tutarlı tutmak için
  echoCancellation: true, // Echo cancellation açık
  noiseSuppression: true, // Noise suppression açık
  autoGainControl: false // Auto gain control kapalı - manuel kontrol için
}

// Error Codes
export const ERROR_CODES = {
  INVALID_APP_ID: 'INVALID_APP_ID',
  CLIENT_NOT_INITIALIZED: 'CLIENT_NOT_INITIALIZED',
  JOIN_FAILED: 'JOIN_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND'
}

// Storage Keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'agora_user_preferences',
  CHANNEL_NAME: 'agora_channel_name'
}

// User ID Ranges
export const USER_ID_RANGES = {
  VIDEO: {
    MIN: 1000,
    MAX: 2000
  },
  SCREEN_SHARE: {
    MIN: 2000,
    MAX: 3000
  }
}

// User Type Detection Functions - Kullanıcı tipini UID'ye göre belirler
export const getUserType = (uid) => {
  if (uid >= USER_ID_RANGES.VIDEO.MIN && uid < USER_ID_RANGES.VIDEO.MAX) {
    return 'VIDEO'
  } else if (uid >= USER_ID_RANGES.SCREEN_SHARE.MIN && uid < USER_ID_RANGES.SCREEN_SHARE.MAX) {
    return 'SCREEN_SHARE'
  } else {
    return 'UNKNOWN'
  }
}

export const isVideoUser = (uid) => {
  return uid >= USER_ID_RANGES.VIDEO.MIN && uid < USER_ID_RANGES.VIDEO.MAX
}

export const isScreenShareUser = (uid) => {
  return uid >= USER_ID_RANGES.SCREEN_SHARE.MIN && uid < USER_ID_RANGES.SCREEN_SHARE.MAX
}

export const getUserDisplayName = (uid, baseName = 'User') => {
  const userType = getUserType(uid)
  
  switch (userType) {
    case 'VIDEO':
      return `${baseName} ${uid}`
    case 'SCREEN_SHARE':
      return `Ekran Paylaşımı ${uid} (You)`
    default:
      return `${baseName} ${uid}`
  }
}

export const getRemoteUserDisplayName = (uid, baseName = 'User') => {
  const userType = getUserType(uid)
  
  switch (userType) {
    case 'VIDEO':
      return `${baseName} ${uid}`
    case 'SCREEN_SHARE':
      return `Ekran Paylaşımı ${uid}`
    default:
      return `${baseName} ${uid}`
  }
}

// Channel Names
export const CHANNEL_NAMES = {
  VIDEO: (baseName) => `${baseName}`,
  SCREEN_SHARE: (baseName) => `${baseName}` // Aynı channel'a katıl
}

// Default Values
export const DEFAULTS = {
  CHANNEL_NAME: 'test-channel',
  USER_NAME: 'User',
  UID_MIN: 10000,
  UID_MAX: 100000,
  TOKEN_EXPIRE_TIME: 86400, // 24 hours
  ROLE_PUBLISHER: 1,
  ROLE_SUBSCRIBER: 0
} 

// Ekran paylaşımı için yüksek kalite ayarları
export const SCREEN_SHARE_CONFIG = {
  encoderConfig: '1080p_1',     // 1920x1080 çözünürlük
  optimizationMode: 'detail',   // Detay için optimize
  bitrateMin: 2000,             // Minimum bitrate (kbps)
  bitrateMax: 4000,             // Maksimum bitrate (kbps)
  frameRate: 30                 // 30 FPS
} 