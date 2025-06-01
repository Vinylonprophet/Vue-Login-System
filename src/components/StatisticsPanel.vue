<template>
  <div class="left-panel">
    <!-- 统计卡片 -->
    <div class="stat-card">
      <div class="stat-icon">🏗️</div>
      <div class="stat-content">
        <div class="stat-value">{{ displayStats.totalProjects }}</div>
        <div class="stat-label">体育项目</div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon">📍</div>
      <div class="stat-content">
        <div class="stat-value">{{ displayStats.provinceCount }}</div>
        <div class="stat-label">覆盖省份</div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon">🎯</div>
      <div class="stat-content">
        <div class="stat-value">{{ displayStats.cityCount }}</div>
        <div class="stat-label">覆盖城市</div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon">⭐</div>
      <div class="stat-content">
        <div class="stat-value">{{ dataService.averageScore.value }}</div>
        <div class="stat-label">平均评分</div>
      </div>
    </div>

    <!-- 地区排行榜 -->
    <div class="ranking-card">
      <h3>地区排行榜</h3>
      <div class="ranking-list">
        <div 
          v-for="(region, index) in dataService.topRegions.value" 
          :key="region.name" 
          class="ranking-item"
        >
          <div class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
          <div class="region-name">{{ region.name }}</div>
          <div class="region-score">{{ region.score }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { mapService } from '../services/map.service'
import { dataService } from '../services/data.service'

// 计算显示的统计数据（优先使用地图服务的实时数据）
const displayStats = computed(() => ({
  totalProjects: mapService.mapStats.totalProjects || dataService.totalProjects.value,
  provinceCount: mapService.mapStats.provinceCount || dataService.totalRegions.value,
  cityCount: mapService.mapStats.cityCount || 0
}))
</script>

<style scoped>
/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-card {
  background: rgba(0, 32, 64, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.stat-icon {
  font-size: 24px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 212, 255, 0.2);
  border-radius: 50%;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #00ff88;
}

.stat-label {
  font-size: 14px;
  color: #ccc;
}

.ranking-card {
  background: rgba(0, 32, 64, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  flex: 1;
}

.ranking-card h3 {
  margin: 0 0 15px 0;
  color: #00d4ff;
  font-size: 16px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 212, 255, 0.1);
}

.rank-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

.rank-1 { background: #ffd700; color: #000; }
.rank-2 { background: #c0c0c0; color: #000; }
.rank-3 { background: #cd7f32; color: #fff; }
.rank-number:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #00d4ff;
  color: #fff;
}

.region-name {
  flex: 1;
  font-size: 14px;
}

.region-score {
  font-size: 14px;
  font-weight: bold;
  color: #00ff88;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stat-card {
    padding: 15px;
  }
}

@media (max-width: 1000px) {
  .left-panel {
    flex-direction: row;
    overflow-x: auto;
  }
  
  .stat-card {
    min-width: 200px;
  }
}
</style> 