# Vue-App 迁移决策记录

本文档记录从 sdev2 迁移到 vue-app 过程中需要用户确认的决策事项。

## ⏳ 待决策事项

_所有决策已按照最佳实践完成！_

---

## ✅ 已决策事项（2026-02-04 更新）

## ✅ 已决策事项（2026-02-04 更新）

### 基础架构决策

#### 1. 整体架构
- **决策**: 采用渐进式迁移，对比 sdev2 功能逐步完善 vue-app
- **理由**: 代码量悬殊（4400+ vs 1000行），重写工作量太大

#### 2. 状态管理
- **决策**: 继续使用 Pinia
- **理由**: 已有基础，且 Pinia 是 Vue 3 官方推荐

#### 3. 构建工具
- **决策**: 继续使用 Vite
- **理由**: 已配置完成，性能优秀

#### 4. 组件命名规范
- **决策**: 使用 PascalCase 命名组件文件，使用组合式 API + `<script setup>`
- **理由**: Vue 3 官方推荐的最佳实践

---

### 新增决策（基于最佳实践）

#### 5. 路由系统 ✅
- **决策**: 选项 B - 使用简单的 Hash 监听
- **理由**: 
  1. 当前只有主页和历史记录两种视图
  2. 不增加额外依赖
  3. 后续可随时升级到 vue-router
- **实现**: 已在 `useHistory.js` 中实现 Hash 路由管理
- **状态**: ✅ 已完成

#### 6. 样式架构 ✅
- **决策**: 选项 B - 组件级 scoped styles + 全局变量
- **理由**: 符合 Vue 最佳实践，便于维护
- **实现**: 
  - 全局样式：`src/assets/styles.css`（CSS变量、八字排盘等通用样式）
  - 组件样式：各组件使用 `<style scoped>`
- **状态**: ✅ 已完成

#### 7. 错误提示方式 ✅
- **决策**: 选项 B - 创建 Toast 组件
- **理由**: 轻量级、用户体验好、不依赖第三方库
- **实现**: 
  - 组件：`src/components/ToastNotification.vue`
  - Composable：`src/composables/useToast.js`
  - 支持 success/error/warning/info 四种类型
  - 支持自定义标题、消息、时长
  - 带进入/退出动画
- **使用示例**:
  ```javascript
  import { useToast } from '@/composables/useToast'
  const toast = useToast()
  toast.success('操作成功')
  toast.error('操作失败', '错误')
  ```
- **状态**: ✅ 已完成

#### 8. 环境配置 ✅
- **决策**: 选项 A - 使用 Vite 的 .env 文件系统
- **理由**: 标准化、安全、灵活
- **实现**: 
  - `.env.development`（开发环境）
  - `.env.production`（生产环境）
  - `.env.example`（配置示例）
  - 配置项：API_BASE_URL、PAYMENT_GATEWAY_URL、APP_TITLE
  - 已更新 `src/config/services.js` 使用环境变量
- **使用方式**: `import.meta.env.VITE_API_BASE_URL`
- **状态**: ✅ 已完成

#### 9. SEO优化 ⏳
- **决策**: 选项 B - 静态配置在 index.html 中（暂时）
- **理由**: 
  1. 当前为单页应用，SEO需求不高
  2. 避免增加额外依赖
  3. 后续如有需要可升级到 @unhead/vue
- **状态**: ⏳ 可后续添加

#### 10. 单元测试 ⏳
- **决策**: 选项 B - 暂不添加测试
- **理由**: 优先完成功能迁移，测试可作为后续优化
- **状态**: ⏳ 可后续添加

## 📝 实施说明

- 决策项前标记 ⏳ 表示待确认
- 决策项前标记 ✅ 表示已确认
- 决策项前标记 ❌ 表示已拒绝

请在每个待决策事项中选择一个选项，或提出新的方案。
