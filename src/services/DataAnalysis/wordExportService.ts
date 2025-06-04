import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageBreak,
  TableOfContents,
  LevelFormat,
  convertInchesToTwip,
  convertMillimetersToTwip,
  SectionType,
  PageOrientation
} from 'docx';
import { saveAs } from 'file-saver';
import { nextTick } from 'vue';
import { toast } from '../../utils/toast';
import { ChartService } from './chartService';
import { AIService } from './aiService';

export class WordExportService {
  // 图表尺寸配置（英寸）
  private static readonly CHART_SIZES = {
    small: { width: 3, height: 2 },        // 小尺寸：紧凑型
    medium: { width: 3.5, height: 2.33 },  // 中尺寸：标准A4适配
    large: { width: 4, height: 2.67 },     // 大尺寸：A4最大合理尺寸
  };
  
  // 当前使用的图表尺寸 - 改为small，更适合A4页面
  private static readonly CURRENT_SIZE = WordExportService.CHART_SIZES.small;

  // 执行Word导出
  static async performWordExport(
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
    activeChart: any,
    isChartAnalysisMode: boolean,
    addLog: (message: string) => void,
    setLoading: (loading: boolean) => void,
    setLoadingText: (text: string) => void
  ) {
    if (!hasAnalysisResults) {
      toast.warning('请先进行全面分析后再导出Word');
      return;
    }
    
    try {
      setLoading(true);
      setLoadingText('准备导出Word文档...');
      
      // 保存当前激活的图表
      const originalActiveChart = activeChart.value;
      
      // 计算有多少个图表需要导出
      const charts = chartTabs
        .filter(tab => selectedChartIds.includes(tab.id) && !tab.disabled)
        .map(tab => ({
          id: tab.id,
          title: AIService.getChineseChartTitle(tab.id),
          condition: true
        }));
      
      const validCharts = charts;
      
      addLog(`🚀 开始Word导出流程`);
      addLog(`📊 用户选择图表: ${selectedChartIds.length} 个`);
      addLog(`✅ 实际导出图表: ${validCharts.length} 个`);
      addLog(`📋 图表列表: ${validCharts.map(c => c.title).join(', ')}`);
      addLog(`⏰ 预计需要 ${Math.ceil(validCharts.length * 3)} 秒完成`);
      addLog(`📝 生成专业Word文档，包含图表和AI分析`);
      
      // 获取AI生成的各种内容
      setLoadingText('生成AI内容...');
      const backgroundContent = await this.getAIContent('background', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      const methodContent = await this.getAIContent('method', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      const abstractContent = await this.getAIContent('abstract', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      
      // 获取实证分析引言
      const analysisIntroContent = await this.getAIContent('analysis_intro', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      
      // 处理图表数据
      setLoadingText('处理图表数据...');
      const chartData = await this.processChartsForWord(
        validCharts,
        activeChart,
        evaluationResult,
        neuralNetworkResult,
        shapResult,
        pcaResult,
        advancedClusterResult,
        filteredThirdIndicators,
        chartTabs,
        selectedChartIds,
        isChartAnalysisMode,
        setLoadingText,
        addLog
      );
      
      // 获取其他章节内容
      const brandingPathContent = await this.getAIContent('branding_path', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      const policySuggestionsContent = await this.getAIContent('policy_suggestions', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      const conclusionContent = await this.getAIContent('conclusion', selectedIPs.length, filteredThirdIndicators.length, evaluationResult, neuralNetworkResult, shapResult, pcaResult, advancedClusterResult, chartTabs, selectedChartIds, isChartAnalysisMode, setLoadingText, addLog);
      
      // 恢复原来的激活图表
      activeChart.value = originalActiveChart;
      
      // 生成Word文档
      setLoadingText('生成Word文档...');
      await this.generateWordDocument({
        selectedIPs: selectedIPs.length,
        filteredIndicators: filteredThirdIndicators.length,
        abstractContent,
        backgroundContent,
        methodContent,
        analysisIntroContent,
        chartData,
        brandingPathContent,
        policySuggestionsContent,
        conclusionContent,
        validCharts,
        selectedChartIds,
        chartTabs
      }, setLoadingText, addLog);
      
    } catch (error) {
      console.error('Word导出失败:', error);
      addLog(`❌ Word导出失败: ${error}`);
      toast.fail('Word导出失败，请重试');
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  }

  // 获取AI内容
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
    selectedChartIds: string[],
    isChartAnalysisMode: boolean,
    setLoadingText: (text: string) => void,
    addLog: (message: string) => void
  ): Promise<string> {
    addLog(`🤖 正在生成${this.getContentTypeName(contentType)}...`);
    setLoadingText(`正在生成${this.getContentTypeName(contentType)}...`);
    
    const selectedChartTabs = chartTabs.filter(tab => selectedChartIds.includes(tab.id));
    
    return await AIService.getAIGeneratedContent(
      contentType,
      ipCount,
      indicatorCount,
      ipCount,
      evaluationResult,
      neuralNetworkResult,
      shapResult,
      pcaResult,
      advancedClusterResult,
      selectedChartTabs,
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

  // 处理图表数据用于Word导出
  private static async processChartsForWord(
    validCharts: any[],
    activeChart: any,
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    advancedClusterResult: any,
    filteredThirdIndicators: string[],
    chartTabs: any[],
    selectedChartIds: string[],
    isChartAnalysisMode: boolean,
    setLoadingText: (text: string) => void,
    addLog: (message: string) => void
  ): Promise<any[]> {
    const chartData = [];
    let processedCharts = 0;
    
    const selectedChartTabs = chartTabs.filter(tab => selectedChartIds.includes(tab.id));
    
    for (const chart of validCharts) {
      try {
        processedCharts++;
        const chineseTitle = chart.title;
        setLoadingText(`处理图表 ${processedCharts}/${validCharts.length}: ${chineseTitle}`);
        
        let imageBuffer: Uint8Array | null = null;
        
        if (chart.id === 'cluster') {
          const imgElement = document.querySelector('.ml-chart-image img') as HTMLImageElement;
          if (imgElement && imgElement.src) {
            imageBuffer = await this.imageUrlToBuffer(imgElement.src);
            addLog(`✅ 获取聚类图片: ${chineseTitle}`);
          }
        } else {
          imageBuffer = await this.captureChartImageForWord(
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
            validCharts.length,
            filteredThirdIndicators.length,
            selectedChartTabs,
            isChartAnalysisMode,
            selectedChartIds
          );
          addLog(`✅ 分析完成: ${chineseTitle}`);
        } catch (error) {
          console.warn(`学术分析失败 for ${chineseTitle}:`, error);
          academicAnalysis = AIService.getDefaultAcademicAnalysis(chart.id);
          addLog(`⚠️ 使用默认分析: ${chineseTitle}`);
        }
        
        chartData.push({
          id: chart.id,
          title: chineseTitle,
          imageBuffer,
          analysis: academicAnalysis,
          sectionTitle: AIService.getDynamicSectionTitle(chart.id, selectedChartIds),
          order: processedCharts
        });
        
        addLog(`✅ 图表数据已准备: ${chineseTitle}`);
        
      } catch (error) {
        const chineseTitle = chart.title;
        addLog(`❌ 处理图表失败: ${chineseTitle}`);
        
        // 即使失败也添加占位数据
        chartData.push({
          id: chart.id,
          title: chineseTitle,
          imageBuffer: null,
          analysis: `${chineseTitle}数据处理中遇到问题，请查看原始图表获取详细信息。`,
          sectionTitle: AIService.getDynamicSectionTitle(chart.id, selectedChartIds),
          order: processedCharts
        });
      }
    }
    
    return chartData;
  }

  // 捕获图表图像并转换为Buffer
  private static async captureChartImageForWord(
    chart: any,
    activeChart: any,
    evaluationResult: any,
    neuralNetworkResult: any,
    shapResult: any,
    pcaResult: any,
    filteredThirdIndicators: string[],
    addLog: (message: string) => void
  ): Promise<Uint8Array | null> {
    const chineseTitle = chart.title;
    addLog(`🔄 开始处理图表: ${chineseTitle}`);
    
    // 切换到对应图表
    activeChart.value = chart.id;
    await nextTick();
    
    // 等待图表渲染
    const waitTime = this.getChartWaitTime(chart.id);
    addLog(`⏳ 等待图表渲染完成 (${waitTime/1000}秒): ${chineseTitle}`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    const canvasId = ChartService.getCanvasId(chart.id);
    
    // 对于特征重要性图表，需要特殊处理
    if (chart.id === 'importance') {
      // 尝试重新渲染特征重要性图表
      try {
        addLog(`🔧 重新渲染特征重要性图表...`);
        await ChartService.renderNeuralNetworkCharts(
          neuralNetworkResult, 
          filteredThirdIndicators, 
          filteredThirdIndicators // 传入所有指标作为第三个参数
        );
        // 额外等待时间确保渲染完成
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        addLog(`⚠️ 重新渲染失败: ${error}`);
      }
    }
    
    for (let attempt = 1; attempt <= 5; attempt++) {
      addLog(`🎯 第${attempt}次尝试获取图表: ${chineseTitle}`);
      
      const canvas = document.querySelector(`#${canvasId}`) as HTMLCanvasElement;
      
      if (!canvas) {
        addLog(`❌ Canvas未找到: ${canvasId} (尝试${attempt}/5)`);
        if (attempt < 5) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        continue;
      }
      
      // 检查Canvas是否有内容
      if (canvas.width < 50 || canvas.height < 50) {
        addLog(`⚠️ Canvas尺寸异常: ${canvas.width}x${canvas.height} (尝试${attempt}/5)`);
        if (attempt < 5) {
          // 对于特征重要性图表，尝试重新触发渲染
          if (chart.id === 'importance' && attempt <= 3) {
            addLog(`🔄 重新触发图表渲染...`);
            activeChart.value = 'fitness'; // 先切换到其他图表
            await nextTick();
            await new Promise(resolve => setTimeout(resolve, 500));
            activeChart.value = chart.id; // 再切换回来
            await nextTick();
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        continue;
      }
      
      try {
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        if (this.isValidImageData(dataUrl)) {
          const buffer = await this.dataUrlToBuffer(dataUrl);
          addLog(`🎉 图表处理成功: ${chineseTitle} (尝试${attempt}次)`);
          return buffer;
        } else {
          addLog(`⚠️ 图表数据无效: 大小${dataUrl.length} (尝试${attempt}/5)`);
        }
      } catch (error) {
        addLog(`⚠️ 图表获取失败: ${error} (尝试${attempt}/5)`);
      }
      
      if (attempt < 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    addLog(`💥 图表处理失败: ${chineseTitle}`);
    return null;
  }

  // 获取图表等待时间
  private static getChartWaitTime(chartId: string): number {
    const waitTimeMap: Record<string, number> = {
      'shap': 15000,
      'importance': 10000,
      'radar': 10000,
      'neural': 8000,
      'pca': 6000,
      'cluster': 6000,
      'fitness': 5000,
      'scores': 5000,
    };
    return waitTimeMap[chartId] || 5000;
  }

  // 验证图像数据
  private static isValidImageData(imageDataUrl: string | null): boolean {
    return imageDataUrl != null && 
           imageDataUrl !== 'data:,' && 
           imageDataUrl.length > 1000 &&
           imageDataUrl.startsWith('data:image/');
  }

  // 将DataURL转换为Buffer
  private static async dataUrlToBuffer(dataUrl: string): Promise<Uint8Array> {
    const base64 = dataUrl.split(',')[1];
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // 将图片URL转换为Buffer
  private static async imageUrlToBuffer(imageUrl: string): Promise<Uint8Array> {
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('图片URL转换失败:', error);
      throw error;
    }
  }

  // 生成Word文档
  private static async generateWordDocument(
    data: any,
    setLoadingText: (text: string) => void,
    addLog: (message: string) => void
  ) {
    setLoadingText('构建Word文档结构...');
    addLog(`📄 开始构建Word文档...`);
    
    const doc = new Document({
      creator: "少数民族体育IP数据分析平台",
      title: "基于多维评价体系的少数民族体育IP品牌塑造路径研究",
      description: "基于遗传算法与机器学习的实证分析",
      styles: {
        paragraphStyles: [
          {
            id: "title",
            name: "Title",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 32,
              bold: true,
              color: "2c3e50",
            },
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 400,
              },
            },
          },
          {
            id: "subtitle",
            name: "Subtitle",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 18,
              color: "7f8c8d",
            },
            paragraph: {
              alignment: AlignmentType.CENTER,
              spacing: {
                after: 600,
              },
            },
          },
          {
            id: "heading1",
            name: "Heading 1",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 20,
              bold: true,
              color: "2c3e50",
            },
            paragraph: {
              spacing: {
                before: 400,
                after: 200,
              },
            },
          },
          {
            id: "heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              size: 16,
              bold: true,
              color: "34495e",
            },
            paragraph: {
              spacing: {
                before: 300,
                after: 150,
              },
            },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
              },
            },
          },
          children: [
            // 标题页
            ...this.createTitlePage(data),
            
            // 分页
            new Paragraph({
              children: [new PageBreak()],
            }),
            
            // 摘要
            ...this.createAbstractSection(data.abstractContent),
            
            // 分页
            new Paragraph({
              children: [new PageBreak()],
            }),
            
            // 目录
            ...this.createTableOfContents(data.selectedChartIds, data.chartTabs),
            
            // 分页
            new Paragraph({
              children: [new PageBreak()],
            }),
            
            // 研究背景
            ...this.createContentSection("1. 研究背景与意义", data.backgroundContent),
            
            // 分页
            new Paragraph({
              children: [new PageBreak()],
            }),
            
            // 研究方法
            ...this.createContentSection("2. 研究方法", data.methodContent),
            
            // 分页
            new Paragraph({
              children: [new PageBreak()],
            }),
            
            // 实证分析引言
            ...this.createContentSection("3. 实证分析", data.analysisIntroContent),
            
            // 图表分析章节
            ...this.createChartSections(data.chartData),
            
            // 品牌塑造路径
            new Paragraph({
              children: [new PageBreak()],
            }),
            ...this.createContentSection("4. 品牌塑造路径设计", data.brandingPathContent),
            
            // 政策建议
            new Paragraph({
              children: [new PageBreak()],
            }),
            ...this.createContentSection("5. 政策建议与实践指导", data.policySuggestionsContent),
            
            // 结论
            new Paragraph({
              children: [new PageBreak()],
            }),
            ...this.createContentSection("6. 结论与展望", data.conclusionContent),
          ],
        },
      ],
    });
    
    try {
      // 生成并保存文档 - 使用浏览器兼容的方式
      setLoadingText('生成最终文档...');
      addLog(`💾 正在生成Word文件...`);
      
      // 使用toBlob()方法代替toBuffer()，这在浏览器中更兼容
      const blob = await Packer.toBlob(doc);
      
      // 生成文件名
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `基于多维评价体系的少数民族体育IP品牌塑造路径研究_${dateStr}_${timeStr}.docx`;
      
      // 保存文件
      saveAs(blob, fileName);
      
      addLog(`🎉 Word导出成功: ${fileName} (包含 ${data.validCharts.length} 个图表)`);
      addLog(`📄 Word文档包含完整的图表和AI分析内容`);
      addLog(`🤖 每个图表都包含专业中文AI分析`);
      toast.success(`Word导出成功！包含 ${data.validCharts.length} 个图表和中文AI分析`);
      
    } catch (error) {
      console.error('Word文档生成失败:', error);
      addLog(`❌ Word文档生成失败: ${error}`);
      throw error;
    }
  }

  // 创建标题页
  private static createTitlePage(data: any): Paragraph[] {
    const titleParagraphs = [
      new Paragraph({
        style: "title",
        children: [
          new TextRun({
            text: "基于多维评价体系的少数民族体育IP品牌塑造路径研究",
            size: 32,
            bold: true,
          }),
        ],
      }),
      new Paragraph({
        style: "subtitle",
        children: [
          new TextRun({
            text: "——基于遗传算法与机器学习的实证分析",
            size: 18,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 600, after: 400 },
        children: [
          new TextRun({
            text: "研究概况",
            size: 20,
            bold: true,
            color: "3498db",
          }),
        ],
      }),
    ];

    // 添加研究概况信息（使用段落而不是表格）
    titleParagraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({ text: "样本规模: ", bold: true }),
          new TextRun({ text: `${data.selectedIPs}个体育IP项目` }),
        ],
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: "评价指标: ", bold: true }),
          new TextRun({ text: `${data.filteredIndicators}项核心指标` }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: "分析方法: ", bold: true }),
          new TextRun({ text: `${data.validCharts.length}种分析方法（${data.validCharts.map((c: any) => c.title).join('、')}）` }),
        ],
      })
    );

    return titleParagraphs;
  }

  // 创建摘要部分
  private static createAbstractSection(abstractContent: string): Paragraph[] {
    return [
      new Paragraph({
        style: "heading1",
        children: [
          new TextRun({
            text: "摘要",
            size: 20,
            bold: true,
          }),
        ],
      }),
      ...this.createContentParagraphs(abstractContent),
    ];
  }

  // 创建目录
  private static createTableOfContents(selectedChartIds: string[], chartTabs: any[]): Paragraph[] {
    const tocContent = AIService.generateDynamicTableOfContents(selectedChartIds, chartTabs);
    
    return [
      new Paragraph({
        style: "heading1",
        children: [
          new TextRun({
            text: "目录",
            size: 20,
            bold: true,
          }),
        ],
      }),
      ...this.createContentParagraphs(tocContent),
    ];
  }

  // 创建内容章节
  private static createContentSection(title: string, content: string): Paragraph[] {
    return [
      new Paragraph({
        style: "heading1",
        children: [
          new TextRun({
            text: title,
            size: 20,
            bold: true,
          }),
        ],
      }),
      ...this.createContentParagraphs(content),
    ];
  }

  // 创建图表章节
  private static createChartSections(chartData: any[]): Paragraph[] {
    const sections: Paragraph[] = [];
    
    for (const chart of chartData) {
      // 分页
      sections.push(new Paragraph({
        children: [new PageBreak()],
      }));
      
      // 章节标题
      sections.push(new Paragraph({
        style: "heading2",
        children: [
          new TextRun({
            text: chart.sectionTitle,
            size: 16,
            bold: true,
          }),
        ],
      }));
      
      // 图表图片
      if (chart.imageBuffer) {
        try {
          // 将Uint8Array转换为ArrayBuffer，这是docx库期望的格式
          const arrayBuffer = chart.imageBuffer.buffer.slice(
            chart.imageBuffer.byteOffset,
            chart.imageBuffer.byteOffset + chart.imageBuffer.byteLength
          );
          
          sections.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new ImageRun({
                data: arrayBuffer,
                transformation: {
                  width: convertInchesToTwip(WordExportService.CURRENT_SIZE.width),
                  height: convertInchesToTwip(WordExportService.CURRENT_SIZE.height),
                },
                type: "png",
              }),
            ],
          }));
          
          // 图片说明
          sections.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `图 ${chart.order}. ${chart.title}`,
                size: 12,
                color: "666666",
                italics: true,
              }),
            ],
          }));
        } catch (error) {
          console.warn(`图片插入失败: ${chart.title}`, error);
          // 如果图片插入失败，显示占位符
          sections.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: `📊 图表 - ${chart.title}`,
                size: 14,
                color: "999999",
              }),
            ],
          }));
        }
      } else {
        // 图表缺失占位符
        sections.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          children: [
            new TextRun({
              text: `📊 图表生成失败 - ${chart.title}`,
              size: 14,
              color: "999999",
            }),
          ],
        }));
      }
      
      // 分析内容
      sections.push(...this.createContentParagraphs(chart.analysis));
    }
    
    return sections;
  }

  // 创建内容段落（处理HTML格式）
  private static createContentParagraphs(content: string): Paragraph[] {
    // 简单的HTML解析和转换
    const cleanContent = content
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/&nbsp;/g, ' ') // 替换HTML实体
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    
    const paragraphs = cleanContent.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map(paragraph => new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: paragraph.trim(),
          size: 14,
        }),
      ],
    }));
  }
} 