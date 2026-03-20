# 跨域（CORS）说明与本地开发方案

页面从 `http://runzang.localhost.com` 访问接口 `https://runzang.top/api/payment/*` 时属于跨域，**CORS 由接口所在域名（runzang.top）的服务端控制**，前端无法通过代码绕过。

## 方案一：服务端开启 CORS（推荐生产环境）

在 **runzang.top 的 API 服务** 上对 `/api/payment/*` 增加 CORS 响应头，允许本地/指定来源访问。

### 响应头示例

```
Access-Control-Allow-Origin: http://runzang.localhost.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, X-API-Key
Access-Control-Max-Age: 86400
```

开发时可临时使用 `Access-Control-Allow-Origin: *`（生产环境建议写具体域名）。

### Node/Express 示例

```js
app.use('/api/payment', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', 'http://runzang.localhost.com');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
```

### Nginx 反向代理到后端时加头

```nginx
location /api/payment/ {
  add_header Access-Control-Allow-Origin "http://runzang.localhost.com";
  add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
  add_header Access-Control-Allow-Headers "Content-Type, X-API-Key";
  if ($request_method = OPTIONS) { return 204; }
  proxy_pass https://runzang.top;
  # ... 其他 proxy_ 配置
}
```

---

## 方案二：本地反向代理（推荐本地开发）

不依赖 runzang.top 改 CORS，在本地用反向代理把 `/api/payment` 转到 `https://runzang.top/api/payment`，浏览器只请求同源，无跨域。

本仓库已在 **localhost / runzang.localhost.com** 下自动使用同源：`当前域名 + /api/payment`，因此只需在本地服务器上配置代理即可。

### Nginx 本地代理示例

在本地 Nginx 中为 `runzang.localhost.com` 的 server 增加：

```nginx
server {
  listen 80;
  server_name runzang.localhost.com;
  root /path/to/runzang;   # 项目根目录，能访问到 sdev2/index.html
  index index.html;

  # 支付接口代理到 runzang.top，避免跨域
  location /api/payment/ {
    proxy_pass https://runzang.top/api/payment/;
    proxy_set_header Host runzang.top;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_ssl_server_name on;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

重启 Nginx 后，访问 `http://runzang.localhost.com/sdev2/index.html` 时，健康检查等请求会发到 `http://runzang.localhost.com/api/payment/health`，由 Nginx 转发到 `https://runzang.top/api/payment/health`，浏览器侧为同源请求，不会触发 CORS。

### 其他本地工具

- **Vite**：在 `vite.config.js` 里配置 `server.proxy` 把 `/api/payment` 代理到 `https://runzang.top`。
- **Node (http-proxy)**：用中间件把 `/api/payment` 转发到 `https://runzang.top`。

配置完成后，无需改前端代码，`js/core/config.js` 在本地已自动使用同源 `/api/payment`。
