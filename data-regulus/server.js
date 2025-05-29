const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { connectToDB } = require('./server/utils/database');

const healthRouter = require('./server/routes/health');
const authRouter = require('./server/routes/auth');

const app = express();
const port = 3001;

// 中间件配置
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // 允许前端域名
  credentials: true // 允许发送cookies
}));
app.use(express.json());
app.use(cookieParser()); // 解析cookies
app.use(express.static(path.join("data-regulus")))
app.use(express.static(path.join("card-crawl")))

// routes
app.use('/', healthRouter);
app.use('/v1/auth', authRouter); // 身份验证路由

app.get('/data-dominus/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'data-dominus', 'index.html'));
});

app.listen(port, async () => {
  await connectToDB();
  console.log(`Server running at http://localhost:${port}`);
  console.log('身份验证API可用:');
  console.log('  POST /v1/auth/register - 用户注册');
  console.log('  POST /v1/auth/login - 用户登录');
  console.log('  POST /v1/auth/logout - 用户登出');
  console.log('  GET  /v1/auth/me - 获取当前用户信息');
  console.log('  GET  /v1/auth/status - 检查登录状态');
});
