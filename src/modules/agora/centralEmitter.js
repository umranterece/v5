import mitt from 'mitt'

// Tüm modüller için merkezi event emitter
export const centralEmitter = mitt()
export default centralEmitter 