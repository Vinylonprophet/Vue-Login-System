const express = require('express');
const router = express.Router();
const ipModel = require('../models/ipModel');
const ipEvaluationService = require('../services/ipEvaluationService');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const { authenticate } = require('../middleware/auth');

// 应用认证中间件到所有需要用户认证的路由
router.use(['/ips', '/groups', '/evaluate', '/evaluate-selected', '/clustering', '/history', '/statistics', '/clear-all', '/export', '/import', '/import-excel', '/test-data', '/indicators/filtered'], authenticate);

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
                allThird: ipEvaluationService.allThird,
                indicatorPropertyMap: ipEvaluationService.indicatorPropertyMap,
                propertyIndicatorMap: ipEvaluationService.propertyIndicatorMap,
                allProperties: ipEvaluationService.allProperties
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
router.get('/ips', async (req, res) => {
    try {
        const { group } = req.query;
        const userId = req.user._id || req.user.id;
        const ips = group ? await ipModel.getIPsByGroup(group, userId) : await ipModel.getAllIPs(userId);
        
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

// 获取特定IP的所有专家评分
router.get('/ips/:name/:group/experts', async (req, res) => {
    try {
        const { name, group } = req.params;
        const userId = req.user._id || req.user.id;
        const expertScores = await ipModel.getExpertScoresByIP(name, group, userId);
        
        res.json({
            success: true,
            data: expertScores
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 添加IP
router.post('/ips', async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const newIP = await ipModel.addIP(req.body, userId);
        
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
router.put('/ips/:id', async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const updatedIP = await ipModel.updateIP(req.params.id, req.body, userId);
        
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
router.delete('/ips/:id', async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const deletedIP = await ipModel.deleteIP(req.params.id, userId);
        
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
router.post('/ips/batch', async (req, res) => {
    try {
        const { ips } = req.body;
        if (!Array.isArray(ips)) {
            return res.status(400).json({
                success: false,
                message: 'ips字段必须是数组'
            });
        }

        const userId = req.user._id || req.user.id;
        const result = await ipModel.addBatchIPs(ips, userId);
        
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
router.get('/groups', async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const groups = await ipModel.getAllGroups(userId);
        
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
router.post('/evaluate', async (req, res) => {
    try {
        const { group = '全部', selectedIndicators = null } = req.body;
        const userId = req.user._id || req.user.id;
        
        // 获取要评估的IP数据
        const ips = await ipModel.getIPsByGroup(group, userId);
        
        if (ips.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'IP数量太少（<2），请添加更多IP再评估'
            });
        }

        // 执行评估
        const evaluation = ipEvaluationService.evaluateIPs(ips, selectedIndicators);
        
        // 保存评估历史
        const historyRecord = await ipModel.saveEvaluationHistory(evaluation, userId);
        
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
router.post('/evaluate-selected', async (req, res) => {
    try {
        const { selectedIPs = [], selectedIndicators = null } = req.body;
        const userId = req.user._id || req.user.id;
        
        if (!selectedIPs || selectedIPs.length < 2) {
            return res.status(400).json({
                success: false,
                message: '请至少选择2个IP进行评估'
            });
        }

        // 执行评估
        const evaluation = ipEvaluationService.evaluateIPs(selectedIPs, selectedIndicators);
        
        // 保存评估历史
        const historyRecord = await ipModel.saveEvaluationHistory(evaluation, userId);
        
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
router.post('/clustering', async (req, res) => {
    try {
        const { group = '全部', clusterCount = 2 } = req.body;
        const userId = req.user._id || req.user.id;
        
        // 获取要分析的IP数据
        const ips = await ipModel.getIPsByGroup(group, userId);
        
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
router.get('/history', async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const history = await ipModel.getEvaluationHistory(userId);
        
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
router.get('/history/:id', async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const historyRecord = await ipModel.getHistoryById(req.params.id, userId);
        
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
router.post('/test-data', async (req, res) => {
    try {
        const { count = 10 } = req.body;
        const userId = req.user._id || req.user.id;
        const testIPs = ipEvaluationService.generateTestData(count);
        
        const result = await ipModel.addBatchIPs(testIPs, userId);
        
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
router.get('/statistics', async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const stats = await ipModel.getStatistics(userId);
        
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
router.get('/export', async (req, res) => {
    try {
        const data = await ipModel.exportData();
        
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

// 设置文件上传中间件
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.xlsx', '.xls', '.json'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传Excel(.xlsx, .xls)或JSON文件'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// Excel导入数据功能
router.post('/import-excel', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '没有上传文件'
            });
        }

        const fileExtension = path.extname(req.file.originalname).toLowerCase();
        
        if (fileExtension === '.json') {
            // JSON文件处理
            const jsonData = JSON.parse(req.file.buffer.toString());
            const result = ipModel.importData(jsonData);
            
            return res.json({
                success: true,
                data: result,
                message: `成功导入${result.ipsCount}个IP和${result.historyCount}条历史记录`
            });
        } else if (['.xlsx', '.xls'].includes(fileExtension)) {
            // Excel文件处理
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // 将Excel数据转换为JSON
            const excelData = XLSX.utils.sheet_to_json(worksheet);
            
            if (!excelData || excelData.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Excel文件中没有数据'
                });
            }

            // 解析专家评分数据
            const parsedData = parseExpertScoreData(excelData);
            
            // 导入解析后的数据
            const result = await importExpertScoreData(parsedData, req.user._id || req.user.id);
            
            return res.json({
                success: true,
                data: result,
                message: `成功导入${result.ipsCount}个专家评分IP`
            });
        } else {
            return res.status(400).json({
                success: false,
                message: '不支持的文件格式'
            });
        }
    } catch (error) {
        console.error('导入文件失败:', error);
        res.status(400).json({
            success: false,
            message: error.message || '导入文件失败'
        });
    }
});

// 解析专家评分Excel数据
function parseExpertScoreData(excelData) {
    console.log('开始解析Excel数据，行数:', excelData.length);
    console.log('第一行数据:', JSON.stringify(excelData[0], null, 2));
    
    // 获取所有指标名称 (index列)
    const indicators = [];
    const expertColumns = [];
    let groupName = '';

    // 从第一行数据中提取列名信息
    if (excelData.length > 0) {
        const firstRow = excelData[0];
        
        // 查找专家列 (expert_专家1, expert_专家2, ...)
        Object.keys(firstRow).forEach(key => {
            if (key.startsWith('expert_')) {
                expertColumns.push(key);
            }
        });
        
        // 获取组别名 - 确保使用正确的值
        if (firstRow.hasOwnProperty('group_name')) {
            groupName = String(firstRow['group_name']).trim();
            console.log('从第一行提取的组别名:', groupName);
        }
        
        // 如果第一行的组别名为空或无效，检查其他行
        if (!groupName || groupName === 'undefined' || groupName === 'null') {
            for (let i = 0; i < Math.min(5, excelData.length); i++) {
                const row = excelData[i];
                if (row.group_name && String(row.group_name).trim()) {
                    groupName = String(row.group_name).trim();
                    console.log(`从第${i + 1}行找到组别名:`, groupName);
                    break;
                }
            }
        }
    }

    // 提取所有指标名称
    excelData.forEach((row, index) => {
        if (row.index && typeof row.index === 'string') {
            indicators.push(row.index.trim());
        }
    });

    console.log('发现指标数量:', indicators.length);
    console.log('前5个指标:', indicators.slice(0, 5));
    console.log('发现专家列数量:', expertColumns.length);
    console.log('专家列:', expertColumns);
    console.log('最终组别名称:', groupName);

    // 验证数据完整性
    if (indicators.length === 0) {
        throw new Error('未找到指标数据，请检查Excel文件中的index列');
    }

    if (expertColumns.length === 0) {
        throw new Error('未找到专家评分数据，请检查Excel文件中的expert_专家列');
    }

    if (!groupName || groupName === 'undefined' || groupName === 'null') {
        console.error('组别名获取失败，所有行的group_name值:');
        excelData.slice(0, 3).forEach((row, index) => {
            console.error(`第${index + 1}行 group_name:`, row.group_name, typeof row.group_name);
        });
        throw new Error('未找到有效的组别信息，请检查Excel文件中的group_name列');
    }

    // 获取系统指标结构
    const allSystemIndicators = ipEvaluationService.getAllThirdIndicators();
    console.log('系统指标总数:', allSystemIndicators.length);

    // 为每个专家生成一个IP
    const ips = [];
    
    expertColumns.forEach(expertColumn => {
        // 提取专家名称 (去掉expert_前缀)
        const expertName = expertColumn.replace('expert_', '');
        const ipName = `${groupName}_${expertName}`;
        
        console.log(`创建IP: ${ipName}, 组别: ${groupName}`);
        
        // 收集该专家的所有指标评分
        const expertScores = {};
        
        // 根据指标名称匹配分数
        excelData.forEach(row => {
            const indicatorName = row.index;
            const score = parseFloat(row[expertColumn]);
            
            if (indicatorName && !isNaN(score)) {
                // 在系统指标中查找匹配的位置，然后转换为属性名
                const systemIndex = allSystemIndicators.indexOf(indicatorName);
                if (systemIndex !== -1) {
                    const propertyName = ipEvaluationService.indicatorPropertyMap[indicatorName];
                    if (propertyName) {
                        expertScores[propertyName] = score;
                    }
                } else {
                    console.warn(`指标 "${indicatorName}" 在系统中未找到`);
                }
            }
        });

        // 确保所有指标都有值，缺失的设为0
        ipEvaluationService.getAllProperties().forEach(property => {
            if (!(property in expertScores)) {
                expertScores[property] = 0;
            }
        });

        ips.push({
            name: ipName,
            group: groupName,
            indicators: expertScores
        });
    });

    return {
        ips,
        groupName,
        expertCount: expertColumns.length,
        indicatorCount: indicators.length
    };
}

// 导入专家评分数据
async function importExpertScoreData(parsedData, userId) {
    const addedIPs = [];
    const errors = [];

    for (let i = 0; i < parsedData.ips.length; i++) {
        const ipData = parsedData.ips[i];
        try {
            // 验证IP数据
            ipModel.validateIP(ipData);
            
            // 检查是否已存在同名IP和组别的组合
            const existingIP = await ipModel.getIPByName(ipData.name, userId);
            if (existingIP && existingIP.group === ipData.group) {
                // 更新现有IP
                await ipModel.updateIP(existingIP.id, ipData, userId);
                addedIPs.push({ ...ipData, id: existingIP.id, action: 'updated' });
            } else {
                // 添加新IP
                const newIP = await ipModel.addIP(ipData, userId);
                addedIPs.push({ ...newIP, action: 'added' });
            }
        } catch (error) {
            errors.push({
                index: i + 1,
                name: ipData.name,
                error: error.message
            });
        }
    }

    return {
        ipsCount: addedIPs.length,
        addedIPs,
        errors,
        summary: {
            groupName: parsedData.groupName,
            expertCount: parsedData.expertCount,
            indicatorCount: parsedData.indicatorCount
        }
    };
}

// 清空所有数据
router.delete('/clear-all', async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        await ipModel.clearAll(userId);
        
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

// 导入数据
router.post('/import', async (req, res) => {
    try {
        const result = await ipModel.importData(req.body);
        
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

module.exports = router; 