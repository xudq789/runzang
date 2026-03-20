<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-mask" @click.self="close">
      <div class="modal-box">
        <button type="button" class="modal-close" @click="close">×</button>
        
        <h3 class="modal-title">支付解锁完整报告</h3>
        
        <!-- 订单信息 -->
        <div class="order-info">
          <p><strong>服务项目:</strong> <span class="service-type">{{ app.currentService }}</span></p>
          <p><strong>支付金额:</strong> <span class="amount">¥{{ config.getService(app.currentService)?.price ?? '—' }}</span></p>
          <p><strong>订单编号:</strong> <span class="order-id">{{ app.currentOrderId || '—' }}</span></p>
          <p><strong>支付方式:</strong> <span class="pay-method">{{ paymentData?.method === 'alipay' ? '支付宝安全支付' : '微信安全支付' }}</span></p>
        </div>
        
        <!-- 支付按钮区域 -->
        <div class="payment-methods">
          <template v-if="paymentData">
            <!-- 支付宝支付 -->
            <template v-if="paymentData.method === 'alipay'">
              <button type="button" class="pay-btn alipay" @click="goPay">
                <span class="btn-content">
                  <span class="btn-icon">💰</span>
                  前往支付宝支付
                </span>
              </button>
            </template>
            <!-- 微信支付 -->
            <template v-else>
              <div v-if="paymentData.qrCodeUrl || paymentData.codeUrl" class="wechat-qr-container">
                <div class="qr-title">
                  <span class="qr-icon">💳</span>
                  微信扫码支付
                </div>
                <div class="qr-box">
                  <img :src="paymentData.qrCodeUrl || qrImageUrl" alt="微信支付二维码" />
                  <div class="qr-info">
                    <div>支付金额：¥{{ config.getService(app.currentService)?.price ?? '—' }}</div>
                    <div class="qr-order">订单号：{{ app.currentOrderId }}</div>
                  </div>
                </div>
                <div class="qr-tip">
                  请使用微信扫一扫扫描二维码
                  <br>
                  <span class="qr-tip-sub">扫码后请在微信内完成支付</span>
                </div>
              </div>
              <button v-else type="button" class="pay-btn wechat" @click="goPay">
                <span class="btn-content">
                  <span class="btn-icon">💳</span>
                  前往微信支付
                </span>
              </button>
            </template>
          </template>
          <p v-else class="loading-tip">正在生成订单…</p>
        </div>
        
        <!-- 支付状态提示 -->
        <div class="payment-status">
          <p class="status-text">{{ paymentData?.method === 'alipay' ? '请在新打开的支付宝页面完成支付' : '请使用微信扫码完成支付' }}</p>
          <p class="status-sub">
            支付完成后，页面将自动刷新解锁内容<br>
            如遇问题，可点击下方"我已支付"手动确认
          </p>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button type="button" class="action-btn confirm" @click="confirmPayment">
            <span>我已支付</span>
          </button>
          <button type="button" class="action-btn cancel" @click="close">
            <span>取消支付</span>
          </button>
        </div>
        
        <!-- 安全提示 -->
        <div class="security-tips">
          <p class="tips-title"><strong>安全提示：</strong></p>
          <ul>
            <li>支付过程由官方安全系统保障</li>
            <li>本平台不存储您的支付密码等敏感信息</li>
            <li>支付成功后请及时下载报告，关闭页面后无法找回</li>
            <li>如有问题，请联系客服微信：runzang888</li>
          </ul>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAppStore } from '../stores/app.js'
import { useConfigStore } from '../stores/config.js'
import { usePayment } from '../composables/usePayment.js'
import { checkPaymentAndGetContent } from '../api/payment.js'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'paymentSuccess'])

const app = useAppStore()
const config = useConfigStore()
const { openPayment, unlockWithContent } = usePayment()

const paymentData = ref(null)
const isConfirming = ref(false)

const qrImageUrl = ref('')
watch(() => props.modelValue, async (open) => {
  if (open && app.currentOrderId) {
    paymentData.value = null
    isConfirming.value = false
    try {
      const data = await openPayment()
      paymentData.value = data
      if ((data.codeUrl || data.paymentUrl) && !data.qrCodeUrl) {
        qrImageUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.codeUrl || data.paymentUrl)}`
      }
    } catch (e) {
      alert(e.message || '拉取支付信息失败')
    }
  } else {
    paymentData.value = null
  }
}, { immediate: true })

function goPay() {
  if (paymentData.value?.paymentUrl) {
    // 在新页面打开支付链接
    window.open(paymentData.value.paymentUrl, '_blank')
  }
}

async function confirmPayment() {
  // 先弹出确认对话框
  const confirmed = confirm('如果您已完成支付宝支付，请点击"确定"解锁内容。\n如支付遇到问题，请联系客服微信：runzang888')
  
  if (!confirmed) return
  if (isConfirming.value || !app.currentOrderId) return
  
  isConfirming.value = true
  try {
    console.log('检查支付状态，订单:', app.currentOrderId)
    const result = await checkPaymentAndGetContent(app.currentOrderId)
    console.log('支付状态结果:', result)
    
    const data = result.data
    if (!result.success || !data) {
      alert('支付状态未确认，请稍后再试或联系客服微信：runzang888')
      return
    }
    
    const status = data.status
    const paymentStatus = data.paymentStatus
    
    // 处理不同状态
    if (status === 'processing' || status === 'partial') {
      alert('结果分析未完成，请1分钟后再试')
      return
    }
    if (status === 'failed') {
      alert('结果分析失败，请联系客服微信：runzang888')
      return
    }
    
    if (paymentStatus === 'paid') {
      console.log('✅ 支付验证成功')
      // 直接使用返回的内容解锁，不再重复请求
      unlockWithContent(app.currentOrderId, data.content)
      handlePaymentSuccess()
    } else {
      alert('支付状态未确认，请稍后再试或联系客服微信：runzang888')
    }
  } catch (error) {
    console.error('检查支付状态失败:', error)
    alert(`网络错误: ${error.message}\n请稍后重试或联系客服微信：runzang888`)
  } finally {
    isConfirming.value = false
  }
}

function handlePaymentSuccess() {
  emit('paymentSuccess')
  close()
}

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-box {
  background: #fff;
  border-radius: 12px;
  max-width: 450px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  padding: 20px;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #333;
}

.modal-title {
  color: var(--primary-color);
  text-align: center;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
}

/* 订单信息 */
.order-info {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.order-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #333;
}

.order-info .service-type {
  color: var(--primary-color);
  font-weight: 600;
}

.order-info .amount {
  color: var(--secondary-color);
  font-weight: bold;
  font-size: 16px;
}

.order-info .order-id {
  color: #7d6e63;
  font-family: monospace;
  font-size: 12px;
}

.order-info .pay-method {
  color: #1677FF;
  font-weight: 600;
}

/* 支付按钮区域 */
.payment-methods {
  text-align: center;
  margin: 20px 0;
}

.pay-btn {
  display: block;
  margin: 20px auto;
  max-width: 250px;
  width: 100%;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.pay-btn.alipay {
  background: linear-gradient(135deg, #1677FF, #4096ff);
  color: white;
}

.pay-btn.alipay:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(22, 119, 255, 0.4);
}

.pay-btn.wechat {
  background: linear-gradient(135deg, #09BB07, #2DC100);
  color: white;
}

.pay-btn.wechat:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(9, 187, 7, 0.4);
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon {
  margin-right: 8px;
}

/* 微信二维码 */
.wechat-qr-container {
  text-align: center;
  padding: 20px;
}

.qr-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #07C160;
}

.qr-icon {
  margin-right: 8px;
}

.qr-box {
  background: white;
  padding: 20px;
  border-radius: 10px;
  display: inline-block;
  border: 2px solid #07C160;
}

.qr-box img {
  width: 200px;
  height: 200px;
  border: 1px solid #eee;
}

.qr-info {
  margin-top: 15px;
  color: #333;
  font-size: 14px;
}

.qr-order {
  color: #666;
  font-size: 13px;
  margin-top: 5px;
}

.qr-tip {
  margin-top: 15px;
  color: #999;
  font-size: 14px;
}

.qr-tip-sub {
  color: #07C160;
  font-size: 12px;
}

/* 支付状态提示 */
.payment-status {
  text-align: center;
  margin: 15px 0;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1677FF;
}

.status-text {
  font-size: 14px;
  color: #333;
  margin: 0;
}

.status-sub {
  font-size: 13px;
  color: #7d6e63;
  margin-top: 8px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

.action-btn {
  max-width: 150px;
  flex: 1;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
}

.action-btn.confirm {
  background: linear-gradient(135deg, #5c3d2e, #7d6e63);
}

.action-btn.confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(92, 61, 46, 0.3);
}

.action-btn.cancel {
  background: linear-gradient(135deg, #666, #999);
}

.action-btn.cancel:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 102, 102, 0.3);
}

/* 安全提示 */
.security-tips {
  margin-top: 20px;
  padding: 10px;
  background-color: #fff8e1;
  border-radius: 6px;
  font-size: 12px;
  color: #7d6e63;
  text-align: left;
}

.tips-title {
  margin: 5px 0;
}

.security-tips ul {
  margin: 5px 0;
  padding-left: 20px;
}

.security-tips li {
  margin: 4px 0;
}

.loading-tip {
  color: #666;
  text-align: center;
  padding: 20px;
}

/* 响应式 */
@media (max-width: 480px) {
  .modal-box {
    padding: 15px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-btn {
    max-width: 100%;
  }
}
</style>
