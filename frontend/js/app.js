/**
 * 导航页前台逻辑
 * 布局：左侧边栏 + 顶部搜索 + 横向卡片
 * 功能：API 加载、侧边栏导航、搜索过滤、搜索引擎跳转、主题、键盘快捷键、回到顶部
 */

const API_BASE = '/api';
// const API_BASE = 'http://localhost:3721/api'; // 本地开发时取消注释

// ─── DOM 引用 ───────────────────────────────────────────────
const sidebarNav       = document.getElementById('sidebarNav');
const groupContainer   = document.getElementById('groupContainer');
const searchInput      = document.getElementById('searchInput');
const searchResults    = document.getElementById('searchResults');
const searchResultGrid = document.getElementById('searchResultGrid');
const searchResultTitle= document.getElementById('searchResultTitle');
const searchResultCount= document.getElementById('searchResultCount');
const searchEmpty      = document.getElementById('searchEmpty');
const loadingState     = document.getElementById('loadingState');
const uncategorizedGroup = document.getElementById('uncategorizedGroup');
const uncategorizedGrid  = document.getElementById('uncategorizedGrid');
const themeToggle      = document.getElementById('themeToggle');
const backTop          = document.getElementById('backTop');
const sidebar          = document.getElementById('sidebar');
const sidebarOverlay   = document.getElementById('sidebarOverlay');
const hamburger        = document.getElementById('hamburger');
const engineCurrent    = document.getElementById('engineCurrent');
const engineLabel      = document.getElementById('engineLabel');
const engineDropdown   = document.getElementById('engineDropdown');
const searchGo         = document.getElementById('searchGo');

// ─── 数据 ───────────────────────────────────────────────────
let allLinks      = [];
let allCategories = [];
let currentEngineUrl = 'https://www.baidu.com/s?wd=';

// ─── 主题 ───────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('nav-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('nav-theme', next);
}

// ─── 工具 ───────────────────────────────────────────────────
/** 去除字符串中的 emoji */
function stripEmoji(str) {
  if (!str) return str;
  return str.replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, '').trim();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── 卡片创建 ───────────────────────────────────────────────
function createCard(link) {
  const a = document.createElement('a');
  a.className = 'link-card';
  a.href = link.url;

  const rawTitle = stripEmoji(link.title) || link.title;
  const fallback = rawTitle.charAt(0).toUpperCase();

  // 图标包裹层（用 DOM 方法避免 onerror 转义问题）
  const iconWrap = document.createElement('div');
  iconWrap.className = 'card-icon-wrap';

  const isEmojiIcon = link.icon && /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu.test(link.icon);
  if (link.icon && !isEmojiIcon) {
    const img = document.createElement('img');
    img.className = 'card-icon';
    img.src = link.icon;
    img.alt = '';
    img.loading = 'lazy';
    img.addEventListener('error', () => {
      const sp = document.createElement('span');
      sp.className = 'card-icon-text';
      sp.textContent = fallback;
      iconWrap.replaceChild(sp, img);
    });
    iconWrap.appendChild(img);
  } else {
    const sp = document.createElement('span');
    sp.className = 'card-icon-text';
    sp.textContent = fallback;
    iconWrap.appendChild(sp);
  }

  // 文字区
  const body = document.createElement('div');
  body.className = 'card-body';
  const titleEl = document.createElement('span');
  titleEl.className = 'card-title';
  titleEl.textContent = rawTitle;
  body.appendChild(titleEl);
  if (link.description) {
    const descEl = document.createElement('span');
    descEl.className = 'card-desc';
    descEl.textContent = stripEmoji(link.description) || link.description;
    body.appendChild(descEl);
  }

  a.appendChild(iconWrap);
  a.appendChild(body);
  return a;
}

// ─── 侧边栏 ─────────────────────────────────────────────────
function renderSidebar() {
  sidebarNav.innerHTML = '';

  // "全部" 入口
  const all = document.createElement('a');
  all.className = 'sidebar-item';
  all.href = '#';
  all.dataset.catId = '__all__';
  all.innerHTML = `
    <span class="sidebar-item-letter" style="background:var(--color-bg);color:var(--color-text-secondary)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
    </span>
    <span class="sidebar-item-name">全部</span>
  `;
  all.addEventListener('click', (e) => {
    e.preventDefault();
    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  sidebarNav.appendChild(all);

  for (const cat of allCategories) {
    const name = stripEmoji(cat.name) || cat.name;
    const li = document.createElement('a');
    li.className = 'sidebar-item';
    li.href = `#cat-${cat.id}`;
    li.dataset.catId = cat.id;

    // 图标：有效 URL 则显示图片，否则显示首字母徽章
    const isUrl = cat.icon && cat.icon.startsWith('http');
    if (isUrl) {
      const img = document.createElement('img');
      img.className = 'sidebar-item-icon';
      img.src = cat.icon;
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        const badge = document.createElement('span');
        badge.className = 'sidebar-item-letter';
        badge.textContent = name.charAt(0).toUpperCase();
        img.replaceWith(badge);
      });
      li.appendChild(img);
    } else {
      const badge = document.createElement('span');
      badge.className = 'sidebar-item-letter';
      badge.textContent = name.charAt(0).toUpperCase();
      li.appendChild(badge);
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'sidebar-item-name';
    nameSpan.textContent = name;
    li.appendChild(nameSpan);

    li.addEventListener('click', (e) => {
      e.preventDefault();
      closeSidebar();
      const sec = document.getElementById(`cat-${cat.id}`);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    sidebarNav.appendChild(li);
  }
}

// ─── 渲染分组 ───────────────────────────────────────────────
function renderGroups() {
  groupContainer.innerHTML = '';

  const grouped = new Map();
  for (const cat of allCategories) grouped.set(cat.id, { category: cat, links: [] });

  const uncategorized = [];
  for (const link of allLinks) {
    if (link.category_id && grouped.has(link.category_id)) {
      grouped.get(link.category_id).links.push(link);
    } else {
      uncategorized.push(link);
    }
  }

  for (const [, { category, links }] of grouped) {
    if (links.length === 0) continue;
    const section = document.createElement('section');
    section.className = 'link-group';
    section.id = `cat-${category.id}`;

    const name = escapeHtml(stripEmoji(category.name) || category.name);
    const header = document.createElement('div');
    header.className = 'group-header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'group-title';
    titleEl.textContent = stripEmoji(category.name) || category.name;
    header.appendChild(titleEl);

    const countEl = document.createElement('span');
    countEl.className = 'group-count';
    countEl.textContent = links.length;
    header.appendChild(countEl);

    section.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'cards-grid';
    for (const link of links) grid.appendChild(createCard(link));
    section.appendChild(grid);

    groupContainer.appendChild(section);
  }

  if (uncategorized.length > 0) {
    uncategorizedGrid.innerHTML = '';
    for (const link of uncategorized) uncategorizedGrid.appendChild(createCard(link));
    uncategorizedGroup.classList.remove('hidden');
  } else {
    uncategorizedGroup.classList.add('hidden');
  }
}

// ─── 搜索 ───────────────────────────────────────────────────
let searchTimeout = null;

function handleSearch(e) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => doSearch(e.target.value.trim()), 80);
}

function doSearch(query) {
  if (!query) {
    searchResults.classList.add('hidden');
    groupContainer.classList.remove('hidden');
    uncategorizedGroup.classList.remove('hidden');
    return;
  }

  groupContainer.classList.add('hidden');
  uncategorizedGroup.classList.add('hidden');
  searchResults.classList.remove('hidden');

  const q = query.toLowerCase();
  const matched = allLinks.filter(l =>
    l.title.toLowerCase().includes(q) ||
    (l.description && l.description.toLowerCase().includes(q)) ||
    (l.url && l.url.toLowerCase().includes(q))
  );

  searchResultGrid.innerHTML = '';
  searchResultTitle.textContent = `"${query}" 的搜索结果`;
  searchResultCount.textContent = `${matched.length} 条`;
  searchEmpty.classList.toggle('hidden', matched.length > 0);
  for (const link of matched) searchResultGrid.appendChild(createCard(link));
}

// ─── 搜索引擎 ───────────────────────────────────────────────
function initEngineDropdown() {
  engineCurrent.addEventListener('click', (e) => {
    e.stopPropagation();
    engineDropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => engineDropdown.classList.remove('open'));

  engineDropdown.querySelectorAll('.engine-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      engineDropdown.querySelectorAll('.engine-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      engineLabel.textContent = opt.textContent;
      currentEngineUrl = opt.dataset.url;
      engineDropdown.classList.remove('open');
    });
  });

  searchGo.addEventListener('click', () => {
    const q = searchInput.value.trim();
    if (q) window.open(currentEngineUrl + encodeURIComponent(q), '_blank');
  });
}

// ─── 侧边栏移动端 ───────────────────────────────────────────
function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
}

// ─── 数据加载 ───────────────────────────────────────────────
async function loadData() {
  loadingState.classList.remove('hidden');
  groupContainer.classList.add('hidden');

  try {
    const [linksRes, catsRes, settingsRes] = await Promise.all([
      fetch(`${API_BASE}/links`),
      fetch(`${API_BASE}/categories`),
      fetch(`${API_BASE}/settings`)
    ]);
    if (!linksRes.ok || !catsRes.ok) throw new Error('API 响应异常');

    const linksData = await linksRes.json();
    const catsData  = await catsRes.json();

    allLinks      = linksData.data  || [];
    allCategories = catsData.data   || [];

    // 更新页脚
    if (settingsRes.ok) {
      const settingsData = await settingsRes.json();
      const footerEl = document.getElementById('footerText');
      if (footerEl && settingsData.data?.footer_text) {
        footerEl.textContent = settingsData.data.footer_text;
      }
    }

    loadingState.classList.add('hidden');
    groupContainer.classList.remove('hidden');

    renderSidebar();
    renderGroups();
  } catch (err) {
    loadingState.innerHTML = `<span style="color:var(--color-text-secondary)">数据加载失败，请检查 API 服务是否运行。<br><small>${escapeHtml(err.message)}</small></span>`;
    console.error('[Navigation] 加载失败：', err);
  }
}

// ─── 事件绑定 ───────────────────────────────────────────────
themeToggle.addEventListener('click', toggleTheme);
searchInput.addEventListener('input', handleSearch);
hamburger.addEventListener('click', openSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

window.addEventListener('scroll', () => {
  backTop.classList.toggle('visible', window.scrollY > 60);
}, { passive: true });

document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
  if (e.key === 'Escape') {
    if (document.activeElement === searchInput) {
      searchInput.value = '';
      doSearch('');
      searchInput.blur();
    }
    closeSidebar();
  }
  if (e.key === 'Enter' && document.activeElement === searchInput) {
    const q = searchInput.value.trim();
    if (q) window.open(currentEngineUrl + encodeURIComponent(q), '_blank');
  }
});

// ─── 初始化 ─────────────────────────────────────────────────
initTheme();
initEngineDropdown();
loadData();