import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import IPEvaluation from '../views/IPEvaluation.vue'
import { authApi } from '../utils/api'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/ip-evaluation',
    name: 'IPEvaluation',
    component: IPEvaluation,
    meta: { requiresAuth: true } // 需要登录才能访问数据浏览系统
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

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth
  const requiresGuest = to.meta.requiresGuest

  // 如果路由不需要认证，直接放行
  if (requiresAuth === false) {
    next()
    return
  }

  try {
    // 检查登录状态
    const response = await authApi.checkLoginStatus()
    const isLoggedIn = response.success && response.data?.isLoggedIn

    if (requiresAuth && !isLoggedIn) {
      // 需要登录但未登录，跳转到登录页
      next('/login')
    } else if (requiresGuest && isLoggedIn) {
      // 需要游客状态但已登录，跳转到dashboard
      next('/dashboard')
    } else {
      next()
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
    
    if (requiresAuth) {
      // 如果需要登录权限但检查失败，跳转到登录页
      next('/login')
    } else {
      next()
    }
  }
})

export default router 