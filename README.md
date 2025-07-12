# 🎥 Agora Video Konferans Uygulaması

Vue 3 ve Agora SDK kullanarak geliştirilmiş modern, modüler ve ölçeklenebilir video konferans uygulaması.

## 🚀 Özellikler

### 📹 Video Konferans
- **Gerçek zamanlı video/audio streaming**
- **Çoklu katılımcı desteği** (sınırsız)
- **Otomatik video kalitesi ayarlama**
- **Ekran paylaşımı** (tam ekran, pencere, sekme)
- **Video grid düzeni** (otomatik boyutlandırma)
- **Katılımcı listesi** ve durum göstergeleri

### 🎙️ Ses Yönetimi
- **Mikrofon açma/kapama**
- **Hoparlör açma/kapama**
- **Ses seviyesi göstergeleri**
- **Otomatik ses algılama**

### 📺 Ekran Paylaşımı
- **Tam ekran paylaşımı**
- **Pencere paylaşımı**
- **Sekme paylaşımı**
- **Paylaşım durumu göstergeleri**

### 🎬 Cloud Recording
- **Otomatik kayıt başlatma/durdurma**
- **Çoklu format desteği** (HLS, MP4)
- **Kayıt dosyası yönetimi**
- **Kayıt durumu takibi**
- **Dosya indirme**

### 📊 Ağ Kalitesi İzleme
- **Gerçek zamanlı ağ metrikleri**
- **Upload/Download hızı**
- **Ping değeri**
- **Paket kaybı oranı**
- **Kalite skoru**
- **2 saniyede bir güncelleme**

### 🔧 Geliştirici Araçları
- **Detaylı log sistemi**
- **Event tracking**
- **Hata yakalama**
- **Debug modu**
- **Performans metrikleri**

### 🎨 Kullanıcı Arayüzü
- **Modern ve responsive tasarım**
- **Türkçe arayüz**
- **Dark/Light tema desteği**
- **Mobil uyumlu**
- **Erişilebilirlik standartları**

## 🏗️ Mimari

### Modüler Yapı
```
src/modules/agora/
├── components/          # Vue bileşenleri
├── composables/         # Vue 3 composables
├── services/           # API servisleri
├── store/              # State management
├── constants.js        # Sabitler
├── centralEmitter.js   # Event yönetimi
├── types.js           # TypeScript tipleri
└── index.js           # Barrel exports
```

### Teknolojiler
- **Vue 3** - Progressive JavaScript framework
- **Agora SDK** - Real-time communication
- **Vite** - Build tool
- **Pinia** - State management
- **EventEmitter** - Event handling

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Agora hesabı ve API anahtarları

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone <repository-url>
cd v5
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Agora konfigürasyonu**
```bash
# src/modules/agora/constants.js dosyasını düzenleyin
const AGORA_CONFIG = {
  appId: 'YOUR_AGORA_APP_ID',
  token: 'YOUR_AGORA_TOKEN'
}
```

4. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
```

5. **Tarayıcıda açın**
```
http://localhost:5173
```

## 📖 Kullanım

### Temel Kullanım

1. **Odaya katılma**
   - Oda adını girin
   - "Odaya Katıl" butonuna tıklayın

2. **Video/Audio kontrolü**
   - Mikrofon açma/kapama: 🎤 butonu
   - Kamera açma/kapama: 📹 butonu
   - Hoparlör açma/kapama: 🔊 butonu

3. **Ekran paylaşımı**
   - "Ekran Paylaş" butonuna tıklayın
   - Paylaşmak istediğiniz ekranı seçin

4. **Kayıt**
   - "Kayıt Başlat" butonuna tıklayın
   - Kayıt durumunu takip edin

### Gelişmiş Özellikler

#### Ağ Kalitesi İzleme
- Sağ üst köşedeki ağ kalitesi widget'ını kullanın
- Gerçek zamanlı metrikleri görüntüleyin
- Kalite skorunu takip edin

#### Log Sistemi
- "Loglar" butonuna tıklayın
- Detaylı logları görüntüleyin
- Hata ayıklama için kullanın

## 🔧 Konfigürasyon

### Agora Ayarları
```javascript
// src/modules/agora/constants.js
export const AGORA_CONFIG = {
  appId: 'your-app-id',
  token: 'your-token',
  channel: 'test-channel',
  uid: 0 // 0 = otomatik UID atama
}
```

### Recording Ayarları
```javascript
// src/modules/agora/composables/useRecording.js
const recordingConfig = {
  maxIdleTime: 30,
  streamTypes: 2, // Audio + Video
  channelType: 1, // Live streaming
  recordingFileConfig: {
    avFileType: ['hls', 'mp4'],
    fileCompress: false,
    fileMaxSizeMB: 512
  }
}
```

## 🧪 Test

### Birim Testleri
```bash
npm run test:unit
```

### E2E Testleri
```bash
npm run test:e2e
```

### Manuel Test
```bash
# İki farklı tarayıcıda açın
# Aynı oda adıyla katılın
# Video/audio test edin
```

## 📦 Build

### Production Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## 🐛 Hata Ayıklama

### Log Sistemi
- Console'da detaylı loglar
- UI'da log modalı
- Hata tracking

### Debug Modu
```javascript
// constants.js
export const DEBUG_MODE = true
```

### Yaygın Sorunlar

1. **Video görünmüyor**
   - Kamera izinlerini kontrol edin
   - HTTPS kullanın
   - Agora token'ını kontrol edin

2. **Ses gelmiyor**
   - Mikrofon izinlerini kontrol edin
   - Tarayıcı ses ayarlarını kontrol edin
   - Agora konfigürasyonunu kontrol edin

3. **Ekran paylaşımı çalışmıyor**
   - HTTPS kullanın
   - Tarayıcı izinlerini kontrol edin
   - Ekran paylaşım API'sini kontrol edin

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### Kod Standartları
- ESLint kurallarına uyun
- Prettier formatını kullanın
- Türkçe yorum yazın
- Modüler yapıyı koruyun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🙏 Teşekkürler

- [Agora.io](https://agora.io) - Real-time communication SDK
- [Vue.js](https://vuejs.org) - Progressive JavaScript framework
- [Vite](https://vitejs.dev) - Next generation frontend tooling

## 📞 Destek

- **Email**: support@example.com
- **GitHub Issues**: [Proje Issues](https://github.com/username/project/issues)
- **Dokümantasyon**: [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)

## 🔄 Changelog

Detaylı değişiklik geçmişi için [CHANGELOG.md](./CHANGELOG.md) dosyasına bakın.

---

**Not**: Bu proje geliştirme aşamasındadır. Production kullanımı için ek güvenlik ve performans optimizasyonları gerekebilir.
