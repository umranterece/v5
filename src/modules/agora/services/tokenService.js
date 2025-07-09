import { API_ENDPOINTS, DEFAULTS } from '../constants.js'

/**
 * Token Servisi - Agora token oluşturma ve yönetim işlemleri
 * Bu servis, Agora video konferans oturumları için güvenli token'lar oluşturur.
 * Token'lar, kullanıcıların Agora kanallarına katılabilmesi için gereklidir.
 * @module services/tokenService
 */

/**
 * Agora token'ı oluşturur
 * Sunucuya istek göndererek güvenli bir token alır
 * @param {string} channelName - Kanal adı
 * @param {number} uid - Kullanıcı ID'si
 * @param {number} role - Kullanıcı rolü (publisher/subscriber)
 * @param {number} expireTime - Token geçerlilik süresi (saniye)
 * @returns {Promise<Object>} Token verileri (token, app_id, channel_name)
 */
export const createToken = async (channelName, uid, role = DEFAULTS.ROLE_PUBLISHER, expireTime = DEFAULTS.TOKEN_EXPIRE_TIME) => {
  try {
    // Sunucuya token oluşturma isteği gönder
    const response = await fetch(API_ENDPOINTS.CREATE_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel_name: channelName,
        uid: uid,
        role: role,
        expire_time: expireTime
      })
    })

    const result = await response.json()
    
    // Sunucu hatası kontrolü
    if (!result.success) {
      throw new Error(result.message || 'Token oluşturulamadı')
    }

    console.log('Token başarıyla oluşturuldu:', result)
    return result.data // Tüm veri objesini döndür (token, app_id, channel_name)
  } catch (error) {
    console.error('Token oluşturma hatası:', error)
    throw new Error('Sunucudan token oluşturulamadı')
  }
} 