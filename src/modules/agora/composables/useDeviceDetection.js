import { ref, onMounted } from 'vue'

/**
 * Device Detection Composable - Cihaz türünü tespit eder
 * @module composables/useDeviceDetection
 */
export function useDeviceDetection() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)
  const supportsScreenShare = ref(false)

  const detectDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
    const tabletKeywords = ['ipad', 'tablet', 'playbook']
    
    // Mobil tespiti
    isMobile.value = mobileKeywords.some(keyword => userAgent.includes(keyword))
    
    // Tablet tespiti
    isTablet.value = tabletKeywords.some(keyword => userAgent.includes(keyword))
    
    // Desktop tespiti
    isDesktop.value = !isMobile.value && !isTablet.value
    
    // Screen share desteği tespiti
    supportsScreenShare.value = isDesktop.value && 
      'getDisplayMedia' in navigator.mediaDevices &&
      !userAgent.includes('mobile') &&
      !userAgent.includes('android') &&
      !userAgent.includes('iphone') &&
      !userAgent.includes('ipad')
    
    console.log('Device detection:', {
      isMobile: isMobile.value,
      isTablet: isTablet.value,
      isDesktop: isDesktop.value,
      supportsScreenShare: supportsScreenShare.value,
      userAgent: userAgent
    })
  }

  onMounted(() => {
    detectDevice()
  })

  return {
    isMobile,
    isTablet,
    isDesktop,
    supportsScreenShare,
    detectDevice
  }
} 