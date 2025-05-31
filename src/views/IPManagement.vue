<template>
  <div class="ip-management-container">
    <!-- 页面标题 -->
    <div class="header">
      <div class="header-top">
        <h1>少数民族民俗体育IP数据管理</h1>
        <div class="header-actions">
          <button @click="importData" class="header-btn import-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <path d="M7 10l5 5 5-5"/>
              <path d="M12 15V3"/>
            </svg>
            <span>Excel导入</span>
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
        </div>
        <div class="stats-actions">
          <div class="quick-stats">
            <span class="update-time">更新于 {{ new Date().toLocaleTimeString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 上方操作区域 -->
      <div class="top-section">
        <!-- 左侧IP管理 -->
        <div class="management-panel">
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
                @click="openExpertPanel(ip)"
              >
                <div class="ip-header">
                  <div class="ip-name">{{ ip.project_name }}</div>
                  <div class="ip-actions">
                    <button @click.stop="deleteIP(ip)" class="btn-small btn-delete">删除</button>
                  </div>
                </div>
                <div class="ip-details">
                  <div class="ip-group">组别: {{ ip.group_name }}</div>
                  <div class="ip-expert">专家: {{ ip.expert }}</div>
                  <div class="ip-stats" v-if="ip.expertCount">
                    <el-icon><User /></el-icon>
                    <span>{{ ip.expertCount }}位专家</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 数据操作 -->
          <div class="data-operations">
            <h4>数据操作</h4>
            <div class="operation-buttons">
              <button @click="clearAllData" class="btn btn-danger">清空数据</button>
            </div>
          </div>
        </div>

        <!-- 右侧数据编辑面板 -->
        <div class="data-entry-panel" v-show="showDataEntryPanel">
          <h3>数据编辑</h3>
          
          <!-- IP基本信息 -->
          <div class="ip-basic-info">
            <div class="form-row">
              <div class="form-group">
                <label>IP名称:</label>
                <input v-model="ipForm.project_name" type="text" placeholder="请输入IP名称" />
              </div>
              <div class="form-group">
                <label>组别:</label>
                <input v-model="ipForm.group_name" type="text" placeholder="请输入组别" />
              </div>
              <div class="form-group">
                <label>专家:</label>
                <input v-model="ipForm.expert" type="text" placeholder="请输入专家姓名" />
              </div>
              <div class="form-group address-group">
                <label>所在地址:</label>
                <el-cascader
                  v-model="ipForm.addressArray"
                  :options="areaData"
                  :props="cascaderProps"
                  placeholder="请选择省市区"
                  clearable
                  class="address-cascader"
                  @change="onAddressChange"
                />
              </div>
            </div>
            
            <!-- 地址显示 -->
            <!-- <div class="form-row" v-if="fullAddress">
              <div class="form-group full-width">
                <label>完整地址:</label>
                <div class="address-display">
                  <span class="address-text">{{ fullAddress }}</span>
                  <button @click="clearAddress" class="btn-clear-address" type="button">清空</button>
                </div>
              </div>
            </div> -->
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
            <button @click="saveIP" class="btn" :class="saveButtonClass">{{ saveButtonText }}</button>
            <button @click="clearForm" class="btn btn-secondary">清空表单</button>
            <button @click="fillRandomData" class="btn btn-warning">随机填充</button>
          </div>
        </div>

        <!-- 多专家评分管理面板 -->
        <div class="expert-panel" v-show="showExpertPanel">
          <div class="expert-panel-header">
            <h3>多专家评分管理</h3>
            <button @click="closeExpertPanel" class="btn btn-secondary">返回</button>
          </div>
          
          <div class="expert-info" v-if="selectedIPForExperts">
            <h4>{{ selectedIPForExperts.project_name }} ({{ selectedIPForExperts.group_name }})</h4>
            <p>共有 {{ expertScores.length }} 位专家评分</p>
          </div>

          <!-- 平均值显示 -->
          <div class="average-scores" v-if="Object.keys(averageScores).length > 0">
            <h4>平均评分</h4>
            <div class="average-grid">
              <div v-for="(score, indicator) in averageScores" :key="indicator" class="average-item">
                <span class="indicator-name">{{ indicator }}</span>
                <span class="average-value">{{ score.toFixed(1) }}</span>
              </div>
            </div>
          </div>

          <!-- 专家评分列表 -->
          <div class="expert-scores-list">
            <h4>专家评分详情</h4>
            <div class="expert-cards">
              <div v-for="expert in expertScores" :key="expert.id" class="expert-card">
                <div class="expert-card-header">
                  <h5>{{ expert.expert }}</h5>
                  <div class="expert-actions">
                    <button @click="editExpertScore(expert)" class="btn-small btn-edit">编辑</button>
                    <button @click="deleteExpertScore(expert)" class="btn-small btn-delete">删除</button>
                  </div>
                </div>
                <div class="expert-indicators">
                  <div v-for="indicator in filteredThirdIndicators.slice(0, 5)" :key="indicator" class="indicator-item">
                    <span class="indicator-label">{{ indicator }}</span>
                    <span class="indicator-score">{{ getExpertIndicatorScore(expert, indicator) }}</span>
                  </div>
                  <div v-if="filteredThirdIndicators.length > 5" class="more-indicators">
                    还有 {{ filteredThirdIndicators.length - 5 }} 个指标...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 下方操作日志 -->
      <div class="log-panel">
        <h3>操作日志</h3>
        <div class="log-content" ref="logContent">
          <div v-for="(log, index) in logs" :key="index" class="log-entry">
            {{ log }}
          </div>
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
import { ipApi, type IP, type IndicatorStructure } from '../utils/api';
import { toast } from '../utils/toast';
// 导入中国地址数据
// @ts-ignore
import chinaAreaData from 'china-area-data';

// IP评估相关接口扩展
interface IPWithScore extends IP {
  score?: number;
  province?: string;
  city?: string;
  district?: string;
}

// 地址选择器数据接口
interface AreaOption {
  value: string;
  label: string;
  children?: AreaOption[];
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
  allThird: [],
  indicatorPropertyMap: {},
  propertyIndicatorMap: {},
  allProperties: []
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

// UI控制状态
const showDataEntryPanel = ref(true);
const showExpertPanel = ref(false); // 多专家评分面板

// 表单数据
const ipForm = reactive({
  project_name: '',
  group_name: '',
  expert: '',
  addressArray: [] as string[],
  province: '',
  city: '',
  district: ''
});

// 地址数据配置
const areaData = ref<AreaOption[]>([]);
const cascaderProps = {
  expandTrigger: 'hover' as const,
  value: 'value',
  label: 'label',
  children: 'children'
};

// 转换中国地址数据为层级结构
const transformAreaData = () => {
  const result: AreaOption[] = [];
  
  // 获取省级数据
  const provinces = chinaAreaData['86'] as Record<string, string>;
  
  for (const [provinceCode, provinceName] of Object.entries(provinces)) {
    const provinceOption: AreaOption = {
      value: provinceName as string,
      label: provinceName as string,
      children: []
    };
    
    // 获取市级数据
    const cities = chinaAreaData[provinceCode] as Record<string, string>;
    if (cities) {
      for (const [cityCode, cityName] of Object.entries(cities)) {
        const cityOption: AreaOption = {
          value: cityName as string,
          label: cityName as string,
          children: []
        };
        
        // 获取区县级数据
        const districts = chinaAreaData[cityCode] as Record<string, string>;
        if (districts) {
          for (const [districtCode, districtName] of Object.entries(districts)) {
            cityOption.children!.push({
              value: districtName as string,
              label: districtName as string
            });
          }
        }
        
        provinceOption.children!.push(cityOption);
      }
    }
    
    result.push(provinceOption);
  }
  
  return result;
};

// 地址相关数据
const availableProvinces = ref<string[]>([
  '北京', '天津', '上海', '重庆', '河北', '山西', '辽宁', '吉林', 
  '黑龙江', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南', 
  '湖北', '湖南', '广东', '海南', '四川', '贵州', '云南', '陕西', 
  '甘肃', '青海', '新疆', '广西', '内蒙古', '宁夏', '西藏', '香港', '澳门'
]);

const availableCities = ref<string[]>([]);
const availableDistricts = ref<string[]>([]);

// 省市区数据映射
const provinceToCity: Record<string, string[]> = {
  '西藏': ['拉萨市', '昌都市', '山南市', '日喀则市', '那曲市', '阿里地区', '林芝市'],
  '江苏': ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
  '广东': ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'],
  '北京': ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '门头沟区', '房山区', '通州区', '顺义区', '昌平区', '大兴区', '怀柔区', '平谷区', '密云区', '延庆区'],
  '上海': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区']
};

const cityToDistrict: Record<string, string[]> = {
  '拉萨市': ['城关区', '堆龙德庆区', '达孜区', '林周县', '当雄县', '尼木县', '曲水县', '墨竹工卡县'],
  '南京市': ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区', '六合区', '溧水区', '高淳区'],
  '苏州市': ['虎丘区', '吴中区', '相城区', '姑苏区', '吴江区', '常熟市', '张家港市', '昆山市', '太仓市'],
  '广州市': ['荔湾区', '越秀区', '海珠区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区']
};

// 多专家评分相关状态
const selectedIPForExperts = ref<{ project_name: string; group_name: string } | null>(null);
const expertScores = ref<IP[]>([]);
const averageScores = ref<Record<string, number>>({});

// 编辑状态
const editMode = ref(false);
const editingIPId = ref<string | null>(null);

// 添加计算属性来判断当前操作模式
const currentMode = computed(() => {
  // 检查是否真正的编辑操作：只有当前表单数据与原始IP完全一致时才是编辑
  if (editMode.value && editingIPId.value && selectedIP.value) {
    const isRealEdit = (
      ipForm.project_name.trim() === selectedIP.value.project_name &&
      ipForm.group_name.trim() === selectedIP.value.group_name &&
      ipForm.expert.trim() === selectedIP.value.expert
    );
    
    if (isRealEdit) {
      return 'edit';
    }
  }
  
  // 其他所有情况都是新建操作
  return 'create';
});

// 计算属性：动态按钮文字
const saveButtonText = computed(() => {
  switch (currentMode.value) {
    case 'edit':
      return '保存修改';
    case 'create':
    default:
      return '保存IP';
  }
});

// 计算属性：动态按钮样式类
const saveButtonClass = computed(() => {
  switch (currentMode.value) {
    case 'edit':
      return 'btn-info'; // 蓝色 - 编辑模式
    case 'create':
    default:
      return 'btn-primary'; // 绿色 - 创建新IP
  }
});

// 生命周期
onMounted(async () => {
  console.log('🗺️ 初始化地址数据...');
  try {
    areaData.value = transformAreaData();
    console.log('✅ 地址数据加载成功，省份数量:', areaData.value.length);
    console.log('📍 前5个省份:', areaData.value.slice(0, 5).map(p => p.label));
  } catch (error) {
    console.error('❌ 地址数据加载失败:', error);
    toast.fail('地址数据加载失败');
  }
  
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
  if (!ipForm.project_name.trim() || !ipForm.group_name.trim() || !ipForm.expert.trim()) {
    toast.warning('请填写IP名称、组别和专家姓名');
    return;
  }
  
  if (!validateIndicatorValues()) {
    toast.warning('请填写所有三级指标');
    return;
  }
  
  try {
    loading.value = true;
    
    // 将指标值从中文名称映射为对象格式
    const indicators: Record<string, number> = {};
    filteredThirdIndicators.value.forEach(indicator => {
      const propertyName = getPropertyNameForIndicator(indicator);
      if (propertyName) {
        indicators[propertyName] = indicatorValues.value[indicator] || 0;
      }
    });
    
    const ipData = {
      project_name: ipForm.project_name.trim(),
      group_name: ipForm.group_name.trim(),
      expert: ipForm.expert.trim(),
      province: ipForm.addressArray[0] || '',
      city: ipForm.addressArray[1] || '',
      district: ipForm.addressArray[2] || '',
      full_address: fullAddress.value,
      indicators
    };
    
    // 使用计算属性来判断操作模式
    const mode = currentMode.value;
    
    if (mode === 'edit') {
      // 真正的编辑模式：更新现有IP
      loadingText.value = '更新IP中...';
      await ipApi.updateIP(editingIPId.value!, ipData);
      addLog(`已更新IP: ${ipData.project_name} (组别: ${ipData.group_name}, 专家: ${ipData.expert}, 地址: ${ipData.full_address})`);
      toast.success(`IP "${ipData.project_name}" 更新成功！`);
    } else {
      // 创建模式：添加新IP
      loadingText.value = '保存IP中...';
      await ipApi.addIP(ipData);
      addLog(`已添加IP: ${ipData.project_name} (组别: ${ipData.group_name}, 专家: ${ipData.expert}, 地址: ${ipData.full_address})`);
      toast.success(`IP "${ipData.project_name}" 保存成功！`);
    }
    
    clearForm();
    await loadIPs();
    await loadGroups();
    await loadStatistics();
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
  
  // 设置为编辑模式
  editMode.value = true;
  editingIPId.value = ip.id;
  
  // 更新表单和指标值
  ipForm.project_name = ip.project_name;
  ipForm.group_name = ip.group_name;
  ipForm.expert = ip.expert;
  
  // 更新地址信息（如果存在）
  const selectedIPData = ip as IPWithScore;
  if (selectedIPData.province || selectedIPData.city || selectedIPData.district) {
    // 更新各个地址字段
    ipForm.province = selectedIPData.province || '';
    ipForm.city = selectedIPData.city || '';
    ipForm.district = selectedIPData.district || '';
    
    // 构建地址数组用于级联选择器
    const addressParts = [];
    if (ipForm.province) addressParts.push(ipForm.province);
    if (ipForm.city) addressParts.push(ipForm.city);
    if (ipForm.district) addressParts.push(ipForm.district);
    ipForm.addressArray = addressParts;
    
    addLog(`填充地址信息: ${ipForm.province} ${ipForm.city} ${ipForm.district}`);
  } else {
    // 清空地址信息
    ipForm.province = '';
    ipForm.city = '';
    ipForm.district = '';
    ipForm.addressArray = [];
    addLog('该IP无地址信息');
  }
  
  // 清空现有的指标值
  initializeIndicatorValues();
  
  // 如果indicators是对象格式，直接从对象中获取值
  if (ip.indicators && typeof ip.indicators === 'object') {
    // 遍历所有指标，从IP的indicators对象中获取对应的值
    filteredThirdIndicators.value.forEach(indicator => {
      // 需要将中文指标名转换为属性名
      const propertyName = getPropertyNameForIndicator(indicator);
      if (propertyName && ip.indicators[propertyName] !== undefined) {
        indicatorValues.value[indicator] = ip.indicators[propertyName];
      }
    });
  }
  // 如果indicators仍然是数组格式（向后兼容）
  else if (Array.isArray(ip.indicators)) {
    filteredThirdIndicators.value.forEach((indicator, index) => {
      indicatorValues.value[indicator] = ip.indicators[index] || 0;
    });
  }
  
  const addressInfo = fullAddress.value ? `, 地址: ${fullAddress.value}` : '';
  addLog(`选择IP: ${ip.project_name} (专家: ${ip.expert}${addressInfo})`);
};

const deleteIP = async (ip: IP) => {
  if (!confirm(`确定要删除IP "${ip.project_name}" 吗？`)) return;
  
  try {
    loading.value = true;
    loadingText.value = '删除IP中...';
    
    await ipApi.deleteIP(ip.id);
    addLog(`已删除IP: ${ip.project_name}`);
    
    // 如果删除的是当前选中的IP，清空选择
    if (selectedIP.value?.id === ip.id) {
      selectedIP.value = null;
      clearForm();
    }
    
    await loadIPs();
    await loadGroups();
    await loadStatistics();
    
    toast.success(`IP "${ip.project_name}" 删除成功`);
  } catch (error) {
    console.error('删除IP失败:', error);
    toast.fail('删除IP失败');
  } finally {
    loading.value = false;
    loadingText.value = '';
  }
};

const clearForm = () => {
  ipForm.project_name = '';
  ipForm.group_name = '';
  ipForm.expert = '';
  ipForm.addressArray = [];
  ipForm.province = '';
  ipForm.city = '';
  ipForm.district = '';
  editMode.value = false;
  editingIPId.value = null;
  initializeIndicatorValues();
  selectedIP.value = null;
  addLog('表单已清空');
};

const fillRandomData = () => {
  const projectName = ['赛马', '赛骆驼', '足球', '篮球', '乒乓球', '街舞'];
  const experts = ['张教授', '李专家', '王研究员', '陈博士', '刘教授'];
  
  // 随机地址数据
  const addressOptions = [
    ['北京市', '东城区', '东华门街道'],
    ['上海市', '黄浦区', '南京东路街道'],
    ['广东省', '广州市', '越秀区'],
    ['江苏省', '南京市', '玄武区'],
    ['浙江省', '杭州市', '西湖区'],
    ['四川省', '成都市', '锦江区'],
    ['西藏自治区', '拉萨市', '城关区'],
    ['新疆维吾尔自治区', '乌鲁木齐市', '天山区'],
    ['内蒙古自治区', '呼和浩特市', '新城区'],
    ['云南省', '昆明市', '五华区']
  ];
  
  ipForm.project_name = projectName[Math.floor(Math.random() * projectName.length)];
  ipForm.group_name = `测试组_${Math.floor(Math.random() * 5) + 1}`;
  ipForm.expert = experts[Math.floor(Math.random() * experts.length)];
  
  // 随机选择地址
  const randomAddress = addressOptions[Math.floor(Math.random() * addressOptions.length)];
  ipForm.addressArray = [...randomAddress];
  ipForm.province = randomAddress[0];
  ipForm.city = randomAddress[1];
  ipForm.district = randomAddress[2];
  
  filteredThirdIndicators.value.forEach(indicator => {
    indicatorValues.value[indicator] = Math.floor(Math.random() * 100);
  });
  
  addLog(`已随机填充数据，地址: ${fullAddress.value}`);
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
  input.accept = '.json,.xlsx,.xls';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    try {
      loading.value = true;
      loadingText.value = '导入数据中...';
      
      if (file.name.endsWith('.json')) {
        // JSON文件处理
        const text = await file.text();
        const data = JSON.parse(text);
        
        const response = await ipApi.importData(data);
        if (response.data) {
          addLog(`成功导入${response.data.ipsCount}个IP和${response.data.historyCount}条历史记录`);
          
          // 重新加载数据
          await loadInitialData();
          
          toast.success('数据导入成功！');
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Excel文件处理
        const response = await ipApi.importExcel(file);
        if (response.success) {
          const { data } = response;
          
          addLog(`=== Excel导入成功 ===`);
          addLog(`组别: ${data.summary.groupName}`);
          addLog(`专家数量: ${data.summary.expertCount}`);
          addLog(`指标数量: ${data.summary.indicatorCount}`);
          addLog(`成功导入IP数量: ${data.ipsCount}`);
          
          if (data.errors && data.errors.length > 0) {
            addLog(`导入错误: ${data.errors.length}个`);
            data.errors.forEach((error: any) => {
              addLog(`- ${error.name}: ${error.error}`);
            });
          }
          
          // 重新加载数据
          await loadInitialData();
          
          toast.success(`成功导入${data.ipsCount}个专家评分IP！`);
        }
      } else {
        toast.warning('请选择.json、.xlsx或.xls格式的文件');
        addLog('不支持的文件格式');
      }
    } catch (error) {
      console.error('导入数据失败:', error);
      toast.fail('导入数据失败');
      addLog(`导入数据失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      loading.value = false;
      loadingText.value = '';
    }
  };
  input.click();
};

const clearAllData = async () => {
  if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) return;
  
  try {
    loading.value = true;
    loadingText.value = '清空数据中...';
    
    await ipApi.clearAll();
    addLog('所有数据已清空');
    
    // 重新加载数据
    await loadInitialData();
    
    // 清空表单
    clearForm();
    
    toast.success('所有数据已清空！');
  } catch (error) {
    console.error('清空数据失败:', error);
    toast.fail('清空数据失败');
    addLog(`清空数据失败: ${error}`);
  } finally {
    loading.value = false;
    loadingText.value = '';
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

// UI控制函数
const toggleDataEntry = () => {
  showDataEntryPanel.value = !showDataEntryPanel.value;
  addLog(`数据录入面板已${showDataEntryPanel.value ? '显示' : '隐藏'}`);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

const getIndicatorCount = (indicators: any): number => {
  if (typeof indicators === 'object' && indicators !== null) {
    return Object.keys(indicators).length;
  } else if (Array.isArray(indicators)) {
    return indicators.length;
  } else {
    return 0;
  }
};

// 多专家评分管理方法
const openExpertPanel = async (ip: IP) => {
  if (ip._isGroup) {
    // 这是聚合记录，获取所有专家评分
    selectedIP.value = ip; // 设置选中状态，用于左侧高亮显示
    selectedIPForExperts.value = { project_name: ip.project_name, group_name: ip.group_name };
    await loadExpertScores();
    showExpertPanel.value = true;
    showDataEntryPanel.value = false;
    addLog(`打开多专家评分管理: ${ip.project_name} (${ip.group_name})`);
  } else {
    // 单一专家记录，直接编辑
    selectIP(ip);
    // 确保切换到编辑面板并关闭专家面板
    showExpertPanel.value = false;
    showDataEntryPanel.value = true;
  }
};

const loadExpertScores = async () => {
  if (!selectedIPForExperts.value) return;
  
  try {
    loading.value = true;
    const response = await ipApi.getExpertScoresByIP(
      selectedIPForExperts.value.project_name, 
      selectedIPForExperts.value.group_name
    );
    if (response.data) {
      expertScores.value = response.data;
      calculateAverageScores();
    }
  } catch (error) {
    console.error('加载专家评分失败:', error);
    toast.fail('加载专家评分失败');
  } finally {
    loading.value = false;
  }
};

const calculateAverageScores = () => {
  if (expertScores.value.length === 0) {
    averageScores.value = {};
    return;
  }
  
  const avgScores: Record<string, number> = {};
  const allProperties = filteredThirdIndicators.value;
  
  allProperties.forEach(indicator => {
    const propertyName = getPropertyNameForIndicator(indicator);
    if (propertyName) {
      const sum = expertScores.value.reduce((acc, expert) => {
        return acc + (expert.indicators[propertyName] || 0);
      }, 0);
      avgScores[indicator] = sum / expertScores.value.length;
    }
  });
  
  averageScores.value = avgScores;
};

const editExpertScore = (expert: IP) => {
  // 设置编辑状态
  selectedIP.value = expert;
  editMode.value = true;
  editingIPId.value = expert.id;
  
  // 填充表单
  ipForm.project_name = expert.project_name;
  ipForm.group_name = expert.group_name;
  ipForm.expert = expert.expert;
  
  // 填充地址信息
  const expertWithAddress = expert as any; // 临时类型转换
  if (expertWithAddress.province || expertWithAddress.city || expertWithAddress.district) {
    ipForm.province = expertWithAddress.province || '';
    ipForm.city = expertWithAddress.city || '';
    ipForm.district = expertWithAddress.district || '';
    
    // 构建地址数组用于级联选择器
    const addressParts = [];
    if (ipForm.province) addressParts.push(ipForm.province);
    if (ipForm.city) addressParts.push(ipForm.city);
    if (ipForm.district) addressParts.push(ipForm.district);
    ipForm.addressArray = addressParts;
    
    addLog(`填充地址信息: ${ipForm.province} ${ipForm.city} ${ipForm.district}`);
  } else {
    // 清空地址信息
    ipForm.province = '';
    ipForm.city = '';
    ipForm.district = '';
    ipForm.addressArray = [];
    addLog('该专家评分无地址信息');
  }
  
  // 填充指标值
  initializeIndicatorValues();
  filteredThirdIndicators.value.forEach(indicator => {
    const propertyName = getPropertyNameForIndicator(indicator);
    if (propertyName && expert.indicators[propertyName] !== undefined) {
      indicatorValues.value[indicator] = expert.indicators[propertyName];
    }
  });
  
  // 切换到编辑面板
  showExpertPanel.value = false;
  showDataEntryPanel.value = true;
  
  addLog(`编辑专家评分: ${expert.expert} - ${expert.project_name}`);
};

const deleteExpertScore = async (expert: IP) => {
  if (!confirm(`确定要删除专家 "${expert.expert}" 的评分吗？`)) return;
  
  try {
    loading.value = true;
    await ipApi.deleteIP(expert.id);
    addLog(`已删除专家评分: ${expert.expert} - ${expert.project_name}`);
    toast.success('专家评分删除成功');
    
    // 重新加载专家评分
    await loadExpertScores();
    await loadIPs(); // 刷新主列表
  } catch (error) {
    console.error('删除专家评分失败:', error);
    toast.fail('删除专家评分失败');
  } finally {
    loading.value = false;
  }
};

const closeExpertPanel = () => {
  showExpertPanel.value = false;
  showDataEntryPanel.value = true;
  selectedIP.value = null; // 清空选中状态
  selectedIPForExperts.value = null;
  expertScores.value = [];
  averageScores.value = {};
  addLog('关闭多专家评分管理');
};

const getExpertIndicatorScore = (expert: IP, indicator: string): string => {
  const propertyName = getPropertyNameForIndicator(indicator);
  if (propertyName && expert.indicators[propertyName] !== undefined) {
    return expert.indicators[propertyName].toFixed(1);
  }
  return '0.0';
};

// 地址相关方法
const onAddressChange = (value: string[]) => {
  if (value && value.length > 0) {
    ipForm.addressArray = value;
    ipForm.province = value[0] || '';
    ipForm.city = value[1] || '';
    ipForm.district = value[2] || '';
    addLog(`选择地址: ${fullAddress.value}`);
  } else {
    clearAddress();
  }
};

const clearAddress = () => {
  ipForm.addressArray = [];
  ipForm.province = '';
  ipForm.city = '';
  ipForm.district = '';
  addLog('地址已清空');
};

// 计算完整地址
const fullAddress = computed(() => {
  const parts = [ipForm.province, ipForm.city, ipForm.district].filter(part => part && part.trim());
  return parts.length > 0 ? parts.join(' ') : '';
});

// 辅助函数：将中文指标名转换为属性名
const getPropertyNameForIndicator = (indicator: string): string | null => {
  // 使用从后端获取的映射关系
  if (indicatorStructure.value.indicatorPropertyMap) {
    return indicatorStructure.value.indicatorPropertyMap[indicator] || null;
  }
  
  // 如果映射关系未加载，返回null
  return null;
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

.header-btn.import-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.header-btn.import-btn:hover {
  background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
}

.header-btn.entry-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.header-btn.entry-btn:hover {
  background: linear-gradient(135deg, #ee82f0 0%, #f04658 100%);
}

.header-btn.test-btn {
  background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
  color: white;
}

.header-btn.test-btn:hover {
  background: linear-gradient(135deg, #e0a800 0%, #dc6305 100%);
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
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.indicator-inputs h4 {
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  padding-left: 8px;
  border-left: 4px solid #28a745;
}

.inputs-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px 16px;
  flex: 1;
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

/* 主布局样式 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.top-section {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 20px;
  align-items: start;
}

.management-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: 800px;
  display: flex;
  flex-direction: column;
}

.data-entry-panel {
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
  margin-left: 20px;
  min-width: 400px;
  max-height: 800px;
  overflow-y: auto;
}

.data-entry-panel h3 {
  margin-top: 0;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

.ip-management-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 确保可以收缩 */
  max-height: 650px; /* 为数据操作留出至少150px空间 */
}

.ip-management-section h3 {
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.group-filter {
  margin-bottom: 15px;
}

.group-filter label {
  display: block;
  font-size: 13px;
  color: #6c757d;
  font-weight: 500;
  margin-bottom: 6px;
}

.group-filter select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  background: white;
  cursor: pointer;
}

.group-filter select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.ip-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 6px;
  max-height: 500px; /* 减少最大高度，为数据操作留出空间 */
  min-height: 400px; /* 设置最小高度 */
}

.ip-list::-webkit-scrollbar {
  width: 6px;
}

.ip-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.ip-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.ip-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.ip-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ip-item:hover {
  background: #e3f2fd;
  border-color: #007bff;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,123,255,0.15);
}

.ip-item.active {
  background: #d4edda;
  border-color: #28a745;
  box-shadow: 0 2px 8px rgba(40,167,69,0.2);
}

.ip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ip-name {
  font-weight: 600;
  font-size: 14px;
  color: #2c3e50;
}

.ip-actions {
  display: flex;
  gap: 6px;
}

.btn-small {
  padding: 4px 8px;
  font-size: 11px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-edit {
  background: #007bff;
  color: white;
}

.btn-edit:hover {
  background: #0056b3;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}

.ip-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6c757d;
}

.ip-group, .ip-expert, .ip-stats {
  font-weight: 500;
}

.data-operations {
  padding-top: 10px;
  flex-shrink: 0; /* 防止被压缩 */
  min-height: 100px; /* 确保数据操作区域有最小高度 */
}

.data-operations h4 {
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  padding-left: 8px;
  border-left: 4px solid #ffc107;
}

.operation-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.operation-buttons .btn {
  flex: 1;
  min-width: 100px;
  font-size: 12px;
  padding: 8px 12px;
}

.btn-info {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
}

.btn-info:hover {
  background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
}

.btn-danger:hover {
  background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
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

/* 表单相关样式 */
.ip-basic-info {
  margin: 20px 0px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.form-group {
  flex: 1;
  min-width: 200px;
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

.btn-primary {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
}

.btn-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.btn-warning {
  background: linear-gradient(135deg, #ffc107 0%, #ff9a9e 100%);
  color: white;
}

.btn-warning:hover {
  background: linear-gradient(135deg, #e0a800 0%, #ff8a80 100%);
}

.btn-info {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
}

.btn-info:hover {
  background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
}

.btn-light {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  border: 1px solid #dee2e6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ip-management-container {
    padding: 10px;
  }
  
  .top-section {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .management-panel {
    order: 2;
  }
  
  .data-entry-panel {
    order: 1;
  }
  
  .inputs-grid {
    grid-template-columns: 1fr;
    max-height: 300px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .stats-container {
    flex-direction: column;
    gap: 10px;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .header-btn {
    min-width: 120px;
  }
}

@media (max-width: 480px) {
  .header-top {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .header-actions {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .header-btn {
    flex: 1;
    min-width: 100px;
  }
  
  .inputs-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .btn {
    width: 100%;
  }
}

/* 多专家评分面板样式 */
.expert-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  height: 800px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.expert-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}

.expert-panel-header h3 {
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.expert-info {
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.expert-info h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.expert-info p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

.average-scores {
  margin-bottom: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.average-scores h4 {
  margin: 0 0 15px 0;
  color: #155724;
  font-size: 16px;
  font-weight: 600;
}

.average-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  max-height: 150px;
  overflow-y: auto;
}

.average-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.indicator-name {
  font-size: 12px;
  color: #495057;
  font-weight: 500;
  flex: 1;
  margin-right: 8px;
}

.average-value {
  font-size: 14px;
  color: #28a745;
  font-weight: bold;
  min-width: 40px;
  text-align: right;
}

.expert-scores-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.expert-scores-list h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  padding-left: 8px;
  border-left: 4px solid #ffc107;
}

.expert-cards {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  padding-right: 8px;
}

.expert-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.2s ease;
  height: fit-content;
}

.expert-card:hover {
  background: #e3f2fd;
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,123,255,0.15);
}

.expert-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
}

.expert-card-header h5 {
  margin: 0;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.expert-actions {
  display: flex;
  gap: 6px;
}

.expert-indicators {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.indicator-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: white;
  border-radius: 4px;
  font-size: 12px;
}

.indicator-label {
  color: #495057;
  font-weight: 500;
  flex: 1;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.indicator-score {
  color: #007bff;
  font-weight: bold;
  min-width: 30px;
  text-align: right;
}

.more-indicators {
  padding: 4px 8px;
  background: rgba(108, 117, 125, 0.1);
  border-radius: 4px;
  font-size: 11px;
  color: #6c757d;
  text-align: center;
  font-style: italic;
}

/* 地址选择特定样式 */
.address-row {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 20px;
  margin: 15px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.address-row:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.address-row .form-group {
  margin-bottom: 0;
}

.address-row label {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.address-row label::before {
  content: "📍";
  margin-right: 6px;
  font-size: 16px;
}

/* Element Plus Cascader 自定义样式 */
.ip-basic-info :deep(.el-cascader) {
  width: 100%;
}

.ip-basic-info :deep(.el-cascader .el-input) {
  border-radius: 8px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.ip-basic-info :deep(.el-cascader .el-input:hover) {
  border-color: #3182ce;
}

.ip-basic-info :deep(.el-cascader .el-input.is-focus) {
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.ip-basic-info :deep(.el-cascader .el-input__inner) {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  background: #ffffff;
  border: none;
}

.ip-basic-info :deep(.el-cascader .el-input__inner::placeholder) {
  color: #a0aec0;
  font-style: italic;
}

.ip-basic-info :deep(.el-cascader .el-input__suffix) {
  right: 12px;
}

.ip-basic-info :deep(.el-cascader .el-icon) {
  color: #718096;
  transition: color 0.3s ease;
}

.ip-basic-info :deep(.el-cascader:hover .el-icon) {
  color: #3182ce;
}

/* Cascader 下拉面板样式 */
.ip-basic-info :deep(.el-cascader-panel) {
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.ip-basic-info :deep(.el-cascader-menu) {
  border-right: 1px solid #f1f5f9;
}

.ip-basic-info :deep(.el-cascader-menu:last-child) {
  border-right: none;
}

.ip-basic-info :deep(.el-cascader-node) {
  padding: 10px 16px;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 2px 8px;
}

.ip-basic-info :deep(.el-cascader-node:hover) {
  background: linear-gradient(135deg, #ebf4ff 0%, #dbeafe 100%);
  color: #3182ce;
}

.ip-basic-info :deep(.el-cascader-node.is-active) {
  background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%);
  color: white;
  font-weight: 500;
}

.ip-basic-info :deep(.el-cascader-node__label) {
  font-size: 14px;
}

/* 地址显示区域样式 */
.address-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
  border: 2px solid #38a169;
  border-radius: 10px;
  padding: 12px 16px;
  margin-top: 5px;
  transition: all 0.3s ease;
}

.address-display:hover {
  box-shadow: 0 4px 12px rgba(56, 161, 105, 0.15);
  transform: translateY(-1px);
}

.address-text {
  font-size: 14px;
  font-weight: 500;
  color: #22543d;
  background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
}

.address-text::before {
  content: "🏠";
  margin-right: 8px;
  -webkit-text-fill-color: initial;
}

.btn-clear-address {
  background: linear-gradient(135deg, #fed7e2 0%, #fbb6ce 100%);
  border: 1px solid #f687b3;
  color: #b83280;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.btn-clear-address:hover {
  background: linear-gradient(135deg, #fbb6ce 0%, #f687b3 100%);
  color: #97266d;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(184, 50, 128, 0.2);
}

.btn-clear-address:active {
  transform: scale(0.98);
}

/* 改进现有的表单组样式 */
.ip-basic-info .form-group.full-width {
  flex: 100%;
  margin-bottom: 15px;
}

.ip-basic-info .form-group.full-width label {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .address-row {
    padding: 15px;
    margin: 10px 0;
  }
  
  .address-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .btn-clear-address {
    align-self: flex-end;
  }
  
  .ip-basic-info :deep(.el-cascader .el-input__inner) {
    padding: 10px 14px;
    font-size: 13px;
  }
}

/* 加载状态样式 */
.address-row.loading {
  opacity: 0.7;
  pointer-events: none;
}

.address-row.loading::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 地址选择器统一样式 - 替换原有复杂样式 */
.ip-basic-info :deep(.address-cascader) {
  width: 100%;
}

.ip-basic-info :deep(.address-cascader .el-input) {
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: border-color 0.3s ease;
}

.ip-basic-info :deep(.address-cascader .el-input:hover) {
  border-color: #3498db;
}

.ip-basic-info :deep(.address-cascader .el-input.is-focus) {
  border-color: #3498db;
  box-shadow: none;
}

.ip-basic-info :deep(.address-cascader .el-input__inner) {
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  background: #ffffff;
  border: none;
  height: auto;
}

.ip-basic-info :deep(.address-cascader .el-input__inner::placeholder) {
  color: #999;
}

.ip-basic-info :deep(.address-cascader .el-input__suffix) {
  right: 12px;
}

.ip-basic-info :deep(.address-cascader .el-icon) {
  color: #999;
}

/* 地址选择器占据两格宽度 */
.ip-basic-info .form-group.address-group {
  flex: 2;
  min-width: 400px;
}

.ip-basic-info .form-group {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style> 