import { API_ENDPOINTS, DEFAULTS } from '../constants.js'
import { fileLogger } from './index.js'

/**
 * Token Servisi - Agora token oluşturma ve yönetim işlemleri
 * Bu servis, Agora video konferans oturumları için güvenli token'lar oluşturur.
 * Token'lar, kullanıcıların Agora kanallarına katılabilmesi için gereklidir.
 * @module services/tokenService
 */

/**
 * Agora RTC token'ı oluşturur (Video/Audio için)
 * Sunucuya istek göndererek güvenli bir RTC token alır
 * @param {string} channelName - Kanal adı
 * @param {number} uid - Kullanıcı ID'si
 * @param {string} [customEndpoint] - Özel API endpoint (opsiyonel)
 * @param {number} role - Kullanıcı rolü (publisher/subscriber)
 * @param {number} expireTime - Token geçerlilik süresi (saniye)
 * @returns {Promise<Object>} Token verileri (token, app_id, channel_name)
 */
export const createTokenRTC = async (channelName, uid, customEndpoint = null, role = DEFAULTS.ROLE_PUBLISHER, expireTime = DEFAULTS.TOKEN_EXPIRE_TIME) => {
  // Logger fonksiyonları - FileLogger'dan al (tüm seviyeler için)
  const logDebug = (message, data) => fileLogger.log('debug', 'AGORA', message, data)
  const logInfo = (message, data) => fileLogger.log('info', 'AGORA', message, data)
  const logWarn = (message, data) => fileLogger.log('warn', 'AGORA', message, data)
  const logError = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('error', 'AGORA', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('error', 'AGORA', errorOrMessage, context)
  }
  const logFatal = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('fatal', 'AGORA', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('fatal', 'AGORA', errorOrMessage, context)
  }
  
  // API endpoint'i belirle - özel endpoint veya varsayılan
  const endpoint = customEndpoint || API_ENDPOINTS.CREATE_TOKEN_RTC
  
  try {
    // Sunucuya token oluşturma isteği gönder
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        channel_name: channelName,
        uid: uid,
        role: role,
        expire_time: expireTime
      }).toString()
    })

    // Response text olarak al
    const responseText = await response.text()
    
    // JSON parse etmeye çalış
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      // HTML response ise hata detayını göster
      throw new Error(`Sunucu HTML döndürüyor (PHP hatası): ${responseText.substring(0, 200)}...`)
    }
    
    // Sunucu hatası kontrolü
    if (!result.success) {
      throw new Error(result.message || 'Token oluşturulamadı')
    }

    logInfo('Token başarıyla oluşturuldu', result)
    return result.data // Tüm veri objesini döndür (token, app_id, channel_name)
  } catch (error) {
    logError(error, { context: 'createTokenRTC', channelName, uid })
    
    // Daha detaylı hata mesajı
    if (error.message) {
      throw new Error(`RTC Token hatası: ${error.message}`)
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Ağ bağlantısı hatası - sunucuya ulaşılamıyor')
    } else {
      throw new Error(`Sunucudan RTC token oluşturulamadı: ${error.toString()}`)
    }
  }
}

/**
 * Agora RTM token'ı oluşturur (Real-time Messaging için)
 * Sunucuya istek göndererek güvenli bir RTM token alır
 * @param {string} userId - Kullanıcı ID'si
 * @param {string} [customEndpoint] - Özel API endpoint (opsiyonel)
 * @param {number} expireTime - Token geçerlilik süresi (saniye)
 * @returns {Promise<Object>} Token verileri (token, app_id, user_id)
 */
export const createTokenRTM = async (userId, customEndpoint = null, expireTime = DEFAULTS.TOKEN_EXPIRE_TIME) => {
  // Logger fonksiyonları - FileLogger'dan al (tüm seviyeler için)
  const logDebug = (message, data) => fileLogger.log('debug', 'AGORA', message, data)
  const logInfo = (message, data) => fileLogger.log('info', 'AGORA', message, data)
  const logWarn = (message, data) => fileLogger.log('warn', 'AGORA', message, data)
  const logError = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('error', 'AGORA', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('error', 'AGORA', errorOrMessage, context)
  }
  const logFatal = (errorOrMessage, context) => {
    if (errorOrMessage instanceof Error) {
      return fileLogger.log('fatal', 'AGORA', errorOrMessage.message || errorOrMessage, { error: errorOrMessage, ...context })
    }
    return fileLogger.log('fatal', 'AGORA', errorOrMessage, context)
  }
  
  // API endpoint'i belirle - özel endpoint veya varsayılan
  const endpoint = customEndpoint || API_ENDPOINTS.CREATE_TOKEN_RTM
  
  try {
    // Sunucuya RTM token oluşturma isteği gönder
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        uid: userId,
        expire_time: expireTime
      }).toString()
    })

    // Response text olarak al
    const responseText = await response.text()
    
    // JSON parse etmeye çalış
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      // HTML response ise hata detayını göster
      throw new Error(`Sunucu HTML döndürüyor (PHP hatası): ${responseText.substring(0, 200)}...`)
    }
    
    // Sunucu hatası kontrolü
    if (!result.success) {
      throw new Error(result.message || 'RTM Token oluşturulamadı')
    }

    logInfo('RTM Token başarıyla oluşturuldu', result)
    return result.data // Tüm veri objesini döndür (token, app_id, user_id)
  } catch (error) {
    logError(error, { context: 'createTokenRTM', userId })
    
    // Daha detaylı hata mesajı
    if (error.message) {
      throw new Error(`RTM Token hatası: ${error.message}`)
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Ağ bağlantısı hatası - sunucuya ulaşılamıyor')
    } else {
      throw new Error(`Sunucudan RTM token oluşturulamadı: ${error.toString()}`)
    }
  }
}

/**
 * Hem RTC hem de RTM token'larını aynı anda oluşturur
 * @param {string} channelName - Kanal adı
 * @param {number} uid - Kullanıcı ID'si
 * @param {string} [customEndpoint] - Özel API endpoint (opsiyonel)
 * @param {number} role - Kullanıcı rolü (publisher/subscriber)
 * @param {number} expireTime - Token geçerlilik süresi (saniye)
 * @returns {Promise<Object>} RTC ve RTM token verileri
 */
export const createBothTokens = async (channelName, uid, customEndpoint = null, role = DEFAULTS.ROLE_PUBLISHER, expireTime = DEFAULTS.TOKEN_EXPIRE_TIME) => {
  try {
    // RTC token için varsayılan endpoint, RTM token için RTM endpoint'i kullan
    const rtcEndpoint = customEndpoint || API_ENDPOINTS.CREATE_TOKEN_RTC
    const rtmEndpoint = API_ENDPOINTS.CREATE_TOKEN_RTM
    
    // Her iki token'ı da paralel olarak oluştur
    const [rtcTokenResult, rtmTokenResult] = await Promise.all([
      createTokenRTC(channelName, uid, rtcEndpoint, role, expireTime),
      createTokenRTM(uid.toString(), rtmEndpoint, expireTime)
    ])

    return {
      rtc: rtcTokenResult,
      rtm: rtmTokenResult
    }
  } catch (error) {
    throw new Error(`Her iki token oluşturulamadı: ${error.message}`)
  }
}

/**
 * Backward compatibility için eski createToken fonksiyonu
 * @deprecated createTokenRTC kullanın
 */
export const createToken = createTokenRTC 