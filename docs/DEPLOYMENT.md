# 🚀 **Deployment Rehberi**

> **Context Engineering** yaklaşımı ile hazırlanmış kapsamlı deployment dokümantasyonu

## 🎯 **Genel Bakış**

Bu dokümantasyon, **rs-agora-module** projesinin farklı ortamlarda nasıl deploy edileceğini detaylandırır. **Context Engineering** prensiplerine uygun olarak, deployment kararlarının nedenleri ve trade-off'ları açıklanmıştır.

## 🏗️ **Deployment Mimarisi**

### **1. Build Stratejisi**
```bash
# Library build (npm publish için)
npm run build:lib

# Development build
npm run dev

# Production build
npm run build
```

### **2. Build Çıktıları**
```
dist/
├── index.umd.js          # UMD bundle (browser, AMD, CommonJS)
├── index.esm.js          # ES Module bundle
├── index.d.ts            # TypeScript definitions
└── index.umd.js.map     # Source maps
```

## 🌍 **Deployment Ortamları**

### **1. NPM Package Deployment**

#### **Pre-deployment Checklist**
- [ ] `package.json` version güncellendi
- [ ] `CHANGELOG.md` güncellendi
- [ ] Tests başarılı
- [ ] Build başarılı
- [ ] Bundle size kontrol edildi

#### **Deployment Komutları**
```bash
# Build library
npm run build:lib

# Publish to npm
npm publish

# Publish with specific tag
npm publish --tag beta
```

#### **Package.json Konfigürasyonu**
```json
{
  "name": "rs-agora-module",
  "version": "1.0.0",
  "main": "dist/index.umd.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "files": ["dist", "README.md"],
  "scripts": {
    "build:lib": "vite build --config vite.lib.config.js",
    "prepublishOnly": "npm run build:lib"
  }
}
```

### **2. CDN Deployment**

#### **Vercel Deployment**
```bash
# Vercel CLI kurulumu
npm i -g vercel

# Deploy
vercel --prod
```

#### **Netlify Deployment**
```bash
# Netlify CLI kurulumu
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

#### **AWS S3 + CloudFront**
```bash
# AWS CLI kurulumu
aws configure

# S3'e upload
aws s3 sync dist/ s3://your-bucket-name/

# CloudFront invalidation
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### **3. Docker Deployment**

#### **Dockerfile**
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:lib

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### **Docker Compose**
```yaml
version: '3.8'
services:
  agora-module:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

## 🔧 **Build Konfigürasyonu**

### **1. Vite Library Config**
```javascript
// vite.lib.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/modules/agora/index.js'),
      name: 'RsAgoraModule',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['vue', 'pinia', 'mitt', 'agora-rtc-sdk-ng'],
      output: {
        globals: {
          vue: 'Vue',
          pinia: 'Pinia',
          mitt: 'mitt',
          'agora-rtc-sdk-ng': 'AgoraRTC'
        }
      }
    },
    sourcemap: true,
    minify: 'terser'
  }
})
```

### **2. Environment Variables**
```bash
# .env.production
VITE_AGORA_APP_ID=your_app_id
VITE_AGORA_TOKEN_SERVER_URL=https://your-token-server.com
VITE_ENVIRONMENT=production
```

## 📊 **Performance Optimizasyonları**

### **1. Bundle Size Optimizasyonu**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'agora-core': ['agora-rtc-sdk-ng'],
          'vue-deps': ['vue', 'pinia']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
```

### **2. Tree Shaking**
```javascript
// index.js - Named exports kullanımı
export { AgoraConference } from './components/AgoraConference.vue'
export { useMeeting } from './composables/useMeeting.js'
// Default export yerine named export
```

## 🔒 **Security Considerations**

### **1. Environment Variables**
```javascript
// constants.js
export const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID
export const AGORA_TOKEN_SERVER_URL = import.meta.env.VITE_AGORA_TOKEN_SERVER_URL

// Validation
if (!AGORA_APP_ID) {
  throw new Error('AGORA_APP_ID is required')
}
```

### **2. CSP Headers**
```nginx
# nginx.conf
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
```

## 🧪 **Testing Before Deployment**

### **1. Pre-deployment Tests**
```bash
# Unit tests
npm run test

# Build test
npm run build:lib

# Bundle analysis
npm run analyze

# E2E tests
npm run test:e2e
```

### **2. Bundle Analysis**
```bash
# Bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({
      filename: 'bundle-analysis.html',
      open: true
    })
  ]
})
```

## 📈 **Monitoring ve Analytics**

### **1. Performance Monitoring**
```javascript
// usePerformance.js
export const usePerformance = () => {
  const trackBundleLoad = () => {
    const loadTime = performance.now()
    console.log(`Bundle loaded in ${loadTime}ms`)
  }
  
  return { trackBundleLoad }
}
```

### **2. Error Tracking**
```javascript
// useErrorTracking.js
export const useErrorTracking = () => {
  const trackError = (error, context) => {
    // Error tracking service integration
    console.error('Error tracked:', error, context)
  }
  
  return { trackError }
}
```

## 🚨 **Rollback Stratejisi**

### **1. Version Tagging**
```bash
# Git tag oluşturma
git tag v1.0.0
git push origin v1.0.0

# NPM tag oluşturma
npm dist-tag add rs-agora-module@1.0.0 latest
```

### **2. Quick Rollback**
```bash
# Previous version'a rollback
npm publish rs-agora-module@1.0.0 --tag latest

# CDN cache invalidation
# (CDN provider'a göre değişir)
```

## 📋 **Deployment Checklist**

### **Pre-deployment**
- [ ] Code review tamamlandı
- [ ] Tests başarılı
- [ ] Build başarılı
- [ ] Bundle size kabul edilebilir
- [ ] Environment variables ayarlandı
- [ ] Security scan tamamlandı

### **Deployment**
- [ ] Production build oluşturuldu
- [ ] NPM package publish edildi
- [ ] CDN deployment tamamlandı
- [ ] Health check başarılı
- [ ] Performance metrics normal

### **Post-deployment**
- [ ] Monitoring aktif
- [ ] Error tracking aktif
- [ ] User feedback toplandı
- [ ] Performance metrics izleniyor
- [ ] Rollback plan hazır

## 🔍 **Troubleshooting**

### **1. Build Hataları**
```bash
# Node modules temizleme
rm -rf node_modules package-lock.json
npm install

# Cache temizleme
npm run clean
npm run build:lib
```

### **2. Deployment Hataları**
```bash
# Log kontrolü
npm run build:lib --verbose

# Bundle analysis
npm run analyze

# Size check
ls -la dist/
```

## 📚 **Ek Kaynaklar**

- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [CDN Performance Guide](https://web.dev/fast/)

---

> **Not**: Bu deployment rehberi, **Context Engineering** prensiplerine uygun olarak hazırlanmıştır. Her deployment kararının nedenleri ve alternatifleri açıklanmıştır.
