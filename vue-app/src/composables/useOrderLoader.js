import { useAppStore } from '../stores/app.js'
import { API_BASE_URL } from '../config/services.js'

/**
 * 订单加载器 - 处理URL参数中的订单号并自动加载订单详情
 */
export function useOrderLoader() {
  const app = useAppStore()

  /**
   * 从 API 获取订单详情
   */
  async function fetchOrderDetails(orderId) {
    const url = `${API_BASE_URL}/api/payment/status/${orderId}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'runzang-payment-security-key-2025-1234567890'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * 解析八字数据
   */
  function parseBaziData(content) {
    if (!content) return { userBazi: null, partnerBazi: null }

    const result = {
      userBazi: null,
      partnerBazi: null
    }

    // 解析八字排盘
    const baziMatch = content.match(/【八字排盘】\s*年柱：([^\s]+)\s+([^\s]+)\s+月柱：([^\s]+)\s+([^\s]+)\s+日柱：([^\s]+)\s+([^\s]+)\s+时柱：([^\s]+)\s+([^\s]+)/);
    if (baziMatch) {
      result.userBazi = {
        yearColumn: baziMatch[1],
        yearElement: baziMatch[2],
        monthColumn: baziMatch[3],
        monthElement: baziMatch[4],
        dayColumn: baziMatch[5],
        dayElement: baziMatch[6],
        hourColumn: baziMatch[7],
        hourElement: baziMatch[8]
      }
    }

    // 解析伴侣八字（如果有）
    const partnerBaziMatch = content.match(/伴侣八字排盘】\s*年柱：([^\s]+)\s+([^\s]+)\s+月柱：([^\s]+)\s+([^\s]+)\s+日柱：([^\s]+)\s+([^\s]+)\s+时柱：([^\s]+)\s+([^\s]+)/);
    if (partnerBaziMatch) {
      result.partnerBazi = {
        yearColumn: partnerBaziMatch[1],
        yearElement: partnerBaziMatch[2],
        monthColumn: partnerBaziMatch[3],
        monthElement: partnerBaziMatch[4],
        dayColumn: partnerBaziMatch[5],
        dayElement: partnerBaziMatch[6],
        hourColumn: partnerBaziMatch[7],
        hourElement: partnerBaziMatch[8]
      }
    }

    return result
  }

  /**
   * 检查URL中是否有订单号参数，如果有则加载订单详情
   * @returns {Promise<boolean>} 是否成功加载订单
   */
  async function checkAndLoadOrderFromURL() {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const orderId = urlParams.get('orderId')

      if (!orderId) {
        return false
      }

      console.log('🔍 检测到URL中的订单号:', orderId)

      // 请求订单详情
      const result = await fetchOrderDetails(orderId)

      if (!result.success || !result.data) {
        console.error('❌ 获取订单详情失败')
        return false
      }

      const { serviceType, content, status, paymentStatus, userInput } = result.data

      if (!serviceType || !content) {
        console.error('❌ 订单数据不完整')
        return false
      }

      console.log('✅ 订单详情获取成功:', { serviceType, status, paymentStatus })

      // 切换到对应的服务类型
      app.setService(serviceType)

      // 如果已支付，设置解锁状态
      if (paymentStatus === 'paid') {
        app.setPaymentUnlocked()
      }

      // 解析用户输入数据
      let userData = null
      let partnerData = null

      if (userInput) {
        // 判断是八字合婚（有 self/spouse）还是其他服务（直接字段）
        if (serviceType === '八字合婚' && userInput.self) {
          // 八字合婚：处理 self 和 spouse
          userData = {
            name: userInput.self.name,
            gender: userInput.self.gender,
            birthYear: userInput.self.birthTime?.substring(0, 4),
            birthMonth: userInput.self.birthTime?.substring(5, 7),
            birthDay: userInput.self.birthTime?.substring(8, 10),
            birthHour: userInput.self.birthTime?.substring(11, 13),
            birthMinute: userInput.self.birthTime?.substring(14, 16),
            birthCity: userInput.self.birthRegion || ''
          }

          if (userInput.spouse) {
            partnerData = {
              partnerName: userInput.spouse.name,
              partnerGender: userInput.spouse.gender,
              partnerBirthYear: userInput.spouse.birthTime?.substring(0, 4),
              partnerBirthMonth: userInput.spouse.birthTime?.substring(5, 7),
              partnerBirthDay: userInput.spouse.birthTime?.substring(8, 10),
              partnerBirthHour: userInput.spouse.birthTime?.substring(11, 13),
              partnerBirthMinute: userInput.spouse.birthTime?.substring(14, 16),
              partnerBirthCity: userInput.spouse.birthRegion || ''
            }
          }
        } else if (userInput.name) {
          // 其他服务：直接字段
          userData = {
            name: userInput.name,
            gender: userInput.gender,
            birthYear: userInput.birthTime?.substring(0, 4),
            birthMonth: userInput.birthTime?.substring(5, 7),
            birthDay: userInput.birthTime?.substring(8, 10),
            birthHour: userInput.birthTime?.substring(11, 13),
            birthMinute: userInput.birthTime?.substring(14, 16),
            birthCity: userInput.birthRegion || ''
          }
        }
      }

      // 设置用户数据
      if (userData) {
        app.setUserData(userData)
      }
      if (partnerData) {
        app.setPartnerData(partnerData)
      }

      // 解析八字数据
      const baziData = parseBaziData(content)

      // 设置分析结果
      app.setAnalysisResult({
        orderId: orderId,
        content: content,
        baziData: baziData.userBazi,
        partnerBaziData: baziData.partnerBazi
      })

      console.log('✅ 订单加载完成')
      return true
    } catch (error) {
      console.error('❌ 加载订单失败:', error)
      return false
    }
  }

  return {
    checkAndLoadOrderFromURL
  }
}
