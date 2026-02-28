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
