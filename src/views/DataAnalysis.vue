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
    <div v-if="showChartSelectionDialog" class="chart-selection-overlay">
      <div class="chart-selection-dialog">
        <div class="dialog-header">
          <h3>选择要导出的图表</h3>
          <button @click="closeChartSelectionDialog" class="close-btn">×</button>
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
                  v-model="selectedChartsForExport"
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
            <p>已选择 <strong>{{ selectedChartsForExport.length }}</strong> 个图表</p>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button @click="selectAllCharts" class="btn btn-secondary">
            {{ selectedChartsForExport.length === availableEnabledCharts.length ? '取消全选' : '全选' }}
          </button>
          <button 
            @click="confirmExportPDF" 
            class="btn btn-primary"
            :disabled="selectedChartsForExport.length === 0"
          >
            导出PDF ({{ selectedChartsForExport.length }}个图表)
          </button>
        </div>
      </div>
    </div>

    <!-- AI分析聊天窗口 -->
    <div v-if="showAIDialog" class="ai-chat-window" :class="{ 'ai-minimized': isAIMinimized }">
      <div class="ai-chat-header">
        <div class="ai-chat-title">
          <span class="ai-icon">🤖</span>
          <h3>AI智能分析助手</h3>
          <span class="ai-status" :class="{ 'ai-thinking': aiAnalysisLoading }">
            {{ aiAnalysisLoading ? '思考中...' : '在线' }}
          </span>
        </div>
        <div class="ai-chat-controls">
          <button @click="startNewChat" class="ai-control-btn" title="新对话">
            🆕
          </button>
          <button @click="toggleAIMinimize" class="ai-control-btn" :title="isAIMinimized ? '展开对话框' : '收缩对话框'">
            {{ isAIMinimized ? '⬆️' : '⬇️' }}
          </button>
        </div>
      </div>
      
      <div v-show="!isAIMinimized" class="ai-chat-body">
        <!-- 图表分析快捷按钮 - 只在图表分析模式下显示 -->
        <div v-show="isChartAnalysisMode" class="ai-quick-actions">
          <div class="ai-quick-title">快速分析图表:</div>
          <div class="ai-quick-buttons">
            <button @click="analyzeSpecificChart('fitness')" 
                    :disabled="chartTabs.find(t => t.id === 'fitness')?.disabled"
                    class="ai-quick-btn" title="适应度变化分析">
              📈 适应度 <kbd>1</kbd>
            </button>
            <button @click="analyzeSpecificChart('scores')" 
                    :disabled="chartTabs.find(t => t.id === 'scores')?.disabled"
                    class="ai-quick-btn" title="IP评分分布分析">
              📊 评分 <kbd>2</kbd>
            </button>
            <button @click="analyzeSpecificChart('radar')" 
                    :disabled="chartTabs.find(t => t.id === 'radar')?.disabled"
                    class="ai-quick-btn" title="指标权重雷达图分析">
              🎯 权重 <kbd>3</kbd>
            </button>
            <button @click="analyzeSpecificChart('neural')" 
                    :disabled="chartTabs.find(t => t.id === 'neural')?.disabled"
                    class="ai-quick-btn" title="神经网络训练分析">
              🧠 神经网络 <kbd>4</kbd>
            </button>
            <button @click="analyzeSpecificChart('importance')" 
                    :disabled="chartTabs.find(t => t.id === 'importance')?.disabled"
                    class="ai-quick-btn" title="特征重要性分析">
              ⚖️ 特征重要性 <kbd>5</kbd>
            </button>
            <button @click="analyzeSpecificChart('shap')" 
                    :disabled="chartTabs.find(t => t.id === 'shap')?.disabled"
                    class="ai-quick-btn" title="SHAP模型解释分析">
              🔍 SHAP <kbd>6</kbd>
            </button>
            <button @click="analyzeSpecificChart('pca')" 
                    :disabled="chartTabs.find(t => t.id === 'pca')?.disabled"
                    class="ai-quick-btn" title="PCA降维分析">
              🔀 PCA <kbd>7</kbd>
            </button>
            <button @click="analyzeSpecificChart('cluster')" 
                    :disabled="chartTabs.find(t => t.id === 'cluster')?.disabled"
                    class="ai-quick-btn" title="聚类分析">
              🎭 聚类 <kbd>8</kbd>
            </button>
            <button @click="analyzeSpecificChart('all')" 
                    :disabled="!hasAnalysisResults"
                    class="ai-quick-btn ai-analyze-all" title="全面综合分析">
              🔍 全面分析 <kbd>A</kbd>
            </button>
          </div>
        </div>
        
        <!-- 聊天消息区域 -->
        <div class="ai-chat-messages" ref="chatMessages">
          <div v-for="(message, index) in aiChatHistory" :key="index" class="ai-message" :class="message.type">
            <div class="ai-message-avatar">
              {{ message.type === 'user' ? '👤' : '🤖' }}
            </div>
            <div class="ai-message-content">
              <div class="ai-message-text" v-html="formatAIMessage(message.content)"></div>
              <div class="ai-message-time">{{ formatMessageTime(message.timestamp) }}</div>
            </div>
          </div>
          
          <div v-if="aiAnalysisLoading" class="ai-message ai-typing">
            <div class="ai-message-avatar">🤖</div>
            <div class="ai-message-content">
              <div class="ai-typing-indicator">
                <span></span><span></span><span></span>
              </div>
              <div class="ai-message-text">正在分析数据...</div>
            </div>
          </div>
        </div>
        
        <!-- 输入区域 -->
        <div class="ai-chat-input">
          <div class="ai-input-wrapper">
            <!-- 模式切换圆按钮 -->
            <div class="ai-mode-toggle-buttons">
              <button @click="setNormalMode" 
                      :class="{ 'active': !isChartAnalysisMode }"
                      class="ai-mode-circle-btn"
                      title="普通对话模式">
                💬
              </button>
              <button @click="setChartMode" 
                      :class="{ 'active': isChartAnalysisMode }"
                      class="ai-mode-circle-btn"
                      title="图表分析模式">
                🔍
              </button>
            </div>
            
            <input 
              v-model="userInput" 
              @keydown.enter="sendUserMessage"
              @keydown.ctrl.49.prevent="analyzeSpecificChart('fitness')"
              @keydown.ctrl.50.prevent="analyzeSpecificChart('scores')" 
              @keydown.ctrl.51.prevent="analyzeSpecificChart('radar')"
              @keydown.ctrl.52.prevent="analyzeSpecificChart('neural')"
              @keydown.ctrl.53.prevent="analyzeSpecificChart('importance')"
              @keydown.ctrl.54.prevent="analyzeSpecificChart('shap')"
              @keydown.ctrl.55.prevent="analyzeSpecificChart('pca')"
              @keydown.ctrl.56.prevent="analyzeSpecificChart('cluster')"
              @keydown.ctrl.65.prevent="analyzeSpecificChart('all')"
              :placeholder="inputPlaceholder" 
              class="ai-input-field"
              ref="aiInput"
            />
            <button @click="sendUserMessage" :disabled="!userInput.trim() || aiAnalysisLoading" class="ai-send-btn">
              {{ aiAnalysisLoading ? '⏳' : '📤' }}
            </button>
          </div>
          <div class="ai-input-hint">
            快捷键: Ctrl+1~8分析对应图表, Ctrl+A全面分析
          </div>
        </div>
      </div>
    </div>
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
const groups = ref<string[]>(['全部']);

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

// 计算属性：动态placeholder
const inputPlaceholder = computed(() => {
  return isChartAnalysisMode.value 
    ? '输入图表分析问题或使用Ctrl+数字键快速分析...'
    : '输入任何问题，我来为您解答...';
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

const loadIndicatorStructure = async () => {
  try {
    const response = await ipApi.getIndicators();
    if (response.data) {
      indicatorStructure.value = response.data;
      filteredThirdIndicators.value = response.data.allThird;
    }
  } catch (error) {
    console.error('加载指标结构失败:', error);
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

const renderFitnessChart = () => {
  const canvas = document.querySelector('#fitnessChart') as HTMLCanvasElement;
  if (!canvas || !evaluationResult.value) return;
  
  Chart.getChart(canvas)?.destroy();
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const fitnessHistory = evaluationResult.value.fitnessHistory;
  const iterations = fitnessHistory.length;
  const avgFitness = fitnessHistory.map(iteration => 
    iteration.reduce((sum, val) => sum + val, 0) / iteration.length
  );
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: iterations }, (_, i) => `第${i + 1}代`),
      datasets: [{
        label: '平均适应度',
        data: avgFitness,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: '遗传算法适应度收敛过程'
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: { display: true, text: '适应度值' }
        },
        x: {
          title: { display: true, text: '迭代次数' }
        }
      }
    }
  });
};

const renderScoreChart = () => {
  const canvas = document.querySelector('#scoreChart') as HTMLCanvasElement;
  if (!canvas || !evaluationResult.value) return;
  
  Chart.getChart(canvas)?.destroy();
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const evaluation = evaluationResult.value.evaluation;
  const labels = evaluation.map(item => item.name);
  const scores = evaluation.map(item => item.score);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'IP评分',
        data: scores,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: 'IP综合评分排名' }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '评分' } },
        x: { title: { display: true, text: 'IP名称' } }
      }
    }
  });
};

const renderRadarChart = () => {
  const canvas = document.querySelector('#radarChart') as HTMLCanvasElement;
  if (!canvas || !evaluationResult.value) return;
  
  Chart.getChart(canvas)?.destroy();
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const weights = evaluationResult.value.weights;
  const indicators = filteredThirdIndicators.value;
  
  const indexedWeights = weights.map((weight, index) => ({ weight, index }));
  indexedWeights.sort((a, b) => b.weight - a.weight);
  const topIndicators = indexedWeights.slice(0, 8);
  
  const radarLabels = topIndicators.map(item => indicators[item.index] || `指标${item.index + 1}`);
  const radarWeights = topIndicators.map(item => item.weight * 100);
  
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: radarLabels,
      datasets: [{
        label: '指标权重(%)',
        data: radarWeights,
        fill: true,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(255, 99, 132)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: '关键指标权重分布' }
      },
      scales: {
        r: {
          angleLines: { display: false },
          suggestedMin: 0,
          suggestedMax: Math.max(...radarWeights) * 1.2
        }
      }
    }
  });
};

// 渲染神经网络相关图表
const renderNeuralNetworkCharts = () => {
  if (!neuralNetworkResult.value) return;
  
  nextTick(() => {
    // 渲染训练损失曲线
    const lossCanvas = document.querySelector('#nnLossChart') as HTMLCanvasElement;
    if (lossCanvas) {
      Chart.getChart(lossCanvas)?.destroy();
      const ctx = lossCanvas.getContext('2d');
      if (ctx && neuralNetworkResult.value.training_losses) {
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: neuralNetworkResult.value.training_losses.map((_: any, index: number) => `轮次${index + 1}`),
            datasets: [{
              label: '训练损失',
              data: neuralNetworkResult.value.training_losses,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: '神经网络训练损失变化'
              }
            },
            scales: {
              y: {
                beginAtZero: false,
                title: {
                  display: true,
                  text: '损失值'
                }
              },
              x: {
                title: {
                  display: true,
                  text: '训练轮次'
                }
              }
            }
          }
        });
      }
    }
    
    // 渲染特征重要性柱状图
    const importanceCanvas = document.querySelector('#featureImportanceChart') as HTMLCanvasElement;
    if (importanceCanvas && neuralNetworkResult.value.feature_importance) {
      Chart.getChart(importanceCanvas)?.destroy();
      const ctx = importanceCanvas.getContext('2d');
      if (ctx) {
        const currentFeatureNames = filteredThirdIndicators.value.length > 0 
          ? filteredThirdIndicators.value 
          : indicatorStructure.value.allThird;
        
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: neuralNetworkResult.value.feature_names || currentFeatureNames,
            datasets: [{
              label: '特征重要性',
              data: neuralNetworkResult.value.feature_importance,
              backgroundColor: 'rgba(75, 192, 192, 0.8)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: '神经网络特征重要性分析'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: '重要性分数'
                }
              },
              x: {
                title: {
                  display: true,
                  text: '特征指标'
                },
                ticks: {
                  maxRotation: 45
                }
              }
            }
          }
        });
      }
    }
  });
};

// 渲染SHAP分析图表
const renderSHAPChart = () => {
  if (!shapResult.value) return;
  
  nextTick(() => {
    const canvas = document.querySelector('#shapChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    Chart.getChart(canvas)?.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 创建蜂群图数据
    const datasets: any[] = [];
    const colors = [
      'rgba(255, 99, 132, 0.8)',   // 红色
      'rgba(54, 162, 235, 0.8)',   // 蓝色  
      'rgba(255, 205, 86, 0.8)',   // 黄色
      'rgba(75, 192, 192, 0.8)',   // 青色
      'rgba(153, 102, 255, 0.8)',  // 紫色
      'rgba(255, 159, 64, 0.8)',   // 橙色
      'rgba(199, 199, 199, 0.8)',  // 灰色
      'rgba(83, 102, 255, 0.8)'    // 靛蓝色
    ];
    
    // 为每个IP创建一个数据集
    shapResult.value.ip_explanations?.forEach((explanation: any, ipIndex: number) => {
      const swarmData: any[] = [];
      const shapValues = explanation.shap_values || [];
      
      // 处理嵌套数组格式的SHAP值
      const flattenedShapValues = Array.isArray(shapValues[0]) 
        ? shapValues.map((arr: any[]) => arr[0]) // 如果是嵌套数组，取第一个元素
        : shapValues; // 如果已经是平坦数组，直接使用
      
      // 为每个特征创建散点数据，添加轻微的Y轴偏移来模拟蜂群效果
      flattenedShapValues.forEach((shapValue: number, featureIndex: number) => {
        if (typeof shapValue === 'number' && !isNaN(shapValue)) {
          // 计算蜂群偏移：基于IP索引和特征索引创建分布
          const baseOffset = (ipIndex - shapResult.value.ip_explanations.length / 2) * 0.02;
          const randomOffset = (Math.random() - 0.5) * 0.02;
          const yOffset = baseOffset + randomOffset;
          
          swarmData.push({
            x: shapResult.value.feature_names[featureIndex] || `指标${featureIndex + 1}`, // 使用指标名称作为x坐标
            y: shapValue + yOffset,
            originalValue: shapValue,
            ip: explanation.name,
            feature: shapResult.value.feature_names[featureIndex]
          });
        }
      });
      
      if (swarmData.length > 0) {
        datasets.push({
          label: explanation.name,
          data: swarmData,
          backgroundColor: colors[ipIndex % colors.length],
          borderColor: colors[ipIndex % colors.length].replace('0.8', '1'),
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: false
        });
      }
    });
    
    new Chart(ctx, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'SHAP特征贡献度蜂群图'
          },
          tooltip: {
            callbacks: {
              title: function(context: any) {
                const point = context[0];
                return `${point.dataset.label} - ${point.raw.feature}`;
              },
              label: function(context: any) {
                const point = context.raw;
                return `SHAP值: ${point.originalValue.toFixed(4)}`;
              }
            }
          },
          legend: {
            display: true,
            position: 'bottom' as const,
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              font: {
                size: 13,
                weight: 'bold' as const
              },
              boxWidth: 12,
              boxHeight: 12
            },
            maxHeight: 100
          }
        },
        scales: {
          x: {
            type: 'category' as const, // 改为category类型以显示文本标签
            position: 'bottom' as const,
            title: {
              display: true,
              text: '指标名称'
            },
            ticks: {
              maxRotation: 45, // 旋转45度以避免标签重叠
              minRotation: 45
            }
          },
          y: {
            title: {
              display: true,
              text: 'SHAP值'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            beginAtZero: false,
            ticks: {
              callback: function(value: any) {
                return value.toFixed(2);
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'point' as const
        }
      }
    });
  });
};

// 渲染PCA降维图表
const renderPCAChart = () => {
  if (!pcaResult.value) return;
  
  nextTick(() => {
    const canvas = document.querySelector('#pcaChart') as HTMLCanvasElement;
    if (!canvas) return;
    
    Chart.getChart(canvas)?.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 创建PCA散点图
    if (pcaResult.value.pca_results) {
      const datasets = pcaResult.value.pca_results.map((result: any, index: number) => ({
        label: result.name,
        data: [{
          x: result.coordinates[0],
          y: result.coordinates[1]
        }],
        backgroundColor: `hsl(${(index * 360) / pcaResult.value.pca_results.length}, 70%, 50%)`,
        borderColor: `hsl(${(index * 360) / pcaResult.value.pca_results.length}, 70%, 40%)`,
        pointRadius: 8,
        pointHoverRadius: 10
      }));
      
      new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: `PCA降维可视化 (总方差解释: ${(pcaResult.value.total_variance_explained * 100).toFixed(1)}%)`
            },
            legend: {
              display: true,
              position: 'right'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: `主成分1 (${(pcaResult.value.explained_variance_ratio[0] * 100).toFixed(1)}%)`
              }
            },
            y: {
              title: {
                display: true,
                text: `主成分2 (${(pcaResult.value.explained_variance_ratio[1] * 100).toFixed(1)}%)`
              }
            }
          }
        }
      });
    }
  });
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
const aiAnalysisResult = ref<any>(null);
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
const userInput = ref('');
const aiInput = ref<HTMLInputElement>();
const chatMessages = ref<HTMLElement>();

const formatAIMessage = (message: string) => {
  if (!message) return '';
  
  // 将AI分析结果格式化为HTML
  return message
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
    .replace(/### (.*?)(\n|$)/g, '<h4>$1</h4>') // 三级标题
    .replace(/## (.*?)(\n|$)/g, '<h3>$1</h3>') // 二级标题
    .replace(/# (.*?)(\n|$)/g, '<h2>$1</h2>') // 一级标题
    .replace(/\n\n/g, '</p><p>') // 段落
    .replace(/\n/g, '<br>') // 换行
    .replace(/^\s*(.*)/g, '<p>$1</p>') // 包装段落
    .replace(/<\/p><p><\/p>/g, '</p>');
};

const formatMessageTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const addChatMessage = (type: 'user' | 'ai', content: string) => {
  aiChatHistory.value.push({
    type,
    content,
    timestamp: new Date().toISOString()
  });
  
  // 滚动到底部
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
    }
  });
};

const sendUserMessage = async () => {
  if (!userInput.value.trim() || aiAnalysisLoading.value) return;
  
  const message = userInput.value.trim();
  addChatMessage('user', message);
  userInput.value = '';
  
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

const startNewChat = () => {
  // 清空聊天历史
  aiChatHistory.value = [];
  // 添加欢迎消息
  addChatMessage('ai', '💬 新对话已开始！我是您的AI分析助手，可以帮您深入分析图表数据。您可以：\n\n• 点击快捷按钮分析特定图表\n• 直接输入问题进行提问\n• 使用 Ctrl+数字键 快速分析对应图表\n\n有什么可以帮助您的吗？');
  
  // 清空输入框
  userInput.value = '';
  
  // 记录日志
  addLog('🆕 AI对话已重置，开始新的分析会话');
};

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

const selectAllCharts = () => {
  if (selectedChartsForExport.value.length === availableEnabledCharts.value.length) {
    // 如果已经全选，则取消全选
    selectedChartsForExport.value = [];
  } else {
    // 否则全选所有可用图表
    selectedChartsForExport.value = availableEnabledCharts.value.map(chart => chart.id);
  }
};

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

  .stats-container {
    flex-direction: column;
    gap: 10px;
  }

  .stats-bar {
    flex-direction: column;
    gap: 15px;
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

/* 筛选按钮样式 */
.header-btn.filter-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* AI分析对话框样式 */
.ai-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.ai-dialog {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  animation: ai-dialog-enter 0.3s ease-out;
}

@keyframes ai-dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.ai-dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #ff7b72 0%, #ff6b6b 100%);
  color: white;
}

.ai-dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.ai-dialog-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ai-toggle-btn, .ai-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.ai-toggle-btn:hover, .ai-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.ai-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-dialog-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.ai-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #ff6b6b;
  border-radius: 50%;
  animation: ai-spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes ai-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ai-loading p {
  color: #6b7280;
  margin: 0;
  font-size: 14px;
}

.ai-analysis-result {
  animation: ai-content-fade-in 0.5s ease-out;
}

@keyframes ai-content-fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-analysis-text {
  line-height: 1.6;
  color: #374151;
  font-size: 14px;
}

.ai-analysis-text h2, .ai-analysis-text h3, .ai-analysis-text h4 {
  color: #1f2937;
  margin: 20px 0 10px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #f3f4f6;
}

.ai-analysis-text h2 {
  font-size: 18px;
  color: #ff6b6b;
}

.ai-analysis-text h3 {
  font-size: 16px;
  color: #374151;
}

.ai-analysis-text h4 {
  font-size: 14px;
  color: #6b7280;
}

.ai-analysis-text p {
  margin: 12px 0;
  text-align: justify;
}

.ai-analysis-text strong {
  color: #1f2937;
  font-weight: 600;
}

.ai-analysis-text li {
  margin: 8px 0;
  padding-left: 8px;
  list-style: none;
  position: relative;
}

.ai-analysis-text li::before {
  content: "•";
  color: #ff6b6b;
  font-weight: bold;
  position: absolute;
  left: -12px;
}

.ai-analysis-meta {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  text-align: right;
}

.ai-analysis-meta small {
  color: #9ca3af;
  font-size: 12px;
}

.ai-analysis-placeholder {
  text-align: center;
  padding: 40px 20px;
}

.ai-analysis-placeholder p {
  color: #6b7280;
  margin-bottom: 20px;
}

.ai-start-btn {
  background: linear-gradient(135deg, #ff7b72 0%, #ff6b6b 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.ai-start-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff5b52 0%, #ff4b4b 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.ai-start-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-dialog {
    width: 95%;
    max-height: 90vh;
  }
  
  .ai-dialog-header {
    padding: 16px 20px;
  }
  
  .ai-dialog-content {
    padding: 20px;
    max-height: 70vh;
  }
  
  .ai-analysis-text {
    font-size: 13px;
  }
}

.ai-chat-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
  display: flex;
    flex-direction: column;
}

.ai-minimized {
  height: 60px;
}

.ai-chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  min-height: 60px;
  box-sizing: border-box;
}

.ai-chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.ai-chat-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.ai-icon {
  font-size: 20px;
  animation: ai-pulse 2s ease-in-out infinite;
}

@keyframes ai-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.ai-status {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
}

.ai-status.ai-thinking {
  background: rgba(255, 193, 7, 0.8);
  animation: ai-thinking 1.5s ease-in-out infinite;
}

@keyframes ai-thinking {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.ai-chat-controls {
  display: flex;
  gap: 8px;
}

.ai-control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.ai-control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.ai-chat-body {
  flex: 1;
  display: flex;
    flex-direction: column;
  overflow: hidden;
}

.ai-quick-actions {
  padding: 16px;
  border-bottom: 1px solid #f1f3f4;
  background: #fafbfc;
}

.ai-quick-title {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
}

.ai-quick-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
}

.ai-quick-btn {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 3px;
  color: #495057;
  line-height: 1.2;
}

.ai-quick-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #667eea;
  transform: translateY(-1px);
}

.ai-quick-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-quick-btn.ai-analyze-all {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.ai-quick-btn.ai-analyze-all:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.ai-quick-btn kbd {
  background: rgba(0, 0, 0, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 8px;
  margin-left: auto;
}

.ai-chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.ai-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  animation: ai-message-slide-in 0.3s ease-out;
}

@keyframes ai-message-slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-message.user {
  flex-direction: row-reverse;
}

.ai-message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.ai-message.user .ai-message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ai-message.ai .ai-message-avatar {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.ai-message-content {
  flex: 1;
  max-width: calc(100% - 44px);
}

.ai-message.user .ai-message-content {
  text-align: right;
}

.ai-message-text {
  background: white;
  padding: 8px 12px;
  border-radius: 12px;
  line-height: 1.4;
  word-wrap: break-word;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #f1f3f4;
  font-size: 12px;
}

.ai-message.user .ai-message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.ai-message.ai .ai-message-text {
  background: #f8f9fa;
}

.ai-message-text h2, .ai-message-text h3, .ai-message-text h4 {
  margin: 6px 0 3px 0;
  color: inherit;
  border: none;
  padding: 0;
  font-size: 13px;
}

.ai-message-text p {
  margin: 6px 0;
  font-size: 12px;
}

.ai-message-time {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 3px;
}

.ai-message.user .ai-message-time {
  text-align: right;
}

.ai-typing .ai-message-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-typing-indicator {
  display: flex;
  gap: 4px;
}

.ai-typing-indicator span {
  width: 6px;
  height: 6px;
  background: #9ca3af;
  border-radius: 50%;
  animation: ai-typing-bounce 1.4s ease-in-out infinite both;
}

.ai-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.ai-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes ai-typing-bounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.ai-chat-input {
  padding: 16px;
  border-top: 1px solid #f1f3f4;
  background: white;
}

.ai-input-wrapper {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.ai-input-field {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  font-size: 12px;
  outline: none;
  transition: all 0.2s ease;
}

.ai-input-field:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.ai-send-btn {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.ai-send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.ai-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.ai-input-hint {
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
  line-height: 1.2;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-chat-window {
    width: calc(100vw - 40px);
    height: calc(100vh - 80px);
    bottom: 10px;
    right: 10px;
    left: 10px;
  }
  
  .ai-quick-buttons {
    grid-template-columns: 1fr;
  }
  
  .ai-quick-btn.ai-analyze-all {
    grid-column: 1;
  }
}

.ai-mode-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.ai-mode-toggle {
  display: flex;
  align-items: center;
}

.ai-mode-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 10px;
}

.ai-mode-btn.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

/* 优化模式切换UI */
.ai-mode-section {
  padding: 12px 16px !important;
  border-bottom: 1px solid #f1f3f4 !important;
  background: #fafbfc !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  margin-bottom: 0 !important;
}

.ai-mode-toggle {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  width: 100% !important;
}

.ai-mode-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  border: none !important;
  padding: 8px 20px !important;
  border-radius: 20px !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2) !important;
  margin: 0 !important;
}

.ai-mode-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3) !important;
}

.ai-mode-btn.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3) !important;
}

.ai-mode-circle-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #667eea;
  background: transparent;
  color: #667eea;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 10px;
}

.ai-mode-circle-btn.active {
  background: #667eea;
  color: white;
}

.ai-mode-toggle-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 12px;
}

.ai-mode-circle-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #e9ecef;
  background: white;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ai-mode-circle-btn:hover {
  border-color: #667eea;
  transform: scale(1.05);
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.2);
}

.ai-mode-circle-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

/* 调整输入框以适应左边的按钮 */
.ai-input-wrapper {
  display: flex !important;
  align-items: center !important;
  gap: 0 !important;
}

.chart-selection-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.chart-selection-dialog {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  animation: ai-dialog-enter 0.3s ease-out;
}

@keyframes ai-dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #ff7b72 0%, #ff6b6b 100%);
  color: white;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.dialog-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dialog-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-description {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 15px;
}

.chart-selection-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chart-selection-item {
  display: flex;
  align-items: center;
}

.chart-checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.chart-checkbox-label:hover {
  background: rgba(102,126,234,0.1);
}

.chart-info {
  flex: 1;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.chart-icon {
  font-size: 18px;
}

.chart-name {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

.chart-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
  padding-left: 0;
}

.disabled-reason {
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

.selection-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 15px;
}

.selection-summary p {
  font-size: 12px;
  color: #6b7280;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 15px;
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
</style> 
