const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'navigation.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const database = getDB();

  // 分类表
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      icon        TEXT DEFAULT '',
      color       TEXT DEFAULT '#4F6EF7',
      sort_order  INTEGER DEFAULT 0,
      is_private  INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 链接表
  database.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT NOT NULL,
      url         TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon        TEXT DEFAULT '',
      category_id INTEGER,
      tags        TEXT DEFAULT '[]',
      sort_order  INTEGER DEFAULT 0,
      is_private  INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // 迁移：为旧数据库补充 is_private 列
  const catCols  = database.prepare('PRAGMA table_info(categories)').all();
  const linkCols = database.prepare('PRAGMA table_info(links)').all();
  if (!catCols.some(c => c.name === 'is_private')) {
    database.prepare('ALTER TABLE categories ADD COLUMN is_private INTEGER DEFAULT 0').run();
  }
  if (!linkCols.some(c => c.name === 'is_private')) {
    database.prepare('ALTER TABLE links ADD COLUMN is_private INTEGER DEFAULT 0').run();
  }

  // 管理员表
  database.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      username    TEXT NOT NULL UNIQUE,
      password    TEXT NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 站点设置表
  database.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    )
  `);
  // 默认页脚
  database.prepare(
    `INSERT OR IGNORE INTO site_settings (key, value) VALUES ('footer_text', 'Copyright © 2026 · 个人导航')`
  ).run();
  // 默认滚动模式
  database.prepare(
    `INSERT OR IGNORE INTO site_settings (key, value) VALUES ('scroll_mode', 'scroll')`
  ).run();

  // 检查是否已有管理员
  const adminExists = database.prepare('SELECT id FROM admin LIMIT 1').get();
  if (!adminExists) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const rawPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const hashedPassword = bcrypt.hashSync(rawPassword, 12);
    database.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run(username, hashedPassword);
    console.log(`✅ 默认管理员已创建：用户名 [${username}]，请登录后立即修改密码`);
  }

  // 插入示例数据（仅首次）
  const categoryCount = database.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCount.count === 0) {
    insertSampleData(database);
  }

  console.log('✅ 数据库初始化完成');
  return database;
}

function insertSampleData(database) {
  // 用 Google favicon 服务，稳定可靠
  function fav(domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  }

  // 示例分类
  const insertCat = database.prepare('INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)');
  const catDev    = insertCat.run('开发工具', '', '#4F6EF7', 1).lastInsertRowid;
  const catAI     = insertCat.run('AI 工具',  '', '#7C3AED', 2).lastInsertRowid;
  const catDesign = insertCat.run('设计资源', '', '#EC4899', 3).lastInsertRowid;
  const catDocs   = insertCat.run('技术文档', '', '#0EA5E9', 4).lastInsertRowid;

  // 示例链接
  const insertLink = database.prepare(`
    INSERT INTO links (title, url, description, icon, category_id, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // 开发工具
  insertLink.run('GitHub',    'https://github.com',    '代码托管平台',     fav('github.com'),    catDev, 1);
  insertLink.run('GitLab',    'https://gitlab.com',    '代码托管平台',     fav('gitlab.com'),    catDev, 2);
  insertLink.run('VSCode Web','https://vscode.dev',    '在线代码编辑器',   fav('vscode.dev'),    catDev, 3);
  insertLink.run('Vercel',    'https://vercel.com',    '部署平台',         fav('vercel.com'),    catDev, 4);

  // AI 工具
  insertLink.run('ChatGPT',   'https://chat.openai.com', 'OpenAI AI 对话',  fav('openai.com'),    catAI, 1);
  insertLink.run('Claude',    'https://claude.ai',       'Anthropic AI 对话',fav('claude.ai'),    catAI, 2);
  insertLink.run('Gemini',    'https://gemini.google.com','Google AI 对话', fav('google.com'),    catAI, 3);

  // 设计资源
  insertLink.run('Figma',     'https://figma.com',     'UI 协作设计工具',  fav('figma.com'),     catDesign, 1);
  insertLink.run('Dribbble',  'https://dribbble.com',  '设计灵感参考',     fav('dribbble.com'),  catDesign, 2);
  insertLink.run('Iconfont',  'https://www.iconfont.cn','阿里图标库',      fav('iconfont.cn'),   catDesign, 3);

  // 技术文档
  insertLink.run('MDN',       'https://developer.mozilla.org','Web 开发文档',fav('mozilla.org'), catDocs, 1);
  insertLink.run('DevDocs',   'https://devdocs.io',    '聚合开发文档',     fav('devdocs.io'),    catDocs, 2);
  insertLink.run('Can I Use', 'https://caniuse.com',   '浏览器兼容性查询', fav('caniuse.com'),   catDocs, 3);

  console.log('✅ 示例数据已插入');
}

module.exports = { initDatabase, getDB };
