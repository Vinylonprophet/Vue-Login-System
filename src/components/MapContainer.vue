<template>
  <div class="map-container">
    <div class="map-header">
      <div class="map-title">中国民族体育项目分布图</div>
      <div class="map-navigation">
        <div class="map-breadcrumb">
          <span class="breadcrumb-item" @click="mapService.initChinaMap()">中国</span>
          <span v-if="mapService.currentMapLevel.value !== 'china'" class="breadcrumb-separator">></span>
          <span v-if="mapService.currentMapLevel.value === 'province'" class="breadcrumb-item current">
            {{ mapService.currentMapName.value }}
          </span>
          <span v-if="mapService.currentMapLevel.value === 'city'" 
                class="breadcrumb-item" 
                @click="goBackToProvince()">
            {{ mapService.mapHistory.value[mapService.mapHistory.value.length - 1] }}
          </span>
          <span v-if="mapService.currentMapLevel.value === 'city'" class="breadcrumb-separator">></span>
          <span v-if="mapService.currentMapLevel.value === 'city'" class="breadcrumb-item current">
            {{ mapService.currentMapName.value }}
          </span>
        </div>
        <button v-if="mapService.mapHistory.value.length > 0" @click="mapService.goBackMap()" class="back-btn">
          <span>← 返回</span>
        </button>
      </div>
    </div>
    <div id="chinaMap" ref="mapRef" class="china-map"></div>
    <div class="map-tip">
      {{ mapService.getMapTip() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { mapService } from '../services/map.service'

const mapRef = ref<HTMLElement>()

// 返回省份地图
const goBackToProvince = () => {
  if (mapService.mapHistory.value.length > 0) {
    const provinceName = mapService.mapHistory.value[mapService.mapHistory.value.length - 1]
    mapService.loadProvinceMap(provinceName)
  }
}

// 窗口大小变化处理
const handleResize = () => {
  mapService.resize()
}

onMounted(async () => {
  if (mapRef.value) {
    // 初始化地图实例
    mapService.initMapChart(mapRef.value)
    
    // 延迟初始化地图数据，确保DOM已渲染
    setTimeout(async () => {
      await mapService.initChinaMap()
    }, 100)
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 中央地图区域 */
.map-container {
  display: flex;
  flex-direction: column;
  background: rgba(0, 32, 64, 0.6);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  position: relative;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.map-title {
  font-size: 20px;
  font-weight: bold;
  color: #00d4ff;
}

.map-navigation {
  display: flex;
  align-items: center;
}

.map-breadcrumb {
  display: flex;
  align-items: center;
}

.breadcrumb-item {
  cursor: pointer;
  color: #00ff88;
  margin-right: 5px;
  transition: color 0.3s ease;
}

.breadcrumb-item:hover {
  color: #00d4ff;
}

.breadcrumb-separator {
  margin: 0 5px;
  color: #ccc;
}

.breadcrumb-item.current {
  font-weight: bold;
  cursor: default;
}

.breadcrumb-item.current:hover {
  color: #00ff88;
}

.back-btn {
  background: rgba(0, 212, 255, 0.2);
  border: 1px solid rgba(0, 212, 255, 0.5);
  color: #00ff88;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  margin-left: 15px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(0, 212, 255, 0.3);
  border-color: #00d4ff;
}

.china-map {
  flex: 1;
  min-height: 500px;
  border-radius: 8px;
}

.map-tip {
  text-align: center;
  font-size: 14px;
  color: #ccc;
  margin-top: 20px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
}

/* 响应式设计 */
@media (max-width: 1000px) {
  .map-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .map-navigation {
    justify-content: center;
  }
  
  .map-title {
    text-align: center;
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .china-map {
    min-height: 300px;
  }
  
  .map-breadcrumb {
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
  }
}
</style> 