// API服务配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// 通用请求函数
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    credentials: 'include',
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

// 通用响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  user?: User;
  code?: string;
}

// 用户相关接口
export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  name: string;
  sessionExpires: string;
}

export interface RegisterResponse {
  user: User;
}

// IP评估相关接口
export interface IP {
  id: string;
  project_name: string;
  group_name: string;
  expert: string;
  indicators: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  expertCount?: number; // 专家数量（聚合记录）
  _isGroup?: boolean; // 标识是否为聚合记录
}

export interface EvaluationResult {
  scores: number[];
  weights: number[];
  fitnessHistory: number[][];
  errors: number[];
  selectedIndicators?: string[];
  evaluation: {
    name: string;
    group: string;
    score: number;
    error: number;
    rank: number;
  }[];
  historyId: string;
}

export interface ClusteringResult {
  clusters: {
    assignment: number[];
    centroids: number[][];
  };
  clusterAssignment: number[];
  centroids: number[][];
  ipsWithClusters: (IP & { cluster: number })[];
}

export interface IndicatorStructure {
  firstLevel: string[];
  secondLevel: string[];
  firstToSecond: Record<string, string[]>;
  secondToThird: Record<string, string[]>;
  allThird: string[];
  indicatorPropertyMap: Record<string, string>;
  propertyIndicatorMap: Record<string, string>;
  allProperties: string[];
}

// API客户端类
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 认证相关方法
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.post('/v1/auth/login', data);
  }

  async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return this.post('/v1/auth/register', data);
  }

  async getUserInfo(): Promise<ApiResponse<{ user: User }>> {
    return this.get('/v1/auth/me');
  }

  async logout(): Promise<ApiResponse> {
    return this.post('/v1/auth/logout');
  }

  async checkLoginStatus(): Promise<ApiResponse<{ isLoggedIn: boolean; user: User | null }>> {
    return this.get('/v1/auth/status');
  }
}

// IP评估API
export const ipApi = {
  // 获取指标结构
  getIndicators: () => 
    apiRequest<ApiResponse<IndicatorStructure>>('/api/ip/indicators'),

  // 获取筛选后的三级指标
  getFilteredIndicators: (selectedFirst: string[], selectedSecond: string[]) =>
    apiRequest<ApiResponse<string[]>>('/api/ip/indicators/filtered', {
      method: 'POST',
      body: JSON.stringify({ selectedFirst, selectedSecond }),
    }),

  // 获取所有IP
  getAllIPs: (group?: string) =>
    apiRequest<ApiResponse<IP[]>>(`/api/ip/ips${group ? `?group=${encodeURIComponent(group)}` : ''}`),

  // 获取特定IP的所有专家评分
  getExpertScoresByIP: (project_name: string, group_name: string) =>
    apiRequest<ApiResponse<IP[]>>(`/api/ip/ips/${encodeURIComponent(project_name)}/${encodeURIComponent(group_name)}/experts`),

  // 添加IP
  addIP: (ip: Omit<IP, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiRequest<ApiResponse<IP>>('/api/ip/ips', {
      method: 'POST',
      body: JSON.stringify(ip),
    }),

  // 更新IP
  updateIP: (id: string, updates: Partial<IP>) =>
    apiRequest<ApiResponse<IP>>(`/api/ip/ips/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // 删除IP
  deleteIP: (id: string) =>
    apiRequest<ApiResponse<IP>>(`/api/ip/ips/${id}`, {
      method: 'DELETE',
    }),

  // 批量添加IP
  addBatchIPs: (ips: Omit<IP, 'id' | 'createdAt' | 'updatedAt'>[]) =>
    apiRequest<ApiResponse<{
      addedIPs: IP[];
      errors: { index: number; ip: any; error: string }[];
    }>>('/api/ip/ips/batch', {
      method: 'POST',
      body: JSON.stringify({ ips }),
    }),

  // 获取所有组别
  getGroups: () =>
    apiRequest<ApiResponse<string[]>>('/api/ip/groups'),

  // IP评估
  evaluate: (group: string = '全部', selectedIndicators?: string[]) =>
    apiRequest<ApiResponse<EvaluationResult>>('/api/ip/evaluate', {
      method: 'POST',
      body: JSON.stringify({ group, selectedIndicators }),
    }),

  // 评估选中的IP
  evaluateSelected: (selectedIPs: IP[], selectedIndicators?: string[]) =>
    apiRequest<ApiResponse<EvaluationResult>>('/api/ip/evaluate-selected', {
      method: 'POST',
      body: JSON.stringify({ selectedIPs, selectedIndicators }),
    }),

  // 聚类分析
  clustering: (group: string = '全部', clusterCount: number = 2) =>
    apiRequest<ApiResponse<ClusteringResult>>('/api/ip/clustering', {
      method: 'POST',
      body: JSON.stringify({ group, clusterCount }),
    }),

  // 获取评估历史
  getHistory: () =>
    apiRequest<ApiResponse<any[]>>('/api/ip/history'),

  // 获取特定历史记录
  getHistoryById: (id: string) =>
    apiRequest<ApiResponse<any>>(`/api/ip/history/${id}`),

  // 生成测试数据
  generateTestData: (count: number = 10) =>
    apiRequest<ApiResponse<{
      addedIPs: IP[];
      errors: any[];
    }>>('/api/ip/test-data', {
      method: 'POST',
      body: JSON.stringify({ count }),
    }),

  // 获取统计信息
  getStatistics: () =>
    apiRequest<ApiResponse<{
      totalIPs: number;
      totalGroups: number;
      groupStats: { group: string; count: number }[];
      totalEvaluations: number;
      lastEvaluationAt: string | null;
    }>>('/api/ip/statistics'),

  // 导出数据
  exportData: () =>
    apiRequest<any>('/api/ip/export'),

  // 导入数据
  importData: (data: any) =>
    apiRequest<ApiResponse<{
      ipsCount: number;
      historyCount: number;
    }>>('/api/ip/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Excel导入数据
  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetch(`${API_BASE_URL}/api/ip/import-excel`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    }).then(async response => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '导入失败');
      }
      return data;
    });
  },

  // 清空所有数据
  clearAll: () =>
    apiRequest<ApiResponse<null>>('/api/ip/clear-all', {
      method: 'DELETE',
    }),

  // AI分析接口
  aiAnalysis: (analysisData: any, chartTypes: string[]) =>
    apiRequest<ApiResponse<{
      analysis: string;
      model: string;
      usage: any;
      timestamp: string;
    }>>('/api/ip/ai-analysis', {
      method: 'POST',
      body: JSON.stringify({ analysisData, chartTypes }),
    })
};

// 认证API实例
const authApi = new ApiClient(API_BASE_URL);

export { authApi }; 

// 为了兼容性，也导出为apiClient
export const apiClient = authApi;

// Python ML API 基础URL
const PYTHON_ML_API_BASE = 'http://localhost:5001/api';

// Python ML API 调用函数
export const pythonMLApi = {
  // 神经网络训练
  trainNeuralNetwork: (ips: any[], featureNames?: string[]) => 
    fetch(`${PYTHON_ML_API_BASE}/neural-network/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ips, feature_names: featureNames })
    }).then(res => res.json()).then(data => {
      return data.error ? { success: false, error: data.error } : { success: true, data };
    }),

  // SHAP模型解释
  shapExplain: (ips: any[], featureNames?: string[]) => 
    fetch(`${PYTHON_ML_API_BASE}/shap/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ips, feature_names: featureNames })
    }).then(res => res.json()).then(data => {
      return data.error ? { success: false, error: data.error } : { success: true, data };
    }),

  // PCA降维分析
  pcaAnalysis: (ips: any[], nComponents: number = 2) => 
    fetch(`${PYTHON_ML_API_BASE}/pca/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ips, n_components: nComponents })
    }).then(res => res.json()).then(data => {
      return data.error ? { success: false, error: data.error } : { success: true, ...data };
    }),

  // 高级聚类分析
  advancedClustering: (ips: any[], nClusters: number = 2, usePCA: boolean = true) => 
    fetch(`${PYTHON_ML_API_BASE}/clustering/advanced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ips, n_clusters: nClusters, use_pca: usePCA })
    }).then(res => res.json()).then(data => {
      return data.error ? { success: false, error: data.error } : { success: true, data };
    }),

  // 生成高级可视化图表
  generateAdvancedPlot: (plotType: string, plotData: any) => 
    fetch(`${PYTHON_ML_API_BASE}/visualization/advanced-plot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plot_type: plotType, data: plotData })
    }).then(res => res.json()).then(data => {
      return data.error ? { success: false, error: data.error } : { success: true, ...data };
    }),

  // 获取每日体育动态
  getDailySportsNews: () => 
    fetch(`${PYTHON_ML_API_BASE}/sports-news/daily`).then(res => res.json()).then(data => {
      return data.error ? { success: false, error: data.error } : { success: true, data };
    }),

  // 健康检查
  healthCheck: () => 
    fetch(`${PYTHON_ML_API_BASE}/health`).then(res => res.json())
}; 