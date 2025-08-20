/**
 * Agora SDK Constants
 */

// Environment Detection - Production mode
export const IS_DEV = false
export const IS_PROD = true
export const IS_SSR = false

// Agora App Configuration
export const AGORA_APP_ID = 'c9fe4999e3334b54baee7f46cb7b5b6e'
export const AGORA_APP_CERTIFICATE = 'f43b74986ac141648c13ba3ae4d83410'

// Storage Provider Configuration
export const STORAGE_PROVIDER = 'azure' // 'azure' veya 'custom'

// Logging Configuration
export const LOG_CONFIG = {
  MAX_LOGS_PER_FILE: 10000 // 1000 log sonra otomatik temizleme
}

// API Endpoints
export const API_ENDPOINTS = {
  CREATE_TOKEN: IS_DEV 
    ? 'https://umranterece.com/test/agora/createToken.php'  // Development
    : 'https://umranterece.com/test/agora/createToken.php',  // Production
    RECORDING: IS_DEV
    ? 'https://umranterece.com/test/agora/createRecording.php'  // Development
    : 'https://umranterece.com/test/agora/createRecording.php'   // Production
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
  },
  WHITEBOARD: {  // 🆕 YENİ
    MIN: 3000,
    MAX: 4000
  }
}

// Kullanıcı Tipi Tespit Fonksiyonları - Kullanıcı tipini UID'ye göre belirler
export const getUserType = (uid) => {
  if (uid >= USER_ID_RANGES.VIDEO.MIN && uid < USER_ID_RANGES.VIDEO.MAX) {
    return 'VIDEO'
  } else if (uid >= USER_ID_RANGES.SCREEN_SHARE.MIN && uid < USER_ID_RANGES.SCREEN_SHARE.MAX) {
    return 'SCREEN_SHARE'
  } else if (uid >= USER_ID_RANGES.WHITEBOARD.MIN && uid < USER_ID_RANGES.WHITEBOARD.MAX) {
    return 'WHITEBOARD'  // 🆕 YENİ
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

export const isWhiteboardUser = (uid) => {  // 🆕 YENİ
  return uid >= USER_ID_RANGES.WHITEBOARD.MIN && uid < USER_ID_RANGES.WHITEBOARD.MAX
}

export const getUserDisplayName = (uid, baseName = 'User') => {
  const userType = getUserType(uid)
  
  switch (userType) {
    case 'VIDEO':
      return `${baseName} ${uid}`
    case 'SCREEN_SHARE':
      return `Ekran Paylaşımı ${uid} (You)`
    case 'WHITEBOARD':           // 🆕 YENİ
      return `Whiteboard ${uid} (You)`
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
    case 'WHITEBOARD':           // 🆕 YENİ
      return `Whiteboard ${uid}`
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
  
  // Netless Whiteboard Events - 🎨 NETLESS
  NETLESS_ROOM_JOINED: 'netless-room-joined',
  NETLESS_ROOM_LEFT: 'netless-room-left',
  NETLESS_TOOL_CHANGED: 'netless-tool-changed',
  NETLESS_MEMBER_JOINED: 'netless-member-joined',
  NETLESS_MEMBER_LEFT: 'netless-member-left',
  NETLESS_ERROR: 'netless-error',
  
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

// 🎥 COMPOSITE RECORDING CONFIGURATION
export const RECORDING_CONFIG = {
  // Storage Provider Selection (Tek ayar ile değiştirilebilir)
  STORAGE_PROVIDER: 'azure', // 'azure' veya 'custom'
  
  // Azure Storage Configuration
  AZURE: {
    VENDOR_ID: 1, // Azure Storage vendor ID
    REGION: 0, // Global region
    CONTAINER: 'agora-recordings',
    DOMAIN: 'blob.core.windows.net',
    ACCESS_KEY: 'YOUR_AZURE_STORAGE_ACCESS_KEY_HERE',
    SECRET_KEY: 'YOUR_AZURE_STORAGE_SECRET_KEY_HERE'
  },
  
  // Custom Server Configuration
  CUSTOM: {
    VENDOR_ID: 99, // Custom vendor ID
    ENDPOINT: 'https://your-server.com/api/recording',
    API_KEY: 'your_custom_api_key',
    FORMAT: 'webm',
    COMPRESSION: true
  },
  
  // Composite Recording Mode (Önerilen)
  COMPOSITE: {
    MODE: 'composite', // Tek dosyada tüm stream'ler
    STREAM_TYPES: 2, // Audio + Video
    CHANNEL_TYPE: 1, // Live streaming
    MAX_IDLE_TIME: 30, // 30 saniye boşluk sonrası otomatik durdurma
    SUBSCRIBE_AUDIO_UIDS: [], // Tüm audio'ları kaydet
    SUBSCRIBE_VIDEO_UIDS: [], // Tüm video'ları kaydet
    SUBSCRIBE_UID_GROUP: 0, // Tüm kullanıcıları kaydet
    RECORDING_FILE_CONFIG: {
      AV_FILE_TYPE: ['mp4', 'webm'], // Format seçenekleri
      FILE_COMPRESS: true, // Sıkıştırma açık
      FILE_MAX_SIZE_MB: 512 // Maksimum dosya boyutu
    }
  },
  
  // Whiteboard Recording Integration
  WHITEBOARD: {
    ENABLED: true, // Whiteboard recording açık
    FORMAT: 'svg', // Vector format (en küçük boyut)
    CAPTURE_MODE: 'realtime', // Gerçek zamanlı kayıt
    INCLUDE_CURSOR: true, // Fare imleci dahil
    INCLUDE_TOOL_CHANGES: true, // Araç değişimleri dahil
    INCLUDE_TIMESTAMPS: true, // Zaman damgaları dahil
    FRAME_RATE: 30 // 30 FPS whiteboard kayıt
  },
  
  // Recording Perspectives
  PERSPECTIVES: {
    HOST: 'host', // Host/Moderatör gözünden (en kapsamlı)
    AUDIENCE: 'audience', // Audience gözünden (sadece önemli)
    WHITEBOARD: 'whiteboard' // Sadece whiteboard odaklı
  },
  
  // Default Perspective
  DEFAULT_PERSPECTIVE: 'host',
  
  // Recording Quality Settings
  QUALITY: {
    HIGH: {
      RESOLUTION: '1080p',
      BITRATE_MIN: 2000,
      BITRATE_MAX: 4000,
      FRAME_RATE: 30
    },
    MEDIUM: {
      RESOLUTION: '720p',
      BITRATE_MIN: 1000,
      BITRATE_MAX: 2000,
      FRAME_RATE: 24
    },
    LOW: {
      RESOLUTION: '480p',
      BITRATE_MIN: 500,
      BITRATE_MAX: 1000,
      FRAME_RATE: 15
    }
  },
  
  // Default Quality
  DEFAULT_QUALITY: 'medium'
}

// Netless Whiteboard Events 🎨 NETLESS
export const NETLESS_EVENTS = {
  ROOM_JOINED: 'netless-room-joined',
  ROOM_LEFT: 'netless-room-left',
  ROOM_DISCONNECTED: 'netless-room-disconnected',
  TOOL_CHANGED: 'netless-tool-changed',
  COLOR_CHANGED: 'netless-color-changed',
  STROKE_CHANGED: 'netless-stroke-changed',
  DRAWING_STARTED: 'netless-drawing-started',
  DRAWING_ENDED: 'netless-drawing-ended',
  SCENE_CHANGED: 'netless-scene-changed',
  MEMBER_JOINED: 'netless-member-joined',
  MEMBER_LEFT: 'netless-member-left',
  PHASE_CHANGED: 'netless-phase-changed',
  ERROR_OCCURRED: 'netless-error'
}

// Netless Whiteboard Configuration 🎨 NETLESS
export const NETLESS_CONFIG = {
  // SDK Ayarları - Gerçek Netless credentials
  SDK: {
    // 🔑 Netless App Identifier
    APP_IDENTIFIER: 'EImzMH1UEfCwKrcQj8VaJw/YY3x9tyQ5nhB2w',
    // 🔑 Netless SDK Token (Gerçek token)
    API_TOKEN: 'NETLESSSDK_YWs9aGJoVFd0UTliTk5VLXVGaSZub25jZT1hZGIwNDJhMC03ZDU0LTExZjAtYjAyYS1iNzEwOGZjNTVhMjcmcm9sZT0wJnNpZz1mZmI2NzU3ZGM4OGYxMTUxMDdiMWE4ZjMwMTlmNGFmOWNlYTM1Njg0NTQyNjdjZjBjM2FmNGJiZjNjMjFkMzY4',
    // Debug: Token doğru mu?
    DEBUG_TOKEN: true,
    REGION: 'cn-hz', // China Hangzhou region (daha hızlı)
    TIMEOUT: 45000, // 45 seconds
    LOG_LEVEL: IS_DEV ? 'debug' : 'warn',
    // Real Netless API endpoints
    API_BASE_URL: 'https://api.netless.link/v5',
    TOKEN_URL: 'https://api.netless.link/v5/tokens/rooms',
    ROOM_URL: 'https://api.netless.link/v5/rooms',
    // PHP Backend endpoints (hosting'de)
    PHP_BACKEND_URL: 'https://umranterece.com/test/agora/createWhiteboard.php'
  },
  
  // Room Ayarları
  ROOM: {
    DEFAULT_NAME: 'agora-whiteboard-room',
    MODE: 'historied', // 'historied' or 'freedom'
    LIMIT: 100, // Maximum members
    TIMEOUT: 45000 // 45 seconds
  },
  
  // Fastboard Ayarları
  FASTBOARD: {
    CONTAINER_ID: 'netless-whiteboard',
    THEME: 'auto', // 'light', 'dark', 'auto'
    LANGUAGE: 'tr-TR', // Turkish
    HOTKEYS: {
      UNDO: 'cmd+z',
      REDO: 'cmd+shift+z',
      DELETE: 'delete',
      DUPLICATE: 'cmd+d'
    }
  },
  
  // Tool Ayarları
  TOOLS: {
    SELECTOR: 'selector',
    PENCIL: 'pencil',
    RECTANGLE: 'rectangle',
    ELLIPSE: 'ellipse',
    ARROW: 'arrow',
    TEXT: 'text',
    ERASER: 'eraser',
    LASER_POINTER: 'laserPointer',
    HAND: 'hand'
  },
  
  // Varsayılan Ayarlar
  DEFAULTS: {
    TOOL: 'pencil',
    STROKE_WIDTH: 2,
    STROKE_COLOR: '#1e1e1e',
    FILL: false,
    TEXT_SIZE: 16,
    SHAPE_TYPE: 'rectangle'
  },
  
  // UI Ayarları
  UI: {
    TOOLBAR_POSITION: 'top',
    SHOW_ROOM_CONTROLLER: true,
    SHOW_REDO_UNDO: true,
    SHOW_ZOOM_CONTROL: true,
    SHOW_DOCS_CENTER: false,
    SHOW_PRESETS: true
  },
  
  // Performance Ayarları
  PERFORMANCE: {
    MAX_CONCURRENT_USERS: 50,
    SYNC_INTERVAL: 16, // 60 FPS
    OPTIMISTIC_DRAWING: true,
    ENABLE_RTMP: false
  }
}

// Notification System Constants 🔔
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
  SYSTEM: 'system'
}

export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical'
}

export const NOTIFICATION_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  TOP_CENTER: 'top-center',
  BOTTOM_CENTER: 'bottom-center'
}

export const NOTIFICATION_DEFAULTS = {
  AUTO_DISMISS: true,           // ✅ Varsayılan olarak otomatik kapanma açık
  AUTO_DISMISS_DELAY: 5000,     // ⏱️ 5 saniye sonra kapanır
  MAX_NOTIFICATIONS: 5,         // 📊 Maksimum 5 bildirim
  POSITION: NOTIFICATION_POSITIONS.TOP_RIGHT,
  ANIMATION_DURATION: 100
}

export const NOTIFICATION_CATEGORIES = {
  SYSTEM: 'system',
  USER: 'user',
  NETWORK: 'network',
  DEVICE: 'device',
  RECORDING: 'recording',
  STORAGE: 'storage',
  SECURITY: 'security'
}