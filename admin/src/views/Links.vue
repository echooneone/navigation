<template>
  <div class="links-page">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-wrap">
        <input
          v-model="searchQ"
          class="form-input"
          type="search"
          placeholder="搜索链接..."
          style="max-width:300px"
        />
      </div>
      <div class="flex items-center gap-2 ml-auto">
        <select v-model="filterCatId" class="form-select" style="width:auto">
          <option value="">全部分类 ({{ data.links.length }})</option>
          <option v-for="cat in data.categories" :key="cat.id" :value="cat.id">
            {{ cat.name }} ({{ getCatCount(cat.id) }})
          </option>
        </select>
        <button class="btn btn-primary" @click="openAddModal">
          <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          添加链接
        </button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="data.loading" class="empty-state">
      <div class="spinner"></div>
    </div>

    <!-- 空态 -->
    <div v-else-if="filteredLinks.length === 0" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="1.5"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="1.5"/></svg>
      <span>{{ searchQ ? '没有匹配的链接' : '暂无链接，点击右上角添加' }}</span>
    </div>

    <!-- 链接表格 -->
    <div v-else class="card" style="padding:0;overflow:hidden">
      <table class="links-table">
        <thead>
          <tr>
            <th style="width:40px">#</th>
            <th>名称</th>
            <th>URL</th>
            <th>分类</th>
            <th style="width:120px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="link in filteredLinks" :key="link.id">
            <td>
              <img
                v-if="link.icon"
                :src="link.icon" alt=""
                style="width:20px;height:20px;border-radius:4px;object-fit:contain"
                loading="lazy"
                @error="e => e.target.style.display='none'"
              />
              <span v-else style="font-size:16px">{{ link.title.charAt(0) }}</span>
            </td>
            <td>
              <a :href="link.url" target="_blank" rel="noopener" class="link-title-cell">{{ link.title }}</a>
              <p v-if="link.description" class="text-secondary text-sm" style="margin-top:2px">{{ link.description }}</p>
            </td>
            <td class="url-cell">
              <a :href="link.url" target="_blank" rel="noopener" class="text-secondary text-sm">{{ link.url }}</a>
            </td>
            <td>
              <span v-if="link.category_name" class="badge badge-primary">{{ link.category_name }}</span>
              <span v-else class="text-secondary text-sm">—</span>
            </td>
            <td>
              <div class="flex items-center gap-2">
                <button class="btn btn-ghost" style="padding:4px 8px" @click="openEditModal(link)">编辑</button>
                <button class="btn btn-danger" style="padding:4px 8px;font-size:0.78rem" @click="confirmDelete(link)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 链接表单弹窗 -->
    <LinkForm
      v-if="showModal"
      :link="editingLink"
      :categories="data.categories"
      @save="handleSave"
      @close="showModal = false"
    />

    <!-- 删除确认 -->
    <div v-if="deletingLink" class="modal-overlay" @click.self="deletingLink = null">
      <div class="modal-box" style="max-width:380px">
        <div class="modal-header">
          <span class="modal-title">确认删除</span>
          <button class="modal-close" @click="deletingLink = null">✕</button>
        </div>
        <div class="modal-body">
          <p>确定要删除链接 <strong>{{ deletingLink.title }}</strong> 吗？此操作不可撤销。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="deletingLink = null">取消</button>
          <button class="btn btn-danger" @click="doDelete">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data.js'
import LinkForm from '@/components/LinkForm.vue'

const data = useDataStore()
onMounted(() => data.fetchAll())

const searchQ     = ref('')
const filterCatId = ref('')
const showModal   = ref(false)
const editingLink = ref(null)
const deletingLink = ref(null)

const filteredLinks = computed(() => {
  let list = data.links
  if (filterCatId.value !== '') {
    list = list.filter(l => l.category_id === Number(filterCatId.value))
  }
  if (searchQ.value.trim()) {
    const q = searchQ.value.toLowerCase()
    list = list.filter(l =>
      l.title.toLowerCase().includes(q) ||
      (l.description && l.description.toLowerCase().includes(q)) ||
      l.url.toLowerCase().includes(q)
    )
  }
  return list
})

function getCatCount(catId) {
  return data.links.filter(l => l.category_id === catId).length
}

function openAddModal() { editingLink.value = null; showModal.value = true }
function openEditModal(link) { editingLink.value = { ...link }; showModal.value = true }
function confirmDelete(link) { deletingLink.value = link }

async function handleSave(formData) {
  if (editingLink.value) {
    await data.updateLink(editingLink.value.id, formData)
  } else {
    await data.addLink(formData)
  }
  showModal.value = false
  // 刷新以获取最新 category_name
  await data.fetchLinks()
}

async function doDelete() {
  await data.deleteLink(deletingLink.value.id)
  deletingLink.value = null
}
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.search-wrap { flex: 1; min-width: 0; }
.links-table { width: 100%; border-collapse: collapse; }
.links-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.links-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}
.links-table tr:last-child td { border-bottom: none; }
.links-table tr:hover td { background: var(--color-bg); }

.link-title-cell {
  font-weight: 500;
  font-size: 0.875rem;
}
.link-title-cell:hover { color: var(--color-primary); }
.url-cell { max-width: 200px; overflow: hidden; }
.url-cell a { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; }
</style>
