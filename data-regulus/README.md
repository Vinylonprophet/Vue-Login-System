# Data Regulus 身份验证系统

基于 Express + MongoDB + Cookie 的用户身份验证系统。

## 功能特性

- ✅ 用户注册和登录
- ✅ 基于Cookie的会话管理
- ✅ 密码加密存储 (bcrypt)
- ✅ 会话过期和清理
- ✅ 跨域支持 (CORS)
- ✅ 输入验证和错误处理
- ✅ 安全的密码修改
- ✅ 多设备会话管理

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动 MongoDB

确保本地 MongoDB 服务正在运行：

```bash
# macOS (使用 Homebrew)
brew services start mongodb-community

# 或者直接启动
mongod
```

### 3. 启动服务器

```bash
npm start
```

服务器将在 `http://localhost` (端口80) 上运行。

## API 接口

### 身份验证相关

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/v1/auth/register` | 用户注册 |
| POST | `/v1/auth/login` | 用户登录 |
| POST | `/v1/auth/logout` | 用户登出 |
| GET | `/v1/auth/me` | 获取当前用户信息 |
| GET | `/v1/auth/status` | 检查登录状态 |
| PUT | `/v1/auth/change-password` | 修改密码 |
| GET | `/v1/auth/sessions` | 获取用户会话列表 |

### 请求示例

#### 用户注册
```bash
curl -X POST http://localhost/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "email": "zhangsan@example.com",
    "password": "123456"
  }'
```

#### 用户登录
```bash
curl -X POST http://localhost/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "zhangsan@example.com",
    "password": "123456",
    "rememberMe": true
  }'
```

#### 获取用户信息
```bash
curl -X GET http://localhost/v1/auth/me \
  -b cookies.txt
```

## 数据库结构

### 用户集合 (auth.users)
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (唯一),
  password: String (加密),
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date,
  isActive: Boolean
}
```

### 会话集合 (auth.sessions)
```javascript
{
  _id: ObjectId,
  sessionId: String (唯一),
  userId: String,
  createdAt: Date,
  expiresAt: Date,
  lastAccessAt: Date,
  userAgent: String,
  ipAddress: String,
  isActive: Boolean
}
```

## 配置说明

### 数据库配置
文件位置: `server/config/database.js`

```javascript
// 本地 MongoDB
const uri = 'mongodb://127.0.0.1:27017';

// 远程 MongoDB (如需要)
// const uri = 'mongodb://username:password@host:port/database';
```

### 会话配置
- 会话有效期：7天
- Cookie 安全设置：
  - `httpOnly: true` - 防止 XSS
  - `secure: false` - 开发环境，生产环境应设为 true
  - `sameSite: 'lax'` - CSRF 保护

## 安全特性

1. **密码安全**
   - 使用 bcrypt 加密，盐轮数为 12
   - 不在响应中返回密码字段

2. **会话安全**
   - 使用加密安全的随机会话ID
   - 自动过期和清理机制
   - 支持强制登出所有设备

3. **输入验证**
   - 邮箱格式验证
   - 密码最小长度要求
   - 防止 SQL 注入和 XSS

4. **CORS 配置**
   - 限制允许的前端域名
   - 支持凭证发送

## 开发工具

### 使用 nodemon 进行开发
```bash
npm run dev
```

### 数据库管理
推荐使用 MongoDB Compass 或命令行工具进行数据库管理。

## 错误处理

系统包含完整的错误处理机制：

- 输入验证错误 (400)
- 身份验证错误 (401)
- 权限不足错误 (403)
- 资源不存在错误 (404)
- 冲突错误 (409)
- 服务器内部错误 (500)

## 生产部署注意事项

1. 设置环境变量 `NODE_ENV=production`
2. 使用 HTTPS (设置 `secure: true`)
3. 配置反向代理 (如 Nginx)
4. 设置适当的防火墙规则
5. 定期备份数据库
6. 监控日志和性能

## 许可证

ISC 