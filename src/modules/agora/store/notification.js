/**
 * Notification Store
 * Pinia store ile notification state management
 * Reactive notification state ve actions
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  notificationService,
  addNotification,
  removeNotification,
  clearNotifications,
  getNotifications,
  getNotificationCount,
  subscribe,
  unsubscribe
} from '../services/notificationService.js'
import { 
  NOTIFICATION_TYPES, 
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CATEGORIES 
} from '../constants.js'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref([])
  const isSubscribed = ref(false)

  // Getters
  const visibleNotifications = computed(() => 
    notifications.value.filter(n => n.isVisible && !n.isDismissed)
  )

  const notificationCount = computed(() => visibleNotifications.value.length)

  const notificationsByType = computed(() => {
    const grouped = {}
    Object.values(NOTIFICATION_TYPES).forEach(type => {
      grouped[type] = notifications.value.filter(n => n.type === type)
    })
    return grouped
  })

  const notificationsByCategory = computed(() => {
    const grouped = {}
    Object.values(NOTIFICATION_CATEGORIES).forEach(category => {
      grouped[category] = notifications.value.filter(n => n.category === category)
    })
    return grouped
  })

  const criticalNotifications = computed(() => 
    notifications.value.filter(n => n.priority === NOTIFICATION_PRIORITIES.CRITICAL)
  )

  const errorNotifications = computed(() => 
    notifications.value.filter(n => n.type === NOTIFICATION_TYPES.ERROR)
  )

  const warningNotifications = computed(() => 
    notifications.value.filter(n => n.type === NOTIFICATION_TYPES.WARNING)
  )

  const successNotifications = computed(() => 
    notifications.value.filter(n => n.type === NOTIFICATION_TYPES.SUCCESS)
  )

  const infoNotifications = computed(() => 
    notifications.value.filter(n => n.type === NOTIFICATION_TYPES.INFO)
  )

  // Actions
  const initialize = () => {
    if (!isSubscribed.value) {
      subscribe(updateNotifications)
      isSubscribed.value = true
    }
  }

  const updateNotifications = (newNotifications) => {
    notifications.value = newNotifications
  }

  const add = (options) => {
    return addNotification(options)
  }

  const remove = (id) => {
    removeNotification(id)
  }

  const clear = (category = null) => {
    clearNotifications(category)
  }

  const get = (filters = {}) => {
    return getNotifications(filters)
  }

  const count = (filters = {}) => {
    return getNotificationCount(filters)
  }

  // Convenience methods
  const success = (title, message = '', options = {}) => {
    return add({
      type: NOTIFICATION_TYPES.SUCCESS,
      title,
      message,
      ...options
    })
  }

  const warning = (title, message = '', options = {}) => {
    return add({
      type: NOTIFICATION_TYPES.WARNING,
      title,
      message,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      ...options
    })
  }

  const error = (title, message = '', options = {}) => {
    return add({
      type: NOTIFICATION_TYPES.ERROR,
      title,
      message,
      priority: NOTIFICATION_PRIORITIES.CRITICAL,
      ...options
    })
  }

  const info = (title, message = '', options = {}) => {
    return add({
      type: NOTIFICATION_TYPES.INFO,
      title,
      message,
      ...options
    })
  }

  const system = (title, message = '', options = {}) => {
    return add({
      type: NOTIFICATION_TYPES.SYSTEM,
      title,
      message,
      category: NOTIFICATION_CATEGORIES.SYSTEM,
      ...options
    })
  }

  const cleanup = () => {
    if (isSubscribed.value) {
      unsubscribe(updateNotifications)
      isSubscribed.value = false
    }
    notifications.value = []
  }

  return {
    // State
    notifications,
    isSubscribed,
    
    // Getters
    visibleNotifications,
    notificationCount,
    notificationsByType,
    notificationsByCategory,
    criticalNotifications,
    errorNotifications,
    warningNotifications,
    successNotifications,
    infoNotifications,
    
    // Actions
    initialize,
    updateNotifications,
    add,
    remove,
    clear,
    get,
    count,
    
    // Convenience methods
    success,
    warning,
    error,
    info,
    system,
    cleanup
  }
})
