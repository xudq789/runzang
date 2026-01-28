<template>
  <section v-show="app.showResult" class="result-section" ref="sectionRef">
    <div class="result-header">
      <h2>{{ app.currentService }}分析报告</h2>
      <p class="analysis-time">分析时间：{{ analysisTime }}</p>
    </div>
    <div v-if="app.userData" class="predictor-info-grid">
      <div class="predictor-info-item"><span class="label">姓名</span><span>{{ app.userData.name }}</span></div>
      <div class="predictor-info-item"><span class="label">性别</span><span>{{ app.userData.gender === 'male' ? '男' : '女' }}</span></div>
      <div class="predictor-info-item"><span class="label">出生时间</span><span>{{ app.userData.birthYear }}年{{ app.userData.birthMonth }}月{{ app.userData.birthDay }}日 {{ app.userData.birthHour }}时{{ app.userData.birthMinute }}分</span></div>
      <div class="predictor-info-item"><span class="label">出生城市</span><span>{{ app.userData.birthCity || '—' }}</span></div>
      <div class="predictor-info-item"><span class="label">测算服务</span><span>{{ app.currentService }}</span></div>
      <template v-if="app.currentService === '八字合婚' && app.partnerData">
        <div class="predictor-info-item"><span class="label">伴侣姓名</span><span>{{ app.partnerData.partnerName }}</span></div>
        <div class="predictor-info-item"><span class="label">伴侣出生时间</span><span>{{ app.partnerData.partnerBirthYear }}年{{ app.partnerData.partnerBirthMonth }}月{{ app.partnerData.partnerBirthDay }}日</span></div>
      </template>
    </div>
    <div v-if="app.baziData" class="bazi-block">
      <h3>八字大运排盘</h3>
      <div class="bazi-grid">
        <div class="bazi-item"><div class="l">年柱</div><div class="v">{{ app.baziData.yearColumn }}</div><div class="e">{{ app.baziData.yearElement }}</div></div>
        <div class="bazi-item"><div class="l">月柱</div><div class="v">{{ app.baziData.monthColumn }}</div><div class="e">{{ app.baziData.monthElement }}</div></div>
        <div class="bazi-item"><div class="l">日柱</div><div class="v">{{ app.baziData.dayColumn }}</div><div class="e">{{ app.baziData.dayElement }}</div></div>
        <div class="bazi-item"><div class="l">时柱</div><div class="v">{{ app.baziData.hourColumn }}</div><div class="e">{{ app.baziData.hourElement }}</div></div>
      </div>
    </div>
    <div class="report-content">
      <div class="free-content" v-html="freeHtml"></div>
      <div v-if="!app.isPaymentUnlocked && lockedHtml" class="locked-wrap">
        <div class="locked-content" v-html="lockedHtml"></div>
        <div class="locked-overlay">
          <div class="unlock-header">
            <span class="lock-icon">🔒</span>
            <h4>完整内容已锁定</h4>
            <p>解锁完整分析报告，查看全部命理分析内容</p>
          </div>
          <ul class="unlock-items">
            <li v-for="item in config.getService(app.currentService)?.lockedItems || []" :key="item">🔒 {{ item }}</li>
          </ul>
          <div class="unlock-actions">
            <button type="button" class="unlock-btn" @click="$emit('unlock')">解锁完整报告 · ¥{{ config.getService(app.currentService)?.price ?? '—' }}</button>
          </div>
        </div>
      </div>
      <div v-else-if="app.isPaymentUnlocked && lockedHtml" class="locked-content" v-html="lockedHtml"></div>
    </div>
    <div class="result-actions">
      <button type="button" class="secondary-btn" @click="$emit('recalc')">重新测算</button>
      <button type="button" class="primary-btn" :disabled="app.isDownloadLocked" @click="$emit('download')">
        {{ app.isDownloadLocked ? '请先解锁后下载' : '下载报告' }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/app.js'
import { useConfigStore } from '../stores/config.js'

const app = useAppStore()
const config = useConfigStore()

const analysisTime = computed(() => new Date().toLocaleString('zh-CN'))

const FREE_SECTIONS = ['【八字喜用分析】', '【性格特点】', '【适宜行业职业推荐】']

function splitSections(text) {
  if (!text || !text.trim()) return { free: '', locked: '' }
  const sections = text.split(/【/).slice(1).map(s => '【' + s)
  let free = '', locked = ''
  const freeTitles = ['【八字喜用分析】', '【性格特点】', '【适宜行业职业推荐】']
  for (const sec of sections) {
    const title = (sec.match(/【[^】]+】/) || [])[0] || ''
    const body = sec.replace(title, '').trim()
    if (!title) continue
    if (title === '【八字排盘】' || title === '【大运排盘】') continue
    const html = `<div class="report-paragraph">${body.replace(/\n/g, '</div><div class="report-paragraph">')}</div>`
    if (freeTitles.some(t => title.startsWith(t) || title === t)) free += `<div class="report-section"><div class="report-title">${title.replace(/【|】/g, '')}</div><div class="report-content">${html}</div></div>`
    else locked += `<div class="report-section"><div class="report-title">${title.replace(/【|】/g, '')}</div><div class="report-content">${html}</div></div>`
  }
  return { free, locked }
}

const sections = computed(() => splitSections(app.fullAnalysisResult))
const freeHtml = computed(() => sections.value.free)
const lockedHtml = computed(() => sections.value.locked)

defineEmits(['unlock', 'recalc', 'download'])
</script>

<style scoped>
.result-section { max-width: 1200px; margin: 0 auto; padding: 24px 16px; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-top: 24px; }
.result-header { margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 16px; }
.result-header h2 { color: var(--primary-color); font-size: 1.4rem; }
.analysis-time { color: #666; font-size: 13px; margin-top: 6px; }
.predictor-info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 24px; }
.predictor-info-item { display: flex; gap: 8px; }
.predictor-info-item .label { color: #666; flex-shrink: 0; }
.bazi-block { margin-bottom: 24px; }
.bazi-block h3 { margin-bottom: 12px; font-size: 1.1rem; color: var(--primary-color); }
.bazi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.bazi-item { text-align: center; padding: 12px; background: #f9f6f0; border-radius: 8px; }
.bazi-item .l { font-size: 12px; color: #666; }
.bazi-item .v { font-weight: 600; margin: 4px 0; }
.report-content { margin-bottom: 24px; }
.free-content, .locked-content { font-family: 'SimSun', serif; line-height: 1.8; }
.report-section { margin-bottom: 20px; }
.report-title { font-weight: 600; color: var(--primary-color); margin-bottom: 8px; }
.locked-wrap { position: relative; }
.locked-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.92); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; border-radius: 8px; }
.unlock-header { text-align: center; margin-bottom: 16px; }
.lock-icon { font-size: 2rem; }
.unlock-items { list-style: none; padding: 0; margin: 0 0 16px 0; }
.unlock-btn { padding: 12px 24px; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: #fff; border: none; border-radius: 24px; font-weight: 600; cursor: pointer; }
.result-actions { display: flex; gap: 12px; flex-wrap: wrap; }
.secondary-btn, .primary-btn { padding: 10px 20px; border-radius: 24px; font-weight: 600; cursor: pointer; }
.secondary-btn { background: #f0e6d6; color: var(--primary-color); border: 1px solid var(--border-color); }
.primary-btn { background: linear-gradient(135deg, var(--primary-color), #3a7bd5); color: #fff; border: none; }
.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
