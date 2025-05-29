const { client } = require('../config/database');
const crypto = require('crypto');

class SessionManager {
  constructor() {
    this.collection = client.db('auth').collection('sessions');
    // 会话过期时间 (7天)
    this.sessionTTL = 7 * 24 * 60 * 60 * 1000;
  }

  // 生成安全的会话ID
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  // 创建新会话
  async createSession(userId, userAgent = '', ipAddress = '') {
    try {
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + this.sessionTTL);

      const session = {
        sessionId,
        userId: userId.toString(),
        createdAt: new Date(),
        expiresAt,
        userAgent,
        ipAddress,
        isActive: true
      };

      await this.collection.insertOne(session);
      
      return {
        sessionId,
        expiresAt
      };
    } catch (error) {
      throw error;
    }
  }

  // 验证会话
  async validateSession(sessionId) {
    try {
      const session = await this.collection.findOne({
        sessionId,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (!session) {
        return null;
      }

      // 更新最后访问时间
      await this.collection.updateOne(
        { sessionId },
        { $set: { lastAccessAt: new Date() } }
      );

      return session;
    } catch (error) {
      throw error;
    }
  }

  // 删除会话（登出）
  async destroySession(sessionId) {
    try {
      await this.collection.updateOne(
        { sessionId },
        { $set: { isActive: false, destroyedAt: new Date() } }
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  // 删除用户的所有会话
  async destroyAllUserSessions(userId) {
    try {
      await this.collection.updateMany(
        { userId: userId.toString(), isActive: true },
        { $set: { isActive: false, destroyedAt: new Date() } }
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  // 清理过期会话（定期任务）
  async cleanupExpiredSessions() {
    try {
      const result = await this.collection.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      console.log(`清理了 ${result.deletedCount} 个过期会话`);
      return result.deletedCount;
    } catch (error) {
      throw error;
    }
  }

  // 获取用户的活跃会话
  async getUserActiveSessions(userId) {
    try {
      return await this.collection.find({
        userId: userId.toString(),
        isActive: true,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 }).toArray();
    } catch (error) {
      throw error;
    }
  }

  // 续期会话
  async renewSession(sessionId) {
    try {
      const newExpiresAt = new Date(Date.now() + this.sessionTTL);
      await this.collection.updateOne(
        { sessionId, isActive: true },
        { $set: { expiresAt: newExpiresAt, lastAccessAt: new Date() } }
      );
      return newExpiresAt;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SessionManager; 