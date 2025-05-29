const { client } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  constructor() {
    this.collection = client.db('auth').collection('users');
  }

  async createUser(userData) {
    try {
      // 检查用户是否已存在
      const existingUser = await this.collection.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('用户已存在');
      }

      // 加密密码
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // 创建用户对象
      const user = {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      // 插入用户
      const result = await this.collection.insertOne(user);
      
      // 返回用户信息（不包含密码）
      const { password, ...userWithoutPassword } = user;
      return { ...userWithoutPassword, _id: result.insertedId };
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      return await this.collection.findOne({ email });
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      const { ObjectId } = require('mongodb');
      return await this.collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      throw error;
    }
  }

  async validatePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw error;
    }
  }

  async updateLastLogin(userId) {
    try {
      const { ObjectId } = require('mongodb');
      await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
      );
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const { ObjectId } = require('mongodb');
      const { password, ...dataToUpdate } = updateData;
      
      // 如果需要更新密码，先加密
      if (password) {
        const saltRounds = 12;
        dataToUpdate.password = await bcrypt.hash(password, saltRounds);
      }
      
      dataToUpdate.updatedAt = new Date();
      
      const result = await this.collection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: dataToUpdate }
      );
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // 获取用户信息（不包含密码）
  formatUserResponse(user) {
    if (!user) return null;
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

module.exports = User; 