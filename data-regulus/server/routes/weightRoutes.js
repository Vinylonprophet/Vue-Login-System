const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// 权重配置文件路径
const WEIGHT_CONFIG_PATH = path.join(__dirname, '../config/indicator_weights.json');

// 获取当前权重配置
router.get('/weights', async (req, res) => {
    try {
        if (!fs.existsSync(WEIGHT_CONFIG_PATH)) {
            return res.json({
                success: false,
                message: '权重配置文件不存在',
                data: null
            });
        }

        const configData = fs.readFileSync(WEIGHT_CONFIG_PATH, 'utf8');
        const weightConfig = JSON.parse(configData);

        res.json({
            success: true,
            message: '获取权重配置成功',
            data: weightConfig
        });
    } catch (error) {
        console.error('获取权重配置失败:', error);
        res.status(500).json({
            success: false,
            message: '获取权重配置失败: ' + error.message,
            data: null
        });
    }
});

// 更新权重配置
router.put('/weights', async (req, res) => {
    try {
        const newWeightConfig = req.body;

        // 验证权重配置结构
        if (!newWeightConfig.weights) {
            return res.status(400).json({
                success: false,
                message: '权重配置格式错误：缺少weights字段',
                data: null
            });
        }

        // 验证权重总和
        let totalPercentage = 0;
        const weights = newWeightConfig.weights;
        
        Object.values(weights).forEach(category => {
            Object.values(category).forEach(indicator => {
                if (indicator.percentage) {
                    totalPercentage += indicator.percentage;
                }
            });
        });

        const isValid = Math.abs(totalPercentage - 100.0) < 0.01;
        
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: `权重总和不等于100%，当前总和为: ${totalPercentage.toFixed(2)}%`,
                data: { totalPercentage }
            });
        }

        // 更新配置文件中的验证信息
        newWeightConfig.weight_validation = {
            total_percentage: 100.0,
            current_total: totalPercentage,
            is_valid: isValid
        };
        newWeightConfig.last_updated = new Date().toISOString().split('T')[0];

        // 备份原配置文件
        if (fs.existsSync(WEIGHT_CONFIG_PATH)) {
            const backupPath = WEIGHT_CONFIG_PATH.replace('.json', '_backup.json');
            fs.copyFileSync(WEIGHT_CONFIG_PATH, backupPath);
        }

        // 写入新配置
        fs.writeFileSync(WEIGHT_CONFIG_PATH, JSON.stringify(newWeightConfig, null, 2), 'utf8');

        res.json({
            success: true,
            message: '权重配置更新成功',
            data: {
                totalPercentage,
                isValid,
                backup_created: true
            }
        });
    } catch (error) {
        console.error('更新权重配置失败:', error);
        res.status(500).json({
            success: false,
            message: '更新权重配置失败: ' + error.message,
            data: null
        });
    }
});

// 验证权重配置
router.post('/weights/validate', async (req, res) => {
    try {
        const weightConfig = req.body;

        if (!weightConfig.weights) {
            return res.status(400).json({
                success: false,
                message: '权重配置格式错误：缺少weights字段',
                data: null
            });
        }

        // 计算权重总和
        let totalPercentage = 0;
        const weights = weightConfig.weights;
        const indicatorDetails = [];
        
        Object.entries(weights).forEach(([categoryName, category]) => {
            Object.entries(category).forEach(([propertyName, indicator]) => {
                if (indicator.percentage) {
                    totalPercentage += indicator.percentage;
                    indicatorDetails.push({
                        category: categoryName,
                        property: propertyName,
                        name: indicator.name,
                        percentage: indicator.percentage
                    });
                }
            });
        });

        const isValid = Math.abs(totalPercentage - 100.0) < 0.01;

        res.json({
            success: true,
            message: '权重验证完成',
            data: {
                total_percentage: totalPercentage,
                is_valid: isValid,
                indicator_count: indicatorDetails.length,
                indicator_details: indicatorDetails,
                validation_message: isValid 
                    ? '权重配置有效' 
                    : `权重总和应为100%，当前为${totalPercentage.toFixed(2)}%`
            }
        });
    } catch (error) {
        console.error('验证权重配置失败:', error);
        res.status(500).json({
            success: false,
            message: '验证权重配置失败: ' + error.message,
            data: null
        });
    }
});

// 重置为默认权重
router.post('/weights/reset', async (req, res) => {
    try {
        // 备份当前配置
        if (fs.existsSync(WEIGHT_CONFIG_PATH)) {
            const backupPath = WEIGHT_CONFIG_PATH.replace('.json', '_backup.json');
            fs.copyFileSync(WEIGHT_CONFIG_PATH, backupPath);
        }

        // 创建默认权重（每个指标3.125%，32个指标总和100%）
        const defaultPercentage = 100.0 / 32;
        
        // 获取indicator mapping
        const IPEvaluationService = require('../services/ipEvaluationService');
        const ipService = new IPEvaluationService();
        const indicatorMap = ipService.getIndicatorPropertyMap();
        
        const defaultWeightConfig = {
            version: "1.0",
            description: "IP评估指标权重配置 - 默认等权重设置",
            last_updated: new Date().toISOString().split('T')[0],
            total_indicators: 32,
            weights: {
                "文化价值类": {},
                "传播影响类": {},
                "市场潜力类": {},
                "社会效益类": {},
                "创新性类": {}
            },
            weight_validation: {
                total_percentage: 100.0,
                current_total: 100.0,
                is_valid: true
            },
            usage_notes: [
                "权重总和必须等于100%",
                "修改权重后需要重启服务器",
                "这是等权重默认配置",
                "可根据实际需求调整各指标权重"
            ]
        };

        // 为每个指标设置默认权重
        Object.entries(indicatorMap).forEach(([indicator, property]) => {
            // 简单分类逻辑（可以根据需要优化）
            let category = "文化价值类";
            if (property.includes('market') || property.includes('consumer') || property.includes('competition') || property.includes('brand') || property.includes('cooperation')) {
                category = "市场潜力类";
            } else if (property.includes('communication') || property.includes('media') || property.includes('social') || property.includes('government') || property.includes('public')) {
                category = "传播影响类";
            } else if (property.includes('ethnic') || property.includes('education') || property.includes('harmony')) {
                category = "社会效益类";
            } else if (property.includes('innovation') || property.includes('rule') || property.includes('venue') || property.includes('commercialization') || property.includes('cross')) {
                category = "创新性类";
            }

            defaultWeightConfig.weights[category][property] = {
                name: indicator,
                percentage: Math.round(defaultPercentage * 100) / 100,
                description: `${indicator}的评估权重`
            };
        });

        // 写入默认配置
        fs.writeFileSync(WEIGHT_CONFIG_PATH, JSON.stringify(defaultWeightConfig, null, 2), 'utf8');

        res.json({
            success: true,
            message: '权重配置已重置为默认等权重',
            data: {
                default_percentage: defaultPercentage,
                backup_created: true
            }
        });
    } catch (error) {
        console.error('重置权重配置失败:', error);
        res.status(500).json({
            success: false,
            message: '重置权重配置失败: ' + error.message,
            data: null
        });
    }
});

module.exports = router; 