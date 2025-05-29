const User = require('../models/User');
const SessionManager = require('../utils/session');

const userModel = new User();
const sessionManager = new SessionManager();

// 身份验证中间件
const authenticate = async (req, res, next) => {
  try {
    // 从cookie中获取会话ID
    const sessionId = req.cookies?.auth_session;
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: '未登录，请先登录',
        code: 'UNAUTHORIZED'
      });
    }

    // 验证会话
    const session = await sessionManager.validateSession(sessionId);
    if (!session) {
      // 清除无效的cookie
      res.clearCookie('auth_session');
      return res.status(401).json({
        success: false,
        message: '会话已过期，请重新登录',
        code: 'SESSION_EXPIRED'
      });
    }

    // 获取用户信息
    const user = await userModel.findById(session.userId);
    if (!user || !user.isActive) {
      // 清除无效的cookie
      res.clearCookie('auth_session');
      await sessionManager.destroySession(sessionId);
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用',
        code: 'USER_DISABLED'
      });
    }

    // 将用户信息添加到请求对象中
    req.user = userModel.formatUserResponse(user);
    req.sessionId = sessionId;
    
    next();
  } catch (error) {
    console.error('身份验证错误:', error);
    return res.status(500).json({
      success: false,
      message: '身份验证失败',
      code: 'AUTH_ERROR'
    });
  }
};

// 可选的身份验证中间件（不强制要求登录）
const optionalAuthenticate = async (req, res, next) => {
  try {
    const sessionId = req.cookies?.auth_session;
    
    if (sessionId) {
      const session = await sessionManager.validateSession(sessionId);
      if (session) {
        const user = await userModel.findById(session.userId);
        if (user && user.isActive) {
          req.user = userModel.formatUserResponse(user);
          req.sessionId = sessionId;
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('可选身份验证错误:', error);
    next(); // 即使出错也继续执行
  }
};

// 检查用户角色的中间件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录',
        code: 'UNAUTHORIZED'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'FORBIDDEN'
      });
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireRole
}; 