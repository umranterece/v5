<template>
  <div class="stream-quality-bar" v-if="showQualityBar">
    <!-- Ana kalite bar -->
    <div class="quality-container">
      <div class="quality-header">
        <span class="quality-icon">📊</span>
        <span class="quality-label">Yayın Kalitesi</span>
        <span class="quality-level" :style="{ color: qualityColor }">
          {{ qualityLevel.toUpperCase() }}
        </span>
      </div>
      
      <!-- Progress bar -->
      <div class="quality-progress">
        <div 
          class="quality-fill" 
          :style="{ 
            width: `${qualityPercentage}%`,
            backgroundColor: qualityColor 
          }"
        ></div>
        <div class="quality-percentage">{{ qualityPercentage }}%</div>
      </div>
      
      <!-- Detaylı bilgiler -->
      <div class="quality-details">
        <div class="quality-item">
          <span class="detail-label">Ağ:</span>
          <span class="detail-value" :style="{ color: qualityColor }">
            {{ networkQuality }}/6
          </span>
        </div>
        <div class="quality-item">
          <span class="detail-label">Bit Hızı:</span>
          <span class="detail-value">{{ bitrate }} kbps</span>
        </div>
        <div class="quality-item">
          <span class="detail-label">FPS:</span>
          <span class="detail-value">{{ frameRate }}</span>
        </div>
        <div class="quality-item">
          <span class="detail-label">Paket Kaybı:</span>
          <span class="detail-value" :class="{ 'warning': packetLoss > 5 }">
            {{ packetLoss }}%
          </span>
        </div>
        <div class="quality-item">
          <span class="detail-label">RTT:</span>
          <span class="detail-value">{{ rtt }}ms</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  networkQuality: { type: Number, default: 0 },
  bitrate: { type: Number, default: 0 },
  frameRate: { type: Number, default: 0 },
  packetLoss: { type: Number, default: 0 },
  rtt: { type: Number, default: 0 },
  qualityLevel: { type: String, default: 'unknown' },
  qualityColor: { type: String, default: 'var(--rs-agora-gray-500)' },
  qualityPercentage: { type: Number, default: 0 },
  isConnected: { type: Boolean, default: false }
})

// Computed
const showQualityBar = computed(() => {
  return props.isConnected && props.networkQuality > 0
})
</script>

<style scoped>
.stream-quality-bar {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  min-width: 280px;
}

.quality-container {
  background: var(--rs-agora-dark-surface-80);
  backdrop-filter: blur(10px);
  border: 1px solid var(--rs-agora-transparent-white-10);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--rs-agora-shadow-xl);
}

.quality-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.quality-icon {
  font-size: 16px;
}

.quality-label {
  color: var(--rs-agora-text-primary);
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.quality-level {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quality-progress {
  position: relative;
  height: 8px;
  background: var(--rs-agora-transparent-white-10);
  border-radius: 4px;
  margin-bottom: 12px;
  overflow: hidden;
}

.quality-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.quality-percentage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: 600;
  color: var(--rs-agora-white);
  text-shadow: 0 1px 2px var(--rs-agora-transparent-black-50);
}

.quality-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.quality-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.detail-label {
  color: var(--rs-agora-text-secondary);
  font-weight: 500;
}

.detail-value {
  color: var(--rs-agora-text-primary);
  font-weight: 600;
}

.detail-value.warning {
  color: var(--rs-agora-warning);
}

/* Responsive */
@media (max-width: 768px) {
  .stream-quality-bar {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
  }
  
  .quality-details {
    grid-template-columns: 1fr;
  }
}

/* Animasyonlar */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.quality-container:hover {
  transform: scale(1.02);
  transition: transform 0.2s ease;
}
</style> 