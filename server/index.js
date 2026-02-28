// 加载 .env 文件（生产环境在项目目录创建此文件配置敏感变量）
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initDatabase }   = require('./db/init');
const { authMiddleware } = require('./middleware/auth');
const authRoutes         = require('./routes/auth');
const linksRoutes        = require('./routes/links');
const categoriesRoutes   = require('./routes/categories');
const uploadRoutes       = require('./routes/upload');
const backupRoutes       = require('./routes/backup');
const settingsRoutes     = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3721;

// 初始化数据库
initDatabase();

// 安全中间件
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false  // 静态页面中有内联脚本，关闭 CSP 或按需配置
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ══ API 路由（先注册，优先匹配，不会被静态文件拦截）══════════
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: '登录尝试过于频繁，请1分钟后再试' }
});

app.use('/api/auth',       loginLimiter, authRoutes);
app.use('/api/links',      linksRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/backup',     backupRoutes);
app.use('/api/settings',   settingsRoutes);

// Favicon 抓取（返回 Google Favicon 服务链接）
app.get('/api/favicon', authMiddleware, (req, res) => {
  const { url } = req.query;
  if (!url) return res.json({ success: false, message: '缺少 url 参数' });
  try {
    const { hostname } = new URL(url);
    res.json({ success: true, data: { faviconUrl: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64` } });
  } catch {
    res.json({ success: false, message: '无效的 URL' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Navigation server is running', time: new Date().toISOString() });
});

// ══ 静态文件（API 路由之后，不会覆盖 /api/* 路径）════════════

// 上传的图标
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 管理后台 SPA — 先静态资源，再 fallback 处理前端路由
app.use('/admin', express.static(path.join(__dirname, '../admin/dist')));
app.get(['/admin', '/admin/*'], (req, res) =>
  res.sendFile(path.resolve(__dirname, '../admin/dist/index.html'))
);

// 前台展示页 — 根目录静态，兜底返回 index.html
app.use(express.static(path.join(__dirname, '../frontend')));
app.get('*', (req, res) =>
  res.sendFile(path.resolve(__dirname, '../frontend/index.html'))
);

// ══ 错误处理 ═════════════════════════════════════════════════
app.use((err, req, res, _next) => {
  console.error('[Error]', err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`\n✅ Navigation server running → http://localhost:${PORT}`);
  console.log(`   前台：http://localhost:${PORT}/`);
  console.log(`   后台：http://localhost:${PORT}/admin/`);
  console.log(`   API： http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
