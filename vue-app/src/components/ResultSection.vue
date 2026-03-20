<template>
  <section v-show="app.showResult" class="result-section" ref="sectionRef">
    <div class="result-header">
      <h2>{{ app.currentService }}分析报告</h2>
      <p class="analysis-time">分析时间：{{ analysisTime }}</p>
      <p v-if="app.currentOrderId" class="order-info">
        订单号: <span class="order-id">{{ app.currentOrderId }}</span>
        <button
          class="order-copy-btn"
          @click="copyOrderId"
          title="复制订单号"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
          </svg>
        </button>
      </p>
    </div>
    <div v-if="app.userData" class="predictor-info-card">
      <h4>预测者信息</h4>
      <div class="predictor-info-grid">
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
    </div>
    <!-- 用户八字排盘 -->
    <div v-if="app.baziData" class="bazi-container">
      <div class="bazi-header">
        <div class="bazi-title">八字排盘</div>
        <div class="bazi-subtitle">命理根基 • 生辰八字</div>
      </div>
      <div class="bazi-grid-horizontal">
        <div class="bazi-item"><div class="bazi-label">年柱</div><div class="bazi-value">{{ app.baziData.yearColumn }}</div><div class="bazi-element">{{ app.baziData.yearElement }}</div></div>
        <div class="bazi-item"><div class="bazi-label">月柱</div><div class="bazi-value">{{ app.baziData.monthColumn }}</div><div class="bazi-element">{{ app.baziData.monthElement }}</div></div>
        <div class="bazi-item"><div class="bazi-label">日柱</div><div class="bazi-value">{{ app.baziData.dayColumn }}</div><div class="bazi-element">{{ app.baziData.dayElement }}</div></div>
        <div class="bazi-item"><div class="bazi-label">时柱</div><div class="bazi-value">{{ app.baziData.hourColumn }}</div><div class="bazi-element">{{ app.baziData.hourElement }}</div></div>
      </div>
      <div class="bazi-footer">※ 排盘基于真太阳时计算</div>
    </div>
    
    <!-- 伴侣八字排盘（八字合婚时显示） -->
    <div v-if="app.currentService === '八字合婚' && app.partnerBaziData" class="bazi-container partner">
      <div class="bazi-header partner">
        <div class="bazi-title partner">伴侣八字排盘</div>
        <div class="bazi-subtitle">伴侣命理 • 配对分析</div>
      </div>
      <div class="bazi-grid-horizontal">
        <div class="bazi-item partner"><div class="bazi-label">年柱</div><div class="bazi-value">{{ app.partnerBaziData.yearColumn }}</div><div class="bazi-element partner">{{ app.partnerBaziData.yearElement }}</div></div>
        <div class="bazi-item partner"><div class="bazi-label">月柱</div><div class="bazi-value">{{ app.partnerBaziData.monthColumn }}</div><div class="bazi-element partner">{{ app.partnerBaziData.monthElement }}</div></div>
        <div class="bazi-item partner"><div class="bazi-label">日柱</div><div class="bazi-value">{{ app.partnerBaziData.dayColumn }}</div><div class="bazi-element partner">{{ app.partnerBaziData.dayElement }}</div></div>
        <div class="bazi-item partner"><div class="bazi-label">时柱</div><div class="bazi-value">{{ app.partnerBaziData.hourColumn }}</div><div class="bazi-element partner">{{ app.partnerBaziData.hourElement }}</div></div>
      </div>
      <div class="bazi-footer">※ 排盘基于真太阳时计算</div>
    </div>
    <div class="report-content">
      <div v-if="freeHtml" class="free-content">
        <h4>免费分析内容</h4>
        <div v-html="freeHtml"></div>
      </div>
      <!-- 未解锁状态：显示解锁区块 -->
      <div v-if="!app.isPaymentUnlocked" class="locked-content">
        <div class="locked-overlay">
          <!-- 解锁标题区域 -->
          <div class="unlock-header">
            <div class="lock-icon">🔒</div>
            <h4>完整内容已锁定</h4>
            <p>解锁完整分析报告，查看全部命理分析内容</p>
          </div>
          
          <!-- 待解锁项目列表 -->
          <div class="unlock-items">
            <h5>解锁后可查看以下分析项目</h5>
            <ul class="unlock-items-list">
              <li v-for="item in config.getService(app.currentService)?.lockedItems || []" :key="item">
                <span>🔒 {{ item }}</span>
              </li>
            </ul>
          </div>
          
          <!-- 解锁按钮区域 -->
          <div class="unlock-btn-container">
            <button type="button" class="unlock-btn" @click="$emit('unlock')">
              解锁完整报告 (¥{{ config.getService(app.currentService)?.price ?? '—' }})
            </button>
            <div class="unlock-price">
              共包含 <span class="unlock-count">{{ (config.getService(app.currentService)?.lockedItems || []).length }}</span> 项详细分析
            </div>
          </div>
        </div>
      </div>
      <!-- 已解锁状态：显示完整内容 -->
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

// 获取十神颜色
function getShishenColor(keyword) {
  const colors = {
    '正官': '#4169E1',
    '七杀': '#DC143C',
    '正印': '#228B22',
    '偏印': '#6B8E23',
    '正财': '#FFD700',
    '偏财': '#FFA500',
    '食神': '#FF69B4',
    '伤官': '#9932CC',
    '比肩': '#8B4513',
    '劫财': '#A0522D'
  }
  return colors[keyword] || '#333'
}

// 格式化标题（不同类型标题不同颜色）
function formatTitle(title) {
  if (title.includes('喜用') || title.includes('喜神') || title.includes('用神')) {
    return `<span style="color: #32CD32;">${title}</span>`
  } else if (title.includes('忌神') || title.includes('忌')) {
    return `<span style="color: #FF4500;">${title}</span>`
  } else if (title.includes('性格')) {
    return `<span style="color: #1E90FF;">${title}</span>`
  } else if (title.includes('职业') || title.includes('行业')) {
    return `<span style="color: #8b4513;">${title}</span>`
  } else if (title.includes('富贵') || title.includes('财富')) {
    return `<span style="color: #FFD700;">${title}</span>`
  } else if (title.includes('婚姻') || title.includes('感情')) {
    return `<span style="color: #FF69B4;">${title}</span>`
  } else if (title.includes('事业') || title.includes('财运')) {
    return `<span style="color: #FFA500;">${title}</span>`
  } else if (title.includes('健康')) {
    return `<span style="color: #32CD32;">${title}</span>`
  } else {
    return `<span style="color: #8b4513;">${title}</span>`
  }
}

// 格式化报告内容
function formatReportContent(text) {
  // 喜忌神高亮
  text = text.replace(/喜神/g, '<span class="xiji-element xiji-xi">喜神</span>')
             .replace(/用神/g, '<span class="xiji-element xiji-yong">用神</span>')
             .replace(/忌神/g, '<span class="xiji-element xiji-ji">忌神</span>')
             .replace(/喜用/g, '<span class="xiji-element xiji-xiyong">喜用</span>')
  
  // 十神颜色
  const shishenKeywords = ['正官', '七杀', '正印', '偏印', '正财', '偏财', '食神', '伤官', '比肩', '劫财']
  shishenKeywords.forEach(keyword => {
    const color = getShishenColor(keyword)
    text = text.replace(new RegExp(keyword, 'g'), `<span style="color: ${color}; font-weight: 500;">${keyword}</span>`)
  })
  
  // 处理段落
  const paragraphs = text.split('\n').filter(p => p.trim())
  return paragraphs.map(para => `<div class="report-paragraph">${para}</div>`).join('')
}

// 创建分析段落
function createAnalysisSection(title, content) {
  const sectionTitle = title.replace(/【|】/g, '')
  return `
    <div class="report-section">
      <div class="report-title">${formatTitle(sectionTitle)}</div>
      <div class="report-content">${formatReportContent(content)}</div>
    </div>
  `
}

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
    const sectionTitle = title.replace(/【|】/g, '')
    if (freeTitles.some(t => title.startsWith(t) || title === t)) {
      free += createAnalysisSection(title, body)
    } else {
      locked += createAnalysisSection(title, body)
    }
  }
  return { free, locked }
}

const sections = computed(() => splitSections(app.fullAnalysisResult))
const freeHtml = computed(() => sections.value.free)
const lockedHtml = computed(() => sections.value.locked)

/**
 * 复制订单号到剪贴板
 */
async function copyOrderId() {
  if (!app.currentOrderId) return
  
  try {
    await navigator.clipboard.writeText(app.currentOrderId)
    console.log('✅ 订单号已复制:', app.currentOrderId)
  } catch (error) {
    console.error('❌ 复制失败:', error)
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = app.currentOrderId
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

defineEmits(['unlock', 'recalc', 'download'])
</script>

<style scoped>
.result-section { 
  max-width: 1200px; 
  margin: 0 auto; 
  padding: 24px 16px; 
  margin-top: 24px; 
}

.result-header { 
  text-align: center;
  margin-bottom: 30px; 
  padding-bottom: 15px; 
  border-bottom: 2px solid var(--light-color);
}

.result-header h2 { 
  color: var(--primary-color); 
  font-size: 24px;
  margin-bottom: 8px;
}

.analysis-time { 
  color: #666; 
  font-size: 13px; 
  margin-top: 6px; 
}

.order-info { 
  margin-top: 8px; 
  font-size: 11px; 
  color: #666; 
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
}

.order-id { 
  font-family: 'Courier New', monospace; 
  font-size: 10px;
  color: var(--primary-color); 
  font-weight: 500;
  margin: 0 6px;
}

.order-copy-btn { 
  padding: 2px 4px; 
  border: none; 
  background: transparent; 
  color: #999; 
  cursor: pointer; 
  border-radius: 4px; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  transition: all 0.2s;
  vertical-align: middle;
}

.order-copy-btn:hover { 
  background: #f0f0f0; 
  color: var(--primary-color); 
}

.order-copy-btn:active { 
  transform: scale(0.95); 
}

.predictor-info-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  border: 1px solid var(--border-color);
}

.predictor-info-card h4 {
  color: var(--primary-color);
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: 600;
}

.predictor-info-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
  gap: 15px;
}

.predictor-info-item { 
  display: flex; 
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed var(--border-color);
}

.predictor-info-item .label { 
  color: #666;
  font-weight: 500;
  font-size: 15px;
  flex-shrink: 0; 
}

.predictor-info-item span:not(.label) {
  color: var(--dark-color);
  font-weight: 600;
  font-size: 15px;
  text-align: right;
}

/* 八字排盘容器 */
.bazi-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 3px 15px rgba(0,0,0,0.08);
  padding: 20px;
  margin-bottom: 25px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
}

.bazi-container.partner {
  border-left: 4px solid #FF69B4;
}

/* 八字排盘头部 */
.bazi-header {
  text-align: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e8d4b9;
}

.bazi-header.partner {
  border-bottom-color: #ffc1cc;
}

.bazi-title {
  font-size: 20px;
  color: #8b4513;
  font-weight: bold;
  font-family: 'SimSun', '宋体', serif;
  margin-bottom: 6px;
}

.bazi-title.partner {
  color: #FF69B4;
}

.bazi-subtitle {
  font-size: 13px;
  color: #666;
  font-family: 'SimSun', '宋体', serif;
}

/* 八字网格 - 2x2布局 */
.bazi-grid-horizontal {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
}

/* 八字项目 - 每行2个 */
.bazi-item {
  flex: 0 0 calc(50% - 10px);
  max-width: calc(50% - 10px);
  min-width: 120px;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 15px 10px;
  text-align: center;
  border: 1px solid #d9d9d9;
  transition: all 0.2s;
  box-sizing: border-box;
}

.bazi-item.partner {
  background: #fff5f5;
  border-color: #ffc1cc;
}

.bazi-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.bazi-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  font-weight: 500;
  font-family: 'SimSun', '宋体', serif;
}

.bazi-value {
  font-size: 24px;
  font-weight: bold;
  font-family: 'SimSun', '宋体', serif;
  margin-bottom: 8px;
  height: 36px;
  line-height: 36px;
  color: #333;
}

.bazi-element {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  padding: 4px 10px;
  background: white;
  border-radius: 15px;
  display: inline-block;
  border: 1px solid #d9d9d9;
}

.bazi-element.partner {
  border-color: #ffc1cc;
}

/* 八字排盘底部 */
.bazi-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed #e0e0e0;
  font-size: 12px;
  color: #999;
  font-family: 'SimSun', '宋体', serif;
}

.report-content { 
  margin-bottom: 24px; 
}

.free-content { 
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  border: 1px solid var(--border-color);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  font-family: 'SimSun', '宋体', 'STSong', serif; 
  line-height: 1.8; 
}

.free-content h4 {
  color: var(--primary-color);
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: 600;
}

.report-section { 
  margin-bottom: 20px; 
}

.report-title { 
  font-size: 20px;
  font-weight: bold;
  color: #8b4513;
  margin-bottom: 20px;
  padding: 10px 20px;
  font-family: 'SimSun', '宋体', serif;
  line-height: 1.4;
  text-align: left;
  background: linear-gradient(135deg, #f9f5f0, #f0e6d6);
  border-left: 4px solid #8b4513;
  border-radius: 0 8px 8px 0;
  position: relative;
  overflow: hidden;
}

.report-title::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(139, 69, 19, 0.05) 10px,
    rgba(139, 69, 19, 0.05) 20px
  );
  z-index: 0;
}

.report-title span {
  position: relative;
  z-index: 1;
}

.report-text,
.report-content {
  font-size: 16px;
  color: #333;
  line-height: 1.8;
  text-align: justify;
  font-family: 'SimSun', '宋体', serif;
  padding: 0 20px;
}

.report-paragraph {
  margin-bottom: 15px;
  text-indent: 2em;
}

/* 喜忌神样式 */
:deep(.xiji-element) {
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  margin: 0 2px;
}

:deep(.xiji-xi) {
  background: linear-gradient(135deg, #e8f5e8, #d4f1d4);
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

:deep(.xiji-yong) {
  background: linear-gradient(135deg, #e8f4fd, #d4e9fa);
  color: #1565c0;
  border: 1px solid #bbdefb;
}

:deep(.xiji-ji) {
  background: linear-gradient(135deg, #ffeaea, #ffd4d4);
  color: #c62828;
  border: 1px solid #ffcdd2;
}

:deep(.xiji-xiyong) {
  background: linear-gradient(135deg, #e8f4f8, #d4eaf2);
  color: #20B2AA;
  border: 1px solid #b2ebf2;
}

/* 锁定内容区块 */
.locked-content {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

/* 锁定覆盖层 - 独立区块样式 */
.locked-overlay {
  position: relative;
  background: rgba(255, 255, 255, 0.98);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  padding: 25px;
  border-radius: 15px;
  backdrop-filter: blur(3px);
  border: 1px solid rgba(212, 175, 55, 0.3);
  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
}

/* 解锁标题区域 */
.unlock-header { 
  text-align: center; 
  margin-bottom: 20px; 
}

.unlock-header h4 {
  color: #333;
  font-size: 1.3rem;
  margin: 10px 0;
  font-weight: 600;
}

.unlock-header p {
  color: #666;
  font-size: 14px;
}

/* 锁图标 */
.lock-icon {
  font-size: 60px;
  color: var(--secondary-color);
  margin-bottom: 15px;
  animation: pulse 2s infinite;
  filter: drop-shadow(0 3px 6px rgba(0,0,0,0.15));
  text-align: center;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 待解锁项目列表 */
.unlock-items {
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
}

.unlock-items h5 {
  color: #333;
  font-size: 15px;
  margin-bottom: 15px;
  text-align: center;
  font-weight: 600;
}

.unlock-items-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.unlock-items-list li {
  padding: 10px 15px;
  color: #666;
  font-size: 14px;
  border-bottom: 1px dashed #e0e0e0;
}

.unlock-items-list li:last-child {
  border-bottom: none;
}

/* 解锁按钮区域 */
.unlock-btn-container {
  text-align: center;
}

.unlock-btn {
  background: linear-gradient(135deg, var(--secondary-color), #e6b800);
  color: white;
  border: none;
  padding: 14px 35px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
  min-width: 220px;
}

.unlock-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4);
  background: linear-gradient(135deg, #e6b800, var(--secondary-color));
}

/* 价格信息 */
.unlock-price {
  margin-top: 12px;
  font-size: 13px;
  color: #888;
}

.unlock-count {
  color: var(--secondary-color);
  font-weight: 600;
}

.result-actions { 
  display: flex; 
  gap: 12px; 
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 30px;
}

.secondary-btn, .primary-btn { 
  padding: 12px 30px; 
  border-radius: 25px; 
  font-weight: 600; 
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.secondary-btn { 
  background: #f0e6d6; 
  color: var(--primary-color); 
  border: 1px solid var(--border-color); 
}

.secondary-btn:hover {
  background: #e8dcc8;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.primary-btn { 
  background: linear-gradient(135deg, var(--primary-color), #3a7bd5); 
  color: #fff; 
  border: none; 
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

.primary-btn:disabled { 
  opacity: 0.6; 
  cursor: not-allowed; 
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bazi-grid-horizontal {
    gap: 10px;
  }
  
  .bazi-item {
    flex: 0 0 calc(50% - 5px);
    max-width: calc(50% - 5px);
    min-width: 100px;
    padding: 12px 8px;
  }
  
  .bazi-value {
    font-size: 20px;
    height: 30px;
    line-height: 30px;
  }
  
  .bazi-title {
    font-size: 18px;
  }
  
  .predictor-info-grid {
    grid-template-columns: 1fr;
  }
  
  .report-title {
    font-size: 18px;
    padding: 8px 15px;
  }
  
  .report-text {
    font-size: 15px;
    padding: 0 15px;
  }
}

@media (max-width: 480px) {
  .bazi-grid-horizontal {
    gap: 8px;
  }
  
  .bazi-item {
    flex: 0 0 calc(50% - 4px);
    max-width: calc(50% - 4px);
    min-width: 0;
    padding: 10px 6px;
  }
  
  .bazi-value {
    font-size: 18px;
    height: 26px;
    line-height: 26px;
  }
  
  .bazi-label {
    font-size: 12px;
    margin-bottom: 8px;
  }
  
  .bazi-element {
    font-size: 12px;
    padding: 3px 8px;
  }
  
  .result-actions {
    flex-direction: column;
  }
  
  .secondary-btn,
  .primary-btn {
    width: 100%;
  }
}
</style>
