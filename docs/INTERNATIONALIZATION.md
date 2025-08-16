# 🌐 **Çoklu Dil Desteği (i18n) Rehberi**

> **Context Engineering** yaklaşımı ile hazırlanmış kapsamlı internationalization dokümantasyonu

## 🎯 **Genel Bakış**

Bu dokümantasyon, **rs-agora-module** projesinin çoklu dil desteğinin nasıl tasarlandığını ve implement edildiğini detaylandırır. **Context Engineering** prensiplerine uygun olarak, i18n kararlarının nedenleri ve implementasyon stratejileri açıklanmıştır.

## 🏗️ **i18n Mimarisi**

### **1. Dil Desteği Yapısı**
```
src/
├── locales/
│   ├── index.js              # Dil yöneticisi
│   ├── tr.js                 # Türkçe çeviriler
│   ├── en.js                 # İngilizce çeviriler
│   ├── de.js                 # Almanca çeviriler
│   └── ar.js                 # Arapça çeviriler (RTL)
├── composables/
│   └── useI18n.js            # i18n composable
└── components/
    └── LanguageSelector.vue  # Dil seçici component
```

### **2. Desteklenen Diller**
- **Türkçe (tr)** - Varsayılan dil
- **İngilizce (en)** - Uluslararası standart
- **Almanca (de)** - Avrupa pazarı
- **Arapça (ar)** - RTL desteği ile

## 🌍 **Dil Yöneticisi**

### **1. Locale Index**
```javascript
// locales/index.js
import { createI18n } from 'vue-i18n'
import tr from './tr'
import en from './en'
import de from './de'
import ar from './ar'

// Desteklenen diller
export const SUPPORTED_LOCALES = {
  tr: {
    name: 'Türkçe',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    direction: 'ltr'
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    direction: 'ltr'
  },
  de: {
    name: 'Deutsch',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr'
  },
  ar: {
    name: 'العربية',
    nativeName: 'العربية',
    flag: '🇸🇦',
    direction: 'rtl'
  }
}

// Varsayılan dil
export const DEFAULT_LOCALE = 'tr'

// Fallback dil
export const FALLBACK_LOCALE = 'en'

// i18n instance oluşturma
export const i18n = createI18n({
  legacy: false, // Vue 3 Composition API desteği
  locale: getInitialLocale(),
  fallbackLocale: FALLBACK_LOCALE,
  messages: {
    tr,
    en,
    de,
    ar
  },
  pluralizationRules: {
    tr: (choice, choicesLength) => {
      if (choice === 0) return 0
      if (choice === 1) return 1
      return 2
    }
  }
})

// Başlangıç dilini belirleme
function getInitialLocale() {
  // 1. LocalStorage'dan kaydedilmiş dil
  const savedLocale = localStorage.getItem('agora-locale')
  if (savedLocale && SUPPORTED_LOCALES[savedLocale]) {
    return savedLocale
  }
  
  // 2. Tarayıcı dilini kontrol et
  const browserLocale = navigator.language.split('-')[0]
  if (SUPPORTED_LOCALES[browserLocale]) {
    return browserLocale
  }
  
  // 3. Varsayılan dil
  return DEFAULT_LOCALE
}

// Dil değiştirme fonksiyonu
export function setLocale(locale) {
  if (!SUPPORTED_LOCALES[locale]) {
    console.warn(`Unsupported locale: ${locale}`)
    return false
  }
  
  i18n.global.locale.value = locale
  localStorage.setItem('agora-locale', locale)
  
  // RTL desteği
  document.documentElement.dir = SUPPORTED_LOCALES[locale].direction
  document.documentElement.lang = locale
  
  // Event emit
  window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }))
  
  return true
}

// Mevcut dili alma
export function getCurrentLocale() {
  return i18n.global.locale.value
}

// Dil bilgilerini alma
export function getLocaleInfo(locale) {
  return SUPPORTED_LOCALES[locale] || null
}

// Tüm desteklenen dilleri alma
export function getSupportedLocales() {
  return Object.entries(SUPPORTED_LOCALES).map(([code, info]) => ({
    code,
    ...info
  }))
}
```

### **2. Türkçe Çeviriler**
```javascript
// locales/tr.js
export default {
  // Genel terimler
  common: {
    loading: 'Yükleniyor...',
    error: 'Hata',
    success: 'Başarılı',
    cancel: 'İptal',
    save: 'Kaydet',
    delete: 'Sil',
    edit: 'Düzenle',
    close: 'Kapat',
    back: 'Geri',
    next: 'İleri',
    previous: 'Önceki',
    search: 'Ara',
    filter: 'Filtrele',
    sort: 'Sırala',
    refresh: 'Yenile',
    settings: 'Ayarlar',
    help: 'Yardım',
    about: 'Hakkında'
  },
  
  // Video konferans
  conference: {
    title: 'Video Konferans',
    join: 'Katıl',
    leave: 'Ayrıl',
    mute: 'Sustur',
    unmute: 'Sesi Aç',
    videoOn: 'Videoyu Aç',
    videoOff: 'Videoyu Kapat',
    screenShare: 'Ekran Paylaş',
    stopScreenShare: 'Ekran Paylaşımını Durdur',
    recording: 'Kayıt',
    startRecording: 'Kaydı Başlat',
    stopRecording: 'Kaydı Durdur',
    participants: 'Katılımcılar',
    chat: 'Sohbet',
    raiseHand: 'El Kaldır',
    lowerHand: 'Eli İndir',
    spotlight: 'Öne Çıkar',
    removeSpotlight: 'Öne Çıkarmayı Kaldır'
  },
  
  // Durum mesajları
  status: {
    connecting: 'Bağlanıyor...',
    connected: 'Bağlandı',
    disconnected: 'Bağlantı Kesildi',
    reconnecting: 'Yeniden Bağlanıyor...',
    connectionFailed: 'Bağlantı Başarısız',
    joining: 'Kanala Katılıyor...',
    joined: 'Kanala Katıldı',
    leaving: 'Kanaldan Ayrılıyor...',
    left: 'Kanaldan Ayrıldı',
    recording: 'Kayıt Yapılıyor...',
    screenSharing: 'Ekran Paylaşılıyor...',
    muted: 'Susturuldu',
    videoOff: 'Video Kapalı'
  },
  
  // Hata mesajları
  errors: {
    networkError: 'Ağ hatası oluştu',
    permissionDenied: 'İzin reddedildi',
    deviceNotFound: 'Cihaz bulunamadı',
    connectionTimeout: 'Bağlantı zaman aşımı',
    invalidChannel: 'Geçersiz kanal adı',
    channelFull: 'Kanal dolu',
    tokenExpired: 'Token süresi doldu',
    serverError: 'Sunucu hatası',
    unknownError: 'Bilinmeyen hata oluştu'
  },
  
  // Kalite göstergeleri
  quality: {
    excellent: 'Mükemmel',
    good: 'İyi',
    fair: 'Orta',
    poor: 'Kötü',
    veryPoor: 'Çok Kötü',
    bitrate: 'Bit Hızı',
    fps: 'FPS',
    latency: 'Gecikme',
    packetLoss: 'Paket Kaybı',
    jitter: 'Titreşim'
  },
  
  // Zaman formatları
  time: {
    seconds: 'saniye',
    minutes: 'dakika',
    hours: 'saat',
    days: 'gün',
    ago: 'önce',
    now: 'şimdi',
    today: 'bugün',
    yesterday: 'dün',
    tomorrow: 'yarın'
  },
  
  // Sayı formatları
  numbers: {
    participants: '{count} katılımcı',
    participants_0: 'katılımcı yok',
    participants_1: '1 katılımcı',
    participants_2: '{count} katılımcı',
    messages: '{count} mesaj',
    messages_0: 'mesaj yok',
    messages_1: '1 mesaj',
    messages_2: '{count} mesaj'
  },
  
  // Ayarlar
  settings: {
    title: 'Ayarlar',
    general: 'Genel',
    audio: 'Ses',
    video: 'Video',
    network: 'Ağ',
    appearance: 'Görünüm',
    language: 'Dil',
    theme: 'Tema',
    notifications: 'Bildirimler',
    privacy: 'Gizlilik',
    about: 'Hakkında',
    
    // Ses ayarları
    audioInput: 'Ses Girişi',
    audioOutput: 'Ses Çıkışı',
    volume: 'Ses Seviyesi',
    echoCancellation: 'Yankı Engelleme',
    noiseSuppression: 'Gürültü Bastırma',
    autoGainControl: 'Otomatik Kazanç Kontrolü',
    
    // Video ayarları
    videoInput: 'Video Girişi',
    resolution: 'Çözünürlük',
    frameRate: 'Kare Hızı',
    bitrate: 'Bit Hızı',
    aspectRatio: 'En Boy Oranı',
    
    // Ağ ayarları
    bandwidth: 'Bant Genişliği',
    latency: 'Gecikme',
    packetLoss: 'Paket Kaybı',
    jitter: 'Titreşim',
    
    // Görünüm ayarları
    layout: 'Düzen',
    grid: 'Izgara',
    spotlight: 'Spotlight',
    presentation: 'Sunum',
    compact: 'Kompakt',
    comfortable: 'Rahat'
  }
}
```

### **3. İngilizce Çeviriler**
```javascript
// locales/en.js
export default {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    refresh: 'Refresh',
    settings: 'Settings',
    help: 'Help',
    about: 'About'
  },
  
  conference: {
    title: 'Video Conference',
    join: 'Join',
    leave: 'Leave',
    mute: 'Mute',
    unmute: 'Unmute',
    videoOn: 'Turn On Video',
    videoOff: 'Turn Off Video',
    screenShare: 'Share Screen',
    stopScreenShare: 'Stop Screen Sharing',
    recording: 'Recording',
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    participants: 'Participants',
    chat: 'Chat',
    raiseHand: 'Raise Hand',
    lowerHand: 'Lower Hand',
    spotlight: 'Spotlight',
    removeSpotlight: 'Remove Spotlight'
  },
  
  status: {
    connecting: 'Connecting...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    reconnecting: 'Reconnecting...',
    connectionFailed: 'Connection Failed',
    joining: 'Joining Channel...',
    joined: 'Joined Channel',
    leaving: 'Leaving Channel...',
    left: 'Left Channel',
    recording: 'Recording...',
    screenSharing: 'Screen Sharing...',
    muted: 'Muted',
    videoOff: 'Video Off'
  },
  
  errors: {
    networkError: 'Network error occurred',
    permissionDenied: 'Permission denied',
    deviceNotFound: 'Device not found',
    connectionTimeout: 'Connection timeout',
    invalidChannel: 'Invalid channel name',
    channelFull: 'Channel is full',
    tokenExpired: 'Token expired',
    serverError: 'Server error',
    unknownError: 'Unknown error occurred'
  },
  
  quality: {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    veryPoor: 'Very Poor',
    bitrate: 'Bitrate',
    fps: 'FPS',
    latency: 'Latency',
    packetLoss: 'Packet Loss',
    jitter: 'Jitter'
  },
  
  time: {
    seconds: 'seconds',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    ago: 'ago',
    now: 'now',
    today: 'today',
    yesterday: 'yesterday',
    tomorrow: 'tomorrow'
  },
  
  numbers: {
    participants: '{count} participants',
    participants_0: 'no participants',
    participants_1: '1 participant',
    participants_2: '{count} participants',
    messages: '{count} messages',
    messages_0: 'no messages',
    messages_1: '1 message',
    messages_2: '{count} messages'
  },
  
  settings: {
    title: 'Settings',
    general: 'General',
    audio: 'Audio',
    video: 'Video',
    network: 'Network',
    appearance: 'Appearance',
    language: 'Language',
    theme: 'Theme',
    notifications: 'Notifications',
    privacy: 'Privacy',
    about: 'About',
    
    audioInput: 'Audio Input',
    audioOutput: 'Audio Output',
    volume: 'Volume',
    echoCancellation: 'Echo Cancellation',
    noiseSuppression: 'Noise Suppression',
    autoGainControl: 'Auto Gain Control',
    
    videoInput: 'Video Input',
    resolution: 'Resolution',
    frameRate: 'Frame Rate',
    bitrate: 'Bitrate',
    aspectRatio: 'Aspect Ratio',
    
    bandwidth: 'Bandwidth',
    latency: 'Latency',
    packetLoss: 'Packet Loss',
    jitter: 'Jitter',
    
    layout: 'Layout',
    grid: 'Grid',
    spotlight: 'Spotlight',
    presentation: 'Presentation',
    compact: 'Compact',
    comfortable: 'Comfortable'
  }
}
```

## 🔧 **i18n Composable**

### **1. useI18n Composable**
```javascript
// composables/useI18n.js
import { computed, ref, watch } from 'vue'
import { useI18n as useVueI18n } from 'vue-i18n'
import { 
  setLocale, 
  getCurrentLocale, 
  getLocaleInfo, 
  getSupportedLocales,
  SUPPORTED_LOCALES 
} from '../locales'

export function useI18n() {
  const { t, locale, n, d } = useVueI18n()
  
  // Mevcut dil
  const currentLocale = ref(getCurrentLocale())
  
  // Desteklenen diller
  const supportedLocales = ref(getSupportedLocales())
  
  // Dil değiştirme
  const changeLocale = (newLocale) => {
    if (setLocale(newLocale)) {
      currentLocale.value = newLocale
      return true
    }
    return false
  }
  
  // Mevcut dil bilgileri
  const currentLocaleInfo = computed(() => 
    getLocaleInfo(currentLocale.value)
  )
  
  // RTL desteği
  const isRTL = computed(() => 
    currentLocaleInfo.value?.direction === 'rtl'
  )
  
  // Dil değişikliği dinleyicisi
  watch(currentLocale, (newLocale) => {
    // RTL stil uygulama
    if (isRTL.value) {
      document.body.classList.add('rtl')
    } else {
      document.body.classList.remove('rtl')
    }
  }, { immediate: true })
  
  // Çeviri fonksiyonu (fallback ile)
  const translate = (key, params = {}) => {
    try {
      return t(key, params)
    } catch (error) {
      console.warn(`Translation key not found: ${key}`)
      return key
    }
  }
  
  // Sayı formatlama
  const formatNumber = (number, options = {}) => {
    const localeOptions = {
      style: 'decimal',
      ...options
    }
    
    try {
      return new Intl.NumberFormat(currentLocale.value, localeOptions).format(number)
    } catch (error) {
      return number.toString()
    }
  }
  
  // Para formatlama
  const formatCurrency = (amount, currency = 'TRY') => {
    try {
      return new Intl.NumberFormat(currentLocale.value, {
        style: 'currency',
        currency
      }).format(amount)
    } catch (error) {
      return `${amount} ${currency}`
    }
  }
  
  // Tarih formatlama
  const formatDate = (date, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    }
    
    try {
      return new Intl.DateTimeFormat(currentLocale.value, defaultOptions).format(date)
    } catch (error) {
      return date.toLocaleDateString()
    }
  }
  
  // Zaman formatlama
  const formatTime = (date, options = {}) => {
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }
    
    try {
      return new Intl.DateTimeFormat(currentLocale.value, defaultOptions).format(date)
    } catch (error) {
      return date.toLocaleTimeString()
    }
  }
  
  // Göreceli zaman formatlama
  const formatRelativeTime = (date) => {
    const now = new Date()
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return t('time.days', { count: days })
    } else if (hours > 0) {
      return t('time.hours', { count: hours })
    } else if (minutes > 0) {
      return t('time.minutes', { count: minutes })
    } else {
      return t('time.now')
    }
  }
  
  // Çoğul formatta çeviri
  const translatePlural = (key, count, params = {}) => {
    try {
      return t(key, { count, ...params })
    } catch (error) {
      console.warn(`Plural translation key not found: ${key}`)
      return `${count} ${key}`
    }
  }
  
  return {
    // State
    currentLocale,
    currentLocaleInfo,
    supportedLocales,
    isRTL,
    
    // Methods
    changeLocale,
    translate,
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
    formatRelativeTime,
    translatePlural,
    
    // Vue i18n methods
    t,
    n,
    d
  }
}
```

## 🎨 **Language Selector Component**

### **1. LanguageSelector.vue**
```vue
<template>
  <div class="language-selector" :class="{ 'is-open': isOpen }">
    <!-- Mevcut dil gösterici -->
    <button
      class="current-language"
      @click="toggleDropdown"
      :aria-label="`Mevcut dil: ${currentLocaleInfo.name}`"
      :aria-expanded="isOpen"
    >
      <span class="flag">{{ currentLocaleInfo.flag }}</span>
      <span class="name">{{ currentLocaleInfo.name }}</span>
      <span class="arrow" :class="{ 'rotated': isOpen }">▼</span>
    </button>
    
    <!-- Dil listesi -->
    <div v-if="isOpen" class="language-dropdown">
      <div
        v-for="locale in supportedLocales"
        :key="locale.code"
        class="language-option"
        :class="{ 
          'active': locale.code === currentLocale,
          'rtl': locale.direction === 'rtl'
        }"
        @click="selectLanguage(locale.code)"
      >
        <span class="flag">{{ locale.flag }}</span>
        <span class="name">{{ locale.name }}</span>
        <span class="native-name">{{ locale.nativeName }}</span>
        <span v-if="locale.code === currentLocale" class="check">✓</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n'

// Props
const props = defineProps({
  showNativeNames: {
    type: Boolean,
    default: true
  },
  showFlags: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['language-changed'])

// Composables
const {
  currentLocale,
  currentLocaleInfo,
  supportedLocales,
  changeLocale
} = useI18n()

// Local state
const isOpen = ref(false)

// Computed
const filteredLocales = computed(() => {
  return supportedLocales.value.filter(locale => 
    locale.code !== currentLocale.value
  )
})

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectLanguage = (localeCode) => {
  if (changeLocale(localeCode)) {
    emit('language-changed', localeCode)
    isOpen.value = false
  }
}

const handleClickOutside = (event) => {
  if (!event.target.closest('.language-selector')) {
    isOpen.value = false
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.language-selector {
  position: relative;
  display: inline-block;
}

.current-language {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--agora-border-color);
  border-radius: 8px;
  background: var(--agora-bg-primary);
  color: var(--agora-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.current-language:hover {
  background: var(--agora-bg-hover);
  border-color: var(--agora-accent-primary);
}

.flag {
  font-size: 1.2rem;
}

.name {
  font-weight: 500;
  font-size: 0.9rem;
}

.arrow {
  margin-left: auto;
  transition: transform 0.2s ease;
  font-size: 0.8rem;
}

.arrow.rotated {
  transform: rotate(180deg);
}

.language-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--agora-bg-primary);
  border: 1px solid var(--agora-border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 0.25rem;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--agora-border-color);
}

.language-option:last-child {
  border-bottom: none;
}

.language-option:hover {
  background: var(--agora-bg-hover);
}

.language-option.active {
  background: var(--agora-accent-primary);
  color: white;
}

.language-option.rtl {
  direction: rtl;
  text-align: right;
}

.flag {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.name {
  font-weight: 500;
  font-size: 0.9rem;
}

.native-name {
  font-size: 0.8rem;
  color: var(--agora-text-secondary);
  margin-left: auto;
}

.check {
  color: var(--agora-success);
  font-weight: bold;
  margin-left: 0.5rem;
}

/* RTL desteği */
.rtl .language-selector {
  direction: rtl;
}

.rtl .current-language {
  flex-direction: row-reverse;
}

.rtl .arrow {
  margin-left: 0;
  margin-right: auto;
}

.rtl .native-name {
  margin-left: 0;
  margin-right: auto;
}

.rtl .check {
  margin-left: 0;
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .current-language {
    min-width: 100px;
    padding: 0.5rem 0.75rem;
  }
  
  .name {
    display: none;
  }
  
  .language-dropdown {
    min-width: 200px;
  }
}
</style>
```

## 📱 **RTL Desteği**

### **1. RTL CSS Stilleri**
```css
/* rtl.css */
[dir="rtl"] {
  /* Text alignment */
  text-align: right;
  
  /* Margins and paddings */
  .agora-controls {
    flex-direction: row-reverse;
  }
  
  .control-button {
    margin-left: 0;
    margin-right: 0.5rem;
  }
  
  .control-button:last-child {
    margin-right: 0;
    margin-left: 0.5rem;
  }
  
  /* Video grid */
  .video-grid {
    direction: rtl;
  }
  
  .video-item {
    direction: ltr; /* Video content should remain LTR */
  }
  
  /* User info overlay */
  .user-info {
    flex-direction: row-reverse;
  }
  
  .status-indicators {
    flex-direction: row-reverse;
  }
  
  /* Stream quality bar */
  .stream-quality-bar {
    flex-direction: row-reverse;
  }
  
  .metrics {
    margin-left: 0;
    margin-right: auto;
  }
  
  /* Network quality indicator */
  .network-quality {
    left: 0.5rem;
    right: auto;
  }
  
  /* Language selector */
  .language-selector {
    direction: rtl;
  }
  
  .current-language {
    flex-direction: row-reverse;
  }
  
  .arrow {
    margin-left: 0;
    margin-right: auto;
  }
  
  .language-option {
    flex-direction: row-reverse;
  }
  
  .native-name {
    margin-left: 0;
    margin-right: auto;
  }
  
  .check {
    margin-left: 0;
    margin-right: 0.5rem;
  }
}

/* RTL specific animations */
[dir="rtl"] .control-button:hover {
  transform: translateY(-2px) scaleX(-1);
}

[dir="rtl"] .video-item:hover {
  transform: translateY(-2px) scaleX(-1);
}
```

### **2. RTL Layout Adaptasyonu**
```javascript
// utils/rtl.js
export const isRTL = (locale) => {
  const rtlLocales = ['ar', 'he', 'fa', 'ur']
  return rtlLocales.includes(locale)
}

export const getRTLStyles = (locale) => {
  if (!isRTL(locale)) return {}
  
  return {
    direction: 'rtl',
    textAlign: 'right',
    transform: 'scaleX(-1)'
  }
}

export const getRTLIcon = (icon, locale) => {
  if (!isRTL(locale)) return icon
  
  // RTL için icon'ları çevir
  const rtlIcons = {
    '←': '→',
    '→': '←',
    '◀': '▶',
    '▶': '◀',
    '◁': '▷',
    '▷': '◁'
  }
  
  return rtlIcons[icon] || icon
}

export const getRTLPosition = (position, locale) => {
  if (!isRTL(locale)) return position
  
  // RTL için pozisyonları çevir
  const rtlPositions = {
    left: 'right',
    right: 'left',
    'margin-left': 'margin-right',
    'margin-right': 'margin-left',
    'padding-left': 'padding-right',
    'padding-right': 'padding-left'
  }
  
  return rtlPositions[position] || position
}
```

## 🔧 **Component Entegrasyonu**

### **1. Component'lerde i18n Kullanımı**
```vue
<template>
  <div class="agora-conference">
    <!-- Başlık -->
    <h1>{{ translate('conference.title') }}</h1>
    
    <!-- Durum mesajı -->
    <div class="status" v-if="isConnecting">
      {{ translate('status.connecting') }}
    </div>
    
    <!-- Katılımcı sayısı -->
    <div class="participants">
      {{ translatePlural('numbers.participants', participantCount) }}
    </div>
    
    <!-- Kontroller -->
    <AgoraControls
      :muteText="translate('conference.mute')"
      :unmuteText="translate('conference.unmute')"
      :videoOnText="translate('conference.videoOn')"
      :videoOffText="translate('conference.videoOff')"
      :screenShareText="translate('conference.screenShare')"
      :stopScreenShareText="translate('conference.stopScreenShare')"
      :leaveText="translate('conference.leave')"
    />
    
    <!-- Dil seçici -->
    <LanguageSelector @language-changed="handleLanguageChange" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'
import AgoraControls from './AgoraControls.vue'
import LanguageSelector from './LanguageSelector.vue'

// Composables
const {
  currentLocale,
  translate,
  translatePlural,
  formatNumber,
  formatDate
} = useI18n()

// Props
const props = defineProps({
  participantCount: {
    type: Number,
    default: 0
  },
  isConnecting: {
    type: Boolean,
    default: false
  }
})

// Methods
const handleLanguageChange = (newLocale) => {
  console.log(`Language changed to: ${newLocale}`)
  // Gerekli işlemleri yap
}
</script>
```

## 📊 **Performance Optimizasyonları**

### **1. Lazy Loading**
```javascript
// locales/lazy.js
const localeModules = {
  tr: () => import('./tr'),
  en: () => import('./en'),
  de: () => import('./de'),
  ar: () => import('./ar')
}

export async function loadLocale(locale) {
  if (localeModules[locale]) {
    const module = await localeModules[locale]()
    return module.default
  }
  throw new Error(`Locale not found: ${locale}`)
}
```

### **2. Bundle Size Optimizasyonu**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'locales-tr': ['./src/locales/tr.js'],
          'locales-en': ['./src/locales/en.js'],
          'locales-de': ['./src/locales/de.js'],
          'locales-ar': ['./src/locales/ar.js']
        }
      }
    }
  }
})
```

## 🧪 **Testing**

### **1. i18n Testleri**
```javascript
// i18n.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { createI18n } from 'vue-i18n'
import { useI18n } from '../useI18n'
import tr from '../locales/tr'
import en from '../locales/en'

describe('i18n Tests', () => {
  let i18n
  let composable
  
  beforeEach(() => {
    i18n = createI18n({
      legacy: false,
      locale: 'tr',
      fallbackLocale: 'en',
      messages: { tr, en }
    })
    
    composable = useI18n()
  })
  
  it('should translate Turkish text correctly', () => {
    const result = composable.translate('conference.title')
    expect(result).toBe('Video Konferans')
  })
  
  it('should fallback to English for missing keys', () => {
    const result = composable.translate('nonexistent.key')
    expect(result).toBe('nonexistent.key')
  })
  
  it('should handle plural forms correctly', () => {
    const result = composable.translatePlural('numbers.participants', 5)
    expect(result).toBe('5 katılımcı')
  })
  
  it('should format numbers correctly', () => {
    const result = composable.formatNumber(1234.56)
    expect(result).toBe('1.234,56')
  })
  
  it('should format dates correctly', () => {
    const date = new Date('2023-12-25')
    const result = composable.formatDate(date)
    expect(result).toContain('25')
    expect(result).toContain('Aralık')
    expect(result).toContain('2023')
  })
})
```

## 📋 **i18n Checklist**

### **Temel Özellikler**
- [ ] Çoklu dil desteği
- [ ] RTL desteği
- [ ] Fallback dil sistemi
- [ ] Dinamik dil değiştirme
- [ ] Yerel depolama

### **Çeviri Sistemi**
- [ ] Nested key yapısı
- [ ] Parametre desteği
- [ ] Çoğul form desteği
- [ ] Sayı formatlama
- [ ] Tarih formatlama

### **UI Entegrasyonu**
- [ ] Dil seçici component
- [ ] Otomatik dil algılama
- [ ] RTL layout adaptasyonu
- [ ] Responsive tasarım

### **Performance**
- [ ] Lazy loading
- [ ] Bundle optimizasyonu
- [ ] Cache mekanizması
- [ ] Tree shaking

## 📚 **Ek Kaynaklar**

- [Vue i18n Documentation](https://vue-i18n.intlify.dev/)
- [Intl API Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [RTL Design Guidelines](https://material.io/design/usability/bidirectionality.html)
- [i18n Best Practices](https://www.i18next.com/overview/best-practices)

---

> **Not**: Bu internationalization rehberi, **Context Engineering** prensiplerine uygun olarak hazırlanmıştır. Her i18n kararının nedenleri ve implementasyon stratejileri açıklanmıştır.
