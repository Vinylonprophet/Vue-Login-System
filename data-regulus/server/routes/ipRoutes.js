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
router.get('/ips/:project_name/:group_name/experts', async (req, res) => {
    try {
        const { project_name, group_name } = req.params;
        const userId = req.user._id || req.user.id;
        const expertScores = await ipModel.getExpertScoresByIP(project_name, group_name, userId);
        
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
    
    if (!excelData || excelData.length === 0) {
        throw new Error('Excel文件中没有数据');
    }

    const firstRow = excelData[0];
    console.log('第一行列名:', Object.keys(firstRow));
    
    // 检测新的数据结构：每行包含专家名、项目名、组别名和所有指标评分
    const hasExpertColumn = firstRow.hasOwnProperty('expert');
    const hasProjectColumn = firstRow.hasOwnProperty('project_name');
    const hasGroupNameColumn = firstRow.hasOwnProperty('group_name');
    
    if (hasExpertColumn && hasProjectColumn && hasGroupNameColumn) {
        // 新数据结构：每行一个专家的完整评分数据
        console.log('检测到新数据结构：专家-项目-指标评分');
        return parseExpertProjectData(excelData);
    } else if (hasProjectColumn && firstRow.hasOwnProperty('index')) {
        // 混合数据结构：每行包含项目+指标+多个专家评分
        console.log('检测到混合数据结构：项目-指标-专家矩阵');
        return parseProjectIndicatorMatrix(excelData);
    } else if (hasProjectColumn) {
        // 项目基础数据结构：每行一个项目，多个专家列
        return parseProjectBasedData(excelData);
    } else if (firstRow.hasOwnProperty('index')) {
        // 旧数据结构：每行一个指标，多个专家列
        return parseIndicatorBasedData(excelData);
    } else {
        throw new Error('无法识别Excel数据结构，请确保包含expert/project_name/group_name列（新格式）、project_name列（项目格式）或index列（旧格式）');
    }
}

// 解析新的专家-项目数据结构
function parseExpertProjectData(excelData) {
    console.log('解析新的专家-项目数据结构');
    
    // 获取系统所有属性列表
    const allSystemProperties = ipEvaluationService.getAllProperties();
    console.log('系统属性总数:', allSystemProperties.length);
    console.log('系统属性列表:', allSystemProperties.slice(0, 5), '...');
    
    const ips = [];
    const expertSet = new Set();
    const projectSet = new Set();
    const groupSet = new Set();
    
    // 从第一行数据中识别哪些列是指标列
    const firstRow = excelData[0];
    const allColumns = Object.keys(firstRow);
    console.log('Excel中所有列:', allColumns);
    
    // 排除非指标列
    const nonIndicatorColumns = ['expert', 'project_name', 'group_name'];
    const indicatorColumns = allColumns.filter(col => !nonIndicatorColumns.includes(col));
    console.log('识别到的指标列:', indicatorColumns);
    
    // 创建列名映射表，处理Excel列名与系统属性名不匹配的情况
    const columnMapping = {};
    
    // 为每个指标列找到对应的系统属性
    const validIndicatorColumns = [];
    const invalidIndicatorColumns = [];
    
    indicatorColumns.forEach(col => {
        if (allSystemProperties.includes(col)) {
            // 直接匹配
            columnMapping[col] = col;
            validIndicatorColumns.push(col);
        } else {
            // 尝试模糊匹配
            const matchedProperty = allSystemProperties.find(prop => {
                // 检查是否是截断的列名（如socialPlatformInnovatio）
                return prop.startsWith(col) || col.startsWith(prop);
            });
            
            if (matchedProperty) {
                console.log(`列名映射: "${col}" -> "${matchedProperty}"`);
                columnMapping[col] = matchedProperty;
                validIndicatorColumns.push(col);
            } else {
                invalidIndicatorColumns.push(col);
            }
        }
    });
    
    console.log('有效指标列:', validIndicatorColumns);
    console.log('列名映射表:', columnMapping);
    if (invalidIndicatorColumns.length > 0) {
        console.warn('无效指标列（系统中不存在）:', invalidIndicatorColumns);
    }
    
    excelData.forEach((row, rowIndex) => {
        const expertName = row.expert;
        const projectName = row.project_name;
        const groupName = row.group_name;
        
        if (!expertName || !projectName || !groupName) {
            console.warn(`第${rowIndex + 1}行缺少必要信息，跳过：专家=${expertName}, 项目=${projectName}, 组别=${groupName}`);
            return;
        }
        
        expertSet.add(expertName);
        projectSet.add(projectName);
        groupSet.add(groupName);
        
        // 构建指标评分数据
        const indicators = {};
        
        // 初始化所有系统属性为0
        allSystemProperties.forEach(property => {
            indicators[property] = 0;
        });
        
        // 从Excel行数据中提取指标评分
        let validScoreCount = 0;
        validIndicatorColumns.forEach(column => {
            const score = parseFloat(row[column]);
            if (!isNaN(score)) {
                const systemProperty = columnMapping[column];
                indicators[systemProperty] = score;
                validScoreCount++;
            } else {
                console.warn(`专家 "${expertName}" 在指标 "${column}" 上的评分无效:`, row[column]);
            }
        });
        
        console.log(`专家 "${expertName}" 有效评分数量: ${validScoreCount}/${validIndicatorColumns.length}`);
        
        // 创建IP记录 - 直接使用Excel中的值，不进行拼接
        const ip = {
            project_name: projectName,
            group_name: groupName,
            expert: expertName,
            indicators: indicators
        };
        
        ips.push(ip);
    });
    
    console.log(`总共创建了 ${ips.length} 个IP记录`);
    console.log(`专家数量: ${expertSet.size}, 项目数量: ${projectSet.size}, 组别数量: ${groupSet.size}`);
    console.log('专家列表:', Array.from(expertSet));
    console.log('项目列表:', Array.from(projectSet));
    console.log('组别列表:', Array.from(groupSet));
    
    return {
        ips,
        groupName: Array.from(groupSet)[0] || '未知组别',
        expertCount: expertSet.size,
        indicatorCount: validIndicatorColumns.length,
        projectCount: projectSet.size,
        groupCount: groupSet.size
    };
}

// 解析混合数据结构：项目-指标-专家矩阵
function parseProjectIndicatorMatrix(excelData) {
    console.log('解析混合数据结构：项目-指标-专家矩阵');
    
    const firstRow = excelData[0];
    
    // 查找所有专家评分列 (expert_博士A, expert_博士B, ...)
    const expertColumns = [];
    Object.keys(firstRow).forEach(key => {
        if (key.startsWith('expert_')) {
            expertColumns.push(key);
        }
    });
    
    console.log('发现专家评分列:', expertColumns);
    
    if (expertColumns.length === 0) {
        throw new Error('未找到专家评分列，列名应以"expert_"开头');
    }
    
    // 从列名提取专家标识（去掉expert_前缀）
    const expertIdentifiers = expertColumns.map(col => col.replace('expert_', ''));
    console.log('专家标识:', expertIdentifiers);
    
    // 验证专家名称不为空
    expertIdentifiers.forEach(expertId => {
        if (!expertId || expertId.trim() === '') {
            throw new Error(`发现空的专家标识，请检查列名格式：${expertColumns.find(col => col.replace('expert_', '') === expertId)}`);
        }
    });
    
    // 获取系统指标结构
    const allSystemIndicators = ipEvaluationService.getAllThirdIndicators();
    const indicatorPropertyMap = ipEvaluationService.getIndicatorPropertyMap();
    console.log('系统指标总数:', allSystemIndicators.length);
    
    // 获取组别信息
    let groupName = '';
    if (firstRow.group_name) {
        groupName = String(firstRow.group_name).trim();
    } else if (firstRow.county || firstRow.city || firstRow.province) {
        const locationParts = [firstRow.province, firstRow.city, firstRow.county].filter(Boolean);
        groupName = locationParts.join('_');
    } else {
        groupName = '默认组别';
    }
    
    console.log('组别名称:', groupName);
    
    // 统计所有项目名称
    const allProjects = new Set();
    excelData.forEach(row => {
        if (row.project_name) {
            allProjects.add(row.project_name);
        }
    });
    console.log('Excel中包含的所有项目:', Array.from(allProjects));
    console.log('项目总数:', allProjects.size);
    
    // 按项目和专家组织数据
    const projectExpertData = {}; // { "项目名_专家名": { indicators: {} } }
    
    excelData.forEach((row, rowIndex) => {
        const projectName = row.project_name;
        const indicatorName = row.index;
        
        if (!projectName || !indicatorName) {
            console.warn(`第${rowIndex + 1}行缺少项目名称或指标名称，跳过`);
            return;
        }
        
        // 检查指标是否在系统中存在
        const propertyName = indicatorPropertyMap[indicatorName];
        if (!propertyName) {
            console.warn(`指标 "${indicatorName}" 在系统中未找到对应的属性名`);
            return;
        }
        
        // 为每个专家处理这个指标的评分
        expertIdentifiers.forEach(expertId => {
            const expertColumn = `expert_${expertId}`;
            const score = parseFloat(row[expertColumn]);
            
            if (isNaN(score)) {
                console.warn(`项目 "${projectName}" 指标 "${indicatorName}" 专家 "${expertId}" 评分无效:`, row[expertColumn]);
                return;
            }
            
            const projectExpertKey = `${projectName}_${expertId}`;
            
            // 初始化项目-专家组合
            if (!projectExpertData[projectExpertKey]) {
                projectExpertData[projectExpertKey] = {
                    name: projectName,
                    group: groupName,
                    expert: expertId,
                    indicators: {}
                };
                
                // 初始化所有指标为0
                ipEvaluationService.getAllProperties().forEach(property => {
                    projectExpertData[projectExpertKey].indicators[property] = 0;
                });
            }
            
            // 设置当前指标的评分
            projectExpertData[projectExpertKey].indicators[propertyName] = score;
        });
    });
    
    // 转换为IP数组
    const ips = Object.values(projectExpertData);
    
    console.log(`总共创建了 ${ips.length} 个IP记录`);
    console.log('前3个IP记录:', ips.slice(0, 3).map(ip => ({ name: ip.name, expert: ip.expert, group: ip.group })));
    
    // 按项目统计专家数量
    const projectStats = {};
    ips.forEach(ip => {
        if (!projectStats[ip.name]) {
            projectStats[ip.name] = 0;
        }
        projectStats[ip.name]++;
    });
    console.log('各项目专家数量统计:', projectStats);
    
    return {
        ips,
        groupName,
        expertCount: expertIdentifiers.length,
        indicatorCount: new Set(excelData.map(row => row.index)).size,
        projectCount: new Set(ips.map(ip => ip.name)).size
    };
}

// 解析新的项目基础数据结构
function parseProjectBasedData(excelData) {
    console.log('检测到新的项目基础数据结构');
    
    const firstRow = excelData[0];
    
    // 查找所有专家评分列 (expert_指标A, expert_指标B, ...)
    const expertColumns = [];
    Object.keys(firstRow).forEach(key => {
        if (key.startsWith('expert_')) {
            expertColumns.push(key);
        }
    });
    
    console.log('发现专家评分列:', expertColumns);
    
    if (expertColumns.length === 0) {
        throw new Error('未找到专家评分列，列名应以"expert_"开头');
    }
    
    // 从列名提取专家标识（去掉expert_前缀）
    const expertIdentifiers = expertColumns.map(col => col.replace('expert_', ''));
    console.log('专家标识:', expertIdentifiers);
    
    // 获取系统指标结构
    const allSystemIndicators = ipEvaluationService.getAllThirdIndicators();
    const indicatorPropertyMap = ipEvaluationService.getIndicatorPropertyMap();
    console.log('系统指标总数:', allSystemIndicators.length);
    
    // 分析数据结构：检查是否每行包含一个项目的所有指标评分
    // 假设：
    // 1. 如果expert列较少（比如≤12个），可能是不同专家对同一项目的评分
    // 2. 如果expert列较多（比如>12个），可能是一个专家对多个指标的评分
    
    const ips = [];
    let groupName = '';
    
    // 分析第一行数据来确定结构
    const sampleRow = excelData[0];
    console.log('分析数据结构，专家列数量:', expertColumns.length);
    console.log('示例数据:', expertColumns.slice(0, 3).map(col => `${col}: ${sampleRow[col]}`));
    
    if (expertColumns.length <= 15) {
        // 情况1：每个expert_列代表一个专家对该项目的综合评分
        console.log('判断为：每列代表一个专家的评分');
        
        excelData.forEach((row, rowIndex) => {
            const projectName = row.project_name;
            
            // 获取组别信息
            if (row.group_name) {
                groupName = String(row.group_name).trim();
            } else if (row.county || row.city || row.province) {
                const locationParts = [row.province, row.city, row.county].filter(Boolean);
                groupName = locationParts.join('_');
            } else {
                groupName = '默认组别';
            }
            
            if (!projectName) {
                console.warn(`第${rowIndex + 1}行缺少项目名称，跳过`);
                return;
            }
            
            console.log(`处理项目: ${projectName}, 组别: ${groupName}`);
            
            // 为每个专家创建一个IP记录
            expertIdentifiers.forEach((expertId, expertIndex) => {
                const expertColumn = `expert_${expertId}`;
                const score = parseFloat(row[expertColumn]);
                
                if (isNaN(score)) {
                    console.warn(`项目 "${projectName}" 的专家 "${expertId}" 评分无效:`, row[expertColumn]);
                    return;
                }
                
                // 创建专家IP记录，假设这是一个综合评分，我们将其分配到第一个指标
                const expertIP = {
                    name: projectName,
                    group: groupName,
                    expert: `专家${expertId}`,
                    indicators: {}
                };
                
                // 初始化所有指标为0
                ipEvaluationService.getAllProperties().forEach(property => {
                    expertIP.indicators[property] = 0;
                });
                
                // 将评分设置到第一个指标（作为综合评分的代表）
                const firstProperty = ipEvaluationService.getAllProperties()[0];
                if (firstProperty) {
                    expertIP.indicators[firstProperty] = score;
                }
                
                ips.push(expertIP);
            });
        });
    } else {
        // 情况2：每个expert_列代表一个指标的评分
        console.log('判断为：每列代表一个指标的评分');
        
        excelData.forEach((row, rowIndex) => {
            const projectName = row.project_name;
            
            // 获取组别信息
            if (row.group_name) {
                groupName = String(row.group_name).trim();
            } else if (row.county || row.city || row.province) {
                const locationParts = [row.province, row.city, row.county].filter(Boolean);
                groupName = locationParts.join('_');
            } else {
                groupName = '默认组别';
            }
            
            if (!projectName) {
                console.warn(`第${rowIndex + 1}行缺少项目名称，跳过`);
                return;
            }
            
            console.log(`处理项目: ${projectName}, 组别: ${groupName}`);
            
            // 创建一个专家评分记录
            const expertIP = {
                name: projectName,
                group: groupName,
                expert: "综合专家",
                indicators: {}
            };
            
            // 初始化所有指标为0
            ipEvaluationService.getAllProperties().forEach(property => {
                expertIP.indicators[property] = 0;
            });
            
            // 设置每个指标的评分
            expertIdentifiers.forEach(indicatorId => {
                const expertColumn = `expert_${indicatorId}`;
                const score = parseFloat(row[expertColumn]);
                
                if (!isNaN(score)) {
                    // 将指标标识转换为系统属性名
                    const propertyName = indicatorPropertyMap[indicatorId];
                    if (propertyName) {
                        expertIP.indicators[propertyName] = score;
                    } else {
                        console.warn(`指标 "${indicatorId}" 在系统中未找到对应的属性名`);
                    }
                } else {
                    console.warn(`项目 "${projectName}" 在指标 "${indicatorId}" 上的评分无效:`, row[expertColumn]);
                }
            });
            
            ips.push(expertIP);
        });
    }
    
    console.log(`总共创建了 ${ips.length} 个IP记录`);
    
    // 按项目统计专家数量
    const projectStats = {};
    ips.forEach(ip => {
        if (!projectStats[ip.name]) {
            projectStats[ip.name] = 0;
        }
        projectStats[ip.name]++;
    });
    console.log('各项目专家数量统计:', projectStats);
    
    return {
        ips,
        groupName,
        expertCount: expertColumns.length <= 15 ? expertColumns.length : 1,
        indicatorCount: expertColumns.length > 15 ? expertColumns.length : 1,
        projectCount: new Set(ips.map(ip => ip.name)).size
    };
}

// 解析旧的指标基础数据结构（保持向后兼容）
function parseIndicatorBasedData(excelData) {
    console.log('检测到旧的指标基础数据结构');
    
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
            expert: expertName,
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
            indicatorCount: parsedData.indicatorCount,
            projectCount: parsedData.projectCount,
            groupCount: parsedData.groupCount
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

// AI分析接口 - 使用DeepSeek API
router.post('/ai-analysis', async (req, res) => {
    try {
        const { analysisData, chartTypes } = req.body;
        
        if (!analysisData || !chartTypes) {
            return res.status(400).json({
                success: false,
                message: '缺少分析数据或图表类型'
            });
        }
        
        // 构建分析提示词
        let prompt = '';
        
        // 如果有自定义提示词，使用它；否则使用默认分析模板
        if (analysisData.customPrompt) {
            // 分析用户问题类型
            const userQuestion = analysisData.customPrompt.toLowerCase();
            const isSystemQuestion = userQuestion.includes('模型') || userQuestion.includes('ai') || 
                                   userQuestion.includes('系统') || userQuestion.includes('版本') ||
                                   userQuestion.includes('什么ai') || userQuestion.includes('用的什么');
            const isGeneralQuestion = userQuestion.includes('你好') || userQuestion.includes('帮我') ||
                                    userQuestion.includes('可以') || userQuestion.includes('怎么');
            
            if (isSystemQuestion) {
                // 系统相关问题，直接回答
                prompt = `用户询问关于AI系统的问题："${analysisData.customPrompt}"

请简洁明确地回答用户的问题。如果问的是使用什么模型，回答当前使用的是GPT-4o语言模型。
如果问的是系统功能，简要介绍这是一个少数民族体育IP评估分析系统，具有数据分析和AI对话功能。

回答要简短、直接、友好。`;
            } else if (isGeneralQuestion && (!analysisData.evaluationResult || analysisData.selectedIPCount === 0)) {
                // 一般性问题但没有数据
                prompt = `用户说："${analysisData.customPrompt}"

当前系统状态：
- 分析的IP数量: ${analysisData.selectedIPCount || 0}
- 可用数据: ${analysisData.evaluationResult ? '有分析结果' : '暂无分析数据'}

请友好地回应用户。如果用户需要数据分析但当前没有数据，建议用户先进行IP评估分析。
如果是打招呼或一般性问题，给出友好回应并简单介绍系统功能。`;
            } else {
                // 数据分析相关问题
                prompt = `你是一位专业的数据分析师，擅长分析少数民族民俗体育IP评估数据。
            
用户问题：${analysisData.customPrompt}

基于以下数据回答用户的问题：

## 当前分析数据
- 分析的IP数量: ${analysisData.selectedIPCount || 0}
- 使用的指标数量: ${analysisData.indicatorCount || 0}
- 可用图表类型: ${chartTypes.join(', ')}`;

                // 添加具体的分析数据
                if (analysisData.evaluationResult) {
                    prompt += `\n\n### IP评分排名:`;
                    analysisData.evaluationResult.evaluation.slice(0, 5).forEach((item, index) => {
                        prompt += `\n${index + 1}. ${item.name}: ${item.score.toFixed(3)}分`;
                    });
                }

                if (analysisData.weights && analysisData.weights.length > 0) {
                    prompt += `\n\n### 关键指标权重:`;
                    analysisData.weights.slice(0, 5).forEach((weight, index) => {
                        prompt += `\n指标${index + 1}: ${(weight * 100).toFixed(2)}%`;
                    });
                }

                if (analysisData.neuralNetworkResult) {
                    const nnData = analysisData.neuralNetworkResult;
                    prompt += `\n\n### 神经网络训练结果:
- 训练轮数: ${nnData.training_losses ? nnData.training_losses.length : 0}
- 初始损失: ${nnData.training_losses ? nnData.training_losses[0]?.toFixed(4) : 'N/A'}
- 最终损失: ${nnData.training_losses ? nnData.training_losses[nnData.training_losses.length - 1]?.toFixed(4) : 'N/A'}`;
                }

                if (analysisData.pcaResult) {
                    prompt += `\n\n### PCA降维分析:
- 主成分数量: ${analysisData.pcaResult.n_components}
- 总方差解释率: ${(analysisData.pcaResult.total_variance_explained * 100).toFixed(1)}%`;
                }

                prompt += `\n\n请基于以上数据，针对用户的问题给出专业、准确、有针对性的回答。
如果用户的问题与当前数据无关，请礼貌地说明并引导用户提出相关问题。
回答要用中文，语言要专业但易懂。`;
            }
        } else {
            // 默认分析模板
            prompt = `你是一位专业的数据分析师，请分析以下少数民族民俗体育IP评估的分析结果：

## 分析概况
- 分析的IP数量: ${analysisData.selectedIPCount || 0}
- 使用的指标数量: ${analysisData.indicatorCount || 0}
- 生成的图表类型: ${chartTypes.join(', ')}

## 详细数据
`;

            // 添加具体的分析数据
            if (analysisData.evaluationResult) {
                prompt += `\n### IP评分排名:
`;
                analysisData.evaluationResult.evaluation.slice(0, 5).forEach((item, index) => {
                    prompt += `${index + 1}. ${item.name}: ${item.score.toFixed(3)}分\n`;
                });
            }

            if (analysisData.weights && analysisData.weights.length > 0) {
                prompt += `\n### 关键指标权重 (前5项):
`;
                analysisData.weights.slice(0, 5).forEach((weight, index) => {
                    prompt += `指标${index + 1}: ${(weight * 100).toFixed(2)}%\n`;
                });
            }

            if (analysisData.neuralNetworkResult) {
                const nnData = analysisData.neuralNetworkResult;
                prompt += `\n### 神经网络训练结果:
- 训练轮数: ${nnData.training_losses ? nnData.training_losses.length : 0}
- 初始损失: ${nnData.training_losses ? nnData.training_losses[0]?.toFixed(4) : 'N/A'}
- 最终损失: ${nnData.training_losses ? nnData.training_losses[nnData.training_losses.length - 1]?.toFixed(4) : 'N/A'}
`;
            }

            if (analysisData.pcaResult) {
                prompt += `\n### PCA降维分析:
- 主成分数量: ${analysisData.pcaResult.n_components}
- 总方差解释率: ${(analysisData.pcaResult.total_variance_explained * 100).toFixed(1)}%
`;
            }

            prompt += `
请从以下几个维度提供专业的分析见解：

1. **整体表现分析**: 评价IP项目的整体表现水平和分布特点
2. **关键指标解读**: 解释重要指标的影响和意义
3. **优劣势识别**: 指出表现优秀和需要改进的IP项目
4. **发展建议**: 基于数据分析结果提供具体的改进建议
5. **趋势预测**: 分析可能的发展趋势和机会

请用中文回答，语言要专业但易懂，每个维度的分析要具体且有针对性。`;
        }

        // 调用DeepSeek API - 尝试多个可能的模型名称
        const modelOptions = [
            'gpt-4o',
        ];
        
        let deepSeekResponse = null;
        let lastError = null;
        
        // 尝试不同的模型
        for (const modelName of modelOptions) {
            try {
                console.log(`尝试使用模型: ${modelName}`);
                
                deepSeekResponse = await fetch('https://xiaoai.plus/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer sk-ETN8d74TXXyvflkTvlNmceQCD6eYP4T5ooPBWzGWslWsV9X0'
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [
                            {
                                role: 'system',
                                content: '你是一位专业的数据分析师，擅长分析少数民族体育IP评估数据，能够提供深入的商业洞察和建议。'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        temperature: 0.7,
                        max_tokens: 2000
                    })
                });
                
                if (deepSeekResponse.ok) {
                    console.log(`成功使用模型: ${modelName}`);
                    break;
                } else {
                    const errorText = await deepSeekResponse.text();
                    console.log(`模型 ${modelName} 失败:`, errorText);
                    lastError = `模型 ${modelName}: ${errorText}`;
                    deepSeekResponse = null;
                }
            } catch (error) {
                console.log(`模型 ${modelName} 异常:`, error.message);
                lastError = `模型 ${modelName}: ${error.message}`;
                deepSeekResponse = null;
            }
        }

        if (!deepSeekResponse || !deepSeekResponse.ok) {
            throw new Error(`DeepSeek API调用失败: ${lastError}`);
        }

        const deepSeekData = await deepSeekResponse.json();
        
        if (!deepSeekData.choices || !deepSeekData.choices[0] || !deepSeekData.choices[0].message) {
            throw new Error('DeepSeek API返回数据格式错误');
        }

        const analysis = deepSeekData.choices[0].message.content;

        res.json({
            success: true,
            data: {
                analysis,
                model: 'deepseek-chat',
                usage: deepSeekData.usage,
                timestamp: new Date().toISOString()
            },
            message: 'AI分析完成'
        });

    } catch (error) {
        console.error('AI分析失败:', error);
        res.status(500).json({
            success: false,
            message: `AI分析失败: ${error.message}`,
            error: error.message
        });
    }
});

module.exports = router; 