import { useAppStore } from '../stores/app.js'
import { useConfigStore } from '../stores/config.js'
import { getPaymentStatus, createPaymentOrder, getStoredPaymentData, setStoredPaymentData } from '../api/payment.js'
import { fetchAiResultContent, parseBaziData } from '../api/ai.js'

export function usePayment() {
  const app = useAppStore()
  const config = useConfigStore()

  function checkUrlCallback() {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment_success') !== 'true' || !params.get('order_id') || params.get('verified') !== 'true') return null
    const orderId = params.get('order_id')
    setStoredPaymentData({ orderId, verified: true, backendVerified: true, timestamp: new Date().toISOString() })
    try { window.history.replaceState({}, document.title, window.location.pathname + window.location.hash) } catch (_) {}
    return orderId
  }

  async function verifyAndUnlock(orderId, fromBackend = false) {
    if (fromBackend) {
      await unlockContent(orderId)
      return true
    }
    const ok = await getPaymentStatus(orderId)
    if (ok) {
      const data = getStoredPaymentData() || {}
      data.verified = true
      data.verifiedAt = new Date().toISOString()
      setStoredPaymentData(data)
      await unlockContent(orderId)
      return true
    }
    return false
  }

  async function unlockContent(orderId) {
    app.currentOrderId = orderId
    app.setPaymentUnlocked()
    const full = await fetchAiResultContent(orderId)
    if (full) {
      app.fullAnalysisResult = full
      const parsed = parseBaziData(full)
      if (parsed.userBazi) app.baziData = parsed.userBazi
      if (parsed.partnerBazi) app.partnerBaziData = parsed.partnerBazi
    }
  }

  async function initPaymentCheck() {
    const orderId = checkUrlCallback()
    if (orderId) {
      await verifyAndUnlock(orderId, true)
      return
    }
    const data = getStoredPaymentData()
    if (!data) return
    if (data.backendVerified) await unlockContent(data.orderId)
    else if (await getPaymentStatus(data.orderId)) await unlockContent(data.orderId)
  }

  async function openPayment() {
    const svc = config.getService(app.currentService)
    if (!svc || !app.currentOrderId) throw new Error('请先完成分析并获取订单号')
    const isMobile = /mobile|iphone|android/i.test(navigator.userAgent.toLowerCase())
    const method = isMobile ? 'alipay' : 'wechatpay'
    const data = await createPaymentOrder({
      serviceType: app.currentService,
      amount: svc.price,
      frontendOrderId: app.currentOrderId,
      paymentMethod: method
    })
    return { ...data, method }
  }

  return { initPaymentCheck, verifyAndUnlock, openPayment, getPaymentStatus }
}
