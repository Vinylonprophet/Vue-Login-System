import { createApp } from 'vue'
import router from './router'
import App from './App.vue'

// 导入UnoCSS
import 'uno.css'

// 导入Vant样式
import 'vant/lib/index.css'

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

app.use(router)
app.mount('#app')
