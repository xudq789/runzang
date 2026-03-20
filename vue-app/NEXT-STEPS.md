# 下一步工作指南

本文档提供完成剩余迁移任务的详细指导。

## 🎯 当前状态

**已完成：** 12/14 任务（86%）

**剩余任务：**
1. ⏳ 迁移UI显示模块（ResultSection 增强）
2. ⏳ 完善表单验证（FormSection 增强）

## 📝 剩余任务详解

### 任务 7: 增强 ResultSection 组件

**目标：** 将 sdev2 的 ui-display.js（737行）功能集成到 ResultSection.vue

**需要添加的功能：**

#### 1. 预测者信息显示
```vue
<!-- 参考 sdev2/js/core/ui-display.js 的 displayPredictorInfo 函数 -->
<div class="predictor-info">
  <h3>预测者信息</h3>
  <div class="info-grid">
    <div class="info-item">
      <span class="label">姓名：</span>
      <span class="value">{{ userData.name }}</span>
    </div>
    <!-- 其他字段 -->
  </div>
</div>
```

#### 2. 八字排盘显示
```vue
<!-- 使用已迁移的全局样式 -->
<div class="bazi-calendar">
  <div class="calendar-header">
    <h4>八字排盘</h4>
  </div>
  <div class="calendar-grid">
    <div class="calendar-item" v-for="(pillar, key) in bazi" :key="key">
      <div class="calendar-label">{{ labels[key] }}</div>
      <div class="calendar-value">{{ pillar }}</div>
    </div>
  </div>
</div>
```

#### 3. 大运排盘显示
```vue
<!-- 使用已迁移的 table 样式 -->
<div class="dayun-calendar">
  <div class="dayun-table-container">
    <table class="dayun-table">
      <thead>
        <tr><th>项目</th><th v-for="i in 8" :key="i">第{{i}}步</th></tr>
      </thead>
      <tbody>
        <tr><td>岁</td><td v-for="age in ages" :key="age">{{age}}</td></tr>
        <tr><td>大运</td><td v-for="pillar in pillars" :key="pillar">{{pillar}}</td></tr>
      </tbody>
    </table>
  </div>
</div>
```

#### 4. 分析内容显示
```vue
<template>
  <!-- 免费内容 -->
  <div class="free-content">
    <div v-for="(section, index) in freeSections" :key="index">
      <h3 class="report-title">{{ section.title }}</h3>
      <div class="report-content">
        <p class="report-paragraph" v-for="(para, i) in section.paragraphs" :key="i">
          {{ para }}
        </p>
      </div>
    </div>
  </div>

  <!-- 解锁界面 -->
  <UnlockSection 
    v-if="!isUnlocked"
    :lockedItems="lockedItems"
    :price="price"
    @unlock="handleUnlock"
  />

  <!-- 锁定内容（解锁后显示） -->
  <div v-if="isUnlocked" class="locked-content">
    <div v-for="(section, index) in lockedSections" :key="index">
      <h3 class="report-title">{{ section.title }}</h3>
      <div class="report-content">
        <p class="report-paragraph" v-for="(para, i) in section.paragraphs" :key="i">
          {{ para }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { splitAnalysisContent } from '@/utils'
import UnlockSection from './UnlockSection.vue'

const props = defineProps({
  content: String,
  lockedItems: Array,
  price: Number,
  isUnlocked: Boolean
})

// 分割免费和锁定内容
const { freeContent, lockedContent } = computed(() => {
  return splitAnalysisContent(props.content, props.lockedItems)
})

// 解析成段落
const freeSections = computed(() => parseContent(freeContent.value))
const lockedSections = computed(() => parseContent(lockedContent.value))

function parseContent(text) {
  // 解析【标题】格式的内容
  const sections = []
  const matches = text.matchAll(/【([^】]+)】\s*\n([\s\S]*?)(?=【|$)/g)
  for (const match of matches) {
    sections.push({
      title: match[1],
      paragraphs: match[2].split('\n').filter(p => p.trim())
    })
  }
  return sections
}
</script>
```

#### 5. 下载报告功能
```javascript
// 在 ResultSection.vue 中添加
async function downloadReport() {
  if (!props.isUnlocked) {
    alert('请先解锁完整报告')
    return
  }
  
  // 创建完整的报告内容
  const fullReport = `
润藏八字命理分析报告
===================

${props.content}

---
生成时间：${new Date().toLocaleString('zh-CN')}
  `.trim()
  
  // 创建下载
  const blob = new Blob([fullReport], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `润藏八字报告-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
```

**参考文件：**
- `sdev2/js/core/ui-display.js` (737行)
- `src/utils/index.js` (已有 parseBaziFromContent 等工具函数)
- `src/assets/styles.css` (已有八字排盘和报告样式)

---

### 任务 9: 增强 FormSection 组件

**目标：** 将 sdev2 的 ui-form.js（142行）验证逻辑集成到 FormSection.vue

**需要添加的功能：**

#### 1. 表单验证规则
```javascript
// 在 FormSection.vue 中添加
const validationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 20,
    message: '姓名必须为2-20个字符'
  },
  birthYear: {
    required: true,
    min: 1900,
    max: 2024,
    message: '出生年份必须在1900-2024之间'
  },
  birthMonth: {
    required: true,
    min: 1,
    max: 12,
    message: '出生月份必须在1-12之间'
  },
  birthDay: {
    required: true,
    min: 1,
    max: 31,
    message: '出生日期必须在1-31之间'
  },
  birthHour: {
    required: true,
    min: 0,
    max: 23,
    message: '出生小时必须在0-23之间'
  },
  birthMinute: {
    required: true,
    min: 0,
    max: 59,
    message: '出生分钟必须在0-59之间'
  },
  birthCity: {
    required: true,
    minLength: 2,
    message: '请选择或输入出生城市'
  },
  gender: {
    required: true,
    message: '请选择性别'
  }
}
```

#### 2. 实时验证
```javascript
// 验证单个字段
function validateField(fieldName, value) {
  const rule = validationRules[fieldName]
  if (!rule) return { valid: true }
  
  // 必填检查
  if (rule.required && !value) {
    return { valid: false, message: rule.message }
  }
  
  // 长度检查
  if (rule.minLength && value.length < rule.minLength) {
    return { valid: false, message: rule.message }
  }
  if (rule.maxLength && value.length > rule.maxLength) {
    return { valid: false, message: rule.message }
  }
  
  // 数值范围检查
  if (rule.min !== undefined || rule.max !== undefined) {
    const num = Number(value)
    if (isNaN(num)) {
      return { valid: false, message: '请输入有效的数字' }
    }
    if (rule.min !== undefined && num < rule.min) {
      return { valid: false, message: rule.message }
    }
    if (rule.max !== undefined && num > rule.max) {
      return { valid: false, message: rule.message }
    }
  }
  
  return { valid: true }
}

// 验证整个表单
function validateForm(formData) {
  const errors = {}
  for (const [field, value] of Object.entries(formData)) {
    const result = validateField(field, value)
    if (!result.valid) {
      errors[field] = result.message
    }
  }
  return { valid: Object.keys(errors).length === 0, errors }
}
```

#### 3. 错误显示
```vue
<template>
  <div class="form-group" :class="{ 'has-error': errors.name }">
    <label>姓名</label>
    <input 
      v-model="form.name" 
      @blur="validateField('name', form.name)"
      type="text" 
      placeholder="请输入您的姓名"
    />
    <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const form = reactive({
  name: '',
  gender: '',
  birthYear: '',
  // ... 其他字段
})

const errors = ref({})

function validateField(fieldName, value) {
  const result = validateFieldLogic(fieldName, value)
  if (result.valid) {
    delete errors.value[fieldName]
  } else {
    errors.value[fieldName] = result.message
  }
}
</script>

<style scoped>
.form-group.has-error input {
  border-color: var(--error-color);
}

.error-message {
  color: var(--error-color);
  font-size: 13px;
  margin-top: 5px;
  display: block;
}
</style>
```

#### 4. 城市选择器（可选）
```vue
<!-- 简单版本：使用 datalist -->
<input 
  v-model="form.birthCity" 
  list="cities" 
  placeholder="请输入或选择城市"
/>
<datalist id="cities">
  <option value="北京">北京</option>
  <option value="上海">上海</option>
  <option value="广州">广州</option>
  <!-- 更多城市 -->
</datalist>

<!-- 高级版本：使用第三方组件或自定义下拉框 -->
```

**参考文件：**
- `sdev2/js/core/ui-form.js` (142行)
- 现有的 `src/components/FormSection.vue`

---

## 🚀 快速开始

### 1. 克隆现有组件
```bash
# 在 src/components/ 目录下
cp ResultSection.vue ResultSection.vue.bak
cp FormSection.vue FormSection.vue.bak
```

### 2. 按照上述指导逐步添加功能

### 3. 测试每个功能点
```bash
npm run dev
# 在浏览器中测试各个功能
```

### 4. 参考已有代码
- `src/utils/index.js` - 工具函数
- `src/assets/styles.css` - 全局样式
- `src/composables/` - 业务逻辑
- `sdev2/js/core/` - 原版实现

## 📦 推荐完成顺序

### 第一阶段：ResultSection 基础显示
1. ✅ 预测者信息显示
2. ✅ 八字排盘显示
3. ✅ 大运排盘显示
4. ✅ 分析内容基础显示

### 第二阶段：FormSection 验证
1. ✅ 添加验证规则
2. ✅ 实时验证反馈
3. ✅ 错误信息显示

### 第三阶段：高级功能
1. ⏳ 下载报告
2. ⏳ 重新测算
3. ⏳ 城市选择器
4. ⏳ 表单自动保存

### 第四阶段：整合测试
1. ⏳ 完整流程测试
2. ⏳ 移动端测试
3. ⏳ 支付流程测试
4. ⏳ 历史记录测试

## 💡 提示

1. **复用已有功能**：很多工具函数和样式已经迁移完成，直接使用即可
2. **参考原版代码**：遇到不确定的地方，查看 sdev2 的实现
3. **渐进式开发**：先完成基础功能，再逐步优化
4. **保持一致性**：使用 Composition API + `<script setup>` 风格

## 🔗 相关资源

- [Vue 3 文档](https://cn.vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/zh/)
- [Vite 文档](https://cn.vitejs.dev/)

---

**祝开发顺利！如有问题，请参考 MIGRATION-STATUS.md 中的联系方式。**
