# 🎨 RS-Agora Tema Sistemi Rehberi

## 🌟 Genel Bakış

RS-Agora modülü artık **6 farklı tema** ve **gelişmiş efekt sistemi** ile geliyor! Tüm renkler CSS custom properties kullanılarak yönetiliyor ve tema değişiklikleri anında tüm bileşenlere uygulanıyor.

## 🎯 Mevcut Temalar

### 1. 🌊 **Okyanus Derinliği (Default)**
- **Ana Renkler**: Mavi ve turkuaz tonları
- **Arka Plan**: Derin okyanus mavileri
- **Metin**: Kristal beyaz tonları
- **Kullanım**: `data-theme="default"` veya varsayılan

### 2. 🌅 **Gün Batımı**
- **Ana Renkler**: Sıcak turuncu ve altın tonları
- **Arka Plan**: Sıcak gün batımı renkleri
- **Metin**: Sıcak beyaz tonları
- **Kullanım**: `data-theme="sunset-warm"`

### 3. 🌲 **Orman Doğası**
- **Ana Renkler**: Yeşil ve kahverengi tonları
- **Arka Plan**: Derin orman renkleri
- **Metin**: Doğal beyaz tonları
- **Kullanım**: `data-theme="forest-nature"`

### 4. 🌌 **Kozmik Mor**
- **Ana Renkler**: Mor ve pembe galaksi tonları
- **Arka Plan**: Uzay derinliği renkleri
- **Metin**: Yıldız ışığı tonları
- **Kullanım**: `data-theme="cosmic-purple"`

### 5. 🤖 **Neon Siber**
- **Ana Renkler**: Neon yeşil ve mavi tonları
- **Arka Plan**: Siber uzay renkleri
- **Metin**: Neon ışık tonları
- **Kullanım**: `data-theme="neon-cyber"`

### 6. ☀️ **Açık Modern**
- **Ana Renkler**: Modern mavi ve mor tonları
- **Arka Plan**: Açık modern renkler
- **Metin**: Koyu modern tonları
- **Kullanım**: `data-theme="light-modern"`

## 🚀 Tema Değiştirme

### JavaScript ile:
```javascript
import { useTheme } from '@/modules/agora/composables/useTheme'

const { setTheme } = useTheme()

// Temayı değiştir
setTheme('sunset-warm')
setTheme('forest-nature')
setTheme('cosmic-purple')
setTheme('neon-cyber')
setTheme('light-modern')
setTheme('default')
```

### HTML ile:
```html
<html data-theme="sunset-warm">
  <!-- Tema otomatik olarak uygulanır -->
</html>
```

### CSS ile:
```css
[data-theme="sunset-warm"] {
  /* Tema özel stilleri */
}
```

## ✨ Özel Efektler

### Işıltı Efektleri (Glow Effects)
```css
.rs-agora-glow-primary    /* Ana renk ışıltısı */
.rs-agora-glow-secondary  /* İkincil renk ışıltısı */
.rs-agora-glow-success    /* Başarı ışıltısı */
.rs-agora-glow-warning    /* Uyarı ışıltısı */
.rs-agora-glow-error      /* Hata ışıltısı */
.rs-agora-glow-info       /* Bilgi ışıltısı */
```

### Hover Efektleri
```css
.rs-agora-hover-lift      /* Yukarı kalkma efekti */
.rs-agora-hover-scale     /* Büyüme efekti */
.rs-agora-hover-glow      /* Hover ışıltısı */
```

### Animasyonlar
```css
.rs-agora-pulse           /* Nabız animasyonu */
.rs-agora-bounce          /* Zıplama animasyonu */
.rs-agora-shimmer         /* Parıltı efekti */
```

### Özel Efektler
```css
.rs-agora-glass           /* Cam morfolojisi */
.rs-agora-glass-dark      /* Koyu cam morfolojisi */
.rs-agora-gradient-text-primary    /* Gradyan metin */
.rs-agora-gradient-text-secondary  /* İkincil gradyan metin */
```

## 🎨 Renk Değişkenleri

### Ana Renkler
```css
--rs-agora-primary        /* Ana renk */
--rs-agora-primary-dark   /* Koyu ana renk */
--rs-agora-primary-light  /* Açık ana renk */
--rs-agora-secondary      /* İkincil renk */
--rs-agora-secondary-dark /* Koyu ikincil renk */
--rs-agora-secondary-light /* Açık ikincil renk */
```

### Arka Plan Renkleri
```css
--rs-agora-bg-primary     /* Ana arka plan */
--rs-agora-bg-secondary   /* İkincil arka plan */
--rs-agora-bg-tertiary    /* Üçüncül arka plan */
--rs-agora-bg-quaternary  /* Dördüncül arka plan */
--rs-agora-bg-accent      /* Vurgu arka planı */
```

### Metin Renkleri
```css
--rs-agora-text-primary   /* Ana metin */
--rs-agora-text-secondary /* İkincil metin */
--rs-agora-text-muted     /* Soluk metin */
--rs-agora-text-accent    /* Vurgu metni */
```

### Durum Renkleri
```css
--rs-agora-success        /* Başarı */
--rs-agora-warning        /* Uyarı */
--rs-agora-error          /* Hata */
--rs-agora-info           /* Bilgi */
```

### Şeffaflık Renkleri
```css
--rs-agora-transparent-white-05  /* %5 beyaz şeffaflık */
--rs-agora-transparent-white-10  /* %10 beyaz şeffaflık */
--rs-agora-transparent-white-20  /* %20 beyaz şeffaflık */
--rs-agora-transparent-black-20  /* %20 siyah şeffaflık */
--rs-agora-transparent-primary-10 /* %10 ana renk şeffaflık */
```

## 🔧 Kullanım Örnekleri

### Buton Örneği:
```vue
<template>
  <button class="btn btn-primary rs-agora-hover-lift rs-agora-glow-primary">
    Hover Efektli Buton
  </button>
</template>
```

### Kart Örneği:
```vue
<template>
  <div class="card rs-agora-glass rs-agora-hover-scale">
    <h3>Cam Efektli Kart</h3>
    <p>Hover'da büyüyen cam kart</p>
  </div>
</template>
```

### Gradyan Metin:
```vue
<template>
  <h1 class="rs-agora-gradient-text-primary">
    Gradyan Başlık
  </h1>
</template>
```

## 📱 Responsive Tasarım

Tüm temalar ve efektler responsive olarak tasarlandı:
- **Mobil**: Tek sütun düzeni
- **Tablet**: Orta sütun düzeni  
- **Desktop**: Çok sütun düzeni

## 🎭 Tema Önizleme

Tema değiştirmeden önce önizleme yapabilirsiniz:
```javascript
import { useTheme } from '@/modules/agora/composables/useTheme'

const { previewTheme, cancelPreview } = useTheme()

// Tema önizlemesi
previewTheme('sunset-warm')

// Önizlemeyi iptal et
cancelPreview()
```

## 💾 Tema Kaydetme

Tema seçimi otomatik olarak localStorage'a kaydedilir:
```javascript
// Tema kaydedilir
localStorage.setItem('rs-agora-theme', 'sunset-warm')

// Tema yüklenir
const savedTheme = localStorage.getItem('rs-agora-theme')
```

## 🔍 Debug ve Test

### Tema Demo Bileşeni
```vue
<template>
  <ThemeDemo />
</template>

<script setup>
import { ThemeDemo } from '@/modules/agora/components/ui'
</script>
```

### Tema Seçici Bileşeni
```vue
<template>
  <ThemeSelector />
</template>

<script setup>
import { ThemeSelector } from '@/modules/agora/components/ui'
</script>
```

## 🚨 Önemli Notlar

1. **CSS Custom Properties**: Tüm renkler CSS değişkenleri ile tanımlanır
2. **Otomatik Uygulama**: Tema değişiklikleri anında tüm bileşenlere uygulanır
3. **Fallback**: Tema bulunamazsa varsayılan tema kullanılır
4. **Performance**: CSS değişkenleri performanslı çalışır
5. **Browser Support**: Modern tarayıcılarda tam destek

## 🎯 Gelecek Özellikler

- [ ] **Otomatik Tema**: Sistem temasına göre otomatik değişim
- [ ] **Özel Tema Oluşturma**: Kullanıcı tarafından özel tema oluşturma
- [ ] **Tema Import/Export**: Tema paylaşımı
- [ ] **Animasyon Özelleştirme**: Animasyon hızı ve stil özelleştirme
- [ ] **Dark/Light Mode**: Otomatik karanlık/aydınlık mod geçişi

---

**🎨 Tema sistemi ile güzel tasarımlar yaratın!**
