<template>
  <div class="cats-page">
    <div class="toolbar">
      <span class="text-secondary text-sm">共 {{ data.categories.length }} 个分类</span>
      <button class="btn btn-primary ml-auto" @click="openAddModal">
        <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        添加分类
      </button>
    </div>

    <div v-if="data.loading" class="empty-state"><div class="spinner"></div></div>

    <div v-else-if="data.categories.length === 0" class="empty-state">
      <span>暂无分类，点击右上角添加</span>
    </div>

    <div v-else class="cats-grid">
      <div
        v-for="cat in data.categories"
        :key="cat.id"
        class="cat-card card"
      >
        <div class="cat-card-top">
          <span class="cat-icon-wrap">
            <img v-if="cat.icon && !isEmojiStr(cat.icon)" :src="cat.icon" class="cat-icon-img" alt="" @error="e => e.target.style.display='none'" />
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </span>
          <div class="cat-info">
            <div class="cat-card-name">
              {{ cat.name }}
              <span v-if="cat.is_private" class="badge-private">🔒 私有</span>
            </div>
            <div class="text-secondary text-sm">{{ cat.link_count || 0 }} 条链接</div>
          </div>

        </div>
        <div class="cat-card-actions">
          <button class="btn btn-secondary" style="flex:1;justify-content:center" @click="openEditModal(cat)">编辑</button>
          <button class="btn btn-danger" style="padding:7px 12px" @click="confirmDelete(cat)">
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 分类表单 -->
    <CategoryForm
      v-if="showModal"
      :category="editingCat"
      @save="handleSave"
      @close="showModal = false"
    />

    <!-- 删除确认 -->
    <div v-if="deletingCat" class="modal-overlay" @click.self="deletingCat = null">
      <div class="modal-box" style="max-width:380px">
        <div class="modal-header">
          <span class="modal-title">确认删除</span>
          <button class="modal-close" @click="deletingCat = null">✕</button>
        </div>
        <div class="modal-body">
          <p>确定删除分类 <strong>{{ deletingCat.name }}</strong> 吗？该分类下的链接不会被删除，但会变为未分类。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="deletingCat = null">取消</button>
          <button class="btn btn-danger" @click="doDelete">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
function isEmojiStr(s) { return s && /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(s) }
import { useDataStore } from '@/stores/data.js'
import CategoryForm from '@/components/CategoryForm.vue'

const data = useDataStore()
onMounted(() => data.fetchAll())

const showModal  = ref(false)
const editingCat = ref(null)
const deletingCat = ref(null)

function openAddModal() { editingCat.value = null; showModal.value = true }
function openEditModal(cat) { editingCat.value = { ...cat }; showModal.value = true }
function confirmDelete(cat) { deletingCat.value = cat }

async function handleSave(formData) {
  if (editingCat.value) {
    await data.updateCategory(editingCat.value.id, formData)
  } else {
    await data.addCategory(formData)
  }
  showModal.value = false
}

async function doDelete() {
  await data.deleteCategory(deletingCat.value.id)
  deletingCat.value = null
}
</script>

<style scoped>
.toolbar { display: flex; align-items: center; margin-bottom: 16px; }

.cats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.cat-card { display: flex; flex-direction: column; gap: 12px; }
.cat-card-top { display: flex; align-items: center; gap: 10px; }
.cat-icon-wrap {
  width: 40px; height: 40px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.cat-icon-img { width: 22px; height: 22px; object-fit: contain; filter: brightness(0) opacity(0.65); }
.cat-info { flex: 1; min-width: 0; }
.cat-card-name { font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px; }
.cat-card-actions { display: flex; gap: 8px; }
.badge-private {
  font-size: 0.68rem; font-weight: 500; color: #9B6EF7;
  background: rgba(124, 58, 237, 0.12); border-radius: 4px; padding: 1px 6px; white-space: nowrap;
}
</style>
