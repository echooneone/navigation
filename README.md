# 个人导航页

高性能、风格统一的个人导航页，含前台展示与后台管理，仅管理员可编辑。

蓝白主色、卡片布局、极简现代风，专注导航核心。

---

## 功能特性

- **前台**：分组卡片展示、实时全文搜索、暗色模式、移动端响应式
- **后台**：链接 / 分类的增删改查、favicon 自动抓取并缓存到服务器、图标上传、数据备份导入导出
- **安全**：JWT 认证、bcrypt 密码、API 限流、Helmet 安全头
- **登录**：仅密码登录（单管理员，无需用户名）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前台展示 | 纯 HTML + CSS + Vanilla JS（无框架，< 50 KB）|
| 管理后台 | Vue 3 + Vite + Pinia + Vue Router |
| 后端 API | Node.js + Express |
| 数据库   | SQLite（better-sqlite3）|
| 认证     | JWT + bcrypt |
| 配置     | dotenv（`.env` 文件）|

## 项目结构

```
navigation/
├── frontend/          # 前台展示页（纯静态）
├── admin/             # 后台管理（Vue 3 SPA）
│   └── src/
├── server/            # 后端 API（Express）
│   ├── index.js       # 入口，同时托管前台和后台静态文件
│   ├── .env.example   # 环境变量模板
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   └── uploads/
├── build-deploy.bat   # Windows 一键构建 + 打包脚本
└── README.md
```

---

## 本地开发

```bash
# 安装依赖
cd server && npm install
cd ../admin && npm install

# 启动后端（根目录）
npm start
# 前台：http://localhost:3721/
# 后台：http://localhost:3721/admin/
# API： http://localhost:3721/api/health
```

> 管理后台独立开发：`cd admin && npm run dev`，Vite 起在 `:5173` 并自动代理 `/api` 到 `:3721`。

---

## 打包部署（一键）

双击 `build-deploy.bat`：

1. 自动执行 `admin npm run build` 构建 Vue 3 后台
2. 将 `server/`、`admin/dist/`、`frontend/` 打入 zip
3. 输出 `navigation-deploy-YYYYMMDD_HHMM.zip`

---

## 宝塔部署

### 前置条件

- 宝塔面板已安装 **Node.js 18+**

### 部署步骤

1. 上传 zip 到服务器，解压到 `/www/wwwroot/navigation/`

2. 宝塔「文件管理器」进入 `/www/wwwroot/navigation/server/`，  
   将 `.env.example` 复制为 `.env`，按需修改：

   ```dotenv
   # 必改：防止 Token 伪造
   JWT_SECRET=换成随机长字符串

   # 初始登录密码（首次启动前改好，之后进后台修改）
   ADMIN_DEFAULT_PASSWORD=your-password

   # 服务端口
   PORT=3721
   ```

   > `.env` 中的密码仅在 `db/navigation.db` **不存在时**（首次启动）生效。  
   > 若数据库已存在，请登录后台手动修改密码，或删除 `db/navigation.db` 重新初始化。

3. 宝塔终端执行：

   ```bash
   cd /www/wwwroot/navigation/server
   npm install --production
   ```

4. 宝塔 → **Node.js 项目管理器** → 添加项目：

   | 字段 | 值 |
   |------|----|
   | 项目目录 | `/www/wwwroot/navigation/server` |
   | 启动文件 | `index.js` |
   | 端口 | `3721` |
   | 域名 | 填写你的域名（宝塔自动创建反向代理） |

---

## API 文档

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/login | 登录（仅需密码）| 否 |
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
| GET  | /api/favicon/cache?url= | 抓取并缓存 favicon 到服务器 | ✓ |
| POST | /api/backup/export | 导出数据 | ✓ |
| POST | /api/backup/import | 导入数据 | ✓ |

---

*v1.1 · 2026-02-28*
