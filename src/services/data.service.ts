import { ref } from 'vue'

export interface RegionRanking {
  name: string
  score: number
}

export interface RealtimeDataItem {
  id: number
  time: string
  content: string
}

export class DataService {
  public totalProjects = ref(156)
  public totalRegions = ref(34)
  public averageScore = ref(8.7)

  // 模拟排行榜数据
  public topRegions = ref<RegionRanking[]>([
    { name: '新疆', score: 9.8 },
    { name: '西藏', score: 9.5 },
    { name: '内蒙古', score: 9.3 },
    { name: '云南', score: 9.1 },
    { name: '贵州', score: 8.9 }
  ])

  // 实时数据流
  public realtimeData = ref<RealtimeDataItem[]>([
    { id: 1, time: '14:32', content: '新疆地区新增马术项目数据' },
    { id: 2, time: '14:30', content: '西藏地区牦牛赛跑数据更新' },
    { id: 3, time: '14:28', content: '云南地区龙舟比赛数据同步' },
    { id: 4, time: '14:25', content: '内蒙古摔跤项目分析完成' }
  ])

  // 更新统计数据
  updateStatistics(projects: number, regions: number, avgScore: number): void {
    this.totalProjects.value = projects
    this.totalRegions.value = regions
    this.averageScore.value = avgScore
  }

  // 更新排行榜数据
  updateTopRegions(regions: RegionRanking[]): void {
    this.topRegions.value = regions
  }

  // 添加实时数据
  addRealtimeData(item: Omit<RealtimeDataItem, 'id'>): void {
    const newItem: RealtimeDataItem = {
      ...item,
      id: Date.now()
    }
    
    this.realtimeData.value.unshift(newItem)
    
    // 保持最多20条记录
    if (this.realtimeData.value.length > 20) {
      this.realtimeData.value = this.realtimeData.value.slice(0, 20)
    }
  }

  // 生成模拟实时数据
  generateMockRealtimeData(): void {
    const regions = ['新疆', '西藏', '内蒙古', '云南', '贵州', '广西', '宁夏']
    const activities = [
      '新增马术项目数据',
      '牦牛赛跑数据更新', 
      '龙舟比赛数据同步',
      '摔跤项目分析完成',
      '射箭比赛记录刷新',
      '民族舞蹈评分更新',
      '传统体育数据采集',
      '项目评估完成'
    ]

    const now = new Date()
    const timeStr = now.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })

    const randomRegion = regions[Math.floor(Math.random() * regions.length)]
    const randomActivity = activities[Math.floor(Math.random() * activities.length)]

    this.addRealtimeData({
      time: timeStr,
      content: `${randomRegion}地区${randomActivity}`
    })
  }

  // 启动模拟数据生成
  startMockDataGeneration(): void {
    // 每30秒生成一次新的实时数据
    setInterval(() => {
      this.generateMockRealtimeData()
    }, 30000)
  }

  // 计算地区排行榜（基于实际数据）
  calculateRegionRanking(regionData: Record<string, number>): RegionRanking[] {
    const rankings: RegionRanking[] = Object.entries(regionData)
      .map(([name, count]) => ({
        name,
        score: Number((count * 0.3 + Math.random() * 2 + 7).toFixed(1))
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    this.updateTopRegions(rankings)
    return rankings
  }

  // 获取项目类型分布数据（模拟）
  getProjectTypeDistribution(): Array<{ value: number, name: string, color: string }> {
    return [
      { value: 35, name: '传统体育', color: '#00ff88' },
      { value: 25, name: '民族舞蹈', color: '#00d4ff' },
      { value: 20, name: '竞技体育', color: '#ff6b6b' },
      { value: 15, name: '民俗游戏', color: '#ffa726' },
      { value: 5, name: '其他', color: '#ab47bc' }
    ]
  }

  // 获取月度趋势数据（模拟）
  getMonthlyTrend(): { months: string[], data: number[] } {
    return {
      months: ['1月', '2月', '3月', '4月', '5月', '6月'],
      data: [12, 19, 23, 25, 28, 32]
    }
  }

  // 格式化数字显示
  formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
}

export const dataService = new DataService() 