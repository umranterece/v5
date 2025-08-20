<template>
  <div class="whiteboard-layout">
    <!-- Full Screen AdvancedWhiteboard -->
    <AdvancedWhiteboard 
      :users="users"
      :logger="logger"
    />
  </div>
</template>

<script setup>
import { AdvancedWhiteboard } from '../whiteboard/index.js'

// Props
const props = defineProps({
  users: { type: Array, default: () => [] },
  logger: { 
    type: Object, 
    default: () => ({
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      fatal: () => {}
    })
  }
})
</script>

<style scoped>
.whiteboard-layout {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  position: relative;
}
</style>
