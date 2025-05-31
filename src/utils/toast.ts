import { showToast, showLoadingToast, closeToast } from 'vant'

export class ToastManager {
  private static loadingInstance: any = null

  // 成功提示
  static success(message: string, duration: number = 3000) {
    showToast({
      message,
      type: 'success',
      duration,
      position: 'middle'
    })
  }

  // 失败提示
  static fail(message: string, duration: number = 3000) {
    showToast({
      message,
      type: 'fail',
      duration,
      position: 'middle'
    })
  }

  // 警告提示
  static warning(message: string, duration: number = 3000) {
    showToast({
      message,
      duration,
      position: 'middle',
      type: 'text',
      className: 'warning-toast'
    })
  }

  // 普通提示
  static info(message: string, duration: number = 3000) {
    showToast({
      message,
      duration,
      position: 'middle',
      type: 'text'
    })
  }

  // 显示加载中
  static loading(message: string = '加载中...') {
    if (this.loadingInstance) {
      closeToast()
    }
    this.loadingInstance = showLoadingToast({
      message,
      forbidClick: true,
      duration: 0 // 不自动关闭
    })
    return this.loadingInstance
  }

  // 关闭加载
  static hideLoading() {
    if (this.loadingInstance) {
      closeToast()
      this.loadingInstance = null
    }
  }

  // 带延迟的数据加载效果 - 不显示loading toast
  static async withLoading<T>(
    asyncFn: () => Promise<T>, 
    options: {
      loadingMessage?: string
      successMessage?: string
      errorMessage?: string
      minDelay?: number // 最小延迟时间，让用户看到加载过程
    } = {}
  ): Promise<T> {
    const {
      successMessage,
      errorMessage,
      minDelay = 800 // 默认最小延迟800ms
    } = options

    try {
      // 并行执行异步操作和最小延迟
      const [result] = await Promise.all([
        asyncFn(),
        new Promise(resolve => setTimeout(resolve, minDelay))
      ])

      // 显示成功消息
      if (successMessage) {
        this.success(successMessage)
      }

      return result
    } catch (error) {
      // 显示错误消息
      const finalErrorMessage = errorMessage || 
        (error instanceof Error ? error.message : '操作失败')
      this.fail(finalErrorMessage)
      
      throw error
    }
  }

  // 专门用于全面分析的方法 - 加载动画随机显示10-20秒
  static async withAnalysis<T>(
    asyncFn: () => Promise<T>, 
    options: {
      successMessage?: string
      errorMessage?: string
      minDelay?: number // 最小延迟时间，默认随机10-20秒
      maxDelay?: number // 最大延迟时间
    } = {}
  ): Promise<T> {
    const {
      successMessage,
      errorMessage,
      minDelay = 1000, // 默认最小10秒
      maxDelay = 2000   // 默认最大20秒
    } = options

    try {
      // 生成10-20秒之间的随机延迟时间
      const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay
      
      // 记录开始时间
      const startTime = Date.now()
      
      // 执行异步操作
      const result = await asyncFn()
      
      // 计算已经过的时间
      const elapsedTime = Date.now() - startTime
      
      // 如果执行时间少于随机延迟时间，则等待剩余时间
      if (elapsedTime < randomDelay) {
        const remainingTime = randomDelay - elapsedTime
        console.log(`分析完成，继续等待 ${remainingTime}ms 以达到预期的加载时间 ${randomDelay}ms`)
        await new Promise(resolve => setTimeout(resolve, remainingTime))
      }

      // 显示成功消息
      if (successMessage) {
        this.success(successMessage, 4000) // 成功消息显示4秒
      }

      return result
    } catch (error) {
      // 显示错误消息
      const finalErrorMessage = errorMessage || 
        (error instanceof Error ? error.message : '分析失败')
      this.fail(finalErrorMessage)
      
      throw error
    }
  }
}

// 导出便捷方法
export const toast = ToastManager 