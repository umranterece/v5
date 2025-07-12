# Changelog

Tüm önemli değişiklikler bu dosyada belgelenecektir.

Format [Keep a Changelog](https://keepachangelog.com/tr/1.0.0/) standardına uygun olacaktır.

## [Unreleased]

### Added
- Gerçek zamanlı ağ kalitesi izleme sistemi
- Cloud recording entegrasyonu
- Merkezi event sistemi (centralEmitter)
- Türkçe teknik dokümantasyon
- Modüler mimari refactoring

### Changed
- Event yönetimi merkezi hale getirildi
- Ağ kalitesi widget'ı gerçek verilerle çalışıyor
- RecordingControls sidebar'a taşındı

### Fixed
- CentralEmitter import hataları düzeltildi
- Logger fonksiyonları düzeltildi
- Event deduplication sistemi iyileştirildi

## [1.0.0] - 2025-01-09

### Added
- Vue 3 Composition API tabanlı video konferans uygulaması
- Agora SDK entegrasyonu
- Ekran paylaşımı özelliği
- Responsive video grid
- Kamera ve mikrofon kontrolleri
- Kullanıcı yönetimi
- Log sistemi
- Türkçe arayüz

### Features
- Gerçek zamanlı video/audio konferans
- Ekran paylaşımı
- Kullanıcı katılma/ayrılma yönetimi
- Cihaz durumu kontrolü
- Event-driven mimari
- Modüler yapı

### Technical
- Vue 3 Composition API
- Vite build tool
- Tailwind CSS
- Mitt event emitter
- Custom store yönetimi
- JSDoc dokümantasyonu

---

## Versiyonlama

Bu proje [Semantic Versioning](https://semver.org/lang/tr/) kullanır:

- **MAJOR**: Uyumsuz API değişiklikleri
- **MINOR**: Geriye uyumlu yeni özellikler
- **PATCH**: Geriye uyumlu hata düzeltmeleri

## Katkıda Bulunma

Yeni özellikler veya değişiklikler eklerken, bu dosyayı güncellemeyi unutmayın. 