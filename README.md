# 🎥 Agora Video Conference v5.0.0

Modern, özelleştirilebilir ve güçlü video konferans uygulaması. Agora SDK kullanarak gerçek zamanlı iletişim, ekran paylaşımı, beyaz tahta ve gelişmiş loglama özellikleri sunar.

## ✨ Özellikler

### 🎯 Temel Özellikler
- **Gerçek Zamanlı Video/Audio Konferans**: Agora SDK ile düşük gecikme süreli iletişim
- **Ekran Paylaşımı**: Tam ekran veya pencere bazlı paylaşım
- **Beyaz Tahta**: Netless Whiteboard ile gelişmiş çizim araçları
- **Çoklu Layout Desteği**: Grid, Spotlight, Presentation layout'ları
- **Kayıt Sistemi**: Konferans kayıtları ve yönetimi
- **Responsive Tasarım**: Tüm cihazlarda mükemmel deneyim

### 🔧 Gelişmiş Özellikler
- **Modüler Mimari**: ES6 modülleri ve Vue 3 Composition API
- **Configurable Logging**: LocalStorage ve LocalFolder storage seçenekleri
- **Theme Sistemi**: 15+ hazır tema ile dinamik tema değiştirme
- **Device Management**: Kamera, mikrofon ve hoparlör kontrolü
- **Quality Monitoring**: Stream kalite takibi ve optimizasyonu
- **Whiteboard Integration**: Gerçek zamanlı beyaz tahta senkronizasyonu

### 🚀 Teknik Özellikler
- **Vue 3 + Vite**: Modern frontend stack
- **TypeScript Ready**: jsconfig.json ile tip desteği
- **Modular Structure**: Barrel export pattern
- **Event-Driven Architecture**: Central event emitter sistemi

## 🏗️ Proje Yapısı

```
v5/
├── src/
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
├── docs/                        # Detaylı dokümantasyon
├── logs/                        # Log dosyaları (localFolder mode)
└── public/                      # Public assets
```

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+ 
- npm v9+

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

### Beyaz Tahta
- Beyaz tahta butonuna tıkla
- Çizim araçlarını kullan
- Gerçek zamanlı senkronizasyon

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
- `useNetlessWhiteboard`: Beyaz tahta yönetimi
- `useTheme`: Tema sistemi yönetimi
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

## 🗺️ Roadmap & Gelecek Özellikler

### 🎨 **UI/UX İyileştirmeleri**
- [ ] **Gelişmiş Tema Sistemi**: Daha fazla özelleştirilebilir tema seçenekleri
- [ ] **Dark/Light Mode Toggle**: Dinamik tema değiştirme butonu
- [ ] **Responsive İyileştirmeler**: Mobile-first tasarım optimizasyonları
- [ ] **Loading States**: Daha güzel loading animasyonları ve progress bar'lar

### 📱 **Yeni Özellikler**
- [ ] **Chat Sistemi**: Gerçek zamanlı metin mesajlaşma
- [ ] **File Sharing**: Dosya paylaşım sistemi
- [ ] **Background Effects**: Virtual background, blur effects
- [ ] **Picture-in-Picture**: Küçük pencerede video görüntüleme
- [ ] **Polls/Voting**: Anket ve oylama sistemi

### 🔧 **Developer Experience**
- [ ] **TypeScript Support**: Type safety için TypeScript entegrasyonu
- [ ] **Storybook**: Component dokümantasyonu ve test ortamı
- [ ] **Testing**: Unit test ve E2E test yazma
- [ ] **ESLint/Prettier**: Kod kalitesi için linting rules

### 🌐 **Entegrasyonlar**
- [ ] **API Genişletmeleri**: Recording API, Analytics API
- [ ] **Third-party Entegrasyonları**: YouTube Live, Twitch streaming
- [ ] **Calendar Integration**: Google Calendar, Outlook entegrasyonu
- [ ] **SSO Authentication**: Single Sign-On sistemi

### 📊 **Analytics & Monitoring**
- [ ] **Real-time Analytics**: Katılımcı istatistikleri, bağlantı kalitesi
- [ ] **Error Tracking**: Sentry veya benzeri error monitoring
- [ ] **Performance Monitoring**: Sayfa yüklenme süreleri, API response times
- [ ] **Usage Statistics**: Kullanım raporları ve dashboard

### 🎯 **Performans Optimizasyonları**
- [ ] **Code Splitting**: Lazy loading ve bundle optimization
- [ ] **CDN Integration**: Static asset'ler için CDN kullanımı
- [ ] **Service Worker**: Offline support ve caching
- [ ] **Memory Optimization**: Memory leak'lerin önlenmesi

### 🔒 **Güvenlik & Privacy**
- [ ] **End-to-End Encryption**: Gelişmiş şifreleme
- [ ] **Room Password**: Oda şifre koruması
- [ ] **Waiting Room**: Host onayı ile giriş sistemi
- [ ] **Privacy Controls**: Kamera/mikrofon izin yönetimi

### 🌍 **Internationalization**
- [ ] **Multi-language Support**: Türkçe, İngilizce, diğer diller
- [ ] **RTL Support**: Arapça, İbranice gibi sağdan sola diller
- [ ] **Locale-specific Features**: Bölgesel özellikler

### 🏆 **Öncelikli Geliştirmeler**
1. **Chat Sistemi** - Kolay implementasyon, yüksek fayda
2. **TypeScript Desteği** - Kod kalitesi ve maintainability
3. **Gelişmiş Tema Sistemi** - Kullanıcı deneyimi
4. **Unit Testing** - Kod güvenilirliği

## 📚 Detaylı Dokümantasyon

Daha detaylı bilgi için [docs/README.md](docs/README.md) dosyasına bakın.

## 📞 İletişim

- **Proje Linki**: [https://github.com/umranterece/v5](https://github.com/umranterece/v5)
- **Issues**: [GitHub Issues](https://github.com/umranterece/v5/issues)
- **Geliştirici**: Umran Terece
- **Website**: [rehberimsensin.com](https://rehberimsensin.com)

---

⭐ Bu projeyi beğendiysen yıldız vermeyi unutma!