<template>
  <div class="header-section">
    <div class="header-left">
      <h1 class="main-title">少数民族民俗体育IP可视化大屏</h1>
      <div class="time-display">{{ timeService.currentTime.value }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { timeService } from '../services/time.service'

onMounted(() => {
  timeService.startTimeUpdate()
})

onUnmounted(() => {
  timeService.stopTimeUpdate()
})
</script>

<style scoped>
/* 顶部导航 */
.header-section {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 30px;
  z-index: 10;
  position: relative;
}

.header-left .main-title {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 10px 0;
  background: linear-gradient(45deg, #00d4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.time-display {
  font-size: 16px;
  color: #00d4ff;
  font-family: 'Courier New', monospace;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .header-left .main-title {
    font-size: 24px;
  }
}

@media (max-width: 1000px) {
  .header-section {
    flex-direction: column;
    gap: 15px;
    align-items: center;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .header-left .main-title {
    font-size: 20px;
  }
}
</style> 