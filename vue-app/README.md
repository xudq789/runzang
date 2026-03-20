# 润藏八字 - Vue 3 版本

本目录为润藏八字前端的 Vue 3 重写版本，从 sdev2 目录完整迁移核心功能，采用现代化的 Vue 架构。

## 🎯 迁移状态

**当前完成度：约 80%** ⬆️

- ✅ 核心基础设施（存储、配置、工具）
- ✅ 支付系统（完整流程）
- ✅ 历史记录系统
- ✅ Loading 和 Unlock 组件
- ✅ 全局样式系统
- ✅ **Toast 通知系统（新增）**
- ✅ **环境配置系统（新增）**
- ✅ **Hash 路由管理**
- ⏳ 表单验证增强（待完善）
- ⏳ 结果显示增强（待完善）

详细状态请查看 [MIGRATION-STATUS.md](./MIGRATION-STATUS.md)  
决策完成报告请查看 [DECISIONS-COMPLETED.md](./DECISIONS-COMPLETED.md)

## 技术栈

- **Vue 3.4**（Composition API + `<script setup>`）
- **Pinia 2.1**（状态管理）
- **Vite 5**（构建与开发服务器）

## 目录结构

```
vue-app/
├── src/
│   ├── api/              # 接口封装
│   │   ├── ai.js        # AI 分析、结果拉取、八字解析
│   │   └── payment.js    # 支付下单、支付状态、本地存储
│   ├── composables/      # 组合式逻辑
│   │   ├── useAnalysis.js   # 发起分析、解析结果、更新 store
│   │   └── usePayment.js    # 支付回调、解锁、初始化检查
│   ├── config/
│   │   └── services.js   # 服务配置（API_BASE_URL、SERVICES）
│   ├── stores/
│   │   ├── config.js     # 配置 store（接口基址、服务列表）
│   │   └── app.js        # 应用 store（当前服务、用户数据、分析结果、支付状态等）
│   ├── components/
│   │   ├── DisclaimerBar.vue   # 顶部免责声明滚动条
│   │   ├── ServiceNav.vue      # 测算/流年/详批/合婚 导航
│   │   ├── FormSection.vue     # 信息填写与立即测算
│   │   ├── ResultSection.vue   # 报告区（预测者信息、八字、免费/锁定内容、解锁区）
│   │   └── PaymentModal.vue    # 支付弹窗（支付宝/微信）
│   ├── views/
│   │   └── Home.vue      # 首页：导航 + 英雄图 + 表单 + 结果 + 支付
│   ├── assets/
│   │   └── styles.css    # 全局变量与基础样式
│   ├── App.vue
│   └── main.js
├── index.html
├── vite.config.js
├── package.json
└── README.md（本文件）
```

## 本地运行

在项目根目录下进入 `vue-app` 并安装依赖、启动开发服务器：

```bash
cd vue-app
npm install
npm run dev
```

浏览器打开终端给出的本地地址（通常为 `http://localhost:5173`）即可。

## 构建与部署

```bash
cd vue-app
npm install
npm run build
```

产物在 `vue-app/dist/`。将 `dist` 内所有文件部署到静态服务器或 CDN，入口为 `dist/index.html`。若部署在子路径，需在 `vite.config.js` 中设置 `base: '/子路径/'`。

## 与原版的对应关系

| 原版（仓库根目录）     | Vue 版                            |
|------------------------|-----------------------------------|
| `js/core/config.js`    | `src/config/services.js` + `stores/config.js` |
| `js/core/main.js` 状态 | `stores/app.js`                   |
| `js/core/api.js`       | `src/api/ai.js`（fetch、parseBazi） |
| `js/core/analysis.js`  | `src/api/ai.js`（SERVICE_API_MAP、build、call） |
| `js/core/payment.js`   | `src/api/payment.js` + `composables/usePayment.js` |
| `js/core/ui.js` 各块   | 对应 `DisclaimerBar`、`ServiceNav`、`FormSection`、`ResultSection`、`PaymentModal` |
| 入口 `index.html`+`main.js` | `vue-app/index.html` + `src/main.js` + `App.vue` + `Home.vue` |

## 配置说明

### 服务与接口

- **API 基址**：在 `src/config/services.js` 中修改 `API_BASE_URL`（默认 `https://runzang.top`）。
- **服务配置**：`src/config/services.js` 中的 `SERVICES` 目前为简化结构（图片、价格、lockedItems、prompt 等）。**若要和原版完全一致**，请从根目录 `js/core/config.js` 中复制完整的 `SERVICES` 对象内容，替换 `vue-app/src/config/services.js` 里的 `SERVICES` 导出。

### 支付与密钥

- 支付相关请求使用的 API Key 写在 `src/api/ai.js`、`src/api/payment.js` 的请求头中。若后端更换 Key，需在这两处同步修改。

## 已实现功能

- 四个服务的切换（测算验证、流年运程、人生详批、八字合婚）
- 表单校验与默认值（含伴侣信息在「八字合婚」时显示）
- 调用后端 AI 分析接口，展示订单号与内容
- 免费/锁定内容分段展示与解锁区
- 支付弹窗（支付宝跳转 / 微信扫码由设备判断）
- 支付成功后的 URL 回调处理与本地存储恢复
- 已解锁状态下展示全文、可下载报告
- 重新测算、下载报告（未解锁时引导到支付）

## 🚀 新增功能（从 sdev2 迁移 + 增强）

### 核心功能
- ✅ **完整的存储管理系统**：封装 localStorage，支持订单、支付、历史记录
- ✅ **历史记录系统**：保存、查询、删除、恢复历史订单
- ✅ **支付流程完善**：支付验证、状态轮询、自动解锁
- ✅ **Loading 动画**：多步骤进度显示，按服务定制
- ✅ **解锁界面**：美观的付费内容解锁组件
- ✅ **Toast 通知系统**：替代 alert，美观的消息提示 🆕
- ✅ **环境配置管理**：.env 文件支持多环境 🆕
- ✅ **Hash 路由管理**：轻量级路由实现 🆕

### Composables
- `useStorage.js`：统一存储管理
- `usePayment.js`：支付流程管理
- `useHistory.js`：历史记录管理 + Hash 路由
- `useToast.js`：Toast 通知管理 🆕
- `useAnalysis.js`：AI分析请求（已存在，可增强）

### 新组件
- `LoadingOverlay.vue`：全屏加载动画
- `UnlockSection.vue`：解锁界面组件
- `HistoryPanel.vue`：历史记录面板
- `ToastNotification.vue`：Toast 通知组件 🆕

### 配置系统
- `.env.development`：开发环境配置 🆕
- `.env.production`：生产环境配置 🆕
- `.env.example`：配置模板 🆕

## 📋 待完善功能

### 高优先级
1. **FormSection 增强**：完整的表单验证、城市选择器
2. **ResultSection 增强**：八字排盘显示、大运排盘、报告下载
3. **主应用整合**：将所有新功能集成到 App.vue 和 Home.vue

### 中优先级
1. **错误处理**：创建 Toast 组件替代 alert
2. **移动端优化**：测试和优化响应式布局
3. **SEO优化**：meta 标签管理

详细待办事项请查看 [MIGRATION-STATUS.md](./MIGRATION-STATUS.md#待完成的任务)

## 📚 相关文档

- [迁移状态报告](./MIGRATION-STATUS.md)：详细的迁移进度和功能状态
- [决策完成报告](./DECISIONS-COMPLETED.md)：所有设计决策已完成 ✅
- [实施指南](./IMPLEMENTATION-GUIDE.md)：新功能集成指南 🆕
- [下一步工作](./NEXT-STEPS.md)：完成剩余任务的详细指导
- [迁移总结](./MIGRATION-SUMMARY.md)：完整的迁移总结报告
- [sdev2 原版文档](../sdev2/README.md)：原版实现参考

## 🔧 开发指南

### 使用 Composables

```javascript
// 存储管理
import { useRunzangStorage } from '@/composables/useStorage'
const storage = useRunzangStorage()
storage.setResult('测算验证', 'ORD123', {...})

// 支付管理
import { usePayment } from '@/composables/usePayment'
const payment = usePayment()
await payment.initPaymentCheck()

// 历史记录
import { useHistory } from '@/composables/useHistory'
const history = useHistory()
history.initHistory()

// Toast 通知 🆕
import { useToast } from '@/composables/useToast'
const toast = useToast()
toast.success('操作成功')
toast.error('操作失败', '错误提示')
```

### 组件使用

```vue
<!-- Loading 动画 -->
<LoadingOverlay :show="loading" :serviceName="currentService" />

<!-- 解锁界面 -->
<UnlockSection 
  :lockedItems="items" 
  :price="price" 
  :isUnlocked="unlocked"
  @unlock="handleUnlock" 
/>

<!-- 历史记录 -->
<HistoryPanel :show="showHistory" @close="closeHistory" />

<!-- Toast 通知（在 App.vue 中） -->
<ToastNotification ref="toastRef" />
```

### 环境配置

```bash
# 复制配置模板
cp .env.example .env.development.local

# 编辑配置
VITE_API_BASE_URL=http://localhost:3000
VITE_PAYMENT_GATEWAY_URL=http://localhost:3000
```

详细使用指南请查看 [IMPLEMENTATION-GUIDE.md](./IMPLEMENTATION-GUIDE.md)

## 🤝 贡献指南

1. 优先完成 [MIGRATION-STATUS.md](./MIGRATION-STATUS.md) 中列出的待办任务
2. 遵循 Vue 3 Composition API 最佳实践
3. 使用 `<script setup>` 语法
4. 组件样式优先使用 scoped
5. 提交前测试响应式布局

## 文档与维护

- 本 README 描述当前 Vue 版的结构、运行方式、配置及与原版的对应关系
- 迁移过程中的所有决策和状态记录在对应文档中
- 后续迭代可优先在 `stores/`、`composables/`、`api/` 中增改逻辑，在 `components/`、`views/` 中增改界面，并同步更新此文档
