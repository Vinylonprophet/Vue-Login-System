import { nextTick } from 'vue';
import { Chart } from 'chart.js';
import type { EvaluationResult } from '../../utils/api';

export class ChartService {
  // 渲染适应度图表
  static renderFitnessChart(evaluationResult: EvaluationResult | null) {
    const canvas = document.querySelector('#fitnessChart') as HTMLCanvasElement;
    if (!canvas || !evaluationResult) return;
    
    Chart.getChart(canvas)?.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const fitnessHistory = evaluationResult.fitnessHistory;
    const iterations = fitnessHistory.length;
    const avgFitness = fitnessHistory.map(iteration => 
      iteration.reduce((sum, val) => sum + val, 0) / iteration.length
    );
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array.from({ length: iterations }, (_, i) => `第${i + 1}代`),
        datasets: [{
          label: '平均适应度',
          data: avgFitness,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: '遗传算法适应度收敛过程'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: { display: true, text: '适应度值' }
          },
          x: {
            title: { display: true, text: '迭代次数' }
          }
        }
      }
    });
  }

  // 渲染评分图表
  static renderScoreChart(evaluationResult: EvaluationResult | null) {
    const canvas = document.querySelector('#scoreChart') as HTMLCanvasElement;
    if (!canvas || !evaluationResult) return;
    
    Chart.getChart(canvas)?.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const evaluation = evaluationResult.evaluation;
    const labels = evaluation.map(item => item.name);
    const scores = evaluation.map(item => item.score);
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'IP评分',
          data: scores,
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: 'IP综合评分排名' }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: '评分' } },
          x: { title: { display: true, text: 'IP名称' } }
        }
      }
    });
  }

  // 渲染雷达图
  static renderRadarChart(evaluationResult: EvaluationResult | null, filteredThirdIndicators: string[]) {
    const canvas = document.querySelector('#radarChart') as HTMLCanvasElement;
    if (!canvas || !evaluationResult) return;
    
    Chart.getChart(canvas)?.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const weights = evaluationResult.weights;
    const indicators = filteredThirdIndicators;
    
    const indexedWeights = weights.map((weight, index) => ({ weight, index }));
    indexedWeights.sort((a, b) => b.weight - a.weight);
    const topIndicators = indexedWeights.slice(0, 8);
    
    const radarLabels = topIndicators.map(item => indicators[item.index] || `指标${item.index + 1}`);
    const radarWeights = topIndicators.map(item => item.weight * 100);
    
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: radarLabels,
        datasets: [{
          label: '指标权重(%)',
          data: radarWeights,
          fill: true,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgb(255, 99, 132)',
          pointBackgroundColor: 'rgb(255, 99, 132)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(255, 99, 132)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: { display: true, text: '关键指标权重分布' }
        },
        scales: {
          r: {
            angleLines: { display: false },
            suggestedMin: 0,
            suggestedMax: Math.max(...radarWeights) * 1.2
          }
        }
      }
    });
  }

  // 渲染神经网络图表
  static renderNeuralNetworkCharts(neuralNetworkResult: any, filteredThirdIndicators: string[], allThird: string[]) {
    if (!neuralNetworkResult) return;
    
    nextTick(() => {
      // 渲染训练损失曲线
      const lossCanvas = document.querySelector('#nnLossChart') as HTMLCanvasElement;
      if (lossCanvas) {
        Chart.getChart(lossCanvas)?.destroy();
        const ctx = lossCanvas.getContext('2d');
        if (ctx && neuralNetworkResult.training_losses) {
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: neuralNetworkResult.training_losses.map((_: any, index: number) => `轮次${index + 1}`),
              datasets: [{
                label: '训练损失',
                data: neuralNetworkResult.training_losses,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: '神经网络训练损失变化'
                }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  title: {
                    display: true,
                    text: '损失值'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: '训练轮次'
                  }
                }
              }
            }
          });
        }
      }
      
      // 渲染特征重要性柱状图
      const importanceCanvas = document.querySelector('#featureImportanceChart') as HTMLCanvasElement;
      if (importanceCanvas && neuralNetworkResult.feature_importance) {
        Chart.getChart(importanceCanvas)?.destroy();
        const ctx = importanceCanvas.getContext('2d');
        if (ctx) {
          const currentFeatureNames = filteredThirdIndicators.length > 0 
            ? filteredThirdIndicators 
            : allThird;
          
          new Chart(ctx, {
            type: 'bar',
            data: {
              labels: neuralNetworkResult.feature_names || currentFeatureNames,
              datasets: [{
                label: '特征重要性',
                data: neuralNetworkResult.feature_importance,
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                title: {
                  display: true,
                  text: '神经网络特征重要性分析'
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: '重要性分数'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: '特征指标'
                  },
                  ticks: {
                    maxRotation: 45
                  }
                }
              }
            }
          });
        }
      }
    });
  }

  // 渲染SHAP图表
  static renderSHAPChart(shapResult: any) {
    if (!shapResult) return;
    
    nextTick(() => {
      const canvas = document.querySelector('#shapChart') as HTMLCanvasElement;
      if (!canvas) return;
      
      Chart.getChart(canvas)?.destroy();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // 创建蜂群图数据
      const datasets: any[] = [];
      const colors = [
        'rgba(255, 99, 132, 0.8)',   // 红色
        'rgba(54, 162, 235, 0.8)',   // 蓝色  
        'rgba(255, 205, 86, 0.8)',   // 黄色
        'rgba(75, 192, 192, 0.8)',   // 青色
        'rgba(153, 102, 255, 0.8)',  // 紫色
        'rgba(255, 159, 64, 0.8)',   // 橙色
        'rgba(199, 199, 199, 0.8)',  // 灰色
        'rgba(83, 102, 255, 0.8)'    // 靛蓝色
      ];
      
      // 为每个IP创建一个数据集
      shapResult.ip_explanations?.forEach((explanation: any, ipIndex: number) => {
        const swarmData: any[] = [];
        const shapValues = explanation.shap_values || [];
        
        // 处理嵌套数组格式的SHAP值
        const flattenedShapValues = Array.isArray(shapValues[0]) 
          ? shapValues.map((arr: any[]) => arr[0]) // 如果是嵌套数组，取第一个元素
          : shapValues; // 如果已经是平坦数组，直接使用
        
        // 为每个特征创建散点数据，添加轻微的Y轴偏移来模拟蜂群效果
        flattenedShapValues.forEach((shapValue: number, featureIndex: number) => {
          if (typeof shapValue === 'number' && !isNaN(shapValue)) {
            // 计算蜂群偏移：基于IP索引和特征索引创建分布
            const baseOffset = (ipIndex - shapResult.ip_explanations.length / 2) * 0.02;
            const randomOffset = (Math.random() - 0.5) * 0.02;
            const yOffset = baseOffset + randomOffset;
            
            swarmData.push({
              x: featureIndex,
              y: shapValue + yOffset,
              originalValue: shapValue,
              ip: explanation.name,
              feature: shapResult.feature_names[featureIndex]
            });
          }
        });
        
        if (swarmData.length > 0) {
          datasets.push({
            label: explanation.name,
            data: swarmData,
            backgroundColor: colors[ipIndex % colors.length],
            borderColor: colors[ipIndex % colors.length].replace('0.8', '1'),
            borderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: false
          });
        }
      });
      
      new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'SHAP特征贡献度蜂群图'
            },
            tooltip: {
              callbacks: {
                title: function(context: any) {
                  const point = context[0];
                  return `${point.dataset.label} - ${point.raw.feature}`;
                },
                label: function(context: any) {
                  const point = context.raw;
                  return `SHAP值: ${point.originalValue.toFixed(4)}`;
                }
              }
            },
            legend: {
              display: true,
              position: 'bottom' as const,
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 20,
                font: {
                  size: 13,
                  weight: 'bold' as const
                },
                boxWidth: 12,
                boxHeight: 12
              },
              maxHeight: 100
            }
          },
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              title: {
                display: true,
                text: '特征索引'
              },
              ticks: {
                stepSize: 1,
                callback: function(value: any) {
                  const index = Math.round(value);
                  return shapResult.feature_names[index] || '';
                }
              },
              min: -0.5,
              max: shapResult.feature_names.length - 0.5
            },
            y: {
              title: {
                display: true,
                text: 'SHAP值'
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              },
              beginAtZero: false,
              ticks: {
                callback: function(value: any) {
                  return value.toFixed(2);
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'point' as const
          }
        }
      });
    });
  }

  // 渲染PCA图表
  static renderPCAChart(pcaResult: any) {
    if (!pcaResult) return;
    
    nextTick(() => {
      const canvas = document.querySelector('#pcaChart') as HTMLCanvasElement;
      if (!canvas) return;
      
      Chart.getChart(canvas)?.destroy();
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // 创建PCA散点图
      if (pcaResult.pca_results) {
        const datasets = pcaResult.pca_results.map((result: any, index: number) => ({
          label: result.name,
          data: [{
            x: result.coordinates[0],
            y: result.coordinates[1]
          }],
          backgroundColor: `hsl(${(index * 360) / pcaResult.pca_results.length}, 70%, 50%)`,
          borderColor: `hsl(${(index * 360) / pcaResult.pca_results.length}, 70%, 40%)`,
          pointRadius: 8,
          pointHoverRadius: 10
        }));
        
        new Chart(ctx, {
          type: 'scatter',
          data: {
            datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: `PCA降维可视化 (总方差解释: ${(pcaResult.total_variance_explained * 100).toFixed(1)}%)`
              },
              legend: {
                display: true,
                position: 'right'
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: `主成分1 (${(pcaResult.explained_variance_ratio[0] * 100).toFixed(1)}%)`
                }
              },
              y: {
                title: {
                  display: true,
                  text: `主成分2 (${(pcaResult.explained_variance_ratio[1] * 100).toFixed(1)}%)`
                }
              }
            }
          }
        });
      }
    });
  }

  // 渲染所有基础图表
  static renderCharts(evaluationResult: EvaluationResult | null, filteredThirdIndicators: string[]) {
    nextTick(() => {
      this.renderFitnessChart(evaluationResult);
      this.renderScoreChart(evaluationResult);
      this.renderRadarChart(evaluationResult, filteredThirdIndicators);
    });
  }

  // 渲染特定图表
  static renderSpecificChart(chartId: string, evaluationResult: EvaluationResult | null, neuralNetworkResult: any, shapResult: any, pcaResult: any, filteredThirdIndicators: string[], allThird: string[]) {
    switch (chartId) {
      case 'fitness':
        this.renderFitnessChart(evaluationResult);
        break;
      case 'scores':
        this.renderScoreChart(evaluationResult);
        break;
      case 'radar':
        this.renderRadarChart(evaluationResult, filteredThirdIndicators);
        break;
      case 'neural':
        this.renderNeuralNetworkCharts(neuralNetworkResult, filteredThirdIndicators, allThird);
        break;
      case 'importance':
        this.renderNeuralNetworkCharts(neuralNetworkResult, filteredThirdIndicators, allThird);
        break;
      case 'shap':
        this.renderSHAPChart(shapResult);
        break;
      case 'pca':
        this.renderPCAChart(pcaResult);
        break;
    }
  }

  // 获取Canvas ID
  static getCanvasId(chartId: string): string {
    switch (chartId) {
      case 'fitness':
        return 'fitnessChart';
      case 'scores':
        return 'scoreChart';
      case 'radar':
        return 'radarChart';
      case 'neural':
        return 'nnLossChart';
      case 'importance':
        return 'featureImportanceChart';
      case 'shap':
        return 'shapChart';
      case 'pca':
        return 'pcaChart';
      default:
        return `${chartId}Chart`;
    }
  }
} 