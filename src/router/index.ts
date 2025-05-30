import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import IPEvaluation from '../views/IPEvaluation.vue'
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
    path: '/ip-evaluation',
    name: 'IPEvaluation',
    component: IPEvaluation
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

// 暂时禁用路由守卫
router.beforeEach(async (_to, _from, next) => {
      next()
})

export default router 