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
          
          <!-- 重要指标影响雷达图 -->
          <div v-show="activeChart === 'radar'" class="chart-panel">
            <h3>重要指标影响</h3>
            <div class="chart">
              <canvas id="radarChart" ref="radarChart" v-if="evaluationResult && evaluationResult.weights.length > 0"></canvas>
              <div v-else class="chart-placeholder">
                选择IP并点击"全面分析"按钮后显示重要指标权重雷达图
          </div>
        </div>
      </div>
          
          <!-- 神经网络训练损失 -->
          <div v-show="activeChart === 'neural'" class="chart-panel">
            <h3>神经网络训练损失</h3>
            <div class="chart">
              <canvas id="nnLossChart" ref="nnLossChart" v-if="neuralNetworkResult"></canvas>
              <div v-else class="chart-placeholder">
                <span v-if="selectedIPs.length < 5">
                  🚫 IP数量不足（当前{{selectedIPs.length}}个，需要≥5个）<br>
                  无法进行神经网络训练分析
                </span>
                <span v-else>
                  选择IP并点击"全面分析"按钮后显示神经网络训练损失曲线
                </span>
              </div>
            </div>
          </div>
          
          <!-- 特征重要性分析 -->
          <div v-show="activeChart === 'importance'" class="chart-panel">
            <h3>特征重要性分析</h3>
            <div class="chart">
              <canvas id="featureImportanceChart" ref="featureImportanceChart" v-if="neuralNetworkResult"></canvas>
              <div v-else class="chart-placeholder">
                <span v-if="selectedIPs.length < 5">
                  🚫 IP数量不足（当前{{selectedIPs.length}}个，需要≥5个）<br>
                  无法进行特征重要性分析
                </span>
                <span v-else>
                  选择IP并点击"全面分析"按钮后显示特征重要性分析
                </span>
              </div>
            </div>
          </div>

          <!-- SHAP特征贡献度蜂群图 -->
          <div v-show="activeChart === 'shap'" class="chart-panel">
            <h3>SHAP特征贡献度蜂群图</h3>
            <div class="chart">
              <canvas id="shapChart" ref="shapChart" v-if="shapResult"></canvas>
              <div v-else class="chart-placeholder">
                <span v-if="selectedIPs.length < 3">
                  🚫 IP数量不足（当前{{selectedIPs.length}}个，需要≥3个）<br>
                  无法进行SHAP特征贡献度分析
                </span>
                <span v-else>
                  选择IP并点击"全面分析"按钮后显示SHAP特征贡献度蜂群图
                </span>
              </div>
            </div>
          </div>

          <!-- PCA降维可视化 -->
          <div v-show="activeChart === 'pca'" class="chart-panel">
            <h3>PCA降维可视化</h3>
            <div class="chart">
              <canvas id="pcaChart" ref="pcaChart" v-if="pcaResult"></canvas>
              <div v-else class="chart-placeholder">
                <span v-if="selectedIPs.length < 2">
                  🚫 IP数量不足（当前{{selectedIPs.length}}个，需要≥2个）<br>
                  无法进行PCA降维分析
                </span>
                <span v-else>
                  选择IP并点击"全面分析"按钮后显示PCA降维可视化图表
                </span>
              </div>
            </div>
          </div>

          <!-- 高级聚类分析 -->
          <div v-show="activeChart === 'cluster'" class="chart-panel">
            <h3>高级聚类分析（含凸包）</h3>
            <div class="chart">
              <div v-if="advancedClusterImage" class="ml-chart-image">
                <img :src="advancedClusterImage" alt="高级聚类分析图" />
              </div>
              <div v-else class="chart-placeholder">
                选择IP并点击"全面分析"按钮后显示带凸包的聚类分析图表
              </div>
            </div>
          </div>
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

    <!-- 图表选择弹窗 -->
    <ChartSelectionDialog
      :show="showChartSelectionDialog"
      :availableCharts="availableCharts"
      :initialSelectedCharts="selectedChartsForExport"
      @close="closeChartSelectionDialog"
      @confirm="confirmExportPDF"
    />

    <!-- AI分析聊天窗口 -->
    <AIChatWindow
      :show="showAIDialog"
      :isMinimized="isAIMinimized"
      :isChartAnalysisMode="isChartAnalysisMode"
      :loading="aiAnalysisLoading"
      :chatHistory="aiChatHistory"
      :chartTabs="chartTabs"
      :hasAnalysisResults="hasAnalysisResults"
      @toggleMinimize="toggleAIMinimize"
      @startNewChat="startNewChat"
      @setNormalMode="setNormalMode"
      @setChartMode="setChartMode"
      @analyzeChart="analyzeSpecificChart"
      @sendMessage="sendUserMessage"
      ref="aiChatWindowRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import { ipApi, pythonMLApi, type IP, type EvaluationResult, type IndicatorStructure } from '../utils/api';
import { toast } from '../utils/toast';

// 导入Services
import { ChartService } from '../services/DataAnalysis/chartService';
import { ExportService } from '../services/DataAnalysis/exportService';
import { DataService } from '../services/DataAnalysis/dataService';

// 导入Components
import HeaderSection from '../components/DataAnalysis/HeaderSection.vue';
import StatsBar from '../components/DataAnalysis/StatsBar.vue';
import LogPanel from '../components/DataAnalysis/LogPanel.vue';
import ChartSelectionDialog from '../components/DataAnalysis/ChartSelectionDialog.vue';
import AIChatWindow from '../components/DataAnalysis/AIChatWindow.vue';

import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  ScatterController,
  LineController,
  BarController,
  RadarController
} from 'chart.js';

// 注册Chart.js组件
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  ScatterController,
  LineController,
  BarController,
  RadarController
);

// 响应式数据
const loading = ref(false);
const loadingText = ref('加载中...');
const activeChart = ref('fitness'); // 当前显示的图表

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

// IP筛选
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
  },
  {
    id: 'radar',
    title: '指标权重',
    icon: '🎯',
    disabled: !evaluationResult.value || evaluationResult.value.weights.length === 0,
    count: evaluationResult.value?.weights.length || 0
  },
  {
    id: 'neural',
    title: '神经网络',
    icon: '🧠',
    disabled: !neuralNetworkResult.value || selectedIPs.value.length < 5,
    count: selectedIPs.value.length >= 5 ? '✓' : `${selectedIPs.value.length}/5`
  },
  {
    id: 'importance',
    title: '特征重要性',
    icon: '⚖️',
    disabled: !neuralNetworkResult.value || selectedIPs.value.length < 5,
    count: neuralNetworkResult.value?.feature_importance?.length || 0
  },
  {
    id: 'shap',
    title: 'SHAP分析',
    icon: '🔍',
    disabled: !shapResult.value || selectedIPs.value.length < 3,
    count: selectedIPs.value.length >= 3 ? '✓' : `${selectedIPs.value.length}/3`
  },
  {
    id: 'pca',
    title: 'PCA降维',
    icon: '🔀',
    disabled: !pcaResult.value || selectedIPs.value.length < 2,
    count: pcaResult.value?.n_components || 0
  },
  {
    id: 'cluster',
    title: '聚类分析',
    icon: '🎭',
    disabled: !advancedClusterImage.value,
    count: advancedClusterResult.value?.clustering_results?.length || 0
  }
]);

// 添加计算属性：检查是否有分析结果
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
  
  // 初始化AI对话，添加欢迎消息
  if (aiChatHistory.value.length === 0) {
    addChatMessage('ai', '👋 您好！我是AI智能助手。\n\n💬 **普通对话模式**：可以问我任何问题\n🔍 **图表分析模式**：专门分析数据图表\n\n点击上方按钮切换模式，或直接开始对话！');
  }
});

// 方法
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
      (loadingValue: boolean) => { loading.value = loadingValue; },
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
  } finally {
    // 确保loading状态被重置
    loading.value = false;
    loadingText.value = '';
  }
};

const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  logs.value.push(`[${timestamp}] ${message}`);
};

// 筛选和IP选择相关方法
const toggleFilterPanel = () => {
  showFilterPanel.value = !showFilterPanel.value;
  addLog(`指标筛选面板已${showFilterPanel.value ? '显示' : '隐藏'}`);
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

const toggleIPSelection = (ipId: string) => {
  selectedIPs.value = DataService.toggleIPSelection(ipId, selectedIPs.value);
  addLog(`IP选择已更新: 当前选中${selectedIPs.value.length}个IP`);
};

const selectAllFilteredIPs = () => {
  selectedIPs.value = DataService.selectAllFilteredIPs(filteredIPs.value);
  addLog(`已选择当前筛选的全部${selectedIPs.value.length}个IP`);
};

const isIPSelected = (ipId: string) => {
  return DataService.isIPSelected(ipId, selectedIPs.value);
};

const clearSelection = () => {
  selectedIPs.value = DataService.clearSelection();
  addLog('已清空IP选择');
};

const updateFilteredIPs = () => {
  filteredIPs.value = DataService.updateFilteredIPs(ips.value, ipGroupFilter.value);
  addLog(`筛选组别: ${ipGroupFilter.value}, 显示${filteredIPs.value.length}个IP`);
};

// PDF导出功能 - 显示图表选择弹窗
const exportToPDF = async () => {
  if (!hasAnalysisResults.value) {
    toast.warning('请先进行全面分析后再导出PDF');
    return;
  }
  
  // 默认选择所有可用的图表
  selectedChartsForExport.value = availableEnabledCharts.value.map(chart => chart.id);
  
  // 显示图表选择弹窗
  showChartSelectionDialog.value = true;
};

// 实际的PDF导出逻辑
const performPDFExport = async (selectedChartIds: string[]) => {
  try {
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
      activeChart,
      isChartAnalysisMode.value,
      addLog,
      (loadingValue: boolean) => { loading.value = loadingValue; },
      (text: string) => { loadingText.value = text; }
    );
  } catch (error) {
    console.error('PDF导出失败:', error);
    addLog(`❌ PDF导出失败: ${error}`);
  } finally {
    loading.value = false;
    loadingText.value = '';
  }
};

// Excel导出功能
const exportToExcel = async () => {
  try {
    await ExportService.exportToExcel(
      hasAnalysisResults.value,
      selectedIPs.value,
      ips.value,
      indicatorStructure.value,
      filteredThirdIndicators.value,
      evaluationResult.value,
      (loadingValue: boolean) => { loading.value = loadingValue; },
      (text: string) => { loadingText.value = text; },
      addLog
    );
  } catch (error) {
    console.error('Excel导出失败:', error);
    addLog(`❌ Excel导出失败: ${error}`);
  } finally {
    loading.value = false;
    loadingText.value = '';
  }
};

// AI分析相关
const showAIDialog = ref(true); // 改为默认显示
const aiAnalysisLoading = ref(false);
const isChartAnalysisMode = ref(false); // 新增：图表分析模式开关

const setNormalMode = () => {
  if (isChartAnalysisMode.value) {
    isChartAnalysisMode.value = false;
    addChatMessage('ai', '💬 已切换到普通对话模式！您可以问我任何问题，我会尽力为您提供帮助。');
  }
};

const setChartMode = () => {
  if (!isChartAnalysisMode.value) {
    isChartAnalysisMode.value = true;
    addChatMessage('ai', '🔍 已切换到图表分析模式！在此模式下，我将专注于为您分析各种图表数据。请使用下方的快捷按钮或直接询问图表相关问题。');
  }
};

// AI分析聊天窗口相关
interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const isAIMinimized = ref(false);
const aiChatHistory = ref<ChatMessage[]>([]);
const aiChatWindowRef = ref<any>();

const addChatMessage = (type: 'user' | 'ai', content: string) => {
  aiChatHistory.value.push({
    type,
    content,
    timestamp: new Date().toISOString()
  });
  
  // 滚动到底部
  nextTick(() => {
    if (aiChatWindowRef.value) {
      aiChatWindowRef.value.scrollToBottom();
    }
  });
};

const sendUserMessage = async (message: string) => {
  if (!message.trim() || aiAnalysisLoading.value) return;
  
  addChatMessage('user', message);
  
  // 触发AI分析
  await performAIAnalysis(message);
};

const analyzeSpecificChart = async (chartId: string) => {
  if (aiAnalysisLoading.value) return;
  
  let analysisPrompt = '';
  let chartName = '';
  
  switch (chartId) {
    case 'fitness':
      chartName = '适应度变化图表';
      analysisPrompt = '请详细分析适应度变化图表，解释遗传算法的优化过程、收敛趋势、训练效果，以及如何通过适应度曲线判断模型性能。';
      break;
    case 'scores':
      chartName = 'IP评分分布图表';
      analysisPrompt = '请分析IP评分分布柱状图，识别表现优秀和需要改进的项目，解释评分差异的原因，并提供针对性的改进建议。';
      break;
    case 'radar':
      chartName = '指标权重雷达图';
      analysisPrompt = '请分析指标权重雷达图，解释各指标的相对重要性，识别关键影响因素，说明权重分布对评估结果的影响。';
      break;
    case 'neural':
      chartName = '神经网络训练图表';
      analysisPrompt = '请分析神经网络训练过程图表，评估模型的学习能力、收敛速度、泛化性能，并解释损失函数的变化趋势。';
      break;
    case 'importance':
      chartName = '特征重要性图表';
      analysisPrompt = '请分析特征重要性图表，识别对预测结果最有影响力的特征，解释特征重要性的计算方法和业务意义。';
      break;
    case 'shap':
      chartName = 'SHAP模型解释图表';
      analysisPrompt = '请分析SHAP图表，解释模型的可解释性分析结果，说明各特征对不同样本预测的贡献度，以及SHAP值的业务含义。';
      break;
    case 'pca':
      chartName = 'PCA降维分析图表';
      analysisPrompt = '请分析PCA降维图表，解释主成分的含义、方差贡献率、数据的分布模式，以及降维对数据理解的帮助。';
      break;
    case 'cluster':
      chartName = '聚类分析图表';
      analysisPrompt = '请分析聚类分析图表，解释各聚类的特征、IP项目的分组模式、聚类质量，并提供基于聚类结果的业务洞察。';
      break;
    case 'all':
      chartName = '全面综合分析';
      analysisPrompt = '请对所有可用图表进行全面分析，提供系统性的数据洞察、综合性的评估结论和战略性的发展建议。';
      break;
    default:
      return;
  }
  
  addChatMessage('user', `分析${chartName}`);
  await performAIAnalysis(analysisPrompt);
};

// 统一的AI分析函数 - PDF和对话框共享
const performUnifiedAIAnalysis = async (prompt: string, isForPDF: boolean = false): Promise<string> => {
  try {
    // 准备分析数据
    const analysisData = {
      selectedIPCount: selectedIPs.value.length,
      indicatorCount: filteredThirdIndicators.value.length,
      evaluationResult: evaluationResult.value,
      weights: evaluationResult.value?.weights,
      neuralNetworkResult: neuralNetworkResult.value,
      shapResult: shapResult.value,
      pcaResult: pcaResult.value,
      advancedClusterResult: advancedClusterResult.value,
      customPrompt: prompt
    };
    
    // 获取当前可用的图表类型
    const availableCharts = chartTabs.value
      .filter(tab => !tab.disabled)
      .map(tab => tab.title);
    
    const response = await ipApi.aiAnalysis(analysisData, availableCharts, isChartAnalysisMode.value);
    
    if (response.success && response.data?.analysis) {
      // 如果不是PDF调用，添加到聊天记录
      if (!isForPDF) {
        addChatMessage('ai', response.data.analysis);
      }
      return response.data.analysis;
    } else {
      const errorMsg = '抱歉，分析失败了。请稍后再试。';
      if (!isForPDF) {
        addChatMessage('ai', errorMsg);
      }
      return errorMsg;
    }
  } catch (error) {
    console.error('AI分析失败:', error);
    const errorMsg = `分析出错：${error}`;
    if (!isForPDF) {
      addChatMessage('ai', errorMsg);
    }
    return errorMsg;
  }
};

// 修改performAIAnalysis为使用统一函数
const performAIAnalysis = async (customPrompt?: string) => {
  aiAnalysisLoading.value = true;
  addLog('🤖 开始AI分析...');
  
  try {
    await performUnifiedAIAnalysis(customPrompt || '请对当前数据进行全面分析', false);
    addLog('🎉 AI分析完成');
  } catch (error) {
    console.error('AI分析失败:', error);
    addLog(`❌ AI分析失败: ${error}`);
    toast.fail('AI分析失败，请重试');
  } finally {
    aiAnalysisLoading.value = false;
  }
};

const toggleAIMinimize = () => {
  isAIMinimized.value = !isAIMinimized.value;
};

const startNewChat = () => {
  aiChatHistory.value = [];
  // 添加欢迎消息
  addChatMessage('ai', '👋 您好！我是AI智能助手。\n\n💬 **普通对话模式**：可以问我任何问题\n🔍 **图表分析模式**：专门分析数据图表\n\n点击上方按钮切换模式，或直接开始对话！');
};

// 添加全局快捷键监听
onMounted(() => {
  const handleGlobalKeydown = (event: KeyboardEvent) => {
    if (!showAIDialog.value) return;
    
    if (event.ctrlKey && !event.shiftKey && !event.altKey) {
      switch (event.code) {
        case 'Digit1':
          event.preventDefault();
          analyzeSpecificChart('fitness');
          break;
        case 'Digit2':
          event.preventDefault();
          analyzeSpecificChart('scores');
          break;
        case 'Digit3':
          event.preventDefault();
          analyzeSpecificChart('radar');
          break;
        case 'Digit4':
          event.preventDefault();
          analyzeSpecificChart('neural');
          break;
        case 'Digit5':
          event.preventDefault();
          analyzeSpecificChart('importance');
          break;
        case 'Digit6':
          event.preventDefault();
          analyzeSpecificChart('shap');
          break;
        case 'Digit7':
          event.preventDefault();
          analyzeSpecificChart('pca');
          break;
        case 'Digit8':
          event.preventDefault();
          analyzeSpecificChart('cluster');
          break;
        case 'KeyA':
          event.preventDefault();
          analyzeSpecificChart('all');
          break;
      }
    }
  };
  
  document.addEventListener('keydown', handleGlobalKeydown);
  
  // 组件卸载时移除监听器
  return () => {
    document.removeEventListener('keydown', handleGlobalKeydown);
  };
});

const showChartSelectionDialog = ref(false);
const selectedChartsForExport = ref<string[]>([]);

// 可用图表的计算属性，包含更详细的描述信息
const availableCharts = computed(() => [
  {
    id: 'fitness',
    title: '适应度变化曲线',
    icon: '📈',
    disabled: !evaluationResult.value || evaluationResult.value.fitnessHistory.length === 0,
    description: '显示遗传算法优化过程中适应度的变化趋势'
  },
  {
    id: 'scores',
    title: 'IP评分分布',
    icon: '📊',
    disabled: !evaluationResult.value || evaluationResult.value.evaluation.length === 0,
    description: '展示各个IP项目的综合评分分布情况'
  },
  {
    id: 'radar',
    title: '重要指标影响雷达图',
    icon: '🎯',
    disabled: !evaluationResult.value || evaluationResult.value.weights.length === 0,
    description: '通过雷达图展示各指标的权重分布和重要性'
  },
  {
    id: 'neural',
    title: '神经网络训练损失',
    icon: '🧠',
    disabled: !neuralNetworkResult.value || selectedIPs.value.length < 5,
    description: '显示神经网络模型训练过程中的损失函数变化'
  },
  {
    id: 'importance',
    title: '特征重要性分析',
    icon: '⚖️',
    disabled: !neuralNetworkResult.value || selectedIPs.value.length < 5,
    description: '分析各个特征指标对模型预测结果的重要程度'
  },
  {
    id: 'shap',
    title: 'SHAP特征贡献度蜂群图',
    icon: '🔍',
    disabled: !shapResult.value || selectedIPs.value.length < 3,
    description: '使用SHAP方法解释模型决策过程和特征贡献'
  },
  {
    id: 'pca',
    title: 'PCA降维可视化',
    icon: '🔀',
    disabled: !pcaResult.value || selectedIPs.value.length < 2,
    description: '通过主成分分析将高维数据降维并可视化'
  },
  {
    id: 'cluster',
    title: '高级聚类分析',
    icon: '🎭',
    disabled: !advancedClusterImage.value,
    description: '对IP项目进行聚类分析，发现潜在的分组模式'
  }
]);

const availableEnabledCharts = computed(() => availableCharts.value.filter(chart => !chart.disabled));

const closeChartSelectionDialog = () => {
  showChartSelectionDialog.value = false;
};

const confirmExportPDF = async () => {
  showChartSelectionDialog.value = false;
  
  if (selectedChartsForExport.value.length === 0) {
    toast.warning('请至少选择一个图表导出');
    return;
  }
  
  // 调用实际的PDF导出逻辑，传入选中的图表
  await performPDFExport(selectedChartsForExport.value);
};

// 更新筛选指标
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
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

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

.btn-icon {
  width: 18px;
  height: 18px;
  margin-right: 6px;
  stroke-width: 2;
}

.quick-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(255,255,255,0.7);
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.update-time {
  font-size: 11px;
  color: #6c757d;
  font-weight: 500;
}

.chart-tabs {
  display: flex;
  gap: 8px;
  margin: 20px 0;
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

.chart-tab:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  background: #e3f2fd;
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

.tab-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.tab-title {
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}

.tab-count {
  font-size: 10px;
  margin-top: 2px;
  padding: 2px 6px;
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
  color: inherit;
}

.chart-tab.active .tab-count {
  background: rgba(255,255,255,0.2);
}

.chart-display {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-panel h3 {
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  flex-shrink: 0;
}

.chart {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  position: relative;
  min-height: 400px;
}

.chart canvas {
  max-width: 100%;
  max-height: 100%;
}

.chart-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  color: #666;
  border-radius: 8px;
  font-style: italic;
  text-align: center;
  padding: 20px;
  font-size: 14px;
  line-height: 1.5;
  border: 2px dashed #dee2e6;
}

.chart-placeholder span {
  display: block;
  line-height: 1.5;
}

.chart-placeholder span:first-child {
  color: #e74c3c;
  font-weight: bold;
  font-style: normal;
}

.ml-chart-image {
  width: 100%;
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.ml-chart-image img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.log-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.log-panel h3 {
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.log-content {
  height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: 1px solid #dee2e6;
}

.log-content::-webkit-scrollbar {
  width: 6px;
}

.log-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.log-entry {
  margin-bottom: 3px;
  color: #495057;
  padding: 2px 0;
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

.loading-spinner::before {
  content: '';
  display: flex;
  gap: 4px;
  width: 100%;
  height: 100%;
  background-image: 
    /* 第1条 - 蓝色 */
    linear-gradient(to bottom, #007AFF, #0056B3),
    /* 第2条 - 蓝紫色 */
    linear-gradient(to bottom, #5856D6, #4A47B8),
    /* 第3条 - 紫色 */
    linear-gradient(to bottom, #AF52DE, #9A44C4),
    /* 第4条 - 粉紫色 */
    linear-gradient(to bottom, #FF2D92, #E6266F),
    /* 第5条 - 橙色 */
    linear-gradient(to bottom, #FF9500, #E6850F),
    /* 第6条 - 黄色 */
    linear-gradient(to bottom, #FFCC02, #E6B800),
    /* 第7条 - 绿色 */
    linear-gradient(to bottom, #34C759, #2FB04A),
    /* 第8条 - 青色 */
    linear-gradient(to bottom, #32D74B, #2DB842);
  background-size: 
    8px 100%, 8px 100%, 8px 100%, 8px 100%, 
    8px 100%, 8px 100%, 8px 100%, 8px 100%;
  background-position: 
    0% center, 12px center, 24px center, 36px center,
    48px center, 60px center, 72px center, 84px center;
  background-repeat: no-repeat;
  border-radius: 4px;
  animation: siri-wave-bars 1.4s ease-in-out infinite;
}

.loading-text {
  color: white;
  margin-top: 20px;
  font-size: 16px;
  font-weight: 500;
}

@keyframes siri-wave-bars {
  0% {
    background-size: 
      8px 20%, 8px 40%, 8px 60%, 8px 80%, 
      8px 100%, 8px 80%, 8px 60%, 8px 40%;
  }
  12.5% {
    background-size: 
      8px 40%, 8px 60%, 8px 80%, 8px 100%, 
      8px 80%, 8px 60%, 8px 40%, 8px 20%;
  }
  25% {
    background-size: 
      8px 60%, 8px 80%, 8px 100%, 8px 80%, 
      8px 60%, 8px 40%, 8px 20%, 8px 40%;
  }
  37.5% {
    background-size: 
      8px 80%, 8px 100%, 8px 80%, 8px 60%, 
      8px 40%, 8px 20%, 8px 40%, 8px 60%;
  }
  50% {
    background-size: 
      8px 100%, 8px 80%, 8px 60%, 8px 40%, 
      8px 20%, 8px 40%, 8px 60%, 8px 80%;
  }
  62.5% {
    background-size: 
      8px 80%, 8px 60%, 8px 40%, 8px 20%, 
      8px 40%, 8px 60%, 8px 80%, 8px 100%;
  }
  75% {
    background-size: 
      8px 60%, 8px 40%, 8px 20%, 8px 40%, 
      8px 60%, 8px 80%, 8px 100%, 8px 80%;
  }
  87.5% {
    background-size: 
      8px 40%, 8px 20%, 8px 40%, 8px 60%, 
      8px 80%, 8px 100%, 8px 80%, 8px 60%;
  }
  100% {
    background-size: 
      8px 20%, 8px 40%, 8px 60%, 8px 80%, 
      8px 100%, 8px 80%, 8px 60%, 8px 40%;
  }
}

.loading-text {
  color: white;
  margin-top: 15px;
  font-size: 16px;
  font-weight: 500;
}

@keyframes siri-wave {
  0%, 40%, 100% {
    transform: scaleY(0.4);
    opacity: 0.6;
  }
  20% {
    transform: scaleY(1);
    opacity: 1;
  }
}

@keyframes siri-middle-waves {
  0%, 40%, 100% {
    opacity: 0.6;
  }
  10% {
    opacity: 1;
  }
}

/* 为不同的条添加不同的动画延迟 */
.loading-spinner {
  animation: siri-container 1.2s ease-in-out infinite;
}

@keyframes siri-container {
  0% { opacity: 1; }
  100% { opacity: 1; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 10px;
  }
  
  .header-top {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .chart-tabs {
    flex-wrap: wrap;
  }

  .chart-tab {
    min-width: 100px;
  }

  .chart {
    height: 300px;
  }

  .main-dashboard {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .ip-selection-sidebar {
    position: static;
    order: 2;
    height: auto;
    min-height: 300px;
  }

  .chart-main-area {
    order: 1;
    height: auto;
    min-height: 400px;
  }

  .chart-panel {
    height: auto;
    min-height: 350px;
  }
}

/* 筛选面板样式 */
.filter-section {
  margin: 20px 0;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 2px solid #dee2e6;
  box-shadow: 0 4px 6px rgba(0,0,0,0.07);
  transition: all 0.3s ease;
}

.filter-section:hover {
  box-shadow: 0 6px 12px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.filter-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #495057;
  font-size: 18px;
  font-weight: 600;
    text-align: center;
  position: relative;
}

.filter-section h3::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.indicator-group {
  margin-bottom: 20px;
}

.indicator-group h4 {
  margin-bottom: 12px;
  color: #6c757d;
  font-size: 16px;
  font-weight: 500;
  padding-left: 8px;
  border-left: 4px solid #007bff;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px 12px;
  padding-right: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.checkbox-label:hover {
  background: rgba(102,126,234,0.1);
}

.filter-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 15px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 11px;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  font-weight: 600;
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* IP选择区域样式 */
.ip-selection-sidebar {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
  height: calc(100vh - 400px);
  min-height: 500px;
  position: sticky;
  top: 20px;
  display: flex;
    flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f8f9fa;
}

.sidebar-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.selection-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-count {
  font-size: 12px;
  color: #007bff;
  font-weight: 600;
  background: #e3f2fd;
  padding: 4px 8px;
  border-radius: 12px;
}

.group-filter-section {
  margin-bottom: 15px;
}

.group-filter-section label {
  display: block;
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
  margin-bottom: 6px;
}

.group-filter-section select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

.group-filter-section select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.selection-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
    text-align: center;
  }

.btn-sm {
  padding: 6px 12px;
  font-size: 11px;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  font-weight: 600;
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.btn-outline {
  background: transparent;
  border: 1px solid #007bff;
  color: #007bff;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.btn-outline:hover {
  background: #007bff;
  color: white;
}

.ip-list-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
  margin-top: 10px;
}

.ip-list-container::-webkit-scrollbar {
  width: 6px;
}

.ip-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.ip-list-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.ip-list-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.ip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8f9fa;
}

.ip-item:hover {
  border-color: #007bff;
  background: #e3f2fd;
  transform: translateX(2px);
}

.ip-item.selected {
  border-color: #28a745;
  background: #d4edda;
  box-shadow: 0 2px 4px rgba(40,167,69,0.2);
}

.ip-checkbox {
  flex-shrink: 0;
}

.ip-checkbox input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.ip-content {
  flex: 1;
  min-width: 0;
}

.ip-name {
  font-weight: 600;
  font-size: 13px;
  color: #2c3e50;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ip-group {
  font-size: 10px;
  color: #6c757d;
  margin-bottom: 2px;
}

.ip-indicators {
  font-size: 9px;
  color: #007bff;
  font-weight: 500;
}

/* 图表主区域样式 */
.chart-main-area {
  min-width: 0;
  height: calc(100vh - 400px);
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

/* 主要内容布局 */
.main-dashboard {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  margin-bottom: 20px;
  align-items: start;
}
</style>
