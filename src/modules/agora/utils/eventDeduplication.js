import { ref } from 'vue'
import { centralEmitter } from './centralEmitter.js'
import { AGORA_EVENTS } from '../constants.js'
import { logger, LOG_CATEGORIES } from '../services/logger.js'

/**
 * Event Deduplication Utility
 * Aynı event'lerin birden fazla kez işlenmesini önler
 * Memory leak'leri önlemek için timeout sistemi kullanır
 * @module utils/eventDeduplication
 */

// Event işleme durumu - Her event'in sadece bir kez işlenmesini sağlar
const processedEvents = ref(new Set())

// Event deduplication için timeout'lar
const eventTimeouts = ref(new Map())

// Client kayıtları - Hangi client'ların kayıtlı olduğunu takip eder
const registeredClients = ref(new Map())

/**
 * Event'i benzersiz hale getiren key oluşturur
 * @param {string} eventType - Event türü
 * @param {Object} data - Event verisi
 * @returns {string} Benzersiz event key'i
 */
export const createEventKey = (eventType, data) => {
  if (eventType === AGORA_EVENTS.USER_JOINED || eventType === AGORA_EVENTS.USER_LEFT) {
    return `${eventType}-${data.uid}`
  } else if (eventType === AGORA_EVENTS.USER_PUBLISHED || eventType === AGORA_EVENTS.USER_UNPUBLISHED) {
    return `${eventType}-${data.user.uid}-${data.mediaType}`
  } else if (eventType === AGORA_EVENTS.CONNECTION_STATE_CHANGE) {
    return `${eventType}-${data.connected}`
  }
  return `${eventType}-${JSON.stringify(data)}`
}

/**
 * Event'i merkezi sisteme kaydeder
 * @param {string} eventType - Event türü
 * @param {Object} data - Event verisi
 * @param {string} clientType - Client türü (video/screen)
 * @returns {boolean} Event işlendi mi?
 */
export const registerEvent = (eventType, data, clientType) => {
  const eventKey = createEventKey(eventType, data)
  
  // Event zaten işlendiyse tekrar işleme
  if (processedEvents.value.has(eventKey)) {
    logger.info(LOG_CATEGORIES.VIDEO, `Event zaten işlendi, atlanıyor: ${eventKey} (${clientType})`)
    return false
  }
  
  // Event'i işlenmiş olarak işaretle
  processedEvents.value.add(eventKey)
  
  // 5 saniye sonra event'i temizle (memory leak önleme)
  if (eventTimeouts.value.has(eventKey)) {
    clearTimeout(eventTimeouts.value.get(eventKey))
  }
  eventTimeouts.value.set(eventKey, setTimeout(() => {
    processedEvents.value.delete(eventKey)
    eventTimeouts.value.delete(eventKey)
  }, 5000))
  
  logger.info(LOG_CATEGORIES.VIDEO, `Merkezi event sistemi: ${eventType} (${clientType}) - ${eventKey}`)
  
  // Event'i merkezi emitter'a gönder
  centralEmitter.emit(eventType, { ...data, clientType })
  return true
}

/**
 * Client'ı merkezi sisteme kaydeder (sadece tracking için)
 * @param {Object} client - Agora client
 * @param {string} clientType - Client türü (video/screen)
 * @param {Function} onUserJoined - Kullanıcı katılma callback'i
 * @param {Function} onUserLeft - Kullanıcı ayrılma callback'i
 * @param {Function} onUserPublished - Kullanıcı yayınlama callback'i
 * @param {Function} onUserUnpublished - Kullanıcı yayından kaldırma callback'i
 * @param {Function} onConnectionStateChange - Bağlantı durumu değişikliği callback'i
 */
export const registerClient = (
  client, 
  clientType, 
  onUserJoined = null,
  onUserLeft = null,
  onUserPublished = null,
  onUserUnpublished = null,
  onConnectionStateChange = null
) => {
  if (!client) return
  
  // Client'ı kaydet
  registeredClients.value.set(clientType, { 
    client, 
    onUserJoined,
    onUserLeft,
    onUserPublished,
    onUserUnpublished,
    onConnectionStateChange
  })
  
  // Sadece tracking için event'leri dinle (duplicate listener kurma)
  if (client.on) {
    // user-joined event'ini dinle
    client.on(AGORA_EVENTS.USER_JOINED, (user) => {
      logger.info(LOG_CATEGORIES.VIDEO, `Merkezi takip: kullanıcı katıldı (${clientType})`, { uid: user.uid })
      registerEvent(AGORA_EVENTS.USER_JOINED, user, clientType)
      if (onUserJoined) onUserJoined(user)
    })
    
    // user-left event'ini dinle
    client.on(AGORA_EVENTS.USER_LEFT, (user) => {
      logger.info(LOG_CATEGORIES.VIDEO, `Merkezi takip: kullanıcı ayrıldı (${clientType})`, { uid: user.uid })
      registerEvent(AGORA_EVENTS.USER_LEFT, user, clientType)
      if (onUserLeft) onUserLeft(user)
    })
    
    // user-published event'ini dinle
    client.on(AGORA_EVENTS.USER_PUBLISHED, (user, mediaType) => {
      logger.info(LOG_CATEGORIES.VIDEO, `Merkezi takip: kullanıcı yayınlandı (${clientType})`, { uid: user.uid, mediaType })
      registerEvent(AGORA_EVENTS.USER_PUBLISHED, { user, mediaType }, clientType)
      if (onUserPublished) onUserPublished(user, mediaType)
    })
    
    // user-unpublished event'ini dinle
    client.on(AGORA_EVENTS.USER_UNPUBLISHED, (user, mediaType) => {
      logger.info(LOG_CATEGORIES.VIDEO, `Merkezi takip: kullanıcı yayından kaldırıldı (${clientType})`, { uid: user.uid, mediaType })
      registerEvent(AGORA_EVENTS.USER_UNPUBLISHED, { user, mediaType }, clientType)
      if (onUserUnpublished) onUserUnpublished(user, mediaType)
    })
    
    // connection-state-change event'ini dinle
    client.on(AGORA_EVENTS.CONNECTION_STATE_CHANGE, (state) => {
      logger.info(LOG_CATEGORIES.VIDEO, `Merkezi takip: bağlantı durumu değişti (${clientType})`, { state })
      registerEvent(AGORA_EVENTS.CONNECTION_STATE_CHANGE, { connected: state === 'CONNECTED' }, clientType)
      if (onConnectionStateChange) onConnectionStateChange(state)
    })
  }
  
  logger.info(LOG_CATEGORIES.VIDEO, `Client merkezi takip için kaydedildi: ${clientType}`)
}

/**
 * Client'ı merkezi sistemden kaldırır
 * @param {string} clientType - Client türü (video/screen)
 */
export const unregisterClient = (clientType) => {
  const clientData = registeredClients.value.get(clientType)
  if (clientData) {
    // Client'ın event'lerini temizle
    if (clientData.client) {
      clientData.client.removeAllListeners()
    }
    registeredClients.value.delete(clientType)
    logger.info(LOG_CATEGORIES.VIDEO, `Client kaldırıldı: ${clientType}`)
  }
}

/**
 * Merkezi event sistemini temizler
 */
export const cleanupCentralEvents = () => {
  processedEvents.value.clear()
  eventTimeouts.value.forEach(timeout => clearTimeout(timeout))
  eventTimeouts.value.clear()
  registeredClients.value.clear()
  centralEmitter.all.clear()
  
  logger.info(LOG_CATEGORIES.VIDEO, 'Merkezi event sistemi temizlendi')
}

/**
 * Kayıtlı client'ları getirir
 * @returns {Map} Kayıtlı client'lar
 */
export const getRegisteredClients = () => {
  return registeredClients.value
}

/**
 * İşlenmiş event'leri getirir
 * @returns {Set} İşlenmiş event'ler
 */
export const getProcessedEvents = () => {
  return processedEvents.value
} 