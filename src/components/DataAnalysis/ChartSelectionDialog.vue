<template>
  <div v-if="show" class="chart-selection-overlay">
    <div class="chart-selection-dialog">
      <div class="dialog-header">
        <h3>选择要导出的图表</h3>
        <button @click="handleClose" class="close-btn">×</button>
      </div>
      
      <div class="dialog-content">
        <p class="dialog-description">请选择您想要在PDF中包含的图表：</p>
        
        <div class="chart-selection-list">
          <div 
            v-for="chart in availableCharts" 
            :key="chart.id"
            class="chart-selection-item"
            :class="{ disabled: chart.disabled }"
          >
            <label class="chart-checkbox-label">
              <input 
                type="checkbox" 
                v-model="selectedCharts"
                :value="chart.id"
                :disabled="chart.disabled"
                class="chart-checkbox"
              />
              <div class="chart-info">
                <div class="chart-title">
                  <span class="chart-icon">{{ chart.icon }}</span>
                  <span class="chart-name">{{ chart.title }}</span>
                  <span v-if="chart.disabled" class="disabled-reason">(无数据)</span>
                </div>
                <div class="chart-description">{{ chart.description }}</div>
              </div>
            </label>
          </div>
        </div>
        
        <div class="selection-summary">
          <p>已选择 <strong>{{ selectedCharts.length }}</strong> 个图表</p>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button @click="handleSelectAll" class="btn btn-secondary">
          {{ isAllSelected ? '取消全选' : '全选' }}
        </button>
        <button 
          @click="handleConfirm" 
          class="btn btn-primary"
          :disabled="selectedCharts.length === 0"
        >
          导出PDF ({{ selectedCharts.length }}个图表)
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface ChartOption {
  id: string;
  title: string;
  icon: string;
  disabled: boolean;
  description?: string;
}

interface Props {
  show: boolean;
  availableCharts: ChartOption[];
  initialSelectedCharts?: string[];
}

interface Emits {
  (e: 'close'): void;
  (e: 'confirm', selectedCharts: string[]): void;
}

const props = withDefaults(defineProps<Props>(), {
  initialSelectedCharts: () => []
});

const emit = defineEmits<Emits>();

// 响应式数据
const selectedCharts = ref<string[]>([]);

// 计算属性
const availableEnabledCharts = computed(() => 
  props.availableCharts.filter(chart => !chart.disabled)
);

const isAllSelected = computed(() => 
  selectedCharts.value.length === availableEnabledCharts.value.length
);

// 监听props变化
watch(() => props.initialSelectedCharts, (newValue) => {
  selectedCharts.value = [...newValue];
}, { immediate: true });

watch(() => props.show, (newValue) => {
  if (newValue) {
    // 弹窗打开时，默认选择所有可用图表
    selectedCharts.value = availableEnabledCharts.value.map(chart => chart.id);
  }
});

// 方法
const handleClose = () => {
  emit('close');
};

const handleSelectAll = () => {
  if (isAllSelected.value) {
    selectedCharts.value = [];
  } else {
    selectedCharts.value = availableEnabledCharts.value.map(chart => chart.id);
  }
};

const handleConfirm = () => {
  if (selectedCharts.value.length === 0) {
    return;
  }
  emit('confirm', selectedCharts.value);
};
</script>

<style scoped>
.chart-selection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.chart-selection-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.dialog-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dialog-content {
  padding: 24px;
  max-height: 50vh;
  overflow-y: auto;
}

.dialog-description {
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
}

.chart-selection-list {
  space-y: 12px;
}

.chart-selection-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.chart-selection-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.chart-selection-item.disabled {
  opacity: 0.5;
  background: #f5f5f5;
}

.chart-checkbox-label {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  width: 100%;
}

.chart-checkbox-label:hover {
  background: #f8f9fa;
}

.chart-checkbox {
  margin-right: 12px;
  transform: scale(1.2);
}

.chart-info {
  flex: 1;
}

.chart-title {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.chart-icon {
  margin-right: 8px;
  font-size: 18px;
}

.chart-name {
  font-weight: 500;
  color: #2c3e50;
}

.disabled-reason {
  color: #999;
  font-size: 12px;
  margin-left: 8px;
}

.chart-description {
  font-size: 12px;
  color: #666;
}

.selection-summary {
  margin-top: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  text-align: center;
}

.dialog-actions {
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  background: #f8f9fa;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}
</style> 