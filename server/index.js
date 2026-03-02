// 加载 .env 文件（生产环境在项目目录创建此文件配置敏感变量）
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

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

const ICON_DIR = path.join(__dirname, 'uploads/icons');
if (!fs.existsSync(ICON_DIR)) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
}

function normalizeHostname(inputUrl) {
  const { hostname } = new URL(inputUrl);
  return hostname.toLowerCase();
}

function safeHost(hostname) {
  return hostname.replace(/[^a-z0-9.-]/g, '_');
}

function iconExtFromType(contentType = '') {
  if (contentType.includes('image/png')) return '.png';
  if (contentType.includes('image/jpeg')) return '.jpg';
  if (contentType.includes('image/svg+xml')) return '.svg';
  if (contentType.includes('image/webp')) return '.webp';
  if (contentType.includes('image/x-icon') || contentType.includes('image/vnd.microsoft.icon')) return '.ico';
  if (contentType.includes('image/gif')) return '.gif';
  return '.png';
}

async function fetchAndCacheFaviconByUrl(inputUrl) {
  const hostname = normalizeHostname(inputUrl);
  const hostKey = safeHost(hostname);

  const existed = fs.readdirSync(ICON_DIR)
    .find((name) => name.startsWith(`auto_${hostKey}.`));
  if (existed) {
    return `/uploads/icons/${existed}`;
  }

  const upstream = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  const response = await fetch(upstream);
  if (!response.ok) {
    throw new Error(`抓取 favicon 失败: HTTP ${response.status}`);
  }

  const ext = iconExtFromType(response.headers.get('content-type') || '');
  const filename = `auto_${hostKey}${ext}`;
  const targetPath = path.join(ICON_DIR, filename);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(targetPath, buffer);

  return `/uploads/icons/${filename}`;
}

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

// Favicon 抓取并缓存到本地（用于跨设备稳定访问）
app.get('/api/favicon/cache', authMiddleware, async (req, res) => {
  const { url } = req.query;
  if (!url) return res.json({ success: false, message: '缺少 url 参数' });

  try {
    const iconUrl = await fetchAndCacheFaviconByUrl(url);
    res.json({ success: true, data: { iconUrl } });
  } catch (error) {
    res.json({ success: false, message: error.message || '抓取图标失败' });
  }
});

// 客户端上传 favicon（客户端有谷歌访问权但服务端没有时使用）
// 接受 { domain, dataUrl } — dataUrl 为 data:image/...;base64,... 格式
app.post('/api/favicon/cache-from-client', authMiddleware, express.json({ limit: '512kb' }), (req, res) => {
  const { domain, dataUrl } = req.body || {};
  if (!domain || !dataUrl) {
    return res.status(400).json({ success: false, message: '缺少 domain 或 dataUrl 参数' });
  }

  // 解析 data URL
  const match = dataUrl.match(/^data:(image\/[a-z+.-]+);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    return res.status(400).json({ success: false, message: 'dataUrl 格式无效' });
  }

  const mimeType = match[1].toLowerCase();
  const b64 = match[2];

  // 根据 mime 类型确定扩展名
  const extMap = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/x-icon': '.ico',
    'image/vnd.microsoft.icon': '.ico',
  };
  const ext = extMap[mimeType] || '.png';

  const hostKey = safeHost(domain.toLowerCase().replace(/[^a-z0-9.-]/g, '_'));
  const filename = `auto_${hostKey}${ext}`;
  const filepath = path.join(ICON_DIR, filename);

  try {
    // 如果已存在同名文件，直接返回（避免重复写入）
    if (!fs.existsSync(filepath)) {
      // 先删除同 domain 的旧格式文件（避免 .png 和 .ico 共存）
      const oldFile = fs.readdirSync(ICON_DIR).find((n) => n.startsWith(`auto_${hostKey}.`));
      if (oldFile) fs.unlinkSync(path.join(ICON_DIR, oldFile));

      fs.writeFileSync(filepath, Buffer.from(b64, 'base64'));
    }
    res.json({ success: true, data: { iconUrl: `/uploads/icons/${filename}` } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || '写入图标失败' });
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
  console.log(`\n Navigation server running → http://localhost:${PORT}`);
  console.log(`   前台：http://localhost:${PORT}/`);
  console.log(`   后台：http://localhost:${PORT}/admin/`);
  console.log(`   API： http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
