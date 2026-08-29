import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import { useAuthStore } from './stores/auth.js'
import './style.css'

// 在挂载前同步设置主题，避免闪烁
;(function initTheme() {
  const saved      = localStorage.getItem('nav-theme')
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.setAttribute('data-theme', saved ?? (preferDark ? 'dark' : 'light'))
})()

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)

  // 挂载后台界面前先由服务端验证本地 Token，避免无效登录态短暂进入后台。
  await useAuthStore(pinia).restoreSession()

  app.use(router)
  app.mount('#app')
}

bootstrap()
