import { ref } from 'vue'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { VIDEO_CONFIG, AUDIO_CONFIG } from '../constants.js'

/**
 * Track Management Composable - Track oluşturma ve yönetimi
 * @module composables/useTrackManagement
 */
export function useTrackManagement() {
  // Helper function to check if track is valid and enabled
  const isTrackValid = (track) => {
    return track && 
           typeof track.setEnabled === 'function' && 
           typeof track.play === 'function' &&
           !track._closed &&
           track.readyState !== 'ended' &&
           track.readyState !== 'failed'
  }

  // Create audio track
  const createAudioTrack = async () => {
    try {
      let audioTrack = await AgoraRTC.createMicrophoneAudioTrack(AUDIO_CONFIG)
      
      if (isTrackValid(audioTrack)) {
        return { success: true, track: audioTrack }
      } else {
        throw new Error('Invalid audio track')
      }
    } catch (error) {
      console.warn('Failed with default audio config, trying basic config:', error)
      try {
        audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: 'music_standard',
          gain: 1.0
        })
        
        if (isTrackValid(audioTrack)) {
          return { success: true, track: audioTrack }
        } else {
          throw new Error('Invalid audio track')
        }
      } catch (fallbackError) {
        return { success: false, error: fallbackError }
      }
    }
  }

  // Create video track
  const createVideoTrack = async () => {
    try {
      let videoTrack = await AgoraRTC.createCameraVideoTrack(VIDEO_CONFIG)
      
      if (isTrackValid(videoTrack)) {
        return { success: true, track: videoTrack }
      } else {
        throw new Error('Invalid video track')
      }
    } catch (error) {
      console.warn('Failed with default config, trying basic config:', error)
      try {
        videoTrack = await AgoraRTC.createCameraVideoTrack({
          facingMode: 'user'
        })
        
        if (isTrackValid(videoTrack)) {
          return { success: true, track: videoTrack }
        } else {
          throw new Error('Invalid video track')
        }
      } catch (fallbackError) {
        return { success: false, error: fallbackError }
      }
    }
  }

  // Create screen share track
  const createScreenTrack = async () => {
    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack({
        encoderConfig: '720p_1',
        optimizationMode: 'motion',
        bitrateMin: 1000,
        bitrateMax: 3000
      })
      
      if (isTrackValid(screenTrack)) {
        return { success: true, track: screenTrack }
      } else {
        throw new Error('Invalid screen track')
      }
    } catch (error) {
      return { success: false, error }
    }
  }

  // Stop and cleanup track
  const cleanupTrack = (track) => {
    if (track && isTrackValid(track)) {
      try {
        track.stop()
        track.close()
      } catch (error) {
        console.warn('Failed to cleanup track:', error)
      }
    }
  }

  return {
    isTrackValid,
    createAudioTrack,
    createVideoTrack,
    createScreenTrack,
    cleanupTrack
  }
} 