<template>
  <div class="unlock-section" :class="{ 'unlocked': isUnlocked }">
    <div class="unlock-header">
      <div class="lock-icon">{{ isUnlocked ? '✅' : '🔒' }}</div>
      <h4>{{ isUnlocked ? '完整报告已解锁' : '完整内容已锁定' }}</h4>
      <p>{{ isUnlocked ? '您可以查看全部命理分析内容' : '解锁完整分析报告，查看全部命理分析内容' }}</p>
    </div>

    <ul class="unlock-items">
      <li
        v-for="(item, index) in lockedItems"
        :key="index"
        :class="{ 'unlocked-item': isUnlocked }"
      >
        <span>{{ isUnlocked ? '✅' : '🔒' }} {{ item }}</span>
      </li>
    </ul>

    <div class="unlock-btn-container">
      <button
        v-if="!isUnlocked"
        class="unlock-btn"
        @click="$emit('unlock')"
        :disabled="disabled"
      >
        解锁完整报告 (¥<span class="price">{{ price }}</span>)
      </button>
      <button
        v-else
        class="unlock-btn unlocked"
        disabled
      >
        ✅ 已解锁完整报告
      </button>
      
      <div class="unlock-price">
        <span v-if="!isUnlocked">
          共包含 <span class="count">{{ lockedItems.length }}</span> 项详细分析
        </span>
        <span v-else class="unlocked-text">
          ✅ 已解锁全部内容
        </span>
      </div>
    </div>

    <!-- 优惠提示 -->
    <div v-if="!isUnlocked && showPromotion" class="promotion-tip">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" stroke-width="2"/>
        <path d="M12 16v-4M12 8h.01" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>限时优惠价格，先到先得</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  lockedItems: {
    type: Array,
    default: () => []
  },
  price: {
    type: Number,
    default: 0.01
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showPromotion: {
    type: Boolean,
    default: true
  }
})

defineEmits(['unlock'])
</script>

<style scoped>
.unlock-section {
  background: linear-gradient(135deg, #fff5e1 0%, #ffe4b5 100%);
  border: 2px solid var(--secondary-color);
  border-radius: 12px;
  padding: 30px;
  margin: 30px 0;
  text-align: center;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
  transition: all 0.3s;
}

.unlock-section.unlocked {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-color: var(--success-color);
}

.unlock-header {
  margin-bottom: 25px;
}

.lock-icon {
  font-size: 48px;
  margin-bottom: 15px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.unlock-header h4 {
  font-size: 24px;
  color: var(--primary-color);
  margin: 0 0 10px 0;
  font-weight: 600;
}

.unlock-header p {
  font-size: 15px;
  color: #7d6e63;
  margin: 0;
}

.unlock-items {
  list-style: none;
  padding: 0;
  margin: 0 0 30px 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  text-align: left;
}

.unlock-items li {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #f0e6d2;
  transition: all 0.3s;
}

.unlock-items li:hover {
  transform: translateX(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.unlock-items li.unlocked-item {
  background: #f1f8e9;
  border-color: #c5e1a5;
}

.unlock-items li span {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.unlock-btn-container {
  margin-top: 25px;
}

.unlock-btn {
  background: linear-gradient(135deg, var(--secondary-color), #e6b800);
  color: white;
  border: none;
  padding: 16px 40px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
  margin-bottom: 15px;
}

.unlock-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
}

.unlock-btn:active:not(:disabled) {
  transform: translateY(0);
}

.unlock-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.unlock-btn.unlocked {
  background: linear-gradient(135deg, var(--success-color), #28c76f);
  cursor: default;
}

.unlock-btn .price {
  font-weight: 700;
  font-size: 20px;
}

.unlock-price {
  font-size: 14px;
  color: #7d6e63;
}

.unlock-price .count {
  font-weight: 600;
  color: var(--primary-color);
}

.unlock-price .unlocked-text {
  color: var(--success-color);
  font-weight: 600;
}

.promotion-tip {
  margin-top: 20px;
  padding: 12px 20px;
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #ff9800;
  font-size: 14px;
  font-weight: 500;
}

.promotion-tip svg {
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .unlock-section {
    padding: 20px;
  }

  .lock-icon {
    font-size: 36px;
  }

  .unlock-header h4 {
    font-size: 20px;
  }

  .unlock-header p {
    font-size: 14px;
  }

  .unlock-items {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .unlock-btn {
    padding: 14px 30px;
    font-size: 16px;
    width: 100%;
  }

  .promotion-tip {
    font-size: 13px;
    padding: 10px 15px;
  }
}
</style>
