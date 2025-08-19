🤖 AGORA LOGGING REFACTORING AGENT PROMPT

GÖREV: Agora video conference projesinde eski logging yapısını (logUI, logError props) yeni fileLogger yapısına tamamen refactor et.

📋 MEVCUT DURUM:
- AgoraConference.vue ✅ Zaten fileLogger kullanıyor
- AgoraVideo.vue ❌ Hala logUI, logError props bekliyor
- Layout Component'ları ❌ Hala logUI props bekliyor
- Video Component'ları ❌ Hala logUI props bekliyor

🎯 HEDEF:
Tüm component'larda tek logger objesi kullanarak tutarlı logging yapısı oluştur.

🔧 REFACTORING STRATEJİSİ:

1. AgoraConference'da Logger Wrapper Oluştur:
```javascript
const loggers = {
  video: {
    debug: (message, data) => fileLogger.log('debug', 'VIDEO', message, data),
    info: (message, data) => fileLogger.log('info', 'VIDEO', message, data),
    warn: (message, data) => fileLogger.log('warn', 'VIDEO', message, data),
    error: (error, data) => fileLogger.log('error', 'VIDEO', error, data)
  },
  ui: {
    debug: (message, data) => fileLogger.log('debug', 'UI', message, data),
    info: (message, data) => fileLogger.log('info', 'UI', message, data),
    warn: (message, data) => fileLogger.log('warn', 'UI', message, data),
    error: (error, data) => fileLogger.log('error', 'UI', error, data)
  }
}
```

2. Tüm Component'lara Logger Props Geç:
```vue
<AgoraVideo :logger="loggers.video" />
<GridLayout :logger="loggers.video" />
<SpotlightLayout :logger="loggers.video" />
<PresentationLayout :logger="loggers.video" />
<VideoItem :logger="loggers.video" />
<AgoraControls :logger="loggers.ui" />
```

3. Component'larda Props Değiştir:
```javascript
// ESKİ
logUI: { type: Function, default: () => {} }
logError: { type: Function, default: () => {} }

// YENİ
logger: { type: Object, default: () => ({}) }

// KULLANIM
props.logger.info('Video tıklandı', { user: user.uid })
props.logger.error('Hata oluştu', error)
```

📁 REFACTOR EDİLECEK DOSYALAR:

Core Components:
- src/modules/agora/components/core/AgoraVideo.vue
- src/modules/agora/components/core/AgoraConference.vue

Layout Components:
- src/modules/agora/components/layouts/GridLayout.vue
- src/modules/agora/components/layouts/SpotlightLayout.vue
- src/modules/agora/components/layouts/PresentationLayout.vue

Video Components:
- src/modules/agora/components/video/VideoItem.vue
- src/modules/agora/components/controls/AgoraControls.vue

Composables:
- src/modules/agora/composables/useDeviceSettings.js

🚀 UYGULAMA SIRASI:

1. AgoraConference'da logger wrapper'ları oluştur
2. AgoraVideo'yu refactor et
3. Layout component'larını refactor et
4. Video component'larını refactor et
5. Composables'ı refactor et
6. Test et ve build yap

✅ BAŞARI KRİTERLERİ:
- Tüm component'larda logUI, logError props'ları kaldırıldı
- Yerine logger objesi kullanılıyor
- Build başarılı
- Runtime'da hata yok
- Logging çalışıyor

⚠️ DİKKAT:
- Her component'ta props.logger null check yap
- Fallback olarak console.log kullan
- Tüm log seviyelerini (debug, info, warn, error) destekle
- Kategorileri doğru kullan (VIDEO, UI, SYSTEM, etc.)

🔍 DETAYLI REFACTORING ADIMLARI:

AgoraConference.vue:
- Logger wrapper'ları oluştur (video, ui)
- Tüm component'lara logger props geç
- Kendi logging'ini fileLogger ile yap

AgoraVideo.vue:
- logUI, logError props'larını kaldır
- logger prop'u ekle
- Tüm props.logUI() → props.logger.info()
- Tüm props.logError() → props.logger.error()

Layout Components:
- logUI prop'unu kaldır
- logger prop'u ekle
- Tüm props.logUI() → props.logger.info()

Video Components:
- logUI, logError props'larını kaldır
- logger prop'u ekle
- Tüm logging çağrılarını güncelle

Composables:
- useFileLogger'dan logUI, logError almayı bırak
- Direkt fileLogger import et
- LOG_CATEGORIES kullan

🧪 TEST STRATEJİSİ:
1. Her component'ta logger prop'unun doğru geçildiğini kontrol et
2. Build yap ve hataları kontrol et
3. Runtime'da logging'in çalıştığını test et
4. Farklı log seviyelerini test et (debug, info, warn, error)
5. Kategorilerin doğru kullanıldığını kontrol et

📝 ÖRNEK KULLANIM:

Eski:
```javascript
props.logUI('Video tıklandı', { user: user.uid })
props.logError('Hata oluştu', error)
```

Yeni:
```javascript
props.logger.info('Video tıklandı', { user: user.uid })
props.logger.error('Hata oluştu', error)
```

🎉 SONUÇ:
Tüm projede tutarlı, merkezi ve güçlü logging sistemi oluşturulacak. Eski logUI/logError props'ları tamamen kaldırılacak ve yerine modern logger objesi kullanılacak.

Bu prompt ile yeni chat'te başla ve tüm refactoring'i tamamla! 🚀
