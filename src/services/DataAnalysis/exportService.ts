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
    advancedClusterImage: string,
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
      addLog(`⏰ 预计需要 ${Math.ceil(validCharts.length * 6)} 秒完成（包含AI分析）`);
      addLog(`💡 使用HTML转PDF方式，完美支持中文显示`);
      addLog(`🤖 每个图表都将生成专业AI分析`);
      addLog(`⚡ 正在处理复杂图表，请耐心等待...`);
      
      // 确保所有图表都已正确渲染后再开始导出
      addLog(`🔍 开始图表状态检查...`);
      setLoadingText('检查图表状态...');
      
      for (const chart of validCharts) {
        if (!chart.condition) continue;
        
        // 切换到对应图表
        activeChart.value = chart.id;
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 3000)); // 增加到3秒等待切换
        
        // 检查图表是否可见和有内容
        const canvasId = ChartService.getCanvasId(chart.id);
        const canvas = document.querySelector(`#${canvasId}`) as HTMLCanvasElement;
        
        if (canvas) {
          const chartInstance = Chart.getChart(canvas);
          if (chartInstance && chartInstance.data && chartInstance.data.datasets && chartInstance.data.datasets.length > 0) {
            addLog(`✅ 图表状态正常: ${AIService.getChineseChartTitle(chart.id)}`);
          } else {
            addLog(`⚠️ 图表可能需要重新渲染: ${AIService.getChineseChartTitle(chart.id)}`);
            // 强制重新渲染
            ChartService.renderSpecificChart(chart.id, evaluationResult, neuralNetworkResult, shapResult, pcaResult, filteredThirdIndicators, []);
            await new Promise(resolve => setTimeout(resolve, 5000)); // 重新渲染后等待5秒
          }
        } else {
          addLog(`⚠️ 图表Canvas未找到: ${AIService.getChineseChartTitle(chart.id)}`);
        }
      }
      
      addLog(`✅ 图表状态检查完成，开始导出...`);
      
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
      
      // 获取AI生成的各种内容
      const backgroundContent = await this.getAIContent('background', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, isChartAnalysisMode, setLoadingText, addLog);
      const methodContent = await this.getAIContent('method', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, isChartAnalysisMode, setLoadingText, addLog);
      const abstractContent = await this.getAIContent('abstract', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, isChartAnalysisMode, setLoadingText, addLog);
      
      // 创建PDF内容结构
      this.createPDFContent(tempContainer, selectedIPs.length, filteredThirdIndicators.length, abstractContent, backgroundContent, methodContent, validCharts);
      
      // 获取实证分析引言
      const analysisIntroContent = await this.getAIContent('analysis_intro', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, isChartAnalysisMode, setLoadingText, addLog);
      
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
        advancedClusterImage,
        filteredThirdIndicators,
        chartTabs,
        isChartAnalysisMode,
        setLoadingText,
        addLog
      );
      
      // 添加其他章节
      await this.addPDFSections(tempContainer, selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, isChartAnalysisMode, setLoadingText, addLog);
      
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
    isChartAnalysisMode: boolean,
    setLoadingText: (text: string) => void,
    addLog: (message: string) => void
  ): Promise<string> {
    addLog(`🤖 正在生成${this.getContentTypeName(contentType)}...`);
    setLoadingText(`正在生成${this.getContentTypeName(contentType)}...`);
    
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
      chartTabs,
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

  // 创建PDF内容结构
  private static createPDFContent(
    tempContainer: HTMLElement,
    ipCount: number,
    indicatorCount: number,
    abstractContent: string,
    backgroundContent: string,
    methodContent: string,
    validCharts: any[]
  ) {
    // 创建PDF标题页
    const titleSection = document.createElement('div');
    titleSection.innerHTML = `
      <div style="text-align: center; margin-bottom: 60px; padding: 40px 0;">
        <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 30px; font-weight: bold; line-height: 1.4;">
          基于多维评价体系的少数民族体育IP<br>品牌塑造路径研究
        </h1>
        <div style="margin: 30px 0; font-size: 16px; color: #666; line-height: 1.8;">
          <p><strong>研究时间：</strong>${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>样本规模：</strong>${ipCount}个体育IP项目</p>
          <p><strong>评价指标：</strong>${indicatorCount}项核心指标</p>
          <p><strong>分析方法：</strong>遗传算法优化、神经网络建模、SHAP解释性分析</p>
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
    
    // 添加目录
    const tocSection = document.createElement('div');
    tocSection.style.pageBreakBefore = 'always';
    tocSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        <h2 style="font-size: 22px; color: #2c3e50; margin-bottom: 30px; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px;">目录</h2>
        <div style="line-height: 2.0; font-size: 14px;">
          <p>1. 研究背景与意义 ......................................................... 3</p>
          <p>2. 研究方法与数据来源 .................................................... 4</p>
          <p>3. 评价体系构建与算法优化 ............................................... 5</p>
          <p>4. 实证分析结果 ......................................................... 6</p>
          <p>5. 品牌塑造路径设计 ..................................................... ${6 + validCharts.length}</p>
          <p>6. 政策建议与实践指导 ................................................... ${7 + validCharts.length}</p>
          <p>7. 结论与展望 .......................................................... ${8 + validCharts.length}</p>
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
    advancedClusterImage: string,
    filteredThirdIndicators: string[],
    chartTabs: any[],
    isChartAnalysisMode: boolean,
    setLoadingText: (text: string) => void,
    addLog: (message: string) => void
  ) {
    let processedCharts = 0;
    
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
          imageDataUrl = await this.captureChartImage(chart, activeChart, addLog);
        }
        
        if (imageDataUrl && imageDataUrl !== 'data:,') {
          // 获取学术化的分析内容
          addLog(`📝 正在为图表 "${chineseTitle}" 生成学术分析...`);
          setLoadingText(`生成学术分析 ${processedCharts}/${validCharts.length}: ${chineseTitle}`);
          
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
              chartTabs,
              isChartAnalysisMode
            );
            addLog(`✅ 学术分析已生成: ${chineseTitle}`);
          } catch (error) {
            console.warn(`学术分析失败 for ${chineseTitle}:`, error);
            academicAnalysis = AIService.getDefaultAcademicAnalysis(chart.id);
          }
          
          // 创建学术化的图表分析段落
          this.addChartSectionToPDF(tempContainer, chart, chineseTitle, imageDataUrl, academicAnalysis, processedCharts);
          addLog(`✅ 已添加学术分析到论文: ${chineseTitle}`);
        } else {
          this.addFailedChartSectionToPDF(tempContainer, chart, chineseTitle, processedCharts, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, filteredThirdIndicators.length, chartTabs, isChartAnalysisMode, addLog);
        }
      } catch (error) {
        const chineseTitle = chart.title;
        addLog(`❌ 处理图表失败: ${chineseTitle}`);
      }
    }
  }

  // 捕获图表图像
  private static async captureChartImage(chart: any, activeChart: any, addLog: (message: string) => void): Promise<string | null> {
    const chineseTitle = chart.title;
    addLog(`🔄 准备导出图表: ${chineseTitle}`);
    
    activeChart.value = chart.id;
    await nextTick();
    
    // 强制等待更长时间确保图表完全渲染
    let waitTime = chart.id === 'shap' ? 20000 : chart.id === 'neural' || chart.id === 'importance' ? 15000 : 10000;
    addLog(`⏳ 等待图表渲染 (${waitTime/1000}秒): ${chineseTitle}`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    await nextTick();
    
    // 强制重新渲染当前图表
    addLog(`🔄 强制重新渲染图表: ${chineseTitle}`);
    // 这里需要调用ChartService的相应方法来重新渲染
    
    // 再次等待渲染完成
    addLog(`⏳ 等待重新渲染完成: ${chineseTitle}`);
    await new Promise(resolve => setTimeout(resolve, 8000));
    await nextTick();
    
    const canvasId = ChartService.getCanvasId(chart.id);
    let imageDataUrl: string | null = null;
    
    // 多次重试获取图表
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries && (!imageDataUrl || imageDataUrl === 'data:,')) {
      retryCount++;
      addLog(`🔄 第${retryCount}次尝试获取图表: ${chineseTitle}`);
      
      if (retryCount > 1) {
        addLog(`⏳ 重试等待 5秒...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      const canvas = document.querySelector(`#${canvasId}`) as HTMLCanvasElement;
      addLog(`🔍 查找Canvas元素: ${canvasId}`);
      
      if (canvas) {
        addLog(`✅ 找到Canvas元素: ${canvasId}, 尺寸: ${canvas.width}x${canvas.height}`);
        
        // 检查Chart.js实例
        const chartInstance = Chart.getChart(canvas);
        if (chartInstance) {
          addLog(`✅ 找到Chart.js实例: ${chineseTitle}`);
          
          try {
            chartInstance.update('none');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            imageDataUrl = chartInstance.toBase64Image('image/png', 1.0);
            addLog(`✅ 通过Chart.js实例获取图表数据: ${chineseTitle} (重试${retryCount}次)`);
            break;
          } catch (chartError) {
            addLog(`⚠️ Chart.js导出失败（重试${retryCount}），错误: ${chartError}`);
          }
        }
        
        // 如果Chart.js方法失败，尝试Canvas方法
        const ctx = canvas.getContext('2d');
        if (ctx) {
          try {
            imageDataUrl = canvas.toDataURL('image/png', 1.0);
            addLog(`✅ 通过Canvas方法获取图表数据: ${chineseTitle} (重试${retryCount}次)`);
            break;
          } catch (canvasError) {
            addLog(`❌ Canvas导出失败（重试${retryCount}），错误: ${canvasError}`);
          }
        }
      } else {
        addLog(`❌ 未找到Canvas元素: ${canvasId} (重试${retryCount}次)`);
      }
    }
    
    // 最后一次尝试使用html2canvas
    if ((!imageDataUrl || imageDataUrl === 'data:,') && chart.id !== 'cluster') {
      addLog(`🎯 最后尝试：使用html2canvas捕获图表区域: ${chineseTitle}`);
      try {
        const chartPanel = document.querySelector(`[v-show="${activeChart.value === chart.id}"] .chart, .chart-panel:not([style*="display: none"]) .chart`) as HTMLElement;
        if (chartPanel) {
          const chartCanvas = await html2canvas(chartPanel, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            allowTaint: true
          });
          imageDataUrl = chartCanvas.toDataURL('image/png', 1.0);
          addLog(`✅ html2canvas成功捕获图表: ${chineseTitle}`);
        }
      } catch (html2canvasError) {
        addLog(`❌ html2canvas也失败了: ${chineseTitle}, 错误: ${html2canvasError}`);
      }
    }
    
    return imageDataUrl;
  }

  // 添加图表章节到PDF
  private static addChartSectionToPDF(
    tempContainer: HTMLElement,
    chart: any,
    chineseTitle: string,
    imageDataUrl: string,
    academicAnalysis: string,
    processedCharts: number
  ) {
    const chartSection = document.createElement('div');
    chartSection.style.marginBottom = '35px';
    chartSection.innerHTML = `
      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 16px; color: #2c3e50; margin-bottom: 15px;">${AIService.getAcademicSectionTitle(chart.id)}</h3>
        
        <div style="text-align: center; margin: 20px 0;">
          <img src="${imageDataUrl}" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px;" />
          <p style="text-align: center; font-size: 12px; color: #666; margin-top: 8px; font-style: italic;">
            图${processedCharts}. ${chineseTitle}
          </p>
        </div>
        
        <div style="text-align: justify; line-height: 1.8; margin-top: 15px;">
          ${academicAnalysis}
        </div>
      </div>
    `;
    tempContainer.appendChild(chartSection);
  }

  // 添加失败图表章节到PDF
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
    chartTabs: any[],
    isChartAnalysisMode: boolean,
    addLog: (message: string) => void
  ) {
    addLog(`❌ 最终未能获取图表: ${chineseTitle} - 将添加重试提示`);
    
    let academicAnalysis = '';
    try {
      academicAnalysis = await AIService.getAcademicAnalysis(
        chart.id,
        evaluationResult,
        neuralNetworkResult,
        shapResult,
        pcaResult,
        advancedClusterResult,
        processedCharts,
        indicatorCount,
        chartTabs,
        isChartAnalysisMode
      );
      addLog(`✅ 文本分析已生成: ${chineseTitle}`);
    } catch (error) {
      console.warn(`文本分析失败 for ${chineseTitle}:`, error);
      academicAnalysis = AIService.getDefaultAcademicAnalysis(chart.id);
    }
    
    const chartSection = document.createElement('div');
    chartSection.style.marginBottom = '35px';
    chartSection.innerHTML = `
      <div style="margin-bottom: 25px;">
        <h3 style="font-size: 16px; color: #2c3e50; margin-bottom: 15px;">${AIService.getAcademicSectionTitle(chart.id)}</h3>
        
        <div style="padding: 30px; background: linear-gradient(135deg, #ffebe6 0%, #fff2e6 100%); border-radius: 12px; border: 2px solid #ff6b6b; text-align: center; margin: 20px 0; box-shadow: 0 4px 8px rgba(255,107,107,0.2);">
          <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
          <h4 style="color: #e74c3c; margin: 10px 0; font-size: 16px; font-weight: bold;">图表获取失败</h4>
          <p style="margin: 8px 0; font-size: 14px; color: #666; line-height: 1.5;">
            <strong>建议解决方案：</strong><br>
            1. 确保所有图表在界面中完全显示<br>
            2. 等待更长时间后重新导出<br>
            3. 刷新页面重新分析后导出
          </p>
          <p style="margin: 8px 0; font-size: 12px; color: #999; font-style: italic;">
            图表类型：${chineseTitle} | Canvas ID: ${chart.id}Chart
          </p>
        </div>
        
        <div style="text-align: justify; line-height: 1.8; margin-top: 15px;">
          <div style="padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; margin-bottom: 15px;">
            <strong style="color: #007bff;">💡 基于数据的分析结果：</strong>
          </div>
          ${academicAnalysis}
        </div>
      </div>
    `;
    tempContainer.appendChild(chartSection);
    
    addLog(`⚠️ 已添加重试提示和分析到论文: ${chineseTitle}`);
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
    isChartAnalysisMode: boolean,
    setLoadingText: (text: string) => void,
    addLog: (message: string) => void
  ) {
    // 品牌塑造路径章节
    const brandingPathContent = await this.getAIContent('branding_path', ipCount, indicatorCount, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, isChartAnalysisMode, setLoadingText, addLog);
    
    const brandingPathSection = document.createElement('div');
    brandingPathSection.style.pageBreakBefore = 'always';
    brandingPathSection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${brandingPathContent}
      </div>
    `;
    tempContainer.appendChild(brandingPathSection);
    
    // 政策建议章节
    const policySuggestionsContent = await this.getAIContent('policy_suggestions', ipCount, indicatorCount, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, isChartAnalysisMode, setLoadingText, addLog);
    
    const policySection = document.createElement('div');
    policySection.style.pageBreakBefore = 'always';
    policySection.innerHTML = `
      <div style="margin-bottom: 40px;">
        ${policySuggestionsContent}
      </div>
    `;
    tempContainer.appendChild(policySection);
    
    // 结论章节
    const conclusionContent = await this.getAIContent('conclusion', ipCount, indicatorCount, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, isChartAnalysisMode, setLoadingText, addLog);
    
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