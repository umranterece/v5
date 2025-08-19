import { ref, computed, onMounted, onUnmounted } from 'vue'
import { fileLogger, LOG_CATEGORIES } from '../services/fileLogger.js'
import { AGORA_EVENTS } from '../constants.js'

/**
 * Yayın Kalitesi Composable - Video yayınının kalitesini takip eder ve izler
 * Bu composable, ağ kalitesi, bit hızı, kare hızı, paket kaybı ve gecikme süresi gibi
 * metrikleri izler ve kalite seviyesini belirler.
 * @module composables/useStreamQuality
 */
export function useStreamQuality() {
  // Logger fonksiyonları - FileLogger'dan al (tüm seviyeler için)
  const logDebug = (message, data) => fileLogger.log('debug', LOG_CATEGORIES.NETWORK, message, data)
  const logInfo = (message, data) => fileLogger.log('info', LOG_CATEGORIES.NETWORK, message, data)
  const logWarn = (message, data) => fileLogger.log('warn', LOG_CATEGORIES.NETWORK, message, data)
  const logError = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('error', LOG_CATEGORIES.NETWORK, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('error', LOG_CATEGORIES.NETWORK, errorOrMessage, context)
  }
  const logFatal = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('fatal', LOG_CATEGORIES.NETWORK, errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('fatal', LOG_CATEGORIES.NETWORK, errorOrMessage, context)
  }
  
  // State değişkenleri
  const networkQuality = ref(0) // Ağ kalitesi (0-6 arası, 0=en kötü, 6=en iyi)
  const bitrate = ref(0) // Bit hızı (Kbps)
  const frameRate = ref(0) // Kare hızı (FPS)
  const packetLoss = ref(0) // Paket kaybı (%)
  const rtt = ref(0) // Gidiş-dönüş süresi (ms)
  const qualityLevel = ref('bilinmiyor') // Kalite seviyesi (düşük, orta, iyi, mükemmel)
  const isMonitoring = ref(false) // İzleme durumu
  const lastUpdateTime = ref(0) // Son güncelleme zamanı
  
  let qualityTimer = null // Kalite güncelleme zamanlayıcısı
  let currentClient = null // Mevcut Agora client

  /**
   * Kalite seviyesini hesaplar
   * Ağ kalitesi, bit hızı ve kare hızına göre kalite seviyesini belirler
   */
  const calculateQualityLevel = computed(() => {
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
   * Gerçek Agora istatistiklerini alır
   * @param {Object} client - Agora client
   */
  const fetchRealStats = async (client) => {
    if (!client) return null

    try {
      const stats = {
        networkQuality: 0,
        bitrate: 0,
        frameRate: 0,
        packetLoss: 0,
        rtt: 0
      }

      // Transport istatistikleri (ağ kalitesi, RTT, paket kaybı)
      if (client.getTransportStats) {
        const transportStats = await client.getTransportStats()
        logInfo('Transport statistics received', transportStats)
        
        if (transportStats) {
          stats.rtt = transportStats.Rtt || 0
          stats.packetLoss = transportStats.PacketLossRate || 0
          // Network quality genellikle transport stats'da gelir
          stats.networkQuality = transportStats.NetworkQuality || 0
        }
      }

      // Local audio istatistikleri
      if (client.getLocalAudioStats) {
        const audioStats = await client.getLocalAudioStats()
        logInfo('Local audio statistics received', audioStats)
        
        if (audioStats && Object.keys(audioStats).length > 0) {
          const firstAudioTrack = Object.values(audioStats)[0]
          if (firstAudioTrack) {
            stats.bitrate = (stats.bitrate + (firstAudioTrack.SendBitrate || 0)) / 2
          }
        }
      }

      // Local video istatistikleri
      if (client.getLocalVideoStats) {
        const videoStats = await client.getLocalVideoStats()
        logInfo('Local video statistics received', videoStats)
        
        if (videoStats && Object.keys(videoStats).length > 0) {
          const firstVideoTrack = Object.values(videoStats)[0]
          if (firstVideoTrack) {
            stats.bitrate = (stats.bitrate + (firstVideoTrack.SendBitrate || 0)) / 2
            stats.frameRate = firstVideoTrack.SendFrameRate || 0
          }
        }
      }

      // Network quality event'lerini dinle
      if (client.on && !client._networkQualityListener) {
        client._networkQualityListener = true
        client.on(AGORA_EVENTS.NETWORK_QUALITY, (stats) => {
          logInfo('Network quality event received', stats)
          if (stats) {
            networkQuality.value = stats.downlinkNetworkQuality || stats.uplinkNetworkQuality || 0
          }
        })
      }

      return stats
    } catch (error) {
      logError('Real stats fetch error', { error, context: 'fetchRealStats' })
      return null
    }
  }

  /**
   * Kalite durumunu günceller
   * @param {Object} stats - Agora'dan gelen kalite istatistikleri
   */
  const updateQuality = (stats) => {
    if (stats) {
      networkQuality.value = stats.networkQuality || networkQuality.value
      bitrate.value = stats.bitrate || bitrate.value
      frameRate.value = stats.frameRate || frameRate.value
      packetLoss.value = stats.packetLoss || packetLoss.value
      rtt.value = stats.rtt || rtt.value
      qualityLevel.value = calculateQualityLevel.value
      lastUpdateTime.value = Date.now()
      
      logInfo('Quality updated', {
        networkQuality: networkQuality.value,
        bitrate: bitrate.value,
        frameRate: frameRate.value,
        packetLoss: packetLoss.value,
        rtt: rtt.value,
        qualityLevel: qualityLevel.value
      })
    }
  }

  /**
   * Kalite takibini başlatır
   * @param {Object} client - Agora client
   */
  const startMonitoring = (client) => {
    if (!client || isMonitoring.value) return
    
    currentClient = client
    isMonitoring.value = true
    
    // Başlangıç değerleri - Varsayılan kalite değerleri
    networkQuality.value = 4 // Orta kalite
    bitrate.value = 800
    frameRate.value = 15
    packetLoss.value = 2
    rtt.value = 50
    qualityLevel.value = 'iyi'
    
    logInfo('Quality monitoring started', { clientId: client.uid })
    
    // İlk istatistikleri hemen al
    fetchRealStats(client).then(stats => {
      if (stats) {
        updateQuality(stats)
      }
    })
    
    qualityTimer = setInterval(async () => {
      if (currentClient) {
        const stats = await fetchRealStats(currentClient)
        if (stats) {
          updateQuality(stats)
        }
      }
    }, 2000) // 2 saniyede bir güncelle (daha sık)
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
    
    if (currentClient && currentClient._networkQualityListener) {
      currentClient.off(AGORA_EVENTS.NETWORK_QUALITY)
      currentClient._networkQualityListener = false
    }
    
    isMonitoring.value = false
    currentClient = null
    
    logInfo('Quality monitoring stopped')
  }

  /**
   * Ekran paylaşımı için kalite optimizasyonu yapar
   * Düşük kalite durumunda ekran paylaşımı ayarlarını otomatik olarak düşürür
   * @param {Object} screenTrack - Ekran paylaşımı track'i
   */
  const optimizeScreenShareQuality = (screenTrack) => {
    if (!screenTrack || !screenTrack.setEncoderConfiguration) {
      logInfo('Ekran track\'i optimize edilemedi - setEncoderConfiguration mevcut değil')
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
          logInfo('Ekran paylaşımı çok düşük kalite moduna geçirildi')
          break
          
        case 'orta':
          // Düşük kalite ayarları
          screenTrack.setEncoderConfiguration({
            bitrateMin: 400,
            bitrateMax: 800,
            frameRate: 8
          })
          logInfo('Ekran paylaşımı düşük kalite moduna geçirildi')
          break
          
        case 'iyi':
          // Orta kalite ayarları
          screenTrack.setEncoderConfiguration({
            bitrateMin: 600,
            bitrateMax: 1200,
            frameRate: 12
          })
          logInfo('Ekran paylaşımı orta kalite moduna geçirildi')
          break
          
        case 'mükemmel':
          // Yüksek kalite ayarları
          screenTrack.setEncoderConfiguration({
            bitrateMin: 800,
            bitrateMax: 1500,
            frameRate: 15
          })
          logInfo('Ekran paylaşımı yüksek kalite moduna geçirildi')
          break
          
        default:
          // Varsayılan ayarlar
          screenTrack.setEncoderConfiguration({
            bitrateMin: 600,
            bitrateMax: 1200,
            frameRate: 12
          })
          logInfo('Ekran paylaşımı varsayılan kalite moduna geçirildi')
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
    lastUpdateTime,
    
    // Computed - Hesaplanmış değerler
    qualityColor,
    qualityPercentage,
    
    // Methods - Metodlar
    updateQuality,
    startMonitoring,
    stopMonitoring,
    optimizeScreenShareQuality,
    fetchRealStats
  }
} 