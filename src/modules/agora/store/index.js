/**
 * Agora Store Dışa Aktarımı
 * Bu dosya, tüm Agora store'larını merkezi bir noktadan dışa aktarır.
 * Store'lar Pinia tabanlı state management için kullanılır ve buradan tek noktadan erişilebilir.
 * @module store
 */

import { useAgoraStore } from './agora.js'

export { useAgoraStore }

// TODO: Create separate store files for better modularity:
// - video.js: Video-specific state management
// - screen.js: Screen sharing state management
// - recording.js: Recording state management
// - whiteboard.js: Whiteboard state management 