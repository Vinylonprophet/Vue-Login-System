<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="header-content">
        <div class="user-info">
          <div class="user-avatar">
            <span>{{ userInitials }}</span>
          </div>
          <div class="user-details">
            <h2>欢迎回来, {{ user?.username || '用户' }}</h2>
            <p>{{ user?.email }}</p>
          </div>
        </div>
        <button @click="logout" class="logout-btn">
          <span>退出登录</span>
        </button>
      </div>
    </header>

    <main class="dashboard-main">
      <div class="dashboard-content">
        <div class="welcome-card">
          <h3>仪表板</h3>
          <p>这是您的个人工作台，您可以在这里管理您的账户和查看相关信息。</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card" @click="goToDataBrowser">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h4>数据浏览</h4>
              <p>查看和管理您的数据</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⚙️</div>
            <div class="stat-content">
              <h4>设置</h4>
              <p>管理您的账户设置</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <h4>分析报告</h4>
              <p>查看详细分析数据</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">💬</div>
            <div class="stat-content">
              <h4>消息中心</h4>
              <p>查看最新消息通知</p>
            </div>
          </div>
        </div>

        <div class="recent-activity">
          <h3>最近活动</h3>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-dot"></div>
              <div class="activity-content">
                <p>成功登录系统</p>
                <span class="activity-time">刚刚</span>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-dot"></div>
              <div class="activity-content">
                <p>更新了个人信息</p>
                <span class="activity-time">2小时前</span>
              </div>
            </div>
            <div class="activity-item">
              <div class="activity-dot"></div>
              <div class="activity-content">
                <p>查看了数据报告</p>
                <span class="activity-time">1天前</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '../utils/api'

const router = useRouter()
const user = ref<any>(null)
const loading = ref(true)

const userInitials = computed(() => {
  if (!user.value?.username) return 'U'
  return user.value.username.substring(0, 2).toUpperCase()
})

onMounted(async () => {
  try {
    const response = await apiClient.getUserInfo()
    user.value = response.user
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 如果获取用户信息失败，重定向到登录页
    router.push('/login')
  } finally {
    loading.value = false
  }
})

const logout = async () => {
  try {
    await apiClient.logout()
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    // 即使退出失败，也跳转到登录页
    router.push('/login')
  }
}

const goToDataBrowser = () => {
  router.push('/ip-evaluation')
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.dashboard-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
}

.user-details h2 {
  color: white;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.user-details p {
  color: rgba(255, 255, 255, 0.8);
  margin: 0.25rem 0 0 0;
  font-size: 0.9rem;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.dashboard-main {
  padding: 2rem;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.welcome-card h3 {
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.welcome-card p {
  color: #666;
  margin: 0;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 12px;
}

.stat-content h4 {
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.stat-content p {
  color: #666;
  margin: 0;
  font-size: 0.9rem;
}

.recent-activity {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.recent-activity h3 {
  color: #333;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.activity-list {
  space-y: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-content p {
  color: #333;
  margin: 0 0 0.25rem 0;
  font-weight: 500;
}

.activity-time {
  color: #888;
  font-size: 0.85rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    padding: 0 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .user-info {
    flex-direction: column;
    text-align: center;
  }

  .dashboard-main {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .welcome-card, .recent-activity {
    padding: 1.5rem;
  }

  .user-details h2 {
    font-size: 1.3rem;
  }
}
</style> 