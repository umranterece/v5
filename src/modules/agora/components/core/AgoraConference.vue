<template>
  <div class="agora-conference">
    <!-- Loading Screen -->
    <div v-if="isLoading" class="loading-screen">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        
        <!-- Progress Bar -->
        <div v-if="props.options.autoJoin && channelName" class="progress-container">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: getProgressWidth() }"
            ></div>
          </div>
          <div class="progress-text">{{ getProgressText() }}</div>
        </div>
        
        <img src="https://www.rehberimsensin.com/assets/images/logo.svg" alt="Rehberim Sensin" class="loading-logo" />
        <h3 v-if="props.options.autoJoin && channelName">Agora Konferans Bağlanıyor...</h3>
        <h3 v-else>Agora Konferans Yükleniyor...</h3>
        <p v-if="props.options.autoJoin && channelName">
          <span class="loading-channel">{{ channelName }}</span> kanalına bağlanılıyor...
        </p>
        <p v-else>Lütfen bekleyin, sistem hazırlanıyor</p>
        
        <!-- Auto join durumu için ek bilgi -->
        <div v-if="props.options.autoJoin && channelName" class="loading-status">
          <div class="status-item" :class="{ active: loadingStatus === 'token' }">
            <span class="status-icon">🔗</span>
            <span>Token alınıyor...</span>
          </div>
          <div class="status-item" :class="{ active: loadingStatus === 'connecting' }">
            <span class="status-icon">📡</span>
            <span>Kanala katılım yapılıyor...</span>
          </div>
          <div class="status-item" :class="{ active: loadingStatus === 'connected' }">
            <span class="status-icon">✅</span>
            <span>Bağlantı kuruldu!</span>
          </div>
        </div>
        
        <!-- Genel loading mesajı -->
        <div class="loading-message">
          {{ loadingMessage }}
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main v-else class="conference-main">
      <!-- Join Form - Bağlı olmadığında göster -->
      <JoinForm
        v-if="!isConnected"
        :defaultChannel="channelName"
        :isJoining="!!isJoining"
        @join="handleJoin"
      />
      
      <!-- Video Area - Bağlı olduğunda göster -->
      <div v-if="isConnected" class="video-area">
        <AgoraVideo
          ref="agoraVideoRef"
          :centralEmitter="centralEmitter"
          :localUser="localUser || {}"
          :remoteUsers="remoteUsers || []"
          :allUsers="allUsers || []"
          :localTracks="localTracks || {}"
          :remoteTracks="remoteTracks || new Map()"
          :logger="loggers.video"
        />
      </div>
      
      <!-- Controls Area - Sadece bağlı olduğunda göster -->
      <div v-if="isConnected" class="controls-area">
        <AgoraControls
          :channelName="channelName"
          :isConnected="!!isConnected"
          :isLocalVideoOff="!!isLocalVideoOff"
          :isLocalAudioMuted="!!isLocalAudioMuted"
          :canUseCamera="canUseCamera"
          :canUseMicrophone="canUseCamera"
          :connectedUsersCount="connectedUsersCount || 0"
          :isJoining="!!isJoining"
          :isLeaving="!!isLeaving"
          :onJoin="handleJoin"
          :onLeave="handleLeave"
          :onToggleCamera="handleToggleCamera"
          :onToggleMicrophone="handleToggleMicrophone"
          :isScreenSharing="isScreenSharing"
          :onToggleScreenShare="toggleScreenShare"
          :supportsScreenShare="supportsScreenShare"
          :networkQualityLevel="qualityLevel"
          :networkQualityColor="qualityColor"
          :networkBitrate="bitrate"
          :networkFrameRate="frameRate"
          :networkRtt="rtt"
          :networkPacketLoss="packetLoss"
          :logger="loggers.ui"
          :onOpenSettings="toggleSettings"
          :onOpenLayoutModal="toggleLayoutModal"
          :onOpenInfoModal="toggleInfo"
          :onOpenLogModal="toggleLog"
          :logActive="props.options.logActive"
        />
      </div>
    </main>

    <!-- Log Modal -->
    <LogModal
      :isVisible="isLogOpen"
      @close="toggleLog"
    />

    <!-- Info Modal -->
    <InfoModal
      :isOpen="isInfoOpen"
      :channelName="channelName"
      :isConnected="!!isConnected"
      :connectedUsersCount="connectedUsersCount || 0"
      :networkQualityLevel="qualityLevel"
      :networkQualityColor="qualityColor"
      :networkBitrate="bitrate"
      :networkFrameRate="frameRate"
      :networkRtt="rtt"
      :networkPacketLoss="packetLoss"
      :canUseCamera="canUseCamera"
      :canUseMicrophone="canUseMicrophone"
      :isLocalVideoOff="!!isLocalVideoOff"
      :isLocalAudioMuted="!!isLocalAudioMuted"
      :allUsers="allUsers || []"
      :isRecording="isRecording"
      :recordingStatus="recordingStatus"
      :recordingFiles="recordingFiles"
      :recordingError="recordingError"
      :recordingProgress="recordingProgress"
      :canStartRecording="canStartRecording"
      :canStopRecording="canStopRecording"
      :hasRecordingFiles="hasRecordingFiles"
      @close="toggleInfo"
      @startRecording="handleStartRecording"
      @stopRecording="handleStopRecording"
      @resetRecording="handleResetRecording"
      @downloadRecordingFile="handleDownloadRecordingFile"
      @clearRecordingError="handleClearRecordingError"
      @storageProviderChanged="handleStorageProviderChanged"
      @recordingPerspectiveChanged="handleRecordingPerspectiveChanged"
      @recordingQualityChanged="handleRecordingQualityChanged"
    />

    <!-- Layout Modal -->
    <LayoutModal
      :isOpen="isLayoutModalOpen"
      @close="toggleLayoutModal"
    />

    <!-- Settings Modal -->
    <SettingsModal
      :isOpen="isSettingsOpen"
      :currentCamera="selectedCameraId"
      :currentMicrophone="selectedMicId"
      :currentVideoQuality="selectedVideoQuality"
      :currentScreenQuality="selectedScreenQuality"
      :currentLogMethod="props.logMethod"
      :currentLogRetention="props.logRetention"
      :isMobile="false"
      @close="toggleSettings"
      @settings-changed="handleSettingsChanged"
    />



    <!-- Notification Container -->
    <NotificationContainer 
      position="top-right"
      :max-visible="5"
    />
    


  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useMeeting } from '../../composables/index.js'
import { useRTM, useDeviceSettings } from '../../composables/index.js'
import { useAgoraStore, useLayoutStore } from '../../store/index.js'
import { AgoraVideo } from './index.js'
import { AgoraControls } from '../controls/index.js'
import { JoinForm } from '../forms/index.js'
import { InfoModal, SettingsModal, LogModal, LayoutModal } from '../modals/index.js'
import { NotificationContainer } from '../ui/index.js'
import { createBothTokens, fileLogger, notification } from '../../services/index.js'
import { AGORA_EVENTS, USER_ID_RANGES, API_ENDPOINTS, LOG_CONFIG, RTM_MESSAGE_TYPES } from '../../constants.js'

// Logger fonksiyonları - FileLogger'dan al (tüm seviyeler için)
const logDebug = (message, data) => fileLogger.log('debug', 'SYSTEM', message, data)
const logInfo = (message, data) => fileLogger.log('info', 'SYSTEM', message, data)
const logWarn = (message, data) => fileLogger.log('warn', 'SYSTEM', message, data)
const logError = (errorOrMessage, context) => {
  if (errorOrMessage instanceof Error) {
    return fileLogger.log('error', 'SYSTEM', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
  }
  return fileLogger.log('error', 'SYSTEM', errorOrMessage, context)
}
const logFatal = (errorOrMessage, context) => {
  if (errorOrMessage instanceof Error) {
    return fileLogger.log('fatal', 'SYSTEM', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
  }
  return fileLogger.log('fatal', 'SYSTEM', errorOrMessage, context)
}

// Genel amaçlı kategori logger fabrikası (tek tip, seviye bazlı API üretir)
const createCategoryLogger = (category) => ({
  debug: (message, data) => fileLogger.log('debug', category, message, data),
  info: (message, data) => fileLogger.log('info', category, message, data),
  warn: (message, data) => fileLogger.log('warn', category, message, data),
  error: (errorOrMessage, data) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('error', category, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...data })
    }
    return fileLogger.log('error', category, errorOrMessage, data)
  },
  fatal: (errorOrMessage, data) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('fatal', category, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...data })
    }
    return fileLogger.log('fatal', category, errorOrMessage, data)
  }
})

// Kategori bazlı logger'lar (fabrika ile üretildi)
const userLogger = createCategoryLogger('USER')
const videoLogger = createCategoryLogger('VIDEO')
const uiLogger = createCategoryLogger('UI')

// Random UID oluşturma fonksiyonu
const generateRandomUID = () => {
  const min = USER_ID_RANGES.VIDEO.MIN
  const max = USER_ID_RANGES.VIDEO.MAX
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Props - Component dışından alınacak değerler
const props = defineProps({
  options: {
    type: Object,
    required: true,
    default: () => ({
      channelName: '',
      autoJoin: false,
      userUid: null,
      tokenEndpoint: null,
      logActive: true
    })
  }
})

// Emits - Component dışına gönderilecek eventler
const emit = defineEmits([
  'change'
])

// Store'ları initialize et
const agoraStore = useAgoraStore()

const {
  joinChannel,
  leaveChannel,
  toggleCamera,
  toggleMicrophone,
  toggleScreenShare,
  isScreenSharing,
  centralEmitter,
  isJoining,
  isLeaving,
  cleanup,
  clean,
  isConnected,
  localUser,
  remoteUsers,
  allUsers,
  connectedUsersCount,
  isLocalVideoOff,
  isLocalAudioMuted,
  canUseCamera,
  canUseMicrophone,
  localTracks,
  remoteTracks,
  supportsScreenShare,
  // Stream Quality
  bitrate,
  frameRate,
  packetLoss,
  rtt,
  qualityLevel,
  qualityColor,
  // Logger
  logs,
  logStats,
  filteredLogs,
  refreshLogs,
  exportLogsToCSV,
  // Recording
  isRecording,
  recordingStatus,
  recordingFiles,
  recordingError,
  recordingProgress,
  canStartRecording,
  canStopRecording,
  hasRecordingFiles,
  handleStartRecording,
  handleStopRecording,
  handleResetRecording,
  handleDownloadRecordingFile,
  handleClearRecordingError,
  handleStorageProviderChanged,
  handleRecordingPerspectiveChanged,
  handleRecordingQualityChanged
} = useMeeting()

// RTM composable'ını kullan (initialize, join ve disconnect için)
const {
  initialize: initializeRTM,
  joinChannel: joinRTMChannel,
  disconnect: disconnectRTM
} = useRTM(agoraStore)

// Layout store initialization
const layoutStore = useLayoutStore()

const channelName = ref(props.options.channelName || '')



// Loading state
const isLoading = ref(true)
const loadingStatus = ref('initializing') // 'initializing', 'token', 'connecting', 'connected'
const loadingMessage = ref('Sistem başlatılıyor...')

// Loading status mesajları
const loadingMessages = {
  initializing: 'Sistem başlatılıyor...',
  token: 'Token alınıyor...',
  connecting: 'Bağlanıyor...',
  connected: 'Bağlantı kuruldu!'
}

// Loading status'u güncelle
const updateLoadingStatus = (status) => {
  loadingStatus.value = status
  loadingMessage.value = loadingMessages[status]
  logInfo('Loading status updated', { status, message: loadingMessages[status] })
  
  // Connected durumunda başarı notification'ı göster
  if (status === 'connected') {
            notification.success(
          '🎉 Yayına Bağlandı!',
          `${channelName.value} kanalına başarıyla bağlandınız. İyi yayınlar!`,
          {
            category: 'user',
            priority: 'normal',
            autoDismiss: true,
            autoDismissDelay: 4000,
            // Duplicate prevention için unique key
            metadata: {
              duplicateKey: 'connection-success',
              channelName: channelName.value
            }
          }
        )
  }
}

// Progress bar için width hesapla
const getProgressWidth = () => {
  const progressMap = {
    'initializing': '25%',
    'token': '50%',
    'connecting': '75%',
    'connected': '100%'
  }
  return progressMap[loadingStatus.value] || '25%'
}

// Progress bar için text hesapla
const getProgressText = () => {
  const progressTextMap = {
    'initializing': 'Başlatılıyor...',
    'token': 'Token alınıyor...',
    'connecting': 'Bağlanıyor...',
    'connected': 'Tamamlandı!'
  }
  return progressTextMap[loadingStatus.value] || 'Başlatılıyor...'
}

// Log state
const isLogOpen = ref(false)
const logsContainer = ref(null)

// Info sidebar state
const isInfoOpen = ref(false)

// Settings modal state
const isSettingsOpen = ref(false)
const isLayoutModalOpen = ref(false)

// Device selection state
const selectedCameraId = ref('')
const selectedMicId = ref('')
const selectedSpeakerId = ref('')
const selectedVideoQuality = ref('1080p_1')
const selectedScreenQuality = ref('medium')

// Device settings composable
const {
  currentVideoInputId,
  currentAudioInputId,
  currentAudioOutputId,
  initialize: initializeDeviceSettings
} = useDeviceSettings()

// Watch device changes and update local state
watch(currentVideoInputId, (newId) => {
  selectedCameraId.value = newId
})

watch(currentAudioInputId, (newId) => {
  selectedMicId.value = newId
})

watch(currentAudioOutputId, (newId) => {
  selectedSpeakerId.value = newId
})

// Props değişikliklerini dinle
watch(() => props.options.channelName, (newValue) => {
  if (newValue && newValue !== channelName.value) {
    channelName.value = newValue
  }
})

// Log toggle
const toggleLog = () => {
  isLogOpen.value = !isLogOpen.value
  logInfo('Log modal toggled', { isOpen: isLogOpen.value })
}

// Info sidebar toggle
const toggleInfo = () => {
  isInfoOpen.value = !isInfoOpen.value
  logInfo('Info sidebar toggled', { isOpen: isInfoOpen.value })
}

// Settings modal toggle
const toggleSettings = () => {
  isSettingsOpen.value = !isSettingsOpen.value
  logInfo('Settings modal toggled', { isOpen: isSettingsOpen.value })
}

// Layout modal toggle
const toggleLayoutModal = () => {
  isLayoutModalOpen.value = !isLayoutModalOpen.value
  logInfo('Layout modal toggled', { isOpen: isLayoutModalOpen.value })
}

// Handle settings changed
const handleSettingsChanged = (newSettings) => {
  logInfo('Settings changed', newSettings)
  
  // Update local state based on settings
  if (newSettings.camera) {
    selectedCameraId.value = newSettings.camera
  }
  if (newSettings.microphone) {
    selectedMicId.value = newSettings.microphone
  }
  if (newSettings.videoQuality) {
    selectedVideoQuality.value = newSettings.videoQuality
  }
  if (newSettings.screenQuality) {
    selectedScreenQuality.value = newSettings.screenQuality
  }
  
  // Update log settings
  if (newSettings.logActive !== undefined) {
    const active = newSettings.logActive
    
    // Log aktifliği güncellendi
    if (active) {
      fileLogger.setLogActive(true)
      logInfo('Logging activated', { maxLogs: LOG_CONFIG.MAX_LOGS_PER_FILE })
    } else {
      fileLogger.setLogActive(false)
      logInfo('Logging deactivated')
    }
  }
  
  // Emit settings changed event
  emit('change', { 
    type: 'settings-changed',
    data: newSettings
  })
}





// Join channel handler
const handleJoin = async (name) => {
  try {
    const channelToJoin = name || channelName.value
    channelName.value = channelToJoin
    
    // Loading status'u güncelle
    updateLoadingStatus('token')
    
    // Eğer userUid null ise random UID oluştur
    const finalUid = props.options.userUid || generateRandomUID()
    
    // Her iki token'ı da aynı anda al
    emit('change', { 
      type: 'token-requested',
      data: { channelName: channelToJoin, uid: finalUid }
    })
    const tokenResult = await createBothTokens(channelToJoin, finalUid, props.options.tokenEndpoint)
    emit('change', { 
      type: 'token-received',
      data: { 
        rtcToken: tokenResult.rtc.token, 
        rtmToken: tokenResult.rtm.token, 
        channelName: channelToJoin, 
        uid: finalUid 
      }
    })
    
    // Loading status'u güncelle
    updateLoadingStatus('connecting')
    
    // RTC Join parametreleri (Video konferans için)
    const joinParams = {
      channelName: channelToJoin,
      token: tokenResult.rtc.token,
      uid: finalUid,
      appId: tokenResult.rtc.app_id
    }
    
    // joinChannel içinde zaten clean() çağrılıyor
    await joinChannel(joinParams)
    
    // RTM'i başlat ve kanala katıl
    try {
      logInfo('🚀 RTM başlatılıyor...', { 
        uid: finalUid, 
        channelName: channelToJoin,
        timestamp: new Date().toISOString(),
        processId: Math.random().toString(36).substr(2, 9)
      })
      
      await initializeRTM({
        userId: finalUid.toString(),
        userName: `User-${finalUid}`,
        channelName: channelToJoin,
        token: tokenResult.rtm.token
      })
      
      // RTM kanalına katıl
      logInfo('📡 RTM kanalına katılım başlatılıyor...', { 
        channelName: channelToJoin,
        uid: finalUid,
        timestamp: new Date().toISOString()
      })
      
      await joinRTMChannel(channelToJoin)
      logInfo('🎉 RTM başarıyla başlatıldı ve kanala katıldı', { 
        channelName: channelToJoin,
        uid: finalUid,
        timestamp: new Date().toISOString(),
        processId: Math.random().toString(36).substr(2, 9)
      })
    } catch (rtmError) {
      logWarn('⚠️ RTM başlatılamadı, video konferans devam ediyor', { 
        error: rtmError.message || rtmError,
        errorStack: rtmError.stack,
        uid: finalUid,
        channelName: channelToJoin,
        timestamp: new Date().toISOString()
      })
      
      // RTM hatası video konferansı etkilemesin
      // Kullanıcıya bilgi ver
      notification.warning(
        'RTM Bağlantısı Kurulamadı',
        'Gerçek zamanlı mesajlaşma ve bildirimler kullanılamıyor, ancak video konferans çalışıyor.',
        {
          category: 'rtm',
          priority: 'normal',
          autoDismiss: true,
          autoDismissDelay: 8000
        }
      )
    }
    
    // Loading status'u güncelle
    updateLoadingStatus('connected')
    
    emit('change', { 
      type: 'joined',
      data: {
        channelName: channelToJoin, 
        rtcToken: tokenResult.rtc.token, 
        rtmToken: tokenResult.rtm.token, 
        uid: finalUid 
      }
    })
  } catch (error) {
    logError(error, { context: 'handleJoin', channelName: name })
    emit('change', { 
      type: 'error',
      data: { error, message: error.message }
    })
  }
}

// Leave channel handler
const handleLeave = async () => {
  try {
    // RTM bağlantısını kapat
    try {
      logInfo('🔄 RTM bağlantısı kapatılıyor...', { 
        channelName: channelName.value,
        timestamp: new Date().toISOString()
      })
      
      await disconnectRTM()
      logInfo('✅ RTM bağlantısı başarıyla kapatıldı')
    } catch (rtmError) {
      logWarn('⚠️ RTM kapatma hatası, video konferans devam ediyor', { 
        error: rtmError.message || rtmError,
        channelName: channelName.value,
        timestamp: new Date().toISOString()
      })
      // RTM hatası video konferansı etkilemesin
    }
    
    // Video kanalından ayrıl
    logInfo('🔄 Video kanalından ayrılım başlatılıyor...', { 
      channelName: channelName.value,
      timestamp: new Date().toISOString()
    })
    
    await leaveChannel()
    logInfo('✅ Video kanalından başarıyla ayrıldı')
    
    emit('change', { 
      type: 'left',
      data: { channelName: channelName.value }
    })
    channelName.value = ''
    
    // clearLogs() artık yok, fileLogger kullanıyoruz
  } catch (error) {
    logError(error, { context: 'handleLeave', channelName: channelName.value })
    emit('change', { 
      type: 'error',
      data: { error }
    })
  }
}

// Toggle camera handler
const handleToggleCamera = async (off) => {
  try {
    await toggleCamera(off)
  } catch (error) {
    logError(error, { context: 'handleToggleCamera', state: off ? 'off' : 'on' })
    emit('change', { 
      type: 'error',
      data: { error }
    })
  }
}

// Toggle microphone handler
const handleToggleMicrophone = async (muted) => {
  try {
    await toggleMicrophone(muted)
  } catch (error) {
    logError(error, { context: 'handleToggleMicrophone', state: muted ? 'muted' : 'unmuted' })
    emit('change', { 
      type: 'error',
      data: { error }
    })
  }
}

// Event listeners
const setupEventListeners = () => {
  // Merkezi event sistemi kullanılıyorsa onu dinle
  if (centralEmitter && centralEmitter.on) {
    logInfo('Central event system initialized')
    
    centralEmitter.on(AGORA_EVENTS.USER_JOINED, (data) => {
      userLogger.info('User joined', data)
      emit('change', { 
        type: 'user-joined',
        data: data
      })
    })

    centralEmitter.on(AGORA_EVENTS.USER_LEFT, (data) => {
      userLogger.info('User left', { uid: data.uid })
      emit('change', { 
        type: 'user-left',
        data: data
      })
    })

    centralEmitter.on(AGORA_EVENTS.CONNECTION_STATE_CHANGE, (data) => {
      logInfo('Connection state changed', data)
      emit('change', { 
        type: 'connection-state-change',
        data: data
      })
    })
  }

  // 🚀 centralEmitter ile RTM event'lerini dinle
  if (centralEmitter && centralEmitter.on) {
    // RTM layout change event'ini dinle
    centralEmitter.on('rtm-layout-change', (data) => {
      const { layoutId, source, trigger } = data
      
      logInfo('🎯 RTM layout değişim event\'i alındı', { 
        layoutId, 
        source, 
        trigger,
        timestamp: new Date().toISOString()
      })

      // Layout store'u güncelle
      if (layoutStore && layoutStore.switchLayoutWithSave) {
        layoutStore.switchLayoutWithSave(layoutId)
        logInfo('✅ Layout RTM event ile güncellendi', { 
          layoutId, 
          source: 'rtm-event',
          timestamp: new Date().toISOString()
        })
      }
    })

    // 🚀 RTM whiteboard auto-join event'ini dinle
    centralEmitter.on(RTM_MESSAGE_TYPES.WHITEBOARD_AUTO_JOIN, async (data) => {
      const { roomInfo, userInfo, source, trigger } = data
      
      logInfo('🚀 RTM whiteboard auto-join event\'i alındı', { 
        roomInfo, 
        userInfo, 
        source, 
        trigger,
        timestamp: new Date().toISOString()
      })

      try {
        // Whiteboard auto-join request event'i centralEmitter ile gönder
        centralEmitter.emit('whiteboard-auto-join-request', {
          roomInfo,
          userInfo,
          source: 'rtm-auto-join'
        })
        
        logInfo('✅ Whiteboard auto-join request event\'i centralEmitter ile gönderildi', { 
          roomUuid: roomInfo.uuid,
          userName: userInfo.userName,
          timestamp: new Date().toISOString()
        })
        
        // Bildirim göster
        notification.info(
          '🎨 Whiteboard Otomatik Katılım',
          `${userInfo.userName} whiteboard açtı, otomatik katılım sağlanıyor...`,
          {
            category: 'whiteboard',
            priority: 'normal',
            autoDismiss: true,
            autoDismissDelay: 3000
          }
        )
        
      } catch (error) {
        logError('❌ Whiteboard auto-join işlemi hatası', { 
          error: error.message || error,
          roomInfo,
          userInfo,
          timestamp: new Date().toISOString()
        })
        
        // Hata bildirimi göster
        notification.error(
          '❌ Whiteboard Katılım Hatası',
          'Whiteboard\'a otomatik katılım sağlanamadı.',
          {
            category: 'whiteboard',
            priority: 'high',
            autoDismiss: true,
            autoDismissDelay: 5000
          }
        )
      }
    })

    // 🚀 Layout change request event'ini dinle (whiteboard auto-join'dan gelir)
    centralEmitter.on('layout-change-request', (data) => {
      const { layoutId, source, trigger } = data
      
      logInfo('🎯 Layout change request event\'i alındı', { 
        layoutId, 
        source, 
        trigger,
        timestamp: new Date().toISOString()
      })

      // Layout store'u güncelle
      if (layoutStore && layoutStore.switchLayoutWithSave) {
        layoutStore.switchLayoutWithSave(layoutId)
        logInfo('✅ Layout change request ile güncellendi', { 
          layoutId, 
          source: 'layout-request',
          timestamp: new Date().toISOString()
        })
      }
    })

    // 🚀 RTM whiteboard auto-join event'ini dinle (whiteboard component yüklenmeden önce)
    centralEmitter.on(RTM_MESSAGE_TYPES.WHITEBOARD_AUTO_JOIN, async (data) => {
      const { roomInfo, userInfo, source, trigger } = data
      
      logInfo('🚀 RTM whiteboard auto-join event\'i AgoraConference\'da alındı', { 
        roomInfo, 
        userInfo, 
        source, 
        trigger,
        timestamp: new Date().toISOString()
      })
      
      try {
        // Layout'u whiteboard'a geçir
        if (layoutStore && layoutStore.switchLayoutWithSave) {
          layoutStore.switchLayoutWithSave('whiteboard')
          logInfo('✅ Layout whiteboard\'a geçirildi (AgoraConference)', { 
            roomUuid: roomInfo.uuid,
            source,
            trigger,
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        logError('❌ Layout değiştirme hatası (AgoraConference)', { 
          error: error.message,
          roomInfo,
          userInfo,
          source,
          trigger,
          timestamp: new Date().toISOString()
        })
      }
    })

    logInfo('🚀 RTM event listener\'ları centralEmitter ile eklendi')
  }
}

const agoraVideoRef = ref(null)

// Logger wrapper'ları oluştur
const createLoggerWrappers = () => {
  return {
    video: {
      debug: (message, data) => videoLogger.debug(message, data),
      info: (message, data) => videoLogger.info(message, data),
      warn: (message, data) => videoLogger.warn(message, data),
      error: (error, data) => videoLogger.error(error, data),
      fatal: (error, data) => videoLogger.fatal(error, data)
    },
    ui: {
      debug: (message, data) => uiLogger.debug(message, data),
      info: (message, data) => uiLogger.info(message, data),
      warn: (message, data) => uiLogger.warn(message, data),
      error: (error, data) => uiLogger.error(error, data)
    }
  }
}

// Logger wrapper'ları oluştur
const loggers = createLoggerWrappers()

// Log yöntemini initialize et
const initializeLogMethod = () => {
  try {
    // Log ayarları
    const active = props.options.logActive ?? true
    
    if (active) {
      fileLogger.setLogActive(true)
      logInfo('LocalStorage logging initialized', { maxLogs: LOG_CONFIG.MAX_LOGS_PER_FILE })
    } else {
      fileLogger.setLogActive(false)
      logInfo('Logging disabled')
    }
  } catch (error) {
    console.error('Log method initialization error:', error)
    // Artık sadece localStorage kullanılıyor, fallback gerekmiyor
  }
}

// Auto join if enabled
const handleAutoJoin = async () => {
      if (props.options.autoJoin && channelName.value && !isConnected.value) {
    logInfo('Auto joining channel...', { channelName: channelName.value })
    await handleJoin(channelName.value)
  }
}



// Lifecycle
onMounted(async () => {
  // Log yöntemini initialize et
  initializeLogMethod()
  
  logInfo('AgoraConference component mounted', { 
    channelName: channelName.value,
            autoJoin: props.options.autoJoin
  })

  // Initialize device settings
  try {
    await initializeDeviceSettings()
    logInfo('Device settings initialized')
  } catch (error) {
    logError(error, { context: 'deviceSettingsInit' })
  }

  setupEventListeners()
  
  // Layout preference'i sadece kanal değişikliği olmadığında yükle
  // Bu sayede ilk girişte presentation'dan başlamaz
      if (!props.options.autoJoin) {
    layoutStore.loadLayoutPreference()
  } else {
    // Auto join varsa layout'u grid'e sıfırla
    layoutStore.switchLayoutWithSave('grid')
  }
  
      // Auto join varsa loading devam ederken arka planda bağlantı kur
    if (props.options.autoJoin && channelName.value) {
      // Loading'i göster ama arka planda bağlantı kur
      logInfo('Auto join aktif - Loading devam ederken arka planda bağlantı kuruluyor...')
      
      // Arka planda auto join'i başlat
      handleAutoJoin().then(() => {
        logInfo('Auto join tamamlandı - Loading kaldırılıyor')
        // Kısa bir delay ile loading'i kaldır (kullanıcı "Bağlantı kuruldu!" mesajını görebilsin)
        setTimeout(() => {
          isLoading.value = false
        }, 800)
      }).catch((error) => {
        logError(error, { context: 'autoJoin' })
        // Hata olsa bile loading'i kaldır
        isLoading.value = false
      })
    } else {
    // Auto join yoksa sadece kısa loading göster
    updateLoadingStatus('initializing')
    await new Promise(resolve => setTimeout(resolve, 300))
    isLoading.value = false
  }
})

onUnmounted(() => {
  // Tüm kaynakları temizle (RTC ve RTM dahil)
  cleanup()
})

// Expose methods for parent component
defineExpose({
  joinChannel: handleJoin,
  leaveChannel: handleLeave,
  toggleCamera: handleToggleCamera,
  toggleMicrophone: handleToggleMicrophone,
  toggleScreenShare,
  clean,
  isConnected,
  channelName,
  connectedUsersCount,
  localUser,
  remoteUsers,
  allUsers
})
</script>

<style scoped>
.agora-conference {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--rs-agora-gradient-bg);
  color: var(--rs-agora-text-primary);
  min-height: 100vh;
  position: relative;
}

/* Loading Screen */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--rs-agora-gradient-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  color: var(--rs-agora-text-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 400px;
}

.loading-logo {
  width: 300px;
  height: auto;
  margin-bottom: 30px;
  filter: drop-shadow(0 4px 8px var(--rs-agora-transparent-black-30));
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid var(--rs-agora-border-primary);
  border-top: 4px solid var(--rs-agora-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

/* Progress Bar */
.progress-container {
  width: 100%;
  max-width: 300px;
  margin: 20px auto;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--rs-agora-border-primary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--rs-agora-gradient-primary);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text {
  text-align: center;
  font-size: 12px;
  color: var(--rs-agora-text-secondary);
  font-weight: 500;
}

.loading-content h3 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 10px 0;
  background: var(--rs-agora-gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-content p {
  font-size: 16px;
  color: var(--rs-agora-text-secondary);
  margin: 0;
}

.loading-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 20px;
  font-size: 14px;
  color: var(--rs-agora-text-secondary);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.status-item.active {
  opacity: 1;
  background: var(--rs-agora-surface-accent);
  color: var(--rs-agora-primary);
  transform: scale(1.02);
}

.status-item.completed {
  opacity: 0.8;
  color: var(--rs-agora-success);
}

.status-icon {
  font-size: 18px;
}

.loading-message {
  margin-top: 20px;
  font-size: 16px;
  color: var(--rs-agora-primary);
  font-weight: 500;
  text-align: center;
  padding: 12px 20px;
  background: var(--rs-agora-surface-accent);
  border-radius: 8px;
  border: 1px solid var(--rs-agora-border-secondary);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.conference-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  height: 100%;
  padding: 10px;
}

.video-area {
  flex: 1;
  width: 100%;
  height: 100%;
  background: var(--rs-agora-gradient-video-area);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--rs-agora-shadow-xl);
  border: 1px solid var(--rs-agora-transparent-white-10);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.controls-area {
  background: transparent;
  border-radius: 16px;
}










/* Float Buttons */
.info-float-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  background: var(--rs-agora-dark-surface-34);
  color: var(--rs-agora-white);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  backdrop-filter: blur(6px);
  box-shadow: var(--rs-agora-shadow-sm);
  border: 1px solid var(--rs-agora-transparent-white-10);
}

.info-float-btn.active,
.info-float-btn:hover {
  background: var(--rs-agora-gradient-primary);
  box-shadow: 0 4px 12px var(--rs-agora-shadow-lg), 0 0 0 4px var(--rs-agora-secondary);
  transform: scale(1.1);
}

.log-float-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 2000;
  background: var(--rs-agora-dark-surface-34);
  color: var(--rs-agora-white);
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
  backdrop-filter: blur(6px);
  box-shadow: var(--rs-agora-shadow-sm);
  border: 1px solid var(--rs-agora-transparent-white-10);
}

.log-float-btn.active,
.log-float-btn:hover {
  background: var(--rs-agora-gradient-warning);
  box-shadow: 0 4px 12px var(--rs-agora-shadow-lg), 0 0 0 4px var(--rs-agora-warning);
  transform: scale(1.1);
}

.loading-channel {
  font-weight: bold;
  color: var(--rs-agora-primary);
}

















/* Responsive */
@media (max-width: 768px) {
  .conference-main {
    gap: 10px;
    padding: 5px;
  }
  
  .info-float-btn, .log-float-btn {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }
  

}


</style> 