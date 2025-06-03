import { nextTick } from 'vue';
import { ipApi, pythonMLApi, type IP, type EvaluationResult, type IndicatorStructure } from '../../utils/api';
import { toast } from '../../utils/toast';
import { ChartService } from './chartService';

// 定义机器学习用的IP数据接口
interface MLIPData {
  id: string;
  project_name: string;
  group_name: string;
  expert: string;
  indicators: number[]; // 机器学习需要数组格式
  province?: string;
  city?: string;
  district?: string;
  full_address?: string;
  createdAt: string;
  updatedAt: string;
  expertCount?: number;
  _isGroup?: boolean;
}

export class DataService {
  // 加载指标结构
  static async loadIndicatorStructure(): Promise<IndicatorStructure | null> {
    try {
      const response = await ipApi.getIndicators();
      return response.data || null;
    } catch (error) {
      console.error('加载指标结构失败:', error);
      return null;
    }
  }

  // 加载组别
  static async loadGroups(): Promise<string[]> {
    try {
      const response = await ipApi.getGroups();
      return response.data || [];
    } catch (error) {
      console.error('加载组别失败:', error);
      return [];
    }
  }

  // 加载所有IP
  static async loadIPs(): Promise<IP[]> {
    try {
      const response = await ipApi.getAllIPs();
      return response.data || [];
    } catch (error) {
      console.error('加载IP失败:', error);
      return [];
    }
  }

  // 加载统计信息
  static async loadStatistics(): Promise<any> {
    try {
      const response = await ipApi.getStatistics();
      return response.data || {};
    } catch (error) {
      console.error('加载统计信息失败:', error);
      return {};
    }
  }

  // 更新筛选指标
  static async updateFilteredIndicators(
    selectedFirstLevel: string[],
    selectedSecondLevel: string[]
  ): Promise<string[]> {
    try {
      const response = await ipApi.getFilteredIndicators(
        selectedFirstLevel,
        selectedSecondLevel
      );
      return response.data || [];
    } catch (error) {
      console.error('更新筛选指标失败:', error);
      return [];
    }
  }

  // 更新筛选的IP列表
  static updateFilteredIPs(ips: IP[], ipGroupFilter: string): IP[] {
    if (ipGroupFilter === '全部') {
      return ips;
    } else {
      return ips.filter(ip => ip.group_name === ipGroupFilter);
    }
  }

  // 获取可用组别
  static getAvailableGroups(ips: IP[]): string[] {
    const groupSet = new Set(ips.map(ip => ip.group_name));
    return Array.from(groupSet);
  }

  // 执行综合分析
  static async performComprehensiveAnalysis(
    selectedIPs: string[],
    ips: IP[],
    indicatorStructure: IndicatorStructure,
    filteredThirdIndicators: string[],
    addLog: (message: string) => void,
    setLoading: (loading: boolean) => void,
    setLoadingText: (text: string) => void
  ): Promise<{
    evaluationResult: EvaluationResult | null;
    neuralNetworkResult: any;
    shapResult: any;
    pcaResult: any;
    advancedClusterResult: any;
    advancedClusterImage: string;
  }> {
    if (selectedIPs.length < 2) {
      toast.warning('请至少选择2个IP进行全面分析');
      throw new Error('选择的IP数量不足');
    }
    
    // 获取选中的IP数据，并计算多专家平均值
    const selectedIPData: IP[] = [];
    for (const ipId of selectedIPs) {
      const ip = ips.find(item => item.id === ipId);
      if (!ip) continue;
      
      if (ip._isGroup) {
        // 这是多专家聚合记录，需要获取所有专家数据并计算平均值
        try {
          const expertsResponse = await ipApi.getExpertScoresByIP(ip.project_name, ip.group_name);
          if (expertsResponse.data && expertsResponse.data.length > 0) {
            const expertScores = expertsResponse.data;
            
            // 计算平均值
            const averageIndicators: Record<string, number> = {};
            const allProperties = indicatorStructure.allProperties || Object.keys(expertScores[0].indicators);
            
            allProperties.forEach(property => {
              const sum = expertScores.reduce((acc, expert) => {
                return acc + (expert.indicators[property] || 0);
              }, 0);
              averageIndicators[property] = sum / expertScores.length;
            });
            
            // 创建平均值IP记录
            selectedIPData.push({
              ...ip,
              expert: `${expertScores.length}位专家平均`,
              indicators: averageIndicators
            });
          }
        } catch (error) {
          console.error(`获取IP ${ip.project_name} 的专家数据失败:`, error);
          addLog(`⚠️ 获取IP "${ip.project_name}" 的专家数据失败，跳过该IP`);
        }
      } else {
        // 单一专家记录，直接使用
        selectedIPData.push(ip);
      }
    }
    
    if (selectedIPData.length < 2) {
      toast.warning('有效IP数量不足2个，无法进行分析');
      throw new Error('有效IP数量不足');
    }
    
    // 临时存储分析结果
    let tempEvaluationResult: any = null;
    let tempNeuralNetworkResult: any = null;
    let tempShapResult: any = null;
    let tempPcaResult: any = null;
    let tempAdvancedClusterResult: any = null;
    let tempAdvancedClusterImage: string = '';
    
    // 使用toast的withAnalysis方法
    await toast.withAnalysis(
      async () => {
        setLoading(true);
        setLoadingText('全面分析中...');
        
        addLog('=== 开始全面分析 ===');
        addLog(`选中IP数量: ${selectedIPs.length}`);
        addLog(`有效分析IP数量: ${selectedIPData.length}`);
        addLog(`分析IP列表: ${selectedIPData.map(ip => `${ip.project_name}(${ip.expert})`).join(', ')}`);
        
        // 步骤1: 基础评估
        const response = await ipApi.evaluateSelected(selectedIPData, filteredThirdIndicators);
        if (response.data) {
          tempEvaluationResult = response.data;
        }

        // 步骤2: 神经网络训练
        if (selectedIPs.length >= 5) {
          setLoadingText('神经网络训练中...');
          try {
            const currentFeatureNames = filteredThirdIndicators.length > 0 
              ? filteredThirdIndicators 
              : indicatorStructure.allThird;
            
            const ipsWithArrayIndicators = this.convertIPDataForML(selectedIPData, indicatorStructure, filteredThirdIndicators);
            
            const nnResponse = await pythonMLApi.trainNeuralNetwork(ipsWithArrayIndicators, currentFeatureNames);
            if (nnResponse.success && nnResponse.data) {
              tempNeuralNetworkResult = nnResponse.data;
            } else {
              addLog(`⚠️ 神经网络训练失败: ${nnResponse.error || '未知错误'}`);
            }
          } catch (error) {
            addLog(`⚠️ 神经网络训练失败: ${error}`);
          }
        } else {
          addLog('⚠️ 选中IP数量不足5个，跳过神经网络训练');
        }

        // 步骤3: SHAP模型解释
        if (selectedIPs.length >= 3) {
          setLoadingText('SHAP分析中...');
          try {
            const currentFeatureNames = filteredThirdIndicators.length > 0 
              ? filteredThirdIndicators 
              : indicatorStructure.allThird;
            
            addLog(`📊 准备SHAP分析：筛选指标数量 ${currentFeatureNames.length}，指标名称：${currentFeatureNames.slice(0, 3).join(', ')}${currentFeatureNames.length > 3 ? '...' : ''}`);
            
            const ipsWithArrayIndicators = this.convertIPDataForML(selectedIPData, indicatorStructure, filteredThirdIndicators);
            
            // 检查数据维度
            if (ipsWithArrayIndicators.length > 0) {
              const firstIPIndicatorCount = ipsWithArrayIndicators[0].indicators.length;
              addLog(`🔍 IP数据维度检查：${ipsWithArrayIndicators.length}个IP，每个IP ${firstIPIndicatorCount}个指标值`);
              
              if (firstIPIndicatorCount !== currentFeatureNames.length) {
                addLog(`⚠️ 警告：指标名称数量(${currentFeatureNames.length})与数据维度(${firstIPIndicatorCount})不匹配！`);
              }
            }
            
            const shapResponse = await pythonMLApi.shapExplain(ipsWithArrayIndicators, currentFeatureNames);
            if (shapResponse.success && shapResponse.data) {
              tempShapResult = shapResponse.data;
              addLog(`✅ SHAP分析完成，返回特征名称数量：${shapResponse.data.feature_names?.length || 0}`);
            } else {
              addLog(`⚠️ SHAP分析失败: ${shapResponse.error || '未知错误'}`);
            }
          } catch (error) {
            addLog(`⚠️ SHAP分析失败: ${error}`);
          }
        } else {
          addLog('⚠️ 选中IP数量不足3个，跳过SHAP分析');
        }

        // 步骤4: PCA降维分析
        if (selectedIPs.length >= 2) {
          setLoadingText('PCA分析中...');
          try {
            const ipsWithArrayIndicators = this.convertIPDataForML(selectedIPData, indicatorStructure, filteredThirdIndicators);
            
            const pcaResponse = await pythonMLApi.pcaAnalysis(ipsWithArrayIndicators, 2);
            if (pcaResponse.success) {
              tempPcaResult = pcaResponse;
            } else {
              addLog(`⚠️ PCA分析失败: ${pcaResponse.error || '未知错误'}`);
            }
          } catch (error) {
            addLog(`⚠️ PCA分析失败: ${error}`);
          }
        } else {
          addLog('⚠️ 选中IP数量不足2个，跳过PCA分析');
        }

        // 步骤5: 高级聚类分析
        if (selectedIPs.length >= 2) {
          setLoadingText('聚类分析中...');
          try {
            const ipsWithArrayIndicators = this.convertIPDataForML(selectedIPData, indicatorStructure, filteredThirdIndicators);
            
            const clusterResponse = await pythonMLApi.advancedClustering(ipsWithArrayIndicators, 2, true);
            if (clusterResponse.success && clusterResponse.data) {
              tempAdvancedClusterResult = clusterResponse.data;
              // 生成聚类图像
              const imageResponse = await this.generateAdvancedClusteringVisualizationFromData(clusterResponse.data, addLog);
              if (imageResponse) {
                tempAdvancedClusterImage = imageResponse;
              }
            } else {
              addLog(`⚠️ 聚类分析失败: ${clusterResponse.error || '未知错误'}`);
            }
          } catch (error) {
            addLog(`⚠️ 聚类分析失败: ${error}`);
          }
        } else {
          addLog('⚠️ 选中IP数量不足2个，跳过高级聚类分析');
        }
        
        setLoadingText('全面分析中...');
      },
      {
        successMessage: `✅ 分析完成！已处理 ${selectedIPs.length} 个IP`,
        errorMessage: '分析失败，请检查数据后重试'
      }
    );
    
    addLog('🎉 全面分析完成');
    addLog('🎨 开始显示分析结果...');
    
    // 确保loading状态被重置
    setLoading(false);
    setLoadingText('');
    
    return {
      evaluationResult: tempEvaluationResult,
      neuralNetworkResult: tempNeuralNetworkResult,
      shapResult: tempShapResult,
      pcaResult: tempPcaResult,
      advancedClusterResult: tempAdvancedClusterResult,
      advancedClusterImage: tempAdvancedClusterImage
    };
  }

  // 转换IP数据格式为机器学习所需格式
  private static convertIPDataForML(selectedIPData: IP[], indicatorStructure: IndicatorStructure, filteredThirdIndicators?: string[]): MLIPData[] {
    return selectedIPData.map(ip => {
      // 如果indicators已经是数组格式，直接使用（虽然类型上不应该出现）
      if (Array.isArray(ip.indicators)) {
        return { ...ip, indicators: ip.indicators } as MLIPData;
      }
      
      // indicators是对象格式，需要转换为数组
      const indicatorArray: number[] = [];
      
      // 如果提供了筛选指标，则只使用筛选后的指标
      if (filteredThirdIndicators && filteredThirdIndicators.length > 0) {
        filteredThirdIndicators.forEach(indicatorName => {
          // 通过指标中文名称找到对应的属性名
          const propertyName = indicatorStructure.indicatorPropertyMap?.[indicatorName];
          if (propertyName) {
            indicatorArray.push((ip.indicators as Record<string, number>)[propertyName] || 0);
          } else {
            console.warn(`找不到指标 "${indicatorName}" 对应的属性名`);
            indicatorArray.push(0);
          }
        });
      } else {
        // 如果没有筛选指标，使用全部指标（兜底方案）
        if (indicatorStructure.allProperties && indicatorStructure.allProperties.length > 0) {
          // 按照系统定义的属性顺序生成数组
          indicatorStructure.allProperties.forEach(property => {
            indicatorArray.push((ip.indicators as Record<string, number>)[property] || 0);
          });
        } else {
          // 兜底方案：如果没有属性映射，直接使用对象值
          indicatorArray.push(...Object.values(ip.indicators as Record<string, number>));
        }
      }
      
      return { ...ip, indicators: indicatorArray } as MLIPData;
    });
  }

  // 生成高级聚类可视化图表
  private static async generateAdvancedClusteringVisualizationFromData(
    data: any, 
    addLog: (message: string) => void
  ): Promise<string | null> {
    try {
      const response = await pythonMLApi.generateAdvancedPlot('clustering_with_hull', {
        clustering_results: data.clustering_results,
        convex_hulls: data.convex_hulls,
        pca_info: data.pca_info || {}  // 传递PCA信息
      });
      
      if (response.success) {
        return response.image;
      } else {
        addLog(`生成聚类图表失败: ${response.error}`);
        return null;
      }
    } catch (error) {
      console.error('生成高级聚类图表错误:', error);
      addLog('生成聚类图表失败');
      return null;
    }
  }

  // 渲染所有图表
  static async renderAllCharts(
    evaluationResult: EvaluationResult | null,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    filteredThirdIndicators: string[],
    allThird: string[]
  ) {
    addLog('✅ 所有结果已显示完成');
    
    await nextTick();
    ChartService.renderCharts(evaluationResult, filteredThirdIndicators);
    ChartService.renderNeuralNetworkCharts(neuralNetworkResult, filteredThirdIndicators, allThird);
    ChartService.renderSHAPChart(shapResult);
    ChartService.renderPCAChart(pcaResult);
  }

  // IP选择相关方法
  static toggleIPSelection(ipId: string, selectedIPs: string[]): string[] {
    const index = selectedIPs.indexOf(ipId);
    const newSelectedIPs = [...selectedIPs];
    
    if (index > -1) {
      newSelectedIPs.splice(index, 1);
    } else {
      newSelectedIPs.push(ipId);
    }
    
    return newSelectedIPs;
  }

  static selectAllFilteredIPs(filteredIPs: IP[]): string[] {
    return filteredIPs.map(ip => ip.id);
  }

  static clearSelection(): string[] {
    return [];
  }

  static isIPSelected(ipId: string, selectedIPs: string[]): boolean {
    return selectedIPs.includes(ipId);
  }

  // 初始化数据加载
  static async loadInitialData(): Promise<{
    indicatorStructure: IndicatorStructure;
    ips: IP[];
    statistics: any;
    availableGroups: string[];
    filteredIPs: IP[];
  }> {
    const [indicatorStructure, ips, statistics] = await Promise.all([
      this.loadIndicatorStructure(),
      this.loadIPs(),
      this.loadStatistics()
    ]);

    const availableGroups = this.getAvailableGroups(ips);
    const filteredIPs = this.updateFilteredIPs(ips, '全部');

    return {
      indicatorStructure: indicatorStructure || {
        firstLevel: [],
        secondLevel: [],
        firstToSecond: {},
        secondToThird: {},
        allThird: [],
        indicatorPropertyMap: {},
        propertyIndicatorMap: {},
        allProperties: []
      },
      ips,
      statistics,
      availableGroups,
      filteredIPs
    };
  }
}

// 添加缺失的addLog函数声明
declare function addLog(message: string): void; 