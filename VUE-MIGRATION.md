# Vue 版本迁移说明

本仓库在 **`vue-app/`** 目录下提供基于 **Vue 3 + Pinia + Vite** 的前端实现，与根目录下的原生 JS 版在功能上对应，便于后续用 Vue 栈维护或替换现有页面。

## 快速开始

```bash
cd vue-app
npm install
npm run dev
```

构建生产包：

```bash
cd vue-app
npm run build
# 产出在 vue-app/dist/
```

## 文档与结构

- 详细说明、目录结构、配置方式、与原版对应关系见：**[vue-app/README.md](vue-app/README.md)**。
- 修改接口基址、服务列表等请编辑 `vue-app/src/config/services.js`；完整 `SERVICES` 可从 `js/core/config.js` 复制过去。

## 原版与 Vue 版关系

- 原版：根目录 `index.html` + `js/core/*.js` + `css/styles.css`，继续保留，可单独部署。
- Vue 版：仅 `vue-app/` 目录，独立 `npm install` 与 `npm run build`，产出部署到任意静态 host 或子路径即可。

若需用 Vue 版替代原版，可将构建后的 `vue-app/dist/` 内容发布到当前站点根路径，或通过 Nginx/反向代理将根路径指向 Vue 构建结果。
