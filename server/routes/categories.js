const express = require('express');
const { getDB } = require('../db/init');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/categories — 获取分类（未登录时过滤私有）
router.get('/', optionalAuthMiddleware, (req, res) => {
  const db = getDB();
  const isAuth = !!req.admin;
  const categories = db.prepare(`
    SELECT c.*, COUNT(l.id) as link_count
    FROM categories c
    LEFT JOIN links l ON l.category_id = c.id
    ${isAuth ? '' : 'WHERE c.is_private = 0'}
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.id ASC
  `).all();
  res.json({ success: true, data: categories });
});

// POST /api/categories — 新增分类（需认证）
router.post('/', authMiddleware, (req, res) => {
  const { name, icon = '', color = '#4F6EF7', sort_order = 0, is_private = 0 } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: '分类名称不能为空' });
  }
  const db = getDB();
  const result = db.prepare(
    'INSERT INTO categories (name, icon, color, sort_order, is_private) VALUES (?, ?, ?, ?, ?)'
  ).run(name, icon, color, sort_order, is_private ? 1 : 0);
  const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: cat });
});

// PUT /api/categories/sort — 批量更新分类排序（需认证）
router.put('/sort', authMiddleware, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: '参数格式错误' });
  }
  const db = getDB();
  const update = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
  db.transaction((items) => { for (const item of items) update.run(item.sort_order, item.id); })(items);
  res.json({ success: true, message: '排序已更新' });
});

// PUT /api/categories/:id — 修改分类（需认证）
router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, icon, color, sort_order, is_private } = req.body;
  const db = getDB();
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: '分类不存在' });
  }
  const updated = {
    name:       name       ?? existing.name,
    icon:       icon       ?? existing.icon,
    color:      color      ?? existing.color,
    sort_order: sort_order ?? existing.sort_order,
    is_private: is_private !== undefined ? (is_private ? 1 : 0) : existing.is_private
  };
  db.prepare('UPDATE categories SET name=?, icon=?, color=?, sort_order=?, is_private=? WHERE id=?')
    .run(updated.name, updated.icon, updated.color, updated.sort_order, updated.is_private, id);
  const result = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json({ success: true, data: result });
});

// DELETE /api/categories/:id — 删除分类（需认证）
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: '分类不存在' });
  }
  // 分类下的链接 category_id 设为 null（ON DELETE SET NULL）
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ success: true, message: '分类已删除' });
});

module.exports = router;
