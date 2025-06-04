const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { connectToDB } = require('./server/utils/database');
const morgan = require('morgan');
const ipRoutes = require('./server/routes/ipRoutes');

const healthRouter = require('./server/routes/health');
const authRouter = require('./server/routes/auth');

const app = express();
const port = process.env.PORT || 80;
const host = '0.0.0.0';

// 中间件配置
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001', "http://172.26.0.25:5173"], // 允许前端域名
  credentials: true // 允许发送cookies
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // 解析cookies

// 静态文件服务配置
app.use(express.static(path.join(__dirname, "dist"))); // 前端打包文件
app.use(express.static(path.join("data-regulus")))
app.use(express.static(path.join("card-crawl")))
app.use(morgan('combined'));

// routes
app.use('/', healthRouter);
app.use('/v1/auth', authRouter); // 身份验证路由
app.use('/api/ip', ipRoutes);

app.get('/data-dominus/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'data-dominus', 'index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: '少数民族民俗体育IP综合评估系统'
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        message: '少数民族民俗体育IP综合评估与排序系统后端服务',
        version: '1.0.0',
        endpoints: {
            indicators: '/api/ip/indicators',
            ips: '/api/ip/ips',
            evaluate: '/api/ip/evaluate',
            clustering: '/api/ip/clustering',
            history: '/api/ip/history',
            statistics: '/api/ip/statistics'
        }
    });
});

// 前端路由支持 - 必须放在所有API路由之后
app.get('*', (req, res) => {
    // 如果请求的是API路径，返回404
    if (req.path.startsWith('/api/') || req.path.startsWith('/v1/')) {
        return res.status(404).json({
            success: false,
            message: '接口不存在'
        });
    }
    
    // 对于前端路由，返回index.html让前端路由器处理
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, host, async () => {
  await connectToDB();
  console.log(`Server running at http://${host}:${port}`);
  console.log('身份验证API可用:');
  console.log('  POST /v1/auth/register - 用户注册');
  console.log('  POST /v1/auth/login - 用户登录');
  console.log('  POST /v1/auth/logout - 用户登出');
  console.log('  GET  /v1/auth/me - 获取当前用户信息');
  console.log('  GET  /v1/auth/status - 检查登录状态');
  console.log(`🚀 IP评估系统后端服务启动成功`);
  console.log(`📍 服务地址: http://localhost:${port}`);
  console.log(`🏥 健康检查: http://localhost:${port}/health`);
  console.log(`📚 API文档: http://localhost:${port}/api/ip`);
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});


