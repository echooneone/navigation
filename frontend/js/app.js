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
const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
const linkTargetBtn    = document.getElementById('linkTargetBtn');
const engineCurrent    = document.getElementById('engineCurrent');
const engineLabel      = document.getElementById('engineLabel');
const engineDropdown   = document.getElementById('engineDropdown');
const searchGo         = document.getElementById('searchGo');
const searchBarEl      = document.querySelector('.search-bar');

// ─── 数据 ───────────────────────────────────────────────────
let allLinks      = [];
let allCategories = [];
let currentEngineUrl = 'https://www.baidu.com/s?wd=';
let linkTarget = localStorage.getItem('nav-link-target') || '_blank';

// ─── 分页模式状态 ────────────────────────────────────────────
let scrollMode     = 'scroll'; // 'scroll' | 'page'
let pageIsActive   = false;
let currentPage    = 0;        // 逻辑页索引 0..N-1
let totalPages     = 0;
let pageSlideWidth = 0;
let pageTrackEl    = null;
let pageDotEls     = [];
let pageOrder      = {};       // catId -> 逻辑页索引（对象，多分类共页）
let actualTrackPos = 1;        // 当前 track translateX 所在位置（含首尾克隆偏移）
let pageDragging   = false;
let pageDragStartX = 0;
let pageDragLiveX  = 0;
let wheelTimer     = null;
const PAGE_THRESHOLD = 60; // px，触发翻页的最小拖拽距离

// 初始化链接目标标属性
function initLinkTarget() {
  const isNew = linkTarget === '_blank';
  document.documentElement.setAttribute('data-linktarget', isNew ? 'blank' : 'self');
  linkTargetBtn.title = isNew ? '当前：新标签页打开（点击切换）' : '当前：当前页打开（点击切换）';
}
function toggleLinkTarget() {
  linkTarget = linkTarget === '_blank' ? '_self' : '_blank';
  localStorage.setItem('nav-link-target', linkTarget);
  const isNew = linkTarget === '_blank';
  document.documentElement.setAttribute('data-linktarget', isNew ? 'blank' : 'self');
  linkTargetBtn.title = isNew ? '当前：新标签页打开（点击切换）' : '当前：当前页打开（点击切换）';
  // 刷新已渲染卡片的 target
  document.querySelectorAll('.link-card').forEach(a => {
    a.target = linkTarget;
    if (linkTarget === '_blank') a.rel = 'noopener noreferrer';
    else a.removeAttribute('rel');
  });
}

// ─── 侧边栏折叠 ─────────────────────────────────────────────
function _updateSearchBarCenter(sidebarWidth) {
  if (!searchBarEl) return;
  const w = sidebarWidth ?? parseFloat(getComputedStyle(sidebar).width);
  searchBarEl.style.transform = `translateX(${-w / 2}px)`;
}

function initSidebar() {
  if (localStorage.getItem('nav-sidebar-collapsed') === '1') {
    sidebar.classList.add('collapsed');
    sidebarCollapseBtn.title = '展开侧边栏';
    sidebarCollapseBtn.setAttribute('aria-label', '展开侧边栏');
  }
  _updateSearchBarCenter();
}

// 收集需要淡入/淡出的文字元素
function _sidebarFadeEls() {
  return [...sidebarNav.querySelectorAll('.sidebar-item-name')].filter(Boolean);
}

let _sidebarAnimating = false;
function toggleSidebar() {
  if (_sidebarAnimating) return;
  const isCollapsed = sidebar.classList.contains('collapsed');
  const willCollapse = !isCollapsed;

  localStorage.setItem('nav-sidebar-collapsed', willCollapse ? '1' : '0');
  sidebarCollapseBtn.title = willCollapse ? '展开侧边栏' : '收起侧边栏';
  sidebarCollapseBtn.setAttribute('aria-label', willCollapse ? '展开侧边栏' : '收起侧边栏');

  const rootStyle  = getComputedStyle(document.documentElement);
  const expandedW  = parseInt(rootStyle.getPropertyValue('--sidebar-w'))           || 200;
  const collapsedW = parseInt(rootStyle.getPropertyValue('--sidebar-collapsed-w')) || 52;
  const fadeEls    = _sidebarFadeEls();
  const animeLib   = window.anime;

  if (typeof animeLib !== 'function') {
    sidebar.classList.toggle('collapsed', willCollapse);
    _updateSearchBarCenter(willCollapse ? collapsedW : expandedW);
    return;
  }

  _sidebarAnimating = true;

  if (willCollapse) {
    // 文字淡出 + 宽度收缩同步进行，搜索栏跟踪偏移
    animeLib({ targets: fadeEls, opacity: 0, duration: 160, easing: 'easeInQuad' });
    animeLib({
      targets: sidebar,
      width: [expandedW, collapsedW],
      duration: 280,
      easing: 'cubicBezier(0.4,0,0.2,1)',
      update() {
        _updateSearchBarCenter(parseFloat(sidebar.style.width));
      },
      complete() {
        sidebar.classList.add('collapsed');
        sidebar.style.width = '';
        fadeEls.forEach(el => (el.style.opacity = ''));
        _updateSearchBarCenter(collapsedW);
        _sidebarAnimating = false;
      },
    });
  } else {
    // 锁定当前宽度 → 移除 collapsed → 展宽 → 文字淡入
    sidebar.style.width = collapsedW + 'px';
    sidebar.classList.remove('collapsed');
    fadeEls.forEach(el => (el.style.opacity = '0'));

    animeLib({
      targets: sidebar,
      width: [collapsedW, expandedW],
      duration: 300,
      easing: 'cubicBezier(0.4,0,0.2,1)',
      update() {
        _updateSearchBarCenter(parseFloat(sidebar.style.width));
      },
      complete() {
        sidebar.style.width = '';
        _updateSearchBarCenter(expandedW);
        animeLib({
          targets: fadeEls,
          opacity: 1,
          duration: 180,
          easing: 'easeOutQuad',
          complete() {
            fadeEls.forEach(el => (el.style.opacity = ''));
            _sidebarAnimating = false;
          },
        });
      },
    });
  }
}

// ─── 主题 ───────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('nav-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // 有用户手动选择则沿用，否则跟随系统
  const theme = saved ?? (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
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

// ─── 图标缓存 ─────────────────────────────────────────────────
// 只缓存 URL 的"可用/不可用"状态，不转 data URL（避免 CORS 问题）
// 浏览器自身 HTTP 缓存负责图片资源的本地持久化
// 每条结构：{ d: 'ok' | 'fail', t: timestamp }
// 最多 500 条；TTL 30 天（ok）/ 1 天（fail，可能只是暂时故障）
const ICON_CACHE_KEY = 'nav-icon-cache';
const ICON_CACHE_VER = 'v2'; // 更改版本号会自动清除旧格式缓存
const ICON_CACHE_MAX = 500;
const ICON_CACHE_TTL_OK   = 30 * 24 * 3600 * 1000;
const ICON_CACHE_TTL_FAIL =  1 * 24 * 3600 * 1000;

let _iconCache = null;
function _loadIconCache() {
  if (_iconCache) return _iconCache;
  try {
    const raw = JSON.parse(localStorage.getItem(ICON_CACHE_KEY) || '{}');
    // 版本不符（旧格式存了 data URL）→ 清空重建
    if (raw.__ver !== ICON_CACHE_VER) {
      _iconCache = { __ver: ICON_CACHE_VER };
      _saveIconCache();
    } else {
      _iconCache = raw;
    }
  } catch { _iconCache = { __ver: ICON_CACHE_VER }; }
  return _iconCache;
}
function _saveIconCache() {
  try { localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(_iconCache)); }
  catch (e) {
    try { localStorage.removeItem(ICON_CACHE_KEY); _iconCache = { __ver: ICON_CACHE_VER }; } catch {}
  }
}
function _pruneIconCache() {
  const entries = Object.entries(_iconCache).filter(([k]) => k !== '__ver');
  if (entries.length <= ICON_CACHE_MAX) return;
  entries.sort((a, b) => a[1].t - b[1].t);
  entries.slice(0, entries.length - ICON_CACHE_MAX).forEach(([k]) => delete _iconCache[k]);
}

/** 查询缓存：'ok' | 'fail' | null(未缓存/已过期) */
function iconCacheGet(url) {
  const cache = _loadIconCache();
  const entry = cache[url];
  if (!entry) return null;
  const ttl = entry.d === 'ok' ? ICON_CACHE_TTL_OK : ICON_CACHE_TTL_FAIL;
  if (Date.now() - entry.t > ttl) { delete cache[url]; return null; }
  return entry.d;
}

function iconCacheSet(url, status) {
  _loadIconCache();
  _iconCache[url] = { d: status, t: Date.now() };
  _pruneIconCache();
  _saveIconCache();
}

/**
 * 创建 <img>，利用缓存快速判断是否可用：
 *   'ok'   → 直接用原 URL（浏览器 disk cache，无网络请求）
 *   'fail' → 返回 null，调用方显示 fallback
 *   null   → 未知，尝试加载，结果写入缓存
 */
function makeIconImg(url, className, onFail) {
  const status = iconCacheGet(url);
  if (status === 'fail') return null;

  const img = document.createElement('img');
  img.className = className;
  img.alt = '';
  img.loading = 'lazy';
  img.src = url;

  if (status === 'ok') {
    // 已知可用，不再绑定事件，直接使用（浏览器会从 disk cache 加载）
    return img;
  }

  // 未知状态：等待加载结果再写缓存
  img.addEventListener('load',  () => iconCacheSet(url, 'ok'),  { once: true });
  img.addEventListener('error', () => { iconCacheSet(url, 'fail'); onFail(); }, { once: true });
  return img;
}




function createCard(link) {
  const a = document.createElement('a');
  a.className = 'link-card';
  a.href = link.url;
  a.target = linkTarget;
  if (linkTarget === '_blank') a.rel = 'noopener noreferrer';

  const rawTitle = stripEmoji(link.title) || link.title;
  const fallback = rawTitle.charAt(0).toUpperCase();

  // 图标包裹层（用 DOM 方法避免 onerror 转义问题）
  const iconWrap = document.createElement('div');
  iconWrap.className = 'card-icon-wrap';

  const isEmojiIcon = link.icon && /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu.test(link.icon);
  if (link.icon && !isEmojiIcon) {
    const showFallback = () => {
      const sp = document.createElement('span');
      sp.className = 'card-icon-text';
      sp.textContent = fallback;
      const existingImg = iconWrap.querySelector('.card-icon');
      if (existingImg) iconWrap.replaceChild(sp, existingImg);
      else iconWrap.appendChild(sp);
    };
    const img = makeIconImg(link.icon, 'card-icon', showFallback);
    if (img) iconWrap.appendChild(img);
    else showFallback();
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
  all.title = '全部';
  all.innerHTML = `
    <span class="sidebar-item-letter" style="background:var(--color-bg);color:var(--color-text-secondary)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
    </span>
    <span class="sidebar-item-name">全部</span>
  `;
  all.addEventListener('click', (e) => {
    e.preventDefault();
    closeSidebar();
    if (pageIsActive) { goToPage(0); return; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  sidebarNav.appendChild(all);

  for (const cat of allCategories) {
    const name = stripEmoji(cat.name) || cat.name;
    const li = document.createElement('a');
    li.className = 'sidebar-item';
    li.href = `#cat-${cat.id}`;
    li.dataset.catId = cat.id;
    li.title = name;  // 折叠时显示 tooltip

    // 图标：有效 URL 则显示图片，否则显示首字母徽章
    const isUrl = cat.icon && cat.icon.startsWith('http');
    if (isUrl) {
      const showBadge = () => {
        const badge = document.createElement('span');
        badge.className = 'sidebar-item-letter';
        badge.textContent = name.charAt(0).toUpperCase();
        const cur = li.querySelector('.sidebar-item-icon');
        if (cur) cur.replaceWith(badge);
        else li.prepend(badge);
      };
      const img = makeIconImg(cat.icon, 'sidebar-item-icon', showBadge);
      if (img) li.appendChild(img);
      else showBadge();
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
      if (pageIsActive) {
        const idx = pageOrder[String(cat.id)];
        if (idx !== undefined) goToPage(idx);
        return;
      }
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
    if (pageIsActive) {
      document.getElementById('pageTrackWrap')?.classList.remove('hidden');
      document.getElementById('pageDots')?.classList.remove('hidden');
    } else {
      groupContainer.classList.remove('hidden');
      uncategorizedGroup.classList.remove('hidden');
    }
    return;
  }

  if (pageIsActive) {
    document.getElementById('pageTrackWrap')?.classList.add('hidden');
    document.getElementById('pageDots')?.classList.add('hidden');
  } else {
    groupContainer.classList.add('hidden');
    uncategorizedGroup.classList.add('hidden');
  }
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

  // 若已登录管理员，携带 Token 以获取私有内容
  const token = localStorage.getItem('nav-admin-token');
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  try {
    const settingsPromise = fetch(`${API_BASE}/settings`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);

    const [linksRes, catsRes] = await Promise.all([
      fetch(`${API_BASE}/links`, { headers: authHeaders }),
      fetch(`${API_BASE}/categories`, { headers: authHeaders })
    ]);
    if (!linksRes.ok || !catsRes.ok) throw new Error('API 响应异常');

    const linksData = await linksRes.json();
    const catsData  = await catsRes.json();

    allLinks      = linksData.data  || [];
    allCategories = catsData.data   || [];

    renderSidebar();
    renderGroups();

    const settingsData = await settingsPromise;
    const footerEl = document.getElementById('footerText');
    if (footerEl && settingsData?.data?.footer_text) {
      footerEl.textContent = settingsData.data.footer_text;
    }
    scrollMode = settingsData?.data?.scroll_mode || 'scroll';

    loadingState.classList.add('hidden');
    groupContainer.classList.remove('hidden');

    if (scrollMode === 'page') {
      initPageMode();
      backTop.style.display = 'none';
    }
  } catch (err) {
    loadingState.innerHTML = `<span style="color:var(--color-text-secondary)">数据加载失败，请检查 API 服务是否运行。<br><small>${escapeHtml(err.message)}</small></span>`;
    console.error('[Navigation] 加载失败：', err);
  }
}

// ─── 分页模式 ─────────────────────────────────────────────────

/** 拆除分页 DOM，把 sections 归还原位 */
function destroyPageMode() {
  if (!pageIsActive) return;
  const contentArea = document.querySelector('.content-area');

  // 把 sections 从 slides 移回原始父容器
  const trackWrap = document.getElementById('pageTrackWrap');
  if (trackWrap) {
    const allSlides = Array.from(trackWrap.querySelectorAll('.page-slide'));
    // 多页 track 布局：[克隆末页(0), 真实0..N-1(1..N), 克隆首页(N+1)]
    // 单页 track 布局：[真实0(0)]
    const realSlides = totalPages > 1 ? allSlides.slice(1, totalPages + 1) : allSlides;
    realSlides.forEach(slide => {
      [...slide.children].forEach(sec => {
        if (sec === uncategorizedGroup) {
          groupContainer.after(sec);
        } else {
          groupContainer.appendChild(sec);
        }
      });
    });
    trackWrap.remove();
  }
  document.getElementById('pageDots')?.remove();

  groupContainer.style.display = '';
  uncategorizedGroup.style.display = '';
  contentArea.classList.remove('page-mode');
  document.body.classList.remove('page-mode-active');

  pageIsActive   = false;
  currentPage    = 0;
  totalPages     = 0;
  pageSlideWidth = 0;
  pageTrackEl    = null;
  pageDotEls     = [];
  pageOrder      = {};
  actualTrackPos = 1;
  window.removeEventListener('resize', _onPageModeResize);
}

let _resizeRebuildTimer = null;
function _onPageModeResize() {
  clearTimeout(_resizeRebuildTimer);
  _resizeRebuildTimer = setTimeout(() => {
    destroyPageMode();
    initPageMode();
  }, 200);
}

function initPageMode() {
  const sections = [...Array.from(groupContainer.children)];
  if (!uncategorizedGroup.classList.contains('hidden')) sections.push(uncategorizedGroup);
  if (sections.length === 0) return;

  pageIsActive = true;
  currentPage  = 0;

  const contentArea = document.querySelector('.content-area');

  // ── 先固定布局，再测量可用高度 ──────────────────────────────────
  document.body.classList.add('page-mode-active');
  contentArea.classList.add('page-mode');
  contentArea.offsetHeight; // 强制 reflow，确保高度约束生效

  // slide 的 padding-bottom 为 24px；section 之间 margin-bottom 为 36px（来自 .link-group）
  // availH = 可放内容的净高度
  const DOTS_H    = 56; // .page-dots 区域高度
  const SLIDE_PAD = 24; // .page-slide padding-bottom
  const SEC_GAP   = 36; // .link-group margin-bottom（offsetHeight 不含 margin）
  const availH    = contentArea.clientHeight - DOTS_H - SLIDE_PAD;

  // ── 按内容高度贪心打包 ────────────────────────────────────────
  const slideGroups = [[]];
  let usedH = 0;
  pageOrder = {};

  for (const section of sections) {
    // offsetHeight 不含 margin，手动加 SEC_GAP；最后一项多加的 gap 不影响判断
    const h = section.offsetHeight + SEC_GAP;
    const m = section.id.match(/^cat-(\d+)$/);
    const catKey = m ? m[1] : 'uncategorized';

    if (slideGroups[slideGroups.length - 1].length > 0 && usedH + h > availH) {
      slideGroups.push([section]);
      usedH = h;
    } else {
      slideGroups[slideGroups.length - 1].push(section);
      usedH += h;
    }
    pageOrder[catKey] = slideGroups.length - 1;
  }

  totalPages     = slideGroups.length;
  actualTrackPos = 1;

  // ── 构建 track ────────────────────────────────────────────────
  const trackWrap = document.createElement('div');
  trackWrap.className = 'page-track-wrap';
  trackWrap.id = 'pageTrackWrap';

  pageTrackEl = document.createElement('div');
  pageTrackEl.className = 'page-track';

  const realSlides = slideGroups.map(pageSections => {
    const slide = document.createElement('div');
    slide.className = 'page-slide';
    pageSections.forEach(s => { s.classList.remove('hidden'); slide.appendChild(s); });
    return slide;
  });

  if (totalPages > 1) {
    // 多页：[克隆末页, 真实0..N-1, 克隆首页]
    pageTrackEl.appendChild(realSlides[totalPages - 1].cloneNode(true));
    realSlides.forEach(s => pageTrackEl.appendChild(s));
    pageTrackEl.appendChild(realSlides[0].cloneNode(true));
  } else {
    pageTrackEl.appendChild(realSlides[0]);
  }
  trackWrap.appendChild(pageTrackEl);

  groupContainer.style.display = 'none';
  uncategorizedGroup.style.display = 'none';
  contentArea.appendChild(trackWrap);

  if (totalPages > 1) {
    // ── 小圆点 ───────────────────────────────────────────────────
    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'page-dots';
    dotsWrap.id = 'pageDots';
    pageDotEls = [];
    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = 'page-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `第${i + 1}页`);
      const idx = i;
      dot.addEventListener('click', () => goToPage(idx));
      dotsWrap.appendChild(dot);
      pageDotEls.push(dot);
    }
    contentArea.appendChild(dotsWrap);

    // transitionend：停在克隆 slide 时瞬移真实位置（无缝循环）
    pageTrackEl.addEventListener('transitionend', () => {
      if (actualTrackPos === 0) {
        currentPage    = totalPages - 1;
        actualTrackPos = currentPage + 1;
        pageTrackEl.style.transition = 'none';
        pageTrackEl.style.transform  = `translateX(${-actualTrackPos * pageSlideWidth}px)`;
        pageTrackEl.offsetHeight;
        pageTrackEl.style.transition = '';
        pageDotEls.forEach((d, i) => d.classList.toggle('active', i === currentPage));
      } else if (actualTrackPos === totalPages + 1) {
        currentPage    = 0;
        actualTrackPos = 1;
        pageTrackEl.style.transition = 'none';
        pageTrackEl.style.transform  = `translateX(${-actualTrackPos * pageSlideWidth}px)`;
        pageTrackEl.offsetHeight;
        pageTrackEl.style.transition = '';
        pageDotEls.forEach((d, i) => d.classList.toggle('active', i === currentPage));
      }
    });

    bindPageEvents(trackWrap);
  }

  updatePageLayout();
  window.addEventListener('resize', _onPageModeResize);
}

function updatePageLayout() {
  const wrap = document.getElementById('pageTrackWrap');
  if (!wrap || !pageTrackEl) return;
  pageSlideWidth = wrap.clientWidth;
  pageTrackEl.querySelectorAll('.page-slide').forEach(s => { s.style.width = pageSlideWidth + 'px'; });
  const slideCount = totalPages > 1 ? totalPages + 2 : 1;
  pageTrackEl.style.width = (pageSlideWidth * slideCount) + 'px';
  pageTrackEl.style.transition = 'none';
  actualTrackPos = totalPages > 1 ? currentPage + 1 : 0;
  pageTrackEl.style.transform = `translateX(${-actualTrackPos * pageSlideWidth}px)`;
  pageTrackEl.offsetHeight;
  pageTrackEl.style.transition = '';
}

/**
 * 跳转到指定逻辑页（0..N-1）。
 * 传入 -1 表示「向左越界 → 显示末页克隆」；传入 totalPages 表示「向右越界 → 显示首页克隆」。
 */
function goToPage(idx) {
  if (!pageIsActive) return;
  // 单页时无需移动
  if (totalPages <= 1) return;

  let trackIdx;
  if (idx < 0) {
    // 向左循环：跳到轨道位置 0（末页克隆）
    trackIdx = 0;
    pageDotEls.forEach((d, i) => d.classList.toggle('active', i === totalPages - 1));
  } else if (idx >= totalPages) {
    // 向右循环：跳到轨道位置 totalPages+1（首页克隆）
    trackIdx = totalPages + 1;
    pageDotEls.forEach((d, i) => d.classList.toggle('active', i === 0));
  } else {
    currentPage = idx;
    trackIdx    = currentPage + 1;
    pageDotEls.forEach((d, i) => d.classList.toggle('active', i === currentPage));
  }
  actualTrackPos = trackIdx;
  pageTrackEl.style.transform = `translateX(${-actualTrackPos * pageSlideWidth}px)`;
}

function bindPageEvents(wrap) {
  // 鼠标滚轮 / 触控板横向滚动
  wrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (wheelTimer) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if      (delta > 8)  goToPage(currentPage + 1 > totalPages - 1 ? totalPages     : currentPage + 1);
    else if (delta < -8) goToPage(currentPage - 1 < 0              ? -1             : currentPage - 1);
    wheelTimer = setTimeout(() => { wheelTimer = null; }, 420);
  }, { passive: false });

  // 触摸 / 鼠标拖拽
  wrap.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pageDragStartX = e.clientX;
    pageDragLiveX  = e.clientX;
    pageDragging   = true;
    pageTrackEl.style.transition = 'none';
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!pageDragging) return;
    pageDragLiveX = e.clientX;
    const delta = pageDragLiveX - pageDragStartX;
    // 拖拽时以当前真实 track 位置为基准
    pageTrackEl.style.transform = `translateX(${-(currentPage + 1) * pageSlideWidth + delta}px)`;
  });
  const endDrag = () => {
    if (!pageDragging) return;
    pageDragging = false;
    pageTrackEl.style.transition = '';
    const delta = pageDragLiveX - pageDragStartX;
    if      (delta < -PAGE_THRESHOLD) goToPage(currentPage + 1 > totalPages - 1 ? totalPages : currentPage + 1);
    else if (delta >  PAGE_THRESHOLD) goToPage(currentPage - 1 < 0             ? -1         : currentPage - 1);
    else {
      // 回弹到当前页
      actualTrackPos = currentPage + 1;
      pageTrackEl.style.transform = `translateX(${-actualTrackPos * pageSlideWidth}px)`;
    }
  };
  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);

  // iPad / iOS Safari 触摸兜底：横向滑动翻页，纵向保持内容滚动
  let touchActive = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchLastX = 0;
  let touchAxis = '';

  wrap.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || totalPages <= 1) return;
    const t = e.touches[0];
    touchActive = true;
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchLastX  = t.clientX;
    touchAxis   = '';
  }, { passive: true });

  wrap.addEventListener('touchmove', (e) => {
    if (!touchActive || e.touches.length !== 1 || totalPages <= 1) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    if (!touchAxis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      touchAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    if (touchAxis === 'x') {
      e.preventDefault();
      touchLastX = t.clientX;
      pageTrackEl.style.transition = 'none';
      pageTrackEl.style.transform = `translateX(${-(currentPage + 1) * pageSlideWidth + dx}px)`;
    }
  }, { passive: false });

  const endTouchDrag = () => {
    if (!touchActive || totalPages <= 1) return;
    touchActive = false;

    if (touchAxis !== 'x') return;

    pageTrackEl.style.transition = '';
    const delta = touchLastX - touchStartX;
    if      (delta < -PAGE_THRESHOLD) goToPage(currentPage + 1 > totalPages - 1 ? totalPages : currentPage + 1);
    else if (delta >  PAGE_THRESHOLD) goToPage(currentPage - 1 < 0             ? -1         : currentPage - 1);
    else {
      actualTrackPos = currentPage + 1;
      pageTrackEl.style.transform = `translateX(${-actualTrackPos * pageSlideWidth}px)`;
    }
  };

  wrap.addEventListener('touchend', endTouchDrag, { passive: true });
  wrap.addEventListener('touchcancel', endTouchDrag, { passive: true });
}

// ─── 事件绑定 ───────────────────────────────────────────────
themeToggle.addEventListener('click', toggleTheme);
sidebarCollapseBtn.addEventListener('click', toggleSidebar);
linkTargetBtn.addEventListener('click', toggleLinkTarget);
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
initSidebar();
initLinkTarget();
initEngineDropdown();
loadData();

// 未手动设置主题时，实时跟随系统切换
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('nav-theme')) {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});