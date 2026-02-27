<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-logo">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" stroke="currentColor" stroke-width="2"/>
        </svg>
        <h1>导航管理后台</h1>
        <p>请使用管理员账号登录</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label" for="username">用户名</label>
          <input
            id="username"
            v-model="form.username"
            class="form-input"
            type="text"
            placeholder="admin"
            autocomplete="username"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            class="form-input"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>
        <button class="btn btn-primary w-full" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner" style="width:16px;height:16px;border-width:2px;border-color:#fff4;border-top-color:#fff"></span>
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const auth   = useAuthStore()
const router = useRouter()

const form = reactive({ username: '', password: '' })
const loading   = ref(false)
const errorMsg  = ref('')

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    await auth.login(form.username, form.password)
    router.push({ name: 'Dashboard' })
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: 20px;
}
.login-card {
  width: 100%;
  max-width: 380px;
  padding: 36px 32px;
}
.login-logo {
  text-align: center;
  margin-bottom: 28px;
}
.login-logo svg {
  width: 40px;
  height: 40px;
  color: var(--color-primary);
  margin-bottom: 12px;
}
.login-logo h1 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 4px;
}
.login-logo p {
  font-size: 0.83rem;
  color: var(--color-text-secondary);
}
.login-form { display: flex; flex-direction: column; gap: 14px; }
.login-error {
  text-align: center;
  font-size: 0.83rem;
  color: var(--color-danger);
  padding: 8px 12px;
  background: #FEF2F2;
  border-radius: var(--radius-md);
}
</style>
