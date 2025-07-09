import { ref, computed, onMounted, onUnmounted } from 'vue'

/**
 * Yayın Kalitesi Composable - Video yayınının kalitesini takip eder ve izler
 * Bu composable, ağ kalitesi, bit hızı, kare hızı, paket kaybı ve gecikme süresi gibi
 * metrikleri izler ve kalite seviyesini belirler.
 * @module composables/useStreamQuality
 */
export function useStreamQuality() {
  const networkQuality = ref(0) // Ağ kalitesi (0-6 arası, 0=en kötü, 6=en iyi)
  const bitrate = ref(0) // Bit hızı (Kbps)
  const frameRate = ref(0) // Kare hızı (FPS)
  const packetLoss = ref(0) // Paket kaybı (%)
  const rtt = ref(0) // Gidiş-dönüş süresi (ms)
  const qualityLevel = ref('unknown') // Kalite seviyesi (poor, fair, good, excellent)
  const isMonitoring = ref(false) // İzleme durumu
  
  let qualityTimer = null // Kalite güncelleme zamanlayıcısı

  /**
   * Kalite seviyesini hesaplar
   * Ağ kalitesi, bit hızı ve kare hızına göre kalite seviyesini belirler
   */
  const calculateQualityLevel = computed(() => {
    if (networkQuality.value >= 5 && bitrate.value > 1000 && frameRate.value > 20) {
      return 'excellent' // Mükemmel kalite
    } else if (networkQuality.value >= 3 && bitrate.value > 500 && frameRate.value > 15) {
      return 'good' // İyi kalite
    } else if (networkQuality.value >= 1 && bitrate.value > 200 && frameRate.value > 10) {
      return 'fair' // Orta kalite
    } else {
      return 'poor' // Düşük kalite
    }
  })

  /**
   * Kalite seviyesine göre renk döndürür
   * UI'da kalite göstergesi için kullanılır
   */
  const qualityColor = computed(() => {
    switch (qualityLevel.value) {
      case 'excellent': return '#10b981' // Yeşil - Mükemmel
      case 'good': return '#3b82f6' // Mavi - İyi
      case 'fair': return '#f59e0b' // Turuncu - Orta
      case 'poor': return '#ef4444' // Kırmızı - Düşük
      default: return '#6b7280' // Gri - Bilinmiyor
    }
  })

  /**
   * Kalite yüzdesini hesaplar
   * Ağ kalitesine göre 0-100 arası yüzde değeri döndürür
   */
  const qualityPercentage = computed(() => {
    const maxQuality = 6 // Ağ kalitesi maksimum değeri
    return Math.round((networkQuality.value / maxQuality) * 100)
  })

  /**
   * Kalite durumunu günceller
   * @param {Object} stats - Agora'dan gelen kalite istatistikleri
   */
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

  /**
   * Kalite takibini başlatır
   * @param {Object} client - Agora client
   */
  const startMonitoring = (client) => {
    if (!client || isMonitoring.value) return
    
    isMonitoring.value = true
    
    // Başlangıç değerleri - Varsayılan kalite değerleri
    networkQuality.value = 4 // Orta kalite
    bitrate.value = 800
    frameRate.value = 15
    packetLoss.value = 2
    rtt.value = 50
    qualityLevel.value = 'good'
    
    qualityTimer = setInterval(() => {
      // Simüle edilmiş kalite değerleri (gerçek API çalışana kadar)
      const randomChange = Math.random() * 0.4 - 0.2 // -0.2 ile +0.2 arası rastgele değişim
      
      networkQuality.value = Math.max(0, Math.min(6, networkQuality.value + randomChange))
      bitrate.value = Math.max(200, Math.min(2000, bitrate.value + randomChange * 100))
      frameRate.value = Math.max(10, Math.min(30, frameRate.value + randomChange * 2))
      packetLoss.value = Math.max(0, Math.min(10, packetLoss.value + randomChange * 0.5))
      rtt.value = Math.max(20, Math.min(200, rtt.value + randomChange * 10))
      
      // Gerçek API'yi de dene - Agora'dan gerçek istatistikleri al
      if (client && client.getTransportStats) {
        client.getTransportStats().then(stats => {
          console.log('Gerçek transport istatistikleri:', stats)
          updateQuality(stats)
        }).catch(err => {
          console.warn('Transport istatistikleri alınamadı:', err)
        })
      }
    }, 2000) // Her 2 saniyede bir güncelle
  }

  /**
   * Kalite takibini durdurur
   * Timer'ı temizler ve izleme durumunu sıfırlar
   */
  const stopMonitoring = () => {
    if (qualityTimer) {
      clearInterval(qualityTimer)
      qualityTimer = null
    }
    isMonitoring.value = false
  }

  // Component unmount olduğunda timer'ı temizle
  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    // State - Durum değişkenleri
    networkQuality,
    bitrate,
    frameRate,
    packetLoss,
    rtt,
    qualityLevel,
    isMonitoring,
    
    // Computed - Hesaplanmış değerler
    qualityColor,
    qualityPercentage,
    
    // Methods - Metodlar
    updateQuality,
    startMonitoring,
    stopMonitoring
  }
} 