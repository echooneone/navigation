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
const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn'); // 可能为 null，已移除按钮
const linkTargetBtn    = document.getElementById('linkTargetBtn');
const engineCurrent    = document.getElementById('engineCurrent');
const engineIcon       = document.getElementById('engineIcon');
const engineDropdown   = document.getElementById('engineDropdown');
const engineBackdrop   = document.getElementById('engineBackdrop');
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

// ─── 侧边栏（仅移动端抽屉，桌面端固定展开）───────────────────
function initSidebar() { /* 默认展开，无折叠需求 */ }
function toggleSidebar() { /* deprecated */ }

// ─── 主题 ───────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('nav-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  // 有用户手动选择则沿用，否则跟随系统
  const theme = saved ?? (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}
function toggleTheme(e) {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';

  const apply = () => {
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nav-theme', next);
  };

  // 从点击点圆形扩散；不支持 View Transitions API 或用户偏好减弱动效则直接切换
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || reduce) { apply(); return; }

  const x = e?.clientX ?? window.innerWidth - 40;
  const y = e?.clientY ?? window.innerHeight - 40;
  const r = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const transition = document.startViewTransition(apply);
  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' }
    );
  });
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
  img.decoding = 'async';
  img.src = url;

  if (status === 'ok') {
    return img;
  }

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
    iconWrap.style.setProperty('--icon-url', `url(${link.icon})`);
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

  for (const cat of allCategories) {
    const name = stripEmoji(cat.name) || cat.name;
    const li = document.createElement('a');
    li.className = 'sidebar-item';
    li.href = `#cat-${cat.id}`;
    li.dataset.catId = cat.id;
    li.title = name;  // 折叠时显示 tooltip

    // 图标：有效 URL 则显示图片，否则显示首字母徽章
    const isUrl = cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/'));
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
        if (idx !== undefined) { goToPage(idx); flashGroupTitle(cat.id); }
        return;
      }
      const sec = document.getElementById(`cat-${cat.id}`);
      if (sec) {
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        flashGroupTitle(cat.id);
      }
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

function confirmSearch() {
  const q = searchInput.value.trim();
  if (!q) return;

  window.open(currentEngineUrl + encodeURIComponent(q), '_blank');
  clearTimeout(searchTimeout);
  searchInput.value = '';
  doSearch('');
}

// ─── 搜索引擎 ───────────────────────────────────────────────
const LS_ENGINE = 'nav-engine';

function applyEngine(opt, persist = true) {
  if (!opt) return;
  engineDropdown.querySelectorAll('.engine-option').forEach(o => o.classList.remove('active'));
  opt.classList.add('active');
  engineIcon.src = opt.dataset.icon || '';
  currentEngineUrl = opt.dataset.url;
  if (persist) localStorage.setItem(LS_ENGINE, opt.dataset.engine);
}

function initEngineDropdown() {
  // 还原本地保存的选择；没有则同步默认 active 项的 url
  const saved = localStorage.getItem(LS_ENGINE);
  const restore = saved
    ? engineDropdown.querySelector(`.engine-option[data-engine="${saved}"]`)
    : engineDropdown.querySelector('.engine-option.active');
  applyEngine(restore, false);

  function openEngineDropdown() {
    engineDropdown.classList.add('open');
    engineBackdrop.classList.add('open');
    searchBarEl.classList.add('engine-open');
  }
  function closeEngineDropdown() {
    engineDropdown.classList.remove('open');
    engineBackdrop.classList.remove('open');
    searchBarEl.classList.remove('engine-open');
  }

  engineCurrent.addEventListener('click', (e) => {
    e.stopPropagation();
    engineDropdown.classList.contains('open') ? closeEngineDropdown() : openEngineDropdown();
  });

  engineBackdrop.addEventListener('click', closeEngineDropdown);

  document.addEventListener('click', (e) => {
    if (!searchBarEl.contains(e.target)) {
      closeEngineDropdown();
    }
  });

  engineDropdown.querySelectorAll('.engine-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      applyEngine(opt, true);
      closeEngineDropdown();
    });
  });

  searchGo.addEventListener('click', confirmSearch);
}

// ─── 分类标题高亮动画 ───────────────────────────────────────
function flashGroupTitle(catId) {
  let sec;
  if (pageIsActive && pageTrackEl) {
    const slides = pageTrackEl.children;
    const realIdx = totalPages > 1 ? currentPage + 1 : 0;
    if (slides[realIdx]) {
      sec = slides[realIdx].querySelector(`#cat-${catId}`);
    }
  } else {
    sec = document.getElementById(`cat-${catId}`);
  }
  if (!sec) return;
  const title = sec.querySelector('.group-title');
  if (!title) return;
  title.classList.add('flash');
  title.addEventListener('animationend', () => title.classList.remove('flash'), { once: true });
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
      if (window.innerWidth >= 768) {
        initPageMode();
        backTop.style.display = 'none';
      }
      // 监听窗口变化：窄→宽启用分页，宽→窄关闭分页
      window.addEventListener('resize', _onPageModeResize);
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
}

let _resizeRebuildTimer = null;
function _onPageModeResize() {
  clearTimeout(_resizeRebuildTimer);
  _resizeRebuildTimer = setTimeout(() => {
    const narrow = window.innerWidth < 768;
    if (narrow) {
      if (pageIsActive) { destroyPageMode(); backTop.style.display = ''; }
    } else {
      if (pageIsActive) { destroyPageMode(); }
      initPageMode();
      backTop.style.display = 'none';
    }
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

  // 动态读取 slide 和 section 的 CSS 值，适配不同断点
  const DOTS_H      = 56;
  // 创建一个临时 slide 来读取其 padding（不同断点不同值）
  const tmpSlide = document.createElement('div');
  tmpSlide.className = 'page-slide';
  tmpSlide.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
  contentArea.appendChild(tmpSlide);
  const slideCS = getComputedStyle(tmpSlide);
  const SLIDE_PAD_T = parseInt(slideCS.paddingTop)  || 28;
  const SLIDE_PAD_B = parseInt(slideCS.paddingBottom) || 32;
  contentArea.removeChild(tmpSlide);

  const availH = contentArea.clientHeight - DOTS_H - SLIDE_PAD_T - SLIDE_PAD_B;

  // ── 按内容高度贪心打包 ────────────────────────────────────────
  const slideGroups = [[]];
  let usedH = 0;
  pageOrder = {};

  for (const section of sections) {
    const secStyle = getComputedStyle(section);
    const marginB  = parseInt(secStyle.marginBottom) || 56;
    const h = section.offsetHeight + marginB;
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
      const slideCount = totalPages + 2;
      if (actualTrackPos === 0) {
        currentPage    = totalPages - 1;
        actualTrackPos = currentPage + 1;
        pageTrackEl.style.transition = 'none';
        pageTrackEl.style.transform  = `translateX(${-(actualTrackPos / slideCount * 100)}%)`;
        pageTrackEl.offsetHeight;
        pageTrackEl.style.transition = '';
        pageDotEls.forEach((d, i) => d.classList.toggle('active', i === currentPage));
      } else if (actualTrackPos === slideCount - 1) {
        currentPage    = 0;
        actualTrackPos = 1;
        pageTrackEl.style.transition = 'none';
        pageTrackEl.style.transform  = `translateX(${-(actualTrackPos / slideCount * 100)}%)`;
        pageTrackEl.offsetHeight;
        pageTrackEl.style.transition = '';
        pageDotEls.forEach((d, i) => d.classList.toggle('active', i === currentPage));
      }
    });

    bindPageEvents(trackWrap);
  }

  updatePageLayout();
}

function updatePageLayout() {
  const wrap = document.getElementById('pageTrackWrap');
  if (!wrap || !pageTrackEl) return;
  pageSlideWidth = wrap.clientWidth;
  const slideCount = totalPages > 1 ? totalPages + 2 : 1;
  // 用百分比避免亚像素漏光
  pageTrackEl.style.width = (slideCount * 100) + '%';
  pageTrackEl.querySelectorAll('.page-slide').forEach(s => {
    s.style.width = (100 / slideCount) + '%';
  });
  pageTrackEl.style.transition = 'none';
  actualTrackPos = totalPages > 1 ? currentPage + 1 : 0;
  pageTrackEl.style.transform = `translateX(${-(actualTrackPos / slideCount * 100)}%)`;
  pageTrackEl.offsetHeight;
  pageTrackEl.style.transition = '';
}

/**
 * 跳转到指定逻辑页（0..N-1）。
 * 传入 -1 表示「向左越界 → 显示末页克隆」；传入 totalPages 表示「向右越界 → 显示首页克隆」。
 */
function goToPage(idx) {
  if (!pageIsActive || totalPages <= 1) return;

  const slideCount = totalPages + 2;
  let trackIdx;
  if (idx < 0) {
    trackIdx = 0;
    pageDotEls.forEach((d, i) => d.classList.toggle('active', i === totalPages - 1));
  } else if (idx >= totalPages) {
    trackIdx = slideCount - 1;
    pageDotEls.forEach((d, i) => d.classList.toggle('active', i === 0));
  } else {
    currentPage = idx;
    trackIdx    = currentPage + 1;
    pageDotEls.forEach((d, i) => d.classList.toggle('active', i === currentPage));
  }
  actualTrackPos = trackIdx;
  pageTrackEl.style.transform = `translateX(${-(trackIdx / slideCount * 100)}%)`;
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

  // 触摸 / 鼠标拖拽（仅在实际拖拽时捕获指针，避免阻断链接点击）
  let pointerIsDown = false;
  wrap.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerIsDown  = true;
    pageDragStartX = e.clientX;
    pageDragLiveX  = e.clientX;
    pageDragging   = false;
    pageTrackEl.style.transition = 'none';
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!pointerIsDown) return;
    pageDragLiveX = e.clientX;
    const delta = pageDragLiveX - pageDragStartX;
    if (!pageDragging && Math.abs(delta) > 4) {
      pageDragging = true;
      wrap.setPointerCapture(e.pointerId);
    }
    if (!pageDragging) return;
    const slideCount = totalPages + 2;
    const pct = -(currentPage + 1) / slideCount * 100 + (delta / pageSlideWidth) * (100 / slideCount);
    pageTrackEl.style.transform = `translateX(${pct}%)`;
  });
  const endDrag = () => {
    pointerIsDown = false;
    if (!pageDragging) {
      pageTrackEl.style.transition = '';
      return;
    }
    pageDragging = false;
    pageTrackEl.style.transition = '';
    const delta = pageDragLiveX - pageDragStartX;
    if      (delta < -PAGE_THRESHOLD) goToPage(currentPage + 1 > totalPages - 1 ? totalPages : currentPage + 1);
    else if (delta >  PAGE_THRESHOLD) goToPage(currentPage - 1 < 0             ? -1         : currentPage - 1);
    else {
      const slideCount = totalPages + 2;
      actualTrackPos = currentPage + 1;
      pageTrackEl.style.transform = `translateX(${-(actualTrackPos / slideCount * 100)}%)`;
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
      const slideCount = totalPages + 2;
      const pct = -(currentPage + 1) / slideCount * 100 + (dx / pageSlideWidth) * (100 / slideCount);
      pageTrackEl.style.transform = `translateX(${pct}%)`;
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
      const slideCount = totalPages + 2;
      actualTrackPos = currentPage + 1;
      pageTrackEl.style.transform = `translateX(${-(actualTrackPos / slideCount * 100)}%)`;
    }
  };

  wrap.addEventListener('touchend', endTouchDrag, { passive: true });
  wrap.addEventListener('touchcancel', endTouchDrag, { passive: true });
}

// ─── 侧边栏收缩切换 ─────────────────────────────────────────
const LS_SIDEBAR = 'nav-sidebar-collapsed';
function initSidebarState() {
  if (localStorage.getItem(LS_SIDEBAR) === '1') {
    document.documentElement.classList.add('sidebar-collapsed');
  }
}
function toggleSidebarCollapsed() {
  const collapsed = document.documentElement.classList.toggle('sidebar-collapsed');
  localStorage.setItem(LS_SIDEBAR, collapsed ? '1' : '0');
}
document.querySelector('.sidebar-brand').addEventListener('click', toggleSidebarCollapsed);

// ─── 事件绑定 ───────────────────────────────────────────────
themeToggle.addEventListener('click', toggleTheme);
if (sidebarCollapseBtn) sidebarCollapseBtn.addEventListener('click', toggleSidebar);
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
    confirmSearch();
  }
});

// ─── 卡片鼠标跟随流光（圆形影响范围，同时影响多个卡片） ─────
(function initCardGlow() {
  const RADIUS = 840; // 影响半径 px
  let raf = 0;
  document.addEventListener('mousemove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const mx = e.clientX;
      const my = e.clientY;
      const cards = document.querySelectorAll('.link-card');
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < RADIUS) {
          const t = 1 - dist / RADIUS;           // 0→1，越近越亮
          const ease = t * t * (3 - 2 * t);       // smoothstep
          card.style.setProperty('--mx', `${((mx - rect.left) / rect.width) * 100}%`);
          card.style.setProperty('--my', `${((my - rect.top) / rect.height) * 100}%`);
          card.style.setProperty('--glow', ease.toFixed(3));
        } else {
          card.style.setProperty('--glow', '0');
        }
      }
    });
  });
})();

// ─── 初始化 ─────────────────────────────────────────────────
initTheme();
initSidebar();
initSidebarState();
initLinkTarget();
initEngineDropdown();
loadData();

// 未手动设置主题时，实时跟随系统切换
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('nav-theme')) {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});
