import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import './style.css'

// 在挂载前同步设置主题，避免闪烁
;(function initTheme() {
  const saved      = localStorage.getItem('nav-theme')
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.setAttribute('data-theme', saved ?? (preferDark ? 'dark' : 'light'))
})()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
