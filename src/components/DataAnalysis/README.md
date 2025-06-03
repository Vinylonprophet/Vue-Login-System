# DataAnalysis 重构指南

## 📁 文件结构

```
src/
├── services/DataAnalysis/
│   ├── chartService.ts       # 图表渲染服务
│   ├── aiService.ts          # AI分析服务
│   ├── exportService.ts      # 导出服务
│   └── dataService.ts        # 数据处理服务
├── components/DataAnalysis/
│   ├── HeaderSection.vue     # 头部组件
│   ├── StatsBar.vue          # 统计信息栏
│   ├── LogPanel.vue          # 日志面板
│   ├── FilterPanel.vue       # 筛选面板（待创建）
│   ├── ChartTabs.vue         # 图表选项卡（待创建）
│   ├── IPSelectionSidebar.vue # IP选择侧边栏（待创建）
│   ├── ChartDisplayArea.vue  # 图表显示区域（待创建）
│   ├── AIChatWindow.vue      # AI聊天窗口（待创建）
│   └── ChartSelectionDialog.vue # 图表选择弹窗（待创建）
└── views/
    └── DataAnalysis.vue      # 主文件（需重构）
```

## 🔧 如何在现有 DataAnalysis.vue 中使用 Services

### 1. 导入Services

```typescript
// 在现有的 DataAnalysis.vue 的 script 部分添加：
import { ChartService } from '../services/DataAnalysis/chartService';
import { AIService } from '../services/DataAnalysis/aiService';
import { ExportService } from '../services/DataAnalysis/exportService';
import { DataService } from '../services/DataAnalysis/dataService';
```

### 2. 替换图表渲染函数

```typescript
// 原来的 renderCharts 函数可以替换为：
const renderCharts = () => {
  ChartService.renderCharts(evaluationResult.value, filteredThirdIndicators.value);
};

// 原来的 renderNeuralNetworkCharts 函数可以替换为：
const renderNeuralNetworkCharts = () => {
  ChartService.renderNeuralNetworkCharts(
    neuralNetworkResult.value, 
    filteredThirdIndicators.value, 
    indicatorStructure.value.allThird
  );
};

// 类似地替换其他图表渲染函数
const renderSHAPChart = () => {
  ChartService.renderSHAPChart(shapResult.value);
};

const renderPCAChart = () => {
  ChartService.renderPCAChart(pcaResult.value);
};
```

### 3. 替换AI分析函数

```typescript
// 原来的 performUnifiedAIAnalysis 函数可以替换为：
const performUnifiedAIAnalysis = async (prompt: string, isForPDF: boolean = false) => {
  return await AIService.performUnifiedAIAnalysis(
    prompt,
    isForPDF,
    selectedIPs.value.length,
    filteredThirdIndicators.value.length,
    evaluationResult.value,
    neuralNetworkResult.value,
    shapResult.value,
    pcaResult.value,
    advancedClusterResult.value,
    chartTabs.value,
    isChartAnalysisMode.value,
    aiChatHistory.value
  );
};

// AI消息格式化
const formatAIMessage = (message: string) => {
  return AIService.formatAIMessage(message);
};

// 添加聊天消息
const addChatMessage = (type: 'user' | 'ai', content: string) => {
  AIService.addChatMessage(aiChatHistory.value, type, content, chatMessages);
};
```

### 4. 替换导出函数

```typescript
// 原来的 performPDFExport 函数可以替换为：
const performPDFExport = async (selectedChartIds: string[]) => {
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
    isChartAnalysisMode.value,
    addLog,
    (loading: boolean) => { loading.value = loading; },
    (text: string) => { loadingText.value = text; }
  );
};

// 原来的 exportToExcel 函数可以替换为：
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
```

### 5. 替换数据处理函数

```typescript
// 原来的 loadInitialData 函数可以替换为：
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

// 原来的 performComprehensiveAnalysis 函数可以替换为：
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
    await DataService.renderAllCharts(
      result.evaluationResult,
      result.neuralNetworkResult,
      result.shapResult,
      result.pcaResult,
      filteredThirdIndicators.value,
      indicatorStructure.value.allThird
    );
    
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
```

## 🎨 如何使用Components

### 1. 导入组件

```typescript
import HeaderSection from '../components/DataAnalysis/HeaderSection.vue';
import StatsBar from '../components/DataAnalysis/StatsBar.vue';
import LogPanel from '../components/DataAnalysis/LogPanel.vue';
```

### 2. 在模板中使用

```vue
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
    
    <!-- 其他现有内容 -->
    <!-- ... -->
    
    <!-- 使用LogPanel组件 -->
    <LogPanel :logs="logs" />
  </div>
</template>
```

## 🚀 渐进式重构步骤

1. **第一步**：替换Services函数（不改变UI）
2. **第二步**：逐个替换小组件（HeaderSection, StatsBar, LogPanel）
3. **第三步**：创建并替换中等组件（FilterPanel, ChartTabs）
4. **第四步**：创建并替换大组件（IPSelectionSidebar, ChartDisplayArea）
5. **第五步**：创建并替换复杂组件（AIChatWindow, ChartSelectionDialog）

## ✅ 优势

- **代码复用**：Services可以在其他页面中复用
- **易于维护**：每个Service职责单一，易于维护和测试
- **类型安全**：所有Services都有完整的TypeScript类型定义
- **模块化**：组件可以独立开发和测试
- **功能不变**：UI和功能保持完全一致

## 🔄 逐步替换示例

可以先从最简单的组件开始：

```typescript
// 在现有的 DataAnalysis.vue 中，找到这部分：
/*
<div class="log-panel">
  <h3>分析过程日志</h3>
  <div class="log-content" ref="logContent">
    <div v-for="(log, index) in logs" :key="index" class="log-entry">
      {{ log }}
    </div>
  </div>
</div>
*/

// 替换为：
// <LogPanel :logs="logs" />

// 并在script中导入：
// import LogPanel from '../components/DataAnalysis/LogPanel.vue';
```

这样可以确保功能完全不变的情况下，逐步实现代码的模块化和重构。 