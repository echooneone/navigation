const express = require('express');
const { getDB } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/backup/export — 导出所有数据（需认证）
router.post('/export', authMiddleware, (req, res) => {
  const db = getDB();
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  const links = db.prepare('SELECT * FROM links ORDER BY category_id, sort_order').all().map(l => ({
    ...l,
    tags: (() => { try { return JSON.parse(l.tags); } catch { return []; } })()
  }));
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    categories,
    links
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="navigation_backup_${Date.now()}.json"`);
  res.json(exportData);
});

// POST /api/backup/import — 导入数据（需认证，会清空现有数据并重新导入）
router.post('/import', authMiddleware, (req, res) => {
  const { categories, links } = req.body;
  if (!Array.isArray(categories) || !Array.isArray(links)) {
    return res.status(400).json({ success: false, message: '数据格式错误，需包含 categories 和 links 数组' });
  }

  const db = getDB();
  const importTransaction = db.transaction(() => {
    db.prepare('DELETE FROM links').run();
    db.prepare('DELETE FROM categories').run();
    try { db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('links','categories')").run(); } catch(e) {}

    const insertCat = db.prepare(
      'INSERT INTO categories (id, name, icon, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const cat of categories) {
      insertCat.run(cat.id, cat.name, cat.icon || '', cat.color || '#4F6EF7', cat.sort_order || 0, cat.created_at || null);
    }

    const insertLink = db.prepare(`
      INSERT INTO links (id, title, url, description, icon, category_id, tags, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const link of links) {
      insertLink.run(
        link.id, link.title, link.url, link.description || '', link.icon || '',
        link.category_id || null, JSON.stringify(link.tags || []),
        link.sort_order || 0, link.created_at || null, link.updated_at || null
      );
    }
  });

  try {
    importTransaction();
    res.json({ success: true, message: `导入成功：${categories.length} 个分类，${links.length} 条链接` });
  } catch (err) {
    res.status(500).json({ success: false, message: `导入失败：${err.message}` });
  }
});

module.exports = router;
