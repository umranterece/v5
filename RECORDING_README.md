# 🎥 Agora Cloud Recording Sistemi

Bu proje, Vue 3 ve Agora SDK kullanarak geliştirilmiş profesyonel video konferans uygulamasına Cloud Recording özelliği ekler.

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [API Dokümantasyonu](#api-dokümantasyonu)
- [Konfigürasyon](#konfigürasyon)
- [Güvenlik](#güvenlik)
- [Performans](#performans)
- [Sorun Giderme](#sorun-giderme)

## ✨ Özellikler

### 🎯 Temel Özellikler
- **Cloud Recording**: Sunucu tarafında yüksek kaliteli kayıt
- **Çoklu Format**: HLS ve MP4 formatlarında kayıt
- **Gerçek Zamanlı Durum**: Recording durumu ve progress takibi
- **Dosya Yönetimi**: Kayıt dosyalarını listeleme ve indirme
- **Hata Yönetimi**: Kapsamlı hata yakalama ve retry mekanizması

### 🎨 UI/UX Özellikleri
- **Modern Arayüz**: Responsive ve kullanıcı dostu tasarım
- **Progress Bar**: Gerçek zamanlı kayıt ilerlemesi
- **Durum Göstergeleri**: Visual feedback ve animasyonlar
- **Dosya Listesi**: Kayıt dosyalarını görüntüleme ve yönetme

### 🔧 Teknik Özellikler
- **Modüler Mimari**: Composable ve service tabanlı yapı
- **Event Sistemi**: Merkezi event management
- **Reactive State**: Vue 3 Composition API ile reactive state
- **Type Safety**: JSDoc ile tip güvenliği
- **Performance**: Optimized rendering ve memory management

## 🚀 Kurulum

### 1. Gereksinimler
```bash
# Node.js 16+ ve npm gerekli
node --version
npm --version
```

### 2. Proje Kurulumu
```bash
# Projeyi klonla
git clone <repository-url>
cd v5

# Bağımlılıkları yükle
npm install

# Development server'ı başlat
npm run dev
```

### 3. Agora Konfigürasyonu
```javascript
// src/modules/agora/constants.js
export const AGORA_CONFIG = {
  appId: 'YOUR_AGORA_APP_ID',
  appCertificate: 'YOUR_AGORA_APP_CERTIFICATE',
  // ... diğer ayarlar
}
```

### 4. Backend API Kurulumu
```bash
# PHP dosyasını sunucunuza yükleyin
# recording-api-example.php dosyasını web sunucunuza kopyalayın
# Agora credentials'larını güncelleyin
```

## 📖 Kullanım

### Temel Kullanım
```vue
<template>
  <div>
    <!-- Recording Controls Component -->
    <RecordingControls />
  </div>
</template>

<script setup>
import { RecordingControls } from './modules/agora'
</script>
```

### Composable Kullanımı
```javascript
import { useRecording } from './modules/agora'

const {
  isRecording,
  recordingStatus,
  recordingFiles,
  startRecording,
  stopRecording,
  downloadRecordingFile
} = useRecording()

// Recording başlat
await startRecording({
  channelName: 'test-channel',
  maxIdleTime: 30,
  streamTypes: 2 // Audio + Video
})

// Recording durdur
await stopRecording()

// Dosya indir
await downloadRecordingFile('file-id')
```

## 🔌 API Dokümantasyonu

### Recording Service

#### `startRecording(config)`
Recording başlatır.

**Parametreler:**
- `config` (Object): Recording konfigürasyonu
  - `channelName` (String): Kanal adı
  - `maxIdleTime` (Number): Maksimum boşluk süresi (saniye)
  - `streamTypes` (Number): Stream türleri (1: Audio, 2: Audio+Video)
  - `subscribeAudioUids` (Array): Kaydedilecek audio UID'leri
  - `subscribeVideoUids` (Array): Kaydedilecek video UID'leri

**Dönüş:**
```javascript
{
  success: true,
  recordingId: 'recording-sid',
  message: 'Recording started successfully'
}
```

#### `stopRecording()`
Recording durdurur.

**Dönüş:**
```javascript
{
  success: true,
  files: [
    {
      fileId: 'file-id',
      fileName: 'recording.mp4',
      fileSize: 1024000,
      duration: 3600
    }
  ],
  message: 'Recording stopped successfully'
}
```

#### `getRecordingStatus()`
Recording durumunu sorgular.

**Dönüş:**
```javascript
{
  success: true,
  status: 'RECORDING',
  isRecording: true,
  files: []
}
```

#### `listRecordingFiles()`
Tüm recording dosyalarını listeler.

**Dönüş:**
```javascript
[
  {
    fileId: 'file-id',
    fileName: 'recording.mp4',
    fileSize: 1024000,
    duration: 3600,
    createdAt: '2024-01-15T10:00:00Z'
  }
]
```

#### `downloadRecordingFile(fileId)`
Recording dosyasını indirir.

**Parametreler:**
- `fileId` (String): Dosya ID'si

**Dönüş:**
```javascript
{
  success: true,
  downloadUrl: 'https://example.com/download/file-id',
  fileName: 'recording.mp4'
}
```

### Recording Composable

#### Reactive State
```javascript
const {
  // State
  isRecording,           // Boolean: Recording durumu
  recordingStatus,       // String: Status (IDLE, STARTING, RECORDING, STOPPING, ERROR)
  recordingId,           // String: Recording ID
  recordingFiles,        // Array: Recording dosyaları
  recordingError,        // String: Hata mesajı
  recordingProgress,     // Number: Progress yüzdesi (0-100)
  recordingDuration,     // Number: Recording süresi (ms)
  
  // Computed
  canStartRecording,     // Boolean: Başlatma butonu aktif mi
  canStopRecording,      // Boolean: Durdurma butonu aktif mi
  recordingStatusText,   // String: Kullanıcı dostu durum metni
  hasRecordingFiles,     // Boolean: Dosya var mı
  
  // Methods
  startRecording,        // Function: Recording başlat
  stopRecording,         // Function: Recording durdur
  getRecordingStatus,    // Function: Durum sorgula
  listRecordingFiles,    // Function: Dosyaları listele
  downloadRecordingFile, // Function: Dosya indir
  resetRecording         // Function: Durumu sıfırla
} = useRecording()
```

## ⚙️ Konfigürasyon

### Recording Konfigürasyonu
```javascript
const recordingConfig = {
  // Temel ayarlar
  maxIdleTime: 30,           // 30 saniye boşluk sonrası otomatik durdurma
  streamTypes: 2,            // Audio + Video
  channelType: 1,            // Live streaming
  
  // Abone olma ayarları
  subscribeAudioUids: [],    // Tüm audio'ları kaydet
  subscribeVideoUids: [],    // Tüm video'ları kaydet
  subscribeUidGroup: 0,      // Tüm kullanıcıları kaydet
  
  // Dosya ayarları
  recordingFileConfig: {
    avFileType: ['hls', 'mp4'], // HLS ve MP4 formatları
    fileCompress: false,        // Sıkıştırma kapalı
    fileMaxSizeMB: 512          // Maksimum dosya boyutu
  },
  
  // Depolama ayarları
  storageConfig: {
    vendor: 0,              // Agora Cloud Storage
    region: 0,              // Global
    bucket: 'agora-recording-bucket',
    accessKey: 'YOUR_ACCESS_KEY',
    secretKey: 'YOUR_SECRET_KEY'
  }
}
```

### Environment Variables
```bash
# .env dosyası
VITE_AGORA_APP_ID=your_app_id
VITE_AGORA_APP_CERTIFICATE=your_app_certificate
VITE_AGORA_CUSTOMER_ID=your_customer_id
VITE_AGORA_CUSTOMER_SECRET=your_customer_secret
```

## 🔒 Güvenlik

### API Güvenliği
- **Authentication**: Basic Auth ile API koruması
- **CORS**: Cross-origin request kontrolü
- **Input Validation**: Tüm input'ların doğrulanması
- **Error Handling**: Güvenli hata mesajları

### Dosya Güvenliği
- **Access Control**: Dosya erişim kontrolü
- **Temporary URLs**: Geçici indirme URL'leri
- **File Validation**: Dosya türü ve boyut kontrolü

## ⚡ Performans

### Optimizasyonlar
- **Lazy Loading**: Component'lerin ihtiyaç halinde yüklenmesi
- **Debouncing**: API çağrılarının optimize edilmesi
- **Caching**: Recording durumu önbellekleme
- **Memory Management**: Reactive state temizliği

### Monitoring
- **Progress Tracking**: Gerçek zamanlı ilerleme takibi
- **Error Tracking**: Hata loglama ve raporlama
- **Performance Metrics**: API response time takibi

## 🐛 Sorun Giderme

### Yaygın Sorunlar

#### 1. Recording Başlatılamıyor
```javascript
// Hata: "Failed to acquire resource"
// Çözüm: Agora credentials'larını kontrol edin
console.log('App ID:', AGORA_CONFIG.appId)
console.log('Customer ID:', AGORA_CONFIG.customerId)
```

#### 2. Dosya İndirilemiyor
```javascript
// Hata: "File not found"
// Çözüm: Dosya ID'sini ve URL'yi kontrol edin
const files = await listRecordingFiles()
console.log('Available files:', files)
```

#### 3. Network Hatası
```javascript
// Hata: "Network error"
// Çözüm: API endpoint'ini ve internet bağlantısını kontrol edin
const apiUrl = API_ENDPOINTS.CREATE_TOKEN.replace('createToken.php', 'recording.php')
console.log('API URL:', apiUrl)
```

### Debug Modu
```javascript
// Development'ta debug logları aktif
if (IS_DEV) {
  console.log('Recording Debug Mode Active')
  logger.logDebug('Recording state:', recordingStatus.value)
}
```

### Log Sistemi
```javascript
// Logları kontrol et
logger.logUI('Recording started', 'RECORDING')
logger.logError('Recording error:', error, 'RECORDING')
logger.logDebug('Recording config:', config, 'RECORDING')
```

## 📚 Ek Kaynaklar

- [Agora Cloud Recording API](https://docs.agora.io/en/cloud-recording/cloud_recording_api_rest)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Agora SDK Documentation](https://docs.agora.io/en/Video/API%20Reference/web/index.html)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 Destek

Sorularınız için:
- 📧 Email: support@example.com
- 💬 Discord: [Agora Community](https://discord.gg/agora)
- 📖 Documentation: [Agora Docs](https://docs.agora.io)

---

**Not**: Bu sistem production kullanımı için ek güvenlik önlemleri ve test süreçleri gerektirir. 