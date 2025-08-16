import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/modules/agora/index.js'),
      name: 'AgoraVueModule',
      fileName: (format) => `index.${format === 'es' ? 'esm' : format}.js`
    },
    rollupOptions: {
      external: ['vue', 'pinia', 'agora-rtc-sdk-ng', 'mitt'],
      output: {
        globals: {
          vue: 'Vue',
          pinia: 'Pinia',
          'agora-rtc-sdk-ng': 'AgoraRTC',
          mitt: 'mitt'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
}) 