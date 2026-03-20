<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="loading-overlay" @click.self="onOverlayClick">
        <div class="modal-content">
          <div class="loading-header">
            <div class="spinner"></div>
            <h3>润藏八字正在为您进行深度命理分析</h3>
            <p>请耐心等待，不要关闭页面</p>
          </div>
          
          <!-- 当前项目进度 -->
          <div class="progress-section">
            <div class="current-step-title">
              {{ steps[currentStep]?.title || '分析中...' }}
            </div>
            
            <!-- 当前项目进度条 -->
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: stepProgress + '%' }"></div>
            </div>
            
            <!-- 进度指示器 -->
            <div class="step-indicators">
              <div
                v-for="(step, index) in steps"
                :key="index"
                class="step-indicator"
                :class="{
                  'active': index === currentStep,
                  'completed': index < currentStep
                }"
              ></div>
            </div>
          </div>
          
          <!-- 下一个项目提示 -->
          <div class="next-step-hint">
            <div class="hint-label">下一个项目：</div>
            <div class="hint-title">
              {{ currentStep < steps.length - 1 ? steps[currentStep + 1].title : '完成分析' }}
            </div>
          </div>
          
          <!-- 温馨提示 -->
          <div class="tips">
            润藏八字正在为您进行深度命理分析，预计1分钟左右...
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  serviceName: {
    type: String,
    default: '测算验证'
  },
  allowClose: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// 进度配置
const PROGRESS_TOTAL_SECONDS = 45
const PROGRESS_STEPS = {
  '测算验证': [
    { title: '正在用真太阳时校准您的出生时刻...', duration: 5 },
    { title: '正在进行八字排盘...', duration: 8 },
    { title: '正在进行大运排盘...', duration: 8 },
    { title: '正在分析八字喜用神...', duration: 10 },
    { title: '正在评估富贵层次...', duration: 7 },
    { title: '正在分析过往大运吉凶...', duration: 7 }
  ],
  '流年运程': [
    { title: '正在用真太阳时校准您的出生时刻...', duration: 5 },
    { title: '正在进行八字排盘...', duration: 7 },
    { title: '正在进行大运排盘...', duration: 7 },
    { title: '正在分析流年运势...', duration: 10 },
    { title: '正在分析事业财运走向...', duration: 8 },
    { title: '正在分析婚姻感情趋势...', duration: 8 }
  ],
  '人生详批': [
    { title: '正在用真太阳时校准您的出生时刻...', duration: 5 },
    { title: '正在进行八字排盘...', duration: 7 },
    { title: '正在进行大运排盘...', duration: 7 },
    { title: '正在分析人生每步大运...', duration: 10 },
    { title: '正在分析人生高低点...', duration: 8 },
    { title: '正在分析关键流年...', duration: 8 }
  ],
  '八字合婚': [
    { title: '正在用真太阳时校准出生时刻...', duration: 5 },
    { title: '正在进行双方八字排盘...', duration: 8 },
    { title: '正在进行大运排盘...', duration: 7 },
    { title: '正在分析双方八字契合度...', duration: 10 },
    { title: '正在分析感情发展趋势...', duration: 8 },
    { title: '正在分析婚姻稳定性...', duration: 7 }
  ]
}

const currentStep = ref(0)
const stepProgress = ref(0)
let stepInterval = null
let progressInterval = null

const steps = computed(() => {
  return PROGRESS_STEPS[props.serviceName] || PROGRESS_STEPS['测算验证']
})

// 开始进度动画
function startProgressAnimation() {
  if (stepInterval || progressInterval) {
    stopProgressAnimation()
  }
  
  currentStep.value = 0
  stepProgress.value = 0
  
  const totalSteps = steps.value.length
  const stepDuration = (PROGRESS_TOTAL_SECONDS * 1000) / totalSteps
  
  // 更新当前步骤的进度条（每个步骤内从 0% 到 100%）
  const progressUpdateInterval = 50 // 每 50ms 更新一次
  const progressIncrement = (100 / (stepDuration / progressUpdateInterval))
  
  progressInterval = setInterval(() => {
    stepProgress.value += progressIncrement
    if (stepProgress.value >= 100) {
      stepProgress.value = 100
    }
  }, progressUpdateInterval)
  
  // 切换到下一步
  stepInterval = setInterval(() => {
    if (currentStep.value < totalSteps - 1) {
      currentStep.value++
      stepProgress.value = 0
    } else {
      // 最后一步，保持在 100%
      clearInterval(progressInterval)
      stepProgress.value = 100
    }
  }, stepDuration)
}

// 停止进度动画
function stopProgressAnimation() {
  if (stepInterval) {
    clearInterval(stepInterval)
    stepInterval = null
  }
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
}

// 监听 show 属性变化
watch(() => props.show, (newVal) => {
  if (newVal) {
    startProgressAnimation()
    document.body.style.overflow = 'hidden'
  } else {
    stopProgressAnimation()
    document.body.style.overflow = ''
  }
}, { immediate: true })

// 点击遮罩层
function onOverlayClick() {
  if (props.allowClose) {
    emit('close')
  }
}

// 组件卸载时清理
onBeforeUnmount(() => {
  stopProgressAnimation()
  document.body.style.overflow = ''
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #fdfbf7;
  padding: 40px 30px;
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.loading-header {
  margin-bottom: 30px;
}

.spinner {
  display: inline-block;
  width: 50px;
  height: 50px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 25px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-header h3 {
  color: var(--primary-color);
  margin-bottom: 8px;
  font-size: 22px;
  font-weight: 600;
}

.loading-header p {
  color: #7d6e63;
  margin-bottom: 0;
  font-size: 15px;
}

.progress-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.current-step-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 20px;
  text-align: left;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--secondary-color), var(--primary-color));
  border-radius: 4px;
  transition: width 0.5s ease;
}

.step-indicators {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.step-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ddd;
  transition: all 0.3s ease;
}

.step-indicator.active {
  background: var(--secondary-color);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
  transform: scale(1.2);
}

.step-indicator.completed {
  background: #4CAF50;
}

.next-step-hint {
  text-align: left;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 25px;
}

.hint-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.hint-title {
  font-size: 16px;
  color: var(--dark-color);
  font-weight: 500;
}

.tips {
  text-align: left;
  padding-top: 20px;
  border-top: 1px solid #eee;
  font-size: 13px;
  color: #999;
  line-height: 1.6;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
