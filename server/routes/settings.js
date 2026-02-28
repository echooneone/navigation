const express = require('express');
const { getDB } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings — 公开，前台读取站点配置
router.get('/', (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT key, value FROM site_settings').all();
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json({ success: true, data: settings });
});

// PUT /api/settings — 需认证，后台更新配置
router.put('/', authMiddleware, (req, res) => {
  const db = getDB();
  const allowed = ['footer_text', 'scroll_mode'];
  const upsert = db.prepare(
    'INSERT INTO site_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  const update = db.transaction((body) => {
    for (const key of allowed) {
      if (key in body) upsert.run(key, String(body[key]));
    }
  });
  try {
    update(req.body);
    res.json({ success: true, message: '设置已保存' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
