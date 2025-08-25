# 🎯 Whiteboard Status Sync - Yapılacaklar Listesi

## **🎯 Genel Amaç:**
Yayına sonradan katılan kullanıcıların, mevcut whiteboard durumunu öğrenmesi ve otomatik katılım sağlaması.

## **🔧 Çalışma Yapılacak Dosyalar:**

### **1. 📝 `src/modules/agora/constants.js`**
- [ ] Yeni RTM mesaj tipleri ekle:
  ```javascript
  WHITEBOARD_STATUS_REQUEST: 'rtm-whiteboard-status-request',
  WHITEBOARD_STATUS_RESPONSE: 'rtm-whiteboard-status-response'
  ```

### **2. 🎥 `src/modules/agora/components/core/AgoraConference.vue`**
- [ ] Whiteboard status request event listener ekle
- [ ] Whiteboard status response event listener ekle
- [ ] `requestWhiteboardStatus()` fonksiyonu ekle
- [ ] `sendWhiteboardStatusResponse()` fonksiyonu ekle
- [ ] `autoJoinExistingWhiteboard()` fonksiyonu ekle
- [ ] Yeni kullanıcı katıldığında whiteboard durumu sorgulama

### **3. 🔧 `src/modules/agora/composables/useMeeting.js` (Opsiyonel)**
- [ ] `onUserJoined` event'inde whiteboard durumu sorgulama ekle

## **🔄 Tam Süreç:**

```
1. Yeni kullanıcı yayına katılıyor
2. Eğer yayında başka kullanıcılar varsa
3. "whiteboard durumu nedir?" diye sorguluyor
4. Mevcut kullanıcılardan biri cevap veriyor
5. Eğer whiteboard açıksa → Otomatik katılım
6. Eğer whiteboard kapalıysa → Normal akış
```

## **💻 Kod Örnekleri:**

### **A) Constants.js'e Eklenecek:**
```javascript
export const RTM_MESSAGE_TYPES = {
  // ... mevcut mesajlar ...
  
  // 🆕 Whiteboard Status Messages
  WHITEBOARD_STATUS_REQUEST: 'rtm-whiteboard-status-request',
  WHITEBOARD_STATUS_RESPONSE: 'rtm-whiteboard-status-response',
}
```

### **B) AgoraConference.vue'a Eklenecek:**
```javascript
// Whiteboard durumunu sorgula
async requestWhiteboardStatus() {
  // RTM üzerinden durum sorgula
  await rtmService.sendChannelMessage(
    RTM_MESSAGE_TYPES.WHITEBOARD_STATUS_REQUEST,
    { requester: agoraStore.userId, channelName: agoraStore.channelName }
  )
}

// Whiteboard durum cevabı gönder
async sendWhiteboardStatusResponse(requesterId) {
  await rtmService.sendPeerMessage(
    requesterId,
    RTM_MESSAGE_TYPES.WHITEBOARD_STATUS_RESPONSE,
    { hasActiveWhiteboard: true, roomUuid: agoraStore.whiteboardRoomUuid }
  )
}
```

## **✅ Test Edilecekler:**

- [ ] Yeni kullanıcı yayına katıldığında whiteboard durumu sorgulanıyor mu?
- [ ] Mevcut kullanıcılar whiteboard durumu cevabı veriyor mu?
- [ ] Whiteboard açıksa otomatik katılım sağlanıyor mu?
- [ ] Whiteboard kapalıysa normal akış devam ediyor mu?
- [ ] Event listener'lar doğru çalışıyor mu?

## **📅 Öncelik Sırası:**

1. **Yüksek**: Constants.js'e yeni mesaj tipleri
2. **Yüksek**: AgoraConference.vue'da ana logic
3. **Orta**: useMeeting.js'de user joined event
4. **Düşük**: Test ve debug

## **🔍 Notlar:**

- Mevcut RTM servis fonksiyonları kullanılacak
- Mevcut store state'leri kullanılacak
- Mevcut event sistem kullanılacak
- Yeni kullanıcı katıldığında otomatik sorgulama
- 3 saniye timeout ile cevap bekleme
- Fallback mekanizma (cevap gelmezse normal akış)

## **📞 Sorular:**

- Hangi dosyadan başlanacak?
- Test sırası nasıl olacak?
- Başka dosyalarda değişiklik gerekli mi?

---

**📅 Oluşturulma Tarihi:** $(date)
**👤 Oluşturan:** AI Assistant
**🎯 Durum:** Planlandı
**📋 Sonraki Adım:** Kullanıcı onayı bekleniyor
