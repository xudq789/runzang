# 润藏八字 - Vue 3 版本

本目录为润藏八字前端的 Vue 3 重写版本，与仓库根目录下的原生 JS 版功能对应，便于后续维护与扩展。

## 技术栈

- **Vue 3**（Composition API + `<script setup>`）
- **Pinia**（状态管理）
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
│   │   ├── FormSection.vue     # 信息填写与开始分析
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

## 待完善或可扩展点

- **样式**：当前仅保留基础变量和布局，精细样式（含原 `css/styles.css` 中的大运、报告排版等）可按需从原版迁移或重写。
- **错误提示**：目前多为 `alert`，可改为 Toast / 内联提示组件。
- **加载态**：分析中可增加全屏或局部 loading 组件。
- **SEO**：若需与原版一致的 meta、标题、H1，可在 `index.html` 或通过 `vue-meta`/`@unhead/vue` 在路由或页面内设置。
- **路由**：当前为单页，未使用 `vue-router`。若增加「结果页」「支付结果页」等，再引入路由并在 `main.js` 中挂载即可。

## 文档与维护

- 本 README 描述当前 Vue 版的结构、运行方式、配置及与原版的对应关系。
- 后续迭代可优先在 `stores/`、`composables/`、`api/` 中增改逻辑，在 `components/`、`views/` 中增改界面，并同步更新此文档。
