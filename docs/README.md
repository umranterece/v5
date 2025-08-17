# 🚀 Agora Video Conference v5

Modern, responsive ve yüksek performanslı video konferans uygulaması. Vue 3, Agora SDK ve gelişmiş grid layout sistemi ile geliştirildi.

## ✨ Öne Çıkan Özellikler

### 🎯 **Akıllı Grid Layout Sistemi**
- **Ekran Oranına Göre Optimizasyon**: Portrait/Landscape modlarında otomatik grid düzenleme
- **2 Kişi Eşit Bölünme**: Video item'lar mükemmel şekilde eşit boyutlarda
- **Farklı İçerik Türleri Desteği**: Local kamera, local screen, remote camera, remote screen için optimize edilmiş layout
- **Responsive Tasarım**: Tüm ekran boyutlarında mükemmel görünüm
- **Real-time Adaptasyon**: Ekran boyutu değiştiğinde otomatik grid güncelleme

### 🎥 **Video Konferans Özellikleri**
- HD video kalitesi ve düşük latency
- Ekran paylaşımı ve kayıt
- Çoklu layout seçenekleri (Grid, Spotlight, Presentation)
- Tema sistemi (Light/Dark mode)
- Çoklu dil desteği

### 🔧 **Teknik Özellikler**
- Vue 3 Composition API
- Agora RTC SDK entegrasyonu
- Modular mimari
- TypeScript desteği
- Vite build sistemi

## 🚀 Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Development server'ı başlat
npm run dev

# Production build
npm run build
```

## 📱 Responsive Grid Layout

### **2 Kişi Layout**
- **Portrait**: 1 sütun × 2 satır (alta alta)
- **Landscape**: 2 sütun × 1 satır (yan yana)

### **3-4 Kişi Layout**
- **Portrait**: 2 sütun × 2 satır
- **Landscape**: 3-4 sütun × 1 satır

### **5+ Kişi Layout**
- Akıllı grid hesaplama ile optimize edilmiş layout
- Ekran boyutuna göre otomatik sütun/satır ayarlama

## 🎨 Tema Sistemi

- **Light Mode**: Açık tema
- **Dark Mode**: Koyu tema
- **Auto Mode**: Sistem temasına göre otomatik değişim

## 📚 Dokümantasyon

- [🚀 Başlangıç Rehberi](GETTING_STARTED.md)
- [🏗️ Mimari Dokümantasyonu](ARCHITECTURE.md)
- [🎯 Grid Layout Rehberi](RESPONSIVE_DESIGN.md)
- [🎥 Video Konferans Özellikleri](VIDEO_CONFERENCE.md)
- [🖥️ Ekran Paylaşımı](SCREEN_SHARING.md)
- [📱 UI Bileşenleri](UI_COMPONENTS.md)
- [🔧 Geliştirici Rehberi](DEVELOPMENT.md)
- [🧪 Test Rehberi](TESTING.md)
- [🚀 Performans Optimizasyonu](PERFORMANCE.md)

## 🔧 Geliştirme

```bash
# Lint kontrolü
npm run lint

# Test çalıştırma
npm run test

# Type check
npm run type-check
```

## 📱 Desteklenen Platformlar

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Chrome Mobile
- **Tablet**: iPad, Android Tablet

## 🤝 Katkıda Bulunma

Katkıda bulunmak için [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını inceleyin.

## 📄 Lisans

MIT License

## 🆘 Destek

Sorunlar için [TROUBLESHOOTING.md](TROUBLESHOOTING.md) dosyasını kontrol edin veya issue açın.

---

**Geliştirici**: Umran Terece  
**Versiyon**: v5.0.0  
**Son Güncelleme**: 2025-01-09
