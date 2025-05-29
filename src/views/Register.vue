<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h2>创建账户</h2>
        <p>注册成为新用户</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <div class="form-group">
          <label for="name">姓名</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="请输入您的姓名"
            :class="{ 'error': errors.name }"
            @blur="validateName"
          />
          <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
        </div>
        
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="请输入您的邮箱"
            :class="{ 'error': errors.email }"
            @blur="validateEmail"
          />
          <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <div class="password-input">
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入您的密码"
              :class="{ 'error': errors.password }"
              @blur="validatePassword"
            />
            <button
              type="button"
              class="toggle-password"
              @click="togglePassword"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <div class="password-input">
            <input
              id="confirmPassword"
              v-model="formData.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
              :class="{ 'error': errors.confirmPassword }"
              @blur="validateConfirmPassword"
            />
            <button
              type="button"
              class="toggle-password"
              @click="toggleConfirmPassword"
            >
              {{ showConfirmPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <span v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</span>
        </div>
        
        <div class="form-options">
          <label class="agree-checkbox">
            <input v-model="formData.agree" type="checkbox" required />
            <span>我同意 <a href="#" class="link">服务条款</a> 和 <a href="#" class="link">隐私政策</a></span>
          </label>
        </div>
        
        <button
          type="submit"
          class="register-button"
          :disabled="isLoading"
          :class="{ 'loading': isLoading }"
        >
          <span v-if="!isLoading">立即注册</span>
          <span v-else>注册中...</span>
        </button>
        
        <div class="signin-link">
          已有账户？ <router-link to="/login">立即登录</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const formData = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agree: false
})

const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)

const validateName = () => {
  if (!formData.name.trim()) {
    errors.name = '请输入姓名'
  } else if (formData.name.trim().length < 2) {
    errors.name = '姓名至少需要2个字符'
  } else {
    errors.name = ''
  }
}

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.email) {
    errors.email = '请输入邮箱地址'
  } else if (!emailRegex.test(formData.email)) {
    errors.email = '请输入有效的邮箱地址'
  } else {
    errors.email = ''
  }
}

const validatePassword = () => {
  if (!formData.password) {
    errors.password = '请输入密码'
  } else if (formData.password.length < 6) {
    errors.password = '密码至少需要6个字符'
  } else {
    errors.password = ''
  }
  // 如果确认密码已填写，重新验证确认密码
  if (formData.confirmPassword) {
    validateConfirmPassword()
  }
}

const validateConfirmPassword = () => {
  if (!formData.confirmPassword) {
    errors.confirmPassword = '请确认密码'
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = '两次密码输入不一致'
  } else {
    errors.confirmPassword = ''
  }
}

const validateForm = () => {
  validateName()
  validateEmail()
  validatePassword()
  validateConfirmPassword()
  return !errors.name && !errors.email && !errors.password && !errors.confirmPassword && formData.agree
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const handleRegister = async () => {
  if (!validateForm()) {
    if (!formData.agree) {
      alert('请同意服务条款和隐私政策')
    }
    return
  }
  
  isLoading.value = true
  
  try {
    // 使用认证服务进行注册 - 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('注册成功:', formData)
    alert('注册成功！🎉')
    
    // 注册成功后跳转到登录页面
    router.push('/login')
    
  } catch (error: any) {
    console.error('注册失败:', error)
    alert('注册失败：' + (error?.message || '请重试'))
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(10px);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.register-header h2 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
}

.register-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.register-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #4ade80;
  box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
}

.form-group input.error {
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  color: #666;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

.form-options {
  margin-bottom: 25px;
}

.agree-checkbox {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.4;
}

.agree-checkbox input {
  margin-right: 8px;
  margin-top: 2px;
  width: auto;
  flex-shrink: 0;
}

.agree-checkbox .link {
  color: #4ade80;
  text-decoration: none;
  font-weight: 500;
}

.agree-checkbox .link:hover {
  text-decoration: underline;
}

.register-button {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(74, 222, 128, 0.3);
}

.register-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.register-button.loading {
  position: relative;
}

.signin-link {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.signin-link a {
  color: #4ade80;
  text-decoration: none;
  font-weight: 500;
}

.signin-link a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .register-card {
    padding: 30px 25px;
    margin: 10px;
  }
  
  .form-group {
    margin-bottom: 18px;
  }
}
</style> 