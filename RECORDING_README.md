# 🎥 Agora Composite Recording System

Bu proje, Agora Cloud Recording API kullanarak **composite recording** (tek dosyada tüm stream'ler) yapabilen profesyonel bir kayıt sistemi içerir.

## ✨ Özellikler

### 🔄 **Composite Recording**
- **Tek dosyada tüm stream'ler**: Audio, video, screen share ve whiteboard
- **Gerçek zamanlı kayıt**: Canlı yayın sırasında kesintisiz kayıt
- **Otomatik senkronizasyon**: Tüm stream'ler otomatik olarak senkronize edilir

### 🗄️ **Storage Provider Seçimi**
- **Azure Storage**: Microsoft Azure Blob Storage desteği
- **Custom Server**: Kendi sunucunuza kayıt yapabilme
- **Tek ayar ile değiştirme**: `STORAGE_PROVIDER` ayarı ile kolay geçiş

### 🎯 **Recording Perspectives**
- **Host (Kapsamlı)**: Tüm içerik, chat, participant list dahil
- **Audience (Önemli)**: Sadece önemli içerik ve whiteboard
- **Whiteboard (Odaklı)**: Sadece whiteboard odaklı kayıt

### 🎨 **Quality Settings**
- **High (1080p)**: 30 FPS, 2-4 Mbps bitrate
- **Medium (720p)**: 24 FPS, 1-2 Mbps bitrate  
- **Low (480p)**: 15 FPS, 0.5-1 Mbps bitrate

### 🎨 **Whiteboard Integration**
- **Netless Fastboard**: Gerçek zamanlı collaborative whiteboard
- **Vector format**: SVG formatında en küçük boyut
- **Cursor tracking**: Fare imleci ve tool değişimleri dahil

## 🏗️ **Sistem Mimarisi**

```
Frontend (Vue 3)                    Backend (PHP)                    Agora Cloud
     │                                    │                              │
     │  Recording Settings                │                              │
     │  Storage Provider                  │                              │
     │  Perspective/Quality              │                              │
     │                                    │                              │
     ├─ useRecording() ──────────────────┼─ recording.php ──────────────┼─ Agora API
     │  Composite Config                  │  AgoraRecordingService      │  Cloud Recording
     │  Storage Selection                 │  StorageService             │  Resource Management
     │  Whiteboard Integration           │  Logger                      │  File Generation
     │                                    │                              │
     └─ InfoModal                        └─ config.php                  └─ Azure/Custom
        Recording Controls                    Configuration                  Storage
```

## 🚀 **Kurulum**

### 1. **Frontend Dependencies**
```bash
npm install
```

### 2. **Backend Setup**
```bash
# PHP dosyalarını hosting'e yükle
recording.php
config.php

# Gerekli dizinleri oluştur
mkdir logs cache backups recordings
chmod 755 logs cache backups recordings
```

### 3. **Configuration**
`config.php` dosyasında:
```php
// Agora Credentials
define('AGORA_APP_ID', 'your_agora_app_id');
define('AGORA_APP_CERTIFICATE', 'your_agora_app_certificate');

// Azure Storage
define('AZURE_STORAGE_CONNECTION_STRING', 'your_connection_string');
define('AZURE_STORAGE_ACCESS_KEY', 'your_access_key');
define('AZURE_STORAGE_SECRET_KEY', 'your_secret_key');

// Custom Server
define('CUSTOM_RECORDING_ENDPOINT', 'https://your-server.com/api');
define('CUSTOM_RECORDING_API_KEY', 'your_api_key');
```

## 📱 **Kullanım**

### **Recording Başlatma**
```javascript
// useRecording composable
const { startRecording, setStorageProvider, setRecordingPerspective } = useRecording()

// Storage provider seç
setStorageProvider('azure') // veya 'custom'

// Perspective seç
setRecordingPerspective('host') // 'host', 'audience', 'whiteboard'

// Quality seç
setRecordingQuality('high') // 'high', 'medium', 'low'

// Recording başlat
const result = await startRecording({
  channelName: 'my-channel',
  uid: 12345,
  token: 'agora-token'
})
```

### **Recording Durdurma**
```javascript
const { stopRecording } = useRecording()
const result = await stopRecording()
```

### **Recording Durumu**
```javascript
const { recordingStatus, isRecording, recordingFiles } = useRecording()

// Status: 'IDLE', 'STARTING', 'RECORDING', 'STOPPING', 'ERROR'
console.log('Recording status:', recordingStatus.value)
console.log('Is recording:', isRecording.value)
console.log('Files:', recordingFiles.value)
```

## 🔧 **API Endpoints**

### **Start Recording**
```http
POST /recording.php
{
  "action": "start",
  "channelName": "my-channel",
  "uid": 12345,
  "token": "agora-token",
  "storageProvider": "azure",
  "perspective": "host",
  "quality": "medium"
}
```

### **Stop Recording**
```http
POST /recording.php
{
  "action": "stop",
  "recordingId": "recording-sid-123"
}
```

### **Query Recording**
```http
POST /recording.php
{
  "action": "query",
  "recordingId": "recording-sid-123"
}
```

### **List Recordings**
```http
GET /recording.php?action=list
```

### **Download Recording**
```http
POST /recording.php
{
  "action": "download",
  "fileId": "file-123"
}
```

## 🎨 **Whiteboard Recording**

### **Netless Integration**
```javascript
// Whiteboard recording otomatik olarak dahil
const whiteboardConfig = {
  enabled: true,
  format: 'svg',
  captureMode: 'realtime',
  includeCursor: true,
  includeToolChanges: true,
  includeTimestamps: true,
  frameRate: 30
}
```

### **Tool Support**
- ✅ Pencil, Rectangle, Circle, Triangle
- ✅ Text, Eraser, Selector
- ✅ Color changes, Stroke width
- ✅ Real-time collaboration

## 📊 **Monitoring & Logging**

### **Log Files**
```
logs/
├── recording.log          # Recording işlemleri
├── php_errors.log        # PHP hataları
└── access.log            # API erişimleri
```

### **Log Levels**
- **DEBUG**: Detaylı debug bilgileri
- **INFO**: Genel bilgiler
- **WARN**: Uyarılar
- **ERROR**: Hatalar
- **FATAL**: Kritik hatalar

## 🔒 **Security**

### **API Protection**
- Rate limiting: 100 request/minute
- CORS configuration
- API key validation (optional)
- IP filtering (optional)

### **Storage Security**
- Azure Storage: Shared Access Signatures
- Custom Server: API key authentication
- Encrypted file transfer
- Secure file deletion

## 📈 **Performance**

### **Optimization**
- **Concurrent recordings**: Max 10 eş zamanlı
- **File compression**: Otomatik sıkıştırma
- **Chunked uploads**: Büyük dosyalar için
- **Background processing**: Async file processing

### **Resource Management**
- **Memory limit**: 512MB
- **Execution timeout**: 5 minutes
- **File size limit**: 512MB per file
- **Retention policy**: 30 days

## 🚨 **Error Handling**

### **Common Errors**
```javascript
// Network errors
if (error.message.includes('network')) {
  // Retry logic
}

// Permission errors
if (error.name === 'NotAllowedError') {
  // User permission denied
}

// Storage errors
if (error.message.includes('storage')) {
  // Storage provider issue
}
```

### **Retry Logic**
```javascript
const maxRetries = 3
const retryDelay = 1000

for (let i = 0; i < maxRetries; i++) {
  try {
    const result = await startRecording(config)
    return result
  } catch (error) {
    if (i === maxRetries - 1) throw error
    await new Promise(resolve => setTimeout(resolve, retryDelay))
  }
}
```

## 🔄 **Migration Guide**

### **From Individual to Composite**
```javascript
// Eski (Individual Recording)
const oldConfig = {
  mode: 'individual',
  streamTypes: 2,
  subscribeAudioUids: [123, 456],
  subscribeVideoUids: [123, 456]
}

// Yeni (Composite Recording)
const newConfig = {
  mode: 'composite',
  streamTypes: 2,
  subscribeUidGroup: 0, // Tüm kullanıcılar
  whiteboard: { enabled: true }
}
```

## 📝 **Configuration Examples**

### **Azure Storage**
```php
define('STORAGE_PROVIDER', 'azure');
define('AZURE_STORAGE_CONTAINER', 'whiteboard-recordings');
define('AZURE_STORAGE_REGION', 'eastus');
```

### **Custom Server**
```php
define('STORAGE_PROVIDER', 'custom');
define('CUSTOM_RECORDING_ENDPOINT', 'https://api.yourdomain.com/recording');
define('CUSTOM_RECORDING_API_KEY', 'your-secret-key');
```

### **High Quality Recording**
```javascript
const highQualityConfig = {
  quality: 'high',
  perspective: 'host',
  storageProvider: 'azure',
  whiteboard: {
    enabled: true,
    format: 'svg',
    frameRate: 60
  }
}
```

## 🧪 **Testing**

### **Local Testing**
```bash
# PHP development server
php -S localhost:8000

# Test recording
curl -X POST http://localhost:8000/recording.php \
  -H "Content-Type: application/json" \
  -d '{"action":"start","channelName":"test","uid":123,"token":"test"}'
```

### **Unit Tests**
```bash
# PHPUnit tests (if available)
./vendor/bin/phpunit tests/RecordingServiceTest.php
```

## 📚 **API Documentation**

### **Agora Cloud Recording**
- [Official Documentation](https://docs.agora.io/en/cloud-recording/landing-page)
- [API Reference](https://docs.agora.io/en/cloud-recording/API%20Reference/cloud_recording_api_rest)
- [Best Practices](https://docs.agora.io/en/cloud-recording/cloud_recording_best_practices)

### **Azure Storage**
- [Blob Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- [Shared Access Signatures](https://docs.microsoft.com/en-us/azure/storage/common/storage-sas-overview)

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details

## 🆘 **Support**

- **Issues**: GitHub Issues
- **Documentation**: [Wiki](https://github.com/your-repo/wiki)
- **Email**: support@yourdomain.com

---

**🎉 Composite Recording sistemi hazır! Artık tek dosyada tüm stream'leri kaydedebilir, Azure Storage veya Custom Server kullanabilir, farklı perspektiflerden kayıt yapabilirsiniz.**
