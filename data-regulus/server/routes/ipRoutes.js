const express = require('express');
const router = express.Router();
const ipModel = require('../models/ipModel');
const ipEvaluationService = require('../services/ipEvaluationService');

// 获取指标层级信息
router.get('/indicators', (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                firstLevel: ipEvaluationService.firstLevel,
                secondLevel: ipEvaluationService.secondLevel,
                firstToSecond: ipEvaluationService.firstToSecond,
                secondToThird: ipEvaluationService.secondToThird,
                allThird: ipEvaluationService.allThird
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 根据筛选条件获取三级指标
router.post('/indicators/filtered', (req, res) => {
    try {
        const { selectedFirst = [], selectedSecond = [] } = req.body;
        const filteredIndicators = ipEvaluationService.getFilteredThirdIndicators(
            selectedFirst, 
            selectedSecond
        );
        
        res.json({
            success: true,
            data: filteredIndicators
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 获取所有IP
router.get('/ips', (req, res) => {
    try {
        const { group } = req.query;
        const ips = group ? ipModel.getIPsByGroup(group) : ipModel.getAllIPs();
        
        res.json({
            success: true,
            data: ips
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 添加IP
router.post('/ips', (req, res) => {
    try {
        const newIP = ipModel.addIP(req.body);
        
        res.status(201).json({
            success: true,
            data: newIP,
            message: 'IP添加成功'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 更新IP
router.put('/ips/:id', (req, res) => {
    try {
        const updatedIP = ipModel.updateIP(req.params.id, req.body);
        
        res.json({
            success: true,
            data: updatedIP,
            message: 'IP更新成功'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 删除IP
router.delete('/ips/:id', (req, res) => {
    try {
        const deletedIP = ipModel.deleteIP(req.params.id);
        
        res.json({
            success: true,
            data: deletedIP,
            message: 'IP删除成功'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 批量添加IP
router.post('/ips/batch', (req, res) => {
    try {
        const { ips } = req.body;
        if (!Array.isArray(ips)) {
            return res.status(400).json({
                success: false,
                message: 'ips字段必须是数组'
            });
        }

        const result = ipModel.addBatchIPs(ips);
        
        res.status(201).json({
            success: true,
            data: result,
            message: `成功添加${result.addedIPs.length}个IP，${result.errors.length}个失败`
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 获取所有组别
router.get('/groups', (req, res) => {
    try {
        const groups = ipModel.getAllGroups();
        
        res.json({
            success: true,
            data: groups
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// IP评估
router.post('/evaluate', (req, res) => {
    try {
        const { group = '全部', selectedIndicators = null } = req.body;
        
        // 获取要评估的IP数据
        const ips = ipModel.getIPsByGroup(group);
        
        if (ips.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'IP数量太少（<2），请添加更多IP再评估'
            });
        }

        // 执行评估
        const evaluation = ipEvaluationService.evaluateIPs(ips, selectedIndicators);
        
        // 保存评估历史
        const historyRecord = ipModel.saveEvaluationHistory(evaluation);
        
        res.json({
            success: true,
            data: {
                ...evaluation,
                historyId: historyRecord.id
            },
            message: '评估完成'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 评估选中的IP
router.post('/evaluate-selected', (req, res) => {
    try {
        const { selectedIPs = [], selectedIndicators = null } = req.body;
        
        if (!selectedIPs || selectedIPs.length < 2) {
            return res.status(400).json({
                success: false,
                message: '请至少选择2个IP进行评估'
            });
        }

        // 执行评估
        const evaluation = ipEvaluationService.evaluateIPs(selectedIPs, selectedIndicators);
        
        // 保存评估历史
        const historyRecord = ipModel.saveEvaluationHistory(evaluation);
        
        res.json({
            success: true,
            data: {
                ...evaluation,
                historyId: historyRecord.id
            },
            message: `评估完成，已分析${selectedIPs.length}个选中的IP`
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 聚类分析
router.post('/clustering', (req, res) => {
    try {
        const { group = '全部', clusterCount = 2 } = req.body;
        
        // 获取要分析的IP数据
        const ips = ipModel.getIPsByGroup(group);
        
        if (ips.length < clusterCount) {
            return res.status(400).json({
                success: false,
                message: `IP数量不足以进行${clusterCount}类聚类分析`
            });
        }

        // 执行聚类分析
        const clusteringResult = ipEvaluationService.performClustering(ips, clusterCount);
        
        // 添加IP信息到聚类结果
        const enrichedResult = {
            ...clusteringResult,
            ipsWithClusters: ips.map((ip, index) => ({
                ...ip,
                cluster: clusteringResult.clusterAssignment[index]
            }))
        };
        
        res.json({
            success: true,
            data: enrichedResult,
            message: '聚类分析完成'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 获取评估历史
router.get('/history', (req, res) => {
    try {
        const history = ipModel.getEvaluationHistory();
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 获取特定历史记录
router.get('/history/:id', (req, res) => {
    try {
        const historyRecord = ipModel.getHistoryById(req.params.id);
        
        if (!historyRecord) {
            return res.status(404).json({
                success: false,
                message: '未找到指定的历史记录'
            });
        }
        
        res.json({
            success: true,
            data: historyRecord
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 生成测试数据
router.post('/test-data', (req, res) => {
    try {
        const { count = 10 } = req.body;
        const testIPs = ipEvaluationService.generateTestData(count);
        
        const result = ipModel.addBatchIPs(testIPs);
        
        res.status(201).json({
            success: true,
            data: result,
            message: `成功生成${result.addedIPs.length}个测试IP`
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 获取统计信息
router.get('/statistics', (req, res) => {
    try {
        const stats = ipModel.getStatistics();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 导出数据
router.get('/export', (req, res) => {
    try {
        const data = ipModel.exportData();
        
        res.setHeader('Content-Disposition', 'attachment; filename=ip-evaluation-data.json');
        res.setHeader('Content-Type', 'application/json');
        res.json(data);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 导入数据
router.post('/import', (req, res) => {
    try {
        const result = ipModel.importData(req.body);
        
        res.json({
            success: true,
            data: result,
            message: `成功导入${result.ipsCount}个IP和${result.historyCount}条历史记录`
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// 清空所有数据
router.delete('/clear-all', (req, res) => {
    try {
        ipModel.clearAll();
        
        res.json({
            success: true,
            message: '所有数据已清空'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router; 