<template>
  <div v-if="show" class="history-panel">
    <div class="history-header">
      <h2>历史记录</h2>
      <button class="close-btn" @click="$emit('close')" title="关闭">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- 服务切换标签 -->
    <div class="history-tabs">
      <button
        v-for="serviceName in serviceNames"
        :key="serviceName"
        class="tab-btn"
        :class="{ active: currentService === serviceName }"
        @click="currentService = serviceName"
      >
        {{ serviceName }}
        <span v-if="getOrderCount(serviceName) > 0" class="badge">
          {{ getOrderCount(serviceName) }}
        </span>
      </button>
    </div>

    <!-- 历史记录列表 -->
    <div class="history-content">
      <div
        v-for="serviceName in serviceNames"
        :key="serviceName"
        v-show="currentService === serviceName"
        class="history-list-container"
      >
        <div v-if="getOrders(serviceName).length === 0" class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke-width="1.5"/>
          </svg>
          <p>暂无记录</p>
        </div>

        <ul v-else class="history-list">
          <li
            v-for="order in getOrders(serviceName)"
            :key="order.orderId"
            class="history-order-item"
            @click="handleOrderClick(serviceName, order.orderId)"
          >
            <div class="order-content">
              <div class="order-header">
                <span class="order-time">{{ formatTime(order.createdAt) }}</span>
              </div>
              <span class="order-summary">{{ truncateSummary(order.userInputSummary) }}</span>
              <div class="order-id-row">
                <span class="order-id">{{ formatOrderId(order.orderId) }}</span>
                <button
                  class="copy-btn"
                  @click.stop="copyOrderId(order.orderId)"
                  :title="`复制订单号: ${order.orderId}`"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                  </svg>
                </button>
              </div>
            </div>
            <button
              class="delete-btn"
              @click.stop="handleDelete(serviceName, order.orderId)"
              title="删除记录"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useHistory } from '../composables/useHistory.js'
import { SERVICE_NAMES } from '../config/services.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'restore'])

const history = useHistory()
const currentService = ref('测算验证')
const serviceNames = SERVICE_NAMES

/**
 * 获取指定服务的订单列表
 */
function getOrders(serviceName) {
  return history.ordersByService.value(serviceName)
}

/**
 * 获取指定服务的订单数量
 */
function getOrderCount(serviceName) {
  return getOrders(serviceName).length
}

/**
 * 格式化时间为 MM-DD HH:mm
 */
function formatTime(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  } catch {
    return dateStr
  }
}

/**
 * 格式化订单号显示（RZxxxx...xxxxxx）
 */
function formatOrderId(orderId) {
  if (!orderId || orderId.length <= 12) return orderId
  const prefix = orderId.substring(0, 6)
  const suffix = orderId.substring(orderId.length - 6)
  return `${prefix}...${suffix}`
}

/**
 * 截断摘要文本
 */
function truncateSummary(text) {
  if (!text) return '—'
  if (text.length <= 60) return text
  return text.substring(0, 60) + '…'
}

/**
 * 处理订单点击
 */
async function handleOrderClick(serviceType, orderId) {
  emit('close')
  await history.restoreHistoryOrder(serviceType, orderId)
  emit('restore', { serviceType, orderId })
}

/**
 * 复制订单号到剪贴板
 */
async function copyOrderId(orderId) {
  try {
    await navigator.clipboard.writeText(orderId)
    // 显示复制成功提示（可选）
    console.log('✅ 订单号已复制:', orderId)
  } catch (error) {
    console.error('❌ 复制失败:', error)
    // 降级方案：使用旧方法
    const textarea = document.createElement('textarea')
    textarea.value = orderId
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

/**
 * 处理删除
 */
function handleDelete(serviceType, orderId) {
  const success = history.deleteHistoryOrder(serviceType, orderId)
  
  if (success) {
    // 检查是否删除了最后一条记录
    const remainingOrders = history.allOrders.value
    
    if (remainingOrders.length === 0) {
      // 如果没有记录了，关闭历史面板并切换到第一个服务
      emit('close')
      emit('switch-service', '测算验证')
    } else {
      // 如果当前服务的记录已空，切换到有记录的服务
      const currentServiceOrders = getOrders(currentService.value)
      if (currentServiceOrders.length === 0) {
        // 找到第一个有记录的服务
        for (const serviceName of serviceNames) {
          if (getOrders(serviceName).length > 0) {
            currentService.value = serviceName
            break
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.history-panel {
  background: #fdfbf7;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5ddd3;
}

.history-header h2 {
  font-size: 28px;
  color: var(--primary-color);
  margin: 0;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #999;
  transition: all 0.3s;
  border-radius: 50%;
}

.close-btn:hover {
  background: #f0f0f0;
  color: var(--primary-color);
}

.history-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 10px 20px;
  border: 2px solid #e5ddd3;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 15px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.tab-btn:hover {
  border-color: var(--secondary-color);
  background: #fdfbf7;
}

.tab-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.tab-btn .badge {
  background: var(--secondary-color);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.tab-btn.active .badge {
  background: white;
  color: var(--primary-color);
}

.history-content {
  min-height: 200px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state svg {
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.history-order-item:hover {
  background: #fdfbf7;
  border-color: var(--secondary-color);
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.order-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 6px;
}

.order-time {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}

.order-summary {
  font-size: 14px;
  color: #333;
  display: block;
  word-break: break-all;
  line-height: 1.5;
  margin-bottom: 6px;
}

.order-id-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.order-id {
  font-size: 10px;
  color: var(--primary-color);
  font-weight: 500;
  font-family: 'Courier New', monospace;
}

.copy-btn {
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
}

.copy-btn:hover {
  background: #f0f0f0;
  color: var(--primary-color);
}

.copy-btn:active {
  transform: scale(0.95);
}

.delete-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin-left: 12px;
  padding: 0;
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #ff4d4f;
  color: white;
  transform: scale(1.1);
}

.delete-btn:active {
  transform: scale(0.95);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .history-panel {
    padding: 20px;
  }

  .history-header h2 {
    font-size: 22px;
  }

  .history-tabs {
    gap: 8px;
  }

  .tab-btn {
    padding: 8px 15px;
    font-size: 14px;
  }

  .history-order-item {
    padding: 12px 15px;
  }

  .order-summary {
    font-size: 14px;
  }
}
</style>
