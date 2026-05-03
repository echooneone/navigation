<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <a class="sidebar-brand" href="/admin/">
          <span class="brand-mark">N</span>
          <span class="brand-text">
            <span class="brand-name">导航</span>
            <span class="brand-sub">CONSOLE</span>
          </span>
        </a>
      </div>

      <div class="sidebar-section-label">Workspace</div>
      <nav class="sidebar-nav">
        <router-link class="nav-item" to="/" exact-active-class="active">
          <span class="nav-bar"></span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/>
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/>
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/>
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/>
          </svg>
          <span class="nav-label">仪表盘</span>
          <span class="nav-num">01</span>
        </router-link>
        <router-link class="nav-item" to="/links" active-class="active">
          <span class="nav-bar"></span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="nav-label">链接</span>
          <span class="nav-num">02</span>
        </router-link>
        <router-link class="nav-item" to="/categories" active-class="active">
          <span class="nav-bar"></span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span class="nav-label">分类</span>
          <span class="nav-num">03</span>
        </router-link>
        <router-link class="nav-item" to="/settings" active-class="active">
          <span class="nav-bar"></span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="nav-label">设置</span>
          <span class="nav-num">04</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button class="nav-item logout-btn" @click="handleLogout">
          <span class="nav-bar"></span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
          <span class="nav-label">退出</span>
        </button>
      </div>
    </aside>

    <!-- 主内容 -->
    <div class="main-wrapper">
      <header class="admin-header">
        <div class="header-left">
          <span class="crumb-mono">{{ pageNum }} / Personal Index</span>
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <span class="admin-user">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14" aria-hidden="true">
              <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
              <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <span class="user-mono">{{ auth.username }}</span>
          </span>
          <button class="icon-btn" @click="toggleTheme" :title="isDark ? '切到亮色' : '切到深色'" aria-label="切换主题">
            <svg v-if="!isDark" viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true">
              <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.8"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
          <a class="btn btn-secondary header-front" href="/" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13" aria-hidden="true">
              <polyline points="15 3 21 3 21 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>前台</span>
          </a>
        </div>
      </header>
      <main class="admin-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const titleMap = { Dashboard: '仪表盘', Links: '链接管理', Categories: '分类管理', Settings: '系统设置' }
const numMap   = { Dashboard: '01', Links: '02', Categories: '03', Settings: '04' }
const pageTitle = computed(() => titleMap[route.name] || '管理后台')
const pageNum   = computed(() => numMap[route.name]   || '00')

// ── 主题 ────────────────────────────────────────────────
const isDark = ref(document.documentElement.getAttribute('data-theme') === 'dark')

function toggleTheme() {
  const next = isDark.value ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem('nav-theme', next)
  isDark.value = next === 'dark'
}

let mediaQuery
function onSystemThemeChange(e) {
  if (!localStorage.getItem('nav-theme')) {
    const theme = e.matches ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    isDark.value = e.matches
  }
}
onMounted(() => {
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', onSystemThemeChange)
})
onUnmounted(() => {
  mediaQuery?.removeEventListener('change', onSystemThemeChange)
})

function handleLogout() {
  auth.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100dvh;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* ============================================================
   侧边栏
   ============================================================ */
.sidebar {
  width: var(--sidebar-w);
  background: var(--color-surface-2);
  border-right: 1px solid var(--color-hairline);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar-header {
  padding: 22px 22px 18px;
  border-bottom: 1px solid var(--color-hairline);
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text);
}
.brand-mark {
  width: 38px; height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--color-bg);
  background: var(--color-text);
  border-radius: var(--radius-sm);
  transition: transform var(--dur) var(--ease), background var(--dur) var(--ease), color var(--dur) var(--ease);
}
.sidebar-brand:hover .brand-mark {
  background: var(--color-accent);
  color: #fff;
  transform: rotate(-8deg);
}
.brand-text { display: flex; flex-direction: column; line-height: 1; gap: 4px; }
.brand-name {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -.01em;
}
.brand-sub {
  font-family: var(--font-mono);
  font-size: .62rem;
  letter-spacing: .22em;
  color: var(--color-text-secondary);
}

.sidebar-section-label {
  padding: 18px 22px 8px;
  font-family: var(--font-mono);
  font-size: .62rem;
  letter-spacing: .22em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.sidebar-nav {
  flex: 1;
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-family: var(--font-sans);
  font-size: .9rem;
  font-weight: 500;
  cursor: pointer;
  transition: color var(--dur) var(--ease),
              background var(--dur) var(--ease),
              transform var(--dur-micro) var(--ease);
  white-space: nowrap;
  border: none;
  width: 100%;
  text-align: left;
  background: transparent;
}
.nav-item .nav-bar {
  position: absolute;
  left: 0;
  top: 50%;
  width: 3px;
  height: 0;
  background: var(--color-accent);
  border-radius: 2px;
  transform: translateY(-50%);
  transition: height var(--dur) var(--ease);
}
.nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
.nav-item .nav-label { flex: 1; }
.nav-item .nav-num {
  font-family: var(--font-mono);
  font-size: .65rem;
  letter-spacing: .12em;
  color: var(--color-text-secondary);
  opacity: .55;
  transition: color var(--dur) var(--ease), opacity var(--dur) var(--ease);
}
.nav-item:hover {
  color: var(--color-text);
  transform: translateX(3px);
}
.nav-item:hover .nav-bar { height: 60%; }
.nav-item:hover .nav-num { opacity: .9; }

.nav-item.active {
  color: var(--color-bg);
  background: var(--color-text);
}
.nav-item.active .nav-num { color: var(--color-bg); opacity: .65; }
.nav-item.active .nav-bar { height: 0; }

.sidebar-footer {
  padding: 14px;
  border-top: 1px solid var(--color-hairline);
}
.logout-btn {
  width: 100%;
  background: transparent;
}
.logout-btn:hover {
  color: var(--color-danger);
}
.logout-btn:hover .nav-bar { background: var(--color-danger); height: 60%; }

/* ============================================================
   主区域
   ============================================================ */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  height: var(--header-h);
  border-bottom: 1px solid var(--color-hairline);
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 16px;
  flex-shrink: 0;
  background: transparent;
}
.header-left { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.crumb-mono {
  font-family: var(--font-mono);
  font-size: .64rem;
  letter-spacing: .2em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}
.page-title {
  font-family: var(--font-serif);
  font-size: 1.18rem;
  font-weight: 500;
  font-style: italic;
  letter-spacing: -.01em;
  line-height: 1.1;
}

.header-right { display: flex; align-items: center; gap: 14px; }
.admin-user {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-secondary);
}
.user-mono {
  font-family: var(--font-mono);
  font-size: .72rem;
  letter-spacing: .08em;
}

.icon-btn {
  width: 34px; height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  transition: color var(--dur) var(--ease),
              background var(--dur) var(--ease),
              border-color var(--dur) var(--ease),
              transform var(--dur-micro) var(--ease);
}
.icon-btn:hover {
  color: var(--color-bg);
  background: var(--color-text);
  border-color: var(--color-text);
}
.icon-btn:hover svg { animation: spin360 .55s var(--ease); }
@keyframes spin360 { to { transform: rotate(360deg) scale(1.08); } }

.header-front { padding: 8px 14px; }

.admin-main {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px 36px;
}

@media (max-width: 760px) {
  .sidebar { width: 76px; }
  .sidebar-header { padding: 18px 14px; }
  .brand-text, .sidebar-section-label, .nav-label, .nav-num { display: none; }
  .nav-item { justify-content: center; padding: 11px; }
  .admin-header { padding: 0 18px; }
  .admin-main { padding: 20px 18px 28px; }
}
</style>
