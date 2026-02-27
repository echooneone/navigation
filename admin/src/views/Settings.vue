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

      <!-- 关于 -->
      <div class="card">
        <h2 class="section-title">关于</h2>
        <div class="about-content text-sm text-secondary">
          <p>个人导航页 v1.0</p>
          <p style="margin-top:6px">技术栈：Express + SQLite + Vue 3 + Vite</p>
          <p style="margin-top:6px"><a href="/" style="color:var(--color-primary)">查看前台</a></p>
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
const siteForm = reactive({ footer_text: '' })
const siteLoading = ref(false)

onMounted(async () => {
  try {
    const res = await api.get('/settings')
    siteForm.footer_text = res.data.data?.footer_text || ''
  } catch {}
})

async function handleSaveSite() {
  siteLoading.value = true
  try {
    await api.put('/settings', { footer_text: siteForm.footer_text })
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

.about-content p { line-height: 1.6; }
.form-hint { font-size: 0.786rem; color: var(--color-text-secondary); margin-top: 4px; }
</style>
