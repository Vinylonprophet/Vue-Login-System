<template>
  <div class="footer-section">
    <div class="footer-left">
      <span class="status-indicator online"></span>
      <span>系统运行正常</span>
    </div>
    <div class="footer-right">
      <span>可视化大屏模式</span>
      <span style="margin-left: 20px;">最后更新: {{ timeService.lastUpdateTime.value }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { timeService } from '../services/time.service'
</script>

<style scoped>
/* 底部状态栏 */
.footer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 1px solid rgba(0, 212, 255, 0.2);
  font-size: 14px;
  z-index: 10;
  position: relative;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ff88;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(0, 255, 136, 0.6);
}

.status-indicator.online {
  background: #00ff88;
  box-shadow: 0 0 6px rgba(0, 255, 136, 0.6);
}

.status-indicator.warning {
  background: #ffa726;
  box-shadow: 0 0 6px rgba(255, 167, 38, 0.6);
}

.status-indicator.error {
  background: #ff6b6b;
  box-shadow: 0 0 6px rgba(255, 107, 107, 0.6);
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.footer-right {
  color: #ccc;
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .footer-section {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .footer-right {
    flex-direction: column;
    gap: 5px;
  }
  
  .footer-right span {
    margin-left: 0 !important;
  }
}

@media (max-width: 480px) {
  .footer-section {
    font-size: 12px;
  }
}
</style> 