import axios from 'axios'
import { showToast } from './toast.js'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 响应拦截器：统一处理错误
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || '请求失败'
    if (err.response?.status === 401) {
      localStorage.removeItem('nav-admin-token')
      localStorage.removeItem('nav-admin-username')
      window.location.href = '/admin/login'
    } else {
      showToast(msg, 'error')
    }
    return Promise.reject(err)
  }
)

export default api
