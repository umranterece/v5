import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Stream Quality Composable - Yayın kalitesini takip eder
 * @module composables/useStreamQuality
 */
export function useStreamQuality() {
  const networkQuality = ref(0) // 0-6 arası (0=en kötü, 6=en iyi)
  const bitrate = ref(0) // Kbps
  const frameRate = ref(0) // FPS
  const packetLoss = ref(0) // %
  const rtt = ref(0) // ms
  const qualityLevel = ref('unknown') // poor, fair, good, excellent
  const isMonitoring = ref(false)
  
  let qualityTimer = null

  // Kalite seviyesini hesapla
  const calculateQualityLevel = computed(() => {
    if (networkQuality.value >= 5 && bitrate.value > 1000 && frameRate.value > 20) {
      return 'excellent'
    } else if (networkQuality.value >= 3 && bitrate.value > 500 && frameRate.value > 15) {
      return 'good'
    } else if (networkQuality.value >= 1 && bitrate.value > 200 && frameRate.value > 10) {
      return 'fair'
    } else {
      return 'poor'
    }
  })

  // Kalite rengini hesapla
  const qualityColor = computed(() => {
    switch (qualityLevel.value) {
      case 'excellent': return '#10b981' // Yeşil
      case 'good': return '#3b82f6' // Mavi
      case 'fair': return '#f59e0b' // Turuncu
      case 'poor': return '#ef4444' // Kırmızı
      default: return '#6b7280' // Gri
    }
  })

  // Kalite yüzdesini hesapla
  const qualityPercentage = computed(() => {
    const maxQuality = 6 // Network quality max değeri
    return Math.round((networkQuality.value / maxQuality) * 100)
  })

  // Kalite durumunu güncelle
  const updateQuality = (stats) => {
    if (stats) {
      networkQuality.value = stats.networkQuality || 0
      bitrate.value = stats.bitrate || 0
      frameRate.value = stats.frameRate || 0
      packetLoss.value = stats.packetLoss || 0
      rtt.value = stats.rtt || 0
      qualityLevel.value = calculateQualityLevel.value
    }
  }

  // Kalite takibini başlat
  const startMonitoring = (client) => {
    if (!client || isMonitoring.value) return
    
    isMonitoring.value = true
    
    // Başlangıç değerleri
    networkQuality.value = 4 // Orta kalite
    bitrate.value = 800
    frameRate.value = 15
    packetLoss.value = 2
    rtt.value = 50
    qualityLevel.value = 'good'
    
    qualityTimer = setInterval(() => {
      // Simüle edilmiş kalite değerleri (gerçek API çalışana kadar)
      const randomChange = Math.random() * 0.4 - 0.2 // -0.2 ile +0.2 arası
      
      networkQuality.value = Math.max(0, Math.min(6, networkQuality.value + randomChange))
      bitrate.value = Math.max(200, Math.min(2000, bitrate.value + randomChange * 100))
      frameRate.value = Math.max(10, Math.min(30, frameRate.value + randomChange * 2))
      packetLoss.value = Math.max(0, Math.min(10, packetLoss.value + randomChange * 0.5))
      rtt.value = Math.max(20, Math.min(200, rtt.value + randomChange * 10))
      
      // Gerçek API'yi de dene
      if (client && client.getTransportStats) {
        client.getTransportStats().then(stats => {
          console.log('Real transport stats:', stats)
          updateQuality(stats)
        }).catch(err => {
          console.warn('Failed to get transport stats:', err)
        })
      }
    }, 2000) // Her 2 saniyede bir güncelle
  }

  // Kalite takibini durdur
  const stopMonitoring = () => {
    if (qualityTimer) {
      clearInterval(qualityTimer)
      qualityTimer = null
    }
    isMonitoring.value = false
  }

  // Cleanup
  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    // State
    networkQuality,
    bitrate,
    frameRate,
    packetLoss,
    rtt,
    qualityLevel,
    isMonitoring,
    
    // Computed
    qualityColor,
    qualityPercentage,
    
    // Methods
    updateQuality,
    startMonitoring,
    stopMonitoring
  }
} 