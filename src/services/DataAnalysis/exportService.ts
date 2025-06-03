import { nextTick } from 'vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Chart } from 'chart.js';
import { toast } from '../../utils/toast';
import { ipApi } from '../../utils/api';
import { AIService } from './aiService';
import { ChartService } from './chartService';

export class ExportService {
  // 执行PDF导出
  static async performPDFExport(
    selectedChartIds: string[],
    hasAnalysisResults: boolean,
    selectedIPs: string[],
    filteredThirdIndicators: string[],
    chartTabs: any[],
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    advancedClusterResult: any,
    // advancedClusterImage: string, // 暂时不使用
    activeChart: any,
    isChartAnalysisMode: boolean,
    addLog: (message: string) => void,
    setLoading: (loading: boolean) => void,
    setLoadingText: (text: string) => void
  ) {
    if (!hasAnalysisResults) {
      toast.warning('请先进行全面分析后再导出PDF');
      return;
    }
    
    try {
      setLoading(true);
      setLoadingText('准备导出PDF...');
      
      // 保存当前激活的图表
      const originalActiveChart = activeChart.value;
      
      // 计算有多少个图表需要导出 - 使用用户选择的图表
      const charts = chartTabs
        .filter(tab => selectedChartIds.includes(tab.id) && !tab.disabled)
        .map(tab => ({
          id: tab.id,
          title: AIService.getChineseChartTitle(tab.id),
          condition: true // 用户已选择且可用
        }));
      
      const validCharts = charts;
      
      addLog(`🚀 开始PDF导出流程`);
      addLog(`📊 用户选择图表: ${selectedChartIds.length} 个`);
      addLog(`✅ 实际导出图表: ${validCharts.length} 个`);
      addLog(`📋 图表列表: ${validCharts.map(c => c.title).join(', ')}`);
      addLog(`⏰ 预计需要 ${Math.ceil(validCharts.length * 2)} 秒完成（优化后）`);
      addLog(`💡 使用HTML转PDF方式，完美支持中文显示`);
      addLog(`🤖 每个图表都将生成专业AI分析`);
      
      // 简化的图表状态检查 - 只做基本检查
      addLog(`🔍 开始图表状态检查...`);
      setLoadingText('检查图表状态...');
      
      // 确保当前是在合适的图表上
      if (validCharts.length > 0) {
        activeChart.value = validCharts[0].id;
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 简短等待
        addLog(`✅ 图表环境已准备就绪`);
      }
      
      // 创建临时容器来放置PDF内容
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm'; // A4宽度
      tempContainer.style.padding = '20px';
      tempContainer.style.fontFamily = 'Arial, "Microsoft YaHei", "SimSun", sans-serif';
      tempContainer.style.fontSize = '14px';
      tempContainer.style.lineHeight = '1.6';
      tempContainer.style.color = '#333';
      tempContainer.style.backgroundColor = 'white';
      document.body.appendChild(tempContainer);
      
      // 获取AI生成的各种内容 - 传入selectedChartIds确保只基于选中的图表生成内容
      const backgroundContent = await this.getAIContent('background', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      const methodContent = await this.getAIContent('method', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      const abstractContent = await this.getAIContent('abstract', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      
      // 创建PDF内容结构
      this.createPDFContent(tempContainer, selectedIPs.length, filteredThirdIndicators.length, abstractContent, backgroundContent, methodContent, validCharts, selectedChartIds, chartTabs);
      
      // 获取实证分析引言 - 只基于选中的图表
      const analysisIntroContent = await this.getAIContent('analysis_intro', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      
      const analysisHeaderSection = document.createElement('div');
      analysisHeaderSection.style.pageBreakBefore = 'always';
      analysisHeaderSection.innerHTML = `
        <div style="margin-bottom: 30px;">
          ${analysisIntroContent}
        </div>
      `;
      tempContainer.appendChild(analysisHeaderSection);
      
      // 处理每个图表
      await this.processChartsForPDF(
        validCharts, 
        activeChart, 
        tempContainer, 
        evaluationResult,
        neuralNetworkResult,
        shapResult,
        pcaResult,
        advancedClusterResult,
        filteredThirdIndicators,
        chartTabs,
        selectedChartIds, // 传入选中的图表ID
        isChartAnalysisMode,
        setLoadingText,
        addLog
      );
      
      // 添加其他章节 - 只基于选中的图表
      await this.addPDFSections(tempContainer, selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      
      // 恢复原来的激活图表
      activeChart.value = originalActiveChart;
      
      // 生成PDF文件
      await this.generatePDFFile(tempContainer, validCharts.length, setLoadingText, addLog);
      
      // 清理临时容器
      document.body.removeChild(tempContainer);
      
    } catch (error) {
      console.error('PDF导出失败:', error);
      addLog(`❌ PDF导出失败: ${error}`);
      toast.fail('PDF导出失败，请重试');
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  }

  // 获取AI内容的辅助方法
  private static async getAIContent(
    contentType: string,
    ipCount: number,
    indicatorCount: number,
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    advancedClusterResult: any,
    chartTabs: any[],
    selectedChartIds: string[], // 新增参数：选中的图表ID列表
    isChartAnalysisMode: boolean,
    setLoadingText: (text: string) => void,
    addLog: (message: string) => void
  ): Promise<string> {
    addLog(`🤖 正在生成${this.getContentTypeName(contentType)}...`);
    setLoadingText(`正在生成${this.getContentTypeName(contentType)}...`);
    
    // 只传递用户选中的图表信息给AI
    const selectedChartTabs = chartTabs.filter(tab => selectedChartIds.includes(tab.id));
    
    return await AIService.getAIGeneratedContent(
      contentType,
      ipCount,
      indicatorCount,
      ipCount, // selectedIPCount
      evaluationResult,
      neuralNetworkResult,
      shapResult,
      pcaResult,
      advancedClusterResult,
      selectedChartTabs, // 传递过滤后的图表列表
      isChartAnalysisMode
    );
  }

  private static getContentTypeName(contentType: string): string {
    const nameMap: Record<string, string> = {
      'background': '研究背景与意义',
      'method': '研究方法',
      'abstract': '摘要',
      'analysis_intro': '实证分析引言',
      'branding_path': '品牌塑造路径设计',
      'policy_suggestions': '政策建议与实践指导',
      'conclusion': '结论与展望'
    };
    return nameMap[contentType] || contentType;
  }

  // 创建PDF主要内容
  private static createPDFContent(
    tempContainer: HTMLElement,
    ipCount: number,
    indicatorCount: number,
    abstractContent: string,
    backgroundContent: string,
    methodContent: string,
    validCharts: any[],
    selectedChartIds: string[], // 新增参数
    chartTabs: any[] // 新增参数
  ) {
    // 添加标题页和摘要
    const titleSection = document.createElement('div');
    titleSection.innerHTML = `
      <div style="text-align: center; margin-bottom: 60px; padding: 40px 0;">
        <h1 style="font-size: 32px; color: #2c3e50; margin-bottom: 40px; font-weight: bold; line-height: 1.4;">
          基于多维评价体系的少数民族体育IP<br>品牌塑造路径研究
        </h1>
        <div style="font-size: 18px; color: #7f8c8d; margin-bottom: 60px;">
          ——基于遗传算法与机器学习的实证分析
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 40px 0; text-align: left;">
          <h3 style="color: #3498db; margin-bottom: 20px; font-size: 20px;">研究概况</h3>
          <p><strong>样本规模：</strong>${ipCount}个体育IP项目</p>
          <p><strong>评价指标：</strong>${indicatorCount}项核心指标</p>
          <p><strong>分析方法：</strong>${validCharts.length}种分析方法（${validCharts.map(chart => chart.title).join('、')}）</p>
        </div>
      </div>
      
      <div style="margin-bottom: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #3498db;">
        <h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px;">摘要</h2>
        <div style="text-align: justify; line-height: 1.8;">
          ${abstractContent}
        </div>
      </div>
    `;
    tempContainer.appendChild(titleSection);
    
    // 添加动态生成的目录
    const dynamicTocContent = AIService.generateDynamicTableOfContents(selectedChartIds, chartTabs);
    const tocSection = document.createElement('div');
    tocSection.style.pageBreakBefore = 'always';
    tocSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 22px; color: #2c3e50; margin-bottom: 30px; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px;">目录</h2>
        <div style="line-height: 2.0; font-size: 14px;">
          ${dynamicTocContent}
        </div>
      </div>
    `;
    tempContainer.appendChild(tocSection);
    
    // 添加研究背景
    const backgroundSection = document.createElement('div');
    backgroundSection.style.pageBreakBefore = 'always';
    backgroundSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${backgroundContent}
      </div>
    `;
    tempContainer.appendChild(backgroundSection);
    
    // 添加研究方法
    const methodSection = document.createElement('div');
    methodSection.style.pageBreakBefore = 'always';
    methodSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${methodContent}
      </div>
    `;
    tempContainer.appendChild(methodSection);
  }

  // 处理图表导出
  private static async processChartsForPDF(
    validCharts: any[],
    activeChart: any,
    tempContainer: HTMLElement,
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    advancedClusterResult: any,
    filteredThirdIndicators: string[],
    chartTabs: any[],
    selectedChartIds: string[], // 新增参数
    isChartAnalysisMode: boolean,
    setLoadingText: (text: string) => void,
    addLog: (message: string) => void
  ) {
    let processedCharts = 0;
    
    // 只传递选中的图表给AI分析
    const selectedChartTabs = chartTabs.filter(tab => selectedChartIds.includes(tab.id));
    
    for (const chart of validCharts) {
      try {
        processedCharts++;
        const chineseTitle = chart.title;
        setLoadingText(`处理图表 ${processedCharts}/${validCharts.length}: ${chineseTitle}`);
        
        let imageDataUrl: string | null = null;
        
        if (chart.id === 'cluster') {
          const imgElement = document.querySelector('.ml-chart-image img') as HTMLImageElement;
          if (imgElement && imgElement.src) {
            imageDataUrl = imgElement.src;
            addLog(`✅ 获取聚类图片: ${chineseTitle}`);
          }
        } else {
          imageDataUrl = await this.captureChartImage(
            chart, 
            activeChart, 
            evaluationResult,
            neuralNetworkResult,
            shapResult,
            pcaResult,
            filteredThirdIndicators,
            addLog
          );
        }
        
        if (imageDataUrl && imageDataUrl !== 'data:,') {
          // 获取学术化的分析内容
          addLog(`📝 生成学术分析: ${chineseTitle}`);
          setLoadingText(`生成学术分析: ${chineseTitle}`);
          
          let academicAnalysis = '';
          try {
            academicAnalysis = await AIService.getAcademicAnalysis(
              chart.id,
              evaluationResult,
              neuralNetworkResult,
              shapResult,
              pcaResult,
              advancedClusterResult,
              validCharts.length, // selectedIPCount
              filteredThirdIndicators.length,
              selectedChartTabs, // 只传递选中的图表
              isChartAnalysisMode,
              selectedChartIds // 传递选中图表ID列表
            );
            addLog(`✅ 分析完成: ${chineseTitle}`);
          } catch (error) {
            console.warn(`学术分析失败 for ${chineseTitle}:`, error);
            academicAnalysis = AIService.getDefaultAcademicAnalysis(chart.id);
            addLog(`⚠️ 使用默认分析: ${chineseTitle}`);
          }
          
          // 创建学术化的图表分析段落
          this.addChartSectionToPDF(tempContainer, chart, chineseTitle, imageDataUrl, academicAnalysis, processedCharts, selectedChartIds);
          addLog(`✅ 图表已加入PDF: ${chineseTitle}`);
        } else {
          this.addFailedChartSectionToPDF(tempContainer, chart, chineseTitle, processedCharts, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, filteredThirdIndicators.length, selectedChartTabs, isChartAnalysisMode, addLog, selectedChartIds);
        }
      } catch (error) {
        const chineseTitle = chart.title;
        addLog(`❌ 处理图表失败: ${chineseTitle}`);
      }
    }
  }

  // 捕获图表图像 - 优化版本
  private static async captureChartImage(
    chart: any, 
    activeChart: any, 
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    filteredThirdIndicators: string[],
    addLog: (message: string) => void
  ): Promise<string | null> {
    const chineseTitle = chart.title;
    addLog(`🔄 开始处理图表: ${chineseTitle}`);
    
    // 切换到对应图表
    activeChart.value = chart.id;
    await nextTick();
    
    // 增加等待时间 - 确保图表完全渲染
    const waitTimeMap: Record<string, number> = {
      'shap': 15000,       // SHAP图表最复杂，需要更多时间
      'importance': 15000, // 特征重要性图表，柱状图+标签，增加到12秒
      'radar': 15000,      // 雷达图有线条和多个点，需要更多时间
      'neural': 15000,      // 神经网络图表
      'pca': 15000,         // PCA图表
      'cluster': 15000,     // 聚类图表
      'fitness': 15000,     // 适应度曲线
      'scores': 15000,      // 评分分布
    };
    
    const waitTime = waitTimeMap[chart.id] || 5000;
    addLog(`⏳ 等待图表渲染完成 (${waitTime/1000}秒): ${chineseTitle}`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // 额外的动态检查：确保图表真正渲染完成
    await this.waitForChartToRender(chart.id, addLog);
    
    const canvasId = ChartService.getCanvasId(chart.id);
    let imageDataUrl: string | null = null;
    
    // 增加重试次数到3次
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      addLog(`🎯 第${attempt}次尝试获取图表: ${chineseTitle}`);
      
      // 如果是重试，稍微等待一下并重新渲染
      if (attempt > 1) {
        addLog(`⏳ 重试前等待并重新渲染...`);
        
        // 重新渲染图表
        try {
          ChartService.renderSpecificChart(
            chart.id, 
            evaluationResult, 
            neuralNetworkResult, 
            shapResult, 
            pcaResult, 
            filteredThirdIndicators, 
            filteredThirdIndicators
          );
          
          // 等待重新渲染完成
          await new Promise(resolve => setTimeout(resolve, waitTime * 0.5));
          await this.waitForChartToRender(chart.id, addLog);
        } catch (renderError) {
          addLog(`⚠️ 重新渲染失败: ${renderError}`);
        }
      }
      
      const canvas = document.querySelector(`#${canvasId}`) as HTMLCanvasElement;
      
      if (!canvas) {
        addLog(`❌ Canvas未找到: ${canvasId} (尝试${attempt}/${maxRetries})`);
        continue;
      }
      
      // 检查Canvas基本状态
      if (canvas.width < 50 || canvas.height < 50) {
        addLog(`⚠️ Canvas尺寸异常: ${canvas.width}x${canvas.height} (尝试${attempt}/${maxRetries})`);
        continue;
      }
      
      // 方法1: 优先使用Chart.js实例方法（最可靠）
      const chartInstance = Chart.getChart(canvas);
      if (chartInstance) {
        try {
          addLog(`✅ 使用Chart.js实例导出: ${chineseTitle}`);
          imageDataUrl = chartInstance.toBase64Image('image/png', 0.9);
          
          if (this.isValidImageData(imageDataUrl)) {
            addLog(`🎉 Chart.js方法成功: ${chineseTitle} (尝试${attempt}次)`);
            break;
          }
        } catch (error) {
          addLog(`⚠️ Chart.js方法失败: ${error}`);
        }
      }
      
      // 方法2: 使用Canvas原生方法
      try {
        addLog(`🔄 使用Canvas原生方法: ${chineseTitle}`);
        imageDataUrl = canvas.toDataURL('image/png', 0.9);
        
        if (this.isValidImageData(imageDataUrl)) {
          addLog(`🎉 Canvas方法成功: ${chineseTitle} (尝试${attempt}次)`);
          break;
        }
      } catch (error) {
        addLog(`⚠️ Canvas方法失败: ${error}`);
      }
    }
    
    // 最后的备用方案：html2canvas（仅在Chart.js和Canvas都失败时使用）
    if (!this.isValidImageData(imageDataUrl) && chart.id !== 'cluster') {
      addLog(`🎯 使用html2canvas备用方案: ${chineseTitle}`);
      try {
        const chartContainer = document.querySelector(`#${canvasId}`)?.parentElement;
        if (chartContainer) {
          const html2canvasResult = await html2canvas(chartContainer, {
            scale: 1.5,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true,
            logging: false
          });
          
          imageDataUrl = html2canvasResult.toDataURL('image/png', 0.9);
          
          if (this.isValidImageData(imageDataUrl)) {
            addLog(`🎉 html2canvas备用方案成功: ${chineseTitle}`);
          }
        }
      } catch (error) {
        addLog(`❌ html2canvas备用方案也失败: ${error}`);
      }
    }
    
    if (this.isValidImageData(imageDataUrl)) {
      addLog(`✅ 图表处理完成: ${chineseTitle}`);
      return imageDataUrl;
    } else {
      addLog(`💥 图表处理失败: ${chineseTitle}`);
      return null;
    }
  }
  
  // 新增：动态等待图表渲染完成
  private static async waitForChartToRender(chartId: string, addLog: (message: string) => void): Promise<void> {
    const canvasId = ChartService.getCanvasId(chartId);
    const maxWaitTime = 15000; // 最大等待15秒，给复杂图表更多时间
    const checkInterval = 500;  // 每500ms检查一次
    let waitedTime = 0;
    
    while (waitedTime < maxWaitTime) {
      const canvas = document.querySelector(`#${canvasId}`) as HTMLCanvasElement;
      
      if (canvas && canvas.width > 50 && canvas.height > 50) {
        // 检查是否有Chart.js实例
        const chartInstance = Chart.getChart(canvas);
        if (chartInstance) {
          // 检查图表是否有数据
          const hasData = chartInstance.data && 
                          chartInstance.data.datasets && 
                          chartInstance.data.datasets.length > 0;
          
          if (hasData) {
            // 对雷达图进行额外检查：确保所有线条都已绘制
            if (chartId === 'radar') {
              try {
                const context = canvas.getContext('2d');
                if (context) {
                  // 检查Canvas中是否有足够的绘制内容（线条和点）
                  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                  const nonWhitePixels = imageData.data.filter((pixel, index) => 
                    index % 4 !== 3 && pixel < 250 // 非透明度通道且非白色
                  ).length;
                  
                  // 雷达图应该有相当数量的非白色像素（线条、点、标签）
                  if (nonWhitePixels > 1000) {
                    addLog(`✅ 雷达图渲染检查通过: ${chartId} (耗时${waitedTime}ms, 像素数${nonWhitePixels})`);
                    return;
                  } else {
                    addLog(`⏳ 雷达图仍在渲染中: ${chartId} (像素数${nonWhitePixels})`);
                  }
                }
              } catch (error) {
                // 像素检查失败，继续等待
              }
            } 
            // 对特征重要性图表进行额外检查
            else if (chartId === 'importance') {
              try {
                const context = canvas.getContext('2d');
                if (context) {
                  // 检查Canvas中是否有柱状图内容
                  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                  const coloredPixels = imageData.data.filter((pixel, index) => 
                    index % 4 !== 3 && pixel < 240 // 非透明度通道且有颜色
                  ).length;
                  
                  // 特征重要性图应该有足够的彩色像素（柱状图）
                  if (coloredPixels > 500) {
                    addLog(`✅ 特征重要性图渲染检查通过: ${chartId} (耗时${waitedTime}ms, 彩色像素数${coloredPixels})`);
                    return;
                  } else {
                    addLog(`⏳ 特征重要性图仍在渲染中: ${chartId} (彩色像素数${coloredPixels})`);
                  }
                }
              } catch (error) {
                // 像素检查失败，继续等待
              }
            }
            // 其他图表的标准检查
            else {
              addLog(`✅ 图表渲染检查通过: ${chartId} (耗时${waitedTime}ms)`);
              return;
            }
          }
        }
        
        // 对于非Chart.js图表（如聚类图），检查Canvas内容
        if (chartId === 'cluster') {
          try {
            const context = canvas.getContext('2d');
            if (context) {
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              const hasContent = imageData.data.some((pixel, index) => 
                index % 4 !== 3 && pixel !== 0 // 非透明度通道且非黑色
              );
              
              if (hasContent) {
                addLog(`✅ 聚类图渲染检查通过: ${chartId} (耗时${waitedTime}ms)`);
                return;
              }
            }
          } catch (error) {
            // 忽略检查错误，继续等待
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitedTime += checkInterval;
    }
    
    addLog(`⚠️ 图表渲染检查超时: ${chartId} (等待${maxWaitTime}ms)`);
  }

  // 验证图像数据是否有效
  private static isValidImageData(imageDataUrl: string | null): boolean {
    return imageDataUrl != null && 
           imageDataUrl !== 'data:,' && 
           imageDataUrl.length > 1000 &&
           imageDataUrl.startsWith('data:image/');
  }

  // 添加图表分析章节到PDF
  private static addChartSectionToPDF(
    tempContainer: HTMLElement,
    chart: any,
    chineseTitle: string,
    imageDataUrl: string,
    academicAnalysis: string,
    processedCharts: number,
    selectedChartIds: string[] // 新增参数
  ) {
    const chartSection = document.createElement('div');
    chartSection.style.pageBreakBefore = 'always';
    
    // 使用动态生成的章节标题
    const dynamicSectionTitle = AIService.getDynamicSectionTitle(chart.id, selectedChartIds);
    
    chartSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 5px;">
          ${dynamicSectionTitle}
        </h2>
        
        <div style="text-align: center; margin: 30px 0;">
          <img src="${imageDataUrl}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
          <p style="font-size: 12px; color: #666; margin-top: 10px; text-align: center;">图 4.${processedCharts} ${chineseTitle}</p>
        </div>
        
        <div style="text-align: justify; line-height: 1.8; font-size: 14px; color: #333;">
          ${academicAnalysis}
        </div>
      </div>
    `;
    
    tempContainer.appendChild(chartSection);
  }

  // 添加失败图表的占位内容
  private static async addFailedChartSectionToPDF(
    tempContainer: HTMLElement,
    chart: any,
    chineseTitle: string,
    processedCharts: number,
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    advancedClusterResult: any,
    indicatorCount: number,
    chartTabs: any[], // 这里已经是过滤后的选中图表列表
    isChartAnalysisMode: boolean,
    addLog: (message: string) => void,
    selectedChartIds: string[] // 新增参数
  ) {
    const chartSection = document.createElement('div');
    chartSection.style.pageBreakBefore = 'always';
    
    // 使用动态生成的章节标题
    const dynamicSectionTitle = AIService.getDynamicSectionTitle(chart.id, selectedChartIds);
    
    // 尝试获取文字分析作为替代
    let fallbackAnalysis = '';
    try {
      addLog(`📝 图表截图失败，生成文字分析: ${chineseTitle}`);
      fallbackAnalysis = await AIService.getAcademicAnalysis(
        chart.id,
        evaluationResult,
        neuralNetworkResult,
        shapResult,
        pcaResult,
        advancedClusterResult,
        chartTabs.length, // selectedIPCount
        indicatorCount,
        chartTabs, // 已经是过滤后的选中图表
        isChartAnalysisMode,
        selectedChartIds // 传递选中图表ID列表
      );
      addLog(`✅ 文字分析已生成: ${chineseTitle}`);
    } catch (error) {
      console.warn(`文字分析也失败 for ${chineseTitle}:`, error);
      fallbackAnalysis = AIService.getDefaultAcademicAnalysis(chart.id);
      addLog(`⚠️ 使用默认内容: ${chineseTitle}`);
    }
    
    chartSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 20px; color: #2c3e50; margin-bottom: 20px; border-bottom: 2px solid #3498db; padding-bottom: 5px;">
          ${dynamicSectionTitle}
        </h2>
        
        <div style="text-align: center; margin: 30px 0; padding: 40px; background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px;">
          <div style="font-size: 48px; color: #6c757d; margin-bottom: 15px;">📊</div>
          <p style="color: #6c757d; font-size: 14px; margin-bottom: 8px;">图表生成失败</p>
          <p style="color: #6c757d; font-size: 12px;">图 4.${processedCharts} ${chineseTitle}</p>
        </div>
        
        <div style="text-align: justify; line-height: 1.8; font-size: 14px; color: #333;">
          ${fallbackAnalysis}
        </div>
      </div>
    `;
    
    tempContainer.appendChild(chartSection);
  }

  // 添加其他PDF章节
  private static async addPDFSections(
    tempContainer: HTMLElement,
    ipCount: number,
    indicatorCount: number,
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    advancedClusterResult: any,
    chartTabs: any[],
    selectedChartIds: string[], // 新增参数
    isChartAnalysisMode: boolean,
    setLoadingText: (text: string) => void,
    addLog: (message: string) => void
  ) {
    // 品牌塑造路径章节 - 只基于选中的图表
    const brandingPathContent = await this.getAIContent('branding_path', ipCount, indicatorCount, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
    
    const brandingPathSection = document.createElement('div');
    brandingPathSection.style.pageBreakBefore = 'always';
    brandingPathSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${brandingPathContent}
      </div>
    `;
    tempContainer.appendChild(brandingPathSection);
    
    // 政策建议章节 - 只基于选中的图表
    const policySuggestionsContent = await this.getAIContent('policy_suggestions', ipCount, indicatorCount, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
    
    const policySection = document.createElement('div');
    policySection.style.pageBreakBefore = 'always';
    policySection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${policySuggestionsContent}
      </div>
    `;
    tempContainer.appendChild(policySection);
    
    // 结论章节 - 只基于选中的图表
    const conclusionContent = await this.getAIContent('conclusion', ipCount, indicatorCount, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
    
    const conclusionSection = document.createElement('div');
    conclusionSection.style.pageBreakBefore = 'always';
    conclusionSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${conclusionContent}
      </div>
    `;
    tempContainer.appendChild(conclusionSection);
  }

  // 生成PDF文件
  private static async generatePDFFile(
    tempContainer: HTMLElement,
    chartCount: number,
    setLoadingText: (text: string) => void,
    addLog: (message: string) => void
  ) {
    setLoadingText('正在生成PDF文件...');
    addLog(`📄 开始转换HTML为PDF...`);
    
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight
    });
    
    // 创建PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // 如果内容超过一页，需要分页
    let heightLeft = imgHeight;
    let position = 0;
    
    // 添加第一页
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
    
    // 添加后续页面
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    // 生成文件名
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const fileName = `基于多维评价体系的少数民族体育IP品牌塑造路径研究_${dateStr}_${timeStr}.pdf`;
    
    // 保存PDF
    pdf.save(fileName);
    
    addLog(`🎉 PDF导出成功: ${fileName} (包含 ${chartCount} 个图表)`);
    addLog(`📄 PDF完美支持中文显示，包含详细AI分析`);
    addLog(`🤖 每个图表都包含专业中文AI分析`);
    toast.success(`PDF导出成功！包含 ${chartCount} 个图表和中文AI分析`);
  }

  // Excel导出功能
  static async exportToExcel(
    hasAnalysisResults: boolean,
    selectedIPs: string[],
    ips: any[],
    indicatorStructure: any,
    filteredThirdIndicators: string[],
    evaluationResult: any,
    setLoading: (loading: boolean) => void,
    setLoadingText: (text: string) => void,
    addLog: (message: string) => void
  ) {
    if (!hasAnalysisResults) {
      toast.warning('请先进行全面分析后再导出Excel');
      return;
    }
    
    try {
      setLoading(true);
      setLoadingText('准备导出Excel...');
      
      addLog('🚀 开始Excel导出流程');
      addLog(`📊 导出分析的 ${selectedIPs.length} 个IP数据`);
      
      // 准备Excel数据
      const excelData = [];
      
      // 获取中文指标名称
      const chineseIndicatorNames = filteredThirdIndicators.length > 0 
        ? filteredThirdIndicators 
        : indicatorStructure.allThird || [];
      
      // 添加标题行
      const headers = [
        '项目名称', '专家', '组别', 
        ...chineseIndicatorNames
      ];
      excelData.push(headers);
      
      // 处理每个选中的IP
      for (const ipId of selectedIPs) {
        const ip = ips.find(item => item.id === ipId);
        if (!ip) continue;
        
        if (ip._isGroup) {
          // 多专家聚合记录，获取每个专家的具体评分
          try {
            const expertsResponse = await ipApi.getExpertScoresByIP(ip.project_name, ip.group_name);
            if (expertsResponse.data && expertsResponse.data.length > 0) {
              const expertScores = expertsResponse.data;
              
              // 为每个专家添加一行数据
              expertScores.forEach((expert: any) => {
                const row: any[] = [
                  ip.project_name || '',
                  expert.expert || '',
                  ip.group_name || ''
                ];
                
                // 添加指标数据（使用中文名称对应的数值）
                chineseIndicatorNames.forEach((chineseName: string) => {
                  // 通过中文名称找到对应的属性名
                  const propertyName = indicatorStructure.indicatorPropertyMap?.[chineseName];
                  const value = expert.indicators && propertyName 
                    ? expert.indicators[propertyName] || 0 
                    : 0;
                  row.push(Number(value));
                });
                
                excelData.push(row);
              });
              
              // 添加平均值行
              const avgRow: any[] = [
                ip.project_name || '',
                `${expertScores.length}位专家平均`,
                ip.group_name || ''
              ];
              
              // 计算平均值
              chineseIndicatorNames.forEach((chineseName: string) => {
                const propertyName = indicatorStructure.indicatorPropertyMap?.[chineseName];
                if (propertyName) {
                  const sum = expertScores.reduce((acc, expert) => {
                    return acc + (expert.indicators[propertyName] || 0);
                  }, 0);
                  const avgValue = sum / expertScores.length;
                  avgRow.push(Number(avgValue.toFixed(2)));
                } else {
                  avgRow.push(0);
                }
              });
              
              excelData.push(avgRow);
              excelData.push(Array(headers.length).fill(''));
            }
          } catch (error) {
            addLog(`⚠️ 获取IP "${ip.project_name}" 的专家数据失败`);
          }
        } else {
          // 单一专家记录
          const row: any[] = [
            ip.project_name || '',
            ip.expert || '',
            ip.group_name || ''
          ];
          
          // 添加指标数据
          chineseIndicatorNames.forEach((chineseName: string) => {
            const propertyName = indicatorStructure.indicatorPropertyMap?.[chineseName];
            const value = ip.indicators && propertyName 
              ? ip.indicators[propertyName] || 0 
              : 0;
            row.push(Number(value));
          });
          
          excelData.push(row);
        }
      }
      
      // 创建工作簿
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // 设置列宽
      const colWidths = [
        {wch: 25}, // 项目名称
        {wch: 15}, // 专家
        {wch: 15}, // 组别
        ...Array(chineseIndicatorNames.length).fill({wch: 12}) // 指标列
      ];
      ws['!cols'] = colWidths;
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '分析数据详情');
      
      // 如果有分析结果，添加分析结果工作表
      if (evaluationResult?.evaluation) {
        const analysisData = [];
        analysisData.push(['排名', '项目名称', '综合评分', '误差值']);
        
        evaluationResult.evaluation
          .sort((a: any, b: any) => b.score - a.score)
          .forEach((item: any, index: number) => {
            analysisData.push([
              index + 1,
              item.name,
              Number(item.score.toFixed(4)),
              item.error ? Number(item.error.toFixed(4)) : 'N/A'
            ]);
          });
        
        const analysisWs = XLSX.utils.aoa_to_sheet(analysisData);
        analysisWs['!cols'] = [{wch: 8}, {wch: 25}, {wch: 12}, {wch: 12}];
        XLSX.utils.book_append_sheet(wb, analysisWs, '综合评分排名');
      }
      
      // 生成文件名
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `IP-Analysis-Data_${dateStr}_${timeStr}.xlsx`;
      
      // 保存文件
      XLSX.writeFile(wb, fileName);
      
      addLog(`🎉 Excel导出成功: ${fileName}`);
      addLog(`📋 包含 ${selectedIPs.length} 个IP的详细分析数据`);
      addLog(`📊 使用中文指标名称，包含多专家具体评分`);
      toast.success(`Excel导出成功！包含 ${selectedIPs.length} 个IP的详细数据`);
      
    } catch (error) {
      console.error('Excel导出失败:', error);
      addLog(`❌ Excel导出失败: ${error}`);
      toast.fail('Excel导出失败，请重试');
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  }
}