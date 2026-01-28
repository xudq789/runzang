<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-mask" @click.self="close">
      <div class="modal-box">
        <div class="modal-header">
          <h3>支付解锁</h3>
          <button type="button" class="modal-close" @click="close">×</button>
        </div>
        <div class="modal-body">
          <p>服务：{{ app.currentService }}</p>
          <p>金额：¥{{ config.getService(app.currentService)?.price ?? '—' }}</p>
          <p>订单号：{{ app.currentOrderId || '—' }}</p>
          <div v-if="paymentData" class="payment-actions">
            <template v-if="paymentData.method === 'alipay'">
              <button type="button" class="pay-btn alipay" @click="goPay">前往支付宝支付</button>
            </template>
            <template v-else>
              <div v-if="paymentData.qrCodeUrl || paymentData.codeUrl" class="qrcode-wrap">
                <img :src="paymentData.qrCodeUrl || qrImageUrl" alt="支付码" />
                <p>请使用微信扫码支付</p>
              </div>
              <button v-else type="button" class="pay-btn wechat" @click="goPay">前往微信支付</button>
            </template>
          </div>
          <p v-else class="loading-tip">正在生成订单…</p>
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

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const app = useAppStore()
const config = useConfigStore()
const { openPayment } = usePayment()

const paymentData = ref(null)

const qrImageUrl = ref('')
watch(() => props.modelValue, async (open) => {
  if (open && app.currentOrderId) {
    paymentData.value = null
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
    window.location.href = paymentData.value.paymentUrl
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal-box { background: #fff; border-radius: 12px; max-width: 420px; width: 100%; max-height: 90vh; overflow: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eee; }
.modal-header h3 { margin: 0; font-size: 1.2rem; color: var(--primary-color); }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
.modal-body { padding: 20px; }
.modal-body p { margin: 8px 0; }
.payment-actions { margin-top: 20px; }
.pay-btn { width: 100%; padding: 14px; border: none; border-radius: 24px; font-size: 16px; font-weight: 600; cursor: pointer; }
.pay-btn.alipay { background: linear-gradient(135deg, #1677FF, #4096ff); color: #fff; }
.pay-btn.wechat { background: linear-gradient(135deg, #09BB07, #2DC100); color: #fff; }
.qrcode-wrap { text-align: center; padding: 16px; }
.qrcode-wrap img { max-width: 200px; height: auto; }
.loading-tip { color: #666; }
</style>
