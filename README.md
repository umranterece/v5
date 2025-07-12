# 🎥 Agora Video Konferans Uygulaması

Modern Vue 3 tabanlı video konferans uygulaması. Agora SDK ile geliştirilmiş, gerçek zamanlı ağ kalitesi izleme ve cloud recording özellikleri içerir.

## 🚀 Hızlı Başlangıç

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

### Environment Variables

```bash
# .env dosyası oluşturun
VITE_AGORA_APP_ID=your_agora_app_id
VITE_AGORA_TOKEN_SERVER=your_token_server_url
```

## ✨ Özellikler

- 🎥 **Gerçek Zamanlı Video Konferans**
- 🖥️ **Ekran Paylaşımı**
- 📊 **Ağ Kalitesi İzleme**
- 🎬 **Cloud Recording**
- 📱 **Responsive Tasarım**
- 🇹🇷 **Türkçe Arayüz**

## 🏗️ Mimari

```
src/modules/agora/
├── components/          # UI bileşenleri
├── composables/         # Vue 3 composables
├── services/           # API servisleri
├── store/              # State yönetimi
├── constants.js        # Sabitler
└── centralEmitter.js   # Event sistemi
```

## 📚 Dokümantasyon

Detaylı teknik dokümantasyon için [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md) dosyasını inceleyin.

## 🛠️ Teknolojiler

- **Vue 3** - Modern reactive framework
- **Agora SDK** - Gerçek zamanlı iletişim
- **Vite** - Hızlı build tool
- **Tailwind CSS** - Utility-first CSS

## 📄 Lisans

MIT License

---

**Geliştirici**: [İsim]  
**Email**: [email@example.com]
