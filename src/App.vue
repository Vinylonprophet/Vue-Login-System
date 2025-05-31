<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from './utils/api'

const router = useRouter()
const route = useRoute()

const isLoggedIn = ref(false)
const showNav = ref(true)

// 不显示导航的页面
const hideNavRoutes = ['/login', '/register']

// 检查登录状态的函数
const checkLoginStatus = async () => {
  try {
    const response = await authApi.checkLoginStatus()
    isLoggedIn.value = response.success && (response.data?.isLoggedIn ?? false)
  } catch (error) {
    isLoggedIn.value = false
  }
}
  
// 更新导航栏显示状态
const updateNavVisibility = () => {
  showNav.value = hideNavRoutes.indexOf(route.path) === -1
}

onMounted(async () => {
  await checkLoginStatus()
  updateNavVisibility()
})

// 监听路由变化
watch(() => route.path, () => {
  updateNavVisibility()
  // 如果从登录页面离开，重新检查登录状态
  if (route.path !== '/login' && route.path !== '/register') {
    checkLoginStatus()
  }
})

const logout = async () => {
  try {
    await authApi.logout()
    isLoggedIn.value = false
    router.push('/login')
  } catch (error) {
    console.error('登出失败:', error)
  }
}
</script>

<template>
  <div id="app">
    <!-- 导航栏 -->
    <nav v-if="showNav" class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <router-link to="/dashboard" class="brand-link">
            体育IP评估系统
          </router-link>
        </div>
        
        <div class="nav-menu">
          <router-link to="/dashboard" class="nav-link">
            <span class="nav-icon">🗺️</span>
            可视化大屏
          </router-link>
          
          <router-link to="/data-analysis" class="nav-link">
            <span class="nav-icon">📊</span>
            数据分析
          </router-link>
          
          <router-link to="/ip-management" class="nav-link">
            <span class="nav-icon">🗂️</span>
            数据管理
          </router-link>
        </div>
        
        <div class="nav-user" v-if="isLoggedIn">
          <button @click="logout" class="logout-btn">
            <span class="nav-icon">🚪</span>
            登出
          </button>
        </div>
        <div class="nav-auth" v-else>
          <router-link to="/login" class="auth-link">登录</router-link>
          <router-link to="/register" class="auth-link">注册</router-link>
        </div>
      </div>
    </nav>
    
    <!-- 主要内容 -->
    <main :class="{ 'with-nav': showNav }">
      <router-view />
    </main>
  </div>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
}

/* 导航栏样式 */
.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 60px;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.nav-brand {
  font-size: 18px;
  font-weight: bold;
}

.brand-link {
  color: white;
  text-decoration: none;
  transition: opacity 0.2s;
}

.brand-link:hover {
  opacity: 0.8;
}

.nav-menu {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s;
  font-size: 14px;
}

.nav-link:hover {
  background-color: rgba(255,255,255,0.1);
}

.nav-link.router-link-active {
  background-color: rgba(255,255,255,0.2);
}

.nav-icon {
  font-size: 16px;
}

.nav-user, .nav-auth {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logout-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s;
  font-size: 14px;
}

.logout-btn:hover {
  background-color: rgba(255,255,255,0.1);
}

.auth-link {
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s;
  font-size: 14px;
}

.auth-link:hover {
  background-color: rgba(255,255,255,0.1);
}

/* 主要内容区域 */
main {
  min-height: 100vh;
}

main.with-nav {
  padding-top: 60px;
  min-height: calc(100vh - 60px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 15px;
  }
  
  .nav-menu {
    gap: 15px;
  }
  
  .nav-link, .logout-btn, .auth-link {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .brand-link {
    font-size: 16px;
  }
  
  .nav-icon {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .nav-menu {
    gap: 10px;
  }
  
  .nav-link span:not(.nav-icon), 
  .logout-btn span:not(.nav-icon) {
    display: none;
  }
  
  .brand-link {
    font-size: 14px;
  }
}
</style>
