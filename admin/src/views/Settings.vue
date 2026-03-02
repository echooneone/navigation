<template>
  <div class="settings-page">
    <div class="settings-grid">
      <!-- 修改密码 -->
      <div class="card">
        <h2 class="section-title">修改密码</h2>
        <form class="settings-form" @submit.prevent="handleChangePassword">
          <div class="form-group">
            <label class="form-label">当前密码</label>
            <input v-model="pwdForm.oldPassword" class="form-input" type="password" placeholder="当前密码" required />
          </div>
          <div class="form-group">
            <label class="form-label">新密码</label>
            <input v-model="pwdForm.newPassword" class="form-input" type="password" placeholder="至少6位" required minlength="6" />
          </div>
          <div class="form-group">
            <label class="form-label">确认新密码</label>
            <input v-model="pwdForm.confirmPassword" class="form-input" type="password" placeholder="再次输入新密码" required />
          </div>
          <p v-if="pwdError" class="error-tip">{{ pwdError }}</p>
          <button class="btn btn-primary" type="submit" :disabled="pwdLoading">
            {{ pwdLoading ? '保存中...' : '保存密码' }}
          </button>
        </form>
      </div>

      <!-- 数据备份 -->
      <div class="card">
        <h2 class="section-title">数据备份 / 恢复</h2>
        <div class="backup-section">
          <div class="backup-item">
            <div>
              <div class="backup-item-title">导出数据</div>
              <div class="backup-item-desc text-secondary text-sm">将所有链接和分类导出为 JSON 文件</div>
            </div>
            <button class="btn btn-secondary" @click="handleExport" :disabled="exporting">
              {{ exporting ? '导出中...' : '导出 JSON' }}
            </button>
          </div>
          <div class="backup-item">
            <div>
              <div class="backup-item-title">导入数据</div>
              <div class="backup-item-desc text-secondary text-sm">从备份 JSON 文件恢复（会覆盖现有数据）</div>
            </div>
            <label class="btn btn-secondary" style="cursor:pointer">
              选择文件
              <input type="file" accept=".json" @change="handleImport" style="display:none" />
            </label>
          </div>
        </div>
      </div>

      <!-- 站点设置 -->
      <div class="card">
        <h2 class="section-title">站点设置</h2>
        <div class="settings-form">
          <div class="form-group">
            <label class="form-label">页脚文字</label>
            <input v-model="siteForm.footer_text" class="form-input" type="text" placeholder="例如：Copyright © 2026 · 个人导航" />
            <p class="form-hint">显示在前台页面底部</p>
          </div>
          <button class="btn btn-primary" :disabled="siteLoading" @click="handleSaveSite">
            {{ siteLoading ? '保存中...' : '保存设置' }}
          </button>
        </div>
      </div>

      <!-- 前台显示 -->
      <div class="card">
        <h2 class="section-title">前台显示模式</h2>
        <div class="settings-form">
          <div class="mode-options">
            <label class="mode-option" :class="{ active: siteForm.scroll_mode === 'scroll' }">
              <input type="radio" v-model="siteForm.scroll_mode" value="scroll" style="display:none" />
              <div class="mode-icon">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><line x1="8" y1="6" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="14" x2="13" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="19" x2="12" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="10 21 12 23 14 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div class="mode-text">
                <span class="mode-name">普通滚动</span>
                <span class="mode-desc">传统垂直滚动浏览，所有分类一页展示</span>
              </div>
            </label>
            <label class="mode-option" :class="{ active: siteForm.scroll_mode === 'page' }">
              <input type="radio" v-model="siteForm.scroll_mode" value="page" style="display:none" />
              <div class="mode-icon">
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 2"/><polyline points="7 10 4 12 7 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="17 10 20 12 17 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div class="mode-text">
                <span class="mode-name">分页滑动</span>
                <span class="mode-desc">每个分类一屏，左右滑动切换，底部小圆点指示</span>
              </div>
            </label>
          </div>
          <button class="btn btn-primary" :disabled="siteLoading" @click="handleSaveSite">
            {{ siteLoading ? '保存中...' : '保存设置' }}
          </button>
        </div>
      </div>

      <!-- 图标本地化迁移 -->
      <div class="card">
        <h2 class="section-title">图标本地化迁移</h2>
        <div class="settings-form">
          <p class="form-hint" style="font-size:0.83rem;line-height:1.6">
            服务器环境无法访问 Google Favicon 时，可通过此功能将已有链接的 Google 图标<br />
            在当前浏览器下载并上传至服务器，使所有设备均可正常显示图标。
          </p>
          <div v-if="migrateStats" class="migrate-stats">
            <span>共 <b>{{ migrateStats.total }}</b> 个 Google 图标</span>
            <span>✓ 已完成 <b>{{ migrateStats.done }}</b></span>
            <span v-if="migrateStats.failed > 0" style="color:var(--color-danger)">✗ 失败 {{ migrateStats.failed }}</span>
          </div>
          <div v-if="migrating" class="migrate-progress">
            <div class="migrate-bar" :style="{ width: migrateProgress + '%' }"></div>
          </div>
          <button class="btn btn-secondary" :disabled="migrating" @click="handleMigrateIcons">
            {{ migrating ? `迁移中 (${migrateStats?.done ?? 0}/${migrateStats?.total ?? '...'})` : '一键迁移 Google 图标到本地' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import api from '@/utils/api.js'
import { useAuthStore } from '@/stores/auth.js'
import { useDataStore } from '@/stores/data.js'
import { showToast } from '@/utils/toast.js'

const auth = useAuthStore()
const data = useDataStore()

// 修改密码
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwdError  = ref('')
const pwdLoading = ref(false)

async function handleChangePassword() {
  pwdError.value = ''
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    pwdError.value = '两次输入的新密码不一致'
    return
  }
  pwdLoading.value = true
  try {
    await auth.changePassword(pwdForm.oldPassword, pwdForm.newPassword)
    showToast('密码修改成功', 'success')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
  } catch (e) {
    pwdError.value = e.response?.data?.message || '密码修改失败'
  } finally {
    pwdLoading.value = false
  }
}

// 数据导出
const exporting = ref(false)
async function handleExport() {
  exporting.value = true
  try { await data.exportData() } finally { exporting.value = false }
}

// 数据导入
async function handleImport(e) {
  const file = e.target.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const json = JSON.parse(text)
    if (!confirm(`即将导入 ${json.categories?.length || 0} 个分类、${json.links?.length || 0} 条链接，现有数据将被覆盖，确定吗？`)) return
    await data.importData(json)
  } catch (err) {
    showToast('导入失败：文件格式错误', 'error')
  }
  e.target.value = ''
}

// 站点设置
const siteForm = reactive({ footer_text: '', scroll_mode: 'scroll' })
const siteLoading = ref(false)

onMounted(async () => {
  try {
    const res = await api.get('/settings')
    siteForm.footer_text = res.data.data?.footer_text || ''
    siteForm.scroll_mode = res.data.data?.scroll_mode || 'scroll'
  } catch {}
})

async function handleSaveSite() {
  siteLoading.value = true
  try {
    await api.put('/settings', { footer_text: siteForm.footer_text, scroll_mode: siteForm.scroll_mode })
    showToast('设置已保存', 'success')
  } catch {}
  finally { siteLoading.value = false }
}

// 图标本地化迁移
const migrating = ref(false)
const migrateProgress = ref(0)
const migrateStats = ref(null)

/** 将 Google favicon URL 在客户端下载并转为 base64 dataUrl */
async function fetchFaviconAsDataUrl(imageUrl) {
  const resp = await fetch(imageUrl, { mode: 'cors' })
  if (!resp.ok) throw new Error('fetch failed')
  const blob = await resp.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function handleMigrateIcons() {
  migrating.value = true
  migrateProgress.value = 0
  migrateStats.value = null

  try {
    // 获取所有链接
    const linksRes = await api.get('/links')
    const links = linksRes.data?.data || []

    // 只处理 Google favicon 格式的图标
    const googleLinks = links.filter(
      (l) => l.icon && l.icon.includes('google.com/s2/favicons')
    )

    const total = googleLinks.length
    let done = 0
    let failed = 0
    migrateStats.value = { total, done, failed }

    if (total === 0) {
      showToast('没有需要迁移的 Google 图标', 'success')
      migrating.value = false
      return
    }

    for (const link of googleLinks) {
      try {
        // 从图标 URL 中提取域名
        const iconUrlObj = new URL(link.icon)
        const domain = iconUrlObj.searchParams.get('domain') || new URL(link.url).hostname

        // ① 先检查服务端是否已有缓存
        const checkRes = await api.get(`/favicon/cache?url=${encodeURIComponent(link.url)}`)
        if (checkRes.data.success && checkRes.data.data?.iconUrl) {
          // 已缓存，直接更新链接图标
          await api.put(`/links/${link.id}`, { icon: checkRes.data.data.iconUrl })
        } else {
          // ② 客户端下载后上传
          const dataUrl = await fetchFaviconAsDataUrl(link.icon)
          const uploadRes = await api.post('/favicon/cache-from-client', { domain, dataUrl })
          if (uploadRes.data.success && uploadRes.data.data?.iconUrl) {
            await api.put(`/links/${link.id}`, { icon: uploadRes.data.data.iconUrl })
          } else {
            throw new Error('upload failed')
          }
        }
        done++
      } catch {
        failed++
      }

      migrateStats.value = { total, done, failed }
      migrateProgress.value = Math.round(((done + failed) / total) * 100)
    }

    if (failed === 0) {
      showToast(`✓ 全部 ${total} 个图标已迁移到本地`, 'success')
    } else {
      showToast(`完成：${done} 成功，${failed} 失败`, 'warning')
    }

    // 刷新数据 store（让 Links 页面即时看到新图标路径）
    await data.fetchAll()
  } catch (e) {
    showToast('迁移过程出错：' + (e.message || '未知错误'), 'error')
  } finally {
    migrating.value = false
    migrateProgress.value = 100
  }
}
</script>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
  align-items: start;
}
.section-title { font-size: 0.95rem; font-weight: 600; margin-bottom: 16px; }
.settings-form { display: flex; flex-direction: column; gap: 12px; }
.error-tip { font-size: 0.83rem; color: var(--color-danger); }

.backup-section { display: flex; flex-direction: column; gap: 14px; }
.backup-item { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.backup-item-title { font-weight: 500; font-size: 0.875rem; }

.form-hint { font-size: 0.786rem; color: var(--color-text-secondary); margin-top: 4px; }

.migrate-stats { display: flex; gap: 16px; font-size: 0.83rem; padding: 8px 0; }
.migrate-progress {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}
.migrate-bar {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

/* 模式选项 */
.mode-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
.mode-option {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;
}
.mode-option:hover { border-color: var(--color-primary); background: var(--color-primary-light); }
.mode-option.active { border-color: var(--color-primary); background: var(--color-primary-light); }
.mode-icon { flex-shrink: 0; color: var(--color-primary); }
.mode-text { display: flex; flex-direction: column; gap: 2px; }
.mode-name { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
.mode-desc { font-size: 0.78rem; color: var(--color-text-secondary); }
</style>
