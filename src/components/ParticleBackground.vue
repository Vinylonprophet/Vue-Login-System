<template>
  <div class="particle-background" ref="particleContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const particleContainer = ref<HTMLElement>()

// 创建粒子效果
const createParticles = () => {
  if (!particleContainer.value) return

  // 清空现有粒子
  particleContainer.value.innerHTML = ''

  const particleCount = 50
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    
    // 随机位置
    particle.style.left = Math.random() * 100 + '%'
    particle.style.top = Math.random() * 100 + '%'
    
    // 随机动画延迟
    particle.style.animationDelay = Math.random() * 10 + 's'
    
    // 随机大小
    const size = Math.random() * 3 + 1
    particle.style.width = size + 'px'
    particle.style.height = size + 'px'
    
    // 随机透明度
    particle.style.opacity = (Math.random() * 0.5 + 0.3).toString()
    
    particleContainer.value.appendChild(particle)
  }
}

onMounted(() => {
  createParticles()
})
</script>

<style scoped>
/* 粒子背景效果 */
.particle-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.particle-background :deep(.particle) {
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(0, 212, 255, 0.6);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.3);
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg);
    opacity: 0.3;
  }
  25% {
    transform: translateY(-15px) rotate(90deg);
    opacity: 0.7;
  }
  50% { 
    transform: translateY(-30px) rotate(180deg);
    opacity: 1;
  }
  75% {
    transform: translateY(-15px) rotate(270deg);
    opacity: 0.7;
  }
}

/* 为不同的粒子添加变化 */
.particle-background :deep(.particle:nth-child(2n)) {
  animation-duration: 10s;
  background: rgba(0, 255, 136, 0.5);
  box-shadow: 0 0 6px rgba(0, 255, 136, 0.3);
}

.particle-background :deep(.particle:nth-child(3n)) {
  animation-duration: 12s;
  background: rgba(255, 107, 107, 0.4);
  box-shadow: 0 0 6px rgba(255, 107, 107, 0.3);
}

.particle-background :deep(.particle:nth-child(4n)) {
  animation-duration: 6s;
  background: rgba(255, 167, 38, 0.4);
  box-shadow: 0 0 6px rgba(255, 167, 38, 0.3);
}

.particle-background :deep(.particle:nth-child(5n)) {
  animation-duration: 14s;
  animation-direction: reverse;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .particle-background :deep(.particle) {
    animation-duration: 6s;
  }
}

@media (prefers-reduced-motion: reduce) {
  .particle-background :deep(.particle) {
    animation: none;
    opacity: 0.2;
  }
}
</style> 