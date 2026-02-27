# 🧭 个人导航页

高性能、风格统一的个人导航页，含前台展示与后台管理，仅管理员可编辑。

蓝白主色、卡片布局、极简现代风，专注导航核心。

---

## 功能特性

- **前台**：分组卡片展示、实时全文搜索、暗色模式、移动端响应式
- **后台**：链接 / 分类的增删改查、favicon 自动抓取、图标上传、数据备份导入导出
- **安全**：JWT 认证、bcrypt 密码、API 限流、Helmet 安全头

## 技术栈

| 层级 | 技术 |
|------|------|
| 前台展示 | 纯 HTML + CSS + Vanilla JS（无框架，< 50KB）|
| 管理后台 | Vue 3 + Vite + Pinia + Vue Router |
| 后端 API | Node.js + Express |
| 数据库   | SQLite（better-sqlite3）|
| 认证     | JWT + bcrypt |
| 部署     | 宝塔面板 Nginx + PM2 |

## 项目结构

```
navigation/
├── frontend/        # 前台展示页（纯静态）
├── admin/           # 后台管理（Vue 3 SPA）
├── server/          # 后端 API（Express）
├── deploy/          # 部署配置（Nginx + setup.sh）
└── README.md
```

## 快速开始

### 本地开发

```bash
# 1. 安装所有依赖
cd server && npm install
cd ../admin && npm install

# 2. 构建管理后台 SPA（首次和后台代码变更后执行）
npm run build    # 在 admin/ 目录

# 3. 启动服务（回到根目录）
cd ..
npm start
# 前台：http://localhost:3721/
# 后台：http://localhost:3721/admin/
# API： http://localhost:3721/api/health
```

> **管理后台开发模式**：可以单独运行 `cd admin && npm run dev`，Vite 开发服务器启动在 `:5173` 并自动代理 `/api` 到 `:3721`。

---

## 宝塔部署

### 前置条件

- 宝塔面板已安装 Node.js **18+**
- 安装 PM2（宝塔软件商店 → Node.js 管理器 → PM2）

### 部署步骤

```bash
# 1. 上传项目到服务器
scp -r ./navigation user@server:/www/wwwroot/

# 2. 运行一键部署脚本
cd /www/wwwroot/navigation
chmod +x deploy/setup.sh
./deploy/setup.sh

# 3. 在宝塔面板创建站点 nav.yourdomain.com
# 4. 将 deploy/nginx.conf 内容粘贴到站点 Nginx 配置
# 5. 申请 SSL 证书（Let's Encrypt）并重载 Nginx
```

### Nginx 配置要点

仅需一条 `proxy_pass`，Express 负责所有路由：

```nginx
location / {
    proxy_pass http://127.0.0.1:3721;
    # ... 其他标准行
}
```

### 修改默认密码

编辑 `server/ecosystem.config.js`：

```js
env: {
  JWT_SECRET: 'your-very-long-random-secret',  // 必改！
  ADMIN_DEFAULT_PASSWORD: 'your-password',      // 首次启动时导入
  CORS_ORIGIN: 'https://nav.yourdomain.com'
}
```

修改后重启：`pm2 restart nav`

---

## API 文档

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/login | 登录 | 否 |
| POST | /api/auth/change-password | 修改密码 | ✓ |
| GET  | /api/links | 获取全部链接 | 否 |
| POST | /api/links | 新增链接 | ✓ |
| PUT  | /api/links/:id | 修改链接 | ✓ |
| DELETE | /api/links/:id | 删除链接 | ✓ |
| PUT  | /api/links/sort | 批量排序 | ✓ |
| GET  | /api/categories | 获取全部分类 | 否 |
| POST | /api/categories | 新增分类 | ✓ |
| PUT  | /api/categories/:id | 修改分类 | ✓ |
| DELETE | /api/categories/:id | 删除分类 | ✓ |
| POST | /api/upload/icon | 上传图标 | ✓ |
| GET  | /api/favicon?url= | 抓取 favicon | ✓ |
| POST | /api/backup/export | 导出数据 | ✓ |
| POST | /api/backup/import | 导入数据 | ✓ |

---

*v1.0 · 2026-02-27*
