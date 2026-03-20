# 实施指南

本文档说明如何将新实现的功能集成到应用中。

## ✅ 已完成的决策实施

### 1. Toast 通知组件 ✅

#### 文件结构
```
src/
├── components/
│   └── ToastNotification.vue  # Toast 组件（新增）
└── composables/
    └── useToast.js            # Toast Composable（新增）
```

#### 使用步骤

**Step 1: 在 App.vue 中集成 Toast 组件**

```vue
<template>
  <div id="app">
    <!-- 其他内容 -->
    
    <!-- Toast 通知组件 -->
    <ToastNotification ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ToastNotification from './components/ToastNotification.vue'
import { setToastInstance } from './composables/useToast'

const toastRef = ref(null)

onMounted(() => {
  // 设置全局 Toast 实例
  setToastInstance(toastRef.value)
})
</script>
```

**Step 2: 在任何组件中使用 Toast**

```vue
<script setup>
import { useToast } from '@/composables/useToast'

const toast = useToast()

// 使用方式 1: 快捷方法
function handleSuccess() {
  toast.success('操作成功')
}

function handleError() {
  toast.error('操作失败', '错误提示')
}

function handleWarning() {
  toast.warning('请注意')
}

function handleInfo() {
  toast.info('提示信息')
}

// 使用方式 2: 完整配置
function showCustomToast() {
  toast.show({
    message: '自定义消息',
    title: '标题',
    type: 'success',
    duration: 5000  // 5秒后自动关闭
  })
}
</script>
```

**Step 3: 替换现有的 alert 调用**

```javascript
// 之前
alert('操作成功')

// 现在
toast.success('操作成功')

// 之前
alert('操作失败：' + error.message)

// 现在
toast.error(error.message, '操作失败')
```

#### Toast API

```javascript
// 基础方法
toast.success(message, title?)    // 成功消息（绿色）
toast.error(message, title?)      // 错误消息（红色）
toast.warning(message, title?)    // 警告消息（橙色）
toast.info(message, title?)       // 信息消息（蓝色）

// 完整配置
toast.show({
  message: string,    // 必填：消息内容
  title: string,      // 可选：标题
  type: string,       // 可选：success/error/warning/info，默认 info
  duration: number    // 可选：显示时长（毫秒），默认 3000，设为 0 则不自动关闭
})

// 清空所有 Toast
toast.clear()
```

---

### 2. 环境配置系统 ✅

#### 文件结构
```
vue-app/
├── .env.development     # 开发环境配置（新增）
├── .env.production      # 生产环境配置（新增）
├── .env.example         # 配置示例（新增）
└── .gitignore           # 已更新，排除 .env 文件
```

#### 配置说明

**可用的环境变量：**

```bash
# API 基础地址
VITE_API_BASE_URL=https://runzang.top

# 支付网关地址
VITE_PAYMENT_GATEWAY_URL=https://runzang.top

# 应用标题
VITE_APP_TITLE=润藏八字命理分析平台
```

**在代码中使用：**

```javascript
// 直接访问
const apiUrl = import.meta.env.VITE_API_BASE_URL

// 在 config/services.js 中已自动配置
import { API_BASE_URL, PAYMENT_CONFIG, APP_TITLE } from '@/config/services'
```

**本地开发自定义配置：**

1. 复制 `.env.example` 为 `.env.development.local`
2. 修改配置值（不会被 git 跟踪）

```bash
cp .env.example .env.development.local
# 然后编辑 .env.development.local
```

---

### 3. 路由系统（Hash 监听）✅

#### 已实现
在 `src/composables/useHistory.js` 中已实现 Hash 路由管理：

```javascript
import { useHistory } from '@/composables/useHistory'

const history = useHistory()

// 初始化（监听 Hash 变化）
history.initHistory()

// 切换到历史记录视图
history.showHistoryView('测算验证')  // URL: #history-测算验证

// 切换回主视图
history.showMainView()  // URL: /

// 组件卸载时清理
onBeforeUnmount(() => {
  history.cleanup()
})
```

#### 在 Home.vue 中使用

```vue
<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useHistory } from '@/composables/useHistory'

const history = useHistory()

onMounted(() => {
  history.initHistory()
})

onBeforeUnmount(() => {
  history.cleanup()
})
</script>
```

---

### 4. 样式架构 ✅

#### 已实现
- **全局样式**: `src/assets/styles.css`（CSS变量、通用样式）
- **组件样式**: 各组件使用 `<style scoped>`

#### 使用建议

**全局样式（适用于）:**
- CSS 变量
- 通用工具类
- 八字排盘、大运排盘等跨组件复用的样式
- 重置样式

**组件样式（适用于）:**
- 组件特定的样式
- 不需要全局共享的样式

**示例：**

```vue
<template>
  <div class="my-component">
    <!-- 使用全局样式类 -->
    <div class="bazi-calendar">
      <div class="calendar-grid">
        <!-- ... -->
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 组件特定样式 */
.my-component {
  padding: 20px;
}

/* 可以访问全局 CSS 变量 */
.my-component h2 {
  color: var(--primary-color);
}
</style>
```

---

## 📋 集成检查清单

### Toast 组件集成
- [ ] 在 `App.vue` 中添加 `ToastNotification` 组件
- [ ] 在 `App.vue` 中调用 `setToastInstance()`
- [ ] 将现有的 `alert()` 替换为 `toast.success()` 等
- [ ] 测试各种类型的 Toast 通知

### 环境配置验证
- [ ] 检查 `.env.development` 文件是否存在
- [ ] 检查 `.env.production` 文件是否存在
- [ ] 验证 `import.meta.env.VITE_*` 变量可以正常访问
- [ ] 测试开发和生产环境构建

### 路由功能验证
- [ ] 在 `Home.vue` 中初始化 `useHistory()`
- [ ] 测试历史记录视图切换
- [ ] 验证浏览器前进/后退按钮
- [ ] 测试 URL Hash 是否正确更新

---

## 🚀 完整的 App.vue 示例

```vue
<template>
  <div id="app">
    <!-- 免责声明 -->
    <DisclaimerBar />
    
    <!-- 导航栏 -->
    <header>
      <ServiceNav />
    </header>
    
    <!-- 主要内容 -->
    <main>
      <router-view />  <!-- 或者直接放 Home 组件 -->
    </main>
    
    <!-- Toast 通知 -->
    <ToastNotification ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DisclaimerBar from './components/DisclaimerBar.vue'
import ServiceNav from './components/ServiceNav.vue'
import ToastNotification from './components/ToastNotification.vue'
import { setToastInstance } from './composables/useToast'

const toastRef = ref(null)

onMounted(() => {
  // 初始化 Toast
  setToastInstance(toastRef.value)
  
  // 其他初始化逻辑...
})
</script>

<style>
@import './assets/styles.css';

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
```

---

## 🔗 相关文档

- [Toast 组件实现](./src/components/ToastNotification.vue)
- [useToast Composable](./src/composables/useToast.js)
- [环境变量配置](./.env.example)
- [决策文档](./MIGRATION-DECISIONS.md)

---

**更新时间：** 2026-02-04
