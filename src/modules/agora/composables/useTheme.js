import { ref, watch } from 'vue'

/**
 * RS-Agora Tema Yönetimi Composable
 * Tema değiştirme ve yönetimi için kullanılır
 */
export function useTheme() {
  // Mevcut tema
  const currentTheme = ref(localStorage.getItem('rs-agora-theme') || 'default')
  
  // Mevcut temalar
  const availableThemes = [
    {
      id: 'default',
      name: 'Okyanus Derinliği',
      description: 'Mavi ve turkuaz tonları',
      icon: '🌊'
    },
    {
      id: 'sunset-warm',
      name: 'Gün Batımı',
      description: 'Sıcak turuncu ve altın tonları',
      icon: '🌅'
    },
    {
      id: 'forest-nature',
      name: 'Orman Doğası',
      description: 'Yeşil ve kahverengi tonları',
      icon: '🌲'
    },
    {
      id: 'cosmic-purple',
      name: 'Rehberim Sensin',
      description: 'Hafif mor ve pembe tonları',
      icon: '💜'
    },
    {
      id: 'neon-cyber',
      name: 'Neon Siber',
      description: 'Neon yeşil ve mavi tonları',
      icon: '🤖'
    },
    {
      id: 'light-modern',
      name: 'Açık Modern',
      description: 'Açık ve modern tonlar',
      icon: '☀️'
    },
    {
      id: 'aurora-borealis',
      name: 'Kuzey Işıkları',
      description: 'Kuzey ışıkları yeşil ve mavi tonları',
      icon: '🌌'
    },
    {
      id: 'desert-sunset',
      name: 'Çöl Gün Batımı',
      description: 'Çöl gün batımı turuncu ve kum sarısı',
      icon: '🏜️'
    },
    {
      id: 'ocean-depth',
      name: 'Derin Okyanus',
      description: 'Derin okyanus mavi ve deniz yeşili',
      icon: '🌊'
    },
    {
      id: 'mountain-mist',
      name: 'Dağ Sisi',
      description: 'Dağ sisi mavi ve gri tonları',
      icon: '🏔️'
    },
    {
      id: 'candy-dream',
      name: 'Şeker Rüyası',
      description: 'Şeker pembe ve mavi tonları',
      icon: '🍬'
    },
    {
      id: 'soft-pastel',
      name: 'Yumuşak Pastel',
      description: 'Yumuşak pastel mavi ve pembe tonları',
      icon: '🌸'
    },
    {
      id: 'warm-cream',
      name: 'Sıcak Krem',
      description: 'Sıcak krem kahve ve bej tonları',
      icon: '☕'
    },
    {
      id: 'logmodal-elegance',
      name: 'LogModal Zarafeti',
      description: 'LogModal\'dan esinlenen zarif mavi-mor tonları',
      icon: '✨'
    }
  ]

  /**
   * Temayı değiştir
   * @param {string} themeId - Tema ID'si
   */
  const setTheme = (themeId) => {
    if (!availableThemes.find(t => t.id === themeId)) {
      console.warn(`Tema bulunamadı: ${themeId}`)
      return
    }

    // HTML'e data-theme attribute'u ekle
    document.documentElement.setAttribute('data-theme', themeId)
    
    // Local storage'a kaydet
    localStorage.setItem('rs-agora-theme', themeId)
    
    // State'i güncelle
    currentTheme.value = themeId
    
    console.log(`Tema değiştirildi: ${themeId}`)
  }

  /**
   * Mevcut temayı al
   * @returns {string} Tema ID'si
   */
  const getCurrentTheme = () => currentTheme.value

  /**
   * Tema bilgilerini al
   * @param {string} themeId - Tema ID'si
   * @returns {Object} Tema bilgileri
   */
  const getThemeInfo = (themeId) => {
    return availableThemes.find(t => t.id === themeId) || availableThemes[0]
  }

  /**
   * Tüm temaları al
   * @returns {Array} Tema listesi
   */
  const getAllThemes = () => availableThemes

  /**
   * Varsayılan temaya dön
   */
  const resetToDefault = () => {
    setTheme('default')
  }

  /**
   * Tema önizlemesi yap (geçici olarak)
   * @param {string} themeId - Tema ID'si
   */
  const previewTheme = (themeId) => {
    if (!availableThemes.find(t => t.id === themeId)) return
    
    document.documentElement.setAttribute('data-theme', themeId)
  }

  /**
   * Tema önizlemesini iptal et
   */
  const cancelPreview = () => {
    document.documentElement.setAttribute('data-theme', currentTheme.value)
  }

  /**
   * Tema CSS variables'larını al
   * @param {string} themeId - Tema ID'si
   * @returns {Object} CSS variables
   */
  const getThemeVariables = (themeId) => {
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)
    
    const variables = {}
    const prefix = '--rs-agora-'
    
    // Tüm CSS variables'ları topla
    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i]
      if (property.startsWith(prefix)) {
        const key = property.replace(prefix, '')
        variables[key] = computedStyle.getPropertyValue(property).trim()
      }
    }
    
    return variables
  }

  /**
   * Custom tema oluştur
   * @param {Object} customColors - Özel renkler
   */
  const createCustomTheme = (customColors) => {
    const root = document.documentElement
    
    Object.entries(customColors).forEach(([key, value]) => {
      const cssVar = `--rs-agora-${key}`
      root.style.setProperty(cssVar, value)
    })
    
    console.log('Custom tema uygulandı:', customColors)
  }

  // Component mount olduğunda temayı uygula
  const initializeTheme = () => {
    setTheme(currentTheme.value)
  }

  // Tema değişikliklerini izle
  watch(currentTheme, (newTheme) => {
    setTheme(newTheme)
  })

  return {
    // State
    currentTheme,
    availableThemes,
    
    // Methods
    setTheme,
    getCurrentTheme,
    getThemeInfo,
    getAllThemes,
    resetToDefault,
    previewTheme,
    cancelPreview,
    getThemeVariables,
    createCustomTheme,
    initializeTheme
  }
}
