# 🎯 Layout Otomatik Değişim Problemi - Yapılacaklar Listesi

## **🎯 Genel Amaç:**
Yayındayken sonradan bir kullanıcı yayına katıldığında ekran düzeninin otomatik olarak grid moduna geçmesini engellemek ve kullanıcının layout tercihini korumak.

## **🔧 Çalışma Yapılacak Dosyalar:**

### **1. 📝 `src/modules/agora/composables/useVideo.js`**
- [ ] USER_JOINED event'inde otomatik grid layout değişimini kaldır
- [ ] Layout değişim mantığını koşullu hale getir
- [ ] Sadece belirli durumlarda layout değişimi yap

### **2. 📝 `src/modules/agora/composables/useMeeting.js`**
- [ ] joinChannel fonksiyonunda otomatik grid layout sıfırlamasını kaldır
- [ ] Layout sıfırlama mantığını koşullu hale getir

### **3. 📝 `src/modules/agora/store/layout.js` (Opsiyonel)**
- [ ] switchLayoutWithSave fonksiyonunda otomatik kaydetme mantığını gözden geçir
- [ ] Layout değişim onayı sistemi ekle

## **🔄 Tam Süreç (Şu Anki Problem):**

```
1. Sen yayındasın (örneğin spotlight modunda)
2. Yeni kullanıcı katılıyor
3. useVideo.js'de USER_JOINED event'i tetikleniyor
4. "Normal kullanıcı katıldı, ekran paylaşımı yok, layout grid'e zorlanıyor"
5. layoutStore.switchLayoutWithSave('grid') çağrılıyor
6. Layout grid'e değişiyor
7. LocalStorage'a kaydediliyor
8. Senin layout tercihin kayboluyor! 😱
```

## **💻 Kod Örnekleri:**

### **A) useVideo.js'de Düzeltilecek Kod:**
```javascript
// ❌ Eski (problemli) kod:
if (!hasScreenShare && layoutStore.currentLayout !== 'grid') {
  logInfo('Normal kullanıcı katıldı, ekran paylaşımı yok, layout grid\'e zorlanıyor', { uid: user.uid })
  layoutStore.switchLayoutWithSave('grid') // ❌ BURADA ZORLA GRID'E GEÇİYOR!
}

// ✅ Yeni (düzeltilmiş) kod:
// Sadece presentation modundaysa grid'e geç
if (layoutStore.currentLayout === 'presentation' && !hasScreenShare) {
  logInfo('Presentation modundan grid\'e geçiliyor (ekran paylaşımı yok)')
  layoutStore.switchLayoutWithSave('grid')
}
// Diğer layout'larda değişiklik yapma - kullanıcı tercihi korunuyor
```

### **B) useMeeting.js'de Düzeltilecek Kod:**
```javascript
// ❌ Eski (problemli) kod:
// Layout'u kanala ilk kez katıldığında grid'e sıfırla
const layoutStore = useLayoutStore()
if (layoutStore.currentLayout !== 'grid') {
  logInfo('Kanala ilk kez katılındı, layout grid\'e sıfırlanıyor')
  layoutStore.switchLayoutWithSave('grid') // ❌ BURADA DA ZORLA GRID'E GEÇİYOR!
}

// ✅ Yeni (düzeltilmiş) kod:
// Layout'u sadece presentation modundaysa grid'e sıfırla
const layoutStore = useLayoutStore()
if (layoutStore.currentLayout === 'presentation') {
  logInfo('Presentation modundan grid\'e geçiliyor (kanala ilk katılım)')
  layoutStore.switchLayoutWithSave('grid')
}
// Diğer layout'larda değişiklik yapma
```

## **✅ Test Edilecekler:**

- [ ] Yayındayken yeni kullanıcı katıldığında layout değişmiyor mu?
- [ ] Spotlight modunda kalıyor mu?
- [ ] Whiteboard modunda kalıyor mu?
- [ ] Sadece presentation modundan grid'e geçiyor mu?
- [ ] Kullanıcı layout tercihi korunuyor mu?
- [ ] LocalStorage'da doğru layout kaydediliyor mu?

## **📅 Öncelik Sırası:**

1. **Yüksek**: useVideo.js'de USER_JOINED event'i düzeltme
2. **Yüksek**: useMeeting.js'de joinChannel layout sıfırlama düzeltme
3. **Orta**: Layout store'da otomatik kaydetme mantığı gözden geçirme
4. **Düşük**: Test ve debug

## **🔍 Notlar:**

- **Ana Problem**: `useVideo.js`'de yeni kullanıcı katıldığında otomatik grid layout'a zorla geçiş
- **İkincil Problem**: `useMeeting.js`'de kanala katılımda layout sıfırlama
- **Etkilenen Layout'lar**: spotlight, whiteboard, presentation (hepsi grid'e zorlanıyor)
- **Kullanıcı Deneyimi**: Layout tercihi korunmuyor, sürekli grid'e dönüyor
- **Çözüm Yaklaşımı**: Sadece gerekli durumlarda layout değişimi (presentation → grid)

## **🚀 Çözüm Stratejisi:**

### **Seçenek 1: Minimal Değişiklik (Önerilen)**
- Sadece presentation modundan grid'e geçiş yap
- Diğer layout'larda değişiklik yapma
- Mevcut mantığı koru, sadece koşulları sıkılaştır

### **Seçenek 2: Koşullu Layout Değişimi**
- Layout değişim öncesi mevcut durumu kontrol et
- Sadece gerekli durumlarda değiştir
- Kullanıcı tercihini öncelikle

### **Seçenek 3: Kullanıcı Onayı Sistemi**
- Layout değişim öncesi kullanıcıya sor
- Onay verilmezse mevcut layout'ta kal
- Daha interaktif ama karmaşık

## **📞 Sorular:**

- Hangi çözüm yaklaşımını tercih edersin?
- Hangi layout'larda otomatik değişim olsun?
- Kullanıcı onayı sistemi gerekli mi?
- Test sırası nasıl olacak?

---

**📅 Oluşturulma Tarihi:** $(date)
**👤 Oluşturan:** AI Assistant
**🎯 Durum:** Planlandı
**📋 Sonraki Adım:** Kullanıcı onayı bekleniyor
**🔗 İlgili Problem:** Layout otomatik değişimi ve kullanıcı tercihi korunmaması
