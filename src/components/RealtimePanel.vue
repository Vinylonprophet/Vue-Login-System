<template>
  <div class="right-panel">
    <!-- 实时数据流 -->
    <div class="realtime-card">
      <h3>实时数据流</h3>
      <div class="data-stream">
        <div v-for="item in dataService.realtimeData.value" :key="item.id" class="stream-item">
          <div class="stream-time">{{ item.time }}</div>
          <div class="stream-content">{{ item.content }}</div>
        </div>
      </div>
    </div>

    <!-- 项目类型分布 -->
    <div class="chart-card">
      <h3>项目类型分布</h3>
      <div id="typeChart" ref="typeChartRef" class="mini-chart"></div>
    </div>

    <!-- 月度趋势 -->
    <div class="chart-card">
      <h3>月度增长趋势</h3>
      <div id="trendChart" ref="trendChartRef" class="mini-chart"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { dataService } from '../services/data.service'
import { chartService } from '../services/chart.service'

const typeChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()

// 窗口大小变化处理
const handleResize = () => {
  chartService.resize()
}

onMounted(() => {
  // 启动模拟数据生成
  dataService.startMockDataGeneration()
  
  // 初始化图表
  setTimeout(() => {
    if (typeChartRef.value) {
      chartService.initTypeChart(typeChartRef.value)
      
      // 更新为实际数据
      const typeData = dataService.getProjectTypeDistribution()
      chartService.updateTypeChartData(typeData)
    }
    
    if (trendChartRef.value) {
      chartService.initTrendChart(trendChartRef.value)
      
      // 更新为实际数据
      const trendData = dataService.getMonthlyTrend()
      chartService.updateTrendChartData(trendData.data, trendData.months)
    }
  }, 100)
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.realtime-card, .chart-card {
  background: rgba(0, 32, 64, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.realtime-card h3, .chart-card h3 {
  margin: 0 0 15px 0;
  color: #00d4ff;
  font-size: 16px;
}

.data-stream {
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 212, 255, 0.3) transparent;
}

.data-stream::-webkit-scrollbar {
  width: 6px;
}

.data-stream::-webkit-scrollbar-track {
  background: transparent;
}

.data-stream::-webkit-scrollbar-thumb {
  background: rgba(0, 212, 255, 0.3);
  border-radius: 3px;
}

.data-stream::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 212, 255, 0.5);
}

.stream-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
  animation: fadeInUp 0.3s ease-out;
}

.stream-item:last-child {
  border-bottom: none;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stream-time {
  font-size: 12px;
  color: #00ff88;
  font-family: 'Courier New', monospace;
  font-weight: bold;
}

.stream-content {
  font-size: 13px;
  color: #ccc;
  margin-top: 2px;
  line-height: 1.4;
}

.mini-chart {
  height: 150px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .mini-chart {
    height: 120px;
  }
}

@media (max-width: 1000px) {
  .right-panel {
    flex-direction: row;
    overflow-x: auto;
  }
  
  .chart-card, .realtime-card {
    min-width: 200px;
  }
  
  .data-stream {
    max-height: 150px;
  }
}

@media (max-width: 768px) {
  .right-panel {
    flex-direction: column;
  }
  
  .mini-chart {
    height: 100px;
  }
}
</style> 