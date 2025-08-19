# 🎥 Agora Video Conference v5

Modern, özelleştirilebilir ve güçlü video konferans uygulaması. Agora SDK kullanarak gerçek zamanlı iletişim, ekran paylaşımı ve gelişmiş loglama özellikleri sunar.

## ✨ Özellikler

### 🎯 Temel Özellikler
- **Gerçek Zamanlı Video/Audio Konferans**: Agora SDK ile düşük gecikme süreli iletişim
- **Ekran Paylaşımı**: Tam ekran veya pencere bazlı paylaşım
- **Çoklu Layout Desteği**: Grid, Spotlight, Presentation layout'ları
- **Kayıt Sistemi**: Konferans kayıtları ve yönetimi
- **Responsive Tasarım**: Tüm cihazlarda mükemmel deneyim

### 🔧 Gelişmiş Özellikler
- **Modüler Mimari**: ES6 modülleri ve Vue 3 Composition API
- **Configurable Logging**: LocalStorage ve LocalFolder storage seçenekleri
- **Theme Sistemi**: Dinamik tema değiştirme
- **Device Management**: Kamera, mikrofon ve hoparlör kontrolü
- **Quality Monitoring**: Stream kalite takibi ve optimizasyonu

### 🚀 Teknik Özellikler
- **Vue 3 + Vite**: Modern frontend stack
- **TypeScript Ready**: jsconfig.json ile tip desteği
- **Modular Structure**: Barrel export pattern
- **Event-Driven Architecture**: Central event emitter sistemi

## 🏗️ Proje Yapısı

```
v5/
├── src/
│   ├── modules/
│   │   └── agora/
│   │       ├── components/          # Vue bileşenleri
│   │       │   ├── core/            # Ana konferans bileşenleri
│   │       │   ├── controls/        # Kontrol bileşenleri
│   │       │   ├── layouts/         # Layout bileşenleri
│   │       │   ├── modals/          # Modal bileşenleri
│   │       │   ├── ui/              # UI bileşenleri
│   │       │   └── video/           # Video bileşenleri
│   │       ├── composables/         # Vue composables
│   │       ├── services/            # Servis katmanı
│   │       ├── store/               # State management
│   │       └── utils/               # Yardımcı fonksiyonlar
│   ├── assets/                      # Statik dosyalar
│   └── App.vue                      # Ana uygulama
├── docs/                            # Dokümantasyon
├── logs/                            # Log dosyaları (localFolder mode)
└── public/                          # Public assets
```

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+ 
- npm v9+

### Kurulum Adımları
```bash
# Repository'yi klonla
git clone https://github.com/yourusername/agora-video-conference.git
cd agora-video-conference/v5

# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build

# Build'i önizle
npm run preview
```

## ⚙️ Konfigürasyon

### Environment Variables
```bash
# .env dosyası oluştur (opsiyonel)
VITE_AGORA_APP_ID=your_app_id
VITE_AGORA_APP_TOKEN=your_app_token
```

### Logging Konfigürasyonu
Uygulama içinden Settings > Log Ayarları bölümünden:
- **Storage Method**: LocalStorage (varsayılan) veya LocalFolder
- **Log Retention**: Log saklama süresi (gün)

## 📱 Kullanım

### Konferansa Katılım
1. Uygulamayı aç
2. Agora App ID ve Token gir (veya otomatik join)
3. Kamera ve mikrofon izinlerini ver
4. Konferansa katıl!

### Layout Değiştirme
- **Grid Layout**: Tüm katılımcıları grid formatında görüntüle
- **Spotlight Layout**: Ana konuşmacıyı büyük göster
- **Presentation Layout**: Sunum modu için optimize edilmiş

### Ekran Paylaşımı
- Ekran paylaşım butonuna tıkla
- Tam ekran veya pencere seç
- Paylaşımı başlat

## 🛠️ Geliştirme

### Kod Standartları
- **ESLint**: Kod kalitesi kontrolü
- **Prettier**: Kod formatı
- **Vue 3 Composition API**: Modern Vue patterns
- **Modular Architecture**: Barrel export pattern

### Logging Sistemi
```javascript
// Log helper'ları kullan
const logInfo = (message, data) => fileLogger.log('info', 'CATEGORY', message, data)
const logError = (errorOrMessage, context) => {
  if (errorOrMessage instanceof Error) {
    return fileLogger.log('error', 'CATEGORY', errorOrMessage.message, { 
      error: errorOrMessage, 
      ...context 
    })
  }
  return fileLogger.log('error', 'CATEGORY', errorOrMessage, context)
}
```

### Yeni Bileşen Ekleme
```bash
# Yeni bileşen oluştur
touch src/modules/agora/components/NewComponent.vue

# Barrel export'a ekle
echo "export { default as NewComponent } from './NewComponent.vue'" >> src/modules/agora/components/index.js
```

## 📚 API Referansı

### Temel Composable'lar
- `useMeeting`: Konferans yönetimi
- `useVideo`: Video stream yönetimi
- `useRecording`: Kayıt işlemleri
- `useScreenShare`: Ekran paylaşımı
- `useDeviceSettings`: Cihaz ayarları

### Event Sistemi
```javascript
import { centralEmitter, AGORA_EVENTS } from '@/modules/agora/utils/centralEmitter'

// Event dinle
centralEmitter.on(AGORA_EVENTS.USER_JOINED, (data) => {
  console.log('Yeni kullanıcı katıldı:', data)
})

// Event gönder
centralEmitter.emit(AGORA_EVENTS.CUSTOM_EVENT, data)
```

## 🧪 Test

```bash
# Unit testleri çalıştır
npm run test

# E2E testleri
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📦 Build & Deploy

### Production Build
```bash
npm run build
```

### Docker (Opsiyonel)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🤝 Katkıda Bulunma

1. Fork yap
2. Feature branch oluştur (`git checkout -b feature/amazing-feature`)
3. Commit yap (`git commit -m 'Add amazing feature'`)
4. Push yap (`git push origin feature/amazing-feature`)
5. Pull Request oluştur

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- [Agora.io](https://agora.io) - Video SDK
- [Vue.js](https://vuejs.org) - Frontend framework
- [Vite](https://vitejs.dev) - Build tool

## 📞 İletişim

- **Proje Linki**: [https://github.com/yourusername/agora-video-conference](https://github.com/yourusername/agora-video-conference)
- **Issues**: [GitHub Issues](https://github.com/yourusername/agora-video-conference/issues)

---

⭐ Bu projeyi beğendiysen yıldız vermeyi unutma!