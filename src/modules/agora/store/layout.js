import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  // State
  const currentLayout = ref('grid')
  const isLayoutMenuOpen = ref(false)

  // Layout configurations
  const layoutConfig = ref({
    grid: {
      id: 'grid',
      name: 'Grid Görünümü',
      icon: '🔲',
      description: 'Tüm katılımcıları eşit boyutta göster',
      category: 'standard'
    },
    spotlight: {
      id: 'spotlight',
      name: 'Spotlight Görünümü',
      icon: '🎯',
      description: 'Aktif konuşmacıyı büyük göster',
      category: 'focus'
    },
    presentation: {
      id: 'presentation',
      name: 'Sunum Modu',
      icon: '📊',
      description: 'Sunum için optimize edilmiş görünüm',
      category: 'professional'
    },
    whiteboard: {
      id: 'whiteboard',
      name: 'Whiteboard Modu',
      icon: '🎨',
      description: 'Çizim ve işbirliği için optimize edilmiş görünüm',
      category: 'professional'
    },


  })

  // Computed
  const availableLayouts = computed(() => Object.values(layoutConfig.value))
  const currentLayoutInfo = computed(() => layoutConfig.value[currentLayout.value])
  
  const layoutsByCategory = computed(() => {
    const grouped = {}
    availableLayouts.value.forEach(layout => {
      if (!grouped[layout.category]) {
        grouped[layout.category] = []
      }
      grouped[layout.category].push(layout)
    })
    return grouped
  })

  // Actions
  const switchLayout = (layoutId) => {
    if (layoutConfig.value[layoutId]) {
      currentLayout.value = layoutId
      isLayoutMenuOpen.value = false
    }
  }

  const toggleLayoutMenu = () => {
    isLayoutMenuOpen.value = !isLayoutMenuOpen.value
  }

  const closeLayoutMenu = () => {
    isLayoutMenuOpen.value = false
  }

  const resetToDefault = () => {
    currentLayout.value = 'grid'
  }

  // Persist layout preference
  const saveLayoutPreference = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('agora-layout-preference', currentLayout.value)
    }
  }

  const loadLayoutPreference = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agora-layout-preference')
      if (saved && layoutConfig.value[saved]) {
        // Sadece presentation layout'unda değilse yükle
        // Bu sayede ilk girişte presentation'dan başlamaz
        if (saved !== 'presentation') {
          currentLayout.value = saved
        } else {
          // Presentation layout'unda kaldıysa grid'e sıfırla
          currentLayout.value = 'grid'
          saveLayoutPreference() // Grid'i kaydet
        }
      }
    }
  }

  // Auto-save when layout changes
  const switchLayoutWithSave = (layoutId) => {
    switchLayout(layoutId)
    saveLayoutPreference()
  }

  return {
    // State
    currentLayout,
    isLayoutMenuOpen,
    
    // Computed
    layoutConfig,
    availableLayouts,
    currentLayoutInfo,
    layoutsByCategory,
    
    // Actions
    switchLayout,
    switchLayoutWithSave,
    toggleLayoutMenu,
    closeLayoutMenu,
    resetToDefault,
    saveLayoutPreference,
    loadLayoutPreference
  }
})
