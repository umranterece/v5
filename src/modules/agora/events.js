/**
 * Agora Event Definitions using Mitt
 */

import mitt from 'mitt'

// Create global event emitter
export const emitter = mitt()

// Event Types
export const AGORA_EVENTS = {
  // Connection Events
  CLIENT_INITIALIZED: 'client-initialized',
  CLIENT_INIT_ERROR: 'client-init-error',
  
  // Channel Events
  CHANNEL_JOINED: 'channel-joined',
  CHANNEL_LEFT: 'channel-left',
  JOIN_ERROR: 'join-error',
  LEAVE_ERROR: 'leave-error',
  
  // Local Track Events
  LOCAL_AUDIO_READY: 'local-audio-ready',
  LOCAL_VIDEO_READY: 'local-video-ready',
  LOCAL_AUDIO_ERROR: 'local-audio-error',
  LOCAL_VIDEO_ERROR: 'local-video-error',
  
  // Remote Track Events
  REMOTE_AUDIO_READY: 'remote-audio-ready',
  REMOTE_VIDEO_READY: 'remote-video-ready',
  REMOTE_TRACK_REMOVED: 'remote-track-removed',
  
  // User Events
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  
  // Connection State Events
  CONNECTION_STATE_CHANGE: 'connection-state-change',
  NETWORK_QUALITY: 'network-quality',
  
  // Track Events
  TRACKS_PUBLISHED: 'tracks-published',
  SUBSCRIBE_ERROR: 'subscribe-error',
  CREATE_TRACKS_ERROR: 'create-tracks-error',
  
  // Device Events
  DEVICE_STATUS_CHANGE: 'device-status-change',
  DEVICE_PERMISSION_CHANGE: 'device-permission-change',
  
  // Control Events
  CAMERA_TOGGLED: 'camera-toggled',
  MICROPHONE_TOGGLED: 'microphone-toggled',
  
  // General Events
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// Event Emitter Functions
export const emitEvent = (event, data) => {
  emitter.emit(event, data)
}

export const onEvent = (event, handler) => {
  emitter.on(event, handler)
}

export const offEvent = (event, handler) => {
  emitter.off(event, handler)
}

// Convenience Functions
export const emitError = (error) => {
  emitEvent(AGORA_EVENTS.ERROR, error)
}

export const emitWarning = (warning) => {
  emitEvent(AGORA_EVENTS.WARNING, warning)
}

export const emitInfo = (info) => {
  emitEvent(AGORA_EVENTS.INFO, info)
}

// Export everything
export default {
  emitter,
  AGORA_EVENTS,
  emitEvent,
  onEvent,
  offEvent,
  emitError,
  emitWarning,
  emitInfo
} 