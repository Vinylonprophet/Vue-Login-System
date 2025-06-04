<template>
  <div class="header">
    <div class="header-top">
      <h1>少数民族民俗体育IP数据分析平台</h1>
      <div class="header-actions">
        <button 
          @click="$emit('performAnalysis')" 
          class="header-btn analysis-btn" 
          :disabled="selectedIPsCount < 2"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <span>全面分析</span>
        </button>
        <button 
          @click="$emit('generateReport')" 
          class="header-btn export-btn" 
          :disabled="!hasAnalysisResults"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M12 11c1.5 0 2.7 1.2 2.7 2.7S13.5 16.4 12 16.4 9.3 15.2 9.3 13.7 10.5 11 12 11z"/>
            <path d="M8 17h8"/>
            <path d="M8 19h8"/>
          </svg>
          <span>生成报告</span>
        </button>
        <button 
          @click="$emit('exportExcel')" 
          class="header-btn excel-btn" 
          :disabled="!hasAnalysisResults"
        >
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <path d="M14 2v6h6"/>
            <path d="M9 15h6"/>
            <path d="M12 9v6"/>
          </svg>
          <span>导出Excel</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  selectedIPsCount: number;
  hasAnalysisResults: boolean;
}

defineProps<Props>();

defineEmits<{
  performAnalysis: [];
  generateReport: [];
  exportExcel: [];
}>();
</script>

<style scoped>
.header {
  margin-bottom: 20px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.header h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
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

.header-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.header-btn.analysis-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.header-btn.export-btn {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.header-btn.export-btn:hover {
  background: linear-gradient(135deg, #ff8a95 0%, #fdbddd 100%);
}

.header-btn.export-btn:disabled {
  background: linear-gradient(135deg, #d6d6d6 0%, #e9e9e9 100%);
  color: #999;
}

.header-btn.excel-btn {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
}

.header-btn.excel-btn:hover {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.header-btn.excel-btn:disabled {
  background: linear-gradient(135deg, #d6d6d6 0%, #e9e9e9 100%);
  color: #999;
}

.btn-icon {
  width: 18px;
  height: 18px;
  margin-right: 6px;
  stroke-width: 2;
}
</style> 