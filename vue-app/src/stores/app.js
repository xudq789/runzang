import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    currentService: '测算验证',
    fullAnalysisResult: '',
    baziData: null,
    partnerBaziData: null,
    currentOrderId: null,
    userData: null,
    partnerData: null,
    isPaymentUnlocked: false,
    isDownloadLocked: true,
    showResult: false,
    loading: false,
    error: null
  }),
  actions: {
    setService(name) {
      this.currentService = name
    },
    setUserData(data) {
      this.userData = data
    },
    setPartnerData(data) {
      this.partnerData = data
    },
    setAnalysisResult({ orderId, content, baziData, partnerBaziData }) {
      this.currentOrderId = orderId
      this.fullAnalysisResult = content || ''
      this.baziData = baziData || null
      this.partnerBaziData = partnerBaziData || null
      this.showResult = true
      this.loading = false
      this.error = null
    },
    setPaymentUnlocked() {
      this.isPaymentUnlocked = true
      this.isDownloadLocked = false
    },
    setLoading(v) {
      this.loading = !!v
    },
    setError(msg) {
      this.error = msg
      this.loading = false
    },
    resetAnalysis() {
      this.fullAnalysisResult = ''
      this.baziData = null
      this.partnerBaziData = null
      this.currentOrderId = null
      this.isPaymentUnlocked = false
      this.isDownloadLocked = true
      this.showResult = false
      this.error = null
    },
    resetOnServiceChange() {
      this.resetAnalysis()
      this.userData = null
      this.partnerData = null
    }
  }
})
