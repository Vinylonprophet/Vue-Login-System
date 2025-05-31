const { client } = require('../config/database');
const { ObjectId } = require('mongodb');
const ipEvaluationService = require('../services/ipEvaluationService');

// IP数据模型 - 使用MongoDB持久化存储
class IPModel {
    constructor() {
        this.db = null;
        this.ipsCollection = null;
        this.historyCollection = null;
        this.idCounter = 0;
        this.initDB();
    }

    // 初始化数据库连接
    async initDB() {
        try {
            this.db = client.db('ip_evaluation_system');
            this.ipsCollection = this.db.collection('ips');
            this.historyCollection = this.db.collection('evaluation_history');
            
            // 删除旧的索引
            try {
                await this.ipsCollection.dropIndex('name_1_group_1');
            } catch (error) {
                // 索引不存在时忽略错误
                console.log('旧索引不存在，跳过删除');
            }
            
            // 创建新的复合唯一索引：name + group + expert + userId
            await this.ipsCollection.createIndex({ name: 1, group: 1, expert: 1, userId: 1 }, { unique: true });
            await this.ipsCollection.createIndex({ group: 1 });
            await this.ipsCollection.createIndex({ userId: 1 });
            await this.historyCollection.createIndex({ timestamp: -1 });
            
            console.log('IP数据库模型初始化成功');
        } catch (error) {
            console.error('IP数据库模型初始化失败:', error);
        }
    }

    // 确保数据库连接
    async ensureDB() {
        if (!this.db) {
            await this.initDB();
        }
    }

    // 生成唯一ID的方法
    generateUniqueId() {
        return `${Date.now()}-${++this.idCounter}`;
    }

    // 验证IP数据格式
    validateIP(ip) {
        if (!ip || typeof ip !== 'object') {
            throw new Error('IP数据必须是对象');
        }

        if (!ip.name || typeof ip.name !== 'string') {
            throw new Error('IP名称必须是非空字符串');
        }

        if (!ip.group || typeof ip.group !== 'string') {
            throw new Error('IP组别必须是非空字符串');
        }

        if (!ip.expert || typeof ip.expert !== 'string') {
            throw new Error('专家必须是非空字符串');
        }

        if (!ip.indicators) {
            throw new Error('IP必须包含indicators字段');
        }

        // 支持数组格式（向后兼容）
        if (Array.isArray(ip.indicators)) {
            if (ip.indicators.length !== ipEvaluationService.getAllThirdIndicators().length) {
                throw new Error(`数组格式indicators长度错误：期望${ipEvaluationService.getAllThirdIndicators().length}个，实际${ip.indicators.length}个`);
            }
            if (ip.indicators.some(indicator => typeof indicator !== 'number' || isNaN(indicator))) {
                throw new Error('所有指标值必须是有效数字');
            }
        } 
        // 支持对象格式（新格式）
        else if (typeof ip.indicators === 'object') {
            try {
                ipEvaluationService.validateIndicatorObject(ip.indicators);
            } catch (error) {
                throw new Error(`对象格式indicators验证失败：${error.message}`);
            }
        } 
        else {
            throw new Error('indicators必须是数组或对象格式');
        }

        return true;
    }

    // 标准化指标格式 - 统一转换为对象格式
    normalizeIndicators(indicators) {
        if (Array.isArray(indicators)) {
            return ipEvaluationService.arrayToObject(indicators);
        } else if (typeof indicators === 'object') {
            // 验证对象格式
            ipEvaluationService.validateIndicatorObject(indicators);
            return indicators;
        } else {
            throw new Error('indicators必须是数组或对象格式');
        }
    }

    // 获取兼容格式的指标数据 - 返回数组格式供现有算法使用
    getCompatibleIndicators(indicators) {
        if (Array.isArray(indicators)) {
            return indicators;
        } else if (typeof indicators === 'object') {
            return ipEvaluationService.objectToArray(indicators);
        } else {
            throw new Error('indicators必须是数组或对象格式');
        }
    }

    // 添加IP
    async addIP(ip, userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        this.validateIP(ip);
        
        // 检查是否存在相同name+group+expert+userId的记录
        const existingExactMatch = await this.ipsCollection.findOne({ 
            name: ip.name, 
            group: ip.group,
            expert: ip.expert,
            userId: userId
        });
        if (existingExactMatch) {
            throw new Error(`专家 "${ip.expert}" 对IP "${ip.name}" 在组别 "${ip.group}" 中的评分已存在`);
        }

        // 保存专家数据
        const newExpertIP = {
            id: this.generateUniqueId(),
            name: ip.name,
            group: ip.group,
            expert: ip.expert,
            indicators: this.normalizeIndicators(ip.indicators),
            userId: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await this.ipsCollection.insertOne(newExpertIP);

        return { ...newExpertIP, _id: undefined };
    }

    // 更新IP
    async updateIP(id, updates, userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const existingIP = await this.ipsCollection.findOne({ id, userId });
        if (!existingIP) {
            throw new Error('未找到指定的IP或您没有权限修改');
        }

        const updatedIP = {
            ...existingIP,
            ...updates,
            userId: userId, // 确保userId不被覆盖
            updatedAt: new Date().toISOString()
        };

        this.validateIP(updatedIP);
        
        await this.ipsCollection.updateOne(
            { id, userId },
            { $set: updatedIP }
        );
        
        return { ...updatedIP, _id: undefined };
    }

    // 删除IP
    async deleteIP(id, userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const deletedIP = await this.ipsCollection.findOne({ id, userId });
        if (!deletedIP) {
            throw new Error('未找到指定的IP或您没有权限删除');
        }

        await this.ipsCollection.deleteOne({ id, userId });
        
        return { ...deletedIP, _id: undefined };
    }

    // 获取所有IP（仅当前用户）- 前端计算平均值
    async getAllIPs(userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const allIPs = await this.ipsCollection.find({ userId }).toArray();
        
        // 按name+group分组
        const groupedIPs = {};
        allIPs.forEach(ip => {
            const key = `${ip.name}_${ip.group}`;
            if (!groupedIPs[key]) {
                groupedIPs[key] = [];
            }
            groupedIPs[key].push(ip);
        });
        
        // 对每个分组，如果有多个专家则显示专家总数，否则显示单一记录
        const resultIPs = [];
        Object.values(groupedIPs).forEach(ips => {
            if (ips.length === 1) {
                // 只有一个专家记录，直接显示
                resultIPs.push({ ...ips[0], _id: undefined });
            } else if (ips.length > 1) {
                // 多个专家记录，创建一个聚合显示
                const firstIP = ips[0];
                resultIPs.push({ 
                    ...firstIP,
                    id: `group_${firstIP.name}_${firstIP.group}`, // 特殊ID标识聚合记录
                    expert: `${ips.length}位专家评分`,
                    expertCount: ips.length,
                    _isGroup: true, // 标识这是聚合记录
                    _id: undefined 
                });
            }
        });
        
        return resultIPs;
    }

    // 根据组别筛选IP（仅当前用户）
    async getIPsByGroup(group, userId) {
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        if (group === '全部') {
            return await this.getAllIPs(userId);
        }
        
        await this.ensureDB();
        const ips = await this.ipsCollection.find({ group, userId }).toArray();
        
        // 按name分组（group已经过滤）
        const groupedIPs = {};
        ips.forEach(ip => {
            const key = ip.name;
            if (!groupedIPs[key]) {
                groupedIPs[key] = [];
            }
            groupedIPs[key].push(ip);
        });
        
        // 对每个分组，如果有多个专家则显示专家总数，否则显示单一记录
        const resultIPs = [];
        Object.values(groupedIPs).forEach(ips => {
            if (ips.length === 1) {
                // 只有一个专家记录，直接显示
                resultIPs.push({ ...ips[0], _id: undefined });
            } else if (ips.length > 1) {
                // 多个专家记录，创建一个聚合显示
                const firstIP = ips[0];
                resultIPs.push({ 
                    ...firstIP,
                    id: `group_${firstIP.name}_${firstIP.group}`, // 特殊ID标识聚合记录
                    expert: `${ips.length}位专家评分`,
                    expertCount: ips.length,
                    _isGroup: true, // 标识这是聚合记录
                    _id: undefined 
                });
            }
        });
        
        return resultIPs;
    }

    // 获取所有组别（仅当前用户）
    async getAllGroups(userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const groups = await this.ipsCollection.distinct('group', { userId });
        return ['全部', ...groups.sort()];
    }

    // 根据ID获取IP（仅当前用户）
    async getIPById(id, userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const ip = await this.ipsCollection.findOne({ id, userId });
        return ip ? { ...ip, _id: undefined } : null;
    }

    // 根据名称获取IP（仅当前用户）
    async getIPByName(name, userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const ip = await this.ipsCollection.findOne({ name, userId });
        return ip ? { ...ip, _id: undefined } : null;
    }

    // 根据IP名称和组别获取所有专家评分（仅当前用户）
    async getExpertScoresByIP(name, group, userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const expertScores = await this.ipsCollection.find({ 
            name, 
            group, 
            userId 
        }).toArray();
        
        return expertScores.map(score => ({ ...score, _id: undefined }));
    }

    // 批量添加IP
    async addBatchIPs(ips, userId) {
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const addedIPs = [];
        const errors = [];

        for (let i = 0; i < ips.length; i++) {
            try {
                const newIP = await this.addIP(ips[i], userId);
                addedIPs.push(newIP);
            } catch (error) {
                errors.push({
                    index: i,
                    ip: ips[i],
                    error: error.message
                });
            }
        }

        return { addedIPs, errors };
    }

    // 保存评估历史
    async saveEvaluationHistory(evaluation, userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const historyRecord = {
            id: this.generateUniqueId(),
            userId: userId,
            timestamp: new Date().toISOString(),
            ipsCount: evaluation.evaluation.length,
            evaluation: evaluation.evaluation,
            weights: evaluation.weights,
            fitnessHistory: evaluation.fitnessHistory
        };

        await this.historyCollection.insertOne(historyRecord);
        
        // 清理旧记录（保留最近50条，仅当前用户）
        const totalCount = await this.historyCollection.countDocuments({ userId });
        if (totalCount > 50) {
            const oldRecords = await this.historyCollection
                .find({ userId })
                .sort({ timestamp: 1 })
                .limit(totalCount - 50)
                .toArray();
            
            const idsToDelete = oldRecords.map(record => record._id);
            await this.historyCollection.deleteMany({ _id: { $in: idsToDelete } });
        }

        return { ...historyRecord, _id: undefined };
    }

    // 获取评估历史（仅当前用户）
    async getEvaluationHistory(userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const history = await this.historyCollection
            .find({ userId })
            .sort({ timestamp: -1 })
            .toArray();
        return history.map(record => ({ ...record, _id: undefined }));
    }

    // 根据ID获取历史记录（仅当前用户）
    async getHistoryById(id, userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const record = await this.historyCollection.findOne({ id, userId });
        return record ? { ...record, _id: undefined } : null;
    }

    // 清空所有数据（仅当前用户）
    async clearAll(userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        await this.ipsCollection.deleteMany({ userId });
        await this.historyCollection.deleteMany({ userId });
    }

    // 导出数据
    async exportData() {
        const ips = await this.getAllIPs();
        const history = await this.getEvaluationHistory();
        
        return {
            ips,
            history,
            exportedAt: new Date().toISOString()
        };
    }

    // 导入数据
    async importData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('导入数据格式无效');
        }

        let ipsCount = 0;
        let historyCount = 0;

        if (Array.isArray(data.ips)) {
            // 验证所有IP数据
            data.ips.forEach((ip, index) => {
                try {
                    this.validateIP(ip);
                } catch (error) {
                    throw new Error(`IP数据第${index + 1}项无效: ${error.message}`);
                }
            });

            // 清空现有IP数据并导入新数据
            await this.ensureDB();
            await this.ipsCollection.deleteMany({});
            
            if (data.ips.length > 0) {
                await this.ipsCollection.insertMany(data.ips.map(ip => ({
                    ...ip,
                    indicators: this.normalizeIndicators(ip.indicators)
                })));
            }
            ipsCount = data.ips.length;
        }

        if (Array.isArray(data.history)) {
            // 清空现有历史数据并导入新数据
            await this.ensureDB();
            await this.historyCollection.deleteMany({});
            
            if (data.history.length > 0) {
                await this.historyCollection.insertMany(data.history);
            }
            historyCount = data.history.length;
        }

        return {
            ipsCount,
            historyCount
        };
    }

    // 获取统计信息（仅当前用户）
    async getStatistics(userId) {
        await this.ensureDB();
        
        if (!userId) {
            throw new Error('用户ID不能为空');
        }
        
        const totalIPs = await this.ipsCollection.countDocuments({ userId });
        const groups = await this.ipsCollection.distinct('group', { userId });
        
        const groupStats = [];
        for (const group of groups) {
            const count = await this.ipsCollection.countDocuments({ group, userId });
            groupStats.push({ group, count });
        }

        const totalEvaluations = await this.historyCollection.countDocuments({ userId });
        const lastEvaluation = await this.historyCollection
            .findOne({ userId }, { sort: { timestamp: -1 } });

        return {
            totalIPs,
            totalGroups: groups.length,
            groupStats,
            totalEvaluations,
            lastEvaluationAt: lastEvaluation ? lastEvaluation.timestamp : null
        };
    }
}

module.exports = new IPModel(); 