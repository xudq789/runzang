<template>
  <div class="home">
    <ServiceNav />
    <div class="container">
      <section class="hero-section">
        <img :src="heroImage" :alt="app.currentService" class="hero-image" />
      </section>
      <FormSection @submit="onAnalyze" />
      <p v-if="app.error" class="error-msg">{{ app.error }}</p>
      <ResultSection
        v-show="app.showResult"
        ref="resultRef"
        @unlock="showPayment = true"
        @recalc="onRecalc"
        @download="onDownload"
      />
    </div>
    <PaymentModal v-model="showPayment" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app.js'
import { useConfigStore } from '../stores/config.js'
import { useAnalysis } from '../composables/useAnalysis.js'
import { usePayment } from '../composables/usePayment.js'
import ServiceNav from '../components/ServiceNav.vue'
import FormSection from '../components/FormSection.vue'
import ResultSection from '../components/ResultSection.vue'
import PaymentModal from '../components/PaymentModal.vue'

const app = useAppStore()
const config = useConfigStore()
const { runAnalysis } = useAnalysis()
const { initPaymentCheck } = usePayment()

const showPayment = ref(false)
const resultRef = ref(null)

const heroImage = computed(() => config.getService(app.currentService)?.heroImage || '')

async function onAnalyze() {
  try {
    await runAnalysis()
    await initPaymentCheck()
    resultRef.value?.$el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  } catch (_) {}
}

function onRecalc() {
  app.resetAnalysis()
  app.setUserData(null)
  app.setPartnerData(null)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onDownload() {
  if (app.isDownloadLocked) {
    showPayment.value = true
    return
  }
  if (!app.userData || !app.fullAnalysisResult) {
    alert('请先进行测算分析')
    return
  }
  const lines = [
    `命理分析报告 - ${app.currentService}`,
    '',
    '预测者信息：',
    `姓名：${app.userData.name}`,
    `性别：${app.userData.gender === 'male' ? '男' : '女'}`,
    `出生时间：${app.userData.birthYear}年${app.userData.birthMonth}月${app.userData.birthDay}日 ${app.userData.birthHour}时${app.userData.birthMinute}分`,
    `出生城市：${app.userData.birthCity || '—'}`,
    `测算服务：${app.currentService}`,
    `测算时间：${new Date().toLocaleString('zh-CN')}`,
    '',
    app.baziData ? `八字：${app.baziData.yearColumn} ${app.baziData.monthColumn} ${app.baziData.dayColumn} ${app.baziData.hourColumn}` : '',
    '',
    app.fullAnalysisResult,
    '',
    '--- 润藏八字 ---'
  ]
  const blob = new Blob([lines.filter(Boolean).join('\n')], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `命理报告_${app.userData.name}_${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(a.href)
}

onMounted(() => {
  initPaymentCheck()
})
</script>

<style scoped>
.home { min-height: 100vh; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 16px 48px; }
.hero-section { height: 40vh; min-height: 260px; max-height: 360px; overflow: hidden; background: #f0e6d6; border-radius: 0 0 12px 12px; margin-bottom: 24px; }
.hero-image { width: 100%; height: 100%; object-fit: cover; }
.error-msg { color: var(--error-color); padding: 12px; margin-top: 12px; }
</style>
