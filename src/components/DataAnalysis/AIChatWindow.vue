<template>
  <div v-if="show" class="ai-chat-window" :class="{ 'ai-minimized': isMinimized }">
    <div class="ai-chat-header">
      <div class="ai-chat-title">
        <span class="ai-icon">🤖</span>
        <h3>AI智能分析助手</h3>
        <span class="ai-status" :class="{ 'ai-thinking': loading }">
          {{ loading ? '思考中...' : '在线' }}
        </span>
      </div>
      <div class="ai-chat-controls">
        <button @click="handleStartNewChat" class="ai-control-btn" title="新对话">
          🆕
        </button>
        <button @click="handleToggleMinimize" class="ai-control-btn" :title="isMinimized ? '展开对话框' : '收缩对话框'">
          {{ isMinimized ? '⬆️' : '⬇️' }}
        </button>
      </div>
    </div>
    
    <div v-show="!isMinimized" class="ai-chat-body">
      <!-- 图表分析快捷按钮 - 只在图表分析模式下显示 -->
      <div v-show="isChartAnalysisMode" class="ai-quick-actions">
        <div class="ai-quick-title">快速分析图表:</div>
        <div class="ai-quick-buttons">
          <button @click="handleAnalyzeChart('fitness')" 
                  :disabled="getChartDisabled('fitness')"
                  class="ai-quick-btn" title="适应度变化分析">
            📈 适应度 <kbd>1</kbd>
          </button>
          <button @click="handleAnalyzeChart('scores')" 
                  :disabled="getChartDisabled('scores')"
                  class="ai-quick-btn" title="IP评分分布分析">
            📊 评分 <kbd>2</kbd>
          </button>
          <button @click="handleAnalyzeChart('radar')" 
                  :disabled="getChartDisabled('radar')"
                  class="ai-quick-btn" title="指标权重雷达图分析">
            🎯 权重 <kbd>3</kbd>
          </button>
          <button @click="handleAnalyzeChart('neural')" 
                  :disabled="getChartDisabled('neural')"
                  class="ai-quick-btn" title="神经网络训练分析">
            🧠 神经网络 <kbd>4</kbd>
          </button>
          <button @click="handleAnalyzeChart('importance')" 
                  :disabled="getChartDisabled('importance')"
                  class="ai-quick-btn" title="特征重要性分析">
            ⚖️ 特征重要性 <kbd>5</kbd>
          </button>
          <button @click="handleAnalyzeChart('shap')" 
                  :disabled="getChartDisabled('shap')"
                  class="ai-quick-btn" title="SHAP模型解释分析">
            🔍 SHAP <kbd>6</kbd>
          </button>
          <button @click="handleAnalyzeChart('pca')" 
                  :disabled="getChartDisabled('pca')"
                  class="ai-quick-btn" title="PCA降维分析">
            🔀 PCA <kbd>7</kbd>
          </button>
          <button @click="handleAnalyzeChart('cluster')" 
                  :disabled="getChartDisabled('cluster')"
                  class="ai-quick-btn" title="聚类分析">
            🎭 聚类 <kbd>8</kbd>
          </button>
          <button @click="handleAnalyzeChart('all')" 
                  :disabled="!hasAnalysisResults"
                  class="ai-quick-btn ai-analyze-all" title="全面综合分析">
            🔍 全面分析 <kbd>A</kbd>
          </button>
        </div>
      </div>
      
      <!-- 聊天消息区域 -->
      <div class="ai-chat-messages" ref="chatMessages">
        <div v-for="(message, index) in chatHistory" :key="index" class="ai-message" :class="message.type">
          <div class="ai-message-avatar">
            {{ message.type === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="ai-message-content">
            <div class="ai-message-text" v-html="formatMessage(message.content)"></div>
            <div class="ai-message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <div v-if="loading" class="ai-message ai-typing">
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
            <button @click="handleSetNormalMode" 
                    :class="{ 'active': !isChartAnalysisMode }"
                    class="ai-mode-circle-btn"
                    title="普通对话模式">
              💬
            </button>
            <button @click="handleSetChartMode" 
                    :class="{ 'active': isChartAnalysisMode }"
                    class="ai-mode-circle-btn"
                    title="图表分析模式">
              🔍
            </button>
          </div>
          
          <input 
            v-model="userInput" 
            @keydown.enter="handleSendMessage"
            @keydown.ctrl.49.prevent="handleAnalyzeChart('fitness')"
            @keydown.ctrl.50.prevent="handleAnalyzeChart('scores')" 
            @keydown.ctrl.51.prevent="handleAnalyzeChart('radar')"
            @keydown.ctrl.52.prevent="handleAnalyzeChart('neural')"
            @keydown.ctrl.53.prevent="handleAnalyzeChart('importance')"
            @keydown.ctrl.54.prevent="handleAnalyzeChart('shap')"
            @keydown.ctrl.55.prevent="handleAnalyzeChart('pca')"
            @keydown.ctrl.56.prevent="handleAnalyzeChart('cluster')"
            @keydown.ctrl.65.prevent="handleAnalyzeChart('all')"
            :placeholder="placeholder" 
            class="ai-input-field"
            ref="aiInput"
          />
          <button @click="handleSendMessage" :disabled="!userInput.trim() || loading" class="ai-send-btn">
            {{ loading ? '⏳' : '📤' }}
          </button>
        </div>
        <div class="ai-input-hint">
          快捷键: Ctrl+1~8分析对应图表, Ctrl+A全面分析
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

interface ChartTab {
  id: string;
  title: string;
  icon: string;
  disabled: boolean;
}

interface Props {
  show: boolean;
  isMinimized: boolean;
  isChartAnalysisMode: boolean;
  loading: boolean;
  chatHistory: ChatMessage[];
  chartTabs: ChartTab[];
  hasAnalysisResults: boolean;
}

interface Emits {
  (e: 'toggleMinimize'): void;
  (e: 'startNewChat'): void;
  (e: 'setNormalMode'): void;
  (e: 'setChartMode'): void;
  (e: 'analyzeChart', chartId: string): void;
  (e: 'sendMessage', message: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const userInput = ref('');
const chatMessages = ref<HTMLElement>();
const aiInput = ref<HTMLInputElement>();

// 计算属性
const placeholder = computed(() => {
  return props.isChartAnalysisMode 
    ? '输入图表分析问题或使用Ctrl+数字键快速分析...'
    : '输入任何问题，我来为您解答...';
});

// 方法
const handleToggleMinimize = () => {
  emit('toggleMinimize');
};

const handleStartNewChat = () => {
  emit('startNewChat');
};

const handleSetNormalMode = () => {
  emit('setNormalMode');
};

const handleSetChartMode = () => {
  emit('setChartMode');
};

const handleAnalyzeChart = (chartId: string) => {
  emit('analyzeChart', chartId);
};

const handleSendMessage = () => {
  if (!userInput.value.trim() || props.loading) return;
  
  emit('sendMessage', userInput.value.trim());
  userInput.value = '';
  
  // 聚焦到输入框
  nextTick(() => {
    aiInput.value?.focus();
  });
};

const getChartDisabled = (chartId: string): boolean => {
  const chart = props.chartTabs.find(t => t.id === chartId);
  return chart?.disabled ?? true;
};

const formatMessage = (content: string): string => {
  // 基本格式化：换行符转换为<br>
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString();
};

// 监听消息更新，自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
    }
  });
};

// 监听聊天历史变化
onMounted(() => {
  scrollToBottom();
});

// 每次消息更新后滚动到底部
const watchChatHistory = () => {
  scrollToBottom();
};

// 暴露方法给父组件
defineExpose({
  scrollToBottom: watchChatHistory
});
</script>

<style scoped>
.ai-chat-window {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 999;
  transition: all 0.3s ease;
}

.ai-chat-window.ai-minimized {
  max-height: 60px;
}

.ai-chat-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.ai-chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-chat-title h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.ai-icon {
  font-size: 16px;
}

.ai-status {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  transition: all 0.3s;
}

.ai-status.ai-thinking {
  background: rgba(255, 193, 7, 0.9);
  color: #333;
  animation: pulse 1.5s infinite;
}

.ai-chat-controls {
  display: flex;
  gap: 4px;
}

.ai-control-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  padding: 4px 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.ai-control-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.ai-chat-body {
  display: flex;
  flex-direction: column;
  height: 540px;
}

.ai-quick-actions {
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.ai-quick-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.ai-quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ai-quick-btn {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.ai-quick-btn:hover:not(:disabled) {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.ai-quick-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-quick-btn.ai-analyze-all {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.ai-quick-btn.ai-analyze-all:hover:not(:disabled) {
  background: #218838;
}

.ai-quick-btn kbd {
  background: rgba(0, 0, 0, 0.1);
  padding: 1px 3px;
  border-radius: 2px;
  font-size: 9px;
  margin-left: 2px;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #fafafa;
}

.ai-message {
  display: flex;
  margin-bottom: 12px;
}

.ai-message.user {
  justify-content: flex-end;
}

.ai-message-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-right: 8px;
  flex-shrink: 0;
}

.ai-message.user .ai-message-avatar {
  order: 2;
  margin-right: 0;
  margin-left: 8px;
}

.ai-message-content {
  max-width: 80%;
  background: white;
  padding: 8px 12px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.ai-message.user .ai-message-content {
  background: #3498db;
  color: white;
}

.ai-message-text {
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.ai-message-time {
  font-size: 10px;
  color: #999;
  text-align: right;
}

.ai-message.user .ai-message-time {
  color: rgba(255, 255, 255, 0.8);
}

.ai-typing-indicator {
  display: flex;
  gap: 3px;
  margin-bottom: 4px;
}

.ai-typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3498db;
  animation: typing 1.4s infinite ease-in-out;
}

.ai-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.ai-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

.ai-chat-input {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background: white;
  border-radius: 0 0 12px 12px;
}

.ai-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.ai-mode-toggle-buttons {
  display: flex;
  gap: 4px;
}

.ai-mode-circle-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-mode-circle-btn.active {
  background: #3498db;
  color: white;
}

.ai-mode-circle-btn:hover:not(.active) {
  background: #e0e0e0;
}

.ai-input-field {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.ai-input-field:focus {
  border-color: #3498db;
}

.ai-send-btn {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.ai-send-btn:hover:not(:disabled) {
  background: #2980b9;
}

.ai-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-input-hint {
  font-size: 10px;
  color: #999;
  text-align: center;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes typing {
  0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
</style> 