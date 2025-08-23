/**
 * Customer Notification Service
 * Merkezi notification yönetimi için profesyonel servis
 * Tüm modüllerde kullanılabilir, tutarlı notification deneyimi
 */

import { 
  NOTIFICATION_TYPES, 
  NOTIFICATION_PRIORITIES, 
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_CATEGORIES 
} from '../constants.js'

class NotificationService {
  constructor() {
    this.notifications = []
    this.subscribers = new Set()
    this.config = { ...NOTIFICATION_DEFAULTS }
    this.notificationId = 0
    
    // Duplicate prevention sistemi
    this.duplicateTracker = new Map() // key -> { count, lastShown, firstShown }
    this.duplicateConfig = {
      enabled: true,
      timeWindow: 60000, // 1 dakika (test için uzun)
      maxDuplicates: 1, // Maksimum 1 tekrar (test için agresif)
      mergeStrategy: 'count' // 'count', 'replace', 'ignore'
    }
  }

  /**
   * Notification ekle
   * @param {Object} options - Notification seçenekleri
   * @returns {string} Notification ID
   */
  addNotification(options) {
    try {
      // Duplicate kontrolü
      const duplicateKey = this.generateDuplicateKey(options)
      const duplicateInfo = this.checkDuplicate(duplicateKey, options)
      
      if (duplicateInfo.shouldBlock) {
        return duplicateInfo.existingId || null
      }
      
      const notification = this.createNotification(options)
      
      // Duplicate bilgisini ekle
      notification.duplicateKey = duplicateKey
      if (duplicateInfo.isDuplicate) {
        notification.duplicateCount = duplicateInfo.count
        notification.duplicateInfo = duplicateInfo
      }
      
      // Notification'ı listeye ekle
      this.notifications.push(notification)
      
      // Maksimum notification sayısını kontrol et
      this.enforceMaxNotifications()
      
      // Subscriber'lara bildir
      this.notifySubscribers()
      
      // Auto-dismiss ayarla
      if (notification.autoDismiss) {
        this.scheduleAutoDismiss(notification.id)
      }
      
      // Duplicate tracker'ı güncelle
      this.updateDuplicateTracker(duplicateKey, notification.id)
      
      return notification.id
      
    } catch (error) {
      throw error
    }
  }

  /**
   * Notification oluştur
   * @param {Object} options - Notification seçenekleri
   * @returns {Object} Notification objesi
   */
  createNotification(options) {
    const {
      type = NOTIFICATION_TYPES.INFO,
      title = '',
      message = '',
      category = NOTIFICATION_CATEGORIES.SYSTEM,
      priority = NOTIFICATION_PRIORITIES.NORMAL,
      position = this.config.POSITION,
      autoDismiss = this.config.AUTO_DISMISS,
      autoDismissDelay = this.config.AUTO_DISMISS_DELAY,
      actions = [],
      metadata = {},
      persistent = false
    } = options

    // Validation
    if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
      throw new Error(`Invalid notification type: ${type}`)
    }

    if (!Object.values(NOTIFICATION_PRIORITIES).includes(priority)) {
      throw new Error(`Invalid notification priority: ${priority}`)
    }

    if (!Object.values(NOTIFICATION_CATEGORIES).includes(category)) {
      throw new Error(`Invalid notification category: ${category}`)
    }

    const notification = {
      id: this.generateNotificationId(),
      type,
      title,
      message,
      category,
      priority,
      position,
      autoDismiss,
      autoDismissDelay,
      actions,
      metadata,
      persistent,
      timestamp: Date.now(),
      isVisible: true,
      isDismissed: false
    }

    return notification
  }

  /**
   * Success notification ekle
   * @param {string} title - Başlık
   * @param {string} message - Mesaj
   * @param {Object} options - Ek seçenekler
   */
  success(title, message = '', options = {}) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      title,
      message,
      ...options
    })
  }

  /**
   * Warning notification ekle
   * @param {string} title - Başlık
   * @param {string} message - Mesaj
   * @param {Object} options - Ek seçenekler
   */
  warning(title, message = '', options = {}) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      title,
      message,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      ...options
    })
  }

  /**
   * Error notification ekle
   * @param {string} title - Başlık
   * @param {string} message - Mesaj
   * @param {Object} options - Ek seçenekler
   */
  error(title, message = '', options = {}) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title,
      message,
      priority: NOTIFICATION_PRIORITIES.CRITICAL,
      ...options
    })
  }

  /**
   * Info notification ekle
   * @param {string} title - Başlık
   * @param {string} message - Mesaj
   * @param {Object} options - Ek seçenekler
   */
  info(title, message = '', options = {}) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.INFO,
      title,
      message,
      ...options
    })
  }

  /**
   * System notification ekle
   * @param {string} title - Başlık
   * @param {string} message - Mesaj
   * @param {Object} options - Ek seçenekler
   */
  system(title, message = '', options = {}) {
    return this.addNotification({
      type: NOTIFICATION_TYPES.SYSTEM,
      title,
      message,
      category: NOTIFICATION_CATEGORIES.SYSTEM,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      ...options
    })
  }

  /**
   * Notification'ı kaldır
   * @param {string} id - Notification ID
   */
  removeNotification(id) {
    try {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index !== -1) {
        const notification = this.notifications[index]
        notification.isDismissed = true
        notification.isVisible = false
        
        // Notification'ı listeden kaldır
        this.notifications.splice(index, 1)
        
        // Subscriber'lara bildir
        this.notifySubscribers()
      }
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Tüm notification'ları temizle
   * @param {string} category - Sadece belirli kategoriyi temizle (opsiyonel)
   */
  clearNotifications(category = null) {
    try {
      if (category) {
        this.notifications = this.notifications.filter(n => n.category !== category)
      } else {
        this.notifications = []
      }
      
      this.notifySubscribers()
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Notification'ları getir
   * @param {Object} filters - Filtre seçenekleri
   * @returns {Array} Filtrelenmiş notification'lar
   */
  getNotifications(filters = {}) {
    try {
      let filtered = [...this.notifications]

      // Type filter
      if (filters.type) {
        filtered = filtered.filter(n => n.type === filters.type)
      }

      // Category filter
      if (filters.category) {
        filtered = filtered.filter(n => n.category === filters.category)
      }

      // Priority filter
      if (filters.priority) {
        filtered = filtered.filter(n => n.priority === filters.priority)
      }

      // Visible filter
      if (filters.visible !== undefined) {
        filtered = filtered.filter(n => n.isVisible === filters.visible)
      }

      // Sort by priority and timestamp
      filtered.sort((a, b) => {
        const priorityOrder = {
          [NOTIFICATION_PRIORITIES.CRITICAL]: 4,
          [NOTIFICATION_PRIORITIES.HIGH]: 3,
          [NOTIFICATION_PRIORITIES.NORMAL]: 2,
          [NOTIFICATION_PRIORITIES.LOW]: 1
        }
        
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        
        return b.timestamp - a.timestamp
      })

      return filtered
    } catch (error) {
      return []
    }
  }

  /**
   * Notification sayısını getir
   * @param {Object} filters - Filtre seçenekleri
   * @returns {number} Notification sayısı
   */
  getNotificationCount(filters = {}) {
    return this.getNotifications(filters).length
  }

  /**
   * Subscriber ekle
   * @param {Function} callback - Callback fonksiyonu
   */
  subscribe(callback) {
    this.subscribers.add(callback)
  }

  /**
   * Subscriber kaldır
   * @param {Function} callback - Callback fonksiyonu
   */
  unsubscribe(callback) {
    this.subscribers.delete(callback)
  }

  /**
   * Subscriber'lara bildir
   */
  notifySubscribers() {
    try {
      const notifications = this.getNotifications()
      this.subscribers.forEach(callback => {
        try {
          callback(notifications)
        } catch (error) {
          // Silent error handling
        }
      })
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Maksimum notification sayısını kontrol et
   */
  enforceMaxNotifications() {
    if (this.notifications.length > this.config.MAX_NOTIFICATIONS) {
      // En eski notification'ları kaldır
      const toRemove = this.notifications.length - this.config.MAX_NOTIFICATIONS
      this.notifications.splice(0, toRemove)
    }
  }

  /**
   * Auto-dismiss zamanlayıcısı
   * @param {string} id - Notification ID
   */
  scheduleAutoDismiss(id) {
    const notification = this.notifications.find(n => n.id === id)
    if (notification && notification.autoDismiss) {
      setTimeout(() => {
        this.removeNotification(id)
      }, notification.autoDismissDelay)
    }
  }

  /**
   * Notification ID oluştur
   * @returns {string} Unique ID
   */
  generateNotificationId() {
    return `notification_${Date.now()}_${++this.notificationId}`
  }

  /**
   * Konfigürasyon güncelle
   * @param {Object} newConfig - Yeni konfigürasyon
   */
  updateConfig(newConfig) {
    try {
      this.config = { ...this.config, ...newConfig }
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Duplicate key oluştur
   * @param {Object} options - Notification seçenekleri
   * @returns {string} Duplicate key
   */
  generateDuplicateKey(options) {
    const { type, title, message, category, metadata } = options
    
    // Metadata'da özel duplicate key varsa onu kullan
    if (metadata && metadata.duplicateKey) {
      return metadata.duplicateKey
    }
    
    // Yoksa normal key oluştur
    return `${type}:${title}:${message}:${category}`.toLowerCase().trim()
  }

  /**
   * Duplicate kontrolü yap
   * @param {string} duplicateKey - Duplicate key
   * @param {Object} options - Notification seçenekleri
   * @returns {Object} Duplicate bilgisi
   */
  checkDuplicate(duplicateKey, options) {
    if (!this.duplicateConfig.enabled) {
      return { shouldBlock: false, isDuplicate: false, count: 0 }
    }

    const now = Date.now()
    const existing = this.duplicateTracker.get(duplicateKey)
    
    if (!existing) {
      return { shouldBlock: false, isDuplicate: false, count: 0 }
    }

    const timeDiff = now - existing.lastShown
    
    // Zaman penceresi dışındaysa yeni notification
    if (timeDiff > this.duplicateConfig.timeWindow) {
      return { shouldBlock: false, isDuplicate: false, count: 0 }
    }

    // Maksimum tekrar sayısını aştıysa engelle
    if (existing.count >= this.duplicateConfig.maxDuplicates) {
      return { 
        shouldBlock: true, 
        reason: 'max_duplicates_reached',
        existingId: existing.notificationId,
        count: existing.count
      }
    }

    // Duplicate notification - count artır
    return { 
      shouldBlock: false, 
      isDuplicate: true, 
      count: existing.count + 1,
      reason: 'duplicate_within_timewindow'
    }
  }

  /**
   * Duplicate tracker'ı güncelle
   * @param {string} duplicateKey - Duplicate key
   * @param {string} notificationId - Notification ID
   */
  updateDuplicateTracker(duplicateKey, notificationId) {
    const now = Date.now()
    const existing = this.duplicateTracker.get(duplicateKey)
    
    if (existing) {
      existing.count += 1
      existing.lastShown = now
      existing.notificationId = notificationId
    } else {
      this.duplicateTracker.set(duplicateKey, {
        count: 1,
        firstShown: now,
        lastShown: now,
        notificationId: notificationId
      })
    }
  }

  /**
   * Duplicate config güncelle
   * @param {Object} newConfig - Yeni duplicate config
   */
  updateDuplicateConfig(newConfig) {
    try {
      this.duplicateConfig = { ...this.duplicateConfig, ...newConfig }
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Duplicate tracker'ı temizle
   * @param {string} duplicateKey - Belirli key'i temizle (opsiyonel)
   */
  clearDuplicateTracker(duplicateKey = null) {
    try {
      if (duplicateKey) {
        this.duplicateTracker.delete(duplicateKey)
      } else {
        this.duplicateTracker.clear()
      }
    } catch (error) {
      // Silent error handling
    }
  }

  /**
   * Servisi temizle
   */
  cleanup() {
    try {
      this.notifications = []
      this.subscribers.clear()
    } catch (error) {
      // Silent error handling
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService()

// Convenience functions - Direct exports
export const addNotification = (...args) => notificationService.addNotification(...args)
export const success = (...args) => notificationService.success(...args)
export const warning = (...args) => notificationService.warning(...args)
export const error = (...args) => notificationService.error(...args)
export const info = (...args) => notificationService.info(...args)
export const system = (...args) => notificationService.system(...args)
export const removeNotification = (...args) => notificationService.removeNotification(...args)
export const clearNotifications = (...args) => notificationService.clearNotifications(...args)
export const getNotifications = (...args) => notificationService.getNotifications(...args)
export const getNotificationCount = (...args) => notificationService.getNotificationCount(...args)
export const subscribe = (...args) => notificationService.subscribe(...args)
export const unsubscribe = (...args) => notificationService.unsubscribe(...args)
export const updateConfig = (...args) => notificationService.updateConfig(...args)
export const cleanup = (...args) => notificationService.cleanup(...args)

// Duplicate prevention fonksiyonları
export const updateDuplicateConfig = (...args) => notificationService.updateDuplicateConfig(...args)
export const clearDuplicateTracker = (...args) => notificationService.clearDuplicateTracker(...args)

// Notification Helper Fonksiyonları 🔔
// Tıpkı logger gibi tek import ile kullanılabilir
export const notification = {
  // Temel notification fonksiyonları
  success: (title, message = '', options = {}) => notificationService.success(title, message, options),
  warning: (title, message = '', options = {}) => notificationService.warning(title, message, options),
  error: (title, message = '', options = {}) => notificationService.error(title, message, options),
  info: (title, message = '', options = {}) => notificationService.info(title, message, options),
  system: (title, message = '', options = {}) => notificationService.system(title, message, options),
  
  // Generic show metodu - template ile notification gösterme
  show: (template) => {
    const { type, title, message, options = {} } = template
    
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return notificationService.success(title, message, options)
      case NOTIFICATION_TYPES.WARNING:
        return notificationService.warning(title, message, options)
      case NOTIFICATION_TYPES.ERROR:
        return notificationService.error(title, message, options)
      case NOTIFICATION_TYPES.INFO:
        return notificationService.info(title, message, options)
      case NOTIFICATION_TYPES.SYSTEM:
        return notificationService.system(title, message, options)
      default:
        return notificationService.info(title, message, options)
    }
  },
  
  // Utility fonksiyonları
  remove: (id) => notificationService.removeNotification(id),
  clear: (category = null) => notificationService.clearNotifications(category),
  get: (filters = {}) => notificationService.getNotifications(filters),
  count: (filters = {}) => notificationService.getNotificationCount(filters),
  
  // Konfigürasyon
  config: (newConfig) => notificationService.updateConfig(newConfig),
  
  // Duplicate prevention
  duplicateConfig: (newConfig) => notificationService.updateDuplicateConfig(newConfig),
  clearDuplicates: (key = null) => notificationService.clearDuplicateTracker(key),
  
  // Cleanup
  cleanup: () => notificationService.cleanup()
}
