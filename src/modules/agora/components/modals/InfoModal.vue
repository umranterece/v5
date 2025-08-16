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
  networkQualityColor: { type: String, default: '#6b7280' },
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
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

/* Modal */
.info-modal {
  background: rgba(26, 26, 46, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  background: rgba(26, 26, 46, 0.98);
  border-radius: 20px 20px 0 0;
}

.info-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #fff;
}

.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
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
  background: rgba(255, 255, 255, 0.2);
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.info-widget:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.2);
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.widget-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.widget-stat:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: #ffffff;
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
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.status-badge.disconnected {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
}

/* Quality Badge */
.quality-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(var(--quality-color), 0.2);
  color: var(--quality-color);
  border: 1px solid rgba(var(--quality-color), 0.3);
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
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.device-badge.unavailable {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
}

.users-section {
  grid-column: 1 / -1;
  margin-bottom: 0;
}

.info-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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
  color: #a0a0a0;
  font-size: 14px;
}

.info-value {
  color: #fff;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.user-item:last-child {
  border-bottom: none;
}

.user-icon {
  font-size: 16px;
}

.user-name {
  color: #fff;
  font-size: 14px;
  flex: 1;
}

.user-status {
  color: #a0a0a0;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.user-status.local {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.1);
}

.no-users {
  color: #a0a0a0;
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
}

/* Scrollbar Styling */
.info-modal::-webkit-scrollbar {
  width: 6px;
}

.info-modal::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.info-modal::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.info-modal::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
