import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api.js'

export const useAuthStore = defineStore('auth', () => {
  const token    = ref(null)
  const username = ref(null)

  const isLoggedIn = computed(() => !!token.value)

  async function restoreSession() {
    const saved = localStorage.getItem('nav-admin-token')
    const savedUser = localStorage.getItem('nav-admin-username')
    if (!saved) return false

    api.defaults.headers.common['Authorization'] = `Bearer ${saved}`
    try {
      const res = await api.get('/auth/me')
      token.value = saved
      username.value = res.data.data.username || savedUser || 'admin'
      return true
    } catch {
      logout()
      return false
    }
  }

  async function login(pwd) {
    const res = await api.post('/auth/login', { password: pwd })
    token.value = res.data.data.token
    username.value = res.data.data.username
    localStorage.setItem('nav-admin-token', token.value)
    localStorage.setItem('nav-admin-username', username.value)
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    return res.data
  }

  function logout() {
    token.value = null
    username.value = null
    localStorage.removeItem('nav-admin-token')
    localStorage.removeItem('nav-admin-username')
    delete api.defaults.headers.common['Authorization']
  }

  async function changePassword(oldPassword, newPassword) {
    const res = await api.post('/auth/change-password', { oldPassword, newPassword })
    return res.data
  }

  return { token, username, isLoggedIn, restoreSession, login, logout, changePassword }
})
