<template>
  <div class="dashboard-container">
    <!-- 使用HeaderSection组件 -->
    <HeaderSection 
      :selectedIPsCount="selectedIPs.length"
      :hasAnalysisResults="hasAnalysisResults"
      @performAnalysis="performComprehensiveAnalysis"
      @exportPDF="exportToPDF"
      @exportExcel="exportToExcel"
    />
    
    <!-- 使用StatsBar组件 -->
    <StatsBar 
      :statistics="statistics"
      @toggleFilterPanel="toggleFilterPanel"
    />
    
    <!-- 筛选面板 -->
    <div class="filter-section" v-show="showFilterPanel">
      <h3>指标筛选</h3>
      
      <!-- 一级指标 -->
      <div class="indicator-group">
        <h4>一级指标</h4>
        <div class="checkbox-group">
          <label v-for="indicator in indicatorStructure.firstLevel" :key="indicator" class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="selectedFirstLevel"
              :value="indicator"
              @change="updateFilteredIndicators"
            />
            {{ indicator }}
          </label>
        </div>
      </div>

      <!-- 二级指标 -->
      <div class="indicator-group">
        <h4>二级指标</h4>
        <div class="checkbox-group">
          <label v-for="indicator in indicatorStructure.secondLevel" :key="indicator" class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="selectedSecondLevel"
              :value="indicator"
              @change="updateFilteredIndicators"
            />
            {{ indicator }}
          </label>
        </div>
      </div>
          
      <div class="filter-actions">
        <button @click="clearFilters" class="btn btn-secondary">清空筛选</button>
        <button @click="applyFilters" class="btn btn-primary">应用筛选</button>
      </div>
    </div>
          
    <!-- 图表切换按钮 -->
    <div class="chart-tabs">
      <button 
        v-for="chart in chartTabs" 
        :key="chart.id"
        @click="activeChart = chart.id"
        :class="{ active: activeChart === chart.id, disabled: chart.disabled }"
        :disabled="chart.disabled"
        class="chart-tab"
      >
        <span class="tab-icon">{{ chart.icon }}</span>
        <span class="tab-title">{{ chart.title }}</span>
        <span class="tab-count" v-if="chart.count">{{ chart.count }}</span>
      </button>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-dashboard">
      <!-- 左侧IP选择面板 -->
      <div class="ip-selection-sidebar">
        <div class="sidebar-header">
          <h3>选择分析IP</h3>
          <div class="selection-summary">
            <span class="selected-count">{{ selectedIPs.length }}/{{ filteredIPs.length }}</span>
          </div>
        </div>
          
        <!-- 分组筛选 -->
        <div class="group-filter-section">
          <label>筛选组别:</label>
          <select v-model="ipGroupFilter" @change="updateFilteredIPs">
            <option value="全部">全部组别</option>
            <option v-for="group in availableGroups" :key="group" :value="group">{{ group }}</option>
          </select>
        </div>

        <!-- 选择操作 -->
        <div class="selection-controls">
          <button @click="selectAllFilteredIPs" class="btn btn-sm btn-primary">
            {{ ipGroupFilter === '全部' ? '全选' : `选择${ipGroupFilter}组` }}
          </button>
          <button @click="clearSelection" class="btn btn-sm btn-secondary">清空</button>
        </div>

        <!-- IP列表 -->
        <div class="ip-list-container">
          <div 
            v-for="ip in filteredIPs" 
            :key="ip.id" 
            class="ip-item"
            :class="{ selected: isIPSelected(ip.id) }"
            @click="toggleIPSelection(ip.id)"
          >
            <div class="ip-checkbox">
              <input 
                type="checkbox" 
                :checked="isIPSelected(ip.id)"
                @click.stop
                @change="toggleIPSelection(ip.id)"
              />
            </div>
            <div class="ip-content">
              <div class="ip-name">{{ ip.project_name }}</div>
              <div class="ip-group">{{ ip.group_name }}</div>
              <div class="ip-indicators">{{ filteredThirdIndicators.length }}个指标</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧图表区域 -->
      <div class="chart-main-area">
        <!-- 图表展示区域 -->
        <div class="chart-display">
          <!-- 适应度变化曲线 -->
          <div v-show="activeChart === 'fitness'" class="chart-panel">
            <h3>适应度变化曲线</h3>
            <div class="chart">
              <canvas id="fitnessChart" ref="fitnessChart" v-if="evaluationResult && evaluationResult.fitnessHistory.length > 0"></canvas>
              <div v-else class="chart-placeholder">
                选择IP并点击"全面分析"按钮后显示遗传算法适应度变化曲线
              </div>
            </div>
          </div>

          <!-- IP评分分布 -->
          <div v-show="activeChart === 'scores'" class="chart-panel">
            <h3>IP评分分布</h3>
            <div class="chart">
              <canvas id="scoreChart" ref="scoreChart" v-if="evaluationResult && evaluationResult.evaluation.length > 0"></canvas>
              <div v-else class="chart-placeholder">
                选择IP并点击"全面分析"按钮后显示IP评分分布图表
              </div>
            </div>
          </div>
          
          <!-- 其他图表类似... -->
        </div>
      </div>
    </div>

    <!-- 使用LogPanel组件 -->
    <LogPanel :logs="logs" />

    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import { type IP, type EvaluationResult, type IndicatorStructure } from '../../utils/api';

// 导入Services
import { ChartService } from '../../services/DataAnalysis/chartService';
import { AIService } from '../../services/DataAnalysis/aiService';
import { ExportService } from '../../services/DataAnalysis/exportService';
import { DataService } from '../../services/DataAnalysis/dataService';

// 导入Components
import HeaderSection from './HeaderSection.vue';
import StatsBar from './StatsBar.vue';
import LogPanel from './LogPanel.vue';

// 响应式数据
const loading = ref(false);
const loadingText = ref('加载中...');
const activeChart = ref('fitness');

// 指标结构
const indicatorStructure = ref<IndicatorStructure>({
  firstLevel: [],
  secondLevel: [],
  firstToSecond: {},
  secondToThird: {},
  allThird: [],
  indicatorPropertyMap: {},
  propertyIndicatorMap: {},
  allProperties: []
});

// 筛选条件
const filteredThirdIndicators = ref<string[]>([]);
const selectedFirstLevel = ref<string[]>([]);
const selectedSecondLevel = ref<string[]>([]);
const showFilterPanel = ref(false);

// IP数据和选择
const ips = ref<IP[]>([]);
const selectedIPs = ref<string[]>([]);
const ipGroupFilter = ref('全部');
const filteredIPs = ref<IP[]>([]);
const availableGroups = ref<string[]>([]);

// 分析结果
const evaluationResult = ref<EvaluationResult | null>(null);
const neuralNetworkResult = ref<any>(null);
const shapResult = ref<any>(null);
const pcaResult = ref<any>(null);
const advancedClusterResult = ref<any>(null);
const advancedClusterImage = ref<string>('');

// 统计信息
const statistics = reactive({
  totalIPs: 0,
  totalGroups: 0,
  totalEvaluations: 0
});

// 日志
const logs = ref<string[]>([]);

// 图表选项卡配置
const chartTabs = computed(() => [
  {
    id: 'fitness',
    title: '适应度变化',
    icon: '📈',
    disabled: !evaluationResult.value || evaluationResult.value.fitnessHistory.length === 0,
    count: evaluationResult.value?.fitnessHistory.length || 0
  },
  {
    id: 'scores',
    title: 'IP评分分布',
    icon: '📊',
    disabled: !evaluationResult.value || evaluationResult.value.evaluation.length === 0,
    count: evaluationResult.value?.evaluation.length || 0
  }
  // ... 其他图表配置
]);

// 计算属性：检查是否有分析结果
const hasAnalysisResults = computed(() => {
  return evaluationResult.value !== null || 
         neuralNetworkResult.value !== null || 
         shapResult.value !== null || 
         pcaResult.value !== null || 
         advancedClusterImage.value !== '';
});

// 生命周期
onMounted(async () => {
  await loadInitialData();
});

// 使用DataService的方法
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  logs.value.push(`[${timestamp}] ${message}`);
};

const loadInitialData = async () => {
  loading.value = true;
  try {
    const result = await DataService.loadInitialData();
    indicatorStructure.value = result.indicatorStructure;
    ips.value = result.ips;
    Object.assign(statistics, result.statistics);
    availableGroups.value = result.availableGroups;
    filteredIPs.value = result.filteredIPs;
    filteredThirdIndicators.value = result.indicatorStructure.allThird;
  } catch (error) {
    console.error('加载初始数据失败:', error);
    addLog(`加载初始数据失败: ${error}`);
  } finally {
    loading.value = false;
  }
};

const performComprehensiveAnalysis = async () => {
  try {
    const result = await DataService.performComprehensiveAnalysis(
      selectedIPs.value,
      ips.value,
      indicatorStructure.value,
      filteredThirdIndicators.value,
      addLog,
      (loading: boolean) => { loading.value = loading; },
      (text: string) => { loadingText.value = text; }
    );
    
    // 设置分析结果
    evaluationResult.value = result.evaluationResult;
    neuralNetworkResult.value = result.neuralNetworkResult;
    shapResult.value = result.shapResult;
    pcaResult.value = result.pcaResult;
    advancedClusterResult.value = result.advancedClusterResult;
    advancedClusterImage.value = result.advancedClusterImage;
    
    // 渲染图表
    await nextTick();
    ChartService.renderCharts(evaluationResult.value, filteredThirdIndicators.value);
    ChartService.renderNeuralNetworkCharts(
      neuralNetworkResult.value, 
      filteredThirdIndicators.value, 
      indicatorStructure.value.allThird
    );
    ChartService.renderSHAPChart(shapResult.value);
    ChartService.renderPCAChart(pcaResult.value);
    
  } catch (error) {
    console.error('全面分析失败:', error);
    addLog(`❌ 分析失败: ${error}`);
  }
};

// IP选择相关函数
const toggleIPSelection = (ipId: string) => {
  selectedIPs.value = DataService.toggleIPSelection(ipId, selectedIPs.value);
  addLog(`IP选择已更新: 当前选中${selectedIPs.value.length}个IP`);
};

const selectAllFilteredIPs = () => {
  selectedIPs.value = DataService.selectAllFilteredIPs(filteredIPs.value);
  addLog(`已选择当前筛选的全部${selectedIPs.value.length}个IP`);
};

const clearSelection = () => {
  selectedIPs.value = DataService.clearSelection();
  addLog('已清空IP选择');
};

const isIPSelected = (ipId: string) => {
  return DataService.isIPSelected(ipId, selectedIPs.value);
};

const updateFilteredIPs = () => {
  filteredIPs.value = DataService.updateFilteredIPs(ips.value, ipGroupFilter.value);
  addLog(`筛选组别: ${ipGroupFilter.value}, 显示${filteredIPs.value.length}个IP`);
};

// 筛选相关方法
const toggleFilterPanel = () => {
  showFilterPanel.value = !showFilterPanel.value;
  addLog(`指标筛选面板已${showFilterPanel.value ? '显示' : '隐藏'}`);
};

const updateFilteredIndicators = async () => {
  try {
    filteredThirdIndicators.value = await DataService.updateFilteredIndicators(
      selectedFirstLevel.value,
      selectedSecondLevel.value
    );
    addLog(`已筛选出${filteredThirdIndicators.value.length}个三级指标`);
  } catch (error) {
    console.error('更新筛选指标失败:', error);
    addLog(`筛选指标失败: ${error}`);
  }
};

const clearFilters = () => {
  selectedFirstLevel.value = [];
  selectedSecondLevel.value = [];
  filteredThirdIndicators.value = indicatorStructure.value.allThird;
  addLog('已清空指标筛选条件');
};

const applyFilters = () => {
  addLog(`应用筛选条件: 一级指标${selectedFirstLevel.value.length}个, 二级指标${selectedSecondLevel.value.length}个`);
  addLog(`筛选后三级指标数量: ${filteredThirdIndicators.value.length}`);
  showFilterPanel.value = false;
  addLog('指标筛选面板已自动隐藏');
};

// 导出函数
const exportToPDF = async () => {
  // 这里可以添加图表选择逻辑
  const selectedChartIds = chartTabs.value
    .filter(tab => !tab.disabled)
    .map(tab => tab.id);
    
  await ExportService.performPDFExport(
    selectedChartIds,
    hasAnalysisResults.value,
    selectedIPs.value,
    filteredThirdIndicators.value,
    chartTabs.value,
    evaluationResult.value,
    neuralNetworkResult.value,
    shapResult.value,
    pcaResult.value,
    advancedClusterResult.value,
    advancedClusterImage.value,
    activeChart,
    false, // isChartAnalysisMode
    addLog,
    (loading: boolean) => { loading.value = loading; },
    (text: string) => { loadingText.value = text; }
  );
};

const exportToExcel = async () => {
  await ExportService.exportToExcel(
    hasAnalysisResults.value,
    selectedIPs.value,
    ips.value,
    indicatorStructure.value,
    filteredThirdIndicators.value,
    evaluationResult.value,
    (loading: boolean) => { loading.value = loading; },
    (text: string) => { loadingText.value = text; },
    addLog
  );
};
</script>

<style scoped>
/* 保持原有样式，这里只展示部分关键样式 */
.dashboard-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.main-dashboard {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  margin-bottom: 20px;
  align-items: start;
}

.chart-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 12px;
  overflow-x: auto;
}

.chart-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-tab.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.chart-tab.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 80px;
  height: 50px;
}

.loading-text {
  color: white;
  margin-top: 20px;
  font-size: 16px;
  font-weight: 500;
}

/* 其他样式保持与原文件一致 */
</style> 