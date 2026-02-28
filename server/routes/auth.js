const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../db/init');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login — 登录（仅密码）
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: '密码不能为空' });
  }

  const db = getDB();
  const admin = db.prepare('SELECT * FROM admin LIMIT 1').get();
  if (!admin) {
    return res.status(401).json({ success: false, message: '管理员账户不存在' });
  }

  const valid = bcrypt.compareSync(password, admin.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: '密码错误' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    data: {
      token,
      username: admin.username,
      expiresIn: 7 * 24 * 3600
    }
  });
});

// POST /api/auth/change-password — 修改密码（需认证）
router.post('/change-password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: '旧密码和新密码不能为空' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: '新密码长度不能少于6位' });
  }

  const db = getDB();
  const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(req.admin.id);
  const valid = bcrypt.compareSync(oldPassword, admin.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: '旧密码不正确' });
  }

  const hashed = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE admin SET password = ? WHERE id = ?').run(hashed, req.admin.id);
  res.json({ success: true, message: '密码修改成功' });
});

// GET /api/auth/me — 验证 Token 有效性
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, data: { username: req.admin.username } });
});

module.exports = router;
