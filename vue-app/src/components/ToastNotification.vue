<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="[`toast-${toast.type}`]"
        @click="removeToast(toast.id)"
      >
        <div class="toast-icon">
          <svg v-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M20 6L9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else-if="toast.type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else-if="toast.type === 'warning'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <path d="M12 16v-4m0-4h.01" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="toast-content">
          <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
          <div class="toast-message">{{ toast.message }}</div>
        </div>
        <button class="toast-close" @click.stop="removeToast(toast.id)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let nextId = 1

/**
 * 显示 Toast 通知
 * @param {Object} options - 配置选项
 * @param {string} options.message - 消息内容（必填）
 * @param {string} options.title - 标题（可选）
 * @param {string} options.type - 类型：success/error/warning/info（默认：info）
 * @param {number} options.duration - 显示时长，毫秒（默认：3000）
 */
function show(options) {
  const toast = {
    id: nextId++,
    message: options.message || '',
    title: options.title || '',
    type: options.type || 'info',
    duration: options.duration || 3000
  }
  
  toasts.value.push(toast)
  
  // 自动移除
  if (toast.duration > 0) {
    setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration)
  }
  
  return toast.id
}

/**
 * 移除指定 Toast
 */
function removeToast(id) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

/**
 * 清空所有 Toast
 */
function clear() {
  toasts.value = []
}

// 快捷方法
const success = (message, title = '') => show({ message, title, type: 'success' })
const error = (message, title = '') => show({ message, title, type: 'error' })
const warning = (message, title = '') => show({ message, title, type: 'warning' })
const info = (message, title = '') => show({ message, title, type: 'info' })

// 暴露方法供外部使用
defineExpose({
  show,
  success,
  error,
  warning,
  info,
  clear,
  removeToast
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.toast {
  min-width: 300px;
  max-width: 400px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  pointer-events: all;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid;
}

.toast:hover {
  transform: translateX(-5px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
}

/* Toast 类型样式 */
.toast-success {
  border-left-color: var(--success-color);
  background: linear-gradient(135deg, #f0fff4, white);
}

.toast-success .toast-icon {
  color: var(--success-color);
}

.toast-error {
  border-left-color: var(--error-color);
  background: linear-gradient(135deg, #fff5f5, white);
}

.toast-error .toast-icon {
  color: var(--error-color);
}

.toast-warning {
  border-left-color: #ff9800;
  background: linear-gradient(135deg, #fff8e1, white);
}

.toast-warning .toast-icon {
  color: #ff9800;
}

.toast-info {
  border-left-color: #2196f3;
  background: linear-gradient(135deg, #e3f2fd, white);
}

.toast-info .toast-icon {
  color: #2196f3;
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.toast-message {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  word-break: break-word;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
  border-radius: 4px;
  margin-top: -2px;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

/* 进入/离开动画 */
.toast-enter-active {
  animation: slideIn 0.3s ease-out;
}

.toast-leave-active {
  animation: slideOut 0.3s ease-in;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
  
  .toast {
    min-width: auto;
    max-width: none;
  }
}
</style>
