# Vue 3 Agora Video Conference Module

🚀 **Sektör standartlarının üstünde, tam çalışır Vue 3 Agora modülü**

Bu proje, Vue 3 ve Agora SDK kullanarak geliştirilmiş, modüler ve taşınabilir bir video konferans uygulamasıdır. Sektör standartlarının üstünde performans, kullanıcı deneyimi ve kod kalitesi sunar.

## ✨ Özellikler

### 🎥 Video/Audio Konferans
- **HD Video Kalitesi**: 1080p, 720p, 480p, 360p desteği
- **Gelişmiş Ses**: Music standard, speech standard, stereo ses
- **Akıllı Grid Layout**: Otomatik video grid düzeni
- **Network Quality**: Gerçek zamanlı bağlantı kalitesi göstergesi
- **Device Management**: Kamera, mikrofon, hoparlör yönetimi

### 🖥️ Ekran Paylaşımı
- **Tam Ekran Paylaşımı**: Tüm ekran veya uygulama penceresi
- **Yüksek Kalite**: 1080p ekran paylaşım kalitesi
- **Gerçek Zamanlı**: Düşük gecikme ile ekran paylaşımı
- **Otomatik Algılama**: Ekran paylaşımı başlatma/durdurma

### 📹 Cloud Recording
- **Bulut Kayıt**: Agora Cloud Recording entegrasyonu
- **Çoklu Format**: MP4, HLS, WebM desteği
- **Otomatik Yönetim**: Kayıt başlatma, durdurma, indirme
- **Kayıt Geçmişi**: Önceki kayıtları görüntüleme

### 🎨 Whiteboard
- **İnteraktif Tahta**: Gerçek zamanlı çizim ve not alma
- **Çoklu Kullanıcı**: Aynı anda birden fazla katılımcı
- **Araç Seti**: Kalem, silgi, şekil, metin araçları
- **Sunucu Senkronizasyonu**: Tüm değişiklikler senkronize

### 🎛️ Gelişmiş Kontroller
- **Modern UI**: Sektör standartlarında kullanıcı arayüzü
- **Responsive Design**: Mobil ve masaüstü uyumlu
- **Erişilebilirlik**: WCAG standartlarına uygun
- **Klavye Kısayolları**: Hızlı erişim için kısayollar

## 🏗️ Mimari

### Modüler Yapı
```
src/modules/agora/
├── store/                 # Pinia state management
│   ├── video.js          # Video/audio state
│   ├── screenShare.js    # Screen share state
│   ├── recording.js      # Recording state
│   └── whiteboard.js     # Whiteboard state
├── composables/          # Vue 3 composables
│   ├── useAgora.js       # Ana composable
│   ├── useVideo.js       # Video/audio logic
│   ├── useScreenShare.js # Screen share logic
│   ├── useRecording.js   # Recording logic
│   └── useWhiteboard.js  # Whiteboard logic
├── components/           # Vue components
│   ├── AgoraVideo.vue    # Video grid
│   └── AgoraControls.vue # Control panel
├── constants.js          # Sabitler
├── events.js            # Event types
├── types.js             # Type definitions
└── index.js             # Module exports
```

### Teknoloji Stack
- **Vue 3**: Composition API ile modern Vue
- **Pinia**: State management
- **Agora SDK**: Video/audio engine
- **Vite**: Build tool
- **Modern CSS**: CSS Grid, Flexbox, CSS Variables

## 🚀 Kurulum

### Gereksinimler
- Node.js 16+
- npm veya yarn
- Agora hesabı ve App ID

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

3. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
```

4. **Tarayıcıda açın**
```
http://localhost:5173
```

## 📖 Kullanım

### Temel Kullanım

```javascript
import { useAgora, AgoraVideo, AgoraControls } from '@/modules/agora'

export default {
  components: { AgoraVideo, AgoraControls },
  setup() {
    const {
      isConnected,
      isInitialized,
      localUser,
      allUsers,
      connectedUsersCount,
      initialize,
      joinMeeting,
      leaveMeeting,
      toggleCamera,
      toggleMicrophone,
      toggleScreenShare,
      toggleRecording,
      toggleWhiteboard
    } = useAgora()

    const joinMeeting = async () => {
      await initialize({ appId: 'your-app-id' })
      await joinMeeting({
        token: 'user-token',
        channelName: 'meeting-room',
        userName: 'John Doe'
      })
    }

    return {
      isConnected,
      localUser,
      allUsers,
      connectedUsersCount,
      joinMeeting,
      leaveMeeting,
      toggleCamera,
      toggleMicrophone,
      toggleScreenShare,
      toggleRecording,
      toggleWhiteboard
    }
  }
}
```

### Template Kullanımı

```vue
<template>
  <div class="meeting-container">
    <!-- Video Grid -->
    <AgoraVideo 
      v-if="isConnected"
      @video-ready="onVideoReady"
      @error="onVideoError"
    />
    
    <!-- Controls -->
    <AgoraControls
      v-if="isConnected"
      :is-connected="isConnected"
      :is-video-off="localUser?.isVideoOff"
      :is-muted="localUser?.isMuted"
      @toggle-camera="toggleCamera"
      @toggle-microphone="toggleMicrophone"
      @leave-meeting="leaveMeeting"
    />
  </div>
</template>
```

## ⚙️ Konfigürasyon

### Environment Variables

```env
VITE_AGORA_APP_ID=your-agora-app-id
VITE_AGORA_TOKEN_SERVER=your-token-server-url
```

### Agora App ID Alma

1. [Agora Console](https://console.agora.io/)'a gidin
2. Yeni proje oluşturun
3. App ID'yi kopyalayın
4. Token server kurun (güvenlik için)

### Token Server Kurulumu

```javascript
// Basit token server örneği
const express = require('express')
const { RtcTokenBuilder, RtcRole } = require('agora-access-token')

const app = express()

app.get('/token', (req, res) => {
  const { channelName, uid } = req.query
  const token = RtcTokenBuilder.buildTokenWithUid(
    process.env.AGORA_APP_ID,
    process.env.AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    Math.floor(Date.now() / 1000) + 3600
  )
  res.json({ token })
})

app.listen(3000)
```

## 🎯 API Referansı

### useAgora Composable

#### State Properties
- `isReady`: Modül hazır mı?
- `isConnected`: Bağlantı durumu
- `localUser`: Yerel kullanıcı bilgisi
- `allUsers`: Tüm kullanıcılar
- `connectedUsersCount`: Bağlı kullanıcı sayısı

#### Methods
- `initialize(config)`: Modülü başlat
- `joinMeeting(config)`: Toplantıya katıl
- `leaveMeeting()`: Toplantıdan ayrıl
- `toggleCamera(off)`: Kamerayı aç/kapat
- `toggleMicrophone(muted)`: Mikrofonu aç/kapat
- `toggleScreenShare()`: Ekran paylaşımını aç/kapat
- `toggleRecording()`: Kaydı başlat/durdur
- `toggleWhiteboard()`: Whiteboard'u aç/kapat

### AgoraVideo Component

#### Props
- `maxColumns`: Maksimum grid sütun sayısı
- `aspectRatio`: Video oranı
- `showNetworkQuality`: Ağ kalitesi göstergesi
- `showUserInfo`: Kullanıcı bilgisi göstergesi

#### Events
- `video-ready`: Video hazır olduğunda
- `error`: Hata durumunda
- `retry-connection`: Yeniden bağlanma isteği

### AgoraControls Component

#### Props
- `isConnected`: Bağlantı durumu
- `isVideoOff`: Video kapalı mı?
- `isMuted`: Mikrofon kapalı mı?
- `isScreenSharing`: Ekran paylaşımı aktif mi?
- `isRecording`: Kayıt aktif mi?
- `recordingDuration`: Kayıt süresi

#### Events
- `toggle-camera`: Kamera toggle
- `toggle-microphone`: Mikrofon toggle
- `toggle-screen-share`: Ekran paylaşımı toggle
- `toggle-recording`: Kayıt toggle
- `leave-meeting`: Toplantıdan ayrıl

## 🎨 Özelleştirme

### Tema Değişiklikleri

```css
:root {
  --agora-primary-color: #667eea;
  --agora-secondary-color: #764ba2;
  --agora-success-color: #4caf50;
  --agora-error-color: #f44336;
  --agora-warning-color: #ff9800;
  --agora-background-color: #1a1a1a;
  --agora-surface-color: #2a2a2a;
  --agora-text-color: #ffffff;
}
```

### Component Styling

```vue
<style scoped>
.agora-video-container {
  --grid-gap: 12px;
  --border-radius: 12px;
  --control-height: 80px;
}
</style>
```

## 🧪 Test

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Performance Tests

```bash
npm run test:performance
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- Touch-friendly controls
- Swipe gestures
- Optimized video grid
- Reduced animations

## 🔒 Güvenlik

### Best Practices
- Token-based authentication
- HTTPS only
- Input validation
- XSS protection
- CSRF protection

### Privacy
- No data collection
- Local storage only
- GDPR compliant
- COPPA compliant

## 🚀 Performance

### Optimizations
- Lazy loading
- Code splitting
- Tree shaking
- Image optimization
- Bundle optimization

### Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🆘 Destek

### Dokümantasyon
- [Agora Documentation](https://docs.agora.io/)
- [Vue 3 Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)

### Topluluk
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Community](https://discord.gg/your-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/vue3-agora)

### İletişim
- **Email**: support@your-company.com
- **Twitter**: [@your-handle](https://twitter.com/your-handle)
- **LinkedIn**: [Your Name](https://linkedin.com/in/your-profile)

## 🙏 Teşekkürler

- [Agora.io](https://agora.io/) - Video/audio engine
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Pinia](https://pinia.vuejs.org/) - Intuitive, type safe store for Vue
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

---

**⭐ Bu projeyi beğendiyseniz yıldız vermeyi unutmayın!**
