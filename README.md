# Vue 3 Agora Video Conference Module

Vue 3 için geliştirilmiş, Agora SDK kullanan modern video konferans modülü. Ekran paylaşımı, kayıt, log sistemi ve gelişmiş UI özellikleri içerir.

## 🚀 Özellikler

- ✅ **Vue 3 Composition API** desteği
- ✅ **Agora RTC SDK** entegrasyonu
- ✅ **Ekran paylaşımı** desteği
- ✅ **Video/Ses kayıt** özelliği
- ✅ **Gerçek zamanlı log** sistemi
- ✅ **Ağ kalitesi** takibi
- ✅ **Responsive** tasarım
- ✅ **Modüler** yapı
- ✅ **TypeScript** desteği
- ✅ **Production** hazır

## 📦 Kurulum

```bash
npm install rs-agora-module
```

## 🔧 Gereksinimler

```json
{
  "peerDependencies": {
    "vue": "^3.0.0",
    "pinia": "^3.0.0",
    "agora-rtc-sdk-ng": "^4.0.0",
    "mitt": "^3.0.0"
  }
}
```

## 🎯 Hızlı Başlangıç

### 1. Ana Component Kullanımı

```vue
<template>
  <div>
    <AgoraConference
      :channelName="channelName"
      :autoJoin="true"
      :userUid="userUid"
      :tokenEndpoint="tokenEndpoint"
      @joined="onJoined"
      @left="onLeft"
      @error="onError"
    />
  </div>
</template>

<script setup>
import { AgoraConference } from 'rs-agora-module'
import { ref } from 'vue'

const channelName = ref('test-channel')
const userUid = ref(12345)
const tokenEndpoint = ref('https://your-api.com/createToken.php')

const onJoined = (data) => {
  console.log('Kanala katıldı:', data)
}

const onLeft = (data) => {
  console.log('Kanaldan ayrıldı:', data)
}

const onError = (error) => {
  console.error('Hata:', error)
}
</script>
```

### 2. Composable Kullanımı

```vue
<template>
  <div>
    <button @click="joinChannel">Kanala Katıl</button>
    <button @click="leaveChannel">Kanaldan Ayrıl</button>
    <button @click="toggleCamera">Kamerayı Aç/Kapat</button>
    <button @click="toggleMicrophone">Mikrofonu Aç/Kapat</button>
  </div>
</template>

<script setup>
import { useMeeting } from 'rs-agora-module'
import { ref } from 'vue'

const channelName = ref('test-channel')
const userUid = ref(12345)

const {
  joinChannel,
  leaveChannel,
  toggleCamera,
  toggleMicrophone,
  isConnected,
  localUser,
  remoteUsers
} = useMeeting()

const joinChannel = async () => {
  try {
    await joinChannel({
      channelName: channelName.value,
      token: 'your-token',
      uid: userUid.value,
      appId: 'your-app-id'
    })
  } catch (error) {
    console.error('Katılma hatası:', error)
  }
}
</script>
```

## 📋 API Referansı

### AgoraConference Props

| Prop | Tip | Varsayılan | Açıklama |
|------|-----|------------|----------|
| `channelName` | String | `''` | Kanal adı |
| `autoJoin` | Boolean | `false` | Otomatik katılma |
| `userUid` | String/Number | `null` | Kullanıcı ID (null ise random) |
| `tokenEndpoint` | String | `null` | Token API endpoint |

### AgoraConference Events

| Event | Payload | Açıklama |
|-------|---------|----------|
| `joined` | `{channelName, token, uid}` | Kanala katıldığında |
| `left` | `{channelName}` | Kanaldan ayrıldığında |
| `error` | `{error, message}` | Hata oluştuğunda |
| `user-joined` | `{uid, userName}` | Kullanıcı katıldığında |
| `user-left` | `{uid}` | Kullanıcı ayrıldığında |
| `connection-state-change` | `{state}` | Bağlantı durumu değiştiğinde |
| `token-requested` | `{channelName, uid}` | Token istendiğinde |
| `token-received` | `{token, channelName, uid}` | Token alındığında |

### AgoraConference Methods

| Method | Açıklama |
|--------|----------|
| `joinChannel(name)` | Kanala katıl |
| `leaveChannel()` | Kanaldan ayrıl |
| `toggleCamera(off)` | Kamerayı aç/kapat |
| `toggleMicrophone(muted)` | Mikrofonu aç/kapat |
| `toggleScreenShare()` | Ekran paylaşımını aç/kapat |
| `clean()` | Temizlik yap |

## 🔧 Konfigürasyon

### Constants.js Ayarları

```javascript
import { IS_DEV, API_ENDPOINTS, VIDEO_CONFIG } from 'rs-agora-module'

// Development/Production modu
console.log('Development modu:', IS_DEV)

// API endpoints
console.log('Token API:', API_ENDPOINTS.CREATE_TOKEN)

// Video ayarları
console.log('Video config:', VIDEO_CONFIG)
```

### Token Servisi

```javascript
import { createToken } from 'rs-agora-module'

const token = await createToken('channel-name', 12345, 'https://your-api.com/token.php')
```

## 🎨 Özelleştirme

### CSS Değişkenleri

```css
:root {
  --agora-primary-color: #667eea;
  --agora-secondary-color: #764ba2;
  --agora-background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%);
  --agora-text-color: #e0e0e0;
  --agora-border-radius: 16px;
}
```

### Component Özelleştirme

```vue
<template>
  <AgoraConference
    :channelName="channelName"
    class="custom-agora"
  />
</template>

<style>
.custom-agora {
  --agora-primary-color: #ff6b6b;
  --agora-secondary-color: #4ecdc4;
}
</style>
```

## 🚀 Production Build

```bash
# Kütüphane build
npm run build:lib

# Dist klasörü oluşur
dist/
├── index.esm.js    # ES Module
├── index.umd.js    # UMD
└── index.esm.js.map
```

## 📝 Örnek Projeler

### Basit Konferans

```vue
<template>
  <div class="app">
    <h1>Video Konferans</h1>
    <AgoraConference
      :channelName="'meeting-' + meetingId"
      :autoJoin="true"
      @joined="onJoined"
    />
  </div>
</template>

<script setup>
import { AgoraConference } from 'rs-agora-module'
import { ref } from 'vue'

const agoraRef = ref(null)
const channelName = ref('team-meeting')
const userUid = ref(Date.now())
const connectedUsersCount = ref(0)

const onJoined = (data) => {
  console.log('Kanala katıldı:', data)
}

const onUserJoined = (user) => {
  connectedUsersCount.value++
}

onMounted(() => {
  // Component metodlarına erişim
  // agoraRef.value.joinChannel('new-channel')
})
</script>
```

### Gelişmiş Kullanım

```vue
<template>
  <div class="conference-app">
    <div class="header">
      <h2>{{ channelName }}</h2>
      <span>{{ connectedUsersCount }} katılımcı</span>
    </div>
    
    <AgoraConference
      ref="agoraRef"
      :channelName="channelName"
      :userUid="userUid"
      @joined="onJoined"
      @user-joined="onUserJoined"
    />
  </div>
</template>

<script setup>
import { AgoraConference } from 'rs-agora-module'
import { ref, onMounted } from 'vue'

const agoraRef = ref(null)
const channelName = ref('team-meeting')
const userUid = ref(Date.now())
const connectedUsersCount = ref(0)

const onJoined = (data) => {
  console.log('Kanala katıldı:', data)
}

const onUserJoined = (user) => {
  connectedUsersCount.value++
}

onMounted(() => {
  // Component metodlarına erişim
  // agoraRef.value.joinChannel('new-channel')
})
</script>
```

## 🐛 Sorun Giderme

### Yaygın Hatalar

1. **Token Hatası**: API endpoint'inizi kontrol edin
2. **Cihaz İzni**: Kamera/mikrofon izinlerini kontrol edin
3. **Ağ Bağlantısı**: İnternet bağlantınızı kontrol edin

### Debug Modu

```javascript
import { DEV_CONFIG } from 'rs-agora-module'

// Debug logları açık
console.log('Debug config:', DEV_CONFIG)
```

## 📄 Lisans

MIT License - [Detaylar](LICENSE)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

- **Geliştirici**: Umran Terece
- **GitHub**: [@umranterece](https://github.com/umranterece)
- **Email**: umranterece@gmail.com

## 🙏 Teşekkürler

- [Agora.io](https://agora.io) - RTC SDK
- [Vue.js](https://vuejs.org) - Framework
- [Pinia](https://pinia.vuejs.org) - State Management