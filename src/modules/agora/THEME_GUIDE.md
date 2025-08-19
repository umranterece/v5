# RS-Agora Tema Rehberi

## Mevcut Temalar

### 1. Okyanus Derinliği (Default)
- **ID**: `default`
- **Açıklama**: Mavi ve turkuaz tonları
- **İkon**: 🌊

### 2. Gün Batımı
- **ID**: `sunset-warm`
- **Açıklama**: Sıcak turuncu ve altın tonları
- **İkon**: 🌅

### 3. Orman Doğası
- **ID**: `forest-nature`
- **Açıklama**: Yeşil ve kahverengi tonları
- **İkon**: 🌲

### 4. Rehberim Sensin
- **ID**: `cosmic-purple`
- **Açıklama**: Hafif mor ve pembe tonları
- **İkon**: 💜

### 5. Neon Siber
- **ID**: `neon-cyber`
- **Açıklama**: Neon yeşil ve mavi tonları
- **İkon**: 🤖

### 6. Açık Modern
- **ID**: `light-modern`
- **Açıklama**: Açık ve modern tonlar
- **İkon**: ☀️

### 7. Kuzey Işıkları
- **ID**: `aurora-borealis`
- **Açıklama**: Kuzey ışıkları yeşil ve mavi tonları
- **İkon**: 🌌

### 8. Çöl Gün Batımı
- **ID**: `desert-sunset`
- **Açıklama**: Çöl gün batımı turuncu ve kum sarısı
- **İkon**: 🏜️

### 9. Derin Okyanus
- **ID**: `ocean-depth`
- **Açıklama**: Derin okyanus mavi ve deniz yeşili
- **İkon**: 🌊

### 10. Dağ Sisi
- **ID**: `mountain-mist`
- **Açıklama**: Dağ sisi mavi ve gri tonları
- **İkon**: 🏔️

### 11. Şeker Rüyası
- **ID**: `candy-dream`
- **Açıklama**: Şeker pembe ve mavi tonları
- **İkon**: 🍬

### 12. Yumuşak Pastel
- **ID**: `soft-pastel`
- **Açıklama**: Yumuşak pastel mavi ve pembe tonları
- **İkon**: 🌸

### 13. Sıcak Krem
- **ID**: `warm-cream`
- **Açıklama**: Sıcak krem kahve ve bej tonları
- **İkon**: ☕

### 14. 🆕 LogModal Zarafeti
- **ID**: `logmodal-elegance`
- **Açıklama**: LogModal'dan esinlenen zarif mavi-mor tonları
- **İkon**: ✨
- **Özellikler**:
  - Ana renk: #667eea (Mavi)
  - İkincil renk: #764ba2 (Mor)
  - Arka plan: #1a1a2e → #16213e → #0f3460 (Gradyan)
  - Şeffaf beyaz yüzeyler
  - Cam morfolojisi efektleri
  - LogModal'daki güzel renk paleti

## Tema Kullanımı

### JavaScript ile Tema Değiştirme
```javascript
import { useTheme } from '@/modules/agora/composables/useTheme.js'

const { setTheme, getCurrentTheme } = useTheme()

// Tema değiştir
setTheme('logmodal-elegance')

// Mevcut temayı al
const currentTheme = getCurrentTheme()
```

### CSS ile Tema Kontrolü
```css
/* Belirli bir tema için stil */
[data-theme="logmodal-elegance"] .my-component {
  background: var(--rs-agora-bg-primary);
  color: var(--rs-agora-text-primary);
  border: 1px solid var(--rs-agora-border-primary);
}

/* Tema değişkenlerini kullan */
.my-component {
  background: var(--rs-agora-surface-primary);
  color: var(--rs-agora-text-primary);
  border-radius: var(--rs-agora-border-radius-md);
  transition: var(--rs-agora-transition-normal);
}
```

## LogModal Elegance Teması Detayları

Bu tema, LogModal bileşenindeki güzel renk paletinden esinlenerek oluşturulmuştur:

### Renk Paleti
- **Ana Mavi**: #667eea (LogModal header icon)
- **Mor**: #764ba2 (LogModal gradient)
- **Koyu Arka Plan**: #1a1a2e, #16213e, #0f3460
- **Şeffaf Beyaz**: rgba(255, 255, 255, 0.05) - rgba(255, 255, 255, 0.9)

### Özel Özellikler
- **Gradyan Arka Planlar**: LogModal'daki güzel geçişler
- **Cam Morfolojisi**: backdrop-filter: blur(20px) efektleri
- **Şeffaf Yüzeyler**: Modern, zarif görünüm
- **Gölge Efektleri**: LogModal'daki güzel gölgeler
- **Hover Animasyonları**: Yumuşak geçişler

### Kullanım Alanları
- Modern dashboard'lar
- Profesyonel uygulamalar
- Zarif kullanıcı arayüzleri
- LogModal benzeri bileşenler
- Cam morfolojisi tasarımlar

## Tema Geliştirme

### Yeni Tema Ekleme
1. `useTheme.js` dosyasına tema bilgilerini ekle
2. `themes.css` dosyasına CSS değişkenlerini ekle
3. Tema seçicide otomatik olarak görünecek

### Tema Test Etme
```javascript
// Tema önizlemesi
const { previewTheme, cancelPreview } = useTheme()

// Tema önizle
previewTheme('logmodal-elegance')

// Önizlemeyi iptal et
cancelPreview()
```

## CSS Değişkenleri

LogModal Elegance teması aşağıdaki CSS değişkenlerini sağlar:

### Ana Renkler
- `--rs-agora-primary`: #667eea
- `--rs-agora-secondary`: #764ba2
- `--rs-agora-bg-primary`: #1a1a2e

### Gradyanlar
- `--rs-agora-gradient-primary`: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- `--rs-agora-gradient-secondary`: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)

### Şeffaflık
- `--rs-agora-transparent-white-05`: rgba(255, 255, 255, 0.05)
- `--rs-agora-transparent-white-10`: rgba(255, 255, 255, 0.1)

### Efektler
- `--rs-agora-backdrop-blur`: blur(20px)
- `--rs-agora-transition-normal`: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
