<template>
  <div class="dashboard-container">
    <!-- 页面标题 -->
    <div class="header">
      <div class="header-top">
        <h1>少数民族民俗体育IP分析仪表板</h1>
        <div class="header-actions">
          <router-link to="/ip-management" class="header-btn management-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8"/>
              <path d="M16 17H8"/>
              <path d="M10 9H8"/>
            </svg>
            <span>数据管理</span>
          </router-link>
          <button @click="performComprehensiveAnalysis" class="header-btn analysis-btn" :disabled="selectedIPs.length < 2">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <span>全面分析</span>
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
          <div class="stat-item">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <span class="stat-label">分析次数</span>
              <span class="stat-value">{{ statistics.totalEvaluations }}</span>
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
              <div class="ip-name">{{ ip.name }}</div>
              <div class="ip-group">{{ ip.group }}</div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue';
import { ipApi, pythonMLApi, type IP, type EvaluationResult, type IndicatorStructure } from '../utils/api';
import { toast } from '../utils/toast';
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
  allThird: []
});

// 筛选条件
const filteredThirdIndicators = ref<string[]>([]);
const selectedFirstLevel = ref<string[]>([]);
const selectedSecondLevel = ref<string[]>([]);
const showFilterPanel = ref(false);

// IP数据和选择
const ips = ref<IP[]>([]);
const selectedIPs = ref<string[]>([]);
const selectedGroup = ref('全部');
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
    if (response.data) {
      groups.value = response.data;
    }
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
      const groupSet = new Set(ips.value.map(ip => ip.group));
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
  
  // 获取选中的IP数据
  const selectedIPData = ips.value.filter(ip => selectedIPs.value.indexOf(ip.id) !== -1);
  
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
        addLog(`选中IP列表: ${selectedIPData.map(ip => ip.name).join(', ')}`);
        
        // 步骤1: 基础评估 - 只分析选中的IP
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
            const nnResponse = await pythonMLApi.trainNeuralNetwork(selectedIPData, currentFeatureNames);
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
            const shapResponse = await pythonMLApi.shapExplain(selectedIPData, currentFeatureNames);
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
            const pcaResponse = await pythonMLApi.pcaAnalysis(selectedIPData, 2);
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
            const clusterResponse = await pythonMLApi.advancedClustering(selectedIPData, 2, true);
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
    
    // 创建SHAP特征贡献度蜂群图
    if (shapResult.value.mean_shap_values && shapResult.value.feature_names) {
      const featureNames = shapResult.value.feature_names;
      const meanShapValues = shapResult.value.mean_shap_values;
      
      // 按SHAP值排序，取前10个最重要的特征
      const sortedFeatures = featureNames
        .map((name: string, index: number) => ({
          name,
          value: Math.abs(meanShapValues[index])
        }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 10);
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedFeatures.map((item: any) => item.name),
          datasets: [{
            label: 'SHAP特征贡献度',
            data: sortedFeatures.map((item: any) => item.value),
            backgroundColor: 'rgba(153, 102, 255, 0.8)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'SHAP特征贡献度分析'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'SHAP值(绝对值)'
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

const generateAdvancedClusteringVisualization = async () => {
  if (!advancedClusterResult.value) return;
  
  try {
    const response = await pythonMLApi.generateAdvancedPlot('clustering_with_hull', {
      clustering_results: advancedClusterResult.value.clustering_results,
      convex_hulls: advancedClusterResult.value.convex_hulls
    });
    
    if (response.success) {
      advancedClusterImage.value = response.image;
    } else {
      addLog(`生成聚类图表失败: ${response.error}`);
    }
  } catch (error) {
    console.error('生成高级聚类图表错误:', error);
    addLog('生成聚类图表失败');
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

const selectAllIPs = () => {
  selectedIPs.value = ips.value.map(ip => ip.id);
  addLog(`已选择全部${selectedIPs.value.length}个IP`);
};

const clearSelection = () => {
  selectedIPs.value = [];
  addLog('已清空IP选择');
};

const updateFilteredIPs = () => {
  if (ipGroupFilter.value === '全部') {
    filteredIPs.value = ips.value;
  } else {
    filteredIPs.value = ips.value.filter(ip => ip.group === ipGroupFilter.value);
  }
  addLog(`筛选组别: ${ipGroupFilter.value}, 显示${filteredIPs.value.length}个IP`);
};

const selectAllFilteredIPs = () => {
  selectedIPs.value = filteredIPs.value.map(ip => ip.id);
  addLog(`已选择当前筛选的全部${selectedIPs.value.length}个IP`);
};

const isIPSelected = (ipId: string) => {
  return selectedIPs.value.includes(ipId);
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

.header-btn.management-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-btn.analysis-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
  background: #c1c1c1;
  border-radius: 3px;
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
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
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: white;
  margin-top: 15px;
  font-size: 16px;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  width: 4px;
}

.ip-list-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.ip-list-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
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
</style> 