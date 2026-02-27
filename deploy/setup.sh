#!/bin/bash
# =============================================================
# 导航页一键部署脚本（宝塔面板 / CentOS / Ubuntu）
# 前置：宝塔安装 Node.js 18+ 和 PM2
# =============================================================
set -e

APP_DIR="/www/wwwroot/navigation"

echo "========================================"
echo " 导航页部署脚本 v1.1 (合并模式)"
echo "========================================"

# 1. 检查 Node.js
echo "[1/5] 检查 Node.js..."
node -v

# 2. 安装后端依赖
echo "[2/5] 安装后端依赖..."
cd "$APP_DIR/server"
npm install --production
echo "完成"

# 3. 构建管理后台
echo "[3/5] 构建管理后台（Vue 3）..."
cd "$APP_DIR/admin"
npm install
npm run build
echo "构建完成 → admin/dist/"

# 4. 创建上传目录
echo "[4/5] 创建上传目录..."
mkdir -p "$APP_DIR/server/uploads/icons"
chmod 755 "$APP_DIR/server/uploads"

# 5. 启动 PM2
echo "[5/5] 启动服务..."
cd "$APP_DIR/server"
pm2 delete nav 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "========================================"
echo " 部署完成！"
echo " 架构：Express 统一托管前台+后台+API"
echo " 1. 在宝塔创建站点并粘贴 deploy/nginx.conf"
echo " 2. 访问 https://nav.yourdomain.com/"
echo " 3. 访问 https://nav.yourdomain.com/admin/"
echo " 默认账号：admin / admin123"
echo "========================================"
