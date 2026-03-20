/**
 * 历史记录管理 Composable
 * 从 sdev2/js/core/history.js 迁移
 */

import { ref, computed } from 'vue'
import { useRunzangStorage, usePreferenceStorage } from './useStorage.js'
import { usePayment } from './usePayment.js'
import { SERVICE_NAMES } from '../config/services.js'

export function useHistory() {
  const runzangStorage = useRunzangStorage()
  const preferenceStorage = usePreferenceStorage()
  const payment = usePayment()
  
  const currentView = ref('main') // 'main' | 'history'
  const currentHistoryService = ref('测算验证')
  
  // 获取所有历史订单
  const allOrders = computed(() => {
    return runzangStorage.getPaidOrders()
  })
  
  // 按服务类型筛选订单
  const ordersByService = computed(() => {
    return (serviceName) => {
      return allOrders.value.filter(o => o.serviceType === serviceName)
    }
  })
  
  // 检查是否有历史记录
  const hasHistory = computed(() => {
    return allOrders.value.length > 0
  })
  
  // 检查特定服务是否有历史记录
  const hasHistoryForService = computed(() => {
    return (serviceName) => {
      return allOrders.value.some(o => o.serviceType === serviceName)
    }
  })

  /**
   * 切换到历史记录视图
   * @param {string} serviceName - 服务名称
   */
  function showHistoryView(serviceName) {
    currentView.value = 'history'
    currentHistoryService.value = serviceName || '测算验证'
    
    // 更新 Hash
    window.location.hash = `#history-${serviceName || '测算验证'}`
  }

  /**
   * 切换到主视图
   */
  function showMainView() {
    currentView.value = 'main'
    window.location.hash = ''
  }

  /**
   * 从 Hash 恢复视图
   */
  function applyHashView() {
    const hash = window.location.hash
    if (!hash || hash === '#') {
      currentView.value = 'main'
      return
    }
    
    // 匹配 #history-服务名
    const match = hash.match(/#history-(.+)/)
    if (match) {
      const serviceName = match[1]
      if (SERVICE_NAMES.includes(serviceName)) {
        currentView.value = 'history'
        currentHistoryService.value = serviceName
        return
      }
    }
    
    currentView.value = 'main'
  }

  /**
   * 点击历史记录项，恢复订单
   * @param {string} serviceType - 服务类型
   * @param {string} orderId - 订单ID
   */
  async function restoreHistoryOrder(serviceType, orderId) {
    try {
      console.log('📂 恢复历史订单:', serviceType, orderId)
      
      // 使用 payment 的 restoreOrder 方法
      const success = await payment.restoreOrder(serviceType, orderId)
      
      if (success) {
        // 切换回主视图
        showMainView()
        
        // 滚动到结果区域
        setTimeout(() => {
          const resultEl = document.getElementById('result-section')
          if (resultEl) {
            resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
      } else {
        alert('恢复订单失败，请重试')
      }
    } catch (error) {
      console.error('恢复历史订单失败:', error)
      alert('恢复订单失败：' + error.message)
    }
  }

  /**
   * 删除历史记录
   * @param {string} serviceType - 服务类型
   * @param {string} orderId - 订单ID
   */
  function deleteHistoryOrder(serviceType, orderId) {
    if (!confirm('确定要删除这条历史记录吗？')) {
      return false
    }
    
    const success = runzangStorage.deleteOrder(serviceType, orderId)
    
    if (success) {
      console.log('✅ 已删除历史记录:', serviceType, orderId)
      
      // 强制刷新订单列表
      runzangStorage.getPaidOrders()
      
      return true
    } else {
      alert('删除失败，请重试')
      return false
    }
  }

  /**
   * 获取最后选择的服务
   */
  function getLastSelectedService() {
    return preferenceStorage.getLastSelectedService()
  }

  /**
   * 设置最后选择的服务
   * @param {string} serviceName - 服务名称
   */
  function setLastSelectedService(serviceName) {
    return preferenceStorage.setLastSelectedService(serviceName)
  }

  /**
   * 初始化历史记录系统
   */
  function initHistory() {
    // 从 Hash 恢复视图
    applyHashView()
    
    // 监听 Hash 变化
    window.addEventListener('hashchange', applyHashView)
  }

  /**
   * 清理函数
   */
  function cleanup() {
    window.removeEventListener('hashchange', applyHashView)
  }

  return {
    // 状态
    currentView,
    currentHistoryService,
    allOrders,
    hasHistory,
    
    // 计算属性
    ordersByService,
    hasHistoryForService,
    
    // 方法
    showHistoryView,
    showMainView,
    applyHashView,
    restoreHistoryOrder,
    deleteHistoryOrder,
    getLastSelectedService,
    setLastSelectedService,
    initHistory,
    cleanup
  }
}
