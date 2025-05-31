// IP评估服务 - 核心算法和数据处理
const math = require('ml-matrix');

class IPEvaluationService {
    constructor() {
        // 指标层级定义
        this.firstLevel = ["文化价值", "市场潜力", "社会效益", "创新性"];
        this.secondLevel = [
            "历史继承性", "民族特色", "文化传播力", "社会认同感",
            "市场需求", "竞争环境", "商业化路径", "文化传承",
            "社会影响力", "技术创新", "模式创新", "传播创新"
        ];
        this.firstToSecond = {
            "文化价值": ["历史继承性", "民族特色", "文化传播力", "社会认同感"],
            "市场潜力": ["市场需求", "竞争环境", "商业化路径"],
            "社会效益": ["文化传承", "社会影响力"],
            "创新性": ["技术创新", "模式创新", "传播创新"]
        };
        this.secondToThird = {
            "历史继承性": ["历史渊源", "文化象征性", "民族记忆"],
            "民族特色": ["独特性", "跨民族文化联系", "跨民族文化认同"],
            "文化传播力": ["传播渠道", "媒体关注度", "跨平台传播"],
            "社会认同感": ["社会关注度", "民众参与度", "政府支持度"],
            "市场需求": ["消费者需求", "市场成熟度"],
            "竞争环境": ["市场增长潜力", "竞争者数量", "竞争者创新能力"],
            "商业化路径": ["竞争壁垒", "商业模式多样性", "品牌价值", "合作机会"],
            "文化传承": ["民族文化传承", "民族文化融合", "民族自豪感"],
            "社会影响力": ["教育意义", "社会和谐"],
            "技术创新": ["规则创新", "场地设备创新"],
            "模式创新": ["商业化创新", "跨界合作创新"],
            "传播创新": ["媒体传播创新", "社交平台创新"]
        };
        this.allThird = [
            "历史渊源", "文化象征性", "民族记忆", "独特性", "跨民族文化联系", "跨民族文化认同",
            "传播渠道", "媒体关注度", "跨平台传播", "社会关注度", "民众参与度", "政府支持度",
            "消费者需求", "市场成熟度", "市场增长潜力", "竞争者数量", "竞争者创新能力",
            "竞争壁垒", "商业模式多样性", "品牌价值", "合作机会", "民族文化传承", "民族文化融合",
            "民族自豪感", "教育意义", "社会和谐", "规则创新", "场地设备创新", "商业化创新",
            "跨界合作创新", "媒体传播创新", "社交平台创新"
        ];

        // 指标属性名映射 - 将中文指标名映射为英文属性名
        this.indicatorPropertyMap = {
            "历史渊源": "historicalOrigin",
            "文化象征性": "culturalSymbolism", 
            "民族记忆": "ethnicMemory",
            "独特性": "uniqueness",
            "跨民族文化联系": "interEthnicCulturalConnection",
            "跨民族文化认同": "interEthnicCulturalIdentity",
            "传播渠道": "communicationChannels",
            "媒体关注度": "mediaAttention",
            "跨平台传播": "crossPlatformCommunication",
            "社会关注度": "socialAttention",
            "民众参与度": "publicParticipation",
            "政府支持度": "governmentSupport",
            "消费者需求": "consumerDemand",
            "市场成熟度": "marketMaturity",
            "市场增长潜力": "marketGrowthPotential",
            "竞争者数量": "competitorCount",
            "竞争者创新能力": "competitorInnovationCapability",
            "竞争壁垒": "competitiveBarriers",
            "商业模式多样性": "businessModelDiversity",
            "品牌价值": "brandValue",
            "合作机会": "cooperationOpportunities",
            "民族文化传承": "ethnicCulturalHeritage",
            "民族文化融合": "ethnicCulturalIntegration",
            "民族自豪感": "ethnicPride",
            "教育意义": "educationalSignificance",
            "社会和谐": "socialHarmony",
            "规则创新": "ruleInnovation",
            "场地设备创新": "venueEquipmentInnovation",
            "商业化创新": "commercializationInnovation",
            "跨界合作创新": "crossSectorCooperationInnovation",
            "媒体传播创新": "mediaCommunicationInnovation",
            "社交平台创新": "socialPlatformInnovation"
        };

        // 反向映射：属性名到中文指标名
        this.propertyIndicatorMap = {};
        Object.keys(this.indicatorPropertyMap).forEach(indicator => {
            this.propertyIndicatorMap[this.indicatorPropertyMap[indicator]] = indicator;
        });

        // 所有属性名列表
        this.allProperties = Object.values(this.indicatorPropertyMap);
    }

    // AHP权重计算
    calculateAHPWeights(matrix) {
        try {
            const matrixObj = new math.Matrix(matrix);
            const eigenResult = matrixObj.eigenvalues();
            const eigenvectors = matrixObj.eigenvectors();
            
            // 找到最大特征值对应的特征向量
            let maxIndex = 0;
            let maxEigenvalue = Math.abs(eigenResult[0]);
            
            for (let i = 1; i < eigenResult.length; i++) {
                if (Math.abs(eigenResult[i]) > maxEigenvalue) {
                    maxEigenvalue = Math.abs(eigenResult[i]);
                    maxIndex = i;
                }
            }
            
            const weights = eigenvectors[maxIndex].map(val => Math.abs(val));
            const sum = weights.reduce((a, b) => a + b, 0);
            
            return weights.map(w => w / sum);
        } catch (error) {
            // 如果AHP计算失败，返回均匀权重
            const dim = matrix.length;
            return new Array(dim).fill(1 / dim);
        }
    }

    // 遗传算法仿真
    geneticAlgorithmSimulation(data, weights, iterations = 50) {
        const fitnessHistory = [];
        let currentData = data.map(row => [...row]); // 深拷贝
        
        for (let it = 0; it < iterations; it++) {
            const fitness = currentData.map(individual => 
                individual.reduce((sum, val, idx) => sum + val * weights[idx], 0)
            );
            fitnessHistory.push([...fitness]);
            
            // 添加随机变异
            currentData = currentData.map(individual =>
                individual.map(val => val + (Math.random() - 0.5) * 0.2)
            );
        }
        
        return fitnessHistory;
    }

    // 综合评估IP
    evaluateIPs(ips, selectedIndicators = null) {
        if (!ips || ips.length === 0) {
            throw new Error('没有IP数据进行评估');
        }

        // 获取当前选择的指标
        const currentIndicators = selectedIndicators || this.allThird;
        
        // 转换IP数据为数组格式供算法使用
        const data = ips.map(ip => {
            // 首先确保indicators是对象格式
            let indicatorObject;
            if (Array.isArray(ip.indicators)) {
                indicatorObject = this.arrayToObject(ip.indicators);
            } else {
                indicatorObject = ip.indicators;
            }
            
            if (selectedIndicators && selectedIndicators.length > 0) {
                // 筛选模式：从完整的指标中提取选中的指标
                return selectedIndicators.map(indicator => {
                    const propertyName = this.indicatorPropertyMap[indicator];
                    if (!propertyName || !(propertyName in indicatorObject)) {
                        throw new Error(`未找到指标: ${indicator}`);
                    }
                    return indicatorObject[propertyName];
                });
            } else {
                // 全量模式：使用所有指标，按顺序转换为数组
                return this.objectToArray(indicatorObject);
            }
        });

        // 计算AHP权重（使用单位矩阵作为默认判断矩阵）
        const dim = data[0].length;
        const defaultMatrix = Array(dim).fill().map(() => Array(dim).fill(1));
        const weights = this.calculateAHPWeights(defaultMatrix);

        // 计算综合评分
        const scores = data.map(individual => 
            individual.reduce((sum, val, idx) => sum + val * weights[idx], 0)
        );

        // 运行遗传算法仿真
        const fitnessHistory = this.geneticAlgorithmSimulation(data, weights);

        // 计算标准差作为误差
        const errors = ips.map((_, idx) => {
            const ipFitness = fitnessHistory.map(iteration => iteration[idx]);
            const mean = ipFitness.reduce((sum, val) => sum + val, 0) / ipFitness.length;
            const variance = ipFitness.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / ipFitness.length;
            return Math.sqrt(variance);
        });

        return {
            scores,
            weights,
            fitnessHistory,
            errors,
            selectedIndicators: currentIndicators, // 添加使用的指标信息
            evaluation: ips.map((ip, idx) => ({
                name: ip.project_name,
                group: ip.group_name,
                score: scores[idx],
                error: errors[idx],
                rank: idx + 1 // 临时排名，需要排序后更新
            })).sort((a, b) => b.score - a.score).map((item, idx) => ({
                ...item,
                rank: idx + 1
            }))
        };
    }

    // 获取筛选后的三级指标
    getFilteredThirdIndicators(selectedFirst = [], selectedSecond = []) {
        let allowedSecond = new Set();
        
        // 根据一级指标筛选二级指标
        selectedFirst.forEach(first => {
            if (this.firstToSecond[first]) {
                this.firstToSecond[first].forEach(second => allowedSecond.add(second));
            }
        });
        
        // 添加直接选择的二级指标
        selectedSecond.forEach(second => allowedSecond.add(second));
        
        // 如果没有选择任何指标，返回所有指标
        if (allowedSecond.size === 0) {
            allowedSecond = new Set(this.secondLevel);
        }
        
        // 根据二级指标获取三级指标
        const allowedThird = [];
        Array.from(allowedSecond).forEach(second => {
            if (this.secondToThird[second]) {
                allowedThird.push(...this.secondToThird[second]);
            }
        });
        
        return this.allThird.filter(indicator => allowedThird.includes(indicator));
    }

    // 聚类分析
    performClustering(ips, clusterCount = 2) {
        if (ips.length < clusterCount) {
            throw new Error('IP数量不足以进行聚类分析');
        }

        // 转换指标数据为数组格式供算法使用
        const data = ips.map(ip => {
            if (Array.isArray(ip.indicators)) {
                return ip.indicators;
            } else {
                return this.objectToArray(ip.indicators);
            }
        });
        
        const clusters = this.kmeansClustering(data, clusterCount);
        
        return {
            clusters,
            clusterAssignment: clusters.assignment,
            centroids: clusters.centroids
        };
    }

    // 简单的K-means聚类实现
    kmeansClustering(data, k) {
        const maxIterations = 100;
        const tolerance = 1e-4;
        
        // 随机初始化质心
        let centroids = [];
        for (let i = 0; i < k; i++) {
            const randomIndex = Math.floor(Math.random() * data.length);
            centroids.push([...data[randomIndex]]);
        }
        
        let assignment = new Array(data.length);
        
        for (let iter = 0; iter < maxIterations; iter++) {
            // 分配点到最近的质心
            const newAssignment = data.map((point, idx) => {
                let minDist = Infinity;
                let closestCentroid = 0;
                
                centroids.forEach((centroid, centroidIdx) => {
                    const dist = this.euclideanDistance(point, centroid);
                    if (dist < minDist) {
                        minDist = dist;
                        closestCentroid = centroidIdx;
                    }
                });
                
                return closestCentroid;
            });
            
            // 检查收敛
            if (assignment.every((val, idx) => val === newAssignment[idx])) {
                break;
            }
            
            assignment = newAssignment;
            
            // 更新质心
            const newCentroids = [];
            for (let i = 0; i < k; i++) {
                const clusterPoints = data.filter((_, idx) => assignment[idx] === i);
                if (clusterPoints.length > 0) {
                    const centroid = new Array(data[0].length).fill(0);
                    clusterPoints.forEach(point => {
                        point.forEach((val, idx) => {
                            centroid[idx] += val;
                        });
                    });
                    centroid.forEach((val, idx) => {
                        centroid[idx] /= clusterPoints.length;
                    });
                    newCentroids.push(centroid);
                } else {
                    newCentroids.push([...centroids[i]]);
                }
            }
            
            centroids = newCentroids;
        }
        
        return {
            assignment,
            centroids
        };
    }

    // 计算欧几里得距离
    euclideanDistance(point1, point2) {
        return Math.sqrt(
            point1.reduce((sum, val, idx) => 
                sum + Math.pow(val - point2[idx], 2), 0
            )
        );
    }

    // 生成测试数据
    generateTestData(count = 10) {
        const testIPs = [];
        const counties = ['莎车县', '泽普县', '叶城县', '巴楚县'];
        const sports = ['刁羊', '赛马', '达瓦孜', '押加', '赛骆驼'];
        const experts = ['专家A', '专家B', '专家C', '专家D', '专家E'];
        
        for (let i = 0; i < count; i++) {
            const project_name = `${sports[i % sports.length]}_测试${i + 1}`;
            const group_name = counties[i % counties.length];
            const expert = experts[i % experts.length];
            
            // 生成对象格式的指标数据
            const indicators = {};
            this.allProperties.forEach(property => {
                indicators[property] = Math.round((Math.random() * 10 + 80) * 10) / 10;
            });
            
            testIPs.push({
                project_name,
                group_name,
                expert,
                indicators
            });
        }
        
        return testIPs;
    }

    // 获取指标结构
    getIndicatorStructure() {
        return {
            firstLevel: this.firstLevel,
            secondLevel: this.secondLevel,
            firstToSecond: this.firstToSecond,
            secondToThird: this.secondToThird,
            allThird: this.allThird
        };
    }

    // 获取所有三级指标
    getAllThirdIndicators() {
        return this.allThird;
    }

    // 获取所有属性名
    getAllProperties() {
        return this.allProperties;
    }

    // 获取指标属性映射
    getIndicatorPropertyMap() {
        return this.indicatorPropertyMap;
    }

    // 将数组格式的指标数据转换为对象格式
    arrayToObject(indicatorArray) {
        if (!Array.isArray(indicatorArray)) {
            throw new Error('输入必须是数组');
        }
        
        if (indicatorArray.length !== this.allThird.length) {
            throw new Error(`数组长度错误：期望${this.allThird.length}个元素，实际${indicatorArray.length}个`);
        }

        const result = {};
        this.allThird.forEach((indicator, index) => {
            const propertyName = this.indicatorPropertyMap[indicator];
            result[propertyName] = indicatorArray[index];
        });
        
        return result;
    }

    // 将对象格式的指标数据转换为数组格式
    objectToArray(indicatorObject) {
        if (!indicatorObject || typeof indicatorObject !== 'object') {
            throw new Error('输入必须是对象');
        }

        return this.allThird.map(indicator => {
            const propertyName = this.indicatorPropertyMap[indicator];
            return indicatorObject[propertyName] || 0;
        });
    }

    // 验证对象格式的指标数据
    validateIndicatorObject(indicatorObject) {
        if (!indicatorObject || typeof indicatorObject !== 'object') {
            throw new Error('指标数据必须是对象');
        }

        const missingProperties = [];
        const invalidProperties = [];

        this.allProperties.forEach(property => {
            if (!(property in indicatorObject)) {
                missingProperties.push(property);
            } else {
                const value = indicatorObject[property];
                if (typeof value !== 'number' || isNaN(value)) {
                    invalidProperties.push(`${property}: ${value}`);
                }
            }
        });

        if (missingProperties.length > 0) {
            throw new Error(`缺少指标属性: ${missingProperties.join(', ')}`);
        }

        if (invalidProperties.length > 0) {
            throw new Error(`无效的指标值: ${invalidProperties.join(', ')}`);
        }

        return true;
    }
}

module.exports = new IPEvaluationService(); 