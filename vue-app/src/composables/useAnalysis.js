import { useAppStore } from '../stores/app.js'
import { callAiQuery, fetchAiResultContent, parseBaziData, buildAiRequestBody, SERVICE_API_MAP } from '../api/ai.js'
import { getStoredPaymentData } from '../api/payment.js'

export function useAnalysis() {
  const app = useAppStore()

  async function runAnalysis() {
    if (!app.userData) throw new Error('请先填写完整表单')
    const endpoint = SERVICE_API_MAP[app.currentService]
    if (!endpoint) throw new Error('未找到服务对应的接口')
    const body = buildAiRequestBody(app.currentService, app.userData, app.partnerData)
    app.setLoading(true)
    app.setError(null)
    try {
      const { orderId, content } = await callAiQuery(endpoint, body)
      let contentToShow = content || ''
      app.fullAnalysisResult = contentToShow
      app.currentOrderId = orderId

      const paymentData = getStoredPaymentData()
      if (paymentData && paymentData.verified && paymentData.orderId === orderId) {
        const full = await fetchAiResultContent(orderId)
        if (full) {
          contentToShow = full
          app.fullAnalysisResult = full
          app.setPaymentUnlocked()
        }
      }

      const parsed = parseBaziData(contentToShow)
      app.setAnalysisResult({
        orderId,
        content: contentToShow,
        baziData: parsed.userBazi,
        partnerBaziData: parsed.partnerBazi
      })
    } catch (e) {
      app.setError(e.message || '分析失败')
      throw e
    }
  }

  return { runAnalysis }
}
