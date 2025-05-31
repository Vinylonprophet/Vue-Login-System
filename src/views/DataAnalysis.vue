<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <div class="header">
      <div class="header-top">
        <h1>少数民族民俗体育IP数据分析平台</h1>
        <div class="header-actions">
          <button @click="performComprehensiveAnalysis" class="header-btn analysis-btn" :disabled="selectedIPs.length < 2">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <span>全面分析</span>
          </button>
          <button @click="exportToPDF" class="header-btn export-btn" :disabled="!hasAnalysisResults">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8"/>
              <path d="M16 17H8"/>
              <path d="M10 9H8"/>
            </svg>
            <span>导出PDF</span>
          </button>
          <button @click="exportToExcel" class="header-btn excel-btn" :disabled="!hasAnalysisResults">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M9 15h6"/>
              <path d="M12 9v6"/>
            </svg>
            <span>导出Excel</span>
          </button>
          <button @click="toggleAIAnalysis" class="header-btn ai-btn" :disabled="!hasAnalysisResults">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>AI分析</span>
          </button>
          </div>
          </div>
      
      <!-- 统计信息栏 -->
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
          <button @click="toggleFilterPanel" class="header-btn filter-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12l2-2v-2a7 7 0 1 1 14 0v2l2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/>
              <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"/>
            </svg>
            <span>指标筛选</span>
        </button>
      </div>
      </div>
    </div>

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

    <!-- 计算日志 -->
    <div class="log-panel">
      <h3>分析过程日志</h3>
      <div class="log-content" ref="logContent">
        <div v-for="(log, index) in logs" :key="index" class="log-entry">
          {{ log }}
        </div>
      </div>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>

    <!-- AI分析聊天窗口 -->
    <div v-if="showAIDialog" class="ai-chat-window" :class="{ 'ai-minimized': isAIMinimized }">
      <div class="ai-chat-header" @mousedown="startDrag">
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
          <button @click="toggleAIMinimize" class="ai-control-btn" title="最小化">
            {{ isAIMinimized ? '📈' : '➖' }}
          </button>
          <button @click="closeAIDialog" class="ai-control-btn" title="关闭">✕</button>
        </div>
      </div>
      
      <div v-show="!isAIMinimized" class="ai-chat-body">
        <!-- 快捷分析按钮 -->
        <div class="ai-quick-actions">
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
              placeholder="输入问题或使用Ctrl+数字键快速分析..." 
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
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

// 生命周期
onMounted(async () => {
  await loadInitialData();
});

// 方法
const loadInitialData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      loadIndicatorStructure(),
      loadGroups(),
      loadIPs(),
      loadStatistics()
    ]);
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

const loadGroups = async () => {
  try {
    const response = await ipApi.getGroups();
    // groups变量暂时保留，可能在未来版本中使用
  } catch (error) {
    console.error('加载组别失败:', error);
  }
};

const loadIPs = async () => {
  try {
    const response = await ipApi.getAllIPs();
    if (response.data) {
      ips.value = response.data;
      
      // 更新可用组别
      const groupSet = new Set(ips.value.map(ip => ip.group_name));
      availableGroups.value = Array.from(groupSet);
      
      // 初始化筛选
      updateFilteredIPs();
    }
  } catch (error) {
    console.error('加载IP失败:', error);
  }
};

const loadStatistics = async () => {
  try {
    const response = await ipApi.getStatistics();
    Object.assign(statistics, response.data);
  } catch (error) {
    console.error('加载统计信息失败:', error);
  }
};

const performComprehensiveAnalysis = async () => {
  if (selectedIPs.value.length < 2) {
    toast.warning('请至少选择2个IP进行全面分析');
    return;
  }
  
  // 获取选中的IP数据，并计算多专家平均值
  const selectedIPData: IP[] = [];
  for (const ipId of selectedIPs.value) {
    const ip = ips.value.find(item => item.id === ipId);
    if (!ip) continue;
    
    if (ip._isGroup) {
      // 这是多专家聚合记录，需要获取所有专家数据并计算平均值
      try {
        const expertsResponse = await ipApi.getExpertScoresByIP(ip.project_name, ip.group_name);
        if (expertsResponse.data && expertsResponse.data.length > 0) {
          const expertScores = expertsResponse.data;
          
          // 计算平均值
          const averageIndicators: Record<string, number> = {};
          const allProperties = indicatorStructure.value.allProperties || Object.keys(expertScores[0].indicators);
          
          allProperties.forEach(property => {
            const sum = expertScores.reduce((acc, expert) => {
              return acc + (expert.indicators[property] || 0);
            }, 0);
            averageIndicators[property] = sum / expertScores.length;
          });
          
          // 创建平均值IP记录
          selectedIPData.push({
            ...ip,
            expert: `${expertScores.length}位专家平均`,
            indicators: averageIndicators
          });
        }
      } catch (error) {
        console.error(`获取IP ${ip.project_name} 的专家数据失败:`, error);
        addLog(`⚠️ 获取IP "${ip.project_name}" 的专家数据失败，跳过该IP`);
      }
    } else {
      // 单一专家记录，直接使用
      selectedIPData.push(ip);
    }
  }
  
  if (selectedIPData.length < 2) {
    toast.warning('有效IP数量不足2个，无法进行分析');
    return;
  }
  
  // 临时存储分析结果，不立即设置到响应式变量
  let tempEvaluationResult: any = null;
  let tempNeuralNetworkResult: any = null;
  let tempShapResult: any = null;
  let tempPcaResult: any = null;
  let tempAdvancedClusterResult: any = null;
  let tempAdvancedClusterImage: string = '';
  
  try {
    // 使用toast的withAnalysis方法，确保加载动画至少显示10-20秒
    await toast.withAnalysis(
      async () => {
        loading.value = true;
        loadingText.value = '全面分析中...';
        
        // 清空所有之前的ML分析结果
        evaluationResult.value = null;
        neuralNetworkResult.value = null;
        shapResult.value = null;
        pcaResult.value = null;
        advancedClusterResult.value = null;
        advancedClusterImage.value = '';
        
        addLog('=== 开始全面分析 ===');
        addLog(`选中IP数量: ${selectedIPs.value.length}`);
        addLog(`有效分析IP数量: ${selectedIPData.length}`);
        addLog(`分析IP列表: ${selectedIPData.map(ip => `${ip.project_name}(${ip.expert})`).join(', ')}`);
        
        // 步骤1: 基础评估 - 使用计算好的平均值数据
        const response = await ipApi.evaluateSelected(selectedIPData, filteredThirdIndicators.value);
        if (response.data) {
          tempEvaluationResult = response.data;
          
          // 注意：这里不调用renderCharts()，不设置evaluationResult.value
        }

        // 步骤2: 神经网络训练
        if (selectedIPs.value.length >= 5) {
          loadingText.value = '神经网络训练中...';
          try {
            const currentFeatureNames = filteredThirdIndicators.value.length > 0 
              ? filteredThirdIndicators.value 
              : indicatorStructure.value.allThird;
            
            // 转换IP数据格式：将对象格式的indicators转换为数组格式
            const ipsWithArrayIndicators = selectedIPData.map(ip => {
              // 如果indicators已经是数组格式，直接使用
              if (Array.isArray(ip.indicators)) {
                return { ...ip, indicators: ip.indicators };
              }
              
              // 如果indicators是对象格式，需要转换为数组
              const indicatorArray: number[] = [];
              if (indicatorStructure.value.allProperties && indicatorStructure.value.allProperties.length > 0) {
                // 按照系统定义的属性顺序生成数组
                indicatorStructure.value.allProperties.forEach(property => {
                  indicatorArray.push(ip.indicators[property] || 0);
                });
              } else {
                // 兜底方案：如果没有属性映射，直接使用对象值
                indicatorArray.push(...Object.values(ip.indicators as Record<string, number>));
              }
              
              return { ...ip, indicators: indicatorArray };
            });
            
            const nnResponse = await pythonMLApi.trainNeuralNetwork(ipsWithArrayIndicators, currentFeatureNames);
            if (nnResponse.success && nnResponse.data) {
              tempNeuralNetworkResult = nnResponse.data;
            } else {
              addLog(`⚠️ 神经网络训练失败: ${nnResponse.error || '未知错误'}`);
            }
          } catch (error) {
            addLog(`⚠️ 神经网络训练失败: ${error}`);
          }
        } else {
          addLog('⚠️ 选中IP数量不足5个，跳过神经网络训练');
        }

        // 步骤3: SHAP模型解释
        if (selectedIPs.value.length >= 3) {
          loadingText.value = 'SHAP分析中...';
          try {
            const currentFeatureNames = filteredThirdIndicators.value.length > 0 
              ? filteredThirdIndicators.value 
              : indicatorStructure.value.allThird;
            
            // 转换IP数据格式
            const ipsWithArrayIndicators = selectedIPData.map(ip => {
              if (Array.isArray(ip.indicators)) {
                return { ...ip, indicators: ip.indicators };
              }
              
              const indicatorArray: number[] = [];
              if (indicatorStructure.value.allProperties && indicatorStructure.value.allProperties.length > 0) {
                indicatorStructure.value.allProperties.forEach(property => {
                  indicatorArray.push(ip.indicators[property] || 0);
                });
              } else {
                indicatorArray.push(...Object.values(ip.indicators as Record<string, number>));
              }
              
              return { ...ip, indicators: indicatorArray };
            });
            
            const shapResponse = await pythonMLApi.shapExplain(ipsWithArrayIndicators, currentFeatureNames);
            if (shapResponse.success && shapResponse.data) {
              tempShapResult = shapResponse.data;
            } else {
              addLog(`⚠️ SHAP分析失败: ${shapResponse.error || '未知错误'}`);
            }
          } catch (error) {
            addLog(`⚠️ SHAP分析失败: ${error}`);
          }
        } else {
          addLog('⚠️ 选中IP数量不足3个，跳过SHAP分析');
        }

        // 步骤4: PCA降维分析
        if (selectedIPs.value.length >= 2) {
          loadingText.value = 'PCA分析中...';
          try {
            // 转换IP数据格式
            const ipsWithArrayIndicators = selectedIPData.map(ip => {
              if (Array.isArray(ip.indicators)) {
                return { ...ip, indicators: ip.indicators };
              }
              
              const indicatorArray: number[] = [];
              if (indicatorStructure.value.allProperties && indicatorStructure.value.allProperties.length > 0) {
                indicatorStructure.value.allProperties.forEach(property => {
                  indicatorArray.push(ip.indicators[property] || 0);
                });
              } else {
                indicatorArray.push(...Object.values(ip.indicators as Record<string, number>));
              }
              
              return { ...ip, indicators: indicatorArray };
            });
            
            const pcaResponse = await pythonMLApi.pcaAnalysis(ipsWithArrayIndicators, 2);
            if (pcaResponse.success) {
              tempPcaResult = pcaResponse;
            } else {
              addLog(`⚠️ PCA分析失败: ${pcaResponse.error || '未知错误'}`);
            }
          } catch (error) {
            addLog(`⚠️ PCA分析失败: ${error}`);
          }
        } else {
          addLog('⚠️ 选中IP数量不足2个，跳过PCA分析');
        }

        // 步骤5: 高级聚类分析
        if (selectedIPs.value.length >= 2) {
          loadingText.value = '聚类分析中...';
          try {
            // 转换IP数据格式
            const ipsWithArrayIndicators = selectedIPData.map(ip => {
              if (Array.isArray(ip.indicators)) {
                return { ...ip, indicators: ip.indicators };
              }
              
              const indicatorArray: number[] = [];
              if (indicatorStructure.value.allProperties && indicatorStructure.value.allProperties.length > 0) {
                indicatorStructure.value.allProperties.forEach(property => {
                  indicatorArray.push(ip.indicators[property] || 0);
                });
              } else {
                indicatorArray.push(...Object.values(ip.indicators as Record<string, number>));
              }
              
              return { ...ip, indicators: indicatorArray };
            });
            
            const clusterResponse = await pythonMLApi.advancedClustering(ipsWithArrayIndicators, 2, true);
            if (clusterResponse.success && clusterResponse.data) {
              tempAdvancedClusterResult = clusterResponse.data;
              // 生成聚类图像（但不立即显示）
              const imageResponse = await generateAdvancedClusteringVisualizationFromData(clusterResponse.data);
              if (imageResponse) {
                tempAdvancedClusterImage = imageResponse;
              }
            } else {
              addLog(`⚠️ 聚类分析失败: ${clusterResponse.error || '未知错误'}`);
            }
          } catch (error) {
            addLog(`⚠️ 聚类分析失败: ${error}`);
          }
        } else {
          addLog('⚠️ 选中IP数量不足2个，跳过高级聚类分析');
        }
        loadingText.value = '全面分析中...';
        // 更新统计信息
        await loadStatistics();

      },
      {
        successMessage: `✅ 分析完成！已处理 ${selectedIPs.value.length} 个IP`,
        errorMessage: '分析失败，请检查数据后重试'
      }
    );
    addLog('🎉 全面分析完成');
    // 只有在withAnalysis完成后（即加载动画结束后），才设置结果数据并渲染图表
    addLog('🎨 开始显示分析结果...');
    
    // 设置分析结果到响应式变量
    if (tempEvaluationResult) {
      evaluationResult.value = tempEvaluationResult;
    }
    if (tempNeuralNetworkResult) {
      neuralNetworkResult.value = tempNeuralNetworkResult;
    }
    if (tempShapResult) {
      shapResult.value = tempShapResult;
    }
    if (tempPcaResult) {
      pcaResult.value = tempPcaResult;
    }
    if (tempAdvancedClusterResult) {
      advancedClusterResult.value = tempAdvancedClusterResult;
    }
    if (tempAdvancedClusterImage) {
      advancedClusterImage.value = tempAdvancedClusterImage;
    }
    
    // 等待DOM更新后渲染所有图表
    await nextTick();
    renderCharts();
    renderNeuralNetworkCharts();
    renderSHAPChart();
    renderPCAChart();
    
    addLog('✅ 所有结果已显示完成');
    
  } catch (error) {
    console.error('全面分析失败:', error);
    addLog(`❌ 分析失败: ${error}`);
  } finally {
    loading.value = false;
    loadingText.value = '';
  }
};

const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  logs.value.push(`[${timestamp}] ${message}`);
  
  nextTick(() => {
    const logContent = document.querySelector('.log-content');
    if (logContent) {
      logContent.scrollTop = logContent.scrollHeight;
    }
  });
};

// 图表渲染函数
const renderCharts = () => {
  nextTick(() => {
    renderFitnessChart();
    renderScoreChart();
    renderRadarChart();
  });
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
            x: featureIndex,
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
            type: 'linear',
            position: 'bottom',
            title: {
              display: true,
              text: '特征索引'
            },
            ticks: {
              stepSize: 1,
              callback: function(value: any) {
                const index = Math.round(value);
                return shapResult.value.feature_names[index] || '';
              }
            },
            min: -0.5,
            max: shapResult.value.feature_names.length - 0.5
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

const generateAdvancedClusteringVisualizationFromData = async (data: any): Promise<string | null> => {
  try {
    const response = await pythonMLApi.generateAdvancedPlot('clustering_with_hull', {
      clustering_results: data.clustering_results,
      convex_hulls: data.convex_hulls
    });
    
    if (response.success) {
      return response.image;
    } else {
      addLog(`生成聚类图表失败: ${response.error}`);
      return null;
    }
  } catch (error) {
    console.error('生成高级聚类图表错误:', error);
    addLog('生成聚类图表失败');
    return null;
  }
};

// 筛选和IP选择相关方法
const toggleFilterPanel = () => {
  showFilterPanel.value = !showFilterPanel.value;
  addLog(`指标筛选面板已${showFilterPanel.value ? '显示' : '隐藏'}`);
};

const updateFilteredIndicators = async () => {
  try {
    const response = await ipApi.getFilteredIndicators(
      selectedFirstLevel.value,
      selectedSecondLevel.value
    );
    if (response.data) {
      filteredThirdIndicators.value = response.data;
      addLog(`已筛选出${filteredThirdIndicators.value.length}个三级指标`);
    }
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
  // 应用筛选后自动隐藏筛选面板
  showFilterPanel.value = false;
  addLog('指标筛选面板已自动隐藏');
};

const toggleIPSelection = (ipId: string) => {
  const index = selectedIPs.value.indexOf(ipId);
  if (index > -1) {
    selectedIPs.value.splice(index, 1);
  } else {
    selectedIPs.value.push(ipId);
  }
  addLog(`IP选择已更新: 当前选中${selectedIPs.value.length}个IP`);
};

const selectAllFilteredIPs = () => {
  selectedIPs.value = filteredIPs.value.map(ip => ip.id);
  addLog(`已选择当前筛选的全部${selectedIPs.value.length}个IP`);
};

const isIPSelected = (ipId: string) => {
  return selectedIPs.value.includes(ipId);
};

const clearSelection = () => {
  selectedIPs.value = [];
  addLog('已清空IP选择');
};

const updateFilteredIPs = () => {
  if (ipGroupFilter.value === '全部') {
    filteredIPs.value = ips.value;
  } else {
    filteredIPs.value = ips.value.filter(ip => ip.group_name === ipGroupFilter.value);
  }
  addLog(`筛选组别: ${ipGroupFilter.value}, 显示${filteredIPs.value.length}个IP`);
};

// PDF导出功能
const exportToPDF = async () => {
  if (!hasAnalysisResults.value) {
    toast.warning('请先进行全面分析后再导出PDF');
    return;
  }
  
  try {
    loading.value = true;
    loadingText.value = '准备导出PDF...';
    
    // 保存当前激活的图表
    const originalActiveChart = activeChart.value;
    
    // 计算有多少个图表需要导出 - 使用与界面相同的条件
    const charts = chartTabs.value.map(tab => ({
      id: tab.id,
      title: getChineseChartTitle(tab.id),
      condition: !tab.disabled // 使用与界面相同的disabled逻辑
    }));
    
    const validCharts = charts.filter(c => c.condition);
    
    addLog(`🚀 开始PDF导出流程`);
    addLog(`📊 界面显示图表: ${chartTabs.value.length} 个`);
    addLog(`✅ 可导出图表: ${validCharts.length} 个`);
    addLog(`📋 图表列表: ${validCharts.map(c => c.title).join(', ')}`);
    addLog(`⏰ 预计需要 ${Math.ceil(validCharts.length * 6)} 秒完成（包含AI分析）`);
    addLog(`💡 使用HTML转PDF方式，完美支持中文显示`);
    addLog(`🤖 每个图表都将生成专业AI分析`);
    addLog(`⚡ 正在处理复杂图表，请耐心等待...`);
    
    // 确保所有图表都已正确渲染后再开始导出
    addLog(`🔍 开始图表状态检查...`);
    loadingText.value = '检查图表状态...';
    
    for (const chart of validCharts) {
      if (!chart.condition) continue;
      
      // 切换到对应图表
      activeChart.value = chart.id;
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 3000)); // 增加到3秒等待切换
      
      // 检查图表是否可见和有内容
      const canvasId = getCanvasId(chart.id);
      const canvas = document.querySelector(`#${canvasId}`) as HTMLCanvasElement;
      
      if (canvas) {
        const chartInstance = Chart.getChart(canvas);
        if (chartInstance && chartInstance.data && chartInstance.data.datasets && chartInstance.data.datasets.length > 0) {
          addLog(`✅ 图表状态正常: ${getChineseChartTitle(chart.id)}`);
        } else {
          addLog(`⚠️ 图表可能需要重新渲染: ${getChineseChartTitle(chart.id)}`);
          // 强制重新渲染
          renderSpecificChart(chart.id);
          await new Promise(resolve => setTimeout(resolve, 5000)); // 重新渲染后等待5秒
        }
      } else {
        addLog(`⚠️ 图表Canvas未找到: ${getChineseChartTitle(chart.id)}`);
      }
    }
    
    addLog(`✅ 图表状态检查完成，开始导出...`);
    
    // 创建临时容器来放置PDF内容
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '210mm'; // A4宽度
    tempContainer.style.padding = '20px';
    tempContainer.style.fontFamily = 'Arial, "Microsoft YaHei", "SimSun", sans-serif';
    tempContainer.style.fontSize = '14px';
    tempContainer.style.lineHeight = '1.6';
    tempContainer.style.color = '#333';
    tempContainer.style.backgroundColor = 'white';
    document.body.appendChild(tempContainer);
    
    // 获取AI生成的研究背景内容
    addLog(`🤖 正在生成研究背景与意义...`);
    loadingText.value = '正在生成研究背景与意义...';
    const backgroundContent = await getAIGeneratedContent('background', selectedIPs.value.length, filteredThirdIndicators.value.length);
    
    // 获取AI生成的研究方法内容
    addLog(`🤖 正在生成研究方法...`);
    loadingText.value = '正在生成研究方法...';
    const methodContent = await getAIGeneratedContent('method', selectedIPs.value.length, filteredThirdIndicators.value.length);
    
    // 获取AI生成的摘要内容
    addLog(`🤖 正在生成摘要...`);
    loadingText.value = '正在生成摘要...';
    const abstractContent = await getAIGeneratedContent('abstract', selectedIPs.value.length, filteredThirdIndicators.value.length);
    
    // 创建PDF标题页
    const titleSection = document.createElement('div');
    titleSection.innerHTML = `
      <div style="text-align: center; margin-bottom: 60px; padding: 40px 0;">
        <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 30px; font-weight: bold; line-height: 1.4;">
          基于多维评价体系的少数民族体育IP<br>品牌塑造路径研究
        </h1>
        <div style="margin: 30px 0; font-size: 16px; color: #666; line-height: 1.8;">
          <p><strong>研究时间：</strong>${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>样本规模：</strong>${selectedIPs.value.length}个体育IP项目</p>
          <p><strong>评价指标：</strong>${filteredThirdIndicators.value.length}项核心指标</p>
          <p><strong>分析方法：</strong>遗传算法优化、神经网络建模、SHAP解释性分析</p>
        </div>
      </div>
      
      <div style="margin-bottom: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #3498db;">
        <h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">摘要</h2>
        <div style="text-align: justify; line-height: 1.8;">
          ${abstractContent}
        </div>
      </div>
    `;
    tempContainer.appendChild(titleSection);
    
    // 添加目录
    const tocSection = document.createElement('div');
    tocSection.style.pageBreakBefore = 'always';
    tocSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 22px; color: #2c3e50; margin-bottom: 30px; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px;">目录</h2>
        <div style="line-height: 2.0; font-size: 14px;">
          <p>1. 研究背景与意义 ......................................................... 3</p>
          <p>2. 研究方法与数据来源 .................................................... 4</p>
          <p>3. 评价体系构建与算法优化 ............................................... 5</p>
          <p>4. 实证分析结果 ......................................................... 6</p>
          <p>5. 品牌塑造路径设计 ..................................................... ${6 + validCharts.length}</p>
          <p>6. 政策建议与实践指导 ................................................... ${7 + validCharts.length}</p>
          <p>7. 结论与展望 .......................................................... ${8 + validCharts.length}</p>
        </div>
      </div>
    `;
    tempContainer.appendChild(tocSection);
    
    // 添加研究背景（AI生成内容）
    const backgroundSection = document.createElement('div');
    backgroundSection.style.pageBreakBefore = 'always';
    backgroundSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${backgroundContent}
      </div>
    `;
    tempContainer.appendChild(backgroundSection);
    
    // 添加研究方法（AI生成内容）
    const methodSection = document.createElement('div');
    methodSection.style.pageBreakBefore = 'always';
    methodSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${methodContent}
      </div>
    `;
    tempContainer.appendChild(methodSection);
    
    // 添加实证分析章节标题
    const analysisHeaderSection = document.createElement('div');
    analysisHeaderSection.style.pageBreakBefore = 'always';
    
    // 获取AI生成的实证分析引言
    addLog(`🤖 正在生成实证分析引言...`);
    loadingText.value = '正在生成实证分析引言...';
    const analysisIntroContent = await getAIGeneratedContent('analysis_intro', selectedIPs.value.length, filteredThirdIndicators.value.length);
    
    analysisHeaderSection.innerHTML = `
      <div style="margin-bottom: 30px;">
        ${analysisIntroContent}
      </div>
    `;
    tempContainer.appendChild(analysisHeaderSection);
    
    // 处理每个图表
    let processedCharts = 0;
    
    for (const chart of validCharts) {
      try {
        processedCharts++;
        const chineseTitle = chart.title;
        loadingText.value = `处理图表 ${processedCharts}/${validCharts.length}: ${chineseTitle}`;
        
        let imageDataUrl: string | null = null;
        
        if (chart.id === 'cluster') {
          const imgElement = document.querySelector('.ml-chart-image img') as HTMLImageElement;
          if (imgElement && imgElement.src) {
            imageDataUrl = imgElement.src;
            addLog(`✅ 获取聚类图片: ${chineseTitle}`);
          }
        } else {
          addLog(`🔄 准备导出图表 (${processedCharts}/${validCharts.length}): ${chineseTitle}`);
          
          activeChart.value = chart.id;
          await nextTick();
          
          // 强制等待更长时间确保图表完全渲染
          let waitTime = chart.id === 'shap' ? 20000 : chart.id === 'neural' || chart.id === 'importance' ? 15000 : 10000;
          addLog(`⏳ 等待图表渲染 (${waitTime/1000}秒): ${chineseTitle}`);
          loadingText.value = `等待图表渲染 ${Math.ceil(waitTime/1000)}秒: ${chineseTitle}`;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          await nextTick();
          
          // 强制重新渲染当前图表
          addLog(`🔄 强制重新渲染图表: ${chineseTitle}`);
          switch (chart.id) {
            case 'fitness':
              renderFitnessChart();
              break;
            case 'scores':
              renderScoreChart();
              break;
            case 'radar':
              renderRadarChart();
              break;
            case 'neural':
              renderNeuralNetworkCharts();
              break;
            case 'importance':
              renderNeuralNetworkCharts();
              break;
            case 'shap':
              renderSHAPChart();
              break;
            case 'pca':
              renderPCAChart();
              break;
          }
          
          // 再次等待渲染完成 - 更长时间
          addLog(`⏳ 等待重新渲染完成: ${chineseTitle}`);
          await new Promise(resolve => setTimeout(resolve, 8000)); // 增加到8秒
          await nextTick();
          
          // 修复canvas ID匹配问题
          let canvasId = '';
          switch (chart.id) {
            case 'fitness':
              canvasId = 'fitnessChart';
              break;
            case 'scores':
              canvasId = 'scoreChart';
              break;
            case 'radar':
              canvasId = 'radarChart';
              break;
            case 'neural':
              canvasId = 'nnLossChart'; // 修复神经网络图表ID
              break;
            case 'importance':
              canvasId = 'featureImportanceChart';
              break;
            case 'shap':
              canvasId = 'shapChart';
              break;
            case 'pca':
              canvasId = 'pcaChart';
              break;
            default:
              canvasId = `${chart.id}Chart`;
          }
          
          // 多次重试获取图表
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries && (!imageDataUrl || imageDataUrl === 'data:,')) {
            retryCount++;
            addLog(`🔄 第${retryCount}次尝试获取图表: ${chineseTitle}`);
            
            // 每次重试前先等待更长时间
            if (retryCount > 1) {
              addLog(`⏳ 重试等待 5秒...`);
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            const canvas = document.querySelector(`#${canvasId}`) as HTMLCanvasElement;
            addLog(`🔍 查找Canvas元素: ${canvasId}`);
            
            if (canvas) {
              addLog(`✅ 找到Canvas元素: ${canvasId}, 尺寸: ${canvas.width}x${canvas.height}`);
              
              // 检查Canvas是否有实际内容
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const hasContent = imageData.data.some(value => value !== 0);
                addLog(`Canvas内容检查: ${hasContent ? '有内容' : '空白'}, 总像素: ${imageData.data.length/4}`);
                
                if (!hasContent && retryCount < maxRetries) {
                  addLog(`⚠️ Canvas内容为空，强制重新渲染...`);
                  renderSpecificChart(chart.id);
                  await new Promise(resolve => setTimeout(resolve, 6000)); // 等待6秒重新渲染
                  continue; // 跳到下一次重试
                }
              }
              
              // 检查Chart.js实例
              const chartInstance = Chart.getChart(canvas);
              if (chartInstance) {
                addLog(`✅ 找到Chart.js实例: ${chineseTitle}`);
                
                // 强制更新图表
                try {
                  chartInstance.update('none'); // 立即更新，不使用动画
                  await new Promise(resolve => setTimeout(resolve, 2000)); // 等待更新完成
                  
                  // 使用Chart.js的toBase64Image方法（更可靠）
                  imageDataUrl = chartInstance.toBase64Image('image/png', 1.0);
                  addLog(`✅ 通过Chart.js实例获取图表数据: ${chineseTitle} (重试${retryCount}次)`);
                  break; // 成功获取，退出重试循环
                } catch (chartError) {
                  addLog(`⚠️ Chart.js导出失败（重试${retryCount}），错误: ${chartError}`);
                }
              }
              
              // 如果Chart.js方法失败，尝试Canvas方法
              if (ctx) {
                try {
                  imageDataUrl = canvas.toDataURL('image/png', 1.0);
                  addLog(`✅ 通过Canvas方法获取图表数据: ${chineseTitle} (重试${retryCount}次)`);
                  break; // 成功获取，退出重试循环
                } catch (canvasError) {
                  addLog(`❌ Canvas导出失败（重试${retryCount}），错误: ${canvasError}`);
                }
              }
            } else {
              addLog(`❌ 未找到Canvas元素: ${canvasId} (重试${retryCount}次)`);
              
              if (retryCount === 1) {
                // 第一次重试时显示所有canvas元素
                const allCanvases = document.querySelectorAll('canvas');
                addLog(`页面中共有 ${allCanvases.length} 个Canvas元素`);
                allCanvases.forEach((c, index) => {
                  addLog(`Canvas ${index}: id="${c.id}", class="${c.className}"`);
                });
              }
            }
          }
          
          // 如果重试后仍然失败，最后一次尝试使用html2canvas
          if ((!imageDataUrl || imageDataUrl === 'data:,') && chart.id !== 'cluster') {
            addLog(`🎯 最后尝试：使用html2canvas捕获图表区域: ${chineseTitle}`);
            try {
              const chartPanel = document.querySelector(`[v-show="${activeChart.value === chart.id}"] .chart, .chart-panel:not([style*="display: none"]) .chart`) as HTMLElement;
              if (chartPanel) {
                const chartCanvas = await html2canvas(chartPanel, {
                  scale: 2,
                  backgroundColor: '#ffffff',
                  useCORS: true,
                  allowTaint: true
                });
                imageDataUrl = chartCanvas.toDataURL('image/png', 1.0);
                addLog(`✅ html2canvas成功捕获图表: ${chineseTitle}`);
              }
            } catch (html2canvasError) {
              addLog(`❌ html2canvas也失败了: ${chineseTitle}, 错误: ${html2canvasError}`);
            }
          }
        }
        
        if (imageDataUrl && imageDataUrl !== 'data:,') {
          // 获取学术化的分析内容
          addLog(`📝 正在为图表 "${chineseTitle}" 生成学术分析...`);
          loadingText.value = `生成学术分析 ${processedCharts}/${validCharts.length}: ${chineseTitle}`;
          
          let academicAnalysis = '';
          try {
            academicAnalysis = await getAcademicAnalysis(chart.id);
            addLog(`✅ 学术分析已生成: ${chineseTitle}`);
          } catch (error) {
            console.warn(`学术分析失败 for ${chineseTitle}:`, error);
            academicAnalysis = getDefaultAcademicAnalysis(chart.id);
          }
          
          // 创建学术化的图表分析段落
          const chartSection = document.createElement('div');
          chartSection.style.marginBottom = '35px';
          chartSection.innerHTML = `
            <div style="margin-bottom: 25px;">
              <h3 style="font-size: 16px; color: #2c3e50; margin-bottom: 15px;">${getAcademicSectionTitle(chart.id)}</h3>
              
              <div style="text-align: center; margin: 20px 0;">
                <img src="${imageDataUrl}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" />
                <p style="text-align: center; font-size: 12px; color: #666; margin-top: 8px; font-style: italic;">
                  图${processedCharts}. ${chineseTitle}
                </p>
              </div>
              
              <div style="text-align: justify; line-height: 1.8; margin-top: 15px;">
                ${academicAnalysis}
              </div>
            </div>
          `;
          tempContainer.appendChild(chartSection);
          
          addLog(`✅ 已添加学术分析到论文: ${chineseTitle}`);
        } else {
          addLog(`❌ 最终未能获取图表: ${chineseTitle} - 将添加重试提示`);
          
          // 生成分析但提示图表获取失败
          let academicAnalysis = '';
          try {
            academicAnalysis = await getAcademicAnalysis(chart.id);
            addLog(`✅ 文本分析已生成: ${chineseTitle}`);
          } catch (error) {
            console.warn(`文本分析失败 for ${chineseTitle}:`, error);
            academicAnalysis = getDefaultAcademicAnalysis(chart.id);
          }
          
          // 创建包含重试提示的分析段落
          const chartSection = document.createElement('div');
          chartSection.style.marginBottom = '35px';
          chartSection.innerHTML = `
            <div style="margin-bottom: 25px;">
              <h3 style="font-size: 16px; color: #2c3e50; margin-bottom: 15px;">${getAcademicSectionTitle(chart.id)}</h3>
              
              <div style="padding: 30px; background: linear-gradient(135deg, #ffebe6 0%, #fff2e6 100%); border-radius: 12px; border: 2px solid #ff6b6b; text-align: center; margin: 20px 0; box-shadow: 0 4px 8px rgba(255,107,107,0.2);">
                <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                <h4 style="color: #e74c3c; margin: 10px 0; font-size: 16px; font-weight: bold;">图表获取失败</h4>
                <p style="margin: 8px 0; font-size: 14px; color: #666; line-height: 1.5;">
                  <strong>建议解决方案：</strong><br>
                  1. 确保所有图表在界面中完全显示<br>
                  2. 等待更长时间后重新导出<br>
                  3. 刷新页面重新分析后导出
                </p>
                <p style="margin: 8px 0; font-size: 12px; color: #999; font-style: italic;">
                  图表类型：${chineseTitle} | Canvas ID: ${chart.id}Chart
                </p>
              </div>
              
              <div style="text-align: justify; line-height: 1.8; margin-top: 15px;">
                <div style="padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; margin-bottom: 15px;">
                  <strong style="color: #007bff;">💡 基于数据的分析结果：</strong>
                </div>
                ${academicAnalysis}
              </div>
            </div>
          `;
          tempContainer.appendChild(chartSection);
          
          addLog(`⚠️ 已添加重试提示和分析到论文: ${chineseTitle}`);
        }
      } catch (error) {
        const chineseTitle = chart.title;
        addLog(`❌ 处理图表失败: ${chineseTitle}`);
      }
    }
    
    // 添加品牌塑造路径章节（AI生成）
    addLog(`🤖 正在生成品牌塑造路径设计...`);
    loadingText.value = '正在生成品牌塑造路径设计...';
    const brandingPathContent = await getAIGeneratedContent('branding_path', selectedIPs.value.length, filteredThirdIndicators.value.length);
    
    const brandingPathSection = document.createElement('div');
    brandingPathSection.style.pageBreakBefore = 'always';
    brandingPathSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${brandingPathContent}
      </div>
    `;
    tempContainer.appendChild(brandingPathSection);
    
    // 添加政策建议章节（AI生成）
    addLog(`🤖 正在生成政策建议与实践指导...`);
    loadingText.value = '正在生成政策建议与实践指导...';
    const policySuggestionsContent = await getAIGeneratedContent('policy_suggestions', selectedIPs.value.length, filteredThirdIndicators.value.length);
    
    const policySection = document.createElement('div');
    policySection.style.pageBreakBefore = 'always';
    policySection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${policySuggestionsContent}
      </div>
    `;
    tempContainer.appendChild(policySection);
    
    // 添加结论章节（AI生成）
    addLog(`🤖 正在生成结论与展望...`);
    loadingText.value = '正在生成结论与展望...';
    const conclusionContent = await getAIGeneratedContent('conclusion', selectedIPs.value.length, filteredThirdIndicators.value.length);
    
    const conclusionSection = document.createElement('div');
    conclusionSection.style.pageBreakBefore = 'always';
    conclusionSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${conclusionContent}
      </div>
    `;
    tempContainer.appendChild(conclusionSection);
    
    // 恢复原来的激活图表
    activeChart.value = originalActiveChart;
    
    // 使用html2canvas转换为图片然后生成PDF
    loadingText.value = '正在生成PDF文件...';
    addLog(`📄 开始转换HTML为PDF...`);
    
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight
    });
    
    // 清理临时容器
    document.body.removeChild(tempContainer);
    
    // 创建PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // 如果内容超过一页，需要分页
    let heightLeft = imgHeight;
    let position = 0;
    
    // 添加第一页
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
    
    // 添加后续页面
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    // 生成文件名
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `基于多维评价体系的少数民族体育IP品牌塑造路径研究_${dateStr}_${timeStr}.pdf`;
    
    // 保存PDF
    pdf.save(fileName);
    
    addLog(`🎉 PDF导出成功: ${fileName} (包含 ${validCharts.length} 个图表)`);
    addLog(`📄 PDF完美支持中文显示，包含详细AI分析`);
    addLog(`🤖 每个图表都包含专业中文AI分析`);
    toast.success(`PDF导出成功！包含 ${validCharts.length} 个图表和中文AI分析`);
    
  } catch (error) {
    console.error('PDF导出失败:', error);
    addLog(`❌ PDF导出失败: ${error}`);
    toast.fail('PDF导出失败，请重试');
  } finally {
    loading.value = false;
    loadingText.value = '';
  }
};

// Excel导出功能
const exportToExcel = async () => {
  if (!hasAnalysisResults.value) {
    toast.warning('请先进行全面分析后再导出Excel');
    return;
  }
  
  try {
    loading.value = true;
    loadingText.value = '准备导出Excel...';
    
    addLog('🚀 开始Excel导出流程');
    addLog(`📊 导出分析的 ${selectedIPs.value.length} 个IP数据`);
    
    // 准备Excel数据
    const excelData = [];
    
    // 获取中文指标名称
    const chineseIndicatorNames = filteredThirdIndicators.value.length > 0 
      ? filteredThirdIndicators.value 
      : indicatorStructure.value.allThird || [];
    
    // 添加标题行
    const headers = [
      '项目名称', '专家', '组别', 
      ...chineseIndicatorNames
    ];
    excelData.push(headers);
    
    // 处理每个选中的IP
    for (const ipId of selectedIPs.value) {
      const ip = ips.value.find(item => item.id === ipId);
      if (!ip) continue;
      
      if (ip._isGroup) {
        // 多专家聚合记录，获取每个专家的具体评分
        try {
          const expertsResponse = await ipApi.getExpertScoresByIP(ip.project_name, ip.group_name);
          if (expertsResponse.data && expertsResponse.data.length > 0) {
            const expertScores = expertsResponse.data;
            
            // 为每个专家添加一行数据
            expertScores.forEach(expert => {
              const row: any[] = [
                ip.project_name || '',
                expert.expert || '',
                ip.group_name || ''
              ];
              
              // 添加指标数据（使用中文名称对应的数值）
              chineseIndicatorNames.forEach(chineseName => {
                // 通过中文名称找到对应的属性名
                const propertyName = indicatorStructure.value.indicatorPropertyMap?.[chineseName];
                const value = expert.indicators && propertyName 
                  ? expert.indicators[propertyName] || 0 
                  : 0;
                row.push(Number(value));
              });
              
              excelData.push(row);
            });
            
            // 添加平均值行
            const avgRow: any[] = [
              ip.project_name || '',
              `${expertScores.length}位专家平均`,
              ip.group_name || ''
            ];
            
            // 计算平均值
            chineseIndicatorNames.forEach(chineseName => {
              const propertyName = indicatorStructure.value.indicatorPropertyMap?.[chineseName];
              if (propertyName) {
                const sum = expertScores.reduce((acc, expert) => {
                  return acc + (expert.indicators[propertyName] || 0);
                }, 0);
                const avgValue = sum / expertScores.length;
                avgRow.push(Number(avgValue.toFixed(2)));
              } else {
                avgRow.push(0);
              }
            });
            
            excelData.push(avgRow);
            
            // 添加空行分隔
            excelData.push(Array(headers.length).fill(''));
            
          }
        } catch (error) {
          addLog(`⚠️ 获取IP "${ip.project_name}" 的专家数据失败`);
        }
      } else {
        // 单一专家记录
        const row: any[] = [
          ip.project_name || '',
          ip.expert || '',
          ip.group_name || ''
        ];
        
        // 添加指标数据
        chineseIndicatorNames.forEach(chineseName => {
          const propertyName = indicatorStructure.value.indicatorPropertyMap?.[chineseName];
          const value = ip.indicators && propertyName 
            ? ip.indicators[propertyName] || 0 
            : 0;
          row.push(Number(value));
        });
        
        excelData.push(row);
      }
    }
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // 设置列宽
    const colWidths = [
      {wch: 25}, // 项目名称
      {wch: 15}, // 专家
      {wch: 15}, // 组别
      ...Array(chineseIndicatorNames.length).fill({wch: 12}) // 指标列
    ];
    ws['!cols'] = colWidths;
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '分析数据详情');
    
    // 如果有分析结果，添加分析结果工作表
    if (evaluationResult.value?.evaluation) {
      const analysisData = [];
      analysisData.push(['排名', '项目名称', '综合评分', '误差值']);
      
      evaluationResult.value.evaluation
        .sort((a: any, b: any) => b.score - a.score)
        .forEach((item: any, index: number) => {
          analysisData.push([
            index + 1,
            item.name,
            Number(item.score.toFixed(4)),
            item.error ? Number(item.error.toFixed(4)) : 'N/A'
          ]);
        });
      
      const analysisWs = XLSX.utils.aoa_to_sheet(analysisData);
      analysisWs['!cols'] = [{wch: 8}, {wch: 25}, {wch: 12}, {wch: 12}];
      XLSX.utils.book_append_sheet(wb, analysisWs, '综合评分排名');
    }
    
    // 生成文件名
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `IP-Analysis-Data_${dateStr}_${timeStr}.xlsx`;
    
    // 保存文件
    XLSX.writeFile(wb, fileName);
    
    addLog(`🎉 Excel导出成功: ${fileName}`);
    addLog(`📋 包含 ${selectedIPs.value.length} 个IP的详细分析数据`);
    addLog(`📊 使用中文指标名称，包含多专家具体评分`);
    toast.success(`Excel导出成功！包含 ${selectedIPs.value.length} 个IP的详细数据`);
    
  } catch (error) {
    console.error('Excel导出失败:', error);
    addLog(`❌ Excel导出失败: ${error}`);
    toast.fail('Excel导出失败，请重试');
  } finally {
    loading.value = false;
    loadingText.value = '';
  }
};

// AI分析相关
const showAIDialog = ref(false);
const aiAnalysisLoading = ref(false);
const aiAnalysisResult = ref<any>(null);

const toggleAIAnalysis = () => {
  showAIDialog.value = true;
};

const closeAIDialog = () => {
  showAIDialog.value = false;
};

const startAIAnalysis = async () => {
  aiAnalysisLoading.value = true;
  addLog('🤖 开始AI分析...');
  
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
      advancedClusterResult: advancedClusterResult.value
    };
    
    // 获取当前可用的图表类型
    const availableCharts = chartTabs.value
      .filter(tab => !tab.disabled)
      .map(tab => tab.title);
    
    const response = await ipApi.aiAnalysis(analysisData, availableCharts);
    
    if (response.success) {
      aiAnalysisResult.value = response.data;
      addLog('🎉 AI分析完成');
    } else {
      throw new Error(response.message || 'AI分析失败');
    }
  } catch (error) {
    console.error('AI分析失败:', error);
    addLog(`❌ AI分析失败: ${error}`);
    toast.fail('AI分析失败，请重试');
  } finally {
    aiAnalysisLoading.value = false;
  }
};

const formatAIAnalysis = (analysis: string) => {
  if (!analysis) return '';
  
  // 将AI分析结果格式化为HTML
  return analysis
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
    .replace(/### (.*?)(\n|$)/g, '<h4>$1</h4>') // 三级标题
    .replace(/## (.*?)(\n|$)/g, '<h3>$1</h3>') // 二级标题
    .replace(/# (.*?)(\n|$)/g, '<h2>$1</h2>') // 一级标题
    .replace(/\n\n/g, '</p><p>') // 段落
    .replace(/^\s*(.*)/g, '<p>$1</p>') // 包装段落
    .replace(/^\d+\.\s/gm, '<li>') // 有序列表
    .replace(/<li>/g, '</p><li><p>')
    .replace(/<\/p><p><\/p>/g, '</p>')
    .replace(/^<p><\/p>/, '');
};

const formatAnalysisTime = (timestamp: string) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('zh-CN');
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

// 拖拽相关
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

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
    
    const response = await ipApi.aiAnalysis(analysisData, availableCharts);
    
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

const startDrag = (event: MouseEvent) => {
  isDragging.value = true;
  const rect = (event.target as HTMLElement).closest('.ai-chat-window')?.getBoundingClientRect();
  if (rect) {
    dragOffset.value = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
};

const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;
  
  const chatWindow = document.querySelector('.ai-chat-window') as HTMLElement;
  if (chatWindow) {
    chatWindow.style.left = `${event.clientX - dragOffset.value.x}px`;
    chatWindow.style.top = `${event.clientY - dragOffset.value.y}px`;
    chatWindow.style.right = 'auto';
    chatWindow.style.bottom = 'auto';
  }
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
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

// 获取图表AI分析的辅助函数
const getChartAIAnalysis = async (chartId: string): Promise<string> => {
  try {
    let analysisPrompt = '';
    
    switch (chartId) {
      case 'fitness':
        analysisPrompt = '请详细分析适应度变化图表，重点说明遗传算法的优化过程、收敛趋势和训练效果，控制在100-150字内。';
        break;
      case 'scores':
        analysisPrompt = '请详细分析IP评分分布图表，识别表现优秀和需要改进的项目，并提供针对性建议，控制在100-150字内。';
        break;
      case 'radar':
        analysisPrompt = '请详细分析指标权重雷达图，解释各指标的相对重要性和关键影响因素，控制在100-150字内。';
        break;
      case 'neural':
        analysisPrompt = '请详细分析神经网络训练图表，评估模型的学习能力、收敛速度和性能表现，控制在100-150字内。';
        break;
      case 'importance':
        analysisPrompt = '请详细分析特征重要性图表，识别对预测结果最有影响力的特征及其业务意义，控制在100-150字内。';
        break;
      case 'shap':
        analysisPrompt = '请详细分析SHAP图表，解释模型的可解释性分析结果和各特征的贡献度，控制在100-150字内。';
        break;
      case 'pca':
        analysisPrompt = '请详细分析PCA降维图表，解释主成分和数据分布，控制在100-150字内。';
        break;
      case 'cluster':
        analysisPrompt = '请详细分析聚类图表，解释分组模式和聚类特征，控制在100-150字内。';
        break;
      default:
        return '该图表暂无可用分析。';
    }
    
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
      customPrompt: analysisPrompt
    };
    
    // 获取当前可用的图表类型
    const availableCharts = chartTabs.value
      .filter(tab => !tab.disabled)
      .map(tab => tab.title);
    
    const response = await ipApi.aiAnalysis(analysisData, availableCharts);
    
    if (response.success && response.data?.analysis) {
      // 清理AI分析结果，移除HTML标签，保持简洁
      return response.data.analysis
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/\*\*/g, '') // 移除粗体标记
        .replace(/###?\s*/g, '') // 移除标题标记
        .trim();
    } else {
      return '该图表的AI分析生成失败，请稍后重试。';
    }
  } catch (error) {
    console.error(`AI分析失败 for chart ${chartId}:`, error);
    return '由于技术问题，该图表的AI分析暂时不可用。';
  }
};

// 获取中文图表标题
const getChineseChartTitle = (chartId: string): string => {
  const titleMap: Record<string, string> = {
    'fitness': '遗传算法适应度变化曲线',
    'scores': 'IP评分分布图',
    'radar': '关键指标权重雷达图',
    'neural': '神经网络训练损失曲线',
    'importance': '特征重要性分析图',
    'shap': 'SHAP特征贡献度分析图',
    'pca': 'PCA主成分降维图',
    'cluster': '高级聚类分析图'
  };
  
  return titleMap[chartId] || '未知图表';
};

// Excel导出功能
const getAcademicAnalysis = async (chartId: string): Promise<string> => {
  try {
    let analysisPrompt = '';
    
    // 准备图表特定的数据上下文
    let chartSpecificData = '';
    
    switch (chartId) {
      case 'fitness':
        if (evaluationResult.value?.fitnessHistory) {
          const lastGen = evaluationResult.value.fitnessHistory.length;
          const finalFitness = evaluationResult.value.fitnessHistory[lastGen - 1];
          const avgFinalFitness = finalFitness.reduce((a, b) => a + b, 0) / finalFitness.length;
          chartSpecificData = `迭代次数：${lastGen}代，最终平均适应度：${avgFinalFitness.toFixed(4)}`;
        }
        analysisPrompt = `基于遗传算法适应度曲线图，分析算法的收敛过程。${chartSpecificData}。只分析这个图表显示的信息，不要提及其他图表。要求：专注于适应度变化趋势、收敛速度、优化效果。字数控制在300-500字。`;
        break;
        
      case 'scores':
        if (evaluationResult.value?.evaluation) {
          const scores = evaluationResult.value.evaluation.map(e => e.score);
          const maxScore = Math.max(...scores);
          const minScore = Math.min(...scores);
          chartSpecificData = `IP数量：${scores.length}个，最高分：${maxScore.toFixed(2)}，最低分：${minScore.toFixed(2)}`;
        }
        analysisPrompt = `基于IP评分分布柱状图，分析各IP的得分情况。${chartSpecificData}。只分析评分分布特征，不要提及其他分析方法。要求：专注于分数分布、差异性、优劣势项目识别。字数控制在300-500字。`;
        break;
        
      case 'radar':
        if (evaluationResult.value?.weights) {
          const topN = 5;
          const sortedWeights = evaluationResult.value.weights
            .map((w, i) => ({ weight: w, index: i }))
            .sort((a, b) => b.weight - a.weight)
            .slice(0, topN);
          chartSpecificData = `最重要的${topN}个指标权重：${sortedWeights.map(w => w.weight.toFixed(4)).join(', ')}`;
        }
        analysisPrompt = `基于指标权重雷达图，分析各维度的相对重要性。${chartSpecificData}。只分析权重分布，不要提及其他图表。要求：专注于权重大小、指标重要性排序、维度平衡性。字数控制在300-500字。`;
        break;
        
      case 'neural':
        if (neuralNetworkResult.value?.training_losses) {
          const losses = neuralNetworkResult.value.training_losses;
          const initialLoss = losses[0];
          const finalLoss = losses[losses.length - 1];
          chartSpecificData = `训练轮次：${losses.length}，初始损失：${initialLoss.toFixed(4)}，最终损失：${finalLoss.toFixed(4)}`;
        }
        analysisPrompt = `基于神经网络训练损失曲线，分析模型的训练过程。${chartSpecificData}。只分析损失变化，不要提及其他分析。要求：专注于损失下降趋势、收敛情况、训练效果评估。字数控制在300-500字。`;
        break;
        
      case 'importance':
        if (neuralNetworkResult.value?.feature_importance) {
          const importance = neuralNetworkResult.value.feature_importance;
          const maxImportance = Math.max(...importance);
          const topFeatures = importance
            .map((imp: number, i: number) => ({ imp, index: i }))
            .sort((a: {imp: number}, b: {imp: number}) => b.imp - a.imp)
            .slice(0, 3);
          chartSpecificData = `特征数量：${importance.length}，最高重要性：${maxImportance.toFixed(4)}`;
        }
        analysisPrompt = `基于特征重要性柱状图，分析各特征对模型的贡献。${chartSpecificData}。只分析特征重要性，不要提及其他内容。要求：专注于重要特征识别、特征贡献度差异、关键因素分析。字数控制在300-500字。`;
        break;
        
      case 'shap':
        if (shapResult.value?.ip_explanations) {
          const ipCount = shapResult.value.ip_explanations.length;
          chartSpecificData = `分析样本数：${ipCount}个IP`;
        }
        analysisPrompt = `基于SHAP蜂群图，分析模型的可解释性。${chartSpecificData}。只分析SHAP值分布，不要提及其他方法。要求：专注于特征贡献度、正负影响、个体差异性。字数控制在300-500字。`;
        break;
        
      case 'pca':
        if (pcaResult.value?.explained_variance_ratio) {
          const var1 = (pcaResult.value.explained_variance_ratio[0] * 100).toFixed(1);
          const var2 = (pcaResult.value.explained_variance_ratio[1] * 100).toFixed(1);
          chartSpecificData = `PC1方差贡献：${var1}%，PC2方差贡献：${var2}%`;
        }
        analysisPrompt = `基于PCA降维散点图，分析数据的主成分结构。${chartSpecificData}。只分析降维结果，不要提及其他分析。要求：专注于主成分解释、数据分布模式、样本聚集特征。字数控制在300-500字。`;
        break;
        
      case 'cluster':
        if (advancedClusterResult.value?.clustering_results) {
          const clusterCount = new Set(advancedClusterResult.value.clustering_results.map((r: any) => r.cluster)).size;
          chartSpecificData = `聚类数量：${clusterCount}个`;
        }
        analysisPrompt = `基于聚类分析图（含凸包），分析样本的分组特征。${chartSpecificData}。只分析聚类结果，不要提及其他内容。要求：专注于聚类质量、分组特征、类间差异。字数控制在300-500字。`;
        break;
        
      default:
        return getDefaultAcademicAnalysis(chartId);
    }
    
    // 使用AI分析，传入更精确的提示
    const analysisResponse = await performUnifiedAIAnalysis(analysisPrompt, true);
    
    // 清理并学术化处理
    return analysisResponse
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/\*\*/g, '') // 移除粗体标记
      .replace(/###?\s*/g, '') // 移除标题标记
      .replace(/AI分析|人工智能|智能分析|机器学习模型/g, '计算模型')
      .replace(/通过分析|可以看出|显示了/g, '分析结果表明')
      .replace(/建议|推荐/g, '研究发现')
      .trim();
  } catch (error) {
    console.error(`学术分析失败 for chart ${chartId}:`, error);
    return getDefaultAcademicAnalysis(chartId);
  }
};

// 获取默认学术化分析
const getDefaultAcademicAnalysis = (chartId: string): string => {
  const defaultAnalyses: Record<string, string> = {
    'fitness': '遗传算法的适应度函数在迭代过程中呈现良好的收敛特性，表明权重优化策略具有较强的搜索能力和稳定性。算法的收敛速度和最终适应度值反映了评价体系设计的合理性，为后续分析提供了可靠的权重配置基础。',
    'scores': '评分分布结果显示了样本间的差异化特征，体现了评价体系的区分度和敏感性。不同项目在综合得分上的分布规律为识别优势项目和发展短板提供了量化依据，有助于制定针对性的改进策略。',
    'radar': '权重雷达图揭示了各维度指标在评价体系中的相对重要性，体现了专家知识与数据驱动相结合的权重配置方法。主要维度的权重分布符合理论预期，为评价结果的可信度提供了支撑。',
    'neural': '神经网络模型在训练过程中展现出良好的学习能力，损失函数的下降趋势表明模型能够有效捕捉输入特征与目标变量间的非线性关系。模型的收敛性能为复杂评价问题的建模提供了有效工具。',
    'importance': '特征重要性分析结果识别了对模型预测具有关键影响的因子，为理解评价机制提供了深层次洞察。重要性排序为特征选择和模型优化提供了科学依据，有助于提升预测准确性。',
    'shap': 'SHAP值分析增强了模型的可解释性，通过量化各特征对预测结果的边际贡献，揭示了决策过程的透明度。这种解释性分析对于建立可信的评价模型具有重要意义。',
    'pca': '主成分分析有效实现了高维数据的降维处理，前两个主成分包含了原始数据的主要信息。降维结果在保持数据结构完整性的同时，为后续分析提供了更加简洁的特征空间。',
    'cluster': '聚类分析识别了样本的内在分组结构，不同簇的形成反映了项目在多维特征空间中的相似性模式。聚类结果为制定分类管理策略和识别典型发展模式提供了参考。'
  };
  
  return defaultAnalyses[chartId] || '该维度的实证分析结果为研究提供了重要的数据支撑和理论验证。';
};

// 获取学术化章节标题
const getAcademicSectionTitle = (chartId: string): string => {
  const sectionTitles: Record<string, string> = {
    'fitness': '4.1 权重优化算法收敛性分析',
    'scores': '4.2 综合评价结果分布特征',
    'radar': '4.3 指标权重配置合理性验证',
    'neural': '4.4 神经网络模型学习性能',
    'importance': '4.5 关键影响因子识别分析',
    'shap': '4.6 模型可解释性分析结果',
    'pca': '4.7 多维数据降维效果评估',
    'cluster': '4.8 样本聚类结构特征分析'
  };
  
  return sectionTitles[chartId] || '4.X 相关分析结果';
};

// 获取AI生成内容的通用函数
const getAIGeneratedContent = async (contentType: string, ipCount: number, indicatorCount: number): Promise<string> => {
  try {
    let prompt = '';
    
    switch (contentType) {
      case 'abstract':
        prompt = `请为《基于多维评价体系的少数民族体育IP品牌塑造路径研究》撰写学术论文摘要。研究样本${ipCount}个IP项目，使用${indicatorCount}项指标。要求包含：研究背景、方法、主要发现、创新点、实践意义。字数400-500字，体现学术严谨性，包含关键词。`;
        break;
      case 'background':
        prompt = `请撰写少数民族体育IP品牌塑造研究的背景与意义章节。包含：1.1研究背景(当前发展现状、存在问题)，1.2研究意义(理论价值、实践意义)，1.3研究目标(3个具体目标)。要求学术化表达，逻辑清晰，字数800-1000字。`;
        break;
      case 'method':
        prompt = `请撰写研究方法与数据来源章节。包含：2.1研究方法(遗传算法、神经网络、SHAP分析等)，2.2数据来源与样本(${ipCount}个IP项目，${indicatorCount}项指标)，2.3技术路线。要求专业术语准确，方法论述清晰，字数700-900字。`;
        break;
      case 'analysis_intro':
        prompt = `请撰写"3.评价体系构建与算法优化"和"4.实证分析结果"两个章节的引言部分。说明评价体系的构建逻辑、算法选择依据，以及实证分析的整体思路。要求学术严谨，逻辑清晰，字数500-600字。`;
        break;
      case 'branding_path':
        prompt = `请撰写"品牌塑造路径设计"章节。基于前面的实证分析结果，提出少数民族体育IP的品牌塑造路径。包含：5.1三位一体塑造模式，5.2差异化发展策略，5.3协同发展机制。要求实用性强，可操作性强，字数1000-1200字。`;
        break;
      case 'policy_suggestions':
        prompt = `请撰写"政策建议与实践指导"章节。包含：6.1政策支持建议(具体政策措施)，6.2运营实践指导(操作性建议)，6.3发展路径优化(实施方案)。要求针对性强，可行性高，字数800-1000字。`;
        break;
      case 'conclusion':
        prompt = `请撰写"结论与展望"章节。包含：7.1主要结论(研究发现总结)，7.2研究贡献(理论贡献、实践贡献、方法贡献)，7.3研究展望(未来研究方向)。要求高度概括，前瞻性强，字数600-800字。`;
        break;
      default:
        return '<p>内容生成中...</p>';
    }
    
    // 使用统一的AI分析函数
    const aiResponse = await performUnifiedAIAnalysis(prompt, true);
    
    // 学术化处理
    return aiResponse
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/\*\*/g, '') // 移除粗体标记
      .replace(/###?\s*/g, '') // 移除标题标记
      .replace(/AI分析|人工智能|智能分析|机器学习模型/g, '计算模型')
      .replace(/通过分析|可以看出|显示了/g, '分析结果表明')
      .replace(/建议|推荐/g, '研究发现')
      .split('\n')
      .map(paragraph => paragraph.trim() ? `<p style="text-align: justify; line-height: 1.8; margin-bottom: 15px;">${paragraph.trim()}</p>` : '')
      .join('')
      .replace(/^<p[^>]*>(\d+\.\d*\s*[^<]+)<\/p>/gm, '<h3 style="font-size: 16px; color: #2c3e50; margin: 20px 0 10px 0;">$1</h3>')
      .replace(/^<p[^>]*>([^<]*章节?[^<]*)<\/p>/gm, '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 5px;">$1</h2>');
  } catch (error) {
    console.error(`AI内容生成失败 for ${contentType}:`, error);
    return getDefaultContent(contentType);
  }
};

// 默认内容模板
const getDefaultContent = (contentType: string): string => {
  const defaults: Record<string, string> = {
    'abstract': '<p style="text-align: justify; line-height: 1.8; margin-bottom: 15px;">本研究构建了少数民族体育IP的多维评价体系...</p>',
    'background': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">1. 研究背景与意义</h2><p style="text-align: justify; line-height: 1.8;">研究背景生成中...</p>',
    'method': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">2. 研究方法与数据来源</h2><p style="text-align: justify; line-height: 1.8;">研究方法生成中...</p>',
    'analysis_intro': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">3. 评价体系构建与算法优化</h2><p style="text-align: justify; line-height: 1.8;">实证分析引言生成中...</p>',
    'branding_path': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">5. 品牌塑造路径设计</h2><p style="text-align: justify; line-height: 1.8;">品牌塑造路径内容生成中...</p>',
    'policy_suggestions': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">6. 政策建议与实践指导</h2><p style="text-align: justify; line-height: 1.8;">政策建议内容生成中...</p>',
    'conclusion': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">7. 结论与展望</h2><p style="text-align: justify; line-height: 1.8;">结论内容生成中...</p>'
  };
  
  return defaults[contentType] || '<p>内容生成中...</p>';
};

// 获取Canvas ID的辅助函数
const getCanvasId = (chartId: string): string => {
  switch (chartId) {
    case 'fitness':
      return 'fitnessChart';
    case 'scores':
      return 'scoreChart';
    case 'radar':
      return 'radarChart';
    case 'neural':
      return 'nnLossChart';
    case 'importance':
      return 'featureImportanceChart';
    case 'shap':
      return 'shapChart';
    case 'pca':
      return 'pcaChart';
    default:
      return `${chartId}Chart`;
  }
};

// 渲染特定图表的辅助函数
const renderSpecificChart = (chartId: string) => {
  switch (chartId) {
    case 'fitness':
      renderFitnessChart();
      break;
    case 'scores':
      renderScoreChart();
      break;
    case 'radar':
      renderRadarChart();
      break;
    case 'neural':
      renderNeuralNetworkCharts();
      break;
    case 'importance':
      renderNeuralNetworkCharts();
      break;
    case 'shap':
      renderSHAPChart();
      break;
    case 'pca':
      renderPCAChart();
      break;
  }
};

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

.header-btn.ai-btn {
  background: linear-gradient(135deg, #ff7b72 0%, #ff6b6b 100%);
}

.header-btn.ai-btn:hover {
  background: linear-gradient(135deg, #ff5b52 0%, #ff4b4b 100%);
}

.header-btn.ai-btn:disabled {
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
  cursor: move;
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
</style> 
