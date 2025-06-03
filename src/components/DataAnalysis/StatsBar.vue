<template>
  <div class="stats-bar">
    <div class="stats-container">
      <div class="stat-item">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <span class="stat-label">总IP数量</span>
          <span class="stat-value">{{ statistics.totalIPs }}</span>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon">🏷️</div>
        <div class="stat-content">
          <span class="stat-label">组别数量</span>
          <span class="stat-value">{{ statistics.totalGroups }}</span>
        </div>
      </div>
    </div>
    <div class="stats-actions">
      <button @click="$emit('toggleFilterPanel')" class="header-btn filter-btn">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 12l2-2v-2a7 7 0 1 1 14 0v2l2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/>
          <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"/>
        </svg>
        <span>指标筛选</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  statistics: {
    totalIPs: number;
    totalGroups: number;
    totalEvaluations?: number;
  };
}

defineProps<Props>();

defineEmits<{
  toggleFilterPanel: [];
}>();
</script>

<style scoped>
.stats-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid #e9ecef;
}

.stats-container {
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.stat-icon {
  font-size: 20px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  color: #007bff;
  font-weight: bold;
}

.stats-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-btn {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-decoration: none;
  color: white;
}

.header-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.header-btn.filter-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.btn-icon {
  width: 18px;
  height: 18px;
  margin-right: 6px;
  stroke-width: 2;
}
</style> 