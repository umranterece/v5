/**
 * Agora SDK Constants
 */

// Environment Detection - Auto-detect
export const IS_DEV = process.env.NODE_ENV === 'development'
export const IS_PROD = process.env.NODE_ENV === 'production'
export const IS_SSR = false

// API Endpoints
export const API_ENDPOINTS = {
  CREATE_TOKEN: IS_DEV 
    ? 'https://umranterece.com/test/agora/createToken.php'  // Development
    : 'https://umranterece.com/test/agora/createToken.php',  // Production
  RECORDING: IS_DEV
    ? 'https://umranterece.com/test/agora/recording.php'  // Development
    : 'https://umranterece.com/test/agora/recording.php'   // Production
}

// Agora Client Configuration
export const AGORA_CONFIG = {
  mode: 'rtc',
  codec: 'h264', // H264 daha hızlı
  enableDualStream: false, // Tek stream kullan - daha iyi performans
  enableAudioRecording: false, // Audio recording kapalı
  enableVideoRecording: false, // Video recording kapalı
  enableHighPerformance: IS_PROD, // Production'da yüksek performans
  enableCloudProxy: false // Cloud proxy kapalı - daha hızlı
}

// Kamera (video) için yüksek kalite ayarları
export const VIDEO_CONFIG = {
  encoderConfig: IS_DEV ? '720p_1' : '1080p_1', // Development'ta daha düşük kalite
  facingMode: 'user',       // Ön kamera (mobilde)
  bitrateMin: IS_DEV ? 1000 : 2000,         // Development'ta daha düşük bitrate
  bitrateMax: IS_DEV ? 2000 : 4000,         // Development'ta daha düşük bitrate
  frameRate: IS_DEV ? 24 : 30               // Development'ta daha düşük FPS
}

// Audio Configuration
export const AUDIO_CONFIG = {
  encoderConfig: 'music_standard',
  gain: 1.0, // Normal gain seviyesi - ses seviyesini tutarlı tutmak için
  echoCancellation: true, // Echo cancellation açık
  noiseSuppression: true, // Noise suppression açık
  autoGainControl: false // Auto gain control kapalı - manuel kontrol için
}

// Hata Kodları
export const ERROR_CODES = {
  INVALID_APP_ID: 'GEÇERSİZ_APP_ID',
  CLIENT_NOT_INITIALIZED: 'CLIENT_BAŞLATILMADI',
  JOIN_FAILED: 'KATILMA_BAŞARISIZ',
  NETWORK_ERROR: 'AĞ_HATASI',
  DEVICE_NOT_FOUND: 'CIHAZ_BULUNAMADI'
}

// Kullanıcı Dostu Hata Mesajları
export const USER_FRIENDLY_ERRORS = {
  // Network Errors
  NETWORK_ERROR: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
  CONNECTION_TIMEOUT: 'Bağlantı zaman aşımına uğradı. Lütfen tekrar deneyin.',
  SERVER_ERROR: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
  
  // Device Errors
  CAMERA_PERMISSION_DENIED: 'Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera iznini verin.',
  MICROPHONE_PERMISSION_DENIED: 'Mikrofon izni reddedildi. Lütfen tarayıcı ayarlarından mikrofon iznini verin.',
  DEVICE_NOT_FOUND: 'Kamera veya mikrofon bulunamadı. Lütfen cihazlarınızı kontrol edin.',
  DEVICE_IN_USE: 'Kamera veya mikrofon başka bir uygulama tarafından kullanılıyor.',
  
  // Screen Share Errors
  SCREEN_SHARE_NOT_SUPPORTED: 'Bu tarayıcıda ekran paylaşımı desteklenmiyor.',
  SCREEN_SHARE_CANCELLED: 'Ekran paylaşımı iptal edildi.',
  SCREEN_SHARE_FAILED: 'Ekran paylaşımı başlatılamadı. Lütfen tekrar deneyin.',
  
  // Channel Errors
  CHANNEL_JOIN_FAILED: 'Kanala katılınamadı. Lütfen kanal adını kontrol edin.',
  CHANNEL_FULL: 'Kanal dolu. Lütfen daha sonra tekrar deneyin.',
  INVALID_CHANNEL_NAME: 'Geçersiz kanal adı. Lütfen farklı bir ad deneyin.',
  
  // General Errors
  UNKNOWN_ERROR: 'Bilinmeyen bir hata oluştu. Lütfen sayfayı yenileyin.',
  OPERATION_FAILED: 'İşlem başarısız oldu. Lütfen tekrar deneyin.',
  TIMEOUT_ERROR: 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.'
}

// Error Handling Utility
export const getErrorMessage = (error) => {
  if (!error) return USER_FRIENDLY_ERRORS.UNKNOWN_ERROR
  
  const errorMessage = error.message || error.toString()
  const errorName = error.name || ''
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    return USER_FRIENDLY_ERRORS.NETWORK_ERROR
  }
  
  // Permission errors
  if (errorName === 'NotAllowedError' || errorMessage.includes('permission')) {
    if (errorMessage.includes('camera')) {
      return USER_FRIENDLY_ERRORS.CAMERA_PERMISSION_DENIED
    }
    if (errorMessage.includes('microphone')) {
      return USER_FRIENDLY_ERRORS.MICROPHONE_PERMISSION_DENIED
    }
    return USER_FRIENDLY_ERRORS.CAMERA_PERMISSION_DENIED
  }
  
  // Device errors
  if (errorName === 'NotFoundError' || errorMessage.includes('device')) {
    return USER_FRIENDLY_ERRORS.DEVICE_NOT_FOUND
  }
  
  // Screen share errors
  if (errorName === 'NotSupportedError' || errorMessage.includes('screen')) {
    return USER_FRIENDLY_ERRORS.SCREEN_SHARE_NOT_SUPPORTED
  }
  
  // Channel errors
  if (errorMessage.includes('channel') || errorMessage.includes('join')) {
    return USER_FRIENDLY_ERRORS.CHANNEL_JOIN_FAILED
  }
  
  // Timeout errors
  if (errorMessage.includes('timeout')) {
    return USER_FRIENDLY_ERRORS.TIMEOUT_ERROR
  }
  
  // Default
  return USER_FRIENDLY_ERRORS.UNKNOWN_ERROR
}

// Depolama Anahtarları
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'agora_user_preferences',
  CHANNEL_NAME: 'agora_channel_name'
}

// Kullanıcı ID Aralıkları
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

// Kullanıcı Tipi Tespit Fonksiyonları - Kullanıcı tipini UID'ye göre belirler
export const getUserType = (uid) => {
  if (uid >= USER_ID_RANGES.VIDEO.MIN && uid < USER_ID_RANGES.VIDEO.MAX) {
    return 'VIDEO'
  } else if (uid >= USER_ID_RANGES.SCREEN_SHARE.MIN && uid < USER_ID_RANGES.SCREEN_SHARE.MAX) {
    return 'SCREEN_SHARE'
  } else {
    return 'BİLİNMEYEN'
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

// Kanal Adları
export const CHANNEL_NAMES = {
  VIDEO: (baseName) => `${baseName}`,
  SCREEN_SHARE: (baseName) => `${baseName}` // Aynı channel'a katıl
}

// Varsayılan Değerler
export const DEFAULTS = {
  CHANNEL_NAME: IS_DEV ? 'dev-test-channel' : 'test-channel',
  USER_NAME: 'User',
  UID_MIN: 10000,
  UID_MAX: 100000,
  TOKEN_EXPIRE_TIME: 86400, // 24 hours
  ROLE_PUBLISHER: 1,
  ROLE_SUBSCRIBER: 0
}

// Development ayarları
export const DEV_CONFIG = {
  ENABLE_DEBUG_LOGS: IS_DEV,
  ENABLE_PERFORMANCE_TRACKING: IS_DEV,
  ENABLE_DETAILED_ERRORS: IS_DEV,
  LOG_LEVEL: IS_DEV ? 'debug' : 'error',
  RETRY_DELAY: IS_DEV ? 100 : 500, // Development'ta daha hızlı retry
  PENDING_CHECK_INTERVAL: IS_DEV ? 200 : 500, // Development'ta daha sık kontrol
  SCREEN_SHARE_RETRY_DELAY: IS_DEV ? 100 : 300, // Ekran paylaşımı için daha hızlı retry
  MAX_RETRY_COUNT: IS_DEV ? 5 : 3 // Development'ta daha fazla deneme
} 

// Ekran paylaşımı için optimize edilmiş ayarlar
export const SCREEN_SHARE_CONFIG = {
  // Hızlı başlatma için optimize edilmiş ayarlar
  FAST_START: {
    encoderConfig: '720p_1',      // 1280x720 çözünürlük - daha hızlı
    optimizationMode: 'motion',   // Hareket için optimize - daha iyi performans
    bitrateMin: 800,              // Minimum bitrate (kbps) - daha düşük
    bitrateMax: 1500,             // Maksimum bitrate (kbps) - daha düşük
    frameRate: 15                 // 15 FPS - daha düşük, daha akıcı
  },
  
  // Düşük kalite fallback ayarları
  LOW_QUALITY: {
    encoderConfig: '480p_1',      // 640x480 çözünürlük - çok düşük
    optimizationMode: 'motion',   // Hareket için optimize
    bitrateMin: 400,              // Minimum bitrate (kbps) - çok düşük
    bitrateMax: 800,              // Maksimum bitrate (kbps) - çok düşük
    frameRate: 10                 // 10 FPS - çok düşük
  },
  
  // Yüksek kalite ayarları (sadece güçlü bağlantılar için)
  HIGH_QUALITY: {
    encoderConfig: '1080p_1',     // 1920x1080 çözünürlük
    optimizationMode: 'detail',   // Detay için optimize
    bitrateMin: 2000,             // Minimum bitrate (kbps)
    bitrateMax: 4000,             // Maksimum bitrate (kbps)
    frameRate: 30                 // 30 FPS
  }
} 

// Event Types - Merkezi event sistemi için event tanımları
export const AGORA_EVENTS = {
  // Connection Events
  CLIENT_INITIALIZED: 'client-initialized',
  CLIENT_INIT_ERROR: 'client-init-error',
  
  // Channel Events
  CHANNEL_JOINED: 'channel-joined',
  CHANNEL_LEFT: 'channel-left',
  JOIN_ERROR: 'join-error',
  LEAVE_ERROR: 'leave-error',
  
  // Local Track Events
  LOCAL_AUDIO_READY: 'local-audio-ready',
  LOCAL_VIDEO_READY: 'local-video-ready',
  LOCAL_AUDIO_ERROR: 'local-audio-error',
  LOCAL_VIDEO_ERROR: 'local-video-error',
  
  // Remote Track Events
  REMOTE_AUDIO_READY: 'remote-audio-ready',
  REMOTE_VIDEO_READY: 'remote-video-ready',
  REMOTE_SCREEN_READY: 'remote-screen-ready',
  REMOTE_VIDEO_UNPUBLISHED: 'remote-video-unpublished',
  REMOTE_TRACK_REMOVED: 'remote-track-removed',
  
  // User Events
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  USER_PUBLISHED: 'user-published',
  USER_UNPUBLISHED: 'user-unpublished',
  
  // Connection State Events
  CONNECTION_STATE_CHANGE: 'connection-state-change',
  NETWORK_QUALITY: 'network-quality',
  
  // Track Events
  TRACKS_PUBLISHED: 'tracks-published',
  SUBSCRIBE_ERROR: 'subscribe-error',
  CREATE_TRACKS_ERROR: 'create-tracks-error',
  
  // Device Events
  DEVICE_STATUS_CHANGE: 'device-status-change',
  DEVICE_PERMISSION_CHANGE: 'device-permission-change',
  
  // Control Events
  CAMERA_TOGGLED: 'camera-toggled',
  MICROPHONE_TOGGLED: 'microphone-toggled',
  
  // Screen Share Events
  SCREEN_SHARE_STARTED: 'screen-share-started',
  SCREEN_SHARE_STOPPED: 'screen-share-stopped',
  
  // Recording Events
  RECORDING_STARTED: 'recording-started',
  RECORDING_STOPPED: 'recording-stopped',
  RECORDING_ERROR: 'recording-error',
  RECORDING_STATUS_CHANGED: 'recording-status-changed',
  RECORDING_FILE_READY: 'recording-file-ready',
  
  // Setup Events
  SETUP_REMOTE_VIDEO: 'setup-remote-video',
  
  // General Events
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// Recording Events - Ayrı export için
export const RECORDING_EVENTS = {
  RECORDING_STARTED: 'recording-started',
  RECORDING_STOPPED: 'recording-stopped',
  RECORDING_ERROR: 'recording-error',
  RECORDING_STATUS_CHANGED: 'recording-status-changed',
  RECORDING_FILE_READY: 'recording-file-ready'
}