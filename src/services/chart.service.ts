import * as echarts from 'echarts'

export class ChartService {
  private typeChart: echarts.ECharts | null = null
  private trendChart: echarts.ECharts | null = null

  // 初始化项目类型分布图
  initTypeChart(container: HTMLElement): void {
    this.typeChart = echarts.init(container)

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)',
        backgroundColor: 'rgba(0, 20, 40, 0.9)',
        borderColor: '#00d4ff',
        textStyle: { color: '#fff' }
      },
      series: [
        {
          name: '项目类型',
          type: 'pie',
          radius: '70%',
          center: ['50%', '50%'],
          data: [
            { value: 35, name: '传统体育', itemStyle: { color: '#00ff88' } },
            { value: 25, name: '民族舞蹈', itemStyle: { color: '#00d4ff' } },
            { value: 20, name: '竞技体育', itemStyle: { color: '#ff6b6b' } },
            { value: 15, name: '民俗游戏', itemStyle: { color: '#ffa726' } },
            { value: 5, name: '其他', itemStyle: { color: '#ab47bc' } }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            color: '#fff',
            fontSize: 10
          },
          labelLine: {
            lineStyle: { color: '#fff' }
          }
        }
      ]
    }

    this.typeChart.setOption(option)
  }

  // 初始化趋势图
  initTrendChart(container: HTMLElement): void {
    this.trendChart = echarts.init(container)

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 20, 40, 0.9)',
        borderColor: '#00d4ff',
        textStyle: { color: '#fff' }
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '20%',
        bottom: '20%'
      },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月'],
        axisLine: { lineStyle: { color: '#00d4ff' } },
        axisLabel: { color: '#fff', fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#00d4ff' } },
        axisLabel: { color: '#fff', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.1)' } }
      },
      series: [
        {
          data: [12, 19, 23, 25, 28, 32],
          type: 'line',
          smooth: true,
          itemStyle: { color: '#00ff88' },
          lineStyle: { color: '#00ff88', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 255, 136, 0.3)' },
                { offset: 1, color: 'rgba(0, 255, 136, 0.1)' }
              ]
            }
          }
        }
      ]
    }

    this.trendChart.setOption(option)
  }

  // 更新项目类型分布数据
  updateTypeChartData(data: Array<{ value: number, name: string, color: string }>): void {
    if (!this.typeChart) return

    const chartData = data.map(item => ({
      value: item.value,
      name: item.name,
      itemStyle: { color: item.color }
    }))

    this.typeChart.setOption({
      series: [{
        data: chartData
      }]
    })
  }

  // 更新趋势图数据
  updateTrendChartData(monthData: number[], months: string[]): void {
    if (!this.trendChart) return

    this.trendChart.setOption({
      xAxis: {
        data: months
      },
      series: [{
        data: monthData
      }]
    })
  }

  // 调整图表大小
  resize(): void {
    this.typeChart?.resize()
    this.trendChart?.resize()
  }

  // 销毁图表
  dispose(): void {
    this.typeChart?.dispose()
    this.trendChart?.dispose()
    this.typeChart = null
    this.trendChart = null
  }

  // 获取图表实例
  getTypeChart(): echarts.ECharts | null {
    return this.typeChart
  }

  getTrendChart(): echarts.ECharts | null {
    return this.trendChart
  }
}

export const chartService = new ChartService() 