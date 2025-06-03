import { ref, nextTick } from 'vue';
import { ipApi } from '../../utils/api';

export interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export class AIService {
  // 格式化AI消息
  static formatAIMessage(message: string): string {
    if (!message) return '';
    
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
      .replace(/### (.*?)(\n|$)/g, '<h4>$1</h4>') // 三级标题
      .replace(/## (.*?)(\n|$)/g, '<h3>$1</h3>') // 二级标题
      .replace(/# (.*?)(\n|$)/g, '<h2>$1</h2>') // 一级标题
      .replace(/\n\n/g, '</p><p>') // 段落
      .replace(/\n/g, '<br>') // 换行
      .replace(/^\s*(.*)/g, '<p>$1</p>') // 包装段落
      .replace(/<\/p><p><\/p>/g, '</p>');
  }

  // 格式化消息时间
  static formatMessageTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // 添加聊天消息
  static addChatMessage(aiChatHistory: any[], type: 'user' | 'ai', content: string, chatMessages: any) {
    aiChatHistory.push({
      type,
      content,
      timestamp: new Date().toISOString()
    });
    
    // 滚动到底部
    nextTick(() => {
      if (chatMessages.value) {
        chatMessages.value.scrollTop = chatMessages.value.scrollHeight;
      }
    });
  }

  // 统一的AI分析函数
  static async performUnifiedAIAnalysis(
    prompt: string, 
    isForPDF: boolean = false,
    selectedIPCount: number,
    indicatorCount: number,
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    advancedClusterResult: any,
    chartTabs: any[],
    isChartAnalysisMode: boolean,
    aiChatHistory?: any[]
  ): Promise<string> {
    try {
      // 准备分析数据
      const analysisData = {
        selectedIPCount: selectedIPCount,
        indicatorCount: indicatorCount,
        evaluationResult: evaluationResult,
        weights: evaluationResult?.weights,
        neuralNetworkResult: neuralNetworkResult,
        shapResult: shapResult,
        pcaResult: pcaResult,
        advancedClusterResult: advancedClusterResult,
        customPrompt: prompt
      };
      
      // 获取当前可用的图表类型
      const availableCharts = chartTabs
        .filter(tab => !tab.disabled)
        .map(tab => tab.title);
      
      const response = await ipApi.aiAnalysis(analysisData, availableCharts, isChartAnalysisMode);
      
      if (response.success && response.data?.analysis) {
        // 如果不是PDF调用，添加到聊天记录
        if (!isForPDF && aiChatHistory) {
          this.addChatMessage(aiChatHistory, 'ai', response.data.analysis, null);
        }
        return response.data.analysis;
      } else {
        const errorMsg = '抱歉，分析失败了。请稍后再试。';
        if (!isForPDF && aiChatHistory) {
          this.addChatMessage(aiChatHistory, 'ai', errorMsg, null);
        }
        return errorMsg;
      }
    } catch (error) {
      console.error('AI分析失败:', error);
      const errorMsg = `分析出错：${error}`;
      if (!isForPDF && aiChatHistory) {
        this.addChatMessage(aiChatHistory, 'ai', errorMsg, null);
      }
      return errorMsg;
    }
  }

  // 获取图表AI分析
  static async getChartAIAnalysis(
    chartId: string,
    selectedIPCount: number,
    indicatorCount: number,
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    advancedClusterResult: any,
    chartTabs: any[],
    isChartAnalysisMode: boolean
  ): Promise<string> {
    try {
      let analysisPrompt = '';
      
      switch (chartId) {
        case 'fitness':
          analysisPrompt = '请详细分析适应度变化图表，重点说明遗传算法的优化过程、收敛趋势和训练效果，控制在100-150字内。';
          break;
        case 'scores':
          analysisPrompt = '请详细分析IP评分分布图表，识别表现优秀和需要改进的项目，并提供针对性建议，控制在100-150字内。';
          break;
        case 'radar':
          analysisPrompt = '请详细分析指标权重雷达图，解释各指标的相对重要性和关键影响因素，控制在100-150字内。';
          break;
        case 'neural':
          analysisPrompt = '请详细分析神经网络训练图表，评估模型的学习能力、收敛速度和性能表现，控制在100-150字内。';
          break;
        case 'importance':
          analysisPrompt = '请详细分析特征重要性图表，识别对预测结果最有影响力的特征及其业务意义，控制在100-150字内。';
          break;
        case 'shap':
          analysisPrompt = '请详细分析SHAP图表，解释模型的可解释性分析结果和各特征的贡献度，控制在100-150字内。';
          break;
        case 'pca':
          analysisPrompt = '请详细分析PCA降维图表，解释主成分和数据分布，控制在100-150字内。';
          break;
        case 'cluster':
          analysisPrompt = '请详细分析聚类图表，解释分组模式和聚类特征，控制在100-150字内。';
          break;
        default:
          return '该图表暂无可用分析。';
      }
      
      const result = await this.performUnifiedAIAnalysis(
        analysisPrompt, 
        true, // isForPDF
        selectedIPCount,
        indicatorCount,
        evaluationResult,
        neuralNetworkResult,
        shapResult,
        pcaResult,
        advancedClusterResult,
        chartTabs,
        isChartAnalysisMode
      );
      
      // 清理AI分析结果，移除HTML标签，保持简洁
      return result
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/\*\*/g, '') // 移除粗体标记
        .replace(/###?\s*/g, '') // 移除标题标记
        .trim();
    } catch (error) {
      console.error(`AI分析失败 for chart ${chartId}:`, error);
      return '由于技术问题，该图表的AI分析暂时不可用。';
    }
  }

  // 获取学术化分析
  static async getAcademicAnalysis(
    chartId: string,
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    advancedClusterResult: any,
    selectedIPCount: number,
    indicatorCount: number,
    chartTabs: any[],
    isChartAnalysisMode: boolean
  ): Promise<string> {
    try {
      let analysisPrompt = '';
      let chartSpecificData = '';
      
      switch (chartId) {
        case 'fitness':
          if (evaluationResult?.fitnessHistory) {
            const lastGen = evaluationResult.fitnessHistory.length;
            const finalFitness = evaluationResult.fitnessHistory[lastGen - 1];
            const avgFinalFitness = finalFitness.reduce((a: number, b: number) => a + b, 0) / finalFitness.length;
            chartSpecificData = `迭代次数：${lastGen}代，最终平均适应度：${avgFinalFitness.toFixed(4)}`;
          }
          analysisPrompt = `基于遗传算法适应度曲线图，分析算法的收敛过程。${chartSpecificData}。只分析这个图表显示的信息，不要提及其他图表。要求：专注于适应度变化趋势、收敛速度、优化效果。字数控制在300-500字。`;
          break;
          
        case 'scores':
          if (evaluationResult?.evaluation) {
            const scores = evaluationResult.evaluation.map((e: any) => e.score);
            const maxScore = Math.max(...scores);
            const minScore = Math.min(...scores);
            chartSpecificData = `IP数量：${scores.length}个，最高分：${maxScore.toFixed(2)}，最低分：${minScore.toFixed(2)}`;
          }
          analysisPrompt = `基于IP评分分布柱状图，分析各IP的得分情况。${chartSpecificData}。只分析评分分布特征，不要提及其他分析方法。要求：专注于分数分布、差异性、优劣势项目识别。字数控制在300-500字。`;
          break;
          
        case 'radar':
          if (evaluationResult?.weights) {
            const topN = 5;
            const sortedWeights = evaluationResult.weights
              .map((w: number, i: number) => ({ weight: w, index: i }))
              .sort((a: any, b: any) => b.weight - a.weight)
              .slice(0, topN);
            chartSpecificData = `最重要的${topN}个指标权重：${sortedWeights.map((w: any) => w.weight.toFixed(4)).join(', ')}`;
          }
          analysisPrompt = `基于指标权重雷达图，分析各维度的相对重要性。${chartSpecificData}。只分析权重分布，不要提及其他图表。要求：专注于权重大小、指标重要性排序、维度平衡性。字数控制在300-500字。`;
          break;
          
        case 'neural':
          if (neuralNetworkResult?.training_losses) {
            const losses = neuralNetworkResult.training_losses;
            const initialLoss = losses[0];
            const finalLoss = losses[losses.length - 1];
            chartSpecificData = `训练轮次：${losses.length}，初始损失：${initialLoss.toFixed(4)}，最终损失：${finalLoss.toFixed(4)}`;
          }
          analysisPrompt = `基于神经网络训练损失曲线，分析模型的训练过程。${chartSpecificData}。只分析损失变化，不要提及其他分析。要求：专注于损失下降趋势、收敛情况、训练效果评估。字数控制在300-500字。`;
          break;
          
        case 'importance':
          if (neuralNetworkResult?.feature_importance) {
            const importance = neuralNetworkResult.feature_importance;
            const maxImportance = Math.max(...importance);
            chartSpecificData = `特征数量：${importance.length}，最高重要性：${maxImportance.toFixed(4)}`;
          }
          analysisPrompt = `基于特征重要性柱状图，分析各特征对模型的贡献。${chartSpecificData}。只分析特征重要性，不要提及其他内容。要求：专注于重要特征识别、特征贡献度差异、关键因素分析。字数控制在300-500字。`;
          break;
          
        case 'shap':
          if (shapResult?.ip_explanations) {
            const ipCount = shapResult.ip_explanations.length;
            chartSpecificData = `分析样本数：${ipCount}个IP`;
          }
          analysisPrompt = `基于SHAP蜂群图，分析模型的可解释性。${chartSpecificData}。只分析SHAP值分布，不要提及其他方法。要求：专注于特征贡献度、正负影响、个体差异性。字数控制在300-500字。`;
          break;
          
        case 'pca':
          if (pcaResult?.explained_variance_ratio) {
            const var1 = (pcaResult.explained_variance_ratio[0] * 100).toFixed(1);
            const var2 = (pcaResult.explained_variance_ratio[1] * 100).toFixed(1);
            chartSpecificData = `PC1方差贡献：${var1}%，PC2方差贡献：${var2}%`;
          }
          analysisPrompt = `基于PCA降维散点图，分析数据的主成分结构。${chartSpecificData}。只分析降维结果，不要提及其他分析。要求：专注于主成分解释、数据分布模式、样本聚集特征。字数控制在300-500字。`;
          break;
          
        case 'cluster':
          if (advancedClusterResult?.clustering_results) {
            const clusterCount = new Set(advancedClusterResult.clustering_results.map((r: any) => r.cluster)).size;
            chartSpecificData = `聚类数量：${clusterCount}个`;
          }
          analysisPrompt = `基于聚类分析图（含凸包），分析样本的分组特征。${chartSpecificData}。只分析聚类结果，不要提及其他内容。要求：专注于聚类质量、分组特征、类间差异。字数控制在300-500字。`;
          break;
          
        default:
          return this.getDefaultAcademicAnalysis(chartId);
      }
      
      // 使用AI分析，传入更精确的提示
      const analysisResponse = await this.performUnifiedAIAnalysis(
        analysisPrompt, 
        true, // isForPDF
        selectedIPCount,
        indicatorCount,
        evaluationResult,
        neuralNetworkResult,
        shapResult,
        pcaResult,
        advancedClusterResult,
        chartTabs,
        isChartAnalysisMode
      );
      
      // 清理并学术化处理
      return analysisResponse
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/\*\*/g, '') // 移除粗体标记
        .replace(/###?\s*/g, '') // 移除标题标记
        .replace(/AI分析|人工智能|智能分析|机器学习模型/g, '计算模型')
        .replace(/通过分析|可以看出|显示了/g, '分析结果表明')
        .replace(/建议|推荐/g, '研究发现')
        .trim();
    } catch (error) {
      console.error(`学术分析失败 for chart ${chartId}:`, error);
      return this.getDefaultAcademicAnalysis(chartId);
    }
  }

  // 获取默认学术化分析
  static getDefaultAcademicAnalysis(chartId: string): string {
    const defaultAnalyses: Record<string, string> = {
      'fitness': '遗传算法的适应度函数在迭代过程中呈现良好的收敛特性，表明权重优化策略具有较强的搜索能力和稳定性。算法的收敛速度和最终适应度值反映了评价体系设计的合理性，为后续分析提供了可靠的权重配置基础。',
      'scores': '评分分布结果显示了样本间的差异化特征，体现了评价体系的区分度和敏感性。不同项目在综合得分上的分布规律为识别优势项目和发展短板提供了量化依据，有助于制定针对性的改进策略。',
      'radar': '权重雷达图揭示了各维度指标在评价体系中的相对重要性，体现了专家知识与数据驱动相结合的权重配置方法。主要维度的权重分布符合理论预期，为评价结果的可信度提供了支撑。',
      'neural': '神经网络模型在训练过程中展现出良好的学习能力，损失函数的下降趋势表明模型能够有效捕捉输入特征与目标变量间的非线性关系。模型的收敛性能为复杂评价问题的建模提供了有效工具。',
      'importance': '特征重要性分析结果识别了对模型预测具有关键影响的因子，为理解评价机制提供了深层次洞察。重要性排序为特征选择和模型优化提供了科学依据，有助于提升预测准确性。',
      'shap': 'SHAP值分析增强了模型的可解释性，通过量化各特征对预测结果的边际贡献，揭示了决策过程的透明度。这种解释性分析对于建立可信的评价模型具有重要意义。',
      'pca': '主成分分析有效实现了高维数据的降维处理，前两个主成分包含了原始数据的主要信息。降维结果在保持数据结构完整性的同时，为后续分析提供了更加简洁的特征空间。',
      'cluster': '聚类分析识别了样本的内在分组结构，不同簇的形成反映了项目在多维特征空间中的相似性模式。聚类结果为制定分类管理策略和识别典型发展模式提供了参考。'
    };
    
    return defaultAnalyses[chartId] || '该维度的实证分析结果为研究提供了重要的数据支撑和理论验证。';
  }

  // 获取学术化章节标题
  static getAcademicSectionTitle(chartId: string): string {
    const sectionTitles: Record<string, string> = {
      'fitness': '4.1 权重优化算法收敛性分析',
      'scores': '4.2 综合评价结果分布特征',
      'radar': '4.3 指标权重配置合理性验证',
      'neural': '4.4 神经网络模型学习性能',
      'importance': '4.5 关键影响因子识别分析',
      'shap': '4.6 模型可解释性分析结果',
      'pca': '4.7 多维数据降维效果评估',
      'cluster': '4.8 样本聚类结构特征分析'
    };
    
    return sectionTitles[chartId] || '4.X 相关分析结果';
  }

  // 获取AI生成内容的通用函数
  static async getAIGeneratedContent(
    contentType: string, 
    ipCount: number, 
    indicatorCount: number,
    selectedIPCount: number,
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    advancedClusterResult: any,
    chartTabs: any[],
    isChartAnalysisMode: boolean
  ): Promise<string> {
    try {
      let prompt = '';
      
      switch (contentType) {
        case 'abstract':
          prompt = `请为《基于多维评价体系的少数民族体育IP品牌塑造路径研究》撰写学术论文摘要。研究样本${ipCount}个IP项目，使用${indicatorCount}项指标。要求包含：研究背景、方法、主要发现、创新点、实践意义。字数400-500字，体现学术严谨性，包含关键词。`;
          break;
        case 'background':
          prompt = `请撰写少数民族体育IP品牌塑造研究的背景与意义章节。包含：1.1研究背景(当前发展现状、存在问题)，1.2研究意义(理论价值、实践意义)，1.3研究目标(3个具体目标)。要求学术化表达，逻辑清晰，字数800-1000字。`;
          break;
        case 'method':
          prompt = `请撰写研究方法与数据来源章节。包含：2.1研究方法(遗传算法、神经网络、SHAP分析等)，2.2数据来源与样本(${ipCount}个IP项目，${indicatorCount}项指标)，2.3技术路线。要求专业术语准确，方法论述清晰，字数700-900字。`;
          break;
        case 'analysis_intro':
          prompt = `请撰写"3.评价体系构建与算法优化"和"4.实证分析结果"两个章节的引言部分。说明评价体系的构建逻辑、算法选择依据，以及实证分析的整体思路。要求学术严谨，逻辑清晰，字数500-600字。`;
          break;
        case 'branding_path':
          prompt = `请撰写"品牌塑造路径设计"章节。基于前面的实证分析结果，提出少数民族体育IP的品牌塑造路径。包含：5.1三位一体塑造模式，5.2差异化发展策略，5.3协同发展机制。要求实用性强，可操作性强，字数1000-1200字。`;
          break;
        case 'policy_suggestions':
          prompt = `请撰写"政策建议与实践指导"章节。包含：6.1政策支持建议(具体政策措施)，6.2运营实践指导(操作性建议)，6.3发展路径优化(实施方案)。要求针对性强，可行性高，字数800-1000字。`;
          break;
        case 'conclusion':
          prompt = `请撰写"结论与展望"章节。包含：7.1主要结论(研究发现总结)，7.2研究贡献(理论贡献、实践贡献、方法贡献)，7.3研究展望(未来研究方向)。要求高度概括，前瞻性强，字数600-800字。`;
          break;
        default:
          return '<p>内容生成中...</p>';
      }
      
      // 使用统一的AI分析函数
      const aiResponse = await this.performUnifiedAIAnalysis(
        prompt, 
        true, // isForPDF
        selectedIPCount,
        indicatorCount,
        evaluationResult,
        neuralNetworkResult,
        shapResult,
        pcaResult,
        advancedClusterResult,
        chartTabs,
        isChartAnalysisMode
      );
      
      // 学术化处理
      return aiResponse
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/\*\*/g, '') // 移除粗体标记
        .replace(/###?\s*/g, '') // 移除标题标记
        .replace(/AI分析|人工智能|智能分析|机器学习模型/g, '计算模型')
        .replace(/通过分析|可以看出|显示了/g, '分析结果表明')
        .replace(/建议|推荐/g, '研究发现')
        .split('\n')
        .map(paragraph => paragraph.trim() ? `<p style="text-align: justify; line-height: 1.8; margin-bottom: 15px;">${paragraph.trim()}</p>` : '')
        .join('')
        .replace(/^<p[^>]*>(\d+\.\d*\s*[^<]+)<\/p>/gm, '<h3 style="font-size: 16px; color: #2c3e50; margin: 20px 0 10px 0;">$1</h3>')
        .replace(/^<p[^>]*>([^<]*章节?[^<]*)<\/p>/gm, '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 5px;">$1</h2>');
    } catch (error) {
      console.error(`AI内容生成失败 for ${contentType}:`, error);
      return this.getDefaultContent(contentType);
    }
  }

  // 默认内容模板
  static getDefaultContent(contentType: string): string {
    const defaults: Record<string, string> = {
      'abstract': '<p style="text-align: justify; line-height: 1.8; margin-bottom: 15px;">本研究构建了少数民族体育IP的多维评价体系...</p>',
      'background': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">1. 研究背景与意义</h2><p style="text-align: justify; line-height: 1.8;">研究背景生成中...</p>',
      'method': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">2. 研究方法与数据来源</h2><p style="text-align: justify; line-height: 1.8;">研究方法生成中...</p>',
      'analysis_intro': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">3. 评价体系构建与算法优化</h2><p style="text-align: justify; line-height: 1.8;">实证分析引言生成中...</p>',
      'branding_path': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">5. 品牌塑造路径设计</h2><p style="text-align: justify; line-height: 1.8;">品牌塑造路径内容生成中...</p>',
      'policy_suggestions': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">6. 政策建议与实践指导</h2><p style="text-align: justify; line-height: 1.8;">政策建议内容生成中...</p>',
      'conclusion': '<h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">7. 结论与展望</h2><p style="text-align: justify; line-height: 1.8;">结论内容生成中...</p>'
    };
    
    return defaults[contentType] || '<p>内容生成中...</p>';
  }

  // 获取中文图表标题
  static getChineseChartTitle(chartId: string): string {
    const titleMap: Record<string, string> = {
      'fitness': '遗传算法适应度变化曲线',
      'scores': 'IP评分分布图',
      'radar': '关键指标权重雷达图',
      'neural': '神经网络训练损失曲线',
      'importance': '特征重要性分析图',
      'shap': 'SHAP特征贡献度分析图',
      'pca': 'PCA主成分降维图',
      'cluster': '高级聚类分析图'
    };
    
    return titleMap[chartId] || '未知图表';
  }
} 