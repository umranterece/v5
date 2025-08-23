/**
 * Netless Whiteboard Service
 * Netless API ile room ve token yönetimi
 * @module services/netlessService
 */

import { NETLESS_CONFIG } from '../constants.js'
import { fileLogger, LOG_CATEGORIES } from './fileLogger.js'
import { rtmService } from './rtmService.js'

/**
 * Netless Service Class
 * Room oluşturma, token alma ve API yönetimi
 */
class NetlessService {
  constructor() {
    this.appIdentifier = NETLESS_CONFIG.SDK.APP_IDENTIFIER
    this.apiToken = NETLESS_CONFIG.SDK.API_TOKEN
    this.apiBaseUrl = NETLESS_CONFIG.SDK.API_BASE_URL
    this.phpBackendUrl = NETLESS_CONFIG.SDK.PHP_BACKEND_URL
    this.logInfo = (message, data) => fileLogger.log('info', LOG_CATEGORIES.WHITEBOARD, message, data)
    this.logError = (message, data) => fileLogger.log('error', LOG_CATEGORIES.WHITEBOARD, message, data)
  }

  /**
   * Yeni bir Netless room oluştur
   * @param {Object} options - Room seçenekleri
   * @param {string} options.name - Room adı
   * @param {number} options.limit - Maksimum katılımcı sayısı
   * @returns {Promise<Object>} Room bilgileri
   */
  async createRoom(options = {}) {
    const {
      name = `agora-whiteboard-${Date.now()}`,
      limit = NETLESS_CONFIG.ROOM.LIMIT
    } = options

    try {
      this.logInfo('Netless room oluşturuluyor', { name, limit })

      const response = await fetch(`${this.apiBaseUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.appIdentifier
        },
        body: JSON.stringify({
          name,
          limit,
          mode: NETLESS_CONFIG.ROOM.MODE
        })
      })

      if (!response.ok) {
        throw new Error(`Room creation failed: ${response.status} ${response.statusText}`)
      }

      const roomData = await response.json()
      
      this.logInfo('Netless room oluşturuldu', { 
        uuid: roomData.uuid, 
        name: roomData.name 
      })

      return {
        uuid: roomData.uuid,
        name: roomData.name,
        appIdentifier: this.appIdentifier,
        createdAt: new Date().toISOString(),
        mode: NETLESS_CONFIG.ROOM.MODE,
        limit
      }

    } catch (error) {
      this.logError('Room oluşturma hatası', { 
        error: error.message, 
        name, 
        limit 
      })
      throw error
    }
  }

  /**
   * Room için room token oluştur
   * @param {Object} options - Token seçenekleri
   * @param {string} options.uuid - Room UUID
   * @param {string} options.userId - Kullanıcı ID
   * @param {string} options.role - Kullanıcı rolü ('admin', 'writer', 'reader')
   * @returns {Promise<string>} Room token
   */
  async createRoomToken(options = {}) {
    const {
      uuid,
      userId = `user-${Date.now()}`,
      role = 'writer'
    } = options

    if (!uuid) {
      throw new Error('Room UUID gerekli')
    }

    try {
      this.logInfo('Room token oluşturuluyor', { uuid, userId, role })

      const response = await fetch(`${this.apiBaseUrl}/tokens/rooms/${uuid}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.appIdentifier
        },
        body: JSON.stringify({
          lifespan: 3600000, // 1 hour in milliseconds
          role
        })
      })

      if (!response.ok) {
        throw new Error(`Token creation failed: ${response.status} ${response.statusText}`)
      }

      const tokenData = await response.json()
      
      this.logInfo('Room token oluşturuldu', { 
        uuid, 
        userId, 
        role,
        hasToken: !!tokenData.token 
      })

      return tokenData.token

    } catch (error) {
      this.logError('Token oluşturma hatası', { 
        error: error.message, 
        uuid, 
        userId, 
        role 
      })
      throw error
    }
  }

  /**
   * Room ve token'ı birlikte oluştur (PHP backend ile)
   * @param {Object} options - Seçenekler
   * @param {string} options.roomName - Room adı
   * @param {string} options.userId - Kullanıcı ID
   * @param {string} options.role - Kullanıcı rolü
   * @param {Object} options.agoraInfo - Agora bilgileri (RTM bildirimi için)
   * @returns {Promise<Object>} Room ve token bilgileri
   */
  async createRoomWithToken(options = {}) {
    const {
      roomName,
      userId = `user-${Date.now()}`,
      role = 'writer',
      agoraInfo = null
    } = options

    try {
      this.logInfo('PHP backend ile room ve token oluşturuluyor', { roomName, userId, role })

      const response = await fetch(`${this.phpBackendUrl}?action=create_room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomName, userId, role })
      })

      if (!response.ok) {
        throw new Error(`PHP backend hatası: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(`PHP backend işlem hatası: ${result.error}`)
      }



      this.logInfo('PHP backend ile room ve token başarıyla oluşturuldu', result.room)
      
      // 🚀 RTM BİLDİRİMİ: Whiteboard aktivasyon bildirimi gönder (eğer agora bilgileri varsa)
      if (agoraInfo) {
        try {
          this.logInfo('RTM whiteboard aktivasyon bildirimi gönderiliyor...', { roomUuid: result.room.uuid })
          
          const whiteboardData = {
            roomUuid: result.room.uuid,
            timestamp: Date.now(),
            userInfo: {
              videoUID: agoraInfo.videoUID || 'unknown',
              userName: agoraInfo.userName || userId || 'Unknown User'
            },
            whiteboardInfo: {
              roomUuid: result.room.uuid,
              roomToken: result.room.token, // ✅ result.room.token olarak düzeltildi
              appIdentifier: this.appIdentifier
            }
          }
          

          
          const notificationSent = await rtmService.notifyWhiteboardActivated(whiteboardData)
          
          if (notificationSent) {
            this.logInfo('RTM whiteboard aktivasyon bildirimi başarıyla gönderildi', whiteboardData)
          } else {
            this.logInfo('RTM whiteboard aktivasyon bildirimi gönderilemedi (RTM bağlı değil)')
          }
        } catch (rtmError) {
          // RTM hatası whiteboard'ı durdurmasın, sadece log'la
          this.logInfo('RTM whiteboard aktivasyon bildirimi hatası (whiteboard devam ediyor)', { error: rtmError.message })
        }
      } else {
        this.logInfo('Agora bilgileri olmadığı için RTM bildirimi gönderilmedi')
      }

      return result.room

    } catch (error) {
      this.logError('PHP backend room ve token oluşturma hatası', { 
        error: error.message, 
        roomName, 
        userId, 
        role
      })
      throw error
    }
  }

  /**
   * Mevcut room için token al (PHP backend ile)
   * @param {string} roomUuid - Room UUID
   * @param {string} userId - Kullanıcı ID
   * @param {string} role - Kullanıcı rolü
   * @returns {Promise<Object>} Token bilgileri
   */
  async getRoomToken(roomUuid, userId, role = 'writer') {
    try {
      this.logInfo('PHP backend ile token alınıyor', { roomUuid, userId, role })

      const response = await fetch(`${this.phpBackendUrl}?action=get_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roomUuid, userId, role })
      })

      if (!response.ok) {
        throw new Error(`PHP backend hatası: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(`PHP backend işlem hatası: ${result.error}`)
      }

      this.logInfo('PHP backend ile token başarıyla alındı', result)
      return result

    } catch (error) {
      this.logError('PHP backend token alma hatası', { 
        error: error.message,
        roomUuid,
        userId,
        role
      })
      throw error
    }
  }

  /**
   * Mevcut room bilgilerini al
   * @param {string} uuid - Room UUID
   * @returns {Promise<Object>} Room bilgileri
   */
  async getRoomInfo(uuid) {
    if (!uuid) {
      throw new Error('Room UUID gerekli')
    }

    try {
      this.logInfo('Room bilgileri alınıyor', { uuid })

      const response = await fetch(`${this.apiBaseUrl}/rooms/${uuid}`, {
        method: 'GET',
        headers: {
          'token': this.appIdentifier
        }
      })

      if (!response.ok) {
        throw new Error(`Get room info failed: ${response.status} ${response.statusText}`)
      }

      const roomData = await response.json()
      
      this.logInfo('Room bilgileri alındı', { 
        uuid, 
        name: roomData.name,
        memberCount: roomData.memberCount || 0
      })

      return roomData

    } catch (error) {
      this.logError('Room bilgileri alma hatası', { 
        error: error.message, 
        uuid 
      })
      throw error
    }
  }

  /**
   * SDK test bağlantısı
   * @returns {Promise<boolean>} Bağlantı durumu
   */
  async testConnection() {
    try {
      this.logInfo('Netless SDK bağlantısı test ediliyor')

      // Basit bir API call ile test et
      const response = await fetch(`${this.apiBaseUrl}/rooms`, {
        method: 'GET',
        headers: {
          'token': this.appIdentifier
        }
      })

      const isConnected = response.ok
      
      this.logInfo('Netless SDK bağlantı testi', { 
        success: isConnected,
        status: response.status
      })

      return isConnected

    } catch (error) {
      this.logError('Netless SDK bağlantı test hatası', { 
        error: error.message 
      })
      return false
    }
  }
}

// Singleton instance
export const netlessService = new NetlessService()

// Named exports
export {
  NetlessService
}
