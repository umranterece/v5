import { NETLESS_CONFIG, RTM_MESSAGE_TYPES } from '../constants.js'
import { rtmService } from './rtmService.js'
import { centralEmitter } from '../utils/centralEmitter.js'

/**
 * 🎯 Netless Whiteboard Service
 * Channel-based whiteboard room yönetimi
 */
class NetlessService {
  constructor() {
    this.phpBackendUrl = NETLESS_CONFIG.SDK.PHP_BACKEND_URL
    this.channelWhiteboardRooms = new Map() // channelName -> roomInfo mapping
    this.logInfo = console.log
    this.logError = console.error
  }

  /**
   * 🆕 Channel için whiteboard room adı oluştur
   * @param {string} channelName - Agora channel adı
   * @returns {string} Whiteboard room adı
   */
  generateWhiteboardRoomName(channelName) {
    return `whiteboard-${channelName}`
  }



  /**
   * 🆕 Channel için whiteboard room oluştur veya mevcut olana katıl
   * @param {string} channelName - Agora channel adı
   * @param {Object} userInfo - Kullanıcı bilgileri
   * @param {Object} agoraStore - Agora store referansı (zorunlu)
   * @returns {Promise<Object>} Room bilgileri
   */
  async getOrCreateChannelWhiteboardRoom(channelName, userInfo = {}, agoraStore = null) {
    try {
      this.logInfo('Channel için whiteboard room alınıyor/oluşturuluyor', { 
        channelName, 
        userInfo 
      })

      // 1. Store'dan mevcut room'u kontrol et
      if (!agoraStore) {
        throw new Error('Agora store referansı gerekli')
      }
      
      const existingRoom = agoraStore.getChannelWhiteboardRoom(channelName)
      
      if (existingRoom && existingRoom.uuid) {
        this.logInfo('Store\'da mevcut whiteboard room bulundu, katılım yapılıyor', { 
          channelName, 
          roomUuid: existingRoom.uuid,
          memberCount: existingRoom.memberCount,
          isActive: existingRoom.isActive
        })
        
        // Mevcut room için token al
        const tokenResult = await this.getRoomToken(existingRoom.uuid, userInfo.userId || 'unknown', 'writer')
        
        return {
          ...existingRoom,
          token: tokenResult.token || tokenResult,
          isExisting: true,
          channelName
        }
      }

      // 2. Yeni room oluştur
      this.logInfo('Yeni whiteboard room oluşturuluyor', { channelName })
      
      // PHP backend'den yeni room oluştur
      const newRoom = await this.createRoomWithToken({
        roomName: this.generateWhiteboardRoomName(channelName),
        userId: userInfo.userId || 'unknown',
        role: 'writer',
        agoraInfo: {
          channelName,
          videoUID: userInfo.videoUID,
          userName: userInfo.userName
        }
      })
      
      // Cache'e ekle
      this.channelWhiteboardRooms.set(channelName, newRoom)
      
              // RTM üzerinden yeni room bildirimi gönder
        await this.notifyWhiteboardRoomCreated(channelName, newRoom, userInfo, agoraStore)

      this.logInfo('✅ Yeni whiteboard room oluşturuldu', { 
        channelName, 
        roomUuid: newRoom.uuid,
        roomName: newRoom.name
      })

      return {
        ...newRoom,
        isExisting: false,
        channelName
      }

    } catch (error) {
      this.logError('Channel whiteboard room alma/oluşturma hatası', { 
        error: error.message, 
        channelName,
        userInfo 
      })
      throw error
    }
  }

  /**
   * 🔔 RTM üzerinden yeni whiteboard room bildirimi gönder
   * @param {string} channelName - Channel adı
   * @param {Object} roomData - Room bilgileri
   * @param {Object} userInfo - Kullanıcı bilgileri
   * @param {Object} agoraStore - Agora store referansı
   */
  async notifyWhiteboardRoomCreated(channelName, roomData, userInfo, agoraStore) {
    try {
      // RTM connection check
      if (!rtmService.isClientConnected) {
        this.logError('❌ RTM client bağlı değil, mesaj gönderilemedi!', { channelName })
        return
      }
      
      if (!rtmService.isChannelSubscribed) {
        this.logError('❌ RTM channel\'a abone değil, mesaj gönderilemedi!', { channelName })
        return
      }

      const message = {
        type: RTM_MESSAGE_TYPES.WHITEBOARD_ROOM_CREATED,
        channelName,
        roomInfo: {
          uuid: roomData.uuid,
          name: roomData.name,
          channelName,
          createdAt: new Date().toISOString(), // ✅ Her zaman ISO string format
          createdBy: userInfo.userId || 'unknown',
          memberCount: 1,
          isActive: true  // ✅ Whiteboard aktif olduğunda true
        },
        timestamp: Date.now()
      }

      this.logInfo('🚀 RTM mesajı gönderiliyor...', { 
        channelName, 
        roomUuid: roomData.uuid,
        messageType: message.type,
        rtmConnected: rtmService.isClientConnected,
        rtmSubscribed: rtmService.isChannelSubscribed
      })

      await rtmService.sendChannelMessage(message.type, message)
      this.logInfo('✅ RTM üzerinden whiteboard room bildirimi gönderildi', { 
        channelName, 
        roomUuid: roomData.uuid,
        messageType: message.type,
        message: message
      })

    } catch (error) {
      this.logError('RTM whiteboard room bildirimi hatası', { 
        error: error.message, 
        channelName 
      })
    }
  }

  /**
   * 🗑️ Channel whiteboard room'unu cache'den kaldır
   * @param {string} channelName - Channel adı
   */
  removeChannelWhiteboardRoom(channelName) {
    this.channelWhiteboardRooms.delete(channelName)
    this.logInfo('Channel whiteboard room cache\'den kaldırıldı', { channelName })
  }

  /**
   * 🧹 Tüm channel whiteboard room cache'ini temizle
   */
  clearAllChannelWhiteboardRooms() {
    this.channelWhiteboardRooms.clear()
    this.logInfo('Tüm channel whiteboard room cache temizlendi')
  }

  /**
   * 📊 Channel whiteboard room durumunu al
   * @param {string} channelName - Channel adı
   * @returns {Object|null} Room durumu
   */
  getChannelWhiteboardRoomStatus(channelName) {
    return this.channelWhiteboardRooms.get(channelName) || null
  }

  /**
   * 🔑 Room için token al
   * @param {string} roomUuid - Room UUID
   * @param {string} userId - Kullanıcı ID
   * @param {string} role - Kullanıcı rolü
   * @returns {Promise<Object>} Token bilgileri
   */
  async getRoomToken(roomUuid, userId, role = 'writer') {
    try {
      // NOT: PHP backend şu an sadece room creation + token döndürüyor
      const response = await fetch(`${this.phpBackendUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_token',  // ✅ Action parametresi eklendi
          roomUuid,
          userId,
          role
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          this.logInfo('Room token başarıyla alındı', { 
            roomUuid, 
            userId, 
            role,
            token: result.data?.token ? 'VAR' : 'YOK'
          })
          return result.data  // ✅ result.data olarak değişti
        } else {
          throw new Error(result.error || 'Token alınamadı')
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

    } catch (error) {
      this.logError('Room token alma hatası', { 
        error: error.message, 
        roomUuid, 
        userId 
      })
      throw error
    }
  }

  /**
   * 🆕 Room oluştur ve token al
   * @param {Object} options - Room oluşturma seçenekleri
   * @returns {Promise<Object>} Room bilgileri
   */
  async createRoomWithToken(options = {}) {
    try {
      const {
        roomName,
        userId,
        role = 'writer',
        agoraInfo = {}
      } = options

      this.logInfo('Whiteboard room oluşturuluyor', { 
        roomName, 
        userId, 
        role 
      })

      const response = await fetch(`${this.phpBackendUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_room',  // ✅ Action parametresi eklendi
          roomName,
          userId,
          role,
          agoraInfo
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          this.logInfo('Whiteboard room başarıyla oluşturuldu', { 
            roomName, 
            roomUuid: result.data.uuid,
            channelName: result.data.channelName,
            memberCount: result.data.memberCount,
            isActive: result.data.isActive
          })
          return result.data  // ✅ result.data olarak değişti
        } else {
          throw new Error(result.error || 'Room oluşturulamadı')
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

    } catch (error) {
      this.logError('Whiteboard room oluşturma hatası', { 
        error: error.message, 
        options 
      })
      throw error
    }
  }

  /**
   * 📤 RTM mesajı gönder
   * @param {string} messageType - Mesaj tipi
   * @param {Object} data - Mesaj verisi
   */
  async sendRTMMessage(messageType, data) {
    try {
      await rtmService.sendChannelMessage(messageType, data)
      this.logInfo('RTM mesajı gönderildi', { messageType, data })
    } catch (error) {
      this.logError('RTM mesajı gönderme hatası', { 
        error: error.message, 
        messageType, 
        data 
      })
    }
  }
}

// Singleton instance
export const netlessService = new NetlessService()
