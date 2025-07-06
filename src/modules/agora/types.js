/**
 * Agora Module Type Definitions
 */

// User Types
export const USER_TYPES = {
  LOCAL: 'local',
  REMOTE: 'remote'
}

// Track Types
export const TRACK_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video'
}

// Connection States
export const CONNECTION_STATES = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  RECONNECTING: 'RECONNECTING',
  ABORTED: 'ABORTED'
}

// Network Quality Levels
export const NETWORK_QUALITY = {
  UNKNOWN: 0,
  EXCELLENT: 1,
  GOOD: 2,
  POOR: 3,
  BAD: 4,
  VERY_BAD: 5,
  DOWN: 6
}

// Device Types
export const DEVICE_TYPES = {
  AUDIO_INPUT: 'audioinput',
  AUDIO_OUTPUT: 'audiooutput',
  VIDEO_INPUT: 'videoinput'
}

// Permission States
export const PERMISSION_STATES = {
  GRANTED: 'granted',
  DENIED: 'denied',
  PROMPT: 'prompt'
}

// Media Types
export const MEDIA_TYPES = {
  AUDIO: 'audio',
  VIDEO: 'video'
}

// Event Types
export const EVENT_TYPES = {
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  LOCAL_AUDIO_READY: 'local-audio-ready',
  LOCAL_VIDEO_READY: 'local-video-ready',
  REMOTE_AUDIO_READY: 'remote-audio-ready',
  REMOTE_VIDEO_READY: 'remote-video-ready',
  CONNECTION_STATE_CHANGE: 'connection-state-change'
}

// Default Values
export const DEFAULT_VALUES = {
  USER_NAME: 'User',
  CHANNEL_NAME: 'test-channel',
  UID_MIN: 10000,
  UID_MAX: 100000
}

/**
 * Type Definitions (JSDoc for documentation)
 * 
 * @typedef {Object} User
 * @property {number|string} uid - User ID
 * @property {string} name - User name
 * @property {boolean} isLocal - Whether user is local
 * @property {boolean} hasVideo - Whether user has video
 * @property {boolean} hasAudio - Whether user has audio
 * @property {boolean} isMuted - Whether user is muted
 * @property {boolean} isVideoOff - Whether user video is off
 * @property {number} [networkQuality] - Network quality level
 * 
 * @typedef {Object} Track
 * @property {boolean} enabled - Whether track is enabled
 * @property {boolean} muted - Whether track is muted
 * @property {string} id - Track ID
 * @property {string} kind - Track kind (audio/video)
 * @property {string} label - Track label
 * @property {string} readyState - Track ready state
 * 
 * @typedef {Object} LocalTracks
 * @property {Track|null} audio - Audio track
 * @property {Track|null} video - Video track
 * 
 * @typedef {Object} RemoteTracks
 * @property {Object.<string, {audio?: Track, video?: Track}>} [uid] - Remote tracks by UID
 * 
 * @typedef {Object} JoinConfig
 * @property {string} appId - Agora App ID
 * @property {string} token - User token
 * @property {string} channelName - Channel name
 * @property {number|string} uid - User ID
 * @property {string} [userName] - User name
 */

 