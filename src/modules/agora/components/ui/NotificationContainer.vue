<template>
  <div class="notification-container" :class="`position-${position}`">
    <TransitionGroup 
      name="notification" 
      tag="div"
      appear
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-for="notification in visibleNotifications"
        :key="notification.id"
        class="notification-item"
        :class="[
          `notification-${notification.type}`,
          `priority-${notification.priority}`,
          { 'notification-persistent': notification.persistent }
        ]"
        @click="handleNotificationClick(notification)"
        :style="getNotificationStyle(notification)"
      >
        <!-- Background Pattern -->
        <div class="notification-bg-pattern"></div>
        
        <!-- Icon Container -->
        <div class="notification-icon-container">
          <div class="notification-icon">
            <span v-if="notification.type === 'success'">✓</span>
            <span v-else-if="notification.type === 'warning'">⚠</span>
            <span v-else-if="notification.type === 'error'">✕</span>
            <span v-else-if="notification.type === 'info'">ℹ</span>
            <span v-else-if="notification.type === 'system'">⚙</span>
            <span v-else">📢</span>
          </div>
          <div class="notification-icon-ring"></div>
        </div>

        <!-- Content Container -->
        <div class="notification-content">
          <div class="notification-header">
            <div class="notification-title" v-if="notification.title">
              {{ notification.title }}
            </div>
            <div class="notification-timestamp">
              {{ formatTimestamp(notification.timestamp) }}
            </div>
          </div>
          
          <div class="notification-message" v-if="notification.message">
            {{ notification.message }}
          </div>
          
          <!-- Category Badge ve Actions Container -->
          <div class="notification-footer" v-if="notification.category || (notification.actions && notification.actions.length > 0)">
            <!-- Category Badge -->
            <div class="notification-category" v-if="notification.category">
              <span class="category-badge">{{ notification.category }}</span>
            </div>
            
            <!-- Actions Container -->
            <div class="notification-actions" v-if="notification.actions && notification.actions.length > 0">
              <button
                v-for="action in notification.actions"
                :key="action.label"
                class="notification-action-btn"
                @click.stop="handleActionClick(action, notification)"
              >
                <span class="action-icon" v-if="action.icon">{{ action.icon }}</span>
                {{ action.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Close Button -->
        <button
          class="notification-close"
          @click.stop="removeNotification(notification.id)"
          v-if="!notification.persistent"
          :title="'Kapat'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- Priority Indicator -->
        <div class="priority-indicator" v-if="notification.priority === 'critical'">
          <div class="priority-dot"></div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '../../store/index.js'
import { NOTIFICATION_POSITIONS } from '../../constants.js'

export default {
  name: 'NotificationContainer',
  props: {
    position: {
      type: String,
      default: NOTIFICATION_POSITIONS.TOP_RIGHT,
      validator: (value) => Object.values(NOTIFICATION_POSITIONS).includes(value)
    },
    maxVisible: {
      type: Number,
      default: 5
    }
  },
  setup(props) {
    const notificationStore = useNotificationStore()

    // Initialize store
    onMounted(() => {
      notificationStore.initialize()
    })

    // Cleanup on unmount
    onUnmounted(() => {
      notificationStore.cleanup()
    })

    // Computed
    const visibleNotifications = computed(() => {
      const notifications = notificationStore.visibleNotifications
      return notifications.slice(0, props.maxVisible)
    })

    // Methods
    const removeNotification = (id) => {
      notificationStore.remove(id)
    }

    const handleNotificationClick = (notification) => {
      if (notification.onClick) {
        notification.onClick(notification)
      }
    }

    const handleActionClick = (action, notification) => {
      if (action.action && typeof action.action === 'function') {
        action.action(notification)
      }
      
      // Close notification after action (unless persistent)
      if (!notification.persistent) {
        removeNotification(notification.id)
      }
    }

    const formatTimestamp = (timestamp) => {
      const now = Date.now()
      const diff = now - timestamp
      
      if (diff < 60000) return 'Az önce'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}d önce`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}s önce`
      
      return new Date(timestamp).toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }

    const getNotificationStyle = (notification) => {
      return {
        '--notification-delay': `${notification.timestamp % 1000}ms`
      }
    }

    const onEnter = (el) => {
      // Stagger animation
      const index = Array.from(el.parentNode.children).indexOf(el)
      el.style.animationDelay = `${index * 100}ms`
    }

    const onLeave = (el) => {
      // Smooth exit
      el.style.transition = 'all 0.3s ease'
    }

    return {
      visibleNotifications,
      removeNotification,
      handleNotificationClick,
      handleActionClick,
      formatTimestamp,
      getNotificationStyle,
      onEnter,
      onLeave
    }
  }
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  max-width: 420px;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Position Classes */
.position-top-right {
  top: 24px;
  right: 24px;
  margin-right: 0;
}

.position-top-left {
  top: 24px;
  left: 24px;
}

.position-bottom-right {
  bottom: 24px;
  right: 24px;
}

.position-bottom-left {
  bottom: 24px;
  left: 24px;
}

.position-top-center {
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
}

.position-bottom-center {
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
}

/* Notification Item */
.notification-item {
  pointer-events: all;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  margin-bottom: 16px;
  margin-right: 0;
  border-radius: var(--rs-agora-radius-xl);
  background: var(--rs-agora-surface-primary);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--rs-agora-border-primary);
  box-shadow: 
    0 8px 32px var(--rs-agora-transparent-black-12),
    0 4px 16px var(--rs-agora-transparent-black-08),
    inset 0 1px 0 var(--rs-agora-transparent-white-40);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: notificationSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  transform-origin: right center;
}

.notification-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 
    0 16px 48px var(--rs-agora-transparent-black-16),
    0 8px 24px var(--rs-agora-transparent-black-12),
    inset 0 1px 0 var(--rs-agora-transparent-white-60);
  border-radius: calc(var(--rs-agora-radius-xl) + 2px);
}

/* Background Pattern */
.notification-bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, var(--rs-agora-transparent-white-03) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, var(--rs-agora-transparent-white-03) 0%, transparent 50%);
  pointer-events: none;
}

/* Icon Container */
.notification-icon-container {
  position: relative;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-icon {
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
  z-index: 2;
  position: relative;
}

.notification-icon-ring {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--rs-agora-transparent-white-80), var(--rs-agora-transparent-white-40));
  opacity: 0.6;
}

/* Content */
.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.notification-title {
  font-weight: 700;
  font-size: 16px;
  line-height: 1.4;
  color: var(--rs-agora-text-primary);
  margin: 0;
}

.notification-timestamp {
  font-size: 12px;
  color: var(--rs-agora-text-muted);
  font-weight: 500;
  flex-shrink: 0;
  margin-left: 12px;
}

.notification-message {
  font-size: 14px;
  line-height: 1.5;
  color: var(--rs-agora-text-secondary);
  margin-bottom: 12px;
}

.notification-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  gap: 12px;
}

.notification-category {
  flex-shrink: 0;
}

.category-badge {
  display: inline-block;
  padding: 4px 8px;
  background: var(--rs-agora-transparent-black-06);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--rs-agora-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Close Button */
.notification-close {
  flex-shrink: 0;
  background: var(--rs-agora-transparent-black-06);
  border: none;
  color: var(--rs-agora-text-muted);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

.notification-close:hover {
  background: var(--rs-agora-transparent-black-12);
  color: var(--rs-agora-text-primary);
  transform: scale(1.1);
}

/* Actions */
.notification-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.notification-action-btn {
  background: var(--rs-agora-transparent-black-06);
  border: 1px solid var(--rs-agora-transparent-black-10);
  color: var(--rs-agora-text-primary);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.notification-action-btn:hover {
  background: var(--rs-agora-transparent-black-10);
  border-color: var(--rs-agora-transparent-black-20);
  transform: translateY(-1px);
}

.action-icon {
  font-size: 12px;
}

/* Priority Indicator */
.priority-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--rs-agora-error);
  animation: pulse-critical 2s infinite;
}

@keyframes pulse-critical {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.2);
  }
}

/* Notification Types */
.notification-success .notification-icon {
  color: var(--rs-agora-success);
}

.notification-success .notification-icon-ring {
  background: linear-gradient(135deg, var(--rs-agora-transparent-success-10), var(--rs-agora-transparent-success-05));
}

.notification-warning .notification-icon {
  color: var(--rs-agora-warning);
}

.notification-warning .notification-icon-ring {
  background: linear-gradient(135deg, var(--rs-agora-transparent-warning-10), var(--rs-agora-transparent-warning-05));
}

.notification-error .notification-icon {
  color: var(--rs-agora-error);
}

.notification-error .notification-icon-ring {
  background: linear-gradient(135deg, var(--rs-agora-transparent-error-10), var(--rs-agora-transparent-error-05));
}

.notification-info .notification-icon {
  color: var(--rs-agora-info);
}

.notification-info .notification-icon-ring {
  background: linear-gradient(135deg, var(--rs-agora-transparent-info-10), var(--rs-agora-transparent-info-05));
}

.notification-system .notification-icon {
  color: var(--rs-agora-gray-500);
}

.notification-system .notification-icon-ring {
  background: linear-gradient(135deg, var(--rs-agora-transparent-gray-10), var(--rs-agora-transparent-gray-05));
}

/* Priority Styles */
.priority-critical {
  border-left: 4px solid var(--rs-agora-error);
  background: linear-gradient(135deg, var(--rs-agora-surface-primary), var(--rs-agora-transparent-error-05));
}

.priority-high {
  border-left: 4px solid var(--rs-agora-warning);
}

.priority-normal {
  border-left: 4px solid var(--rs-agora-primary);
}

.priority-low {
  border-left: 4px solid var(--rs-agora-success);
}

/* Persistent Style */
.notification-persistent {
  border-left: 4px solid var(--rs-agora-secondary);
  background: linear-gradient(135deg, var(--rs-agora-surface-primary), var(--rs-agora-transparent-secondary-05));
}

/* Animations */
@keyframes notificationSlideIn {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
    border-radius: var(--rs-agora-radius-xl) 0 0 var(--rs-agora-radius-xl);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
    border-radius: var(--rs-agora-radius-xl);
  }
}

/* Transitions */
.notification-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
  border-radius: var(--rs-agora-radius-xl) 0 0 var(--rs-agora-radius-xl);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
  border-radius: var(--rs-agora-radius-xl) 0 0 var(--rs-agora-radius-xl);
}

.notification-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive */
@media (max-width: 640px) {
  .notification-container {
    left: 16px;
    right: 16px;
    max-width: none;
  }
  
  .position-top-right,
  .position-bottom-right {
    right: 16px;
    margin-right: 0;
  }
  
  .position-top-left,
  .position-bottom-left {
    left: 16px;
    margin-left: 0;
  }
  
  .position-top-center,
  .position-bottom-center {
    transform: none;
    left: 16px;
    right: 16px;
  }
  
  .notification-item {
    padding: 16px;
    margin-bottom: 12px;
    margin-right: 0;
    margin-left: 0;
    width: calc(100% - 32px);
    max-width: none;
  }
  
  .notification-icon-container {
    width: 40px;
    height: 40px;
  }
  
  .notification-title {
    font-size: 15px;
  }
  
  .notification-message {
    font-size: 13px;
  }
  
  .notification-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .notification-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .notification-action-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
}

/* Dark Mode Support - Artık tema sistemi ile otomatik olarak çalışacak */
/* Bu kısım artık gerekli değil çünkü tema sistemi ile otomatik olarak değişiyor */
</style>
