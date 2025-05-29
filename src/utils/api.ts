// API基础配置
const API_BASE_URL = 'http://localhost:3001'

// API请求类
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // 包含cookies
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('网络请求失败')
    }
  }

  // GET请求
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  // POST请求
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT请求
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE请求
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient(API_BASE_URL)

// 类型定义
export interface User {
  _id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  isActive: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  code?: string
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  sessionExpires: string
}

export interface RegisterResponse {
  user: User
}

// 身份验证API
export const authApi = {
  // 用户注册
  async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return apiClient.post('/v1/auth/register', data)
  },

  // 用户登录
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post('/v1/auth/login', data)
  },

  // 用户登出
  async logout(): Promise<ApiResponse> {
    return apiClient.post('/v1/auth/logout')
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get('/v1/auth/me')
  },

  // 检查登录状态
  async checkLoginStatus(): Promise<ApiResponse<{ isLoggedIn: boolean; user: User | null }>> {
    return apiClient.get('/v1/auth/status')
  },

  // 修改密码
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return apiClient.put('/v1/auth/change-password', data)
  },

  // 获取用户会话列表
  async getSessions(): Promise<ApiResponse<{ sessions: any[] }>> {
    return apiClient.get('/v1/auth/sessions')
  }
} 