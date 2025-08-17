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
              <!-- Kalite Seviyesi ve Progress Bar -->
              <div class="quality-overview">
                <div class="quality-level-display">
                  <span class="quality-level-text" :style="{ color: networkQualityColor }">
                    {{ networkQualityLevel || 'N/A' }}
                  </span>
                  <span class="quality-percentage">{{ networkQualityPercentage || 0 }}%</span>
                </div>
                <div class="quality-progress">
                  <div 
                    class="quality-fill" 
                    :style="{ 
                      width: `${networkQualityPercentage || 0}%`,
                      backgroundColor: networkQualityColor 
                    }"
                  ></div>
                </div>
              </div>
              
              <!-- Detaylı Metrikler -->
              <div class="metrics-grid">
                <div class="metric-item">
                  <div class="metric-icon">📶</div>
                  <div class="metric-content">
                    <div class="metric-label">Ağ Kalitesi</div>
                    <div class="metric-value" :style="{ color: networkQualityColor }">
                      {{ networkQualityScore || 0 }}/6
                    </div>
                  </div>
                </div>
                
                <div class="metric-item">
                  <div class="metric-icon">⚡</div>
                  <div class="metric-content">
                    <div class="metric-label">Bit Hızı</div>
                    <div class="metric-value">{{ networkBitrate || 'N/A' }} kbps</div>
                  </div>
                </div>
                
                <div class="metric-item">
                  <div class="metric-icon">🎬</div>
                  <div class="metric-content">
                    <div class="metric-label">FPS</div>
                    <div class="metric-value">{{ networkFrameRate || 'N/A' }}</div>
                  </div>
                </div>
                
                <div class="metric-item">
                  <div class="metric-icon">📦</div>
                  <div class="metric-content">
                    <div class="metric-label">Paket Kaybı</div>
                    <div class="metric-value" :class="{ 'warning': networkPacketLoss > 5 }">
                      {{ networkPacketLoss || 'N/A' }}%
                    </div>
                  </div>
                </div>
                
                <div class="metric-item">
                  <div class="metric-icon">⏱️</div>
                  <div class="metric-content">
                    <div class="metric-label">RTT</div>
                    <div class="metric-value">{{ networkRtt || 'N/A' }} ms</div>
                  </div>
                </div>
                
                <div class="metric-item">
                  <div class="metric-icon">🔗</div>
                  <div class="metric-content">
                    <div class="metric-label">Bağlantı</div>
                    <div class="metric-value status-badge" :class="{ 'connected': isConnected, 'disconnected': !isConnected }">
                      {{ isConnected ? 'Aktif' : 'Kesik' }}
                    </div>
                  </div>
                </div>
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

        <!-- Users List - Full Width -->
        <div class="info-section users-section">
          <h4>👥 Katılımcılar</h4>
          <div class="users-list">
            <div v-for="user in allUsers" :key="user.uid" class="user-item">
              <span class="user-icon">{{ user.isLocal ? '👤' : '👥' }}</span>
              <span class="user-name">{{ user.userName || `User ${user.uid}` }}</span>
              <span class="user-status" :class="{ 'local': user.isLocal }">
                {{ user.isLocal ? 'Siz' : 'Katılımcı' }}
              </span>
            </div>
            <div v-if="allUsers.length === 0" class="no-users">
              Henüz katılımcı yok
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  channelName: { type: String, default: '' },
  isConnected: { type: Boolean, default: false },
  connectedUsersCount: { type: Number, default: 0 },
  networkQualityLevel: { type: String, default: 'Unknown' },
  networkQualityColor: { type: String, default: 'var(--rs-agora-gray-500)' },
  networkQualityScore: { type: Number, default: 0 },
  networkQualityPercentage: { type: Number, default: 0 },
  networkBitrate: { type: Number, default: 0 },
  networkFrameRate: { type: Number, default: 0 },
  networkRtt: { type: Number, default: 0 },
  networkPacketLoss: { type: Number, default: 0 },
  canUseCamera: { type: Boolean, default: true },
  canUseMicrophone: { type: Boolean, default: true },
  isLocalVideoOff: { type: Boolean, default: false },
  isLocalAudioMuted: { type: Boolean, default: false },
  allUsers: { type: Array, default: () => [] }
})

// Emits
const emit = defineEmits(['close'])

// Methods
const handleOverlayClick = () => {
  emit('close')
}
</script>

<style scoped>
/* Modal Overlay */
.info-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--rs-agora-transparent-black-70);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

/* Modal */
.info-modal {
  background: var(--rs-agora-dark-surface-26-98);
  border: 1px solid var(--rs-agora-transparent-white-10);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow: var(--rs-agora-shadow-xl);
  width: 95%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideIn 0.3s ease;
}

/* Header */
.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px 15px 25px;
  border-bottom: 1px solid var(--rs-agora-transparent-white-10);
  position: sticky;
  top: 0;
  background: var(--rs-agora-dark-surface-26-98);
  border-radius: 20px 20px 0 0;
}

.info-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--rs-agora-white);
}

.close-btn {
  background: var(--rs-agora-transparent-white-10);
  border: none;
  color: var(--rs-agora-white);
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--rs-agora-transparent-white-20);
  transform: scale(1.1);
}

/* Content */
.info-content {
  padding: 20px 25px 25px 25px;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-bottom: 25px;
}

/* Widget Styles */
.info-widget {
  background: linear-gradient(135deg, var(--rs-agora-transparent-white-05) 0%, var(--rs-agora-transparent-white-02) 100%);
  border: 1px solid var(--rs-agora-transparent-white-10);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.info-widget::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--rs-agora-gradient-primary);
}

.info-widget:hover {
  transform: translateY(-2px);
  box-shadow: var(--rs-agora-shadow-lg);
  border-color: var(--rs-agora-transparent-white-20);
}

/* Widget Header */
.widget-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
}

.widget-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rs-agora-transparent-white-10);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.widget-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--rs-agora-text-primary);
  text-shadow: 0 2px 4px var(--rs-agora-transparent-black-30);
}

/* Widget Content */
.widget-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Widget Stats */
.widget-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--rs-agora-transparent-white-05);
}

.widget-stat:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: var(--rs-agora-transparent-white-70);
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: var(--rs-agora-text-primary);
  font-weight: 600;
  text-align: right;
}

/* Status Badges */
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.connected {
  background: var(--rs-agora-transparent-success-20);
  color: var(--rs-agora-success);
  border: 1px solid var(--rs-agora-transparent-success-30);
}

.status-badge.disconnected {
  background: var(--rs-agora-transparent-error-20);
  color: var(--rs-agora-error);
  border: 1px solid var(--rs-agora-transparent-error-30);
}

/* Quality Badge */
.quality-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: color-mix(in srgb, var(--quality-color) 20%, transparent);
  color: var(--quality-color);
  border: 1px solid color-mix(in srgb, var(--quality-color) 30%, transparent);
}

/* Quality Overview */
.quality-overview {
  margin-bottom: 20px;
}

.quality-level-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.quality-level-text {
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.quality-percentage {
  font-size: 16px;
  font-weight: 600;
  color: var(--rs-agora-text-primary);
  background: var(--rs-agora-transparent-white-10);
  padding: 4px 12px;
  border-radius: 20px;
}

.quality-progress {
  position: relative;
  height: 12px;
  background: var(--rs-agora-transparent-white-10);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px var(--rs-agora-transparent-black-20);
}

.quality-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease, background-color 0.3s ease;
  box-shadow: 0 2px 8px var(--rs-agora-transparent-black-30);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--rs-agora-transparent-white-05);
  border-radius: 12px;
  border: 1px solid var(--rs-agora-transparent-white-08);
  transition: all 0.2s ease;
}

.metric-item:hover {
  background: var(--rs-agora-transparent-white-08);
  border-color: var(--rs-agora-transparent-white-15);
  transform: translateY(-1px);
}

.metric-icon {
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rs-agora-transparent-white-10);
  border-radius: 8px;
  flex-shrink: 0;
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-label {
  font-size: 11px;
  color: var(--rs-agora-text-secondary);
  font-weight: 500;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 14px;
  color: var(--rs-agora-text-primary);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-value.warning {
  color: var(--rs-agora-warning);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}



/* Device Badges */
.device-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.device-badge.available {
  background: var(--rs-agora-transparent-success-20);
  color: var(--rs-agora-success);
  border: 1px solid var(--rs-agora-transparent-success-30);
}

.device-badge.unavailable {
  background: var(--rs-agora-transparent-error-20);
  color: var(--rs-agora-error);
  border: 1px solid var(--rs-agora-transparent-error-30);
}

.users-section {
  grid-column: 1 / -1;
  margin-bottom: 0;
}

.info-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--rs-agora-white);
  border-bottom: 1px solid var(--rs-agora-transparent-white-05);
  padding-bottom: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
}

.info-label {
  color: var(--rs-agora-text-secondary);
  font-size: 14px;
}

.info-value {
  color: var(--rs-agora-white);
  font-size: 14px;
  font-weight: 500;
}

/* Users List */
.users-list {
  max-height: 200px;
  overflow-y: auto;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--rs-agora-transparent-white-05);
}

.user-item:last-child {
  border-bottom: none;
}

.user-icon {
  font-size: 16px;
}

.user-name {
  color: var(--rs-agora-white);
  font-size: 14px;
  flex: 1;
}

.user-status {
  color: var(--rs-agora-text-secondary);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background: var(--rs-agora-transparent-white-10);
}

.user-status.local {
  color: var(--rs-agora-success);
  background: var(--rs-agora-transparent-success-10);
}

.no-users {
  color: var(--rs-agora-text-secondary);
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
  font-style: italic;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .info-modal {
    width: 95%;
    max-height: 90vh;
    margin: 20px;
  }
  
  .info-header {
    padding: 20px 20px 15px 20px;
  }
  
  .info-content {
    padding: 20px 20px 25px 20px;
  }
  
  .info-header h3 {
    font-size: 20px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .info-widget {
    padding: 16px;
  }
  
  .widget-header {
    margin-bottom: 16px;
    gap: 10px;
  }
  
  .widget-icon {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
  
  .widget-header h4 {
    font-size: 16px;
  }
  
  .widget-content {
    gap: 14px;
  }
  
  .widget-stat {
    padding: 10px 0;
  }
  
  .stat-label, .stat-value {
    font-size: 13px;
  }
  
  /* Quality Overview Responsive */
  .quality-level-text {
    font-size: 16px;
  }
  
  .quality-percentage {
    font-size: 14px;
    padding: 3px 10px;
  }
  
  .quality-progress {
    height: 10px;
  }
  
  /* Metrics Grid Responsive */
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
  }
  
  .metric-item {
    padding: 10px;
    gap: 10px;
  }
  
  .metric-icon {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
  
  .metric-label {
    font-size: 10px;
  }
  
  .metric-value {
    font-size: 13px;
  }
  

}

/* Scrollbar Styling */
.info-modal::-webkit-scrollbar {
  width: 6px;
}

.info-modal::-webkit-scrollbar-track {
  background: var(--rs-agora-transparent-white-05);
  border-radius: 3px;
}

.info-modal::-webkit-scrollbar-thumb {
  background: var(--rs-agora-transparent-white-20);
  border-radius: 3px;
}

.info-modal::-webkit-scrollbar-thumb:hover {
  background: var(--rs-agora-transparent-white-30);
}
</style>
