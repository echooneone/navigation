<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <a class="sidebar-logo" href="/admin/">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span>导航管理</span>
        </a>
        <button class="sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed" title="折叠侧边栏">
          <svg viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link class="nav-item" to="/" exact-active-class="active">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/></svg>
          <span>仪表盘</span>
        </router-link>
        <router-link class="nav-item" to="/links" active-class="active">
          <svg viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>链接管理</span>
        </router-link>
        <router-link class="nav-item" to="/categories" active-class="active">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>分类管理</span>
        </router-link>
        <router-link class="nav-item" to="/settings" active-class="active">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>设置</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button class="nav-item logout-btn" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="16 17 21 12 16 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容 -->
    <div class="main-wrapper">
      <header class="admin-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <span class="admin-user">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            {{ auth.username }}
          </span>
          <a class="btn btn-secondary" href="/">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="15 3 21 3 21 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            查看前台
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
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const sidebarCollapsed = ref(false)

const titleMap = { Dashboard: '仪表盘', Links: '链接管理', Categories: '分类管理', Settings: '设置' }
const pageTitle = computed(() => titleMap[route.name] || '管理后台')

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
}

/* 侧边栏 */
.sidebar {
  width: var(--sidebar-w);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.22s ease;
  overflow: hidden;
}
.sidebar.collapsed { width: 56px; }
.sidebar.collapsed .sidebar-logo span,
.sidebar.collapsed .nav-item span { display: none; }
.sidebar.collapsed .sidebar-toggle { transform: rotate(180deg); }

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px;
  border-bottom: 1px solid var(--color-border);
}
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-primary);
  white-space: nowrap;
}
.sidebar-logo svg { width: 20px; height: 20px; flex-shrink: 0; }

.sidebar-toggle {
  width: 28px; height: 28px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-secondary);
  transition: background 0.18s, transform 0.22s;
  flex-shrink: 0;
}
.sidebar-toggle:hover { background: var(--color-bg); }
.sidebar-toggle svg { width: 14px; height: 14px; }

.sidebar-nav {
  flex: 1;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.18s, background 0.18s;
  white-space: nowrap;
}
.nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
.nav-item:hover { color: var(--color-primary); background: var(--color-primary-light); }
.nav-item.active { color: var(--color-primary); background: var(--color-primary-light); }

.sidebar-footer { padding: 8px; border-top: 1px solid var(--color-border); }
.logout-btn { color: var(--color-text-secondary); width: 100%; }
.logout-btn:hover { color: var(--color-danger); background: #FEF2F2; }

/* 主区域 */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-header {
  height: var(--header-h);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
  flex-shrink: 0;
}
.page-title { font-size: 0.95rem; font-weight: 600; }
.header-left { flex: 1; }
.header-right { display: flex; align-items: center; gap: 10px; }
.admin-user {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.83rem;
  color: var(--color-text-secondary);
}

.admin-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
</style>
