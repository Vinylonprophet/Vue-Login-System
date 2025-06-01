import { ref } from 'vue'

export class TimeService {
  public currentTime = ref('')
  public lastUpdateTime = ref('')
  private timeInterval: number | null = null

  // 更新时间
  private updateTime(): void {
    const now = new Date()
    this.currentTime.value = now.toLocaleTimeString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    this.lastUpdateTime.value = now.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 启动时间更新
  startTimeUpdate(): void {
    this.updateTime()
    this.timeInterval = setInterval(() => {
      this.updateTime()
    }, 1000)
  }

  // 停止时间更新
  stopTimeUpdate(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
      this.timeInterval = null
    }
  }

  // 获取格式化的当前时间
  getFormattedTime(): string {
    return this.currentTime.value
  }

  // 获取最后更新时间
  getLastUpdateTime(): string {
    return this.lastUpdateTime.value
  }
}

export const timeService = new TimeService() 