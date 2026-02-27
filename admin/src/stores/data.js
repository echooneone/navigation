import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api.js'
import { showToast } from '@/utils/toast.js'

export const useDataStore = defineStore('data', () => {
  const links      = ref([])
  const categories = ref([])
  const loading    = ref(false)

  // ── 分类 ──────────────────────────────────────────────────
  async function fetchCategories() {
    const res = await api.get('/categories')
    categories.value = res.data.data || []
  }

  async function addCategory(data) {
    const res = await api.post('/categories', data)
    categories.value.push(res.data.data)
    showToast('分类已添加', 'success')
    return res.data.data
  }

  async function updateCategory(id, data) {
    const res = await api.put(`/categories/${id}`, data)
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) categories.value[idx] = res.data.data
    showToast('分类已更新', 'success')
    return res.data.data
  }

  async function deleteCategory(id) {
    await api.delete(`/categories/${id}`)
    categories.value = categories.value.filter(c => c.id !== id)
    // 将该分类下的链接 category_id 置空
    links.value = links.value.map(l => l.category_id === id ? { ...l, category_id: null } : l)
    showToast('分类已删除', 'success')
  }

  async function sortCategories(items) {
    await api.put('/categories/sort', { items })
    await fetchCategories()
  }

  // ── 链接 ──────────────────────────────────────────────────
  async function fetchLinks() {
    const res = await api.get('/links')
    links.value = res.data.data || []
  }

  async function addLink(data) {
    const res = await api.post('/links', data)
    links.value.push(res.data.data)
    showToast('链接已添加', 'success')
    return res.data.data
  }

  async function updateLink(id, data) {
    const res = await api.put(`/links/${id}`, data)
    const idx = links.value.findIndex(l => l.id === id)
    if (idx !== -1) links.value[idx] = res.data.data
    showToast('链接已更新', 'success')
    return res.data.data
  }

  async function deleteLink(id) {
    await api.delete(`/links/${id}`)
    links.value = links.value.filter(l => l.id !== id)
    showToast('链接已删除', 'success')
  }

  async function sortLinks(items) {
    await api.put('/links/sort', { items })
  }

  // ── 加载全部 ──────────────────────────────────────────────
  async function fetchAll() {
    loading.value = true
    try {
      await Promise.all([fetchCategories(), fetchLinks()])
    } finally {
      loading.value = false
    }
  }

  // ── 备份 ──────────────────────────────────────────────────
  async function exportData() {
    const res = await api.post('/backup/export', {}, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `navigation_backup_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('数据导出成功', 'success')
  }

  async function importData(json) {
    const res = await api.post('/backup/import', json)
    await fetchAll()
    showToast(res.data.message, 'success')
  }

  return {
    links, categories, loading,
    fetchCategories, addCategory, updateCategory, deleteCategory, sortCategories,
    fetchLinks, addLink, updateLink, deleteLink, sortLinks,
    fetchAll, exportData, importData
  }
})
