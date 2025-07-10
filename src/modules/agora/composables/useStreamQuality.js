import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLogger } from './useLogger.js'

const { logQuality, logError } = useLogger()

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
  const qualityLevel = ref('bilinmiyor') // Kalite seviyesi (düşük, orta, iyi, mükemmel)
  const isMonitoring = ref(false) // İzleme durumu
  
  let qualityTimer = null // Kalite güncelleme zamanlayıcısı

  /**
   * Kalite seviyesini hesaplar
   * Ağ kalitesi, bit hızı ve kare hızına göre kalite seviyesini belirler
   * Ekran paylaşımı için daha düşük kalite eşikleri kullanır
   */
  const calculateQualityLevel = computed(() => {
    // Ekran paylaşımı için optimize edilmiş kalite eşikleri
    const isScreenShare = false // TODO: Ekran paylaşımı durumunu algıla
    
    if (isScreenShare) {
      // Ekran paylaşımı için daha düşük eşikler
      if (networkQuality.value >= 4 && bitrate.value > 600 && frameRate.value > 12) {
        return 'mükemmel' // Ekran paylaşımı için mükemmel
      } else if (networkQuality.value >= 2 && bitrate.value > 300 && frameRate.value > 8) {
        return 'iyi' // Ekran paylaşımı için iyi
      } else if (networkQuality.value >= 1 && bitrate.value > 150 && frameRate.value > 5) {
        return 'orta' // Ekran paylaşımı için orta
      } else {
        return 'düşük' // Ekran paylaşımı için düşük
      }
    } else {
      // Normal video için standart eşikler
      if (networkQuality.value >= 5 && bitrate.value > 1000 && frameRate.value > 20) {
        return 'mükemmel' // Mükemmel kalite
      } else if (networkQuality.value >= 3 && bitrate.value > 500 && frameRate.value > 15) {
        return 'iyi' // İyi kalite
      } else if (networkQuality.value >= 1 && bitrate.value > 200 && frameRate.value > 10) {
        return 'orta' // Orta kalite
      } else {
        return 'düşük' // Düşük kalite
      }
    }
  })

  /**
   * Kalite seviyesine göre renk döndürür
   * UI'da kalite göstergesi için kullanılır
   */
  const qualityColor = computed(() => {
    switch (qualityLevel.value) {
      case 'mükemmel': return '#10b981' // Yeşil - Mükemmel
      case 'iyi': return '#3b82f6' // Mavi - İyi
      case 'orta': return '#f59e0b' // Turuncu - Orta
      case 'düşük': return '#ef4444' // Kırmızı - Düşük
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
    qualityLevel.value = 'iyi'
    
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
          logQuality('Real transport statistics', stats)
          updateQuality(stats)
        }).catch(err => {
          logError(err, { context: 'getTransportStats' })
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

  /**
   * Ekran paylaşımı için kalite optimizasyonu yapar
   * Düşük kalite durumunda ekran paylaşımı ayarlarını otomatik olarak düşürür
   * @param {Object} screenTrack - Ekran paylaşımı track'i
   */
  const optimizeScreenShareQuality = (screenTrack) => {
    if (!screenTrack || !screenTrack.setEncoderConfiguration) {
      logQuality('Ekran track\'i optimize edilemedi - setEncoderConfiguration mevcut değil')
      return
    }

    // Mevcut kalite seviyesine göre optimizasyon yap
    const currentQuality = qualityLevel.value
    
    try {
      switch (currentQuality) {
        case 'düşük':
          // Çok düşük kalite ayarları
          screenTrack.setEncoderConfiguration({
            bitrateMin: 200,
            bitrateMax: 400,
            frameRate: 5
          })
          logQuality('Ekran paylaşımı çok düşük kalite moduna geçirildi')
          break
          
        case 'orta':
          // Düşük kalite ayarları
          screenTrack.setEncoderConfiguration({
            bitrateMin: 400,
            bitrateMax: 800,
            frameRate: 8
          })
          logQuality('Ekran paylaşımı düşük kalite moduna geçirildi')
          break
          
        case 'iyi':
          // Orta kalite ayarları
          screenTrack.setEncoderConfiguration({
            bitrateMin: 600,
            bitrateMax: 1200,
            frameRate: 12
          })
          logQuality('Ekran paylaşımı orta kalite moduna geçirildi')
          break
          
        case 'mükemmel':
          // Yüksek kalite ayarları
          screenTrack.setEncoderConfiguration({
            bitrateMin: 800,
            bitrateMax: 1500,
            frameRate: 15
          })
          logQuality('Ekran paylaşımı yüksek kalite moduna geçirildi')
          break
          
        default:
          // Varsayılan ayarlar
          screenTrack.setEncoderConfiguration({
            bitrateMin: 600,
            bitrateMax: 1200,
            frameRate: 12
          })
          logQuality('Ekran paylaşımı varsayılan kalite moduna geçirildi')
      }
    } catch (error) {
      logError('Ekran paylaşımı kalite optimizasyonu başarısız:', error)
    }
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
    stopMonitoring,
    optimizeScreenShareQuality
  }
} 