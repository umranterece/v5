# 🚀 Agora Video Conference v5.0.0

Modern, özelleştirilebilir ve güçlü video konferans uygulaması. Agora SDK kullanarak gerçek zamanlı iletişim, ekran paylaşımı, beyaz tahta ve gelişmiş loglama özellikleri sunar.

## ✨ Özellikler

### 🎥 Video Konferans
- **Gerçek Zamanlı Video/Audio**: Agora RTC SDK ile yüksek kaliteli iletişim
- **Çoklu Kullanıcı Desteği**: Sınırsız katılımcı desteği
- **Otomatik Bağlanma**: Kanal adı ile otomatik katılım
- **Ağ Kalitesi İzleme**: Gerçek zamanlı bağlantı durumu

### 🖥️ Ekran Paylaşımı
- **Tam Ekran Paylaşımı**: Masaüstü, pencere veya sekme paylaşımı
- **Audio Paylaşımı**: Sistem sesi ile birlikte ekran paylaşımı
- **Paylaşım Kontrolü**: Paylaşımı durdurma ve yeniden başlatma

### 🎨 Beyaz Tahta
- **Netless Whiteboard**: Gelişmiş çizim ve not alma araçları
- **Gerçek Zamanlı Senkronizasyon**: Tüm katılımcılarda anlık güncelleme
- **Çoklu Araç Desteği**: Kalem, şekil, metin, resim ekleme

### 🎭 Tema Sistemi
- **15+ Hazır Tema**: Ocean Deep, Sunset Warm, Forest Nature, Cosmic Purple, Neon Cyber ve daha fazlası
- **Dinamik Tema Değiştirme**: Uygulama içinden anlık tema değişimi
- **Özelleştirilebilir Renkler**: CSS değişkenleri ile kolay özelleştirme
- **LogModal Elegance**: Varsayılan zarif tema

### 📱 Responsive Tasarım
- **Mobil Uyumlu**: Tüm cihazlarda mükemmel deneyim
- **Adaptif Layout**: Ekran boyutuna göre otomatik düzenleme
- **Touch Desteği**: Mobil cihazlarda dokunmatik kontroller

### 🔧 Gelişmiş Kontroller
- **Kamera/Mikrofon Kontrolü**: Açma/kapama, değiştirme
- **Layout Değiştirme**: Grid, Spotlight, Presentation modları
- **Kayıt Kontrolü**: Video/audio kayıt başlatma/durdurma
- **Ayarlar Paneli**: Detaylı konfigürasyon seçenekleri

### 📊 Loglama ve İzleme
- **Dosya Tabanlı Loglama**: Yapılandırılabilir log seviyeleri
- **Gerçek Zamanlı İzleme**: Bağlantı durumu, kalite metrikleri
- **Hata Takibi**: Detaylı hata raporlama ve kullanıcı dostu mesajlar

## 🏗️ Mimari

### 📁 Proje Yapısı
```
src/
├── modules/
│   └── agora/                    # Ana Agora modülü
│       ├── assets/               # Tema ve stil dosyaları
│       │   └── themes.css        # 15+ hazır tema
│       ├── components/           # Vue bileşenleri
│       │   ├── core/            # Ana konferans bileşenleri
│       │   ├── controls/        # Kontrol bileşenleri
│       │   ├── layouts/         # Layout bileşenleri
│       │   ├── modals/          # Modal bileşenleri
│       │   ├── ui/              # UI bileşenleri
│       │   ├── video/           # Video bileşenleri
│       │   └── whiteboard/      # Beyaz tahta bileşenleri
│       ├── composables/         # Vue 3 composables
│       ├── services/            # Servis katmanı
│       ├── store/               # Pinia state yönetimi
│       ├── utils/               # Yardımcı fonksiyonlar
│       └── constants.js         # Konfigürasyon sabitleri
├── assets/                      # Global stil dosyaları
└── App.vue                     # Ana uygulama bileşeni
```

### 🔌 Modüler Yapı
- **Barrel Export Pattern**: Tüm modüller tek noktadan export edilir
- **Composable Architecture**: Vue 3 Composition API ile modern state yönetimi
- **Service Layer**: İş mantığı servis katmanında ayrılmış
- **Store Management**: Pinia ile merkezi state yönetimi

## 🚀 Kurulum

### Gereksinimler
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **Modern Browser**: Chrome, Firefox, Safari, Edge

### Kurulum Adımları
```bash
# Repository'yi klonla
git clone https://github.com/umranterece/v5.git
cd v5

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Build önizleme
npm run preview
```

## ⚙️ Konfigürasyon

### Agora SDK Ayarları
```javascript
// src/modules/agora/constants.js
export const AGORA_APP_ID = 'your-app-id'
export const AGORA_APP_CERTIFICATE = 'your-app-certificate'

export const AGORA_CONFIG = {
  mode: 'rtc',
  codec: 'h264',
  enableDualStream: false,
  enableHighPerformance: true
}
```

### Tema Sistemi
```javascript
// Tema değiştirme
import { useTheme } from './modules/agora/composables/useTheme'

const { setTheme, getCurrentTheme } = useTheme()
setTheme('cosmic-purple') // Rehberim Sensin teması
```

### Loglama Ayarları
```javascript
// Log seviyesi ve dosya ayarları
const LOG_CONFIG = {
  MAX_LOGS_PER_FILE: 10000,
  LOG_LEVEL: 'info' // debug, info, warn, error
}
```

## 🎨 Tema Sistemi

### Mevcut Temalar
- **🌊 Ocean Deep**: Mavi ve turkuaz tonları
- **🌅 Sunset Warm**: Sıcak turuncu ve altın tonları
- **🌲 Forest Nature**: Yeşil ve kahverengi tonları
- **💜 Cosmic Purple**: Hafif mor ve pembe tonları (Rehberim Sensin)
- **🤖 Neon Cyber**: Neon yeşil ve mavi tonları
- **☀️ Light Modern**: Açık ve modern tonlar
- **🌌 Aurora Borealis**: Kuzey ışıkları yeşil ve mavi tonları
- **🏜️ Desert Sunset**: Çöl gün batımı turuncu ve kum sarısı
- **🌊 Ocean Depth**: Derin okyanus mavi ve deniz yeşili
- **🏔️ Mountain Mist**: Dağ sisi mavi ve gri tonları
- **🍬 Candy Dream**: Şeker pembe ve mavi tonları
- **🌸 Soft Pastel**: Yumuşak pastel mavi ve pembe tonları
- **☕ Warm Cream**: Sıcak krem kahve ve bej tonları
- **✨ LogModal Elegance**: Varsayılan zarif tema

### Tema Değiştirme
```vue
<template>
  <ThemeSelector @theme-change="handleThemeChange" />
</template>

<script setup>
import { ThemeSelector } from './modules/agora/components/ui'

const handleThemeChange = (themeId) => {
  console.log('Yeni tema:', themeId)
}
</script>
```

## 🔧 API ve Servisler

### Token Servisi
- **RTC Token**: Video/audio konferans için
- **RTM Token**: Mesajlaşma için
- **Otomatik Yenileme**: Token süresi dolmadan önce yenileme

### RTM Servisi
- **Gerçek Zamanlı Mesajlaşma**: Kullanıcılar arası iletişim
- **Sistem Mesajları**: Katılım/ayrılım bildirimleri
- **Özel Mesajlar**: Kullanıcı tanımlı mesajlar

### Kayıt Servisi
- **Video Kayıt**: Yüksek kaliteli video kayıt
- **Audio Kayıt**: Sadece ses kaydı
- **Cloud Recording**: Agora Cloud Recording entegrasyonu

### Beyaz Tahta Servisi
- **Netless Whiteboard**: Gelişmiş çizim araçları
- **Gerçek Zamanlı Senkronizasyon**: Tüm katılımcılarda anlık güncelleme
- **Çoklu Format Desteği**: PDF, PPT, Word, Excel

## 📱 Kullanım

### Temel Kullanım
```vue
<template>
  <AgoraConference 
    :channelName="channelName"
    :autoJoin="true"
    :logActive="true"
    @joined="handleJoined"
    @left="handleLeft"
  />
</template>

<script setup>
import { AgoraConference } from './modules/agora'

const channelName = ref('test-channel')

const handleJoined = (data) => {
  console.log('Kanala katıldı:', data)
}

const handleLeft = (data) => {
  console.log('Kanaldan ayrıldı:', data)
}
</script>
```

### Ekran Paylaşımı
```javascript
import { useScreenShare } from './modules/agora/composables/useScreenShare'

const { 
  startScreenShare, 
  stopScreenShare, 
  isScreenSharing 
} = useScreenShare()

// Ekran paylaşımını başlat
await startScreenShare()

// Ekran paylaşımını durdur
stopScreenShare()
```

### Beyaz Tahta
```javascript
import { useNetlessWhiteboard } from './modules/agora/composables/useNetlessWhiteboard'

const { 
  createWhiteboard, 
  joinWhiteboard, 
  leaveWhiteboard 
} = useNetlessWhiteboard()

// Beyaz tahta oluştur
const whiteboard = await createWhiteboard()

// Beyaz tahtaya katıl
await joinWhiteboard(whiteboard.roomToken)
```

## 🧪 Test

### Test Komutları
```bash
# Tüm testleri çalıştır
npm test

# Test UI ile çalıştır
npm run test:ui

# Coverage ile çalıştır
npm run test:coverage

# Sadece testleri çalıştır
npm run test:run
```

### Test Kapsamı
- **Unit Tests**: Bileşen ve servis testleri
- **Integration Tests**: Modül entegrasyon testleri
- **E2E Tests**: Kullanıcı senaryo testleri

## 🚀 Deployment

### Vercel Deployment
```bash
# Vercel build
npm run vercel-build

# Vercel preview
vercel --prod
```

### Environment Variables
```bash
# .env.local
VITE_AGORA_APP_ID=your-app-id
VITE_AGORA_APP_CERTIFICATE=your-app-certificate
VITE_API_BASE_URL=your-api-base-url
```

## 📚 Dokümantasyon

### Detaylı Dokümantasyon
- [API Reference](./API.md)
- [Component Guide](./COMPONENTS.md)
- [Theme System](./THEMES.md)
- [Deployment Guide](./DEPLOYMENT.md)

### Video Tutorials
- [Kurulum Rehberi](https://youtube.com/watch?v=...)
- [Tema Sistemi](https://youtube.com/watch?v=...)
- [Beyaz Tahta Kullanımı](https://youtube.com/watch?v=...)

## 🤝 Katkıda Bulunma

### Geliştirme Süreci
1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### Kod Standartları
- **ESLint**: JavaScript kod kalitesi
- **Prettier**: Kod formatı
- **Vue 3**: Composition API kullanımı
- **TypeScript**: Tip güvenliği (opsiyonel)

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](../LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- **Agora.io**: Video konferans SDK'sı
- **Vue.js**: Modern frontend framework
- **Netless**: Beyaz tahta teknolojisi
- **Vercel**: Hosting ve deployment

## 📞 İletişim

- **Geliştirici**: Umran Terece
- **Email**: [email protected]
- **GitHub**: [@umranterece](https://github.com/umranterece)
- **Website**: [rehberimsensin.com](https://rehberimsensin.com)

---

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**
