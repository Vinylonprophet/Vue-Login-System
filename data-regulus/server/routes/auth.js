const express = require('express');
const User = require('../models/User');
const SessionManager = require('../utils/session');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();
const userModel = new User();
const sessionManager = new SessionManager();

// 输入验证函数
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

// 注册接口
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 输入验证
    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        message: '请输入用户名',
        code: 'INVALID_USERNAME'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址',
        code: 'INVALID_EMAIL'
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: '密码至少需要6个字符',
        code: 'INVALID_PASSWORD'
      });
    }

    // 创建用户
    const user = await userModel.createUser({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    res.status(201).json({
      success: true,
      message: '注册成功',
      user: userModel.formatUserResponse(user)
    });

  } catch (error) {
    console.error('注册错误:', error);
    
    if (error.message === '用户已存在') {
      return res.status(409).json({
        success: false,
        message: '该邮箱已被注册',
        code: 'EMAIL_EXISTS'
      });
    }

    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试',
      code: 'REGISTER_ERROR'
    });
  }
});

// 登录接口
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // 输入验证
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址',
        code: 'INVALID_EMAIL'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: '请输入密码',
        code: 'INVALID_PASSWORD'
      });
    }

    // 查找用户
    const user = await userModel.findByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // 检查用户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系管理员',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // 验证密码
    const isValidPassword = await userModel.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // 获取客户端信息
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';

    // 创建会话
    const sessionData = await sessionManager.createSession(user._id, userAgent, ipAddress);

    // 更新最后登录时间
    await userModel.updateLastLogin(user._id);

    // 设置cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 生产环境使用HTTPS
      sameSite: 'lax',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 记住我：7天，否则：1天
    };

    res.cookie('auth_session', sessionData.sessionId, cookieOptions);

    res.json({
      success: true,
      message: '登录成功',
      user: userModel.formatUserResponse(user),
      sessionExpires: sessionData.expiresAt
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试',
      code: 'LOGIN_ERROR'
    });
  }
});

// 登出接口
router.post('/logout', authenticate, async (req, res) => {
  try {
    // 销毁会话
    await sessionManager.destroySession(req.sessionId);
    
    // 清除cookie
    res.clearCookie('auth_session');

    res.json({
      success: true,
      message: '登出成功'
    });

  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '登出失败',
      code: 'LOGOUT_ERROR'
    });
  }
});

// 获取当前用户信息
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      code: 'GET_USER_ERROR'
    });
  }
});

// 检查登录状态
router.get('/status', optionalAuthenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        isLoggedIn: !!req.user,
        user: req.user || null
      }
    });
  } catch (error) {
    console.error('检查登录状态错误:', error);
    res.status(500).json({
      success: false,
      message: '检查登录状态失败',
      code: 'STATUS_ERROR'
    });
  }
});

// 修改密码接口
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供当前密码和新密码',
        code: 'MISSING_PASSWORDS'
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: '新密码至少需要6个字符',
        code: 'INVALID_NEW_PASSWORD'
      });
    }

    // 获取用户完整信息（包含密码）
    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }

    // 验证当前密码
    const isValidPassword = await userModel.validatePassword(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // 更新密码
    await userModel.updateUser(req.user._id, { password: newPassword });

    // 销毁其他会话（强制重新登录）
    await sessionManager.destroyAllUserSessions(req.user._id);

    res.json({
      success: true,
      message: '密码修改成功，请重新登录'
    });

  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

// 获取用户的活跃会话
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await sessionManager.getUserActiveSessions(req.user._id);
    
    // 格式化会话信息（隐藏敏感信息）
    const formattedSessions = sessions.map(session => ({
      sessionId: session.sessionId.substring(0, 8) + '...',
      createdAt: session.createdAt,
      lastAccessAt: session.lastAccessAt,
      expiresAt: session.expiresAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isCurrent: session.sessionId === req.sessionId
    }));

    res.json({
      success: true,
      data: {
        sessions: formattedSessions
      }
    });

  } catch (error) {
    console.error('获取会话列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取会话列表失败',
      code: 'GET_SESSIONS_ERROR'
    });
  }
});

module.exports = router; 