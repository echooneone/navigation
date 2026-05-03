<template>
  <div class="login-page">
    <!-- 背景装饰：水印年份 + 网格 -->
    <span class="bg-watermark" aria-hidden="true">2026</span>
    <span class="bg-tag" aria-hidden="true">Personal Index · Console</span>

    <div class="login-card">
      <div class="login-head">
        <span class="brand-mark">N</span>
        <div class="head-meta">
          <span class="meta-num">CONSOLE / 00</span>
          <h1 class="head-title">导航 <em>管理后台</em></h1>
          <p class="head-sub">Authorize to manage links, categories &amp; settings.</p>
        </div>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label" for="password">Password / 管理员密码</label>
          <input
            id="password"
            v-model="form.password"
            class="form-input login-input"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>
        <button class="btn btn-primary submit-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner spinner-sm"></span>
          <span>{{ loading ? 'Verifying…' : 'Sign In →' }}</span>
        </button>
        <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>
      </form>

      <div class="login-foot">
        <a class="foot-link" href="/" target="_blank" rel="noopener">← 返回前台</a>
        <span class="foot-mono">EST · 2026</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const auth   = useAuthStore()
const router = useRouter()

const form = reactive({ password: '' })
const loading   = ref(false)
const errorMsg  = ref('')

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    await auth.login(form.password)
    router.push({ name: 'Dashboard' })
  } catch (err) {
    errorMsg.value = err.response?.data?.message || '密码错误，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
  z-index: 1;
}

/* 背景水印数字 */
.bg-watermark {
  position: absolute;
  right: -4vw;
  bottom: -8vh;
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(280px, 42vw, 620px);
  line-height: .8;
  color: var(--color-text);
  opacity: .04;
  pointer-events: none;
  letter-spacing: -.04em;
  z-index: 0;
}
[data-theme="dark"] .bg-watermark { opacity: .07; }

.bg-tag {
  position: absolute;
  top: 28px;
  left: 32px;
  font-family: var(--font-mono);
  font-size: .68rem;
  letter-spacing: .26em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  z-index: 0;
}

.login-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 420px;
  padding: 36px 36px 28px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-float);
}

.login-head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 30px;
}
.brand-mark {
  width: 46px; height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-style: italic;
  font-weight: 600;
  font-size: 1.5rem;
  color: var(--color-bg);
  background: var(--color-text);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}
.head-meta { display: flex; flex-direction: column; gap: 6px; }
.meta-num {
  font-family: var(--font-mono);
  font-size: .64rem;
  letter-spacing: .22em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}
.head-title {
  font-family: var(--font-serif);
  font-size: 1.4rem;
  font-weight: 500;
  letter-spacing: -.01em;
  line-height: 1.15;
}
.head-title em {
  font-style: italic;
  color: var(--color-accent);
}
.head-sub {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: .85rem;
  color: var(--color-text-secondary);
}

.login-form { display: flex; flex-direction: column; gap: 16px; }

.login-input {
  height: 48px;
  font-family: var(--font-mono);
  letter-spacing: .12em;
  font-size: .9rem;
}

.submit-btn {
  height: 48px;
  font-size: .76rem;
  letter-spacing: .18em;
}

.spinner-sm {
  width: 14px; height: 14px;
  border-width: 2px;
  border-color: rgba(255,255,255,.3);
  border-top-color: #fff;
}

.login-error {
  font-family: var(--font-mono);
  text-align: center;
  font-size: .72rem;
  letter-spacing: .08em;
  color: var(--color-danger);
  padding: 9px 12px;
  background: var(--color-danger-soft);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
}

.login-foot {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--color-hairline);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.foot-link {
  font-family: var(--font-mono);
  font-size: .68rem;
  letter-spacing: .14em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  transition: color var(--dur) var(--ease);
}
.foot-link:hover { color: var(--color-accent); }
.foot-mono {
  font-family: var(--font-mono);
  font-size: .64rem;
  letter-spacing: .2em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}
</style>
