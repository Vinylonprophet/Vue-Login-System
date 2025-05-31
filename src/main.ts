import { createApp } from 'vue'
import router from './router'
import App from './App.vue'

// 导入UnoCSS
import 'uno.css'

// 导入Vant样式
import 'vant/lib/index.css'

// 导入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 添加自定义toast样式
const toastStyles = `
  .warning-toast {
    background: #ff9800 !important;
    color: white !important;
  }
  .warning-toast .van-toast__text {
    color: white !important;
  }
`;

// 创建样式标签
const styleTag = document.createElement('style');
styleTag.textContent = toastStyles;
document.head.appendChild(styleTag);

const app = createApp(App)

// 注册Element Plus
app.use(ElementPlus)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.mount('#app')
