<template>
  <div class="ip-evaluation-container">
    <!-- 页面标题 -->
    <div class="header">
      <div class="header-top">
        <h1>少数民族民俗体育IP数据浏览系统</h1>
        <div class="header-actions">
          <button @click="toggleFilterPanel" class="header-btn filter-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 12l2-2v-2a7 7 0 1 1 14 0v2l2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/>
              <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"/>
            </svg>
            <span>筛选</span>
          </button>
          <button @click="toggleDataEntry" class="header-btn entry-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8"/>
              <path d="M16 17H8"/>
              <path d="M10 9H8"/>
            </svg>
            <span>数据录入</span>
          </button>
        </div>
      </div>
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
          <div class="quick-stats">
            <span class="update-time">更新于 {{ new Date().toLocaleTimeString() }}</span>
        </div>
      </div>
    </div>

      <!-- 筛选面板 -->
      <div class="filter-section" v-show="showFilterPanel">
          <h3>筛选条件</h3>
          
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
        </div>

      <!-- 数据录入面板 -->
      <div class="input-section" v-show="showDataEntryPanel">
          <h3>数据输入（三级指标）</h3>
          <div class="indicator-inputs">
            <div v-for="indicator in filteredThirdIndicators" :key="indicator" class="input-group">
              <label>{{ indicator }}</label>
              <input 
                type="number" 
                v-model.number="indicatorValues[indicator]"
                step="0.1"
                min="0"
                max="100"
                placeholder="请输入评分"
              />
            </div>
          </div>
        </div>
        </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧控制面板 -->
      <div class="control-panel">
        <!-- IP列表 -->
        <div class="ip-list-section">
          <h3>IP列表</h3>
          <div class="group-filter">
            <label>筛选组别:</label>
            <select v-model="selectedGroup" @change="loadIPs">
              <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
            </select>
          </div>
          <div class="ip-list">
            <div 
              v-for="ip in ips" 
              :key="ip.id" 
              class="ip-item"
              :class="{ active: selectedIP?.id === ip.id }"
              @click="selectIP(ip)"
            >
              <div class="ip-name">{{ ip.name }}</div>
              <div class="ip-group">{{ ip.group }}</div>
              <div class="ip-score" v-if="ip.score !== undefined">评分: {{ ip.score.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button @click="addIP" class="btn btn-primary">添加IP</button>
          <button @click="updateSelectedIP" class="btn btn-secondary" :disabled="!selectedIP">修改IP</button>
          <button @click="deleteSelectedIP" class="btn btn-danger" :disabled="!selectedIP">删除IP</button>
          <button @click="performComprehensiveAnalysis" class="btn btn-success" :disabled="ips.length < 2">全面分析</button>
          <button @click="generateTestData" class="btn btn-warning">生成测试数据</button>
          <button @click="viewHistory" class="btn btn-secondary">查看历史</button>
          <button @click="exportData" class="btn btn-light">导出数据</button>
        </div>
      </div>

      <!-- 右侧展示区域 -->
      <div class="display-panel">
        <!-- 图表区域 -->
        <div class="charts-container">
          <!-- 适应度变化曲线 -->
          <div class="chart-panel">
            <h3>适应度变化曲线</h3>
            <div class="chart">
              <canvas id="fitnessChart" ref="fitnessChart" v-if="evaluationResult && evaluationResult.fitnessHistory.length > 0"></canvas>
              <div v-else class="chart-placeholder">
                点击"全面分析"按钮后显示遗传算法适应度变化曲线
              </div>
            </div>
          </div>

          <!-- IP评分分布 -->
          <div class="chart-panel">
            <h3>IP评分分布</h3>
            <div class="chart">
              <canvas id="scoreChart" ref="scoreChart" v-if="evaluationResult && evaluationResult.evaluation.length > 0"></canvas>
              <div v-else class="chart-placeholder">
                点击"全面分析"按钮后显示IP评分分布图表
              </div>
            </div>
          </div>

          <!-- 雷达图 -->
          <div class="chart-panel">
            <h3>重要指标影响</h3>
            <div class="chart">
              <canvas id="radarChart" ref="radarChart" v-if="evaluationResult && evaluationResult.weights.length > 0"></canvas>
              <div v-else class="chart-placeholder">
                点击"全面分析"按钮后显示重要指标权重雷达图
              </div>
            </div>
          </div>

          <!-- 神经网络训练损失曲线 -->
          <div class="chart-panel">
            <h3>神经网络训练损失</h3>
            <div class="chart">
              <canvas id="nnLossChart" ref="nnLossChart" v-if="neuralNetworkResult"></canvas>
              <div v-else class="chart-placeholder">
                <span v-if="ips.length < 5">
                  🚫 IP数量不足（当前{{ips.length}}个，需要≥5个）<br>
                  无法进行神经网络训练分析
                </span>
                <span v-else>
                  点击"全面分析"按钮后显示神经网络训练损失曲线
                </span>
              </div>
            </div>
          </div>

          <!-- 特征重要性图表 -->
          <div class="chart-panel">
            <h3>特征重要性分析</h3>
            <div class="chart">
              <canvas id="featureImportanceChart" ref="featureImportanceChart" v-if="neuralNetworkResult"></canvas>
              <div v-else class="chart-placeholder">
                <span v-if="ips.length < 5">
                  🚫 IP数量不足（当前{{ips.length}}个，需要≥5个）<br>
                  无法进行特征重要性分析
                </span>
                <span v-else>
                  点击"全面分析"按钮后显示特征重要性分析
                </span>
              </div>
            </div>
          </div>

          <!-- SHAP值可视化 -->
          <div class="chart-panel">
            <h3>SHAP特征贡献度蜂群图</h3>
            <div class="chart">
              <canvas id="shapChart" ref="shapChart" v-if="shapResult"></canvas>
              <div v-else class="chart-placeholder">
                <span v-if="ips.length < 3">
                  🚫 IP数量不足（当前{{ips.length}}个，需要≥3个）<br>
                  无法进行SHAP特征贡献度分析
                </span>
                <span v-else>
                  点击"全面分析"按钮后显示SHAP特征贡献度蜂群图
                </span>
              </div>
            </div>
          </div>

          <!-- PCA降维散点图 -->
          <div class="chart-panel">
            <h3>PCA降维可视化</h3>
            <div class="chart">
              <canvas id="pcaChart" ref="pcaChart" v-if="pcaResult"></canvas>
              <div v-else class="chart-placeholder">
                <span v-if="ips.length < 2">
                  🚫 IP数量不足（当前{{ips.length}}个，需要≥2个）<br>
                  无法进行PCA降维分析
                </span>
                <span v-else>
                  点击"全面分析"按钮后显示PCA降维可视化图表
                </span>
              </div>
            </div>
          </div>

          <!-- 高级聚类带凸包图表 -->
          <div class="chart-panel">
            <h3>高级聚类分析（含凸包）</h3>
            <div class="chart">
              <div v-if="advancedClusterImage" class="ml-chart-image">
                <img :src="advancedClusterImage" alt="高级聚类分析图" />
              </div>
              <div v-else class="chart-placeholder">
                点击"全面分析"按钮后显示带凸包的聚类分析图表
              </div>
            </div>
          </div>
        </div>

        <!-- 计算日志 -->
        <div class="log-panel">
          <h3>计算过程日志</h3>
          <div class="log-content" ref="logContent">
            <div v-for="(log, index) in logs" :key="index" class="log-entry">
              {{ log }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模态框 -->
    <!-- 添加/编辑IP模态框 -->
    <div v-if="showIPDialog" class="modal" @click="closeDialogs">
      <div class="modal-content" @click.stop>
        <h3>{{ editMode ? '编辑IP' : '添加IP' }}</h3>
        <div class="form-group">
          <label>IP名称:</label>
          <input v-model="ipForm.name" type="text" placeholder="请输入IP名称" />
        </div>
        <div class="form-group">
          <label>组别:</label>
          <input v-model="ipForm.group" type="text" placeholder="请输入组别" />
        </div>
        <div class="modal-actions">
          <button @click="saveIP" class="btn btn-primary">保存</button>
          <button @click="closeDialogs" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <!-- 历史记录模态框 -->
    <div v-if="showHistoryDialog" class="modal" @click="closeDialogs">
      <div class="modal-content large" @click.stop>
        <h3>分析历史记录</h3>
        <div class="history-list">
          <div 
            v-for="record in historyRecords" 
            :key="record.id"
            class="history-item"
            @click="loadHistoryRecord(record)"
          >
            <div class="history-time">{{ formatDate(record.timestamp) }}</div>
            <div class="history-info">IP数量: {{ record.ipsCount }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeDialogs" class="btn btn-secondary">关闭</button>
        </div>
      </div>
    </div>

    <!-- 聚类设置模态框 -->
    <div v-if="showClusterDialog" class="modal" @click="closeDialogs">
      <div class="modal-content" @click.stop>
        <h3>聚类分析设置</h3>
        <div class="form-group">
          <label>聚类数量:</label>
          <input v-model.number="clusterCount" type="number" min="2" :max="ips.length" />
        </div>
        <div class="modal-actions">
          <button @click="runClustering" class="btn btn-primary">开始聚类</button>
          <button @click="closeDialogs" class="btn btn-secondary">取消</button>
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
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ipApi, pythonMLApi, type IP, type EvaluationResult, type ClusteringResult, type IndicatorStructure } from '../utils/api';
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

// IP评估相关接口扩展
interface IPWithScore extends IP {
  score?: number;
}

// 响应式数据
const loading = ref(false);
const loadingText = ref('加载中...');

// 指标结构
const indicatorStructure = ref<IndicatorStructure>({
  firstLevel: [],
  secondLevel: [],
  firstToSecond: {},
  secondToThird: {},
  allThird: []
});

// 筛选条件
const selectedFirstLevel = ref<string[]>([]);
const selectedSecondLevel = ref<string[]>([]);
const filteredThirdIndicators = ref<string[]>([]);

// 指标值输入
const indicatorValues = ref<Record<string, number>>({});

// IP数据
const ips = ref<IPWithScore[]>([]);
const selectedIP = ref<IPWithScore | null>(null);
const selectedGroup = ref('全部');
const groups = ref<string[]>(['全部']);

// 评估结果
const evaluationResult = ref<EvaluationResult | null>(null);
const clusteringResult = ref<ClusteringResult | null>(null);

// Python ML API结果
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

// 对话框状态
const showIPDialog = ref(false);
const showHistoryDialog = ref(false);
const showClusterDialog = ref(false);
const editMode = ref(false);

// UI控制状态
const showFilterPanel = ref(true);
const showDataEntryPanel = ref(true);

// 表单数据
const ipForm = reactive({
  name: '',
  group: ''
});

// 历史记录
const historyRecords = ref<any[]>([]);
const clusterCount = ref(2);

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
      initializeIndicatorValues();
    }
  } catch (error) {
    console.error('加载指标结构失败:', error);
  }
};

const updateFilteredIndicators = async () => {
  try {
    const response = await ipApi.getFilteredIndicators(
      selectedFirstLevel.value,
      selectedSecondLevel.value
    );
    if (response.data) {
      filteredThirdIndicators.value = response.data;
      initializeIndicatorValues();
    }
  } catch (error) {
    console.error('更新筛选指标失败:', error);
  }
};

const initializeIndicatorValues = () => {
  indicatorValues.value = {};
  filteredThirdIndicators.value.forEach(indicator => {
    indicatorValues.value[indicator] = 0;
  });
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
    const group = selectedGroup.value === '全部' ? undefined : selectedGroup.value;
    const response = await ipApi.getAllIPs(group);
    if (response.data) {
      ips.value = response.data;
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

const addIP = () => {
  if (!validateIndicatorValues()) {
    alert('请填写所有三级指标');
    return;
  }
  
  ipForm.name = '';
  ipForm.group = '';
  editMode.value = false;
  showIPDialog.value = true;
};

const updateSelectedIP = () => {
  if (!selectedIP.value) return;
  
  if (!validateIndicatorValues()) {
    alert('请填写所有三级指标');
    return;
  }
  
  ipForm.name = selectedIP.value.name;
  ipForm.group = selectedIP.value.group;
  editMode.value = true;
  showIPDialog.value = true;
};

const deleteSelectedIP = async () => {
  if (!selectedIP.value) return;
  
  if (!confirm(`确定要删除IP "${selectedIP.value.name}" 吗？`)) return;
  
  try {
    loading.value = true;
    await ipApi.deleteIP(selectedIP.value.id);
    addLog(`已删除IP: ${selectedIP.value.name}`);
    selectedIP.value = null;
    await loadIPs();
    await loadStatistics();
  } catch (error) {
    console.error('删除IP失败:', error);
    alert('删除IP失败');
  } finally {
    loading.value = false;
  }
};

const saveIP = async () => {
  if (!ipForm.name.trim() || !ipForm.group.trim()) {
    alert('请填写IP名称和组别');
    return;
  }
  
  if (!validateIndicatorValues()) {
    alert('请填写所有三级指标');
    return;
  }
  
  try {
    loading.value = true;
    loadingText.value = editMode.value ? '更新IP中...' : '添加IP中...';
    
    const indicators = filteredThirdIndicators.value.map(indicator => 
      indicatorValues.value[indicator] || 0
    );
    
    const ipData = {
      name: ipForm.name.trim(),
      group: ipForm.group.trim(),
      indicators
    };
    
    if (editMode.value && selectedIP.value) {
      await ipApi.updateIP(selectedIP.value.id, ipData);
      addLog(`已更新IP: ${ipData.name}`);
    } else {
      await ipApi.addIP(ipData);
      addLog(`已添加IP: ${ipData.name}`);
    }
    
    showIPDialog.value = false;
    await loadIPs();
    await loadGroups();
    await loadStatistics();
  } catch (error) {
    console.error('保存IP失败:', error);
    alert(error instanceof Error ? error.message : '保存IP失败');
  } finally {
    loading.value = false;
  }
};

const selectIP = (ip: IP) => {
  selectedIP.value = ip;
  
  // 更新指标值
  filteredThirdIndicators.value.forEach((indicator, index) => {
    indicatorValues.value[indicator] = ip.indicators[index] || 0;
  });
};

const performComprehensiveAnalysis = async () => {
  if (ips.value.length < 2) {
    alert('至少需要2个IP进行全面分析');
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
    // 使用toast的withAnalysis方法，确保加载动画随机显示10-20秒
    await toast.withAnalysis(
      async () => {
        loading.value = true;
        loadingText.value = '全面分析中...';
        
        // 清空所有之前的ML分析结果，避免显示旧数据造成误解
        evaluationResult.value = null;
        neuralNetworkResult.value = null;
        shapResult.value = null;
        pcaResult.value = null;
        advancedClusterResult.value = null;
        advancedClusterImage.value = '';
        
        // 添加调试日志
        addLog('=== 开始全面分析 ===');
        addLog(`当前IP数量: ${ips.value.length}`);
        addLog(`选择的组别: ${selectedGroup.value}`);
        addLog(`筛选的指标数量: ${filteredThirdIndicators.value.length}`);
        addLog(`筛选的指标: ${filteredThirdIndicators.value.join(', ')}`);
        
        // 步骤1: 基础评估
        addLog('🔄 进行基础IP评估...');
        const response = await ipApi.evaluate(selectedGroup.value, filteredThirdIndicators.value);
        if (response.data) {
          tempEvaluationResult = response.data;
          
          addLog('✅ 基础评估完成');
          addLog(`使用的指标数量: ${response.data.selectedIndicators ? response.data.selectedIndicators.length : '全部32个'}`);
          addLog(`AHP权重: ${response.data.weights.map(w => w.toFixed(3)).join(', ')}`);
          addLog('IP分析结果:');
          response.data.evaluation.forEach(result => {
            addLog(`${result.rank}. ${result.name}: ${result.score.toFixed(2)} (±${result.error.toFixed(2)})`);
          });
          
          // 注意：这里不立即更新IP列表中的评分，不调用renderCharts()
        }

        // 步骤2: 神经网络训练
        if (ips.value.length >= 5) {
          addLog('🔄 开始神经网络训练...');
          loadingText.value = '神经网络训练中...';
          try {
            // 获取当前使用的指标名称
            const currentFeatureNames = filteredThirdIndicators.value.length > 0 
              ? filteredThirdIndicators.value 
              : indicatorStructure.value.allThird;
            const nnResponse = await pythonMLApi.trainNeuralNetwork(ips.value, currentFeatureNames);
            if (nnResponse.success && nnResponse.data) {
              tempNeuralNetworkResult = nnResponse.data;
              addLog('✅ 神经网络训练完成');
            } else {
              addLog(`⚠️ 神经网络训练失败: ${nnResponse.error || '未知错误'}`);
            }
          } catch (error) {
            addLog(`⚠️ 神经网络训练失败: ${error}`);
          }
        } else {
          addLog('⚠️ IP数量不足5个，跳过神经网络训练');
        }

        // 步骤3: SHAP模型解释
        if (ips.value.length >= 3) {
          addLog('🔄 开始SHAP模型解释...');
          loadingText.value = 'SHAP分析中...';
          try {
            // 获取当前使用的指标名称
            const currentFeatureNames = filteredThirdIndicators.value.length > 0 
              ? filteredThirdIndicators.value 
              : indicatorStructure.value.allThird;
            const response = await pythonMLApi.shapExplain(ips.value, currentFeatureNames);
            if (response.success && response.data) {
              // 保存结果
              tempShapResult = response.data;
              addLog('✅ SHAP模型解释完成');
            } else {
              addLog(`⚠️ SHAP分析失败: ${response.error || '未知错误'}`);
            }
          } catch (error) {
            addLog(`⚠️ SHAP分析失败: ${error}`);
          }
        } else {
          addLog('⚠️ IP数量不足3个，跳过SHAP分析');
        }

        // 步骤4: PCA降维分析
        if (ips.value.length >= 2) {
          addLog('🔄 开始PCA降维分析...');
          loadingText.value = 'PCA分析中...';
          try {
            const pcaResponse = await pythonMLApi.pcaAnalysis(ips.value, 2);
            if (pcaResponse.success) {
              // 保存结果
              tempPcaResult = pcaResponse;
              
              addLog('=== PCA降维分析完成 ===');
              addLog(`降维维度: ${pcaResponse.n_components}`);
              addLog(`总方差解释比例: ${(pcaResponse.total_variance_explained * 100).toFixed(2)}%`);
              addLog('各主成分方差解释比例:');
              pcaResponse.explained_variance_ratio.forEach((ratio: number, index: number) => {
                addLog(`主成分${index + 1}: ${(ratio * 100).toFixed(2)}%`);
              });
              
              addLog('PCA降维结果:');
              pcaResponse.pca_results.forEach((result: any) => {
                addLog(`${result.name}: [${result.coordinates.map((c: number) => c.toFixed(3)).join(', ')}]`);
              });
              
              // 注意：这里不立即渲染PCA图表
            } else {
              addLog(`⚠️ PCA分析失败: ${pcaResponse.error}`);
            }
          } catch (error) {
            addLog(`⚠️ PCA分析失败: ${error}`);
          }
        } else {
          addLog('⚠️ IP数量不足2个，跳过PCA分析');
        }

        // 步骤5: 高级聚类分析
        if (ips.value.length >= 2) {
          addLog('🔄 开始高级聚类分析...');
          loadingText.value = '聚类分析中...';
          try {
            const clusterResponse = await pythonMLApi.advancedClustering(ips.value, 2, true);
            if (clusterResponse.success && clusterResponse.data) {
              tempAdvancedClusterResult = clusterResponse.data;
              
              addLog('=== 高级聚类分析完成 ===');
              addLog(`聚类数量: 2`);
              addLog(`轮廓系数: ${clusterResponse.data.quality_metrics?.silhouette_score?.toFixed(4) || 'N/A (样本数不足)'}`);
              addLog(`Calinski-Harabasz指数: ${clusterResponse.data.quality_metrics?.calinski_harabasz_score?.toFixed(4) || 'N/A (样本数不足)'}`);
              
              if (clusterResponse.data.pca_info?.used && clusterResponse.data.pca_info?.variance_explained) {
                addLog(`PCA方差解释: ${clusterResponse.data.pca_info.variance_explained.map((v: number) => (v * 100).toFixed(1) + '%').join(', ')}`);
              }
              
              addLog('聚类结果:');
              clusterResponse.data.clustering_results?.forEach((result: any) => {
                addLog(`${result.name}: 簇${result.cluster + 1} (距离质心: ${result.distance_to_centroid.toFixed(3)})`);
              });
              
              addLog('凸包信息:');
              clusterResponse.data.convex_hulls?.forEach((hull: any) => {
                addLog(`簇${hull.cluster_id + 1}: 面积 ${hull.area.toFixed(3)}`);
              });
              
              // 生成可视化图像，但不立即显示
              try {
                const imageResponse = await pythonMLApi.generateAdvancedPlot('clustering_with_hull', {
                  clustering_results: clusterResponse.data.clustering_results,
                  convex_hulls: clusterResponse.data.convex_hulls
                });
                if (imageResponse.success) {
                  tempAdvancedClusterImage = imageResponse.image;
                }
              } catch (error) {
                addLog('生成聚类图表失败');
              }
            } else {
              addLog(`⚠️ 聚类分析失败: ${clusterResponse.error || '未知错误'}`);
            }
          } catch (error) {
            addLog(`⚠️ 聚类分析失败: ${error}`);
          }
        } else {
          addLog('⚠️ IP数量不足2个，跳过高级聚类分析');
        }

        addLog('=== 🎉 全面分析完成 ===');
        addLog('💡 分析结果将在加载完成后显示...');
        
        // 更新统计信息
        await loadStatistics();
      },
      {
        successMessage: `✅ 分析完成！已处理 ${ips.value.length} 个IP`,
        errorMessage: '分析失败，请检查数据后重试'
      }
    );
    
    // 只有在withAnalysis完成后（即加载动画结束后），才设置结果数据并渲染图表
    addLog('🎨 开始显示分析结果...');
    
    // 设置分析结果到响应式变量
    if (tempEvaluationResult) {
      evaluationResult.value = tempEvaluationResult;
      
      // 更新IP列表中的评分
      ips.value.forEach((ip) => {
        const result = tempEvaluationResult?.evaluation.find((r: any) => r.name === ip.name);
        if (result) {
          (ip as any).score = result.score;
        }
      });
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
    generateAdvancedClusteringVisualization();
    
    addLog('✅ 所有结果已显示完成');
    
  } catch (error) {
    console.error('全面分析失败:', error);
    addLog(`❌ 分析失败: ${error}`);
    alert(`分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  } finally {
    loading.value = false;
    loadingText.value = '';
  }
};

const performClustering = () => {
  if (ips.value.length < 2) {
    alert('至少需要2个IP进行聚类分析');
    return;
  }
  
  clusterCount.value = Math.min(2, ips.value.length);
  showClusterDialog.value = true;
};

const runClustering = async () => {
  try {
    loading.value = true;
    loadingText.value = '聚类分析中...';
    
    const response = await ipApi.clustering(selectedGroup.value, clusterCount.value);
    if (response.data) {
      clusteringResult.value = response.data;
      
      addLog('=== 聚类分析完成 ===');
      addLog(`聚类数量: ${clusterCount.value}`);
      response.data.ipsWithClusters.forEach(ip => {
        addLog(`${ip.name}: 簇 ${ip.cluster + 1}`);
      });
      
      showClusterDialog.value = false;
      renderCharts();
    }
  } catch (error) {
    console.error('聚类分析失败:', error);
    alert('聚类分析失败');
  } finally {
    loading.value = false;
  }
};

const generateTestData = async () => {
  if (!confirm('确定要生成测试数据吗？这将添加10个测试IP，并自动进行全面分析。')) return;
  
  try {
    loading.value = true;
    loadingText.value = '生成测试数据中...';
    
    const response = await ipApi.generateTestData(10);
    if (response.data) {
      addLog(`成功生成${response.data.addedIPs.length}个测试IP`);
      
      await loadIPs();
      await loadGroups();
      await loadStatistics();
      
      // 自动进行全面分析
      addLog('🚀 自动开始全面分析...');
      await performComprehensiveAnalysis();
    }
  } catch (error) {
    console.error('生成测试数据失败:', error);
    alert('生成测试数据失败');
  } finally {
    loading.value = false;
  }
};

const viewHistory = async () => {
  try {
    const response = await ipApi.getHistory();
    if (response.data) {
      historyRecords.value = response.data;
      showHistoryDialog.value = true;
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
  }
};

const loadHistoryRecord = async (record: any) => {
  try {
    const response = await ipApi.getHistoryById(record.id);
    evaluationResult.value = response.data;
    
    addLog('=== 加载历史记录 ===');
    addLog(`时间: ${formatDate(record.timestamp)}`);
    addLog(`IP数量: ${record.ipsCount}`);
    
    showHistoryDialog.value = false;
    renderCharts();
  } catch (error) {
    console.error('加载历史记录失败:', error);
  }
};

const exportData = async () => {
  try {
    const response = await ipApi.exportData();
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip-evaluation-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('数据导出成功');
  } catch (error) {
    console.error('导出数据失败:', error);
    alert('导出数据失败');
  }
};

const validateIndicatorValues = () => {
  return filteredThirdIndicators.value.every(indicator => 
    indicatorValues.value[indicator] !== undefined && 
    indicatorValues.value[indicator] !== null &&
    !isNaN(indicatorValues.value[indicator])
  );
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

const renderCharts = () => {
  nextTick(() => {
    addLog('🎨 开始渲染图表...');
    
    // 1. 适应度变化曲线
    if (evaluationResult.value && evaluationResult.value.fitnessHistory.length > 0) {
      addLog('📈 渲染适应度变化曲线');
      renderFitnessChart();
    } else {
      addLog('⚠️ 跳过适应度曲线：无数据');
    }
    
    // 2. IP评分分布
    if (evaluationResult.value && evaluationResult.value.evaluation.length > 0) {
      addLog('📊 渲染IP评分分布图');
      renderScoreChart();
    } else {
      addLog('⚠️ 跳过评分分布图：无数据');
    }
    
    // 3. 重要指标影响雷达图
    if (evaluationResult.value && evaluationResult.value.weights.length > 0) {
      addLog('🎯 渲染重要指标雷达图');
      renderRadarChart();
    } else {
      addLog('⚠️ 跳过雷达图：无权重数据');
    }
    
    // 4. 聚类分析图
  if (clusteringResult.value) {
      addLog('🔗 渲染聚类分析图');
      renderClusterChart();
    } else {
      addLog('⚠️ 跳过聚类图：无聚类数据');
    }
    
    addLog('✅ 图表渲染完成');
  });
};

// 渲染适应度变化曲线
const renderFitnessChart = () => {
  const canvas = document.querySelector('#fitnessChart') as HTMLCanvasElement;
  if (!canvas || !evaluationResult.value) return;
  
  // 销毁现有图表
  Chart.getChart(canvas)?.destroy();
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const fitnessHistory = evaluationResult.value.fitnessHistory;
  const iterations = fitnessHistory.length;
  const ipCount = fitnessHistory[0]?.length || 0;
  
  // 计算每次迭代的平均适应度
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
          title: {
            display: true,
            text: '适应度值'
          }
        },
        x: {
          title: {
            display: true,
            text: '迭代次数'
          }
        }
      }
    }
  });
};

// 渲染IP评分分布柱状图
const renderScoreChart = () => {
  const canvas = document.querySelector('#scoreChart') as HTMLCanvasElement;
  if (!canvas || !evaluationResult.value) return;
  
  // 销毁现有图表
  Chart.getChart(canvas)?.destroy();
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const evaluation = evaluationResult.value.evaluation;
  const labels = evaluation.map(item => item.name);
  const scores = evaluation.map(item => item.score);
  const errors = evaluation.map(item => item.error);
  
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
      }, {
        label: '误差范围',
        data: errors,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'IP综合评分排名'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '评分'
          }
        },
        x: {
          title: {
            display: true,
            text: 'IP名称'
          }
        }
      }
    }
  });
};

// 渲染雷达图
const renderRadarChart = () => {
  const canvas = document.querySelector('#radarChart') as HTMLCanvasElement;
  if (!canvas || !evaluationResult.value) return;
  
  // 销毁现有图表
  Chart.getChart(canvas)?.destroy();
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const weights = evaluationResult.value.weights;
  const indicators = filteredThirdIndicators.value;
  
  // 选择权重最高的前8个指标用于雷达图显示
  const indexedWeights = weights.map((weight, index) => ({ weight, index }));
  indexedWeights.sort((a, b) => b.weight - a.weight);
  const topIndicators = indexedWeights.slice(0, 8);
  
  const radarLabels = topIndicators.map(item => indicators[item.index] || `指标${item.index + 1}`);
  const radarWeights = topIndicators.map(item => item.weight * 100); // 转换为百分比
  
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
        title: {
          display: true,
          text: '关键指标权重分布'
        }
      },
      scales: {
        r: {
          angleLines: {
            display: false
          },
          suggestedMin: 0,
          suggestedMax: Math.max(...radarWeights) * 1.2
        }
      }
    }
  });
};

// 渲染聚类分析散点图
const renderClusterChart = () => {
  const canvas = document.querySelector('#clusterChart') as HTMLCanvasElement;
  if (!canvas || !clusteringResult.value) return;
  
  // 销毁现有图表
  Chart.getChart(canvas)?.destroy();
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const ipsWithClusters = clusteringResult.value.ipsWithClusters;
  const clusters = [...new Set(ipsWithClusters.map(ip => ip.cluster))];
  const colors = ['rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 205, 86, 0.8)', 'rgba(75, 192, 192, 0.8)'];
  
  const datasets = clusters.map(cluster => {
    const clusterIPs = ipsWithClusters.filter(ip => ip.cluster === cluster);
    return {
      label: `簇 ${cluster + 1}`,
      data: clusterIPs.map((ip, index) => ({
        x: ip.indicators[0] || 0, // 使用第一个指标作为X轴
        y: ip.indicators[1] || 0, // 使用第二个指标作为Y轴
        label: ip.name
      })),
      backgroundColor: colors[cluster % colors.length],
      borderColor: colors[cluster % colors.length].replace('0.8', '1'),
    };
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
          text: '聚类分析结果'
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return `${context.dataset.label}: ${context.parsed.label || 'IP'} (${context.parsed.x.toFixed(1)}, ${context.parsed.y.toFixed(1)})`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: '第一维度'
          }
        },
        y: {
          title: {
            display: true,
            text: '第二维度'
          }
        }
      }
    }
  });
};

const closeDialogs = () => {
  showIPDialog.value = false;
  showHistoryDialog.value = false;
  showClusterDialog.value = false;
};

// UI控制函数
const toggleFilterPanel = () => {
  showFilterPanel.value = !showFilterPanel.value;
  addLog(`筛选面板已${showFilterPanel.value ? '显示' : '隐藏'}`);
};

const toggleDataEntry = () => {
  showDataEntryPanel.value = !showDataEntryPanel.value;
  addLog(`数据录入面板已${showDataEntryPanel.value ? '显示' : '隐藏'}`);
};

// 高级AI功能函数
const trainNeuralNetwork = async () => {
  if (ips.value.length < 5) {
    alert('至少需要5个IP进行神经网络训练');
    return;
  }
  
  try {
    loading.value = true;
    loadingText.value = '神经网络训练中...';
    
    // 获取当前使用的指标名称
    const currentFeatureNames = filteredThirdIndicators.value.length > 0 
      ? filteredThirdIndicators.value 
      : indicatorStructure.value.allThird;
    const response = await pythonMLApi.trainNeuralNetwork(ips.value, currentFeatureNames);
    if (response.success && response.data) {
      // 保存结果
      neuralNetworkResult.value = response.data;
      
      addLog('=== 神经网络训练完成 ===');
      addLog(`训练轮次: ${response.data.model_info?.epochs || 'N/A'}`);
      addLog(`最终损失: ${response.data.model_info?.final_loss?.toFixed(4) || 'N/A'}`);
      addLog('预测结果:');
      response.data.predictions?.forEach((pred: any) => {
        addLog(`${pred.name}: 预测评分 ${pred.predicted_score.toFixed(2)} (置信度: ${pred.confidence.toFixed(2)})`);
      });
      
      // 显示特征重要性
      addLog('特征重要性:');
      response.data.feature_importance?.forEach((importance: number, index: number) => {
        addLog(`指标${index + 1}: ${importance.toFixed(3)}`);
      });
      
      // 渲染神经网络相关图表
      nextTick(() => {
        renderNeuralNetworkCharts();
      });
    } else {
      alert(`神经网络训练失败: ${response.error}`);
    }
  } catch (error) {
    console.error('神经网络训练错误:', error);
    alert('神经网络训练失败');
  } finally {
    loading.value = false;
  }
};

const performSHAPAnalysis = async () => {
  if (ips.value.length < 2) {
    alert('至少需要2个IP进行SHAP解释');
    return;
  }
  
  try {
    loading.value = true;
    loadingText.value = 'SHAP模型解释中...';
    
    // 获取当前使用的指标名称
    const currentFeatureNames = filteredThirdIndicators.value.length > 0 
      ? filteredThirdIndicators.value 
      : indicatorStructure.value.allThird;
    const response = await pythonMLApi.shapExplain(ips.value, currentFeatureNames);
    if (response.success && response.data) {
      // 保存结果
      shapResult.value = response.data;
      
      addLog('=== SHAP模型解释完成 ===');
      addLog('各特征的平均SHAP值:');
      response.data.mean_shap_values?.forEach((value: number, index: number) => {
        addLog(`${response.data.feature_names?.[index] || `特征${index + 1}`}: ${value.toFixed(4)}`);
      });
      
      addLog('各IP的SHAP解释:');
      response.data.ip_explanations?.forEach((explanation: any) => {
        addLog(`${explanation.name}: 预测值 ${explanation.predicted_value.toFixed(2)}`);
      });
      
      // 渲染SHAP图表
      nextTick(() => {
        renderSHAPChart();
      });
    } else {
      alert(`SHAP解释失败: ${response.error}`);
    }
  } catch (error) {
    console.error('SHAP解释错误:', error);
    alert('SHAP解释失败');
  } finally {
    loading.value = false;
  }
};

const performPCAAnalysis = async () => {
  if (ips.value.length < 2) {
    alert('至少需要2个IP进行PCA分析');
    return;
  }
  
  try {
    loading.value = true;
    loadingText.value = 'PCA降维分析中...';
    
    const response = await pythonMLApi.pcaAnalysis(ips.value, 2);
    if (response.success) {
      // 保存结果
      pcaResult.value = response;
      
      addLog('=== PCA降维分析完成 ===');
      addLog(`降维维度: ${response.n_components}`);
      addLog(`总方差解释比例: ${(response.total_variance_explained * 100).toFixed(2)}%`);
      addLog('各主成分方差解释比例:');
      response.explained_variance_ratio.forEach((ratio: number, index: number) => {
        addLog(`主成分${index + 1}: ${(ratio * 100).toFixed(2)}%`);
      });
      
      addLog('PCA降维结果:');
      response.pca_results.forEach((result: any) => {
        addLog(`${result.name}: [${result.coordinates.map((c: number) => c.toFixed(3)).join(', ')}]`);
      });
      
      // 渲染PCA图表
      nextTick(() => {
        renderPCAChart();
      });
    } else {
      alert(`PCA分析失败: ${response.error}`);
    }
  } catch (error) {
    console.error('PCA分析错误:', error);
    alert('PCA分析失败');
  } finally {
    loading.value = false;
  }
};

const advancedClusteringAnalysis = async () => {
  if (ips.value.length < 2) {
    alert('至少需要2个IP进行高级聚类分析');
    return;
  }
  
  const nClusters = prompt('请输入聚类数量:', '2');
  if (!nClusters || isNaN(Number(nClusters))) return;
  
  try {
    loading.value = true;
    loadingText.value = '高级聚类分析中...';
    
    const response = await pythonMLApi.advancedClustering(ips.value, Number(nClusters), true);
    if (response.success && response.data) {
      // 保存结果
      advancedClusterResult.value = response.data;
      
      addLog('=== 高级聚类分析完成 ===');
      addLog(`聚类数量: ${nClusters}`);
      addLog(`轮廓系数: ${response.data.quality_metrics?.silhouette_score?.toFixed(4) || 'N/A'}`);
      addLog(`Calinski-Harabasz指数: ${response.data.quality_metrics?.calinski_harabasz_score?.toFixed(4) || 'N/A'}`);
      
      if (response.data.pca_info?.used && response.data.pca_info?.variance_explained) {
        addLog(`PCA方差解释: ${response.data.pca_info.variance_explained.map((v: number) => (v * 100).toFixed(1) + '%').join(', ')}`);
      }
      
      addLog('聚类结果:');
      response.data.clustering_results?.forEach((result: any) => {
        addLog(`${result.name}: 簇${result.cluster + 1} (距离质心: ${result.distance_to_centroid.toFixed(3)})`);
      });
      
      addLog('凸包信息:');
      response.data.convex_hulls?.forEach((hull: any) => {
        addLog(`簇${hull.cluster_id + 1}: 面积 ${hull.area.toFixed(3)}`);
      });
      
      // 生成高级聚类可视化图表
      await generateAdvancedClusteringVisualization();
    } else {
      alert(`高级聚类分析失败: ${response.error}`);
    }
  } catch (error) {
    console.error('高级聚类分析错误:', error);
    alert('高级聚类分析失败');
  } finally {
    loading.value = false;
  }
};

const loadDailySportsNews = async () => {
  try {
    loading.value = true;
    loadingText.value = '加载体育动态中...';
    
    const response = await pythonMLApi.getDailySportsNews();
    if (response.success && response.data) {
      addLog('=== 今日新疆体育动态 ===');
      response.data.news?.forEach((news: any) => {
        addLog(`📰 ${news.title}`);
        addLog(`   ${news.content}`);
        addLog(`   地区: ${news.region} | 项目: ${news.sport}`);
        addLog('');
      });
    } else {
      alert(`加载体育动态失败: ${response.error}`);
    }
  } catch (error) {
    console.error('加载体育动态错误:', error);
    alert('加载体育动态失败，请确保Python ML API服务正在运行');
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

// ML图表渲染函数
const renderNeuralNetworkCharts = () => {
  if (!neuralNetworkResult.value) return;
  
  // 渲染训练损失曲线
  const lossCanvas = document.querySelector('#nnLossChart') as HTMLCanvasElement;
  if (lossCanvas) {
    Chart.getChart(lossCanvas)?.destroy();
    const ctx = lossCanvas.getContext('2d');
    if (ctx) {
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
  if (importanceCanvas) {
    Chart.getChart(importanceCanvas)?.destroy();
    const ctx = importanceCanvas.getContext('2d');
    if (ctx) {
      // 获取完整的指标名称
      const featureLabels = filteredThirdIndicators.value.length > 0 
        ? filteredThirdIndicators.value 
        : indicatorStructure.value.allThird;
      
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: featureLabels.slice(0, neuralNetworkResult.value.feature_importance.length),
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
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      });
    }
  }
};

const renderSHAPChart = () => {
  if (!shapResult.value) return;
  
  const shapCanvas = document.querySelector('#shapChart') as HTMLCanvasElement;
  if (shapCanvas) {
    Chart.getChart(shapCanvas)?.destroy();
    const ctx = shapCanvas.getContext('2d');
    if (ctx) {
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
    }
  }
};

const renderPCAChart = () => {
  if (!pcaResult.value) return;
  
  const pcaCanvas = document.querySelector('#pcaChart') as HTMLCanvasElement;
  if (pcaCanvas) {
    Chart.getChart(pcaCanvas)?.destroy();
    const ctx = pcaCanvas.getContext('2d');
    if (ctx) {
      const colors = ['rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 205, 86, 0.8)', 'rgba(75, 192, 192, 0.8)'];
      const groups = [...new Set(pcaResult.value.pca_results.map((item: any) => item.group))];
      
      const datasets = groups.map((group, index) => {
        const groupData = pcaResult.value.pca_results.filter((item: any) => item.group === group);
        return {
          label: String(group),
          data: groupData.map((item: any) => ({
            x: item.coordinates[0],
            y: item.coordinates[1],
            label: item.name
          })),
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length].replace('0.8', '1'),
        };
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
              text: `PCA降维可视化 (方差解释: ${(pcaResult.value.total_variance_explained * 100).toFixed(1)}%)`
            },
            tooltip: {
              callbacks: {
                label: function(context: any) {
                  return `${context.dataset.label}: ${context.parsed.label} (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                }
              }
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
  }
};

const generateAdvancedClusteringVisualization = async () => {
  if (!advancedClusterResult.value) return;
  
  try {
    // 调用Python API生成高级聚类可视化图表
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
    addLog('生成聚类图表失败，使用基础可视化');
  }
};
</script>

<style scoped>
.ip-evaluation-container {
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
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
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
  min-width: 100px;
  justify-content: center;
}

.header-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.header-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-btn.filter-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-btn.filter-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.header-btn.entry-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.header-btn.entry-btn:hover {
  background: linear-gradient(135deg, #ee82f0 0%, #f04658 100%);
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
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
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

/* 过渡动画 */
.filter-section,
.input-section {
  margin: 20px 0;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 2px solid #dee2e6;
  box-shadow: 0 4px 6px rgba(0,0,0,0.07);
  transition: all 0.3s ease;
}

.filter-section:hover, .input-section:hover {
  box-shadow: 0 6px 12px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.filter-section h3, .input-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #495057;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  position: relative;
}

.filter-section h3::after, .input-section h3::after {
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
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
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

.indicator-inputs {
  overflow-y: auto;
  padding-right: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 8px 12px;
}

.indicator-inputs::-webkit-scrollbar {
  width: 6px;
}

.indicator-inputs::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.indicator-inputs::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
}

.indicator-inputs::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

.input-group {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.input-group:hover {
  border-color: #667eea;
  box-shadow: 0 2px 4px rgba(102,126,234,0.1);
}

.input-group label {
  flex: 1;
  font-size: 14px;
  color: #495057;
  margin-right: 12px;
  font-weight: 500;
}

.input-group input {
  width: 100px;
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  transition: all 0.2s ease;
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary { background: #007bff; color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn-success { background: #28a745; color: white; }
.btn-danger { background: #dc3545; color: white; }
.btn-warning { background: #ffc107; color: black; }
.btn-info { background: #17a2b8; color: white; }
.btn-light { background: #f8f9fa; color: black; border: 1px solid #ddd; }
.btn-ai { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.btn-news { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }

.group-filter {
  margin-bottom: 10px;
}

.group-filter label {
  font-size: 13px;
  margin-right: 8px;
}

.group-filter select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.ip-list {
  max-height: 250px;
  overflow-y: auto;
  padding-right: 8px;
}

.ip-list::-webkit-scrollbar {
  width: 6px;
}

.ip-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.ip-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.ip-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.ip-item {
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.ip-item:hover {
  background: #f8f9fa;
}

.ip-item.active {
  background: #e3f2fd;
  border-color: #2196f3;
}

.ip-name {
  font-weight: bold;
  font-size: 13px;
}

.ip-group {
  font-size: 11px;
  color: #666;
}

.ip-score {
  font-size: 11px;
  color: #007bff;
  font-weight: bold;
}

.display-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: fit-content;
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  min-height: 700px;
}

.chart-panel {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-panel h3 {
  margin-bottom: 10px;
  color: #2c3e50;
  font-size: 16px;
}

.chart {
  height: 280px;
  background: #f8f9fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  position: relative;
}

.chart canvas {
  max-width: 100%;
  max-height: 100%;
}

.log-panel {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-height: 200px;
}

.log-panel h3 {
  margin-bottom: 10px;
  color: #2c3e50;
  font-size: 16px;
}

.log-content {
  height: calc(100% - 40px);
  overflow-y: auto;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  max-height: 250px;
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
  margin-bottom: 2px;
  color: #495057;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
}

.modal-content h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-item:hover {
  background: #f8f9fa;
}

.history-time {
  font-weight: bold;
  font-size: 14px;
}

.history-info {
  font-size: 12px;
  color: #666;
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
  margin-top: 10px;
  font-size: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ml-chart-image {
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  border-radius: 4px;
}

.ml-chart-image img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 4px;
}

.chart-placeholder {
  width: 100%;
  height: 280px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8f9fa;
  color: #666;
  border-radius: 4px;
  font-style: italic;
  text-align: center;
  padding: 20px;
  font-size: 12px;
  line-height: 1.4;
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

/* 主布局样式 */
.main-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 20px;
  min-height: 80vh;
  align-items: start;
}

.control-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: visible;
  height: 600px;
  overflow-y: auto;
}

.control-panel::-webkit-scrollbar {
  width: 8px;
}

.control-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.control-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.control-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.ip-list-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.ip-list-section h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}
</style> 