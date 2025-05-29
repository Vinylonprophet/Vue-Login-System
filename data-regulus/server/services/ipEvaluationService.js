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
        
        // 如果使用了筛选指标，需要从完整数据中提取对应位置的值
        const data = ips.map(ip => {
            if (selectedIndicators && selectedIndicators.length > 0) {
                // 筛选模式：从完整的32个指标中提取选中的指标
                if (ip.indicators.length !== this.allThird.length) {
                    throw new Error(`IP数据格式错误：期望${this.allThird.length}个指标，实际${ip.indicators.length}个`);
                }
                
                // 根据选中的指标名称找到对应的索引位置
                const selectedIndices = selectedIndicators.map(indicator => {
                    const index = this.allThird.indexOf(indicator);
                    if (index === -1) {
                        throw new Error(`未找到指标: ${indicator}`);
                    }
                    return index;
                });
                
                // 提取选中指标对应的数值
                return selectedIndices.map(index => ip.indicators[index]);
            } else {
                // 全量模式：使用所有指标
                if (ip.indicators.length !== this.allThird.length) {
                    throw new Error(`IP数据格式错误：期望${this.allThird.length}个指标，实际${ip.indicators.length}个`);
            }
            return ip.indicators;
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
                name: ip.name,
                group: ip.group,
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

        // 简单的K-means聚类实现
        const data = ips.map(ip => ip.indicators);
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
        
        for (let i = 0; i < count; i++) {
            const name = `${sports[i % sports.length]}_测试${i + 1}`;
            const group = counties[i % counties.length];
            const indicators = this.allThird.map(() => 
                Math.round((Math.random() * 10 + 80) * 10) / 10
            );
            
            testIPs.push({
                name,
                group,
                indicators
            });
        }
        
        return testIPs;
    }
}

module.exports = new IPEvaluationService(); 