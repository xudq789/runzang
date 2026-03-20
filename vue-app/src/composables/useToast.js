/**
 * Toast 通知 Composable
 * 提供全局 Toast 通知功能
 */

import { ref } from 'vue'

// 全局 Toast 实例引用
const toastInstance = ref(null)

/**
 * 设置 Toast 实例
 * 在 App.vue 中调用
 */
export function setToastInstance(instance) {
  toastInstance.value = instance
}

/**
 * 使用 Toast
 */
export function useToast() {
  /**
   * 显示 Toast 通知
   */
  const show = (options) => {
    if (!toastInstance.value) {
      console.warn('Toast instance not initialized')
      // 降级到 alert
      alert(options.message || options)
      return
    }
    
    // 支持字符串参数
    if (typeof options === 'string') {
      return toastInstance.value.show({ message: options })
    }
    
    return toastInstance.value.show(options)
  }

  /**
   * 显示成功消息
   */
  const success = (message, title = '') => {
    if (!toastInstance.value) {
      alert(message)
      return
    }
    return toastInstance.value.success(message, title)
  }

  /**
   * 显示错误消息
   */
  const error = (message, title = '') => {
    if (!toastInstance.value) {
      alert(message)
      return
    }
    return toastInstance.value.error(message, title)
  }

  /**
   * 显示警告消息
   */
  const warning = (message, title = '') => {
    if (!toastInstance.value) {
      alert(message)
      return
    }
    return toastInstance.value.warning(message, title)
  }

  /**
   * 显示信息消息
   */
  const info = (message, title = '') => {
    if (!toastInstance.value) {
      alert(message)
      return
    }
    return toastInstance.value.info(message, title)
  }

  /**
   * 清空所有 Toast
   */
  const clear = () => {
    if (toastInstance.value) {
      toastInstance.value.clear()
    }
  }

  return {
    show,
    success,
    error,
    warning,
    info,
    clear
  }
}
