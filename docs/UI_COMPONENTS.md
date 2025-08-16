# Vue 3 Agora Video Conference Module - UI Components

> **Context Engineering** yaklaşımı ile hazırlanmış kapsamlı UI component dokümantasyonu

## 🎨 **UI Component Genel Bakış**

Bu dokümantasyon, Vue 3 Agora Video Conference Module'ünün tüm UI bileşenlerini ve tasarım sistemini detaylandırır. Proje, **glassmorphism design** ve **responsive layout** prensiplerine dayalı modern bir UI sistemi kullanır.

## 🏗️ **Component Kategorileri**

### **1. Core Components (Ana Bileşenler)**
- **`AgoraConference.vue`**: Ana konferans bileşeni
- **`AgoraVideo.vue`**: Video görüntüleme bileşeni

### **2. Control Components (Kontrol Bileşenleri)**
- **`AgoraControls.vue`**: Ana kontrol paneli
- **`RecordingControls.vue`**: Kayıt kontrolleri

### **3. Modal Components (Modal Bileşenleri)**
- **`InfoModal.vue`**: Bilgi modalı
- **`LogModal.vue`**: Log modalı
- **`SettingsModal.vue`**: Ayarlar modalı

### **4. Video Components (Video Bileşenleri)**
- **`VideoGrid.vue`**: Video grid düzeni
- **`VideoItem.vue`**: Tek video öğesi
- **`StreamQualityBar.vue`**: Stream kalite göstergesi

### **5. Form Components (Form Bileşenleri)**
- **`JoinForm.vue`**: Katılım formu

## 🧩 **Core Components**

### **AgoraConference.vue**

Ana konferans bileşeni, tüm video konferans işlevselliğini koordine eder.

#### **Props**
```typescript
interface AgoraConferenceProps {
  channelName: string
  autoJoin?: boolean
  userUid?: string | number
  tokenEndpoint?: string | null
  debugMode?: boolean
}
```

#### **Conditional Rendering**
```vue
<template>
  <div class="agora-conference">
<!-- Join Form - Bağlı olmadığında göster -->
<JoinForm v-if="!isConnected" ... />

<!-- Video Area - Bağlı olduğunda göster -->
<div v-if="isConnected" class="video-area">
  <AgoraVideo ... />
</div>

<!-- Controls Area - Sadece bağlı olduğunda göster -->
<div v-if="isConnected" class="controls-area">
  <AgoraControls ... />
</div>

<!-- Debug Components - Sadece debug mode açıkken göster -->
<LogModal v-if="debugMode" ... />
<InfoModal v-if="debugMode" ... />
    <SettingsModal ... />
  </div>
</template>
```

#### **Debug Mode Features**
- **LogModal**: Gerçek zamanlı log görüntüleme
- **InfoModal**: Toplantı bilgileri ve ağ durumu
- **Float Buttons**: Info (ℹ️) ve Log (📝) butonları
- **Performance Metrics**: Stream kalitesi ve network stats

### **AgoraVideo.vue**

Video görüntüleme ve stream yönetimi bileşeni.

#### **Props**
```typescript
interface AgoraVideoProps {
  localUser: User | null
  remoteUsers: User[]
  videoQuality?: string
  autoPlay?: boolean
  showControls?: boolean
  showQualityBar?: boolean
}
```

#### **Template Structure**
```vue
<template>
  <div class="agora-video">
    <!-- Video Grid -->
    <VideoGrid
      :allUsers="allUsers"
      :localTracks="localTracks"
      :localVideoRef="localVideoRef"
      :localScreenRef="localScreenRef"
      @set-video-ref="setVideoRef"
      @set-local-video-ref="setLocalVideoRef"
      @set-local-screen-ref="setLocalScreenRef"
    />
    
    <!-- Stream Quality Bar -->
    <StreamQualityBar
      v-if="showQualityBar"
      :quality="networkQuality"
      :bitrate="bitrate"
      :frameRate="frameRate"
      :packetLoss="packetLoss"
      :rtt="rtt"
    />
  </div>
</template>
```

## 🎮 **Control Components**

### **AgoraControls.vue**

Ana kontrol paneli bileşeni.

#### **Props**
```typescript
interface AgoraControlsProps {
  // Connection state
  isConnected: boolean
  isJoining: boolean
  isLeaving: boolean
  
  // Device state
  isLocalVideoOff: boolean
  isLocalAudioMuted: boolean
  canUseCamera: boolean
  canUseMicrophone: boolean
  
  // Channel info
  channelName: string
  connectedUsersCount: number
  
  // Features
  supportsScreenShare: boolean
  isScreenSharing: boolean
  
  // Network quality
  networkQualityLevel: string
  networkQualityColor: string
  networkBitrate: number
  networkFrameRate: number
  networkRtt: number
  networkPacketLoss: number
  
  // Callbacks
  onJoin: (channelName: string) => Promise<void>
  onLeave: () => Promise<void>
  onToggleCamera: (off: boolean) => Promise<void>
  onToggleMicrophone: (muted: boolean) => Promise<void>
  onToggleScreenShare: () => Promise<void>
  onOpenSettings: () => void
  
  // Logging
  logUI: (message: string, data?: any) => void
  logError: (error: Error, context?: any) => void
  trackUserAction: (action: string, data?: any) => void
}
```

#### **Template Structure**
```vue
<template>
  <div class="agora-controls">
    <!-- Settings Button (Top Center) -->
    <div v-if="isConnected" class="top-buttons">
      <button 
        @click="props.onOpenSettings"
        class="settings-button-top"
        title="Video Ayarları"
      >
        <span class="icon">⚙️</span>
      </button>
        </div>
    
    <!-- Main Controls -->
    <div v-if="isConnected" class="controls">
      <!-- Camera Toggle -->
      <button 
        @click="toggleCamera"
        :class="['control-button', { active: !isLocalVideoOff && canUseCamera, disabled: !canUseCamera }]"
        :disabled="!canUseCamera"
        :title="getCameraTitle"
      >
        <span class="icon">{{ getCameraIcon }}</span>
        <span class="label">{{ getCameraLabel }}</span>
      </button>
      
      <!-- Microphone Toggle -->
      <button 
        @click="toggleMicrophone"
        :class="['control-button', { active: !isLocalAudioMuted && canUseMicrophone, disabled: !canUseMicrophone }]"
        :disabled="!canUseMicrophone"
        :title="getMicrophoneTitle"
      >
        <span class="icon">{{ getMicrophoneIcon }}</span>
        <span class="label">{{ getMicrophoneLabel }}</span>
      </button>
      
      <!-- Screen Share Toggle -->
      <button
        v-if="supportsScreenShare"
        @click="onToggleScreenShare"
        :class="['control-button', { active: isScreenSharing }]"
        :title="isScreenSharing ? 'Ekran Paylaşımını Durdur' : 'Ekran Paylaşımını Başlat'"
      >
        <span class="icon">{{ isScreenSharing ? '❌🖥️' : '🖥️' }}</span>
        <span class="label">{{ isScreenSharing ? 'Paylaşımı Durdur' : 'Ekranı Paylaş' }}</span>
      </button>
      
      <!-- Leave Button -->
      <button 
        @click="leaveChannel"
        :disabled="isLeaving"
        class="control-button leave-button"
        title="Kanaldan ayrıl"
      >
        <span class="icon">📞</span>
        <span class="label">{{ isLeaving ? 'Ayrılıyor...' : 'Ayrıl' }}</span>
        </button>
    </div>
  </div>
</template>
```

## 🪟 **Modal Components**

### **InfoModal.vue**

Toplantı bilgilerini widget'lar halinde gösteren modal bileşeni.

#### **Props**
```typescript
interface InfoModalProps {
  isOpen: boolean
  channelName: string
  isConnected: boolean
  connectedUsersCount: number
  networkQualityLevel: string
  networkQualityColor: string
  networkBitrate: number
  networkFrameRate: number
  networkRtt: number
  networkPacketLoss: number
  canUseCamera: boolean
  canUseMicrophone: boolean
  isLocalVideoOff: boolean
  isLocalAudioMuted: boolean
  allUsers: User[]
  isMobile: boolean
}
```

#### **Widget System**
```vue
<template>
  <div v-if="isOpen" class="info-modal-overlay" @click="handleOverlayClick">
    <div class="info-modal" @click.stop>
      <!-- Header -->
      <div class="info-header">
        <h3>📊 Toplantı Bilgileri</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <!-- Content -->
      <div class="info-content">
        <div class="info-grid">
          <!-- Channel Info Widget -->
<div class="info-widget channel-widget">
  <div class="widget-header">
    <div class="widget-icon">📺</div>
    <h4>Kanal Bilgileri</h4>
  </div>
  <div class="widget-content">
    <div class="widget-stat">
      <div class="stat-label">Kanal Adı</div>
      <div class="stat-value">{{ channelName || 'Belirtilmemiş' }}</div>
    </div>
    <div class="widget-stat">
      <div class="stat-label">Bağlı Kullanıcı</div>
      <div class="stat-value">{{ connectedUsersCount || 0 }}</div>
    </div>
    <div class="widget-stat">
      <div class="stat-label">Durum</div>
      <div class="stat-value status-badge" :class="{ 'connected': isConnected, 'disconnected': !isConnected }">
        {{ isConnected ? 'Bağlı' : 'Bağlı Değil' }}
      </div>
    </div>
  </div>
</div>

          <!-- Network Quality Widget -->
<div class="info-widget network-widget">
  <div class="widget-header">
    <div class="widget-icon">🌐</div>
    <h4>Ağ Kalitesi</h4>
  </div>
  <div class="widget-content">
    <div class="widget-stat">
      <div class="stat-label">Kalite</div>
      <div class="stat-value quality-badge" :style="{ '--quality-color': networkQualityColor }">
        {{ networkQualityLevel || 'N/A' }}
      </div>
    </div>
              <div class="widget-stat">
                <div class="stat-label">Bitrate</div>
                <div class="stat-value">{{ networkBitrate || 'N/A' }} kbps</div>
              </div>
              <div class="widget-stat">
                <div class="stat-label">FPS</div>
                <div class="stat-value">{{ networkFrameRate || 'N/A' }}</div>
              </div>
              <div class="widget-stat">
                <div class="stat-label">RTT</div>
                <div class="stat-value">{{ networkRtt || 'N/A' }} ms</div>
              </div>
              <div class="widget-stat">
                <div class="stat-label">Paket Kaybı</div>
                <div class="stat-value">{{ networkPacketLoss || 'N/A' }}%</div>
              </div>
  </div>
</div>

          <!-- Device Status Widget -->
<div class="info-widget device-widget">
  <div class="widget-header">
    <div class="widget-icon">🎤</div>
    <h4>Cihaz Durumu</h4>
  </div>
  <div class="widget-content">
    <div class="widget-stat">
      <div class="stat-label">Kamera</div>
      <div class="stat-value device-badge" :class="{ 'available': canUseCamera, 'unavailable': !canUseCamera }">
        {{ canUseCamera ? 'Kullanılabilir' : 'Kullanılamıyor' }}
      </div>
    </div>
              <div class="widget-stat">
                <div class="stat-label">Mikrofon</div>
                <div class="stat-value device-badge" :class="{ 'available': canUseMicrophone, 'unavailable': !canUseMicrophone }">
                  {{ canUseMicrophone ? 'Kullanılabilir' : 'Kullanılamıyor' }}
                </div>
              </div>
              <div class="widget-stat">
                <div class="stat-label">Video</div>
                <div class="stat-value device-badge" :class="{ 'available': !isLocalVideoOff, 'unavailable': isLocalVideoOff }">
                  {{ isLocalVideoOff ? 'Kapalı' : 'Açık' }}
                </div>
              </div>
              <div class="widget-stat">
                <div class="stat-label">Ses</div>
                <div class="stat-value device-badge" :class="{ 'available': !isLocalAudioMuted, 'unavailable': isLocalAudioMuted }">
                  {{ isLocalAudioMuted ? 'Sessiz' : 'Açık' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

### **LogModal.vue**

Gerçek zamanlı log görüntüleme modal bileşeni.

#### **Props**
```typescript
interface LogModalProps {
  isOpen: boolean
  logs: LogEntry[]
  logStats: LogStats
  getFilteredLogs: () => LogEntry[]
  clearLogs: () => void
  exportLogs: () => void
}
```

#### **Template Structure**
```vue
<template>
  <div v-if="isOpen" class="log-modal-overlay" @click="closeModal">
    <div class="log-modal" @click.stop>
      <!-- Header -->
      <div class="log-modal-header">
        <h2>📋 Agora Günlükleri</h2>
        <div class="log-modal-controls">
          <button @click="exportLogs" class="btn-export">
            📥 JSON Dışa Aktar
          </button>
          <button @click="clearLogs" class="btn-clear">
            🗑️ Temizle
          </button>
          <button @click="closeModal" class="btn-close">
            ❌ Kapat
          </button>
        </div>
      </div>
      
      <!-- Stats -->
      <div class="log-stats">
        <div class="stat-item">
          <span class="stat-label">Toplam:</span>
          <span class="stat-value">{{ logStats.total }}</span>
        </div>
        <div class="stat-item" v-for="(count, level) in logStats.byLevel" :key="level">
          <span class="stat-label">{{ level }}:</span>
          <span class="stat-value" :class="`level-${level}`">{{ count }}</span>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="log-filters">
        <select v-model="filters.level" class="filter-select">
          <option value="">Tüm Seviyeler</option>
          <option v-for="level in logLevels" :key="level" :value="level">
            {{ level.toUpperCase() }}
          </option>
        </select>
        
        <select v-model="filters.category" class="filter-select">
          <option value="">Tüm Kategoriler</option>
          <option v-for="category in logCategories" :key="category" :value="category">
            {{ category.toUpperCase() }}
          </option>
        </select>
        
        <input 
          v-model="filters.search" 
          type="text" 
          placeholder="Günlüklerde ara..." 
          class="filter-search"
        />
      </div>
      
      <!-- Logs -->
      <div class="log-container">
        <div 
          v-for="log in filteredLogs" 
          :key="log.id" 
          class="log-item"
          :class="`level-${log.level}`"
        >
          <div class="log-header">
            <span class="log-timestamp">{{ formatTime(log.timestamp) }}</span>
            <span class="log-level">{{ log.level.toUpperCase() }}</span>
            <span class="log-category">{{ log.category }}</span>
          </div>
          <div class="log-message">{{ log.message }}</div>
          <div v-if="log.data && Object.keys(log.data).length > 0" class="log-data">
            <pre>{{ JSON.stringify(log.data, null, 2) }}</pre>
          </div>
        </div>
        
        <div v-if="filteredLogs.length === 0" class="no-logs">
          Günlük bulunamadı
        </div>
      </div>
    </div>
  </div>
</template>
```

### **SettingsModal.vue**

Cihaz ayarları ve kalite seçenekleri modal bileşeni.

#### **Props**
```typescript
interface SettingsModalProps {
  isOpen: boolean
  currentCamera: string
  currentMicrophone: string
  currentSpeaker: string
  currentVideoQuality: string
  currentAudioQuality: string
  isMobile: boolean
}
```

#### **Template Structure**
```vue
<template>
  <div v-if="isOpen" class="settings-modal-backdrop" @click.self="handleOverlayClick">
    <div class="settings-modal-glass">
      <!-- Header -->
      <div class="settings-modal-header">
        <div class="settings-modal-icon">⚙️</div>
        <h2>Video Ayarları</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <!-- Content -->
      <div class="settings-content">
        <!-- Camera Settings -->
        <div class="settings-section">
          <label for="camera-select">Kamera:</label>
          <select 
            id="camera-select" 
            v-model="selectedCamera" 
            @change="handleCameraChange"
          >
            <option v-for="device in cameraDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Kamera ${device.deviceId.slice(0, 8)}...` }}
            </option>
          </select>
        </div>
        
        <!-- Microphone Settings -->
        <div class="settings-section">
          <label for="microphone-select">Mikrofon:</label>
          <select 
            id="microphone-select" 
            v-model="selectedMicrophone" 
            @change="handleMicrophoneChange"
          >
            <option v-for="device in microphoneDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Mikrofon ${device.deviceId.slice(0, 8)}...` }}
            </option>
          </select>
        </div>
        
        <!-- Speaker Settings -->
        <div class="settings-section">
          <label for="speaker-select">Hoparlör:</label>
          <select 
            id="speaker-select" 
            v-model="selectedSpeaker" 
            @change="handleSpeakerChange"
          >
            <option v-for="device in speakerDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Hoparlör ${device.deviceId.slice(0, 8)}...` }}
            </option>
          </select>
        </div>
        
        <!-- Video Quality Settings (Desktop only) -->
        <div class="settings-section" v-if="!isMobile">
          <label for="video-quality-select">Video Kalitesi:</label>
          <select 
            id="video-quality-select" 
            v-model="selectedVideoQuality" 
            @change="handleVideoQualityChange"
          >
            <option value="low">Düşük (240p)</option>
            <option value="medium">Orta (480p)</option>
            <option value="high">Yüksek (720p)</option>
            <option value="ultra">Ultra (1080p)</option>
          </select>
        </div>
        
        <!-- Audio Quality Settings -->
        <div class="settings-section">
          <label for="audio-quality-select">Ses Kalitesi:</label>
          <select 
            id="audio-quality-select" 
            v-model="selectedAudioQuality" 
            @change="handleAudioQualityChange"
          >
            <option value="low">Düşük (16kHz)</option>
            <option value="medium">Orta (32kHz)</option>
            <option value="high">Yüksek (48kHz)</option>
          </select>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="settings-actions">
        <button @click="applySettings" class="save-button">Kaydet</button>
        <button @click="$emit('close')" class="cancel-button">İptal</button>
      </div>
    </div>
  </div>
</template>
```

## 🎥 **Video Components**

### **VideoGrid.vue**

Video grid düzeni yönetimi bileşeni.

#### **Props**
```typescript
interface VideoGridProps {
  allUsers: User[]
  localTracks: LocalTracks
  localVideoRef: Ref<HTMLElement | null>
  localScreenRef: Ref<HTMLElement | null>
  logUI: (message: string, data?: any) => void
}
```

#### **Template Structure**
```vue
<template>
  <div class="video-grid">
    <!-- Local Camera Video -->
    <VideoItem
      v-if="localCameraUser && localCameraHasVideo"
      :user="localCameraUser"
      :isLocal="true"
      :hasVideo="localCameraHasVideo"
      :hasAudio="localCameraHasAudio"
      :isScreenShare="false"
      :showControls="true"
      @video-click="handleLocalVideoClick"
      @fullscreen-toggle="handleLocalFullscreenToggle"
    />
    
    <!-- Local Screen Share -->
    <VideoItem
      v-if="localScreenUser && localScreenHasVideo"
      :user="localScreenUser"
      :isLocal="true"
      :hasVideo="localScreenHasVideo"
      :hasAudio="false"
      :isScreenShare="true"
      :showControls="true"
      @video-click="handleLocalScreenClick"
      @fullscreen-toggle="handleLocalScreenFullscreenToggle"
    />
    
    <!-- Remote Users -->
    <VideoItem
      v-for="user in remoteUsers"
      :key="user.uid"
      :user="user"
      :isLocal="false"
      :hasVideo="getUserHasVideo(user)"
      :hasAudio="user.hasAudio && !user.isAudioMuted"
      :isScreenShare="user.isScreenShare"
      :showControls="false"
      @video-click="handleRemoteVideoClick"
      @fullscreen-toggle="handleRemoteFullscreenToggle"
    />
  </div>
</template>
```

### **VideoItem.vue**

Tek video öğesi render'ı bileşeni.

#### **Props**
```typescript
interface VideoItemProps {
  user: User
  isLocal: boolean
  hasVideo: boolean
  hasAudio: boolean
  isScreenShare: boolean
  showControls: boolean
  logUI: (message: string, data?: any) => void
}
```

#### **Template Structure**
```vue
<template>
  <div 
    class="video-item"
    :class="{
      'local': isLocal,
      'remote': !isLocal,
      'screen-share': isScreenShare,
      'no-video': !hasVideo
    }"
    @click="$emit('video-click', user)"
  >
    <!-- Video Element -->
    <video
      v-if="hasVideo"
      ref="videoElement"
      :id="`video-${user.uid}`"
      :class="['video-stream', { 'mirrored': isLocal && !isScreenShare }]"
      autoplay
      muted
      playsinline
    />
    
    <!-- No Video Placeholder -->
    <div v-else class="no-video-placeholder">
      <div class="placeholder-icon">
        {{ isScreenShare ? '🖥️' : '📹' }}
      </div>
      <div class="placeholder-text">
        {{ isLocal ? 'Sen' : user.name || `Kullanıcı ${user.uid}` }}
      </div>
    </div>
    
    <!-- Audio Indicator -->
    <div v-if="hasAudio" class="audio-indicator">
      <span class="audio-icon">🎤</span>
    </div>
    
    <!-- Screen Share Indicator -->
    <div v-if="isScreenShare" class="screen-share-indicator">
      <span class="screen-icon">🖥️</span>
    </div>
    
    <!-- Controls -->
    <div v-if="showControls" class="video-controls">
      <button 
        @click.stop="$emit('fullscreen-toggle', !isFullscreen)"
        class="control-btn fullscreen-btn"
        :title="isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran yap'"
      >
        <span class="control-icon">{{ isFullscreen ? '⤓' : '⤢' }}</span>
      </button>
    </div>
    
    <!-- User Info -->
    <div class="user-info">
      <div class="user-name">
        {{ isLocal ? 'Sen' : user.name || `Kullanıcı ${user.uid}` }}
      </div>
      <div v-if="isScreenShare" class="user-role">
        Ekran Paylaşımı
      </div>
    </div>
  </div>
</template>
```

### **StreamQualityBar.vue**

Stream kalite göstergesi bileşeni.

#### **Props**
```typescript
interface StreamQualityBarProps {
  quality: string
  bitrate: number
  frameRate: number
  packetLoss: number
  rtt: number
  showDetails: boolean
}
```

#### **Template Structure**
```vue
<template>
  <div class="stream-quality-bar">
    <!-- Quality Indicator -->
    <div class="quality-indicator" :class="qualityClass">
      <span class="quality-icon">{{ qualityIcon }}</span>
      <span class="quality-text">{{ qualityText }}</span>
    </div>
    
    <!-- Quality Details -->
    <div v-if="showDetails" class="quality-details">
      <div class="quality-metric">
        <span class="metric-label">Bitrate:</span>
        <span class="metric-value">{{ formatBitrate(bitrate) }}</span>
      </div>
      <div class="quality-metric">
        <span class="metric-label">FPS:</span>
        <span class="metric-value">{{ frameRate }}</span>
      </div>
      <div class="quality-metric">
        <span class="metric-label">Paket Kaybı:</span>
        <span class="metric-value">{{ packetLoss }}%</span>
      </div>
      <div class="quality-metric">
        <span class="metric-label">RTT:</span>
        <span class="metric-value">{{ rtt }}ms</span>
      </div>
    </div>
  </div>
</template>
```

## 📝 **Form Components**

### **JoinForm.vue**

Katılım formu bileşeni.

#### **Props**
```typescript
interface JoinFormProps {
  defaultChannel: string
  isJoining: boolean
}
```

#### **Template Structure**
```vue
<template>
  <div class="join-form-container">
    <div class="join-form">
      <div class="join-content">
        <!-- Header -->
        <div class="join-header">
          <div class="logo">
            <div class="logo-icon">🎥</div>
            <h2>Video Konferans</h2>
          </div>
          <p class="join-subtitle">
            Bir toplantıya başlamak veya katılmak için kanal adı girin
          </p>
        </div>
        
        <!-- Form -->
        <div class="form-group">
          <div class="input-wrapper">
            <input
              v-model="channelInput"
              type="text"
              placeholder="Kanal adı girin..."
              :disabled="isJoining"
              @keyup.enter="handleJoin"
              class="channel-input"
            />
            <div class="input-border"></div>
          </div>
          
          <button
            @click="handleJoin"
            :disabled="!channelInput.trim() || isJoining"
            :class="['join-button', { 'joining': isJoining }]"
          >
            <span class="button-text">
              {{ isJoining ? 'Katılıyor...' : 'Kanala Katıl' }}
            </span>
            <div class="button-glow"></div>
          </button>
        </div>
        
        <!-- Quick Join Options -->
        <div class="quick-join">
          <p class="quick-join-text">Hızlı katılım:</p>
          <div class="quick-join-buttons">
            <button
              v-for="channel in quickChannels"
              :key="channel"
              @click="joinQuickChannel(channel)"
              :disabled="isJoining"
              class="quick-join-btn"
            >
              {{ channel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

## 🎨 **Design System**

### **CSS Variables**

```css
:root {
  /* Primary Colors */
  --agora-primary: #667eea;
  --agora-secondary: #764ba2;
  --agora-success: #4ade80;
  --agora-warning: #fbbf24;
  --agora-error: #f87171;
  --agora-info: #60a5fa;
  
  /* Background Colors */
  --agora-bg-primary: #1a1a2e;
  --agora-bg-secondary: #16213e;
  --agora-bg-tertiary: #0f3460;
  --agora-bg-overlay: rgba(20, 20, 40, 0.8);
  
  /* Text Colors */
  --agora-text-primary: #ffffff;
  --agora-text-secondary: #e0e0e0;
  --agora-text-muted: #9ca3af;
  
  /* Border Colors */
  --agora-border-primary: rgba(255, 255, 255, 0.1);
  --agora-border-secondary: rgba(255, 255, 255, 0.05);
  --agora-border-accent: rgba(102, 126, 234, 0.3);
  
  /* Shadow Colors */
  --agora-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --agora-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --agora-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --agora-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
  
  /* Border Radius */
  --agora-radius-sm: 0.25rem;
  --agora-radius-md: 0.5rem;
  --agora-radius-lg: 0.75rem;
  --agora-radius-xl: 1rem;
  --agora-radius-2xl: 1.5rem;
  --agora-radius-full: 9999px;
  
  /* Spacing */
  --agora-spacing-xs: 0.25rem;
  --agora-spacing-sm: 0.5rem;
  --agora-spacing-md: 1rem;
  --agora-spacing-lg: 1.5rem;
  --agora-spacing-xl: 2rem;
  --agora-spacing-2xl: 3rem;
  
  /* Breakpoints */
  --agora-mobile: 768px;
  --agora-tablet: 1024px;
  --agora-desktop: 1280px;
  --agora-large: 1536px;
}
```

### **Glassmorphism Classes**

```scss
// Base glassmorphism
.agora-glass {
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--agora-radius-xl);
  box-shadow: var(--agora-shadow-lg);
}

// Light glassmorphism
.agora-glass-light {
  @extend .agora-glass;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

// Dark glassmorphism
.agora-glass-dark {
  @extend .agora-glass;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

// Hover effects
.agora-glass-hover {
  @extend .agora-glass;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--agora-shadow-xl);
    border-color: rgba(255, 255, 255, 0.2);
  }
}
```

### **Responsive Design**

```scss
// Mobile-first approach
.agora-component {
  // Base mobile styles
  padding: var(--agora-spacing-md);
  margin: var(--agora-spacing-sm);
  font-size: 0.875rem;
  
  // Tablet styles
  @media (min-width: var(--agora-mobile)) {
    padding: var(--agora-spacing-lg);
    margin: var(--agora-spacing-md);
    font-size: 1rem;
  }
  
  // Desktop styles
  @media (min-width: var(--agora-tablet)) {
    padding: var(--agora-spacing-xl);
    margin: var(--agora-spacing-lg);
    font-size: 1.125rem;
  }
  
  // Large desktop styles
  @media (min-width: var(--agora-desktop)) {
    padding: var(--agora-spacing-2xl);
    margin: var(--agora-spacing-xl);
    font-size: 1.25rem;
  }
}

// Grid system
.agora-grid {
  display: grid;
  gap: var(--agora-spacing-md);
  
  // Mobile: single column
  grid-template-columns: 1fr;
  
  // Tablet: 2 columns
  @media (min-width: var(--agora-mobile)) {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--agora-spacing-lg);
  }
  
  // Desktop: 3 columns
  @media (min-width: var(--agora-tablet)) {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--agora-spacing-xl);
  }
  
  // Large desktop: 4 columns
  @media (min-width: var(--agora-desktop)) {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--agora-spacing-2xl);
  }
}
```

## 📱 **Mobile Optimization**

### **Touch-Friendly Controls**

```scss
.agora-mobile {
  // Touch-friendly button sizes
  .agora-button {
    min-height: 44px;
    min-width: 44px;
    padding: var(--agora-spacing-md);
    
    @media (max-width: 480px) {
      min-height: 48px;
      min-width: 48px;
      padding: var(--agora-spacing-lg);
    }
  }
  
  // Mobile navigation
  .agora-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--agora-bg-primary);
    border-top: 1px solid var(--agora-border-primary);
    padding: var(--agora-spacing-md);
    z-index: 1000;
  }
  
  // Mobile video grid
  .agora-video-grid {
    grid-template-columns: 1fr;
    gap: var(--agora-spacing-md);
    padding: var(--agora-spacing-md);
    
    @media (min-width: var(--agora-mobile)) {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--agora-spacing-lg);
      padding: var(--agora-spacing-lg);
    }
  }
}
```

### **Touch Gestures**

```javascript
// Touch gesture handling
const useTouchGestures = () => {
  const touchStart = ref({ x: 0, y: 0 })
  const touchEnd = ref({ x: 0, y: 0 })
  
  const onTouchStart = (event) => {
    touchStart.value = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    }
  }
  
  const onTouchEnd = (event) => {
    touchEnd.value = {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY
    }
    
    const gesture = detectGesture()
    handleGesture(gesture)
  }
  
  const detectGesture = () => {
    const deltaX = touchEnd.value.x - touchStart.value.x
    const deltaY = touchEnd.value.y - touchStart.value.y
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'swipe-right' : 'swipe-left'
    } else {
      return deltaY > 0 ? 'swipe-down' : 'swipe-up'
    }
  }
  
  const handleGesture = (gesture) => {
    switch (gesture) {
      case 'swipe-left':
        // Handle swipe left
        break
      case 'swipe-right':
        // Handle swipe right
        break
      case 'swipe-up':
        // Handle swipe up
        break
      case 'swipe-down':
        // Handle swipe down
        break
    }
  }
  
  return {
    onTouchStart,
    onTouchEnd
  }
}
```

---

> **Not**: Bu UI component dokümantasyonu, projenin **Context Engineering** yaklaşımına uygun olarak hazırlanmıştır. Her component, modern web standartları ve accessibility prensiplerine uygun olarak tasarlanmıştır.

