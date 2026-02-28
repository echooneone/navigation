<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box" style="max-width:400px">
      <div class="modal-header">
        <span class="modal-title">{{ isEdit ? '编辑分类' : '添加分类' }}</span>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <form class="modal-body" @submit.prevent="handleSave">
        <!-- 名称 -->
        <div class="form-group">
          <label class="form-label">名称 <span style="color:var(--color-danger)">*</span></label>
          <input v-model="form.name" class="form-input" type="text" placeholder="分类名称" required />
        </div>

        <!-- 图标 URL -->
        <div class="form-group">
          <label class="form-label">图标 URL</label>
          <div class="flex items-center gap-2">
            <input v-model="form.icon" class="form-input" type="text" placeholder="https://example.com/icon.png（可留空）" />
            <span class="icon-preview-sm">
              <img v-if="form.icon" :src="form.icon" class="icon-preview-img" alt="" @error="e => e.target.style.display='none'" />
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="22" height="22"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            </span>
          </div>
          <!-- 预设图标 -->
          <div class="icon-presets">
            <button
              v-for="p in iconPresets"
              :key="p.url"
              type="button"
              class="icon-preset-btn"
              :class="{ active: form.icon === p.url }"
              :title="p.label"
              @click="form.icon = form.icon === p.url ? '' : p.url"
            >
              <img :src="p.url" :alt="p.label" loading="lazy" @error="e => e.target.style.opacity='.2'" />
            </button>
          </div>
        </div>

        <!-- 排序 -->
        <div class="form-group">
          <label class="form-label">排序权重</label>
          <input v-model.number="form.sort_order" class="form-input" type="number" min="0" />
        </div>

        <!-- 私有 -->
        <div class="form-group">
          <label class="form-label">可见性</label>
          <label class="toggle-label">
            <input type="checkbox" v-model="form.is_private" class="toggle-checkbox" />
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
            <span class="toggle-text">{{ form.is_private ? '私有（仅登录后可见）' : '公开' }}</span>
          </label>
        </div>
      </form>

      <div class="modal-footer">
        <button class="btn btn-secondary" type="button" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" type="button" @click="handleSave">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'

const props = defineProps({ category: Object })
const emit = defineEmits(['save', 'close'])

const isEdit = computed(() => !!props.category)

const form = reactive({
  name:       props.category?.name       || '',
  icon:       props.category?.icon       || '',
  sort_order: props.category?.sort_order || 0,
  is_private: !!props.category?.is_private
})

const ICON_COLOR = '%23374151'
const iconPresets = [
  // 开发 & 技术
  { label: '代码开发',    url: `https://api.iconify.design/mdi/code-braces.svg?color=${ICON_COLOR}` },
  { label: '前端',        url: `https://api.iconify.design/mdi/language-html5.svg?color=${ICON_COLOR}` },
  { label: '后端',        url: `https://api.iconify.design/mdi/server.svg?color=${ICON_COLOR}` },
  { label: '数据库',      url: `https://api.iconify.design/mdi/database.svg?color=${ICON_COLOR}` },
  { label: '版本控制',    url: `https://api.iconify.design/mdi/source-branch.svg?color=${ICON_COLOR}` },
  { label: '命令行',      url: `https://api.iconify.design/mdi/console.svg?color=${ICON_COLOR}` },
  { label: 'API',         url: `https://api.iconify.design/mdi/api.svg?color=${ICON_COLOR}` },
  { label: '容器/云',     url: `https://api.iconify.design/mdi/cloud-outline.svg?color=${ICON_COLOR}` },
  { label: '安全',        url: `https://api.iconify.design/mdi/shield-check-outline.svg?color=${ICON_COLOR}` },
  { label: '网络',        url: `https://api.iconify.design/mdi/web.svg?color=${ICON_COLOR}` },
  // AI
  { label: 'AI',          url: `https://api.iconify.design/mdi/robot-outline.svg?color=${ICON_COLOR}` },
  { label: '机器学习',    url: `https://api.iconify.design/mdi/brain.svg?color=${ICON_COLOR}` },
  // 设计
  { label: '设计',        url: `https://api.iconify.design/mdi/palette-outline.svg?color=${ICON_COLOR}` },
  { label: '图标',        url: `https://api.iconify.design/mdi/vector-square.svg?color=${ICON_COLOR}` },
  { label: '摄影',        url: `https://api.iconify.design/mdi/camera-outline.svg?color=${ICON_COLOR}` },
  // 效率 & 办公
  { label: '效率工具',    url: `https://api.iconify.design/mdi/check-circle-outline.svg?color=${ICON_COLOR}` },
  { label: '笔记',        url: `https://api.iconify.design/mdi/notebook-outline.svg?color=${ICON_COLOR}` },
  { label: '日历',        url: `https://api.iconify.design/mdi/calendar-outline.svg?color=${ICON_COLOR}` },
  { label: '文件管理',    url: `https://api.iconify.design/mdi/folder-outline.svg?color=${ICON_COLOR}` },
  { label: '文档',        url: `https://api.iconify.design/mdi/file-document-outline.svg?color=${ICON_COLOR}` },
  { label: '协作',        url: `https://api.iconify.design/mdi/account-group-outline.svg?color=${ICON_COLOR}` },
  // 社交 & 通讯
  { label: '社交媒体',    url: `https://api.iconify.design/mdi/share-variant-outline.svg?color=${ICON_COLOR}` },
  { label: '即时通讯',    url: `https://api.iconify.design/mdi/chat-outline.svg?color=${ICON_COLOR}` },
  { label: '邮件',        url: `https://api.iconify.design/mdi/email-outline.svg?color=${ICON_COLOR}` },
  // 内容 & 媒体
  { label: '视频',        url: `https://api.iconify.design/mdi/play-circle-outline.svg?color=${ICON_COLOR}` },
  { label: '音乐',        url: `https://api.iconify.design/mdi/music-note.svg?color=${ICON_COLOR}` },
  { label: '阅读',        url: `https://api.iconify.design/mdi/book-open-outline.svg?color=${ICON_COLOR}` },
  { label: '播客',        url: `https://api.iconify.design/mdi/podcast.svg?color=${ICON_COLOR}` },
  { label: '新闻',        url: `https://api.iconify.design/mdi/newspaper.svg?color=${ICON_COLOR}` },
  // 学习
  { label: '学习',        url: `https://api.iconify.design/mdi/school-outline.svg?color=${ICON_COLOR}` },
  { label: '教程',        url: `https://api.iconify.design/mdi/teach.svg?color=${ICON_COLOR}` },
  // 生活
  { label: '购物',        url: `https://api.iconify.design/mdi/shopping-outline.svg?color=${ICON_COLOR}` },
  { label: '美食',        url: `https://api.iconify.design/mdi/food-outline.svg?color=${ICON_COLOR}` },
  { label: '出行',        url: `https://api.iconify.design/mdi/airplane.svg?color=${ICON_COLOR}` },
  { label: '健康',        url: `https://api.iconify.design/mdi/heart-outline.svg?color=${ICON_COLOR}` },
  { label: '地图',        url: `https://api.iconify.design/mdi/map-outline.svg?color=${ICON_COLOR}` },
  // 其他
  { label: '游戏',        url: `https://api.iconify.design/mdi/gamepad-variant-outline.svg?color=${ICON_COLOR}` },
  { label: '金融',        url: `https://api.iconify.design/mdi/currency-usd.svg?color=${ICON_COLOR}` },
  { label: '搜索',        url: `https://api.iconify.design/mdi/magnify.svg?color=${ICON_COLOR}` },
  { label: '工具箱',      url: `https://api.iconify.design/mdi/toolbox-outline.svg?color=${ICON_COLOR}` },
  { label: '主页',        url: `https://api.iconify.design/mdi/home-outline.svg?color=${ICON_COLOR}` },
  { label: '收藏',        url: `https://api.iconify.design/mdi/star-outline.svg?color=${ICON_COLOR}` },
  { label: '下载',        url: `https://api.iconify.design/mdi/download-outline.svg?color=${ICON_COLOR}` },
  { label: '设置',        url: `https://api.iconify.design/mdi/cog-outline.svg?color=${ICON_COLOR}` },
  { label: '资源',        url: `https://api.iconify.design/mdi/package-variant-closed.svg?color=${ICON_COLOR}` },
  { label: '导航',        url: `https://api.iconify.design/mdi/compass-outline.svg?color=${ICON_COLOR}` },
]

function handleSave() {
  if (!form.name) return
  emit('save', { ...form })
}
</script>

<style scoped>
.icon-preview-sm {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.icon-preview-img { width: 24px; height: 24px; object-fit: contain; }

.icon-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding: 8px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  max-height: 160px;
  overflow-y: auto;
}
.icon-preset-btn {
  width: 30px;
  height: 30px;
  padding: 3px;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, transform 0.15s;
}
.icon-preset-btn:hover { border-color: var(--color-primary); transform: scale(1.1); }
.icon-preset-btn.active { border-color: var(--color-primary); background: var(--color-primary-light); }
.icon-preset-btn img { width: 20px; height: 20px; object-fit: contain; display: block; }

.toggle-label { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.toggle-checkbox { display: none; }
.toggle-track {
  width: 40px; height: 22px; background: var(--color-border);
  border-radius: 11px; position: relative; transition: background 0.2s;
}
.toggle-checkbox:checked + .toggle-track { background: var(--color-primary); }
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 16px; height: 16px; background: #fff;
  border-radius: 50%; transition: left 0.2s;
}
.toggle-checkbox:checked + .toggle-track .toggle-thumb { left: 21px; }
.toggle-text { font-size: 13px; color: var(--color-text-secondary); }
</style>
