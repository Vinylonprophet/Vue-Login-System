import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import DataAnalysis from '../views/DataAnalysis.vue'
import IPManagement from '../views/IPManagement.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/data-analysis',
    name: 'DataAnalysis',
    component: DataAnalysis
  },
  {
    path: '/ip-management',
    name: 'IPManagement',
    component: IPManagement
  },
  // 404页面重定向到dashboard
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 需要登录验证的页面
router.beforeEach(async (to, _from, next) => {
  // 不需要登录验证的页面
  const publicRoutes = ['/login', '/register']

  // 如果是公开页面，直接通过
  if (publicRoutes.includes(to.path)) {
    next()
    return
  }

  try {
    // 检查登录状态
    const response = await fetch('/v1/auth/status', {
      method: 'GET',
      credentials: 'include'
    })
    
    const result = await response.json()
    
    if (result.success && result.data?.isLoggedIn) {
      // 已登录，允许访问
      next()
    } else {
      // 未登录，重定向到登录页
      next('/login')
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
    // 网络错误或其他问题，重定向到登录页
      next('/login')
  }
})

export default router 