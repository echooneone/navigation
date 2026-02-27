const express = require('express');
const { getDB } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/links — 获取所有链接（公开，按分类和排序）
router.get('/', (req, res) => {
  const db = getDB();
  const links = db.prepare(`
    SELECT l.*, c.name as category_name, c.color as category_color
    FROM links l
    LEFT JOIN categories c ON l.category_id = c.id
    ORDER BY c.sort_order ASC, l.sort_order ASC, l.id ASC
  `).all();

  // 解析 tags JSON
  const result = links.map(link => ({
    ...link,
    tags: (() => { try { return JSON.parse(link.tags); } catch { return []; } })()
  }));

  res.json({ success: true, data: result });
});

// POST /api/links — 新增链接（需认证）
router.post('/', authMiddleware, (req, res) => {
  const { title, url, description = '', icon = '', category_id, tags = [], sort_order = 0 } = req.body;
  if (!title || !url) {
    return res.status(400).json({ success: false, message: '名称和URL不能为空' });
  }

  const db = getDB();
  const stmt = db.prepare(`
    INSERT INTO links (title, url, description, icon, category_id, tags, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(title, url, description, icon, category_id || null, JSON.stringify(tags), sort_order);
  const newLink = db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({
    success: true,
    data: { ...newLink, tags: (() => { try { return JSON.parse(newLink.tags); } catch { return []; } })() }
  });
});

// PUT /api/links/sort — 批量更新排序（需认证）
router.put('/sort', authMiddleware, (req, res) => {
  const { items } = req.body; // [{ id, sort_order }]
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: '参数格式错误' });
  }

  const db = getDB();
  const update = db.prepare('UPDATE links SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  const updateMany = db.transaction((items) => {
    for (const item of items) {
      update.run(item.sort_order, item.id);
    }
  });
  updateMany(items);

  res.json({ success: true, message: '排序已更新' });
});

// PUT /api/links/:id — 修改链接（需认证）
router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, url, description, icon, category_id, tags, sort_order } = req.body;

  const db = getDB();
  const existing = db.prepare('SELECT * FROM links WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: '链接不存在' });
  }

  const updated = {
    title: title ?? existing.title,
    url: url ?? existing.url,
    description: description ?? existing.description,
    icon: icon ?? existing.icon,
    category_id: category_id !== undefined ? (category_id || null) : existing.category_id,
    tags: tags !== undefined ? JSON.stringify(tags) : existing.tags,
    sort_order: sort_order ?? existing.sort_order
  };

  db.prepare(`
    UPDATE links SET title=?, url=?, description=?, icon=?, category_id=?, tags=?, sort_order=?,
    updated_at=CURRENT_TIMESTAMP WHERE id=?
  `).run(updated.title, updated.url, updated.description, updated.icon,
         updated.category_id, updated.tags, updated.sort_order, id);

  const result = db.prepare('SELECT * FROM links WHERE id = ?').get(id);
  res.json({
    success: true,
    data: { ...result, tags: (() => { try { return JSON.parse(result.tags); } catch { return []; } })() }
  });
});

// DELETE /api/links/:id — 删除链接（需认证）
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const existing = db.prepare('SELECT id FROM links WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: '链接不存在' });
  }
  db.prepare('DELETE FROM links WHERE id = ?').run(id);
  res.json({ success: true, message: '链接已删除' });
});

module.exports = router;
