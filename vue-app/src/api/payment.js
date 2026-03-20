import { API_BASE_URL } from '../config/services.js'

export async function getPaymentStatus(orderId) {
  const res = await fetch(`${API_BASE_URL}/api/payment/status/${orderId}`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'runzang-payment-security-key-2025-1234567890'
    }
  })
  if (!res.ok) return false
  const data = await res.json()
  return !!(data.success && data.data && data.data.status === 'paid')
}

/**
 * 检查支付状态并获取完整内容
 * @param {string} orderId - 订单ID
 * @returns {Promise<object>} 完整的API响应，包含 success, data.status, data.paymentStatus, data.content
 */
export async function checkPaymentAndGetContent(orderId) {
  const res = await fetch(`${API_BASE_URL}/api/payment/status/${orderId}`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'runzang-payment-security-key-2025-1234567890'
    }
  })
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`)
  }
  return await res.json()
}

export async function createPaymentOrder({ serviceType, amount, frontendOrderId, paymentMethod }) {
  const res = await fetch(`${API_BASE_URL}/api/payment/create`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'runzang-payment-security-key-2025-1234567890'
    },
    body: JSON.stringify({
      serviceType,
      amount: parseFloat(amount).toFixed(2),
      frontendOrderId,
      paymentMethod
    })
  })
  const data = await res.json()
  if (!data.success) throw new Error(data.message || '创建订单失败')
  return data.data
}

export function getStoredPaymentData() {
  try {
    const raw = localStorage.getItem('alipay_payment_data')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredPaymentData(data) {
  try {
    localStorage.setItem('alipay_payment_data', JSON.stringify(data))
  } catch (e) {
    console.error('保存支付数据失败:', e)
  }
}
