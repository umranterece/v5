<template>
  <div class="stream-quality-bar" v-if="showQualityBar">
    <!-- Ana kalite bar -->
    <div class="quality-container">
      <div class="quality-header">
        <span class="quality-icon">📊</span>
        <span class="quality-label">Stream Quality</span>
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
          <span class="detail-label">Network:</span>
          <span class="detail-value" :style="{ color: qualityColor }">
            {{ networkQuality }}/6
          </span>
        </div>
        <div class="quality-item">
          <span class="detail-label">Bitrate:</span>
          <span class="detail-value">{{ bitrate }} kbps</span>
        </div>
        <div class="quality-item">
          <span class="detail-label">FPS:</span>
          <span class="detail-value">{{ frameRate }}</span>
        </div>
        <div class="quality-item">
          <span class="detail-label">Packet Loss:</span>
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
  qualityColor: { type: String, default: '#6b7280' },
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
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
  color: #e5e7eb;
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
  background: rgba(255, 255, 255, 0.1);
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
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
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
  color: #9ca3af;
  font-weight: 500;
}

.detail-value {
  color: #e5e7eb;
  font-weight: 600;
}

.detail-value.warning {
  color: #f59e0b;
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