<template>
  <div class="dashboard-screen">
    <!-- 顶部导航和标题 -->
    <div class="header-section">
      <div class="header-left">
        <h1 class="main-title">少数民族民俗体育IP可视化大屏</h1>
        <div class="time-display">{{ currentTime }}</div>
          </div>
          </div>
      
    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧数据统计面板 -->
      <div class="left-panel">
        <div class="stat-card">
          <div class="stat-icon">🏗️</div>
            <div class="stat-content">
            <div class="stat-value">{{ mapStats.totalProjects || totalProjects }}</div>
            <div class="stat-label">体育项目</div>
        </div>
          </div>
        <div class="stat-card">
          <div class="stat-icon">📍</div>
            <div class="stat-content">
            <div class="stat-value">{{ mapStats.provinceCount || totalRegions }}</div>
            <div class="stat-label">覆盖省份</div>
            </div>
          </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ mapStats.cityCount || 0 }}</div>
            <div class="stat-label">覆盖城市</div>
        </div>
      </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <div class="stat-value">{{ averageScore }}</div>
            <div class="stat-label">平均评分</div>
      </div>
    </div>

        <!-- 地区排行榜 -->
        <div class="ranking-card">
          <h3>地区排行榜</h3>
          <div class="ranking-list">
            <div v-for="(region, index) in topRegions" :key="region.name" class="ranking-item">
              <div class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
              <div class="region-name">{{ region.name }}</div>
              <div class="region-score">{{ region.score }}</div>
        </div>
        </div>
            </div>
          </div>
          
      <!-- 中央地图区域 -->
      <div class="map-container">
        <div class="map-header">
          <div class="map-title">中国民族体育项目分布图</div>
          <div class="map-navigation">
            <div class="map-breadcrumb">
              <span class="breadcrumb-item" @click="initChinaMap">中国</span>
              <span v-if="currentMapLevel !== 'china'" class="breadcrumb-separator">></span>
              <span v-if="currentMapLevel === 'province'" class="breadcrumb-item current">{{ currentMapName }}</span>
              <span v-if="currentMapLevel === 'city'" class="breadcrumb-item" @click="loadProvinceMap(mapHistory[mapHistory.length - 1])">{{ mapHistory[mapHistory.length - 1] }}</span>
              <span v-if="currentMapLevel === 'city'" class="breadcrumb-separator">></span>
              <span v-if="currentMapLevel === 'city'" class="breadcrumb-item current">{{ currentMapName }}</span>
            </div>
            <button v-if="mapHistory.length > 0" @click="goBackMap" class="back-btn">
              <span>← 返回</span>
      </button>
    </div>
            </div>
        <div id="chinaMap" class="china-map"></div>
        <div class="map-tip">
          {{ getMapTip() }}
          </div>
            </div>

      <!-- 右侧详情面板 -->
      <div class="right-panel">
        <!-- 实时数据流 -->
        <div class="realtime-card">
          <h3>实时数据流</h3>
          <div class="data-stream">
            <div v-for="item in realtimeData" :key="item.id" class="stream-item">
              <div class="stream-time">{{ item.time }}</div>
              <div class="stream-content">{{ item.content }}</div>
        </div>
          </div>
        </div>

        <!-- 项目类型分布 -->
        <div class="chart-card">
          <h3>项目类型分布</h3>
          <div id="typeChart" class="mini-chart"></div>
              </div>

        <!-- 月度趋势 -->
        <div class="chart-card">
          <h3>月度增长趋势</h3>
          <div id="trendChart" class="mini-chart"></div>
            </div>
              </div>
            </div>
          
    <!-- 底部状态栏 -->
    <div class="footer-section">
      <div class="footer-left">
        <span class="status-indicator online"></span>
        <span>系统运行正常</span>
          </div>
      <div class="footer-right">
        <span>可视化大屏模式</span>
        <span style="margin-left: 20px;">最后更新: {{ lastUpdateTime }}</span>
        </div>
      </div>
          
    <!-- 粒子背景效果 -->
    <div class="particle-background" ref="particleContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ipApi } from '../utils/api'

const router = useRouter()

// 响应式数据
const currentTime = ref('')
const lastUpdateTime = ref('')
const totalProjects = ref(156)
const totalRegions = ref(34)
const averageScore = ref(8.7)

// 地图钻取相关数据
const currentMapLevel = ref('china') // 当前地图级别：china, province, city
const currentMapName = ref('中国') // 当前地图名称
const mapHistory = ref<string[]>([]) // 地图导航历史

// 数据库IP地址数据
const ipLocationData = ref<any[]>([])
const mapStats = reactive({
  totalProjects: 0,
  provinceCount: 0,
  cityCount: 0,
  regionDistribution: {} as Record<string, number>
})

// 省份名称到拼音的映射
const provinces: Record<string, string> = {
  "台湾": "taiwan",
  "河北": "hebei", 
  "山西": "shanxi",
  "辽宁": "liaoning",
  "吉林": "jilin",
  "黑龙江": "heilongjiang",
  "江苏": "jiangsu",
  "浙江": "zhejiang",
  "安徽": "anhui",
  "福建": "fujian",
  "江西": "jiangxi",
  "山东": "shandong",
  "河南": "henan",
  "湖北": "hubei",
  "湖南": "hunan",
  "广东": "guangdong",
  "海南": "hainan",
  "四川": "sichuan",
  "贵州": "guizhou",
  "云南": "yunnan",
  "陕西": "shanxi1",
  "甘肃": "gansu",
  "青海": "qinghai",
  "新疆": "xinjiang",
  "广西": "guangxi",
  "内蒙古": "neimenggu",
  "宁夏": "ningxia",
  "西藏": "xizang",
  "北京": "beijing",
  "天津": "tianjin",
  "上海": "shanghai",
  "重庆": "chongqing",
  "香港": "xianggang",
  "澳门": "aomen"
}

// 标准化省份名称 - 处理数据库中带"省"、"市"、"区"等后缀的地名
const normalizeProvinceName = (provinceName: string): string => {
  if (!provinceName) return ''
  
  // 移除常见后缀
  let normalized = provinceName
    .replace(/省$/, '')
    .replace(/市$/, '')
    .replace(/自治区$/, '')
    .replace(/特别行政区$/, '')
    .replace(/维吾尔自治区$/, '')
    .replace(/回族自治区$/, '')
    .replace(/壮族自治区$/, '')
  
  // 特殊处理
  const specialMappings: Record<string, string> = {
    '新疆维吾尔': '新疆',
    '宁夏回族': '宁夏',
    '广西壮族': '广西',
    '内蒙': '内蒙古',
    '西藏自治': '西藏'
  }
  
  for (const [key, value] of Object.entries(specialMappings)) {
    if (normalized.includes(key)) {
      normalized = value
      break
    }
  }
  
  return normalized
}

// 直辖市和特别行政区（只有二级）
const specialRegions = ["北京", "天津", "上海", "重庆", "香港", "澳门"]

// 城市名称到编码的映射（从实际文件加载）
let cityMap: Record<string, string> = {}

// 模拟数据
const topRegions = ref([
  { name: '新疆', score: 9.8 },
  { name: '西藏', score: 9.5 },
  { name: '内蒙古', score: 9.3 },
  { name: '云南', score: 9.1 },
  { name: '贵州', score: 8.9 }
])

const realtimeData = ref([
  { id: 1, time: '14:32', content: '新疆地区新增马术项目数据' },
  { id: 2, time: '14:30', content: '西藏地区牦牛赛跑数据更新' },
  { id: 3, time: '14:28', content: '云南地区龙舟比赛数据同步' },
  { id: 4, time: '14:25', content: '内蒙古摔跤项目分析完成' }
])

// 地图实例
let mapChart: echarts.ECharts | null = null
let typeChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  lastUpdateTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 渲染地图的通用函数
const renderMap = async (mapType: string, mapName: string, data?: any[], zoom?: number, center?: [number, number]) => {
  if (!mapChart) return

  const option = {
    backgroundColor: 'transparent',
    title: {
      show: false
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data || {}
        const projectCount = data.value || 0
        
        if (projectCount > 0) {
          // 获取该省份的具体项目信息
          const provinceProjects = ipLocationData.value.filter(item => item.province === params.name)
          let projectList = provinceProjects.slice(0, 3).map(p => `• ${p.name} (${p.expert})`).join('<br/>')
          if (provinceProjects.length > 3) {
            projectList += `<br/>还有 ${provinceProjects.length - 3} 个项目...`
          }
          
          // 获取原始省份名称用于显示
          const originalProvinceName = provinceProjects.length > 0 ? 
            (provinceProjects[0].originalProvince || params.name) : params.name
          
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; color: #333; margin-bottom: 8px;">
                ${originalProvinceName}
              </div>
              <div style="color: #666; margin-bottom: 6px;">
                项目数量: <span style="color: #1890ff; font-weight: bold;">${projectCount}</span>
              </div>
              <div style="font-size: 12px; color: #999; margin-bottom: 4px;">项目详情:</div>
              <div style="font-size: 12px; color: #666;">
                ${projectList}
              </div>
            </div>
          `
        } else {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; color: #333;">${params.name}</div>
              <div style="color: #999; font-size: 12px;">暂无项目数据</div>
            </div>
          `
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(...Object.values(mapStats.regionDistribution), 5),
      left: 'left',
      top: 'bottom',
      text: ['项目多', '项目少'],
      textStyle: {
        color: '#fff',
        fontSize: 12
      },
      inRange: {
        color: ['#2c3e50', '#2196f3', '#4caf50', '#ffc107', '#ff9800', '#f44336', '#d32f2f']
      },
      show: true,  // 始终显示图例
      itemWidth: 20,
      itemHeight: 140,
      calculable: true,
      realtime: false,
      formatter: function(value: number) {
        return Math.round(value) + '个'
      }
    },
    series: [
      {
        name: '中国',
        type: 'map',
        map: 'china',
        data: data || [],
        roam: true,
        zoom: zoom || 1.1,
        emphasis: {
          itemStyle: {
            areaColor: '#ff6b6b',  // 鼠标悬停时的明亮红色
            borderColor: '#fff',
            borderWidth: 2,
            shadowColor: 'rgba(255, 107, 107, 0.6)',
            shadowBlur: 15
          },
          label: {
            show: true,
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 14
          }
        },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 1,
          shadowColor: 'rgba(0, 0, 0, 0.3)',
          shadowBlur: 8
        },
        label: {
          show: true,
          color: '#ffffff',
          fontSize: 10,
          fontWeight: 'normal'
        }
      }
    ]
  }

  mapChart.setOption(option)
}

// 返回上一级地图
const goBackMap = () => {
  if (mapHistory.value.length > 0) {
    if (currentMapLevel.value === 'city') {
      // 从城市级返回到省份级
      const provinceName = mapHistory.value[mapHistory.value.length - 1]
      mapHistory.value.pop() // 移除省份名称
      loadProvinceMap(provinceName)
    } else if (currentMapLevel.value === 'province') {
      // 从省份级返回到全国
      mapHistory.value.pop() // 移除"中国"
      initChinaMap()
    }
  }
}

// 初始化中国地图
const initChinaMap = async () => {
  const mapElement = document.getElementById('chinaMap')
  if (!mapElement) return

  try {
    // 加载IP地址数据
    const locationData = await loadIPLocationData()
    
    // 加载中国地图数据
    const response = await fetch('/map/china.json')
    const mapData = await response.json()
    
    // 注册地图
    echarts.registerMap('china', mapData)

    mapChart = echarts.init(mapElement)

    // 生成省份数据，包含项目数量
    const chinaData = mapData.features.map((feature: any) => {
      const provinceName = feature.properties.name
      const projectCount = mapStats.regionDistribution[provinceName] || 0
      
      return {
        name: provinceName,
        value: projectCount,
        itemStyle: {
          areaColor: getHeatColor(projectCount),
          borderColor: '#ffffff',
          borderWidth: 1,
          opacity: 0.9
        }
      }
    })

    // 更新统计信息显示
    totalProjects.value = mapStats.totalProjects
    totalRegions.value = mapStats.provinceCount

    // 重置地图状态
    currentMapLevel.value = 'china'
    currentMapName.value = '中国'
    mapHistory.value = []

    const option = {
      title: {
        text: `中国民族体育项目分布图 (${mapStats.totalProjects}个项目)`,
        left: 'center',
        top: 20,
        textStyle: {
          color: '#fff',
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function (params: any) {
          const data = params.data || {}
          const projectCount = data.value || 0
          
          if (projectCount > 0) {
            // 获取该省份的具体项目信息
            const provinceProjects = locationData.filter(item => item.province === params.name)
            let projectList = provinceProjects.slice(0, 3).map(p => `• ${p.name} (${p.expert})`).join('<br/>')
            if (provinceProjects.length > 3) {
              projectList += `<br/>还有 ${provinceProjects.length - 3} 个项目...`
            }
            
            // 获取原始省份名称用于显示
            const originalProvinceName = provinceProjects.length > 0 ? 
              (provinceProjects[0].originalProvince || params.name) : params.name
            
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; color: #333; margin-bottom: 8px;">
                  ${originalProvinceName}
                </div>
                <div style="color: #666; margin-bottom: 6px;">
                  项目数量: <span style="color: #1890ff; font-weight: bold;">${projectCount}</span>
                </div>
                <div style="font-size: 12px; color: #999; margin-bottom: 4px;">项目详情:</div>
                <div style="font-size: 12px; color: #666;">
                  ${projectList}
                </div>
              </div>
            `
              } else {
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; color: #333;">${params.name}</div>
                <div style="color: #999; font-size: 12px;">暂无项目数据</div>
              </div>
            `
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        }
      },
      visualMap: {
        min: 0,
        max: Math.max(...Object.values(mapStats.regionDistribution), 5),
        left: 'left',
        top: 'bottom',
        text: ['项目多', '项目少'],
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        inRange: {
          color: ['#2c3e50', '#2196f3', '#4caf50', '#ffc107', '#ff9800', '#f44336', '#d32f2f']
        },
        show: true,  // 始终显示图例
        itemWidth: 20,
        itemHeight: 140,
        calculable: true,
        realtime: false,
        formatter: function(value: number) {
          return Math.round(value) + '个'
        }
      },
      series: [
        {
          name: '中国',
          type: 'map',
          map: 'china',
          data: chinaData,
          roam: true,
          zoom: 1.1,
          emphasis: {
            itemStyle: {
              areaColor: '#ff6b6b',  // 鼠标悬停时的明亮红色
              borderColor: '#fff',
              borderWidth: 2,
              shadowColor: 'rgba(255, 107, 107, 0.6)',
              shadowBlur: 15
            },
            label: {
              show: true,
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 14
            }
          },
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 1,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 8
          },
          label: {
            show: true,
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 'normal'
          }
        }
      ]
    }

    mapChart.setOption(option)

    // 绑定点击事件
    mapChart.off('click')
    mapChart.on('click', (params) => {
      console.log('点击了:', params.name)
      if (params.name && provinces[params.name]) {
        loadProvinceMap(params.name)
      }
    })

    // 窗口大小变化监听
    const resizeHandler = () => {
      mapChart?.resize()
    }

    window.addEventListener('resize', resizeHandler)
    
    console.log('🗺️ 中国地图初始化完成')
    console.log('📊 地图数据统计:', {
      总项目数: mapStats.totalProjects,
      覆盖省份: mapStats.provinceCount,
      分布情况: mapStats.regionDistribution
    })

  } catch (error) {
    console.error('初始化中国地图失败:', error)
  }
}

// 根据项目数量生成热力图颜色
const getHeatColor = (count: number) => {
  // 强制设置最小阈值，确保有颜色显示
  if (count === 0) return '#2c3e50'  // 深灰色，表示无数据
  
  const maxCount = Math.max(...Object.values(mapStats.regionDistribution), 1)
  const ratio = count / maxCount
  
  // 使用更明显的颜色方案
  if (ratio >= 1.0) return '#d32f2f'      // 深红色 - 最多项目
  if (ratio >= 0.8) return '#f44336'      // 红色 
  if (ratio >= 0.6) return '#ff9800'      // 橙色
  if (ratio >= 0.4) return '#ffc107'      // 黄色
  if (ratio >= 0.2) return '#4caf50'      // 绿色
  if (ratio > 0) return '#2196f3'         // 蓝色 - 有数据但较少
  return '#2c3e50'                        // 深灰色 - 无数据
}

// 加载省份地图
const loadProvinceMap = async (provinceName: string) => {
  try {
    console.log('🗺️ 加载省份地图:', provinceName)
    const provinceCode = provinces[provinceName]
    const response = await fetch(`/map/province/${provinceCode}.json`)
    const mapData = await response.json()
    
    // 注册省份地图
    echarts.registerMap(provinceName, mapData)
    
    // 获取该省份的项目数据
    const provinceProjects = ipLocationData.value.filter(item => item.province === provinceName)
    console.log(`📊 ${provinceName}省份项目数据:`, provinceProjects)
    
    // 计算各城市的项目分布
    const cityDistribution: Record<string, number> = {}
    provinceProjects.forEach(project => {
      // 标准化城市名称（移除"市"后缀进行匹配）
      const cityKey = project.city.replace(/市$/, '').replace(/地区$/, '').replace(/州$/, '').replace(/盟$/, '')
      cityDistribution[cityKey] = (cityDistribution[cityKey] || 0) + 1
    })
    
    console.log('🏙️ 城市项目分布:', cityDistribution)
    
    // 生成城市数据，包含项目数量和颜色
    const maxCityProjects = Math.max(...Object.values(cityDistribution), 1)
    const provinceData = mapData.features.map((feature: any) => {
      const cityName = feature.properties.name
      const baseCity = cityName.replace(/市$/, '').replace(/地区$/, '').replace(/州$/, '').replace(/盟$/, '')
      const projectCount = cityDistribution[baseCity] || cityDistribution[cityName] || 0
      
      // 城市级别的颜色映射
      let areaColor = '#2c3e50' // 默认深灰色
      if (projectCount > 0) {
        const ratio = projectCount / maxCityProjects
        if (ratio >= 1.0) areaColor = '#d32f2f'      // 深红色
        else if (ratio >= 0.8) areaColor = '#f44336' // 红色 
        else if (ratio >= 0.6) areaColor = '#ff9800' // 橙色
        else if (ratio >= 0.4) areaColor = '#ffc107' // 黄色
        else if (ratio >= 0.2) areaColor = '#4caf50' // 绿色
        else areaColor = '#2196f3'                   // 蓝色
      }
      
      return {
        name: cityName,
        value: projectCount,
        itemStyle: {
          areaColor: areaColor,
          borderColor: '#ffffff',
          borderWidth: 1,
          opacity: 0.9
        }
      }
    })

    // 更新导航历史 - 只在从全国进入时添加
    if (currentMapLevel.value === 'china') {
      mapHistory.value.push('中国')
    }
    currentMapLevel.value = 'province'
    currentMapName.value = provinceName

    // 计算省份中心点
    let minLon = Infinity, maxLon = -Infinity
    let minLat = Infinity, maxLat = -Infinity
    
    mapData.features.forEach((feature: any) => {
      if (feature.properties && feature.properties.cp) {
        const [lon, lat] = feature.properties.cp
        minLon = Math.min(minLon, lon)
        maxLon = Math.max(maxLon, lon)
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
      }
    })

    if (minLon === Infinity) {
      minLon = 70; maxLon = 135; minLat = 15; maxLat = 55
    }

    const centerLon = (minLon + maxLon) / 2
    const centerLat = (minLat + maxLat) / 2

    // 根据省份大小调整缩放级别
    const lonRange = maxLon - minLon
    const latRange = maxLat - minLat
    const maxRange = Math.max(lonRange, latRange)
    let zoom = 1.5
    if (maxRange < 2) zoom = 3
    else if (maxRange < 4) zoom = 2.5
    else if (maxRange < 6) zoom = 2

    // 渲染省份地图
    if (!mapChart) return
    
    const option = {
      title: {
        text: `${provinceName} - 项目分布图 (${provinceProjects.length}个项目)`,
        left: 'center',
        top: 20,
        textStyle: {
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function (params: any) {
          const data = params.data || {}
          const projectCount = data.value || 0
          
          if (projectCount > 0) {
            // 获取该城市的具体项目信息
            const cityProjects = provinceProjects.filter(item => {
              const cityBase = item.city.replace(/市$/, '').replace(/地区$/, '').replace(/州$/, '').replace(/盟$/, '')
              const paramBase = params.name.replace(/市$/, '').replace(/地区$/, '').replace(/州$/, '').replace(/盟$/, '')
              return cityBase === paramBase || item.city === params.name
            })
            
            let projectList = cityProjects.slice(0, 3).map(p => `• ${p.name} (${p.expert})`).join('<br/>')
            if (cityProjects.length > 3) {
              projectList += `<br/>还有 ${cityProjects.length - 3} 个项目...`
            }
            
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; color: #333; margin-bottom: 8px;">
                  ${params.name}
                </div>
                <div style="color: #666; margin-bottom: 6px;">
                  项目数量: <span style="color: #1890ff; font-weight: bold;">${projectCount}</span>
                </div>
                <div style="font-size: 12px; color: #999; margin-bottom: 4px;">项目详情:</div>
                <div style="font-size: 12px; color: #666;">
                  ${projectList}
                </div>
              </div>
            `
          } else {
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; color: #333;">${params.name}</div>
                <div style="color: #999; font-size: 12px;">暂无项目数据</div>
              </div>
            `
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        }
      },
      visualMap: {
        min: 0,
        max: maxCityProjects,
        left: 'left',
        top: 'bottom',
        text: ['项目多', '项目少'],
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        inRange: {
          color: ['#2c3e50', '#2196f3', '#4caf50', '#ffc107', '#ff9800', '#f44336', '#d32f2f']
        },
        show: maxCityProjects > 0,
        itemWidth: 20,
        itemHeight: 120,
        calculable: true,
        realtime: false,
        formatter: function(value: number) {
          return Math.round(value) + '个'
        }
      },
      series: [
        {
          name: provinceName,
          type: 'map',
          map: provinceName,
          data: provinceData,
          roam: true,
          zoom: zoom,
          center: [centerLon, centerLat],
          emphasis: {
            itemStyle: {
              areaColor: '#ff6b6b',
              borderColor: '#fff',
              borderWidth: 2,
              shadowColor: 'rgba(255, 107, 107, 0.6)',
              shadowBlur: 15
            },
            label: {
              show: true,
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 12
            }
          },
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 1,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 5
          },
          label: {
            show: true,
            color: '#ffffff',
            fontSize: 9,
            fontWeight: 'normal'
          }
        }
      ]
    }

    mapChart.setOption(option)

    // 重新绑定点击事件
    mapChart.off('click')
    mapChart.on('click', (params) => {
      console.log('点击了市/县:', params.name, '当前省份:', provinceName)
      
      // 如果是直辖市或特别行政区，点击返回全国
      if (specialRegions.includes(provinceName)) {
        console.log('直辖市，返回全国地图')
        initChinaMap()
      } else {
        // 尝试加载城市级地图
        if (params.name && params.name in cityMap) {
          console.log('找到城市映射，加载城市地图')
          loadCityMap(params.name, provinceName)
        } else {
          console.log(`${provinceName} - ${params.name} 暂无详细地图数据，但可以显示项目详情`)
          // 显示该城市的项目详情
          showCityProjectDetails(params.name, provinceName)
        }
      }
    })

    console.log('✅ 省份地图加载完成:', provinceName)

  } catch (error) {
    console.error('加载省份地图失败:', error)
    alert(`无法加载 ${provinceName} 的地图数据，请检查地图文件是否存在`)
  }
}

// 显示城市项目详情
const showCityProjectDetails = (cityName: string, provinceName: string) => {
  const cityProjects = ipLocationData.value.filter(item => {
    const cityBase = item.city.replace(/市$/, '').replace(/地区$/, '').replace(/州$/, '').replace(/盟$/, '')
    const paramBase = cityName.replace(/市$/, '').replace(/地区$/, '').replace(/州$/, '').replace(/盟$/, '')
    return (cityBase === paramBase || item.city === cityName) && item.province === provinceName
  })
  
  if (cityProjects.length > 0) {
    let projectDetails = `${provinceName} - ${cityName}\n\n共有 ${cityProjects.length} 个项目：\n\n`
    cityProjects.forEach((project, index) => {
      projectDetails += `${index + 1}. ${project.name}\n`
      projectDetails += `   专家：${project.expert}\n`
      projectDetails += `   组别：${project.group}\n`
      if (project.district) {
        projectDetails += `   地址：${project.fullAddress}\n`
      }
      projectDetails += '\n'
    })
    
    alert(projectDetails)
  } else {
    alert(`${provinceName} - ${cityName}\n\n该城市暂无项目数据`)
  }
}

// 显示区县项目详情
const showDistrictProjectDetails = (districtName: string, cityName: string, provinceName: string) => {
  const districtProjects = ipLocationData.value.filter(item => {
    if (!item.district) return false
    const districtBase = item.district.replace(/区$/, '').replace(/县$/, '').replace(/街道$/, '')
    const paramBase = districtName.replace(/区$/, '').replace(/县$/, '').replace(/街道$/, '')
    return (districtBase === paramBase || item.district === districtName) && 
           item.city === cityName && item.province === provinceName
  })
  
  if (districtProjects.length > 0) {
    let projectDetails = `${provinceName} - ${cityName} - ${districtName}\n\n共有 ${districtProjects.length} 个项目：\n\n`
    districtProjects.forEach((project, index) => {
      projectDetails += `${index + 1}. ${project.name}\n`
      projectDetails += `   专家：${project.expert}\n`
      projectDetails += `   组别：${project.group}\n`
      projectDetails += `   地址：${project.fullAddress}\n\n`
    })
    
    alert(projectDetails)
  } else {
    alert(`${provinceName} - ${cityName} - ${districtName}\n\n该区县暂无项目数据`)
  }
}

// 加载城市映射关系
const loadCityMapping = async () => {
  console.log('🏙️ 开始加载城市映射...')
  
  // 先设置备用城市映射，确保基本功能
  const backupCityMap = {
    // 新疆地区
    "乌鲁木齐市": "650100",
    "克拉玛依市": "650200", 
    "吐鲁番市": "650400",
    "哈密市": "650500",
    "昌吉回族自治州": "652300",
    "博尔塔拉蒙古自治州": "652700",
    "巴音郭楞蒙古自治州": "652800",
    "阿克苏地区": "652900",
    "克孜勒苏柯尔克孜自治州": "653000",
    "喀什地区": "653100",
    "和田地区": "653200",
    "伊犁哈萨克自治州": "654000",
    "塔城地区": "654200",
    "阿勒泰地区": "654300",
    // 西藏地区
    "拉萨市": "540100",
    "昌都市": "540300", 
    "山南市": "540500",
    "日喀则市": "540200",
    "那曲市": "540600",
    "阿里地区": "542500",
    "林芝市": "540400",
    // 江苏地区
    "南京市": "320100",
    "无锡市": "320200",
    "徐州市": "320300",
    "常州市": "320400",
    "苏州市": "320500",
    "南通市": "320600",
    "连云港市": "320700",
    "淮安市": "320800",
    "盐城市": "320900",
    "扬州市": "321000",
    "镇江市": "321100",
    "泰州市": "321200",
    "宿迁市": "321300",
    // 云南地区
    "昆明市": "530100",
    "曲靖市": "530300",
    "玉溪市": "530400",
    "保山市": "530500",
    "昭通市": "530600",
    "丽江市": "530700",
    "普洱市": "530800",
    "临沧市": "530900",
    // 贵州地区
    "贵阳市": "520100",
    "六盘水市": "520200",
    "遵义市": "520300",
    "安顺市": "520400",
    "毕节市": "520500",
    "铜仁市": "520600",
    // 广西地区
    "南宁市": "450100",
    "柳州市": "450200",
    "桂林市": "450300",
    "梧州市": "450400",
    "北海市": "450500",
    "防城港市": "450600",
    "钦州市": "450700",
    "贵港市": "450800",
    "玉林市": "450900",
    "百色市": "451000",
    "贺州市": "451100",
    "河池市": "451200",
    "来宾市": "451300",
    "崇左市": "451400",
    // 四川地区
    "成都市": "510100",
    "自贡市": "510300",
    "攀枝花市": "510400",
    "泸州市": "510500",
    "德阳市": "510600",
    "绵阳市": "510700",
    "广元市": "510800",
    "遂宁市": "510900",
    "内江市": "511000",
    "乐山市": "511100",
    "南充市": "511300",
    "眉山市": "511400",
    "宜宾市": "511500",
    "广安市": "511600",
    "达州市": "511700",
    "雅安市": "511800",
    "巴中市": "511900",
    "资阳市": "512000"
  }
  
  cityMap = { ...backupCityMap }
  console.log('✅ 备用城市映射加载完成，共', Object.keys(cityMap).length, '个城市')
  
  // 尝试从文件加载完整映射
  try {
    console.log('🌐 尝试从文件加载完整城市映射...')
    const response = await fetch('/map/city/china-main-city-map.js')
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const text = await response.text()
    console.log('📄 文件加载成功，大小:', text.length, '字符')
    
    // 多种解析方法
    let fullCityMap: Record<string, string> | null = null
    
    // 方法1: 直接eval执行JS代码
    try {
      // 创建一个安全的执行环境
      const executionContext = { cityMap: {} }
      const wrappedCode = `
        ${text}
        return cityMap;
      `
      fullCityMap = new Function(wrappedCode)()
      console.log('🎯 方法1成功: 直接执行JS，获得', Object.keys(fullCityMap || {}).length, '个城市')
          } catch (error) {
      console.log('❌ 方法1失败:', (error as Error).message)
    }
    
    // 方法2: 正则提取并eval
    if (!fullCityMap || Object.keys(fullCityMap).length === 0) {
      try {
        const cityMapMatch = text.match(/var cityMap = ({[\s\S]*?});/)
        if (cityMapMatch) {
          fullCityMap = eval(`(${cityMapMatch[1]})`)
          console.log('🎯 方法2成功: 正则提取，获得', Object.keys(fullCityMap || {}).length, '个城市')
        }
      } catch (error) {
        console.log('❌ 方法2失败:', (error as Error).message)
      }
    }
    
    // 方法3: 字符串替换后JSON.parse
    if (!fullCityMap || Object.keys(fullCityMap).length === 0) {
      try {
        const cityMapMatch = text.match(/var cityMap = ({[\s\S]*?});/)
        if (cityMapMatch) {
          let jsonStr = cityMapMatch[1]
          // 清理和转换为有效JSON
          jsonStr = jsonStr
            .replace(/'/g, '"')  // 单引号转双引号
            .replace(/([{,]\s*)([^":\s]+)\s*:/g, '$1"$2":')  // 无引号key加引号
            .replace(/,\s*}/g, '}')  // 移除尾随逗号
            .replace(/,\s*]/g, ']')  // 移除尾随逗号
          
          fullCityMap = JSON.parse(jsonStr)
          console.log('🎯 方法3成功: JSON解析，获得', Object.keys(fullCityMap || {}).length, '个城市')
        }
  } catch (error) {
        console.log('❌ 方法3失败:', (error as Error).message)
      }
    }
    
    // 使用成功加载的完整映射
    if (fullCityMap && Object.keys(fullCityMap).length > Object.keys(cityMap).length) {
      cityMap = fullCityMap
      console.log('🎉 完整城市映射加载成功！共', Object.keys(cityMap).length, '个城市')
      console.log('📋 包含的省份城市示例:')
      console.log('  - 西藏:', Object.keys(cityMap).filter(city => city.includes('拉萨') || city.includes('昌都')))
      console.log('  - 江苏:', Object.keys(cityMap).filter(city => city.includes('南京') || city.includes('苏州')))
      console.log('  - 广东:', Object.keys(cityMap).filter(city => city.includes('广州') || city.includes('深圳')))
              } else {
      console.log('⚠️ 无法加载完整映射，使用备用映射')
    }
    
  } catch (error: any) {
    console.log('❌ 从文件加载失败，使用备用映射:', error.message)
  }
  
  console.log('🏁 城市映射最终加载完成，共', Object.keys(cityMap).length, '个城市')
}

// 加载城市地图
const loadCityMap = async (cityName: string, provinceName: string) => {
  try {
    console.log('🏙️ 尝试加载城市地图:', cityName, '所属省份:', provinceName)
    
    // 检查城市映射是否存在
    if (!cityMap[cityName]) {
      console.log(`城市 ${cityName} 在映射表中不存在`)
      return
    }
    
    const cityCode = cityMap[cityName]
    console.log('城市编码:', cityCode)
    
    const response = await fetch(`/map/city/${cityCode}.json`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: 无法加载城市地图数据`)
    }
    
    const mapData = await response.json()
    console.log('城市地图数据加载成功:', mapData)
    
    // 注册城市地图
    echarts.registerMap(cityName, mapData)
    
    // 获取该城市的项目数据
    const cityProjects = ipLocationData.value.filter(item => {
      const itemCityBase = item.city.replace(/市$/, '').replace(/地区$/, '').replace(/州$/, '').replace(/盟$/, '')
      const targetCityBase = cityName.replace(/市$/, '').replace(/地区$/, '').replace(/州$/, '').replace(/盟$/, '')
      return (itemCityBase === targetCityBase || item.city === cityName) && item.province === provinceName
    })
    
    console.log(`📊 ${cityName}城市项目数据:`, cityProjects)
    
    // 计算各区县的项目分布
    const districtDistribution: Record<string, number> = {}
    cityProjects.forEach(project => {
      if (project.district) {
        const districtKey = project.district.replace(/区$/, '').replace(/县$/, '').replace(/街道$/, '')
        districtDistribution[districtKey] = (districtDistribution[districtKey] || 0) + 1
      }
    })
    
    console.log('🏘️ 区县项目分布:', districtDistribution)
    
    // 生成区县数据，包含项目数量和颜色
    const maxDistrictProjects = Math.max(...Object.values(districtDistribution), 1)
    const cityData = mapData.features.map((feature: any) => {
      const districtName = feature.properties.name
      const baseDistrict = districtName.replace(/区$/, '').replace(/县$/, '').replace(/街道$/, '')
      const projectCount = districtDistribution[baseDistrict] || districtDistribution[districtName] || 0
      
      // 区县级别的颜色映射
      let areaColor = '#2c3e50' // 默认深灰色
      if (projectCount > 0) {
        const ratio = projectCount / maxDistrictProjects
        if (ratio >= 1.0) areaColor = '#d32f2f'      // 深红色
        else if (ratio >= 0.8) areaColor = '#f44336' // 红色 
        else if (ratio >= 0.6) areaColor = '#ff9800' // 橙色
        else if (ratio >= 0.4) areaColor = '#ffc107' // 黄色
        else if (ratio >= 0.2) areaColor = '#4caf50' // 绿色
        else areaColor = '#2196f3'                   // 蓝色
      }
      
      return {
        name: districtName,
        value: projectCount,
        itemStyle: {
          areaColor: areaColor,
          borderColor: '#ffffff',
          borderWidth: 1,
          opacity: 0.9
        }
      }
    })

    // 更新导航历史
    mapHistory.value.push(provinceName)
    currentMapLevel.value = 'city'
    currentMapName.value = cityName

    // 计算城市中心点
    let minLon = Infinity, maxLon = -Infinity
    let minLat = Infinity, maxLat = -Infinity
    
    mapData.features.forEach((feature: any) => {
      if (feature.properties && feature.properties.cp) {
        const [lon, lat] = feature.properties.cp
        minLon = Math.min(minLon, lon)
        maxLon = Math.max(maxLon, lon)
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
      } else if (feature.geometry && feature.geometry.coordinates) {
        const coords = feature.geometry.coordinates
        const flatCoords = coords.flat(4).filter((item: any, index: number) => index % 2 === 0 || index % 2 === 1)
        
        for (let i = 0; i < flatCoords.length; i += 2) {
          if (typeof flatCoords[i] === 'number' && typeof flatCoords[i + 1] === 'number') {
            minLon = Math.min(minLon, flatCoords[i])
            maxLon = Math.max(maxLon, flatCoords[i])
            minLat = Math.min(minLat, flatCoords[i + 1])
            maxLat = Math.max(maxLat, flatCoords[i + 1])
          }
        }
      }
    })

    if (minLon === Infinity) {
      console.log('未找到有效的地图边界，使用默认居中')
      minLon = 90; maxLon = 100; minLat = 25; maxLat = 35
    }

    const centerLon = (minLon + maxLon) / 2
    const centerLat = (minLat + maxLat) / 2
    console.log('城市中心点:', [centerLon, centerLat])

    // 城市级别使用更高的缩放
    const lonRange = maxLon - minLon
    const latRange = maxLat - minLat
    const maxRange = Math.max(lonRange, latRange)
    let zoom = 3
    if (maxRange < 0.5) zoom = 6
    else if (maxRange < 1) zoom = 5
    else if (maxRange < 2) zoom = 4
    else if (maxRange < 3) zoom = 3.5

    console.log('使用缩放级别:', zoom)

    // 渲染城市地图
    if (!mapChart) return
    
    const option = {
      title: {
        text: `${provinceName} ${cityName} - 项目分布图 (${cityProjects.length}个项目)`,
        left: 'center',
        top: 20,
        textStyle: {
          color: '#fff',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function (params: any) {
          const data = params.data || {}
          const projectCount = data.value || 0
          
          if (projectCount > 0) {
            // 获取该区县的具体项目信息
            const districtProjects = cityProjects.filter(item => {
              if (!item.district) return false
              const districtBase = item.district.replace(/区$/, '').replace(/县$/, '').replace(/街道$/, '')
              const paramBase = params.name.replace(/区$/, '').replace(/县$/, '').replace(/街道$/, '')
              return districtBase === paramBase || item.district === params.name
            })
            
            let projectList = districtProjects.slice(0, 3).map(p => `• ${p.name} (${p.expert})`).join('<br/>')
            if (districtProjects.length > 3) {
              projectList += `<br/>还有 ${districtProjects.length - 3} 个项目...`
            }
            
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; color: #333; margin-bottom: 8px;">
                  ${params.name}
                </div>
                <div style="color: #666; margin-bottom: 6px;">
                  项目数量: <span style="color: #1890ff; font-weight: bold;">${projectCount}</span>
                </div>
                <div style="font-size: 12px; color: #999; margin-bottom: 4px;">项目详情:</div>
                <div style="font-size: 12px; color: #666;">
                  ${projectList}
                </div>
              </div>
            `
          } else {
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; color: #333;">${params.name}</div>
                <div style="color: #999; font-size: 12px;">暂无项目数据</div>
              </div>
            `
          }
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: {
          color: '#333'
        }
      },
      visualMap: {
        min: 0,
        max: maxDistrictProjects,
        left: 'left',
        top: 'bottom',
        text: ['项目多', '项目少'],
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        inRange: {
          color: ['#2c3e50', '#2196f3', '#4caf50', '#ffc107', '#ff9800', '#f44336', '#d32f2f']
        },
        show: maxDistrictProjects > 0,
        itemWidth: 20,
        itemHeight: 100,
        calculable: true,
        realtime: false,
        formatter: function(value: number) {
          return Math.round(value) + '个'
        }
      },
      series: [
        {
          name: cityName,
          type: 'map',
          map: cityName,
          data: cityData,
          roam: true,
          zoom: zoom,
          center: [centerLon, centerLat],
          emphasis: {
            itemStyle: {
              areaColor: '#ff6b6b',
              borderColor: '#fff',
              borderWidth: 2,
              shadowColor: 'rgba(255, 107, 107, 0.6)',
              shadowBlur: 15
            },
            label: {
              show: true,
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 10
            }
          },
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 1,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 5
          },
          label: {
            show: true,
            color: '#ffffff',
            fontSize: 8,
            fontWeight: 'normal'
          }
        }
      ]
    }

    mapChart.setOption(option)

    // 重新绑定点击事件
    mapChart.off('click')
    mapChart.on('click', (params) => {
      console.log('点击了区/县:', params.name)
      // 显示区县项目详情
      showDistrictProjectDetails(params.name, cityName, provinceName)
    })
    
    console.log('✅ 城市地图加载完成:', cityName)

  } catch (error) {
    console.error('加载城市地图失败:', error)
    alert(`无法加载 ${cityName} 的详细地图数据：${error}`)
  }
}

// 加载IP地址数据
const loadIPLocationData = async () => {
  try {
    console.log('🗂️ 加载IP地址数据...')
    const response = await ipApi.getAllIPs()
    
    if (response.data && Array.isArray(response.data)) {
      // 过滤有地址信息的IP，并标准化省份名称
      const ipsWithLocation = response.data
        .filter((ip: any) => ip.province && ip.city)
        .map((ip: any) => {
          const normalizedProvince = normalizeProvinceName(ip.province)
          console.log(`📍 数据处理: ${ip.project_name} - 原始省份: "${ip.province}" -> 标准化: "${normalizedProvince}"`)
          
          return {
            name: ip.project_name,
            expert: ip.expert,
            group: ip.group_name,
            province: normalizedProvince, // 使用标准化的省份名称
            originalProvince: ip.province, // 保留原始省份名称供显示用
            city: ip.city,
            district: ip.district || '',
            fullAddress: ip.full_address || `${ip.province} ${ip.city}`,
            value: 1 // 每个项目计为1个点
          }
        })
      
      console.log('✅ 真实IP数据处理完成:', ipsWithLocation.length, '个项目')
      console.log('📊 省份分布预览:', ipsWithLocation.map(ip => `${ip.name}(${ip.province})`).slice(0, 5))
      
      ipLocationData.value = ipsWithLocation
      
      // 如果真实数据太少，添加一些示例数据确保地图有颜色
      if (ipsWithLocation.length < 5) {
        console.log('📍 真实数据较少，添加示例数据以展示地图效果')
        const sampleData = [
          { name: '新疆马术', expert: '阿里木', group: '传统体育', province: '新疆', city: '乌鲁木齐市', district: '天山区', fullAddress: '新疆 乌鲁木齐市 天山区', value: 1 },
          { name: '西藏牦牛竞技', expert: '扎西', group: '民族体育', province: '西藏', city: '拉萨市', district: '城关区', fullAddress: '西藏 拉萨市 城关区', value: 1 },
          { name: '内蒙古摔跤', expert: '巴图', group: '竞技体育', province: '内蒙古', city: '呼和浩特市', district: '新城区', fullAddress: '内蒙古 呼和浩特市 新城区', value: 1 },
          { name: '云南龙舟', expert: '李明', group: '水上运动', province: '云南', city: '昆明市', district: '五华区', fullAddress: '云南 昆明市 五华区', value: 1 },
          { name: '贵州芦笙舞', expert: '杨花', group: '民族舞蹈', province: '贵州', city: '贵阳市', district: '南明区', fullAddress: '贵州 贵阳市 南明区', value: 1 },
          { name: '广西山歌', expert: '刘三姐', group: '民族音乐', province: '广西', city: '南宁市', district: '青秀区', fullAddress: '广西 南宁市 青秀区', value: 1 },
          { name: '江苏武术', expert: '王师傅', group: '传统武术', province: '江苏', city: '南京市', district: '玄武区', fullAddress: '江苏 南京市 玄武区', value: 1 },
          { name: '四川变脸', expert: '陈大师', group: '民间艺术', province: '四川', city: '成都市', district: '锦江区', fullAddress: '四川 成都市 锦江区', value: 1 },
          { name: '新疆舞蹈', expert: '古丽', group: '民族舞蹈', province: '新疆', city: '喀什地区', district: '喀什市', fullAddress: '新疆 喀什地区 喀什市', value: 1 },
          { name: '西藏唐卡', expert: '次仁', group: '民间艺术', province: '西藏', city: '日喀则市', district: '桑珠孜区', fullAddress: '西藏 日喀则市 桑珠孜区', value: 1 }
        ]
        
        // 合并真实数据和示例数据
        ipLocationData.value = [...ipsWithLocation, ...sampleData]
      }
      
      // 统计数据
      mapStats.totalProjects = ipLocationData.value.length
      mapStats.provinceCount = new Set(ipLocationData.value.map(item => item.province)).size
      mapStats.cityCount = new Set(ipLocationData.value.map(item => item.city)).size
      
      // 省份分布统计
      mapStats.regionDistribution = {}
      ipLocationData.value.forEach(item => {
        mapStats.regionDistribution[item.province] = (mapStats.regionDistribution[item.province] || 0) + 1
      })
      
      console.log('✅ IP地址数据加载完成')
      console.log('📊 统计信息:', mapStats)
      console.log('📍 项目分布:', ipLocationData.value.slice(0, 5), '...')
      
      return ipLocationData.value
    } else {
      console.log('⚠️ 暂无IP地址数据，使用默认示例数据')
      
      // 如果没有任何数据，使用完整的示例数据集
      const defaultData = [
        { name: '新疆马术', expert: '阿里木', group: '传统体育', province: '新疆', city: '乌鲁木齐市', district: '天山区', fullAddress: '新疆 乌鲁木齐市 天山区', value: 1 },
        { name: '西藏牦牛竞技', expert: '扎西', group: '民族体育', province: '西藏', city: '拉萨市', district: '城关区', fullAddress: '西藏 拉萨市 城关区', value: 1 },
        { name: '内蒙古摔跤', expert: '巴图', group: '竞技体育', province: '内蒙古', city: '呼和浩特市', district: '新城区', fullAddress: '内蒙古 呼和浩特市 新城区', value: 1 },
        { name: '云南龙舟', expert: '李明', group: '水上运动', province: '云南', city: '昆明市', district: '五华区', fullAddress: '云南 昆明市 五华区', value: 1 },
        { name: '贵州芦笙舞', expert: '杨花', group: '民族舞蹈', province: '贵州', city: '贵阳市', district: '南明区', fullAddress: '贵州 贵阳市 南明区', value: 1 },
        { name: '广西山歌', expert: '刘三姐', group: '民族音乐', province: '广西', city: '南宁市', district: '青秀区', fullAddress: '广西 南宁市 青秀区', value: 1 },
        { name: '江苏武术', expert: '王师傅', group: '传统武术', province: '江苏', city: '南京市', district: '玄武区', fullAddress: '江苏 南京市 玄武区', value: 1 },
        { name: '四川变脸', expert: '陈大师', group: '民间艺术', province: '四川', city: '成都市', district: '锦江区', fullAddress: '四川 成都市 锦江区', value: 1 },
        { name: '新疆舞蹈', expert: '古丽', group: '民族舞蹈', province: '新疆', city: '喀什地区', district: '喀什市', fullAddress: '新疆 喀什地区 喀什市', value: 1 },
        { name: '西藏唐卡', expert: '次仁', group: '民间艺术', province: '西藏', city: '日喀则市', district: '桑珠孜区', fullAddress: '西藏 日喀则市 桑珠孜区', value: 1 },
        { name: '北京太极', expert: '张大师', group: '传统武术', province: '北京', city: '东城区', district: '王府井街道', fullAddress: '北京 东城区 王府井街道', value: 1 },
        { name: '上海龙狮', expert: '李师父', group: '民俗表演', province: '上海', city: '黄浦区', district: '南京东路街道', fullAddress: '上海 黄浦区 南京东路街道', value: 1 },
        { name: '广东武术', expert: '黄飞鸿', group: '传统武术', province: '广东', city: '广州市', district: '越秀区', fullAddress: '广东 广州市 越秀区', value: 1 },
        { name: '山东杂技', expert: '吴大师', group: '民间艺术', province: '山东', city: '济南市', district: '历下区', fullAddress: '山东 济南市 历下区', value: 1 },
        { name: '河北杂技', expert: '赵师傅', group: '民间艺术', province: '河北', city: '石家庄市', district: '长安区', fullAddress: '河北 石家庄市 长安区', value: 1 }
      ]
      
      ipLocationData.value = defaultData
      
      // 统计数据
      mapStats.totalProjects = defaultData.length
      mapStats.provinceCount = new Set(defaultData.map(item => item.province)).size
      mapStats.cityCount = new Set(defaultData.map(item => item.city)).size
      
      // 省份分布统计
      mapStats.regionDistribution = {}
      defaultData.forEach(item => {
        mapStats.regionDistribution[item.province] = (mapStats.regionDistribution[item.province] || 0) + 1
      })
      
      console.log('📊 使用示例数据统计:', mapStats)
      return defaultData
    }
  } catch (error) {
    console.error('❌ 加载IP地址数据失败:', error)
    // 即使出错也提供基础示例数据
    const errorFallbackData = [
      { name: '示例项目1', expert: '示例专家1', group: '示例组别', province: '新疆', city: '乌鲁木齐市', district: '', fullAddress: '新疆 乌鲁木齐市', value: 1 },
      { name: '示例项目2', expert: '示例专家2', group: '示例组别', province: '西藏', city: '拉萨市', district: '', fullAddress: '西藏 拉萨市', value: 1 },
      { name: '示例项目3', expert: '示例专家3', group: '示例组别', province: '内蒙古', city: '呼和浩特市', district: '', fullAddress: '内蒙古 呼和浩特市', value: 1 }
    ]
    
    ipLocationData.value = errorFallbackData
    mapStats.totalProjects = errorFallbackData.length
    mapStats.provinceCount = 3
    mapStats.cityCount = 3
    mapStats.regionDistribution = { '新疆': 1, '西藏': 1, '内蒙古': 1 }
    
    return errorFallbackData
  }
}

// 初始化项目类型分布图
const initTypeChart = () => {
  const chartElement = document.getElementById('typeChart')
  if (!chartElement) return

  typeChart = echarts.init(chartElement)

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 20, 40, 0.9)',
      borderColor: '#00d4ff',
      textStyle: { color: '#fff' }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
      textStyle: { color: '#fff', fontSize: 10 }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: [
          { value: 35, name: '传统武术' },
          { value: 28, name: '民族舞蹈' },
          { value: 22, name: '竞技运动' },
          { value: 15, name: '其他项目' }
        ],
        itemStyle: {
          borderRadius: 5,
          borderColor: '#001830',
          borderWidth: 2
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 212, 255, 0.5)'
          }
        }
      }
    ]
  }

  typeChart.setOption(option)
}

// 初始化趋势图
const initTrendChart = () => {
  const chartElement = document.getElementById('trendChart')
  if (!chartElement) return

  trendChart = echarts.init(chartElement)

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

  trendChart.setOption(option)
}

// 创建粒子效果
const createParticles = () => {
  const container = document.querySelector('.particle-background') as HTMLElement
  if (!container) return

  // 清空现有粒子
  container.innerHTML = ''

  const particleCount = 50
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    
    // 随机位置
    particle.style.left = Math.random() * 100 + '%'
    particle.style.top = Math.random() * 100 + '%'
    
    // 随机动画延迟
    particle.style.animationDelay = Math.random() * 10 + 's'
    
    container.appendChild(particle)
  }
}

// 窗口大小改变时重新调整图表
const handleResize = () => {
  mapChart?.resize()
  typeChart?.resize()
  trendChart?.resize()
}

// 定时器
let timeInterval: number

onMounted(async () => {
  console.log('=== Dashboard组件开始初始化 ===')
  
  // 初始化时间
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  
  // 立即加载城市映射
  console.log('开始加载城市映射...')
  await loadCityMapping()
  console.log('城市映射加载完成，当前城市数量:', Object.keys(cityMap).length)
  
  // 加载IP地址数据并初始化图表
  setTimeout(async () => {
    console.log('开始初始化图表...')
    await initChinaMap() // 这个函数内部会加载IP数据
    initTypeChart()
    initTrendChart()
    createParticles()
    console.log('图表初始化完成')
  }, 100)
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  console.log('=== Dashboard组件初始化完成 ===')
})

onUnmounted(() => {
  // 清理定时器
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  
  // 销毁图表实例
  mapChart?.dispose()
  typeChart?.dispose()
  trendChart?.dispose()
  
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})

// 获取地图提示信息
const getMapTip = () => {
  if (currentMapLevel.value === 'china') {
    return '点击省份查看详细地图'
  } else if (currentMapLevel.value === 'province') {
    return '点击城市查看详细地图，或点击返回按钮'
  } else if (currentMapLevel.value === 'city') {
    return '点击区县查看详情，或点击返回按钮'
  }
  return '点击区域查看详情'
}

</script>

<style scoped>
.dashboard-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #001428 0%, #002b5c 50%, #001428 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
  padding: 20px;
  box-sizing: border-box;
}

/* 粒子背景效果 */
.particle-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.particle-background .particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(0, 212, 255, 0.6);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg);
    opacity: 0.3;
  }
  50% { 
    transform: translateY(-20px) rotate(180deg);
    opacity: 1;
  }
}

/* 顶部导航 */
.header-section {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 30px;
  z-index: 10;
  position: relative;
}

.header-left .main-title {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 10px 0;
  background: linear-gradient(45deg, #00d4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.time-display {
  font-size: 16px;
  color: #00d4ff;
  font-family: 'Courier New', monospace;
}

/* 主体内容 */
.main-content {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 30px;
  min-height: calc(100vh - 160px);
  z-index: 10;
  position: relative;
}

/* 左侧面板 */
.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-card {
  background: rgba(0, 32, 64, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.stat-icon {
  font-size: 24px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 212, 255, 0.2);
  border-radius: 50%;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #00ff88;
}

.stat-label {
  font-size: 14px;
  color: #ccc;
}

.ranking-card {
  background: rgba(0, 32, 64, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  flex: 1;
}

.ranking-card h3 {
  margin: 0 0 15px 0;
  color: #00d4ff;
  font-size: 16px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ranking-item {
  display: flex;
  align-items: center;
    gap: 10px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 212, 255, 0.1);
}

.rank-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

.rank-1 { background: #ffd700; color: #000; }
.rank-2 { background: #c0c0c0; color: #000; }
.rank-3 { background: #cd7f32; color: #fff; }
.rank-number:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #00d4ff;
  color: #fff;
}

.region-name {
  flex: 1;
  font-size: 14px;
}

.region-score {
  font-size: 14px;
  font-weight: bold;
  color: #00ff88;
}

/* 中央地图区域 */
.map-container {
  display: flex;
    flex-direction: column;
  background: rgba(0, 32, 64, 0.6);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  position: relative;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.map-title {
  font-size: 20px;
  font-weight: bold;
  color: #00d4ff;
}

.map-navigation {
  display: flex;
  align-items: center;
}

.map-breadcrumb {
  display: flex;
  align-items: center;
}

.breadcrumb-item {
  cursor: pointer;
  color: #00ff88;
  margin-right: 5px;
}

.breadcrumb-separator {
  margin: 0 5px;
}

.breadcrumb-item.current {
  font-weight: bold;
}

.back-btn {
  background: none;
  border: none;
  color: #00ff88;
  font-size: 14px;
  cursor: pointer;
}

.china-map {
  flex: 1;
  min-height: 500px;
  border-radius: 8px;
}

.map-tip {
  text-align: center;
  font-size: 14px;
  color: #ccc;
  margin-top: 20px;
}

/* 右侧面板 */
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.realtime-card, .chart-card {
  background: rgba(0, 32, 64, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.realtime-card h3, .chart-card h3 {
  margin: 0 0 15px 0;
  color: #00d4ff;
  font-size: 16px;
}

.data-stream {
  max-height: 200px;
  overflow-y: auto;
}

.stream-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

.stream-time {
  font-size: 12px;
  color: #00ff88;
  font-family: 'Courier New', monospace;
}

.stream-content {
    font-size: 13px;
  color: #ccc;
  margin-top: 2px;
}

.mini-chart {
  height: 150px;
}

/* 底部状态栏 */
.footer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 1px solid rgba(0, 212, 255, 0.2);
  font-size: 14px;
  z-index: 10;
  position: relative;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00ff88;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.footer-right {
  color: #ccc;
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .main-content {
    grid-template-columns: 250px 1fr 250px;
    gap: 20px;
  }
  
  .header-left .main-title {
    font-size: 24px;
  }
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 200px 1fr 200px;
  }
  
  .stat-card {
    padding: 15px;
  }
  
  .mini-chart {
    height: 120px;
  }
}

@media (max-width: 1000px) {
  .header-section {
    flex-direction: column;
    gap: 15px;
  align-items: center;
    text-align: center;
  }
  
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
  
  .left-panel, .right-panel {
    flex-direction: row;
    overflow-x: auto;
  }
  
  .stat-card, .chart-card {
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .dashboard-screen {
    padding: 15px;
  }
  
  .header-left .main-title {
    font-size: 20px;
  }
}
</style> 


