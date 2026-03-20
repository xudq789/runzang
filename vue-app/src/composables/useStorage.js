/**
 * 统一存储管理 Composable
 * 从 sdev2/js/core/storage.js 迁移
 * 提供响应式的 localStorage 操作封装
 */

import { ref, computed } from 'vue'

// ============ 【存储键常量】 ============
const STORAGE_KEYS = {
  // 支付相关
  PAYMENT_DATA: 'alipay_payment_data',
  PAID_ORDER_ID: 'paid_order_id',
  
  // 分析结果相关（旧版兼容）
  LAST_ANALYSIS_RESULT: 'last_analysis_result',
  LAST_ANALYSIS_SERVICE: 'last_analysis_service',
  LAST_USER_DATA: 'last_user_data',
  LAST_PARTNER_DATA: 'last_partner_data',
  LAST_ORDER_ID: 'last_order_id',
  LAST_SELECTED_SERVICE: 'last_selected_service',
  
  // Runzang 存储前缀
  RUNZANG_PREFIX: 'runzang_'
}

// ============ 【基础存储操作】 ============
const Storage = {
  /**
   * 安全地设置 localStorage 值
   */
  set(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(key, serialized)
      return true
    } catch (error) {
      console.warn(`Storage.set failed for key "${key}":`, error)
      return false
    }
  },
  
  /**
   * 安全地获取 localStorage 值
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue
      try {
        return JSON.parse(item)
      } catch {
        return item // 如果不是 JSON，返回原始字符串
      }
    } catch (error) {
      console.warn(`Storage.get failed for key "${key}":`, error)
      return defaultValue
    }
  },
  
  /**
   * 安全地删除 localStorage 值
   */
  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Storage.remove failed for key "${key}":`, error)
      return false
    }
  },
  
  /**
   * 检查 localStorage 中是否存在某个键
   */
  has(key) {
    return localStorage.getItem(key) !== null
  }
}

// ============ 【支付数据存储 Composable】 ============
export function usePaymentStorage() {
  const paymentData = ref(null)
  const paidOrderId = ref(null)
  
  // 获取支付数据
  const getPaymentData = () => {
    paymentData.value = Storage.get(STORAGE_KEYS.PAYMENT_DATA, null)
    return paymentData.value
  }
  
  // 设置支付数据
  const setPaymentData = (data) => {
    paymentData.value = data
    return Storage.set(STORAGE_KEYS.PAYMENT_DATA, data)
  }
  
  // 清除支付数据
  const clearPaymentData = () => {
    paymentData.value = null
    return Storage.remove(STORAGE_KEYS.PAYMENT_DATA)
  }
  
  // 获取已支付的订单ID
  const getPaidOrderId = () => {
    paidOrderId.value = Storage.get(STORAGE_KEYS.PAID_ORDER_ID, null)
    return paidOrderId.value
  }
  
  // 设置已支付的订单ID
  const setPaidOrderId = (orderId) => {
    paidOrderId.value = orderId
    return Storage.set(STORAGE_KEYS.PAID_ORDER_ID, orderId)
  }
  
  return {
    paymentData,
    paidOrderId,
    getPaymentData,
    setPaymentData,
    clearPaymentData,
    getPaidOrderId,
    setPaidOrderId
  }
}

// ============ 【Runzang 存储 Composable】 ============
export function useRunzangStorage() {
  const PREFIX = STORAGE_KEYS.RUNZANG_PREFIX
  const currentOrder = ref(null)
  const paidOrders = ref([])
  
  /**
   * 生成结果存储键
   */
  const resultKey = (serviceType, orderId) => {
    return PREFIX + 'result_' + serviceType + '_' + orderId
  }
  
  /**
   * 获取当前查看的订单
   */
  const getCurrentOrder = () => {
    currentOrder.value = Storage.get(PREFIX + 'current', null)
    return currentOrder.value
  }
  
  /**
   * 设置当前查看的订单
   */
  const setCurrentOrder = (serviceType, orderId) => {
    currentOrder.value = { serviceType, orderId }
    return Storage.set(PREFIX + 'current', { serviceType, orderId })
  }
  
  /**
   * 清除当前订单
   */
  const clearCurrentOrder = () => {
    currentOrder.value = null
    return Storage.remove(PREFIX + 'current')
  }
  
  /**
   * 获取分析结果
   */
  const getResult = (serviceType, orderId) => {
    return Storage.get(resultKey(serviceType, orderId), null)
  }
  
  /**
   * 设置分析结果
   */
  const setResult = (serviceType, orderId, data) => {
    const payload = {
      content: data.content,
      userData: data.userData || {},
      partnerData: data.partnerData || null,
      createdAt: data.createdAt || new Date().toISOString()
    }
    return Storage.set(resultKey(serviceType, orderId), payload)
  }
  
  /**
   * 获取已支付订单列表
   */
  const getPaidOrders = () => {
    paidOrders.value = Storage.get(PREFIX + 'paid_orders', [])
    return paidOrders.value
  }
  
  /**
   * 添加已支付订单
   */
  const addPaidOrder = (entry) => {
    const list = getPaidOrders()
    // 检查是否已存在
    if (list.some(o => o.orderId === entry.orderId && o.serviceType === entry.serviceType)) {
      return
    }
    list.unshift({
      orderId: entry.orderId,
      serviceType: entry.serviceType,
      createdAt: entry.createdAt || new Date().toISOString(),
      userInputSummary: entry.userInputSummary || ''
    })
    // 只保留最近200条
    paidOrders.value = list.slice(0, 200)
    return Storage.set(PREFIX + 'paid_orders', paidOrders.value)
  }
  
  /**
   * 生成用户输入摘要
   */
  const userInputSummary = (userData, partnerData, serviceType) => {
    if (!userData) return ''
    let s = `${userData.name || ''} ${userData.gender === 'male' ? '男' : userData.gender === 'female' ? '女' : ''} ${userData.birthYear || ''}-${userData.birthMonth || ''}-${userData.birthDay || ''} ${userData.birthCity || ''}`.trim()
    if (serviceType === '八字合婚' && partnerData) {
      s += ' | 伴侣: ' + `${partnerData.partnerName || ''} ${partnerData.partnerGender === 'male' ? '男' : partnerData.partnerGender === 'female' ? '女' : ''}`.trim()
    }
    return s || '—'
  }
  
  /**
   * 删除指定订单的所有数据
   */
  const deleteOrder = (serviceType, orderId) => {
    try {
      // 1. 删除分析结果数据
      Storage.remove(resultKey(serviceType, orderId))
      
      // 2. 从已支付订单列表中移除
      const list = getPaidOrders()
      const filtered = list.filter(o => !(o.orderId === orderId && o.serviceType === serviceType))
      Storage.set(PREFIX + 'paid_orders', filtered)
      paidOrders.value = filtered
      
      // 3. 如果删除的是当前订单，清除当前订单缓存
      const current = getCurrentOrder()
      if (current && current.orderId === orderId && current.serviceType === serviceType) {
        clearCurrentOrder()
      }
      
      console.log('✅ 已删除订单:', serviceType, orderId)
      return true
    } catch (error) {
      console.error('❌ 删除订单失败:', error)
      return false
    }
  }
  
  return {
    currentOrder,
    paidOrders,
    getCurrentOrder,
    setCurrentOrder,
    clearCurrentOrder,
    getResult,
    setResult,
    getPaidOrders,
    addPaidOrder,
    userInputSummary,
    deleteOrder
  }
}

// ============ 【用户偏好设置存储 Composable】 ============
export function usePreferenceStorage() {
  const lastSelectedService = ref(null)
  
  const getLastSelectedService = () => {
    lastSelectedService.value = Storage.get(STORAGE_KEYS.LAST_SELECTED_SERVICE, null)
    return lastSelectedService.value
  }
  
  const setLastSelectedService = (serviceName) => {
    lastSelectedService.value = serviceName
    return Storage.set(STORAGE_KEYS.LAST_SELECTED_SERVICE, serviceName)
  }
  
  return {
    lastSelectedService,
    getLastSelectedService,
    setLastSelectedService
  }
}

// ============ 【分析结果存储（旧版兼容）Composable】 ============
export function useAnalysisStorage() {
  // 获取/设置上次分析结果
  const getLastAnalysisResult = () => Storage.get(STORAGE_KEYS.LAST_ANALYSIS_RESULT, null)
  const setLastAnalysisResult = (content) => Storage.set(STORAGE_KEYS.LAST_ANALYSIS_RESULT, content)
  
  // 获取/设置上次分析服务
  const getLastAnalysisService = () => Storage.get(STORAGE_KEYS.LAST_ANALYSIS_SERVICE, null)
  const setLastAnalysisService = (service) => Storage.set(STORAGE_KEYS.LAST_ANALYSIS_SERVICE, service)
  
  // 获取/设置上次用户数据
  const getLastUserData = () => Storage.get(STORAGE_KEYS.LAST_USER_DATA, null)
  const setLastUserData = (userData) => Storage.set(STORAGE_KEYS.LAST_USER_DATA, userData)
  
  // 获取/设置上次伴侣数据
  const getLastPartnerData = () => Storage.get(STORAGE_KEYS.LAST_PARTNER_DATA, null)
  const setLastPartnerData = (partnerData) => Storage.set(STORAGE_KEYS.LAST_PARTNER_DATA, partnerData)
  
  // 获取/设置上次订单ID
  const getLastOrderId = () => Storage.get(STORAGE_KEYS.LAST_ORDER_ID, null)
  const setLastOrderId = (orderId) => Storage.set(STORAGE_KEYS.LAST_ORDER_ID, orderId)
  
  return {
    getLastAnalysisResult,
    setLastAnalysisResult,
    getLastAnalysisService,
    setLastAnalysisService,
    getLastUserData,
    setLastUserData,
    getLastPartnerData,
    setLastPartnerData,
    getLastOrderId,
    setLastOrderId
  }
}

// 导出基础 Storage 对象供直接使用
export { Storage, STORAGE_KEYS }
