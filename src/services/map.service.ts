import * as echarts from 'echarts'
import { ref, reactive } from 'vue'

export interface MapStats {
  totalProjects: number
  provinceCount: number
  cityCount: number
  regionDistribution: Record<string, number>
}

export interface LocationData {
  id: string
  name: string
  province: string
  city: string
  district?: string
  expert: string
  group?: string
  originalProvince?: string
  fullAddress?: string
  value?: number
}

export class MapService {
  private mapChart: echarts.ECharts | null = null
  public currentMapLevel = ref('china')
  public currentMapName = ref('中国')
  public mapHistory = ref<string[]>([])
  public mapStats = reactive<MapStats>({
    totalProjects: 0,
    provinceCount: 0,
    cityCount: 0,
    regionDistribution: {}
  })
  public ipLocationData = ref<LocationData[]>([])

  // 省份名称到拼音的映射
  private provinces: Record<string, string> = {
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

  private cityMap: Record<string, string> = {}

  // 标准化省份名称
  private normalizeProvinceName(provinceName: string): string {
    if (!provinceName) return ''
    
    let normalized = provinceName
      .replace(/省$/, '')
      .replace(/市$/, '')
      .replace(/自治区$/, '')
      .replace(/特别行政区$/, '')
      .replace(/维吾尔自治区$/, '')
      .replace(/回族自治区$/, '')
      .replace(/壮族自治区$/, '')
    
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

  // 加载IP地址数据
  async loadIPLocationData(): Promise<LocationData[]> {
    try {
      console.log('🗂️ 加载IP地址数据...')
      const { ipApi } = await import('../utils/api')
      const response = await ipApi.getAllIPs()
      
      if (response.data && Array.isArray(response.data)) {
        // 过滤有地址信息的IP，并标准化省份名称
        const ipsWithLocation = response.data
          .filter((ip: any) => ip.province && ip.city)
          .map((ip: any) => {
            const normalizedProvince = this.normalizeProvinceName(ip.province)
            console.log(`📍 数据处理: ${ip.project_name} - 原始省份: "${ip.province}" -> 标准化: "${normalizedProvince}"`)
            
            return {
              id: ip.id,
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
        
        if (ipsWithLocation.length > 0) {
          console.log('📊 省份分布预览:', ipsWithLocation.map(ip => `${ip.name}(${ip.province})`).slice(0, 5))
          this.ipLocationData.value = ipsWithLocation
        } else {
          console.log('⚠️ 数据库中没有包含地址信息的项目数据')
          this.ipLocationData.value = []
        }
        
        // 计算统计信息
        this.calculateMapStats()
        
        console.log('✅ IP地址数据加载完成')
        console.log('📊 统计信息:', this.mapStats)
        
        return this.ipLocationData.value
      } else {
        console.log('⚠️ 数据库中暂无IP数据')
        
        // 不使用示例数据，保持空状态
        this.ipLocationData.value = []
        
        // 统计数据全部为0
        this.mapStats.totalProjects = 0
        this.mapStats.provinceCount = 0
        this.mapStats.cityCount = 0
        this.mapStats.regionDistribution = {}
        
        console.log('📊 数据库无数据，统计信息归零')
        return []
      }
    } catch (error) {
      console.error('❌ 加载IP地址数据失败:', error)
      
      // 出错时也不使用示例数据
      this.ipLocationData.value = []
      this.mapStats.totalProjects = 0
      this.mapStats.provinceCount = 0
      this.mapStats.cityCount = 0
      this.mapStats.regionDistribution = {}
      
      console.log('❌ 数据加载失败，统计信息归零')
      return []
    }
  }

  // 计算地图统计信息
  private calculateMapStats(): void {
    const regionDistribution: Record<string, number> = {}
    
    this.ipLocationData.value.forEach(item => {
      if (item.province) {
        regionDistribution[item.province] = (regionDistribution[item.province] || 0) + 1
      }
    })

    const provinces = [...new Set(this.ipLocationData.value.map(item => item.province).filter(Boolean))]
    const cities = [...new Set(this.ipLocationData.value.map(item => item.city).filter(Boolean))]

    this.mapStats.totalProjects = this.ipLocationData.value.length
    this.mapStats.provinceCount = provinces.length
    this.mapStats.cityCount = cities.length
    this.mapStats.regionDistribution = regionDistribution
  }

  // 根据项目数量生成热力图颜色
  getHeatColor(count: number): string {
    if (count === 0) return '#2c3e50'
    
    const maxCount = Math.max(...Object.values(this.mapStats.regionDistribution), 1)
    const ratio = count / maxCount
    
    if (ratio >= 1.0) return '#d32f2f'
    if (ratio >= 0.8) return '#f44336'
    if (ratio >= 0.6) return '#ff9800'
    if (ratio >= 0.4) return '#ffc107'
    if (ratio >= 0.2) return '#4caf50'
    if (ratio > 0) return '#2196f3'
    return '#2c3e50'
  }

  // 初始化地图实例
  initMapChart(container: HTMLElement): void {
    this.mapChart = echarts.init(container)
  }

  // 初始化中国地图
  async initChinaMap(): Promise<void> {
    if (!this.mapChart) return

    try {
      await this.loadIPLocationData()
      
      // 加载城市映射关系
      await this.loadCityMapping()
      
      const response = await fetch('/map/china.json')
      const mapData = await response.json()
      
      echarts.registerMap('china', mapData)

      const chinaData = mapData.features.map((feature: any) => {
        const provinceName = feature.properties.name
        const projectCount = this.mapStats.regionDistribution[provinceName] || 0
        
        return {
          name: provinceName,
          value: projectCount,
          itemStyle: {
            areaColor: this.getHeatColor(projectCount),
            borderColor: '#ffffff',
            borderWidth: 1,
            opacity: 0.9
          }
        }
      })

      this.currentMapLevel.value = 'china'
      this.currentMapName.value = '中国'
      this.mapHistory.value = []

      const option = this.createMapOption('china', chinaData)
      this.mapChart.setOption(option)

      this.bindMapClickEvents()

    } catch (error) {
      console.error('初始化中国地图失败:', error)
    }
  }

  // 创建地图配置选项
  private createMapOption(mapType: string, data: any[]): any {
    return {
      backgroundColor: 'transparent',
      title: { show: false },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => this.createTooltipContent(params),
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: { color: '#333' }
      },
      visualMap: {
        min: 0,
        max: Math.max(...Object.values(this.mapStats.regionDistribution), 5),
        left: 'left',
        top: 'bottom',
        text: ['项目多', '项目少'],
        textStyle: { color: '#fff', fontSize: 12 },
        inRange: {
          color: ['#2c3e50', '#2196f3', '#4caf50', '#ffc107', '#ff9800', '#f44336', '#d32f2f']
        },
        show: true,
        itemWidth: 20,
        itemHeight: 140,
        calculable: true,
        realtime: false,
        formatter: (value: number) => Math.round(value) + '个'
      },
      series: [{
        name: '中国',
        type: 'map',
        map: 'china',
        data: data,
        roam: true,
        zoom: 1.1,
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
      }]
    }
  }

  // 创建tooltip内容
  private createTooltipContent(params: any): string {
    const data = params.data || {}
    const projectCount = data.value || 0
    
    if (projectCount > 0) {
      const provinceProjects = this.ipLocationData.value.filter(item => item.province === params.name)
      let projectList = provinceProjects.slice(0, 3).map(p => `• ${p.name} (${p.expert})`).join('<br/>')
      if (provinceProjects.length > 3) {
        projectList += `<br/>还有 ${provinceProjects.length - 3} 个项目...`
      }
      
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
  }

  // 绑定地图点击事件
  private bindMapClickEvents(): void {
    if (!this.mapChart) return

    this.mapChart.off('click')
    this.mapChart.on('click', (params) => {
      if (params.name && this.provinces[params.name]) {
        this.loadProvinceMap(params.name)
      }
    })
  }

  // 加载省份地图
  async loadProvinceMap(provinceName: string): Promise<void> {
    try {
      console.log('🗺️ 加载省份地图:', provinceName)
      const provinceCode = this.provinces[provinceName]
      const response = await fetch(`/map/province/${provinceCode}.json`)
      const mapData = await response.json()
      
      // 注册省份地图
      echarts.registerMap(provinceName, mapData)
      
      // 获取该省份的项目数据
      const provinceProjects = this.ipLocationData.value.filter(item => item.province === provinceName)
      console.log(`📊 ${provinceName}省份项目数据:`, provinceProjects)
      
      // 计算各城市的项目分布
      const cityDistribution: Record<string, number> = {}
      provinceProjects.forEach(project => {
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
        
        return {
          name: cityName,
          value: projectCount,
          itemStyle: {
            areaColor: this.getHeatColor(projectCount),
            borderColor: '#ffffff',
            borderWidth: 1,
            opacity: 0.9
          }
        }
      })

      // 更新导航历史 - 只在从全国进入时添加
      if (this.currentMapLevel.value === 'china') {
        this.mapHistory.value.push('中国')
      }
      this.currentMapLevel.value = 'province'
      this.currentMapName.value = provinceName

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
      if (!this.mapChart) return
      
      const option = this.createProvinceMapOption(provinceName, provinceData, provinceProjects, maxCityProjects, zoom, centerLon, centerLat)
      this.mapChart.setOption(option)

      // 重新绑定点击事件
      this.bindProvinceMapEvents(provinceName)
      
      console.log('✅ 省份地图加载完成:', provinceName)

    } catch (error) {
      console.error('加载省份地图失败:', error)
      alert(`无法加载 ${provinceName} 的地图数据，请检查地图文件是否存在`)
    }
  }

  // 创建省份地图配置选项
  private createProvinceMapOption(provinceName: string, data: any[], provinceProjects: LocationData[], maxCityProjects: number, zoom: number, centerLon: number, centerLat: number): any {
    return {
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
        formatter: (params: any) => this.createCityTooltipContent(params, provinceProjects),
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: { color: '#333' }
      },
      visualMap: {
        min: 0,
        max: maxCityProjects,
        left: 'left',
        top: 'bottom',
        text: ['项目多', '项目少'],
        textStyle: { color: '#fff', fontSize: 12 },
        inRange: {
          color: ['#2c3e50', '#2196f3', '#4caf50', '#ffc107', '#ff9800', '#f44336', '#d32f2f']
        },
        show: maxCityProjects > 0,
        itemWidth: 20,
        itemHeight: 120,
        calculable: true,
        realtime: false,
        formatter: (value: number) => Math.round(value) + '个'
      },
      series: [{
        name: provinceName,
        type: 'map',
        map: provinceName,
        data: data,
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
      }]
    }
  }

  // 创建城市tooltip内容
  private createCityTooltipContent(params: any, provinceProjects: LocationData[]): string {
    const data = params.data || {}
    const projectCount = data.value || 0
    
    if (projectCount > 0) {
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
  }

  // 绑定省份地图点击事件
  private bindProvinceMapEvents(provinceName: string): void {
    if (!this.mapChart) return

    this.mapChart.off('click')
    this.mapChart.on('click', (params) => {
      console.log('点击了市/县:', params.name, '当前省份:', provinceName)
      
      // 直辖市和特别行政区
      const specialRegions = ["北京", "天津", "上海", "重庆", "香港", "澳门"]
      
      if (specialRegions.includes(provinceName)) {
        console.log('直辖市，返回全国地图')
        this.initChinaMap()
      } else {
        // 尝试加载城市级地图或显示项目详情
        if (params.name && this.cityMap[params.name]) {
          console.log('找到城市映射，加载城市地图')
          this.loadCityMap(params.name, provinceName)
        } else {
          console.log(`${provinceName} - ${params.name} 暂无详细地图数据，显示项目详情`)
          this.showCityProjectDetails(params.name, provinceName)
        }
      }
    })
  }

  // 显示城市项目详情
  private showCityProjectDetails(cityName: string, provinceName: string): void {
    const cityProjects = this.ipLocationData.value.filter(item => {
      const cityBase = item.city.replace(/市$/, '').replace(/地区$/, '').replace(/州$/, '').replace(/盟$/, '')
      const paramBase = cityName.replace(/市$/, '').replace(/地区$/, '').replace(/州$/, '').replace(/盟$/, '')
      return (cityBase === paramBase || item.city === cityName) && item.province === provinceName
    })
    
    if (cityProjects.length > 0) {
      let projectDetails = `${provinceName} - ${cityName}\n\n共有 ${cityProjects.length} 个项目：\n\n`
      cityProjects.forEach((project, index) => {
        projectDetails += `${index + 1}. ${project.name}\n`
        projectDetails += `   专家：${project.expert}\n`
        if (project.group) {
          projectDetails += `   组别：${project.group}\n`
        }
        if (project.district) {
          projectDetails += `   地址：${project.fullAddress || project.originalProvince + ' ' + project.city + ' ' + project.district}\n`
        }
        projectDetails += '\n'
      })
      
      alert(projectDetails)
    } else {
      alert(`${provinceName} - ${cityName}\n\n该城市暂无项目数据`)
    }
  }

  // 加载城市映射关系
  async loadCityMapping(): Promise<void> {
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
    
    this.cityMap = { ...backupCityMap }
    console.log('✅ 备用城市映射加载完成，共', Object.keys(this.cityMap).length, '个城市')
    
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
      if (fullCityMap && Object.keys(fullCityMap).length > Object.keys(this.cityMap).length) {
        this.cityMap = fullCityMap
        console.log('🎉 完整城市映射加载成功！共', Object.keys(this.cityMap).length, '个城市')
        console.log('📋 包含的省份城市示例:')
        console.log('  - 西藏:', Object.keys(this.cityMap).filter(city => city.includes('拉萨') || city.includes('昌都')))
        console.log('  - 江苏:', Object.keys(this.cityMap).filter(city => city.includes('南京') || city.includes('苏州')))
        console.log('  - 广东:', Object.keys(this.cityMap).filter(city => city.includes('广州') || city.includes('深圳')))
      } else {
        console.log('⚠️ 无法加载完整映射，使用备用映射')
      }
      
    } catch (error: any) {
      console.log('❌ 从文件加载失败，使用备用映射:', error.message)
    }
    
    console.log('🏁 城市映射最终加载完成，共', Object.keys(this.cityMap).length, '个城市')
  }

  // 加载城市地图
  async loadCityMap(cityName: string, provinceName: string): Promise<void> {
    try {
      console.log('🏙️ 尝试加载城市地图:', cityName, '所属省份:', provinceName)
      
      // 检查城市映射是否存在
      if (!this.cityMap[cityName]) {
        console.log(`城市 ${cityName} 在映射表中不存在`)
        this.showCityProjectDetails(cityName, provinceName)
        return
      }
      
      const cityCode = this.cityMap[cityName]
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
      const cityProjects = this.ipLocationData.value.filter(item => {
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
      
      // 更新导航历史
      this.mapHistory.value.push(provinceName)
      this.currentMapLevel.value = 'city'
      this.currentMapName.value = cityName

      // 渲染城市地图
      this.renderCityMap(cityName, provinceName, mapData, cityProjects, districtDistribution)
      
      console.log('✅ 城市地图加载完成:', cityName)

    } catch (error) {
      console.error('加载城市地图失败:', error)
      alert(`无法加载 ${cityName} 的详细地图数据：${error}`)
    }
  }

  // 渲染城市地图
  private renderCityMap(cityName: string, provinceName: string, mapData: any, cityProjects: LocationData[], districtDistribution: Record<string, number>): void {
    if (!this.mapChart) return

    // 生成区县数据
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

    const option = this.createCityMapOption(cityName, provinceName, cityData, cityProjects, maxDistrictProjects, zoom, centerLon, centerLat)
    this.mapChart.setOption(option)

    // 绑定城市地图点击事件
    this.bindCityMapEvents(cityName, provinceName, cityProjects)
  }

  // 创建城市地图配置
  private createCityMapOption(cityName: string, provinceName: string, data: any[], cityProjects: LocationData[], maxDistrictProjects: number, zoom: number, centerLon: number, centerLat: number): any {
    return {
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
        formatter: (params: any) => this.createDistrictTooltipContent(params, cityProjects),
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#ccc',
        borderWidth: 1,
        textStyle: { color: '#333' }
      },
      visualMap: {
        min: 0,
        max: maxDistrictProjects,
        left: 'left',
        top: 'bottom',
        text: ['项目多', '项目少'],
        textStyle: { color: '#fff', fontSize: 12 },
        inRange: {
          color: ['#2c3e50', '#2196f3', '#4caf50', '#ffc107', '#ff9800', '#f44336', '#d32f2f']
        },
        show: maxDistrictProjects > 0,
        itemWidth: 20,
        itemHeight: 100,
        calculable: true,
        realtime: false,
        formatter: (value: number) => Math.round(value) + '个'
      },
      series: [{
        name: cityName,
        type: 'map',
        map: cityName,
        data: data,
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
      }]
    }
  }

  // 创建区县tooltip内容
  private createDistrictTooltipContent(params: any, cityProjects: LocationData[]): string {
    const data = params.data || {}
    const projectCount = data.value || 0
    
    if (projectCount > 0) {
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
  }

  // 绑定城市地图点击事件
  private bindCityMapEvents(cityName: string, provinceName: string, cityProjects: LocationData[]): void {
    if (!this.mapChart) return

    this.mapChart.off('click')
    this.mapChart.on('click', (params) => {
      console.log('点击了区/县:', params.name)
      this.showDistrictProjectDetails(params.name, cityName, provinceName, cityProjects)
    })
  }

  // 显示区县项目详情
  private showDistrictProjectDetails(districtName: string, cityName: string, provinceName: string, cityProjects: LocationData[]): void {
    const districtProjects = cityProjects.filter(item => {
      if (!item.district) return false
      const districtBase = item.district.replace(/区$/, '').replace(/县$/, '').replace(/街道$/, '')
      const paramBase = districtName.replace(/区$/, '').replace(/县$/, '').replace(/街道$/, '')
      return districtBase === paramBase || item.district === districtName
    })
    
    if (districtProjects.length > 0) {
      let projectDetails = `${provinceName} - ${cityName} - ${districtName}\n\n共有 ${districtProjects.length} 个项目：\n\n`
      districtProjects.forEach((project, index) => {
        projectDetails += `${index + 1}. ${project.name}\n`
        projectDetails += `   专家：${project.expert}\n`
        if (project.group) {
          projectDetails += `   组别：${project.group}\n`
        }
        projectDetails += `   地址：${project.fullAddress || project.originalProvince + ' ' + project.city + ' ' + project.district}\n\n`
      })
      
      alert(projectDetails)
    } else {
      alert(`${provinceName} - ${cityName} - ${districtName}\n\n该区县暂无项目数据`)
    }
  }

  // 返回上一级地图
  goBackMap(): void {
    if (this.mapHistory.value.length > 0) {
      if (this.currentMapLevel.value === 'city') {
        const provinceName = this.mapHistory.value[this.mapHistory.value.length - 1]
        this.mapHistory.value.pop()
        this.loadProvinceMap(provinceName)
      } else if (this.currentMapLevel.value === 'province') {
        this.mapHistory.value.pop()
        this.initChinaMap()
      }
    }
  }

  // 获取地图提示信息
  getMapTip(): string {
    if (this.currentMapLevel.value === 'china') {
      return '点击省份查看详细地图'
    } else if (this.currentMapLevel.value === 'province') {
      return '点击城市查看详细地图，或点击返回按钮'
    } else if (this.currentMapLevel.value === 'city') {
      return '点击区县查看详情，或点击返回按钮'
    }
    return '点击区域查看详情'
  }

  // 调整地图大小
  resize(): void {
    this.mapChart?.resize()
  }

  // 销毁地图
  dispose(): void {
    this.mapChart?.dispose()
    this.mapChart = null
  }
}

export const mapService = new MapService() 