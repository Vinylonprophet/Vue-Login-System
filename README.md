# Vue 登录应用

一个使用 Vue 3 + TypeScript + Vue Router + UnoCSS 构建的现代化登录应用。

## 功能特性

- 🚀 Vue 3 + TypeScript
- 🛣️ Vue Router 4 路由管理
- 🎨 UnoCSS 原子化CSS框架
- 📱 响应式设计
- 🔐 登录/注册表单

## 项目结构

```
src/
├── components/          # 可复用组件
├── views/              # 页面组件
│   ├── Home.vue        # 首页
│   ├── Login.vue       # 登录页
│   └── Register.vue    # 注册页
├── router/             # 路由配置
│   └── index.ts        # 路由定义
├── App.vue             # 根组件
└── main.ts             # 应用入口
```

## 路由

- `/` - 首页
- `/login` - 登录页
- `/register` - 注册页

## UnoCSS 配置

项目已配置 UnoCSS，包含：
- 预设样式（presetUno）
- 字体预设（presetWebFonts）
- 排版预设（presetTypography）
- 自定义快捷样式（shortcuts）

### 可用的快捷样式

- `btn` - 基础按钮样式
- `btn-primary` - 主要按钮（蓝色）
- `btn-secondary` - 次要按钮（灰色）
- `input-field` - 输入框样式

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 使用说明

1. 访问首页可以看到登录和注册的入口
2. 登录页面包含邮箱、密码输入和记住我选项
3. 注册页面包含姓名、邮箱、密码确认等字段
4. 所有表单都有基本的验证逻辑
5. 使用 UnoCSS 提供现代化的样式设计

## 技术栈

- **Vue 3** - 前端框架
- **TypeScript** - 类型安全
- **Vue Router 4** - 路由管理
- **UnoCSS** - 原子化CSS
- **Vite** - 构建工具
