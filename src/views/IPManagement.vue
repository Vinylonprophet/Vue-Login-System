<template>
  <div class="ip-management-container">
    <!-- 页面标题 -->
    <div class="header">
      <div class="header-top">
        <h1>少数民族民俗体育IP数据管理</h1>
        <div class="header-actions">
          <router-link to="/dashboard" class="header-btn dashboard-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <span>返回仪表板</span>
          </router-link>
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
          <button @click="generateTestData" class="header-btn test-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M16 13H8"/>
              <path d="M16 17H8"/>
              <path d="M10 9H8"/>
            </svg>
            <span>生成测试数据</span>
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
              <span class="stat-label">数据操作</span>
              <span class="stat-value">{{ logs.length }}</span>
            </div>
          </div>
        </div>
        <div class="stats-actions">
          <div class="quick-stats">
            <span class="update-time">更新于 {{ new Date().toLocaleTimeString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据录入面板 -->
    <div class="input-section" v-show="showDataEntryPanel">
      <h3>IP数据录入</h3>
      
      <!-- IP基本信息 -->
      <div class="ip-basic-info">
        <div class="form-row">
          <div class="form-group">
            <label>IP名称:</label>
            <input v-model="ipForm.name" type="text" placeholder="请输入IP名称" />
          </div>
          <div class="form-group">
            <label>组别:</label>
            <input v-model="ipForm.group" type="text" placeholder="请输入组别" />
          </div>
        </div>
      </div>

      <!-- 指标数据录入 -->
      <div class="indicator-inputs">
        <h4>指标数据录入</h4>
        <div class="inputs-grid">
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

      <!-- 操作按钮 -->
      <div class="form-actions">
        <button @click="saveIP" class="btn btn-primary">保存IP</button>
        <button @click="clearForm" class="btn btn-secondary">清空表单</button>
        <button @click="fillRandomData" class="btn btn-warning">随机填充</button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧管理面板 -->
      <div class="management-panel">
        <!-- IP管理 -->
        <div class="ip-management-section">
          <h3>IP管理</h3>
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
              <div class="ip-header">
                <div class="ip-name">{{ ip.name }}</div>
                <div class="ip-actions">
                  <button @click.stop="editIP(ip)" class="btn-small btn-edit">编辑</button>
                  <button @click.stop="deleteIP(ip)" class="btn-small btn-delete">删除</button>
                </div>
              </div>
              <div class="ip-details">
                <div class="ip-group">组别: {{ ip.group }}</div>
                <div class="ip-indicators">指标数: {{ ip.indicators?.length || 0 }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 数据操作 -->
        <div class="data-operations">
          <h4>数据操作</h4>
          <div class="operation-buttons">
            <button @click="viewHistory" class="btn btn-info">查看历史</button>
            <button @click="exportData" class="btn btn-success">导出数据</button>
            <button @click="importData" class="btn btn-primary">导入数据</button>
            <button @click="clearAllData" class="btn btn-danger">清空数据</button>
          </div>
        </div>
      </div>

      <!-- 右侧操作日志 -->
      <div class="log-panel">
        <h3>操作日志</h3>
        <div class="log-content" ref="logContent">
          <div v-for="(log, index) in logs" :key="index" class="log-entry">
            {{ log }}
          </div>
        </div>
      </div>
    </div>

    <!-- 模态框 -->
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

    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">{{ loadingText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ipApi, type IP, type IndicatorStructure } from '../utils/api';
import { toast } from '../utils/toast';

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

// 筛选后的三级指标（用于显示所有可用指标）
const filteredThirdIndicators = ref<string[]>([]);

// 指标值输入
const indicatorValues = ref<Record<string, number>>({});

// IP数据
const ips = ref<IPWithScore[]>([]);
const selectedIP = ref<IPWithScore | null>(null);
const selectedGroup = ref('全部');
const groups = ref<string[]>(['全部']);

// 统计信息
const statistics = reactive({
  totalIPs: 0,
  totalGroups: 0,
  totalEvaluations: 0
});

// 日志
const logs = ref<string[]>([]);

// 对话框状态
const showHistoryDialog = ref(false);

// UI控制状态
const showDataEntryPanel = ref(true);

// 表单数据
const ipForm = reactive({
  name: '',
  group: ''
});

// 历史记录
const historyRecords = ref<any[]>([]);

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

const saveIP = async () => {
  if (!ipForm.name.trim() || !ipForm.group.trim()) {
    toast.warning('请填写IP名称和组别');
    return;
  }
  
  if (!validateIndicatorValues()) {
    toast.warning('请填写所有三级指标');
    return;
  }
  
  try {
    loading.value = true;
    loadingText.value = '保存IP中...';
    
    const indicators = filteredThirdIndicators.value.map(indicator => 
      indicatorValues.value[indicator] || 0
    );
    
    const ipData = {
      name: ipForm.name.trim(),
      group: ipForm.group.trim(),
      indicators
    };
    
    await ipApi.addIP(ipData);
    addLog(`已添加IP: ${ipData.name}`);
    
    clearForm();
    await loadIPs();
    await loadGroups();
    await loadStatistics();
    
    toast.success(`IP "${ipData.name}" 保存成功！`);
  } catch (error) {
    console.error('保存IP失败:', error);
    toast.fail(error instanceof Error ? error.message : '保存IP失败');
  } finally {
    loading.value = false;
    loadingText.value = '';
  }
};

const selectIP = (ip: IP) => {
  selectedIP.value = ip;
  
  // 更新表单和指标值
  ipForm.name = ip.name;
  ipForm.group = ip.group;
  
  filteredThirdIndicators.value.forEach((indicator, index) => {
    indicatorValues.value[indicator] = ip.indicators[index] || 0;
  });
  
  addLog(`选择IP: ${ip.name}`);
};

const editIP = (ip: IP) => {
  selectIP(ip);
  showDataEntryPanel.value = true;
  addLog(`编辑IP: ${ip.name}`);
};

const deleteIP = async (ip: IP) => {
  if (!confirm(`确定要删除IP "${ip.name}" 吗？`)) return;
  
  try {
    loading.value = true;
    loadingText.value = '删除IP中...';
    
    await ipApi.deleteIP(ip.id);
    addLog(`已删除IP: ${ip.name}`);
    
    // 如果删除的是当前选中的IP，清空选择
    if (selectedIP.value?.id === ip.id) {
      selectedIP.value = null;
      clearForm();
    }
    
    await loadIPs();
    await loadStatistics();
    
    toast.success(`IP "${ip.name}" 删除成功`);
  } catch (error) {
    console.error('删除IP失败:', error);
    toast.fail('删除IP失败');
  } finally {
    loading.value = false;
    loadingText.value = '';
  }
};

const clearForm = () => {
  ipForm.name = '';
  ipForm.group = '';
  initializeIndicatorValues();
  selectedIP.value = null;
  addLog('表单已清空');
};

const fillRandomData = () => {
  ipForm.name = `测试IP_${Date.now()}`;
  ipForm.group = `测试组_${Math.floor(Math.random() * 5) + 1}`;
  
  filteredThirdIndicators.value.forEach(indicator => {
    indicatorValues.value[indicator] = Math.floor(Math.random() * 100);
  });
  
  addLog('已随机填充数据');
};

const generateTestData = async () => {
  try {
    loading.value = true;
    loadingText.value = '生成测试数据中...';
    
    const response = await ipApi.generateTestData(10);
    if (response.data) {
      addLog(`已生成${response.data.addedIPs.length}个测试IP`);
      
      await loadIPs();
      await loadGroups(); 
      await loadStatistics();
      
      toast.success('测试数据生成成功！');
    }
  } catch (error) {
    console.error('生成测试数据失败:', error);
    toast.fail('生成测试数据失败');
  } finally {
    loading.value = false;
    loadingText.value = '';
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
    
    addLog('=== 加载历史记录 ===');
    addLog(`时间: ${formatDate(record.timestamp)}`);
    addLog(`IP数量: ${record.ipsCount}`);
    
    showHistoryDialog.value = false;
  } catch (error) {
    console.error('加载历史记录失败:', error);
  }
};

const exportData = async () => {
  try {
    loading.value = true;
    loadingText.value = '导出数据中...';
    
    const response = await ipApi.exportData();
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip-evaluation-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addLog('数据导出完成');
    toast.success('数据导出成功！');
  } catch (error) {
    console.error('导出数据失败:', error);
    toast.fail('导出数据失败');
  } finally {
    loading.value = false;
    loadingText.value = '';
  }
};

const importData = async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      // 这里应该有导入数据的API调用
      addLog('数据导入功能开发中...');
    } catch (error) {
      addLog('导入数据失败');
    }
  };
  input.click();
};

const clearAllData = async () => {
  if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) return;
  
  try {
    loading.value = true;
    // 这里应该有清空数据的API调用
    addLog('清空数据功能开发中...');
  } catch (error) {
    addLog('清空数据失败');
  } finally {
    loading.value = false;
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

const closeDialogs = () => {
  showHistoryDialog.value = false;
};

// UI控制函数
const toggleDataEntry = () => {
  showDataEntryPanel.value = !showDataEntryPanel.value;
  addLog(`数据录入面板已${showDataEntryPanel.value ? '显示' : '隐藏'}`);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};
</script>

<style scoped>
/* 复用Dashboard的样式，但针对数据管理做一些调整 */
.ip-management-container {
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
  text-decoration: none;
  color: white;
}

.header-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.header-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-btn.dashboard-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.header-btn.filter-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header-btn.entry-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.header-btn.test-btn {
  background: linear-gradient(135deg, #ffc107 0%, #ff9a9e 100%);
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

/* 筛选和录入面板样式 */
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
}

.inputs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px 16px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.inputs-grid::-webkit-scrollbar {
  width: 6px;
}

.inputs-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.inputs-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.input-group {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.input-group:hover {
  border-color: #667eea;
  box-shadow: 0 2px 6px rgba(102,126,234,0.15);
  transform: translateY(-1px);
}

.input-group label {
  flex: 1;
  font-size: 13px;
  color: #495057;
  margin-right: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.input-group input {
  width: 80px;
  padding: 6px 10px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  text-align: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
}

/* 主要内容布局 */
.main-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
  min-height: 60vh;
  align-items: start;
}

/* 管理面板美化 */
.management-panel {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  border: 1px solid #e9ecef;
  height: fit-content;
  position: sticky;
  top: 20px;
}

/* IP管理部分美化 */
.ip-management-section {
  margin-bottom: 30px;
}

.ip-management-section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  position: relative;
  padding-bottom: 12px;
}

.ip-management-section h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

/* 组别筛选美化 */
.group-filter {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border-radius: 12px;
  border: 1px solid #e1bee7;
}

.group-filter label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #5e35b1;
  margin-bottom: 8px;
}

.group-filter select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #b39ddb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #5e35b1;
  font-weight: 500;
}

.group-filter select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.15);
  background: #fafafa;
}

.group-filter select:hover {
  border-color: #7e57c2;
  background: #fafafa;
}

/* IP列表美化 */
.ip-list {
  max-height: 400px;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.ip-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

/* IP项目美化 */
.ip-item {
  margin-bottom: 12px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: relative;
  overflow: hidden;
}

.ip-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ip-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102,126,234,0.15);
  border-color: #667eea;
}

.ip-item:hover::before {
  opacity: 1;
}

.ip-item.active {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102,126,234,0.2);
}

.ip-item.active::before {
  opacity: 1;
}

/* IP项目头部 */
.ip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ip-name {
  font-weight: 700;
  font-size: 16px;
  color: #2c3e50;
  flex: 1;
  margin-right: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ip-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.ip-item:hover .ip-actions {
  opacity: 1;
}

/* 小按钮美化 */
.btn-small {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-edit {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.btn-edit:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(40,167,69,0.3);
}

.btn-delete {
  background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
  color: white;
}

.btn-delete:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(220,53,69,0.3);
}

/* IP详情 */
.ip-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.ip-group {
  font-size: 13px;
  color: #6c757d;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 500;
  border: 1px solid #dee2e6;
}

.ip-indicators {
  font-size: 12px;
  color: #667eea;
  font-weight: 600;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #b39ddb;
}

/* 数据操作部分美化 */
.data-operations {
  padding-top: 24px;
  border-top: 2px solid #e9ecef;
}

.data-operations h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  position: relative;
  padding-bottom: 8px;
}

.data-operations h4::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border-radius: 2px;
}

.operation-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.operation-buttons .btn {
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.operation-buttons .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
}

.btn-info {
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%);
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #007bff 0%, #667eea 100%);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
  color: white;
}

.log-panel {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.log-panel h3 {
  margin-bottom: 10px;
  color: #2c3e50;
  font-size: 16px;
}

.log-content {
  height: 500px;
  overflow-y: auto;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-entry {
  margin-bottom: 2px;
  color: #495057;
}

/* 模态框样式 */
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

/* 表单相关样式 */
.ip-basic-info {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  color: #495057;
  font-weight: 500;
}

.form-group input {
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.form-actions .btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.form-actions .btn-primary {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.form-actions .btn-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.form-actions .btn-warning {
  background: linear-gradient(135deg, #ffc107 0%, #ff9a9e 100%);
  color: white;
}

.form-actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

/* 通用按钮样式 */
.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.btn-warning {
  background: linear-gradient(135deg, #ffc107 0%, #ff9a9e 100%);
  color: white;
}

.btn-light {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  border: 1px solid #dee2e6;
}
</style> 