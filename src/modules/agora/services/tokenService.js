import { API_ENDPOINTS, DEFAULTS } from '../constants.js'

/**
 * Token Service - Agora token oluşturma işlemleri
 * @module services/tokenService
 */

/**
 * Create Agora token
 * @param {string} channelName - Channel name
 * @param {number} uid - User ID
 * @param {number} role - User role (publisher/subscriber)
 * @param {number} expireTime - Token expire time in seconds
 * @returns {Promise<Object>} Token data
 */
export const createToken = async (channelName, uid, role = DEFAULTS.ROLE_PUBLISHER, expireTime = DEFAULTS.TOKEN_EXPIRE_TIME) => {
  try {
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
    
    if (!result.success) {
      throw new Error(result.message || 'Failed to create token')
    }

    console.log('Token Başarılı:', result)
    return result.data // Return the entire data object (token, app_id, channel_name)
  } catch (error) {
    console.error('Failed to create token:', error)
    throw new Error('Failed to create token from server')
  }
} 