# 🎯 Responsive Grid Layout Sistemi

Modern video konferans uygulaması için geliştirilmiş akıllı ve responsive grid layout sistemi. Ekran oranına göre otomatik optimize edilen, farklı içerik türlerini destekleyen ve tüm cihazlarda mükemmel görünüm sağlayan sistem.

## ✨ Öne Çıkan Özellikler

### 🎯 **Akıllı Ekran Oranı Optimizasyonu**
- **Portrait Mode**: Yükseklik > Genişlik (mobil, tablet dikey)
- **Landscape Mode**: Genişlik > Yükseklik (desktop, tablet yatay)
- **Real-time Adaptasyon**: Ekran boyutu değiştiğinde otomatik güncelleme

### 🔄 **Farklı İçerik Türleri Desteği**
- **Local Kamera**: Kullanıcının kendi kamerası
- **Local Screen**: Kullanıcının ekran paylaşımı
- **Remote Camera**: Uzak kullanıcı kameraları
- **Remote Screen**: Uzak kullanıcı ekran paylaşımları

### 📱 **Responsive Breakpoint Sistemi**
- **Desktop**: > 1024px
- **Tablet**: 769px - 1024px
- **Mobile**: ≤ 768px

## 🏗️ Grid Layout Mimarisi

### **Core Components**
```vue
<!-- GridLayout.vue -->
<template>
  <div class="grid-layout">
    <div 
      class="video-grid"
      :data-count="totalVideoCount"
      :data-columns="gridLayout.columns"
      :data-rows="gridLayout.rows"
      :data-orientation="windowSize.height > windowSize.width ? 'portrait' : 'landscape'"
      :style="{
        'grid-template-columns': `repeat(${gridLayout.columns}, 1fr)`,
        'grid-template-rows': `repeat(${gridLayout.rows}, 1fr)`,
        'max-width': gridLayout.maxWidth,
        'aspect-ratio': gridLayout.aspectRatio
      }"
    >
      <!-- Video Items -->
    </div>
  </div>
</template>
```

### **Grid Layout Hesaplama Algoritması**
```javascript
// Ekran oranına göre optimize edilmiş grid hesaplama
const gridLayout = computed(() => {
  const count = totalVideoCount.value
  const screenWidth = windowSize.value.width
  const screenHeight = windowSize.value.height
  const isPortrait = screenHeight > screenWidth
  
  // İçerik türlerini analiz et
  const hasLocalCamera = localCameraUser.value && localCameraHasVideo.value
  const hasLocalScreen = localScreenUser.value && localScreenHasVideo.value
  const remoteCameraCount = remoteUsers.value.filter(u => getUserHasVideo(u)).length
  const remoteScreenCount = remoteScreenShareUsers.value.filter(u => getUserHasVideo(u)).length
  
  // Grid layout hesaplama...
})
```

## 📱 Responsive Grid Düzenlemeleri

### **2 Kişi Layout**
```css
/* Portrait (yükseklik > genişlik) */
@media (orientation: portrait) {
  .video-grid[data-count="2"] {
    grid-template-columns: 1fr !important;
    grid-template-rows: repeat(2, 1fr) !important;
  }
}

/* Landscape (genişlik > yükseklik) */
@media (orientation: landscape) {
  .video-grid[data-count="2"] {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-rows: 1fr !important;
  }
}
```

### **3-4 Kişi Layout**
```css
/* Portrait: 2x2 grid */
.video-grid[data-count="3"],
.video-grid[data-count="4"] {
  grid-template-columns: repeat(2, 1fr) !important;
  grid-template-rows: repeat(2, 1fr) !important;
}

/* Landscape: yan yana */
@media (orientation: landscape) {
  .video-grid[data-count="3"] {
    grid-template-columns: repeat(3, 1fr) !important;
    grid-template-rows: 1fr !important;
  }
  
  .video-grid[data-count="4"] {
    grid-template-columns: repeat(4, 1fr) !important;
    grid-template-rows: 1fr !important;
  }
}
```

### **5+ Kişi Layout**
```css
/* 5-6 kişi için 3x2 grid */
.video-grid[data-count="5"],
.video-grid[data-count="6"] {
  grid-template-columns: repeat(3, 1fr) !important;
  grid-template-rows: repeat(2, 1fr) !important;
}

/* 7-9 kişi için 3x3 grid */
.video-grid[data-count="7"],
.video-grid[data-count="8"],
.video-grid[data-count="9"] {
  grid-template-columns: repeat(3, 1fr) !important;
  grid-template-rows: repeat(3, 1fr) !important;
}
```

## 🎨 CSS Optimizasyonları

### **Grid Container**
```css
.video-grid {
  display: grid;
  gap: 0.5rem;
  padding: 0.5rem;
  height: 100%;
  width: 100%;
  grid-auto-rows: minmax(0, 1fr);
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  overflow: auto;
  box-sizing: border-box;
  transition: all 0.3s ease;
}
```

### **Video Item Optimizasyonu**
```css
.video-grid .video-item {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: none;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: var(--rs-agora-radius-lg);
  transition: all 0.2s ease;
}
```

### **2 Kişi Eşit Bölünme**
```css
.video-grid[data-count="2"] .video-item {
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: none !important;
  max-height: none !important;
  flex: 1 1 0 !important;
}
```

## 📱 Mobil Optimizasyonu

### **768px Altında Özel Düzenlemeler**
```css
@media (max-width: 768px) {
  .video-grid {
    gap: 0.3rem;
    padding: 0.3rem;
    grid-template-columns: 1fr !important;
    grid-template-rows: auto !important;
  }
  
  /* Mobilde 2 kişi için eşit bölünme - alta alta */
  .video-grid[data-count="2"] {
    grid-template-columns: 1fr !important;
    grid-template-rows: repeat(2, 1fr) !important;
    gap: 0.3rem !important;
    padding: 0.3rem !important;
  }
  
  .video-grid[data-count="2"] .video-item {
    width: 100% !important;
    height: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
    max-width: none !important;
    max-height: none !important;
    flex: 1 1 0 !important;
  }
}
```

### **Tablet Optimizasyonu**
```css
@media (max-width: 1024px) and (min-width: 769px) {
  .video-grid {
    gap: 0.4rem;
    padding: 0.4rem;
  }
}
```

## 🔄 Real-time Responsive

### **Window Resize Listener**
```javascript
// Reactive window size
const windowSize = ref({
  width: typeof window !== 'undefined' ? window.innerWidth : 1920,
  height: typeof window !== 'undefined' ? window.innerHeight : 1080
})

// Window resize listener
const handleResize = () => {
  windowSize.value = {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
    handleResize()
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})
```

### **Computed Grid Layout**
```javascript
const gridLayout = computed(() => {
  // Ekran boyutları değiştiğinde otomatik yeniden hesaplama
  const screenWidth = windowSize.value.width
  const screenHeight = windowSize.value.height
  const isPortrait = screenHeight > screenWidth
  
  // Grid layout hesaplama...
})
```

## 🎯 İçerik Türü Bazlı Optimizasyon

### **Local + Remote Kombinasyonları**
```javascript
// 2 kişi - içerik türüne göre optimize
if (count === 2) {
  // Local kamera + Local screen
  if (hasLocalCamera && hasLocalScreen) {
    if (isPortrait) {
      return { columns: 1, rows: 2, aspectRatio: '1/2' }
    } else {
      return { columns: 2, rows: 1, aspectRatio: '2/1' }
    }
  }
  
  // Local kamera + Remote kamera
  if (hasLocalCamera && remoteCameraCount > 0) {
    if (isPortrait) {
      return { columns: 1, rows: 2, aspectRatio: '1/2' }
    } else {
      return { columns: 2, rows: 1, aspectRatio: '2/1' }
    }
  }
}
```

### **3-4 Kişi İçerik Optimizasyonu**
```javascript
// 3-4 kişi - içerik türüne göre optimize
if (count === 3 || count === 4) {
  // Local kamera + Local screen + Remote kamera
  if (hasLocalCamera && hasLocalScreen && remoteCameraCount > 0) {
    return { columns: 2, rows: 2, aspectRatio: '1/1' }
  }
  
  // Local kamera + Remote kamera + Remote screen
  if (hasLocalCamera && remoteCameraCount > 0 && remoteScreenCount > 0) {
    return { columns: 2, rows: 2, aspectRatio: '1/1' }
  }
}
```

## 🧪 Debug ve Development

### **Debug Bilgisi**
```vue
<!-- Development modunda görünür debug paneli -->
<div v-if="isDevelopment" class="debug-info">
  <div>Ekran: {{ windowSize.width }}x{{ windowSize.height }}</div>
  <div>Oran: {{ windowSize.height > windowSize.width ? 'Portrait' : 'Landscape' }}</div>
  <div>Video Sayısı: {{ totalVideoCount }}</div>
  <div>Grid: {{ gridLayout.columns }}x{{ gridLayout.rows }}</div>
  <div>İçerik Türleri:</div>
  <div>• Local Kamera: {{ localCameraUser && localCameraHasVideo ? '✓' : '✗' }}</div>
  <div>• Local Screen: {{ localScreenUser && localScreenHasVideo ? '✓' : '✗' }}</div>
  <div>• Remote Kamera: {{ remoteUsers.filter(u => getUserHasVideo(u)).length }}</div>
  <div>• Remote Screen: {{ remoteScreenShareUsers.filter(u => getUserHasVideo(u)).length }}</div>
</div>
```

### **CSS Debug Classes**
```css
.debug-info {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
  font-size: 12px;
  z-index: 9999;
  backdrop-filter: blur(10px);
}
```

## 📊 Performance Optimizasyonları

### **CSS Transition Optimizasyonu**
```css
.video-grid {
  transition: all 0.3s ease;
}

.video-grid .video-item {
  transition: all 0.2s ease;
}
```

### **Grid Auto-rows Optimizasyonu**
```css
.video-grid {
  grid-auto-rows: minmax(0, 1fr);
}
```

### **Box-sizing Optimizasyonu**
```css
.video-grid {
  box-sizing: border-box;
}
```

## 🔧 Kullanım Örnekleri

### **Temel Grid Layout**
```vue
<template>
  <GridLayout 
    :users="users"
    :localTracks="localTracks"
    :logUI="logUI"
  />
</template>

<script setup>
import GridLayout from '@/modules/agora/components/layouts/GridLayout.vue'
</script>
```

### **Custom Grid Layout**
```vue
<template>
  <div class="custom-grid">
    <VideoItem 
      v-for="user in users" 
      :key="user.uid"
      :user="user"
      :has-video="getUserHasVideo(user)"
    />
  </div>
</template>

<style scoped>
.custom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
}
</style>
```

## 🚀 Gelecek Geliştirmeler

### **Planlanan Özellikler**
- [ ] **Drag & Drop**: Video item'ları sürükleyip bırakma
- [ ] **Custom Grid**: Kullanıcı tanımlı grid düzenleri
- [ ] **Animation**: Smooth grid geçiş animasyonları
- [ ] **Accessibility**: ARIA labels ve keyboard navigation
- [ ] **Performance**: Virtual scrolling büyük gruplar için

### **Optimizasyon Hedefleri**
- [ ] **Bundle Size**: CSS ve JS bundle boyutu optimizasyonu
- [ ] **Memory Usage**: Video item memory management
- [ ] **Rendering**: GPU acceleration ve hardware acceleration
- [ ] **Network**: Adaptive quality based on network conditions

## 📚 İlgili Dokümantasyon

- [🎥 Video Konferans Özellikleri](VIDEO_CONFERENCE.md)
- [🖥️ Ekran Paylaşımı](SCREEN_SHARING.md)
- [📱 UI Bileşenleri](UI_COMPONENTS.md)
- [🚀 Performans Optimizasyonu](PERFORMANCE.md)
- [🏗️ Mimari Dokümantasyonu](ARCHITECTURE.md)

---

**Son Güncelleme**: 2025-01-09  
**Versiyon**: v5.0.0  
**Geliştirici**: Umran Terece
