/**
 * Common Utility Functions
 * Bu dosya, tüm modül genelinde kullanılan utility fonksiyonları içerir.
 * @module utils/common
 */

/**
 * Güvenli timeout oluşturma helper'ı
 * Memory leak'leri önlemek için timeout'ları takip eder
 * @param {Function} callback - Çalıştırılacak fonksiyon
 * @param {number} delay - Gecikme süresi (ms)
 * @param {Set} activeTimeouts - Aktif timeout'ları takip eden Set
 * @returns {number} Timeout ID'si
 */
export const createSafeTimeout = (callback, delay, activeTimeouts) => {
  const timeoutId = setTimeout(() => {
    callback()
    if (activeTimeouts) {
      activeTimeouts.delete(timeoutId)
    }
  }, delay)
  
  if (activeTimeouts) {
    activeTimeouts.add(timeoutId)
  }
  
  return timeoutId
}

/**
 * Zaman formatı - Timestamp'i okunabilir formata çevirir
 * @param {number|string} timestamp - Timestamp
 * @returns {string} Formatlanmış zaman
 */
export const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

/**
 * Süre formatı - Saniyeyi MM:SS formatına çevirir
 * @param {number} seconds - Saniye cinsinden süre
 * @returns {string} Formatlanmış süre (MM:SS)
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Dosya boyutu formatı - Byte'ı okunabilir formata çevirir
 * @param {number} bytes - Byte cinsinden boyut
 * @returns {string} Formatlanmış dosya boyutu
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * Kullanıcı baş harflerini oluşturur
 * @param {string} name - Kullanıcı adı
 * @returns {string} Baş harfler (maksimum 2 karakter)
 */
export const getUserInitials = (name) => {
  if (!name) return 'U'
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Session ID oluşturur - Tarayıcı oturumu için benzersiz ID
 * @returns {string} Session ID
 */
export const generateSessionId = () => {
  if (!window.agoraSessionId) {
    window.agoraSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
  return window.agoraSessionId
}

/**
 * Debounce fonksiyonu - Hızlı çağrıları sınırlar
 * @param {Function} func - Çalıştırılacak fonksiyon
 * @param {number} wait - Bekleme süresi (ms)
 * @returns {Function} Debounced fonksiyon
 */
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle fonksiyonu - Fonksiyon çağrılarını belirli aralıklarla sınırlar
 * @param {Function} func - Çalıştırılacak fonksiyon
 * @param {number} limit - Sınır süresi (ms)
 * @returns {Function} Throttled fonksiyon
 */
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * String sanitize - HTML injection'ları önler
 * @param {string} str - Temizlenecek string
 * @returns {string} Temizlenmiş string
 */
export const sanitizeString = (str) => {
  if (!str) return ''
  
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * Email validasyonu
 * @param {string} email - Kontrol edilecek email
 * @returns {boolean} Geçerli email mi?
 */
export const isValidEmail = (email) => {
  if (!email) return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * URL validasyonu
 * @param {string} url - Kontrol edilecek URL
 * @returns {boolean} Geçerli URL mi?
 */
export const isValidUrl = (url) => {
  if (!url) return false
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Deep clone - Objeyi derin kopyalar
 * @param {*} obj - Kopyalanacak obje
 * @returns {*} Kopyalanmış obje
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * Random ID oluşturur
 * @param {number} length - ID uzunluğu
 * @returns {string} Random ID
 */
export const generateRandomId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
} 