/**
 * Agora Servisleri Dışa Aktarımı
 * Bu dosya, tüm Agora servislerini merkezi bir noktadan dışa aktarır.
 * Servisler modüler yapıda organize edilmiştir ve buradan tek noktadan erişilebilir.
 * @module services
 */

// Token servisi - Agora token oluşturma işlemleri
export { createToken } from './tokenService.js'

// Logger servisi - Merkezi logging sistemi
export { logger, logManager, LOG_LEVELS, LOG_CATEGORIES } from './logger.js'

// Gelecekteki servisler (yer tutucu dışa aktarımlar)
// Bu servisler ileride eklenebilir ve buradan dışa aktarılacak
// Recording servisi - Cloud recording işlemleri
export { recordingService } from './recordingService.js'
// export { createWhiteboard } from './whiteboardService.js' // Beyaz tahta servisi
// export { createChat } from './chatService.js' // Sohbet servisi 