<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-icon stat-icon-primary">
          <svg viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div>
          <div class="stat-value">{{ data.links.length }}</div>
          <div class="stat-label">链接总数</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon stat-icon-success">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div>
          <div class="stat-value">{{ data.categories.length }}</div>
          <div class="stat-label">分类总数</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon stat-icon-warning">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </div>
        <div>
          <div class="stat-value">{{ recentLinks.length }}</div>
          <div class="stat-label">最近7天新增</div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- 最近添加 -->
      <div class="card">
        <div class="card-section-header">
          <span class="card-section-title">最近添加的链接</span>
          <router-link class="btn btn-ghost text-sm" to="/links">查看全部</router-link>
        </div>
        <div v-if="latestLinks.length === 0" class="empty-state" style="padding:30px">
          <span>暂无链接</span>
        </div>
        <ul v-else class="recent-list">
          <li v-for="link in latestLinks" :key="link.id" class="recent-item">
            <img
              v-if="link.icon"
              :src="link.icon" alt=""
              class="recent-icon"
              loading="lazy"
              @error="e => e.target.style.display='none'"
            />
            <span v-else class="recent-icon-placeholder">{{ link.title.charAt(0) }}</span>
            <div class="recent-info">
              <a :href="link.url" target="_blank" rel="noopener" class="recent-title">{{ link.title }}</a>
              <span class="recent-url text-sm text-secondary">{{ link.url }}</span>
            </div>
            <span v-if="link.category_name" class="badge badge-primary">{{ link.category_name }}</span>
          </li>
        </ul>
      </div>

      <!-- 分类统计 -->
      <div class="card">
        <div class="card-section-header">
          <span class="card-section-title">分类链接统计</span>
          <router-link class="btn btn-ghost text-sm" to="/categories">管理分类</router-link>
        </div>
        <div v-if="data.categories.length === 0" class="empty-state" style="padding:30px">
          <span>暂无分类</span>
        </div>
        <ul v-else class="cat-list">
          <li v-for="cat in catStats" :key="cat.id" class="cat-item">
            <span class="cat-dot" :style="{ background: cat.color }"></span>
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-count">{{ cat.count }}</span>
            <div class="cat-bar-wrap">
              <div class="cat-bar" :style="{ width: cat.percent + '%', background: cat.color }"></div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data.js'

const data = useDataStore()

onMounted(() => { data.fetchAll() })

const latestLinks = computed(() =>
  [...data.links].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8)
)

const recentLinks = computed(() => {
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000
  return data.links.filter(l => new Date(l.created_at).getTime() > weekAgo)
})

const catStats = computed(() => {
  const max = Math.max(...data.categories.map(c => c.link_count || 0), 1)
  return data.categories.map(c => ({
    ...c,
    count: c.link_count || 0,
    percent: Math.round((c.link_count || 0) / max * 100)
  }))
})
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 22px; }

/* ── 统计卡片 ─────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 22px 24px;
  position: relative;
  overflow: hidden;
  transition: border-color var(--dur) var(--ease), transform var(--dur) var(--ease);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 36px; height: 2px;
  background: var(--color-text);
  transition: background var(--dur) var(--ease), width var(--dur) var(--ease);
}
.stat-card:hover { border-color: var(--color-text); transform: translateY(-2px); }
.stat-card:hover::before { width: 64px; background: var(--color-accent); }

.stat-icon {
  width: 40px; height: 40px;
  border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  color: var(--color-text);
}
.stat-icon-primary { background: var(--color-primary-light); color: var(--color-primary); border-color: transparent; }
.stat-icon-success { background: var(--color-success-soft); color: var(--color-success); border-color: transparent; }
.stat-icon-warning { background: var(--color-accent-soft); color: var(--color-accent); border-color: transparent; }
.stat-icon svg { width: 20px; height: 20px; }

.stat-value {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 2rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -.02em;
}
.stat-label {
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: .66rem;
  letter-spacing: .16em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

/* ── 双栏卡片 ─────────────────────────────────────── */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
}
@media (max-width: 980px) { .dashboard-grid { grid-template-columns: 1fr; } }

.card-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-hairline);
}
.card-section-title {
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 500;
  font-size: 1.05rem;
  letter-spacing: -.01em;
}

/* ── 最近列表 ─────────────────────────────────────── */
.recent-list { list-style: none; display: flex; flex-direction: column; }
.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid var(--color-hairline);
  transition: padding var(--dur) var(--ease);
}
.recent-item:last-child { border-bottom: none; }
.recent-item:hover { padding-left: 6px; }
.recent-icon { width: 26px; height: 26px; border-radius: var(--radius-xs); object-fit: contain; flex-shrink: 0; }
.recent-icon-placeholder {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-xs);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.recent-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.recent-title {
  font-size: .9rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  transition: color var(--dur-micro) var(--ease);
}
.recent-title:hover { color: var(--color-accent); }
.recent-url {
  font-family: var(--font-mono);
  font-size: .7rem;
  letter-spacing: .04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* ── 分类统计 ─────────────────────────────────────── */
.cat-list { list-style: none; display: flex; flex-direction: column; gap: 14px; }
.cat-item {
  display: grid;
  grid-template-columns: auto 1fr auto 110px;
  gap: 10px;
  align-items: center;
}
.cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.cat-name {
  font-size: .9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cat-count {
  font-family: var(--font-mono);
  font-size: .76rem;
  font-weight: 600;
  color: var(--color-text);
  text-align: right;
  letter-spacing: .04em;
}
.cat-bar-wrap {
  height: 4px;
  background: var(--color-bg);
  border: 1px solid var(--color-hairline);
  border-radius: 99px;
  overflow: hidden;
}
.cat-bar {
  height: 100%;
  border-radius: 99px;
  transition: width .6s var(--ease);
}
</style>
