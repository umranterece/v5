# Agora Video Conference Module v5

## 🚀 Hızlı Başlangıç

```bash
npm install
npm run dev
```

## 📁 Proje Yapısı

```
src/modules/agora/
├── components/          # Vue bileşenleri
│   ├── core/           # Ana konferans bileşenleri
│   ├── controls/       # Kontrol bileşenleri
│   ├── layouts/        # Layout bileşenleri
│   └── ui/             # UI bileşenleri
├── composables/        # Vue composables
├── store/              # Pinia store'ları
├── services/           # API servisleri
├── utils/              # Yardımcı fonksiyonlar
└── constants.js        # Sabitler ve konfigürasyon
```

## 🎯 Ana Özellikler

- **Video Konferans**: Agora SDK ile gerçek zamanlı video
- **Ekran Paylaşımı**: Optimize edilmiş ekran paylaşımı
- **Kayıt**: Cloud recording desteği
- **Layout Sistemi**: Grid, Spotlight, Presentation layout'ları
- **Tema Sistemi**: Dinamik tema değiştirme
- **Responsive**: Mobil ve desktop uyumlu

## 🔧 Kullanım

```vue
<template>
  <AgoraConference 
    :channelName="channelName"
    :autoJoin="true"
    @joined="handleJoined"
    @error="handleError"
  />
</template>

<script setup>
import { AgoraConference } from './modules/agora/index.js'

const channelName = ref('test-channel')
</script>
```

## 📚 Modüller

### Core Components
- `AgoraConference`: Ana konferans bileşeni
- `AgoraVideo`: Video yönetimi

### Composables
- `useMeeting`: Ana toplantı yönetimi
- `useVideo`: Video işlemleri
- `useScreenShare`: Ekran paylaşımı
- `useRecording`: Kayıt işlemleri

### Store
- `useAgoraStore`: Ana state yönetimi
- `useLayoutStore`: Layout state yönetimi

## 🌐 API Endpoints

- **Token**: `https://umranterece.com/test/agora/createToken.php`
- **Recording**: `https://umranterece.com/test/agora/recording.php`

## 🎨 Tema Sistemi

```javascript
import { useTheme } from './modules/agora/composables/useTheme.js'

const { initializeTheme, setTheme } = useTheme()
setTheme('dark') // 'light' | 'dark'
```

## 📱 Responsive Design

- Mobile-first yaklaşım
- Breakpoint'ler: 768px, 1024px, 1440px
- Touch-friendly kontroller

## 🚀 Performance

- Lazy loading
- Optimized video encoding
- Network quality monitoring
- Adaptive bitrate

## 🔒 Güvenlik

- Token-based authentication
- HTTPS only
- Permission handling
- Error sanitization

## 📝 Logging

```javascript
import { useLogger } from './modules/agora/composables/useLogger.js'

const { logUI, logError, exportLogs } = useLogger()
```

## 🧪 Development

```bash
# Debug mode
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## 📋 TODO

- [ ] Screen.js store dosyası oluştur
- [ ] Whiteboard desteği ekle
- [ ] Chat sistemi ekle
- [ ] File sharing ekle
