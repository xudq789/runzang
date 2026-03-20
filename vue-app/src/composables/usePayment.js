/**
 * 支付管理 Composable
 * 从 sdev2/js/core/payment.js 完善迁移
 */

import { ref } from 'vue'
import { useAppStore } from '../stores/app.js'
import { useConfigStore } from '../stores/config.js'
import { useRunzangStorage, usePaymentStorage } from './useStorage.js'
import { getPaymentStatus, createPaymentOrder } from '../api/payment.js'
import { fetchAiResultContent, parseBaziData } from '../api/ai.js'

export function usePayment() {
  const app = useAppStore()
  const config = useConfigStore()
  const runzangStorage = useRunzangStorage()
  const paymentStorage = usePaymentStorage()
  
  const isChecking = ref(false)
  const pollInterval = ref(null)

  /**
   * 检查URL中的支付回调参数
   * @returns {string|null} 订单ID或null
   */
  function checkUrlCallback() {
    const params = new URLSearchParams(window.location.search)
    const paymentSuccess = params.get('payment_success')
    const orderId = params.get('order_id')
    const verified = params.get('verified')
    const amount = params.get('amount')
    
    if (paymentSuccess === 'true' && orderId && verified === 'true') {
      console.log('✅ 检测到后端已验证的支付成功参数:', { orderId, amount, verified })
      
      // 保存验证信息
      paymentStorage.setPaymentData({
        orderId,
        amount,
        verified: true,
        backendVerified: true,
        timestamp: new Date().toISOString()
      })
      
      console.log('支付验证信息已保存到 localStorage')
      
      // 清理URL参数
      cleanUrlParams()
      
      return orderId
    }
    
    // 检查其他可能的支付状态参数
    const paymentStatus = params.get('payment_status')
    if (paymentStatus === 'waiting' && orderId) {
      console.log('⏳ 检测到支付等待状态:', orderId)
      cleanUrlParams()
    }
    
    return null
  }

  /**
   * 清理URL参数
   */
  function cleanUrlParams() {
    try {
      if (window.history.replaceState) {
        const cleanUrl = window.location.pathname + window.location.hash
        window.history.replaceState({}, document.title, cleanUrl)
        console.log('URL参数已清理')
      }
    } catch (error) {
      console.log('URL清理失败:', error)
    }
  }

  /**
   * 验证并解锁内容
   * @param {string} orderId - 订单ID
   * @param {boolean} fromBackend - 是否来自后端回调
   * @returns {Promise<boolean>}
   */
  async function verifyAndUnlock(orderId, fromBackend = false) {
    try {
      if (fromBackend) {
        await unlockContent(orderId)
        return true
      }
      
      const ok = await getPaymentStatus(orderId)
      if (ok) {
        const data = paymentStorage.getPaymentData() || {}
        data.verified = true
        data.verifiedAt = new Date().toISOString()
        paymentStorage.setPaymentData(data)
        
        await unlockContent(orderId)
        return true
      }
      
      return false
    } catch (error) {
      console.error('验证和解锁失败:', error)
      return false
    }
  }

  /**
   * 解锁内容（通过请求获取）
   * @param {string} orderId - 订单ID
   */
  async function unlockContent(orderId) {
    try {
      console.log('🔓 开始解锁内容:', orderId)
      
      // 获取完整内容
      const full = await fetchAiResultContent(orderId)
      if (!full) {
        console.error('获取完整内容失败')
        return
      }
      
      // 使用内容解锁
      unlockWithContent(orderId, full)
    } catch (error) {
      console.error('解锁内容失败:', error)
      throw error
    }
  }

  /**
   * 使用已有内容解锁（不再请求接口）
   * @param {string} orderId - 订单ID
   * @param {string} content - 已获取的完整内容
   */
  function unlockWithContent(orderId, content) {
    console.log('🔓 使用已有内容解锁:', orderId)
    
    if (!content) {
      console.error('内容为空，无法解锁')
      return
    }
    
    // 更新 store
    app.currentOrderId = orderId
    app.fullAnalysisResult = content
    app.setPaymentUnlocked()
    
    // 解析八字数据
    const parsed = parseBaziData(content)
    if (parsed.userBazi) {
      app.baziData = parsed.userBazi
    }
    if (parsed.partnerBazi) {
      app.partnerBaziData = parsed.partnerBazi
    }
    
    // 保存到 RunzangStorage（如果有用户数据）
    if (app.userData) {
      runzangStorage.setResult(app.currentService, orderId, {
        content: content,
        userData: app.userData,
        partnerData: app.partnerData,
        createdAt: new Date().toISOString()
      })
      
      // 添加到已支付订单列表
      const summary = runzangStorage.userInputSummary(
        app.userData,
        app.partnerData,
        app.currentService
      )
      
      runzangStorage.addPaidOrder({
        orderId,
        serviceType: app.currentService,
        createdAt: new Date().toISOString(),
        userInputSummary: summary
      })
    }
    
    console.log('✅ 内容解锁成功')
  }

  /**
   * 初始化支付检查
   */
  async function initPaymentCheck() {
    if (isChecking.value) return
    isChecking.value = true
    
    try {
      console.log('🔍 初始化支付状态检查...')
      
      // 1. 检查后端回调
      const orderIdFromCallback = checkUrlCallback()
      if (orderIdFromCallback) {
        console.log('发现后端回调订单，立即解锁:', orderIdFromCallback)
        await verifyAndUnlock(orderIdFromCallback, true)
        return
      }
      
      // 2. 页面刷新时清除当前订单缓存
      // 用户需要通过点击历史记录来查看报告，而不是自动恢复
      runzangStorage.clearCurrentOrder()
      console.log('✅ 已清除当前订单缓存')
      
    } catch (error) {
      console.error('初始化支付检查失败:', error)
    } finally {
      isChecking.value = false
    }
  }

  /**
   * 开始支付
   * @returns {Promise<object>} 支付数据
   */
  async function openPayment() {
    try {
      const svc = config.getService(app.currentService)
      if (!svc || !app.currentOrderId) {
        throw new Error('请先完成分析并获取订单号')
      }
      
      // 检测设备类型
      const isMobile = /mobile|iphone|android/i.test(navigator.userAgent.toLowerCase())
      const method = isMobile ? 'alipay' : 'wechatpay'
      
      console.log('📱 检测到设备类型:', isMobile ? '移动端' : '桌面端', '使用支付方式:', method)
      
      // 创建支付订单
      const data = await createPaymentOrder({
        serviceType: app.currentService,
        amount: svc.price,
        frontendOrderId: app.currentOrderId,
        paymentMethod: method
      })
      
      // 保存支付数据到本地
      paymentStorage.setPaymentData({
        orderId: app.currentOrderId,
        serviceType: app.currentService,
        amount: svc.price,
        paymentMethod: method,
        timestamp: new Date().toISOString()
      })
      
      return { ...data, method }
    } catch (error) {
      console.error('创建支付订单失败:', error)
      throw error
    }
  }

  /**
   * 开始轮询支付状态
   * @param {string} orderId - 订单ID
   * @param {Function} onSuccess - 成功回调
   * @param {number} maxAttempts - 最大尝试次数
   */
  function startPaymentPolling(orderId, onSuccess, maxAttempts = 60) {
    stopPaymentPolling()
    
    let attempts = 0
    let errorCount = 0
    const maxErrors = 5 // 连续失败5次后停止轮询
    
    pollInterval.value = setInterval(async () => {
      attempts++
      
      try {
        const isPaid = await getPaymentStatus(orderId)
        errorCount = 0 // 重置错误计数
        
        if (isPaid) {
          console.log('✅ 支付成功')
          stopPaymentPolling()
          if (onSuccess) onSuccess()
        } else if (attempts >= maxAttempts) {
          console.log('⏰ 支付轮询超时')
          stopPaymentPolling()
        }
      } catch (error) {
        errorCount++
        console.error(`轮询支付状态失败 (${errorCount}/${maxErrors}):`, error)
        
        if (errorCount >= maxErrors) {
          console.error('❌ 连续多次请求失败，停止轮询')
          stopPaymentPolling()
        }
      }
    }, 3000) // 每3秒检查一次
  }

  /**
   * 停止轮询支付状态
   */
  function stopPaymentPolling() {
    if (pollInterval.value) {
      clearInterval(pollInterval.value)
      pollInterval.value = null
    }
  }

  /**
   * 恢复历史订单
   * @param {string} serviceType - 服务类型
   * @param {string} orderId - 订单ID
   */
  async function restoreOrder(serviceType, orderId) {
    try {
      console.log('📂 恢复历史订单:', serviceType, orderId)
      
      // 从存储中获取结果
      const result = runzangStorage.getResult(serviceType, orderId)
      if (!result) {
        console.error('未找到订单数据')
        return false
      }
      
      // 更新当前服务
      app.setService(serviceType)
      
      // 更新 store
      app.currentOrderId = orderId
      app.fullAnalysisResult = result.content
      app.userData = result.userData
      app.partnerData = result.partnerData
      app.setPaymentUnlocked()
      
      // 解析八字数据
      const parsed = parseBaziData(result.content)
      if (parsed.userBazi) {
        app.baziData = parsed.userBazi
      }
      if (parsed.partnerBazi) {
        app.partnerBaziData = parsed.partnerBazi
      }
      
      // 设置当前查看的订单
      runzangStorage.setCurrentOrder(serviceType, orderId)
      
      // 显示结果
      app.showResult = true
      
      console.log('✅ 订单恢复成功')
      return true
    } catch (error) {
      console.error('恢复订单失败:', error)
      return false
    }
  }

  return {
    isChecking,
    initPaymentCheck,
    verifyAndUnlock,
    unlockWithContent,
    openPayment,
    startPaymentPolling,
    stopPaymentPolling,
    restoreOrder,
    getPaymentStatus
  }
}
