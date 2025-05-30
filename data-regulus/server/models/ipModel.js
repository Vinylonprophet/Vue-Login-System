// IP数据模型
class IPModel {
    constructor() {
        this.ips = [];
        this.history = [];
        this.idCounter = 0; // 添加计数器确保ID唯一
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

        if (!Array.isArray(ip.indicators)) {
            throw new Error('IP指标必须是数组');
        }

        if (ip.indicators.some(indicator => typeof indicator !== 'number' || isNaN(indicator))) {
            throw new Error('所有指标值必须是有效数字');
        }

        return true;
    }

    // 添加IP
    addIP(ip) {
        this.validateIP(ip);
        
        // 检查名称是否已存在
        if (this.ips.some(existingIP => existingIP.name === ip.name)) {
            throw new Error(`IP名称 "${ip.name}" 已存在`);
        }

        const newIP = {
            id: this.generateUniqueId(),
            name: ip.name,
            group: ip.group,
            indicators: [...ip.indicators],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.ips.push(newIP);
        return newIP;
    }

    // 更新IP
    updateIP(id, updates) {
        const index = this.ips.findIndex(ip => ip.id === id);
        if (index === -1) {
            throw new Error('未找到指定的IP');
        }

        const updatedIP = {
            ...this.ips[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.validateIP(updatedIP);
        this.ips[index] = updatedIP;
        return updatedIP;
    }

    // 删除IP
    deleteIP(id) {
        const index = this.ips.findIndex(ip => ip.id === id);
        if (index === -1) {
            throw new Error('未找到指定的IP');
        }

        const deletedIP = this.ips.splice(index, 1)[0];
        return deletedIP;
    }

    // 获取所有IP
    getAllIPs() {
        return [...this.ips];
    }

    // 根据组别筛选IP
    getIPsByGroup(group) {
        if (group === '全部') {
            return this.getAllIPs();
        }
        return this.ips.filter(ip => ip.group === group);
    }

    // 获取所有组别
    getAllGroups() {
        const groups = [...new Set(this.ips.map(ip => ip.group))];
        return ['全部', ...groups.sort()];
    }

    // 根据ID获取IP
    getIPById(id) {
        return this.ips.find(ip => ip.id === id);
    }

    // 根据名称获取IP
    getIPByName(name) {
        return this.ips.find(ip => ip.name === name);
    }

    // 批量添加IP
    addBatchIPs(ips) {
        const addedIPs = [];
        const errors = [];

        ips.forEach((ip, index) => {
            try {
                const newIP = this.addIP(ip);
                addedIPs.push(newIP);
            } catch (error) {
                errors.push({
                    index,
                    ip,
                    error: error.message
                });
            }
        });

        return { addedIPs, errors };
    }

    // 保存评估历史
    saveEvaluationHistory(evaluation) {
        const historyRecord = {
            id: this.generateUniqueId(),
            timestamp: new Date().toISOString(),
            ipsCount: evaluation.evaluation.length,
            evaluation: evaluation.evaluation,
            weights: evaluation.weights,
            fitnessHistory: evaluation.fitnessHistory
        };

        this.history.push(historyRecord);
        
        // 限制历史记录数量（保留最近20条）
        if (this.history.length > 20) {
            this.history = this.history.slice(-20);
        }

        return historyRecord;
    }

    // 获取评估历史
    getEvaluationHistory() {
        return [...this.history].reverse(); // 最新的在前面
    }

    // 根据ID获取历史记录
    getHistoryById(id) {
        return this.history.find(record => record.id === id);
    }

    // 清空所有数据
    clearAll() {
        this.ips = [];
        this.history = [];
    }

    // 导出数据
    exportData() {
        return {
            ips: this.ips,
            history: this.history,
            exportedAt: new Date().toISOString()
        };
    }

    // 导入数据
    importData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('导入数据格式无效');
        }

        if (Array.isArray(data.ips)) {
            // 验证所有IP数据
            data.ips.forEach((ip, index) => {
                try {
                    this.validateIP(ip);
                } catch (error) {
                    throw new Error(`IP数据第${index + 1}项无效: ${error.message}`);
                }
            });

            this.ips = [...data.ips];
        }

        if (Array.isArray(data.history)) {
            this.history = [...data.history];
        }

        return {
            ipsCount: this.ips.length,
            historyCount: this.history.length
        };
    }

    // 获取统计信息
    getStatistics() {
        const groups = this.getAllGroups().slice(1); // 排除"全部"选项
        const groupStats = groups.map(group => ({
            group,
            count: this.getIPsByGroup(group).length
        }));

        return {
            totalIPs: this.ips.length,
            totalGroups: groups.length,
            groupStats,
            totalEvaluations: this.history.length,
            lastEvaluationAt: this.history.length > 0 ? 
                this.history[this.history.length - 1].timestamp : null
        };
    }
}

module.exports = new IPModel(); 