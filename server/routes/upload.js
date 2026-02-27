const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 确保 uploads 目录存在
const UPLOAD_DIR = path.join(__dirname, '../uploads/icons');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// multer 配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const name = `icon_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.ico', '.svg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持该文件格式，仅支持 jpg/png/gif/ico/svg/webp'));
    }
  }
});

// POST /api/upload/icon — 上传图标（需认证）
router.post('/icon', authMiddleware, upload.single('icon'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '未收到文件' });
  }
  const iconUrl = `/uploads/icons/${req.file.filename}`;
  res.json({ success: true, data: { url: iconUrl, filename: req.file.filename } });
}, (err, req, res, next) => {
  res.status(400).json({ success: false, message: err.message });
});

module.exports = router;
