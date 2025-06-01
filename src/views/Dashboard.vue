<template>
  <div class="dashboard-screen">
    <!-- 顶部导航和标题 -->
    <DashboardHeader />
      
    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧数据统计面板 -->
      <StatisticsPanel />
          
      <!-- 中央地图区域 -->
      <MapContainer />

      <!-- 右侧详情面板 -->
      <RealtimePanel />
    </div>
          
    <!-- 底部状态栏 -->
    <DashboardFooter />
          
    <!-- 粒子背景效果 -->
    <ParticleBackground />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import DashboardHeader from '../components/DashboardHeader.vue'
import StatisticsPanel from '../components/StatisticsPanel.vue'
import MapContainer from '../components/MapContainer.vue'
import RealtimePanel from '../components/RealtimePanel.vue'
import DashboardFooter from '../components/DashboardFooter.vue'
import ParticleBackground from '../components/ParticleBackground.vue'
import { mapService } from '../services/map.service'
import { chartService } from '../services/chart.service'
import { dataService } from '../services/data.service'

// 窗口大小改变时重新调整图表
const handleResize = () => {
  mapService.resize()
  chartService.resize()
}

onMounted(async () => {
  console.log('=== Dashboard组件开始初始化 ===')
  
  // 启动模拟数据生成
  dataService.startMockDataGeneration()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  console.log('=== Dashboard组件初始化完成 ===')
})

onUnmounted(() => {
  // 销毁图表实例
  mapService.dispose()
  chartService.dispose()
  
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #001428 0%, #002b5c 50%, #001428 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
}

/* 主体内容 */
.main-content {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 30px;
  min-height: calc(100vh - 160px);
  z-index: 10;
  position: relative;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .main-content {
    grid-template-columns: 250px 1fr 250px;
    gap: 20px;
  }
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 200px 1fr 200px;
  }
}

@media (max-width: 1000px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
}

@media (max-width: 768px) {
  .dashboard-screen {
    padding: 15px;
  }
}
</style> 


