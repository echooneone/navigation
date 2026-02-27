<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-icon" style="background:#EEF1FE;color:#4F6EF7">
          <svg viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div>
          <div class="stat-value">{{ data.links.length }}</div>
          <div class="stat-label">链接总数</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon" style="background:#F0FDF4;color:#10B981">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div>
          <div class="stat-value">{{ data.categories.length }}</div>
          <div class="stat-label">分类总数</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon" style="background:#FFF7ED;color:#F59E0B">
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
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon svg { width: 22px; height: 22px; }
.stat-value { font-size: 1.6rem; font-weight: 700; line-height: 1.1; }
.stat-label { font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 2px; }

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }

.card-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.card-section-title { font-weight: 600; font-size: 0.9rem; }

.recent-list { list-style: none; display: flex; flex-direction: column; }
.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}
.recent-item:last-child { border-bottom: none; }
.recent-icon { width: 24px; height: 24px; border-radius: 4px; object-fit: contain; flex-shrink: 0; }
.recent-icon-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.recent-info { flex: 1; min-width: 0; }
.recent-title { font-size: 0.85rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
.recent-title:hover { color: var(--color-primary); }
.recent-url { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }

.cat-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.cat-item { display: grid; grid-template-columns: auto 1fr auto 100px; gap: 8px; align-items: center; }
.cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.cat-name { font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cat-count { font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary); text-align: right; }
.cat-bar-wrap { height: 6px; background: var(--color-bg); border-radius: 99px; overflow: hidden; }
.cat-bar { height: 100%; border-radius: 99px; transition: width 0.5s ease; opacity: 0.7; }
</style>
