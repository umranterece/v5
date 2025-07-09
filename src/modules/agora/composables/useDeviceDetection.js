import { ref, onMounted } from 'vue'

/**
 * Cihaz Tespiti Composable - Kullanıcının cihaz türünü tespit eder ve ekran paylaşımı desteğini kontrol eder
 * Bu composable, mobil, tablet ve desktop cihazları ayırt eder ve ekran paylaşımı özelliğinin
 * desteklenip desteklenmediğini belirler.
 * @module composables/useDeviceDetection
 */
export function useDeviceDetection() {
  const isMobile = ref(false) // Mobil cihaz kontrolü
  const isTablet = ref(false) // Tablet cihaz kontrolü
  const isDesktop = ref(false) // Desktop cihaz kontrolü
  const supportsScreenShare = ref(false) // Ekran paylaşımı desteği kontrolü

  /**
   * Cihaz türünü tespit eder ve ekran paylaşımı desteğini kontrol eder
   * User agent string'ini analiz ederek cihaz türünü belirler
   */
  const detectDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
    const tabletKeywords = ['ipad', 'tablet', 'playbook']
    
    // Mobil cihaz tespiti - User agent'ta mobil anahtar kelimeleri arar
    isMobile.value = mobileKeywords.some(keyword => userAgent.includes(keyword))
    
    // Tablet cihaz tespiti - User agent'ta tablet anahtar kelimeleri arar
    isTablet.value = tabletKeywords.some(keyword => userAgent.includes(keyword))
    
    // Desktop cihaz tespiti - Mobil veya tablet değilse desktop olarak kabul eder
    isDesktop.value = !isMobile.value && !isTablet.value
    
    // Ekran paylaşımı desteği tespiti - Sadece desktop cihazlarda ve getDisplayMedia API'si desteklenen tarayıcılarda
    supportsScreenShare.value = isDesktop.value && 
      'getDisplayMedia' in navigator.mediaDevices &&
      !userAgent.includes('mobile') &&
      !userAgent.includes('android') &&
      !userAgent.includes('iphone') &&
      !userAgent.includes('ipad')
    
    console.log('Cihaz tespiti tamamlandı:', {
      isMobile: isMobile.value,
      isTablet: isTablet.value,
      isDesktop: isDesktop.value,
      supportsScreenShare: supportsScreenShare.value,
      userAgent: userAgent
    })
  }

  // Component mount olduğunda cihaz tespitini başlat
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