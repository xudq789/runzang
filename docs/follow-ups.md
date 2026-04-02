# 跟进与待确认（润藏前端 / 支付相关）

**扩展计划与已落地项见：** [IMPROVEMENT-ROADMAP.md](./IMPROVEMENT-ROADMAP.md)

## 协作约定（你已授权）

- **需要确认时**：由助手在合理范围内**自动选择默认方案并继续执行**，不阻塞进度。
- **无法确定时**：将问题简要记在本文件，你休息或方便时再处理。

---

## 当前无法远程替你拍板、建议上线后自验的项

1. **支付宝异步通知**  
   依赖服务端已部署 `express.urlencoded` 与验签。若后台仍不更新：看 Node 日志是否有「验签失败」、Nginx 是否把 `POST /api/payment/notify/alipay` 原样转到 Node（含 form 正文）。

2. **支付宝公钥与开放平台**  
   若验签持续失败，需在支付宝开放平台核对应用公钥 / 你方配置的 `alipayPublicKey` 是否一致（助手不能代你登录商户后台）。

3. **微信 H5（手机浏览器）**  
   需在真机、不同浏览器（含微信内置浏览器）点「微信支付」试一单，确认跳转与回调；商户号产品权限（H5）以微信侧为准。

4. **历史订单时间**  
   修复前若已用错误时间写入 MongoDB，列表里旧数据可能仍偏；新订单应以北京时间展示为准。

---

## 相关代码位置（便于排查）

- 网站前端：`js/core/ui-payment.js`、`index.html`  
- 支付后端：`payment-backend/src/app.js`（`urlencoded`）、`controllers/alipay.controller.js`、`controllers/wechatpay.controller.js`  
- 管理后台时间：`payment-backend/admin/src/utils/formatDateTime.js`

---

*本文件由助手按你的要求维护；确认某条已解决后可自行删除对应条目。*
