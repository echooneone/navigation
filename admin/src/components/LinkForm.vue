<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-box">
      <div class="modal-header">
        <span class="modal-title">{{ isEdit ? '编辑链接' : '添加链接' }}</span>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>

      <form class="modal-body" @submit.prevent="handleSave">
        <!-- 名称 -->
        <div class="form-group">
          <label class="form-label">名称 <span style="color:var(--color-danger)">*</span></label>
          <input v-model="form.title" class="form-input" type="text" placeholder="链接名称" required />
        </div>

        <!-- URL -->
        <div class="form-group">
          <label class="form-label">URL <span style="color:var(--color-danger)">*</span></label>
          <div class="flex items-center gap-2">
            <input
              v-model="form.url"
              class="form-input"
              type="url"
              placeholder="https://..."
              required
              @blur="autoFetchFavicon"
            />
            <button
              type="button"
              class="btn btn-secondary"
              style="flex-shrink:0;white-space:nowrap"
              @click="autoFetchFavicon"
              :disabled="fetchingFavicon"
            >{{ fetchingFavicon ? '...' : '抓取图标' }}</button>
          </div>
        </div>

        <!-- 图标 -->
        <div class="form-group">
          <label class="form-label">图标</label>
          <div class="icon-row">
            <!-- 预览 -->
            <div class="icon-preview">
              <img
                v-if="form.icon"
                :src="form.icon"
                alt="图标预览"
                @error="e => e.target.style.display='none'"
              />
              <span v-else class="placeholder-char">{{ form.title?.charAt(0) || '?' }}</span>
            </div>
            <div style="flex:1">
              <input v-model="form.icon" class="form-input" type="text" placeholder="图标 URL（留空自动抓取或使用首字符）" />
              <div class="flex items-center gap-2 mt-4">
                <label class="btn btn-secondary text-sm" style="cursor:pointer;padding:5px 10px">
                  上传本地图标
                  <input type="file" accept="image/*" @change="handleUpload" style="display:none" />
                </label>
                <span v-if="uploading" class="text-secondary text-sm">上传中...</span>
              </div>
            </div>
          </div>
          <!-- 品牌图标预设 -->
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

        <!-- 描述 -->
        <div class="form-group">
          <label class="form-label">描述</label>
          <input v-model="form.description" class="form-input" type="text" placeholder="一行简述（可选）" />
        </div>

        <!-- 分类 -->
        <div class="form-group">
          <label class="form-label">分类</label>
          <select v-model="form.category_id" class="form-select">
            <option :value="null">未分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <!-- 排序权重 -->
        <div class="form-group">
          <label class="form-label">排序权重</label>
          <input v-model.number="form.sort_order" class="form-input" type="number" min="0" placeholder="0（数值越小越靠前）" />
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
        <button class="btn btn-primary" type="button" @click="handleSave" :disabled="saving">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import api from '@/utils/api.js'
import { showToast } from '@/utils/toast.js'

const props = defineProps({
  link: Object,
  categories: { type: Array, default: () => [] }
})
const emit = defineEmits(['save', 'close'])

const isEdit = computed(() => !!props.link)

const form = reactive({
  title:       props.link?.title       || '',
  url:         props.link?.url         || '',
  description: props.link?.description || '',
  icon:        props.link?.icon        || '',
  category_id: props.link?.category_id ?? null,
  sort_order:  props.link?.sort_order  || 0,
  is_private:  !!props.link?.is_private
})

const fetchingFavicon = ref(false)
const uploading       = ref(false)
const saving          = ref(false)

const iconPresets = [
  // 代码 & 开发
  { label: 'GitHub',         url: 'https://www.google.com/s2/favicons?domain=github.com&sz=64' },
  { label: 'GitLab',         url: 'https://www.google.com/s2/favicons?domain=gitlab.com&sz=64' },
  { label: 'Bitbucket',      url: 'https://www.google.com/s2/favicons?domain=bitbucket.org&sz=64' },
  { label: 'npm',            url: 'https://www.google.com/s2/favicons?domain=npmjs.com&sz=64' },
  { label: 'VS Code',        url: 'https://www.google.com/s2/favicons?domain=vscode.dev&sz=64' },
  { label: 'JetBrains',      url: 'https://www.google.com/s2/favicons?domain=jetbrains.com&sz=64' },
  { label: 'CodePen',        url: 'https://www.google.com/s2/favicons?domain=codepen.io&sz=64' },
  { label: 'CodeSandbox',    url: 'https://www.google.com/s2/favicons?domain=codesandbox.io&sz=64' },
  { label: 'Stack Overflow', url: 'https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=64' },
  { label: 'MDN',            url: 'https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=64' },
  // AI & 机器学习
  { label: 'ChatGPT',        url: 'https://www.google.com/s2/favicons?domain=openai.com&sz=64' },
  { label: 'Claude',         url: 'https://www.google.com/s2/favicons?domain=claude.ai&sz=64' },
  { label: 'Gemini',         url: 'https://www.google.com/s2/favicons?domain=gemini.google.com&sz=64' },
  { label: 'Hugging Face',   url: 'https://www.google.com/s2/favicons?domain=huggingface.co&sz=64' },
  { label: 'Midjourney',     url: 'https://www.google.com/s2/favicons?domain=midjourney.com&sz=64' },
  { label: 'Stability AI',   url: 'https://www.google.com/s2/favicons?domain=stability.ai&sz=64' },
  { label: 'Perplexity',     url: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=64' },
  { label: 'Cursor',         url: 'https://www.google.com/s2/favicons?domain=cursor.com&sz=64' },
  // 云 & 部署
  { label: 'AWS',            url: 'https://www.google.com/s2/favicons?domain=aws.amazon.com&sz=64' },
  { label: 'Azure',          url: 'https://www.google.com/s2/favicons?domain=azure.microsoft.com&sz=64' },
  { label: 'Google Cloud',   url: 'https://www.google.com/s2/favicons?domain=cloud.google.com&sz=64' },
  { label: 'Vercel',         url: 'https://www.google.com/s2/favicons?domain=vercel.com&sz=64' },
  { label: 'Netlify',        url: 'https://www.google.com/s2/favicons?domain=netlify.com&sz=64' },
  { label: 'Cloudflare',     url: 'https://www.google.com/s2/favicons?domain=cloudflare.com&sz=64' },
  { label: 'Docker',         url: 'https://www.google.com/s2/favicons?domain=docker.com&sz=64' },
  { label: 'Kubernetes',     url: 'https://www.google.com/s2/favicons?domain=kubernetes.io&sz=64' },
  // 数据库
  { label: 'MongoDB',        url: 'https://www.google.com/s2/favicons?domain=mongodb.com&sz=64' },
  { label: 'PostgreSQL',     url: 'https://www.google.com/s2/favicons?domain=postgresql.org&sz=64' },
  { label: 'MySQL',          url: 'https://www.google.com/s2/favicons?domain=mysql.com&sz=64' },
  { label: 'Redis',          url: 'https://www.google.com/s2/favicons?domain=redis.io&sz=64' },
  { label: 'Supabase',       url: 'https://www.google.com/s2/favicons?domain=supabase.com&sz=64' },
  // 设计
  { label: 'Figma',          url: 'https://www.google.com/s2/favicons?domain=figma.com&sz=64' },
  { label: 'Dribbble',       url: 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=64' },
  { label: 'Behance',        url: 'https://www.google.com/s2/favicons?domain=behance.net&sz=64' },
  { label: 'Unsplash',       url: 'https://www.google.com/s2/favicons?domain=unsplash.com&sz=64' },
  { label: 'Canva',          url: 'https://www.google.com/s2/favicons?domain=canva.com&sz=64' },
  // 效率 & 协作
  { label: 'Notion',         url: 'https://www.google.com/s2/favicons?domain=notion.so&sz=64' },
  { label: 'Obsidian',       url: 'https://www.google.com/s2/favicons?domain=obsidian.md&sz=64' },
  { label: 'Trello',         url: 'https://www.google.com/s2/favicons?domain=trello.com&sz=64' },
  { label: 'Linear',         url: 'https://www.google.com/s2/favicons?domain=linear.app&sz=64' },
  { label: 'Jira',           url: 'https://www.google.com/s2/favicons?domain=atlassian.com&sz=64' },
  { label: 'Todoist',        url: 'https://www.google.com/s2/favicons?domain=todoist.com&sz=64' },
  // 通讯 & 社交
  { label: 'Discord',        url: 'https://www.google.com/s2/favicons?domain=discord.com&sz=64' },
  { label: 'Slack',          url: 'https://www.google.com/s2/favicons?domain=slack.com&sz=64' },
  { label: 'Telegram',       url: 'https://www.google.com/s2/favicons?domain=telegram.org&sz=64' },
  { label: 'Twitter/X',      url: 'https://www.google.com/s2/favicons?domain=x.com&sz=64' },
  { label: 'LinkedIn',       url: 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=64' },
  { label: 'Reddit',         url: 'https://www.google.com/s2/favicons?domain=reddit.com&sz=64' },
  { label: 'Bilibili',       url: 'https://www.google.com/s2/favicons?domain=bilibili.com&sz=64' },
  { label: 'Weibo',          url: 'https://www.google.com/s2/favicons?domain=weibo.com&sz=64' },
  { label: 'WeChat',         url: 'https://www.google.com/s2/favicons?domain=wx.qq.com&sz=64' },
  // 视频 & 娱乐
  { label: 'YouTube',        url: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64' },
  { label: 'Netflix',        url: 'https://www.google.com/s2/favicons?domain=netflix.com&sz=64' },
  { label: 'Twitch',         url: 'https://www.google.com/s2/favicons?domain=twitch.tv&sz=64' },
  { label: '爱奇艺',          url: 'https://www.google.com/s2/favicons?domain=iqiyi.com&sz=64' },
  { label: '优酷',            url: 'https://www.google.com/s2/favicons?domain=youku.com&sz=64' },
  // 音乐
  { label: 'Spotify',        url: 'https://www.google.com/s2/favicons?domain=spotify.com&sz=64' },
  { label: '网易云音乐',       url: 'https://www.google.com/s2/favicons?domain=music.163.com&sz=64' },
  { label: 'Apple Music',    url: 'https://www.google.com/s2/favicons?domain=music.apple.com&sz=64' },
  // 搜索 & 资讯
  { label: 'Google',         url: 'https://www.google.com/s2/favicons?domain=google.com&sz=64' },
  { label: 'Baidu',          url: 'https://www.google.com/s2/favicons?domain=baidu.com&sz=64' },
  { label: 'Bing',           url: 'https://www.google.com/s2/favicons?domain=bing.com&sz=64' },
  { label: 'Wikipedia',      url: 'https://www.google.com/s2/favicons?domain=wikipedia.org&sz=64' },
  { label: 'Hacker News',    url: 'https://www.google.com/s2/favicons?domain=news.ycombinator.com&sz=64' },
  { label: '知乎',            url: 'https://www.google.com/s2/favicons?domain=zhihu.com&sz=64' },
  { label: '少数派',          url: 'https://www.google.com/s2/favicons?domain=sspai.com&sz=64' },
  // 阅读 & 写作
  { label: 'Medium',         url: 'https://www.google.com/s2/favicons?domain=medium.com&sz=64' },
  { label: 'Substack',       url: 'https://www.google.com/s2/favicons?domain=substack.com&sz=64' },
  { label: 'DEV.to',         url: 'https://www.google.com/s2/favicons?domain=dev.to&sz=64' },
  // 购物
  { label: 'Amazon',         url: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=64' },
  { label: '淘宝',            url: 'https://www.google.com/s2/favicons?domain=taobao.com&sz=64' },
  { label: '京东',            url: 'https://www.google.com/s2/favicons?domain=jd.com&sz=64' },
  // 学习
  { label: 'Coursera',       url: 'https://www.google.com/s2/favicons?domain=coursera.org&sz=64' },
  { label: 'Udemy',          url: 'https://www.google.com/s2/favicons?domain=udemy.com&sz=64' },
  { label: '慕课网',          url: 'https://www.google.com/s2/favicons?domain=imooc.com&sz=64' },
  // 邮件
  { label: 'Gmail',          url: 'https://www.google.com/s2/favicons?domain=gmail.com&sz=64' },
  { label: 'Outlook',        url: 'https://www.google.com/s2/favicons?domain=outlook.com&sz=64' },
  // 游戏
  { label: 'Steam',          url: 'https://www.google.com/s2/favicons?domain=store.steampowered.com&sz=64' },
  { label: 'Epic Games',     url: 'https://www.google.com/s2/favicons?domain=epicgames.com&sz=64' },
  // 其他
  { label: 'Linux',          url: 'https://www.google.com/s2/favicons?domain=kernel.org&sz=64' },
  { label: 'DeepL',          url: 'https://www.google.com/s2/favicons?domain=deepl.com&sz=64' },
  { label: 'Pinterest',      url: 'https://www.google.com/s2/favicons?domain=pinterest.com&sz=64' },
  { label: '1Password',      url: 'https://www.google.com/s2/favicons?domain=1password.com&sz=64' },
]

function isEmoji(str) {
  return str && /\p{Emoji}/u.test(str) && str.length <= 4
}

/** 将 Google favicon URL 在客户端下载并转为 base64 dataUrl */
async function fetchFaviconAsDataUrl(imageUrl) {
  const resp = await fetch(imageUrl, { mode: 'cors' })
  if (!resp.ok) throw new Error('fetch failed')
  const blob = await resp.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function autoFetchFavicon() {
  if (!form.url || form.icon) return
  fetchingFavicon.value = true
  try {
    // ① 先让服务端尝试抓取并缓存（服务端有谷歌访问时直接命中）
    const cacheRes = await api.get(`/favicon/cache?url=${encodeURIComponent(form.url)}`)
    if (cacheRes.data.success && cacheRes.data.data?.iconUrl) {
      form.icon = cacheRes.data.data.iconUrl
      return
    }

    // ② 服务端无法访问 Google → 由客户端下载图标再上传到服务器
    const { hostname } = new URL(form.url)
    const googleUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`
    try {
      const dataUrl = await fetchFaviconAsDataUrl(googleUrl)
      const uploadRes = await api.post('/favicon/cache-from-client', { domain: hostname, dataUrl })
      if (uploadRes.data.success && uploadRes.data.data?.iconUrl) {
        form.icon = uploadRes.data.data.iconUrl
        return
      }
    } catch {
      // 客户端下载或上传失败，回退到直接使用 Google URL
    }

    // ③ 兜底：直接使用 Google URL（仅对有谷歌访问的客户端可见）
    form.icon = googleUrl
  } catch {
    // 静默失败
  } finally {
    fetchingFavicon.value = false
  }
}

async function handleUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const fd = new FormData()
  fd.append('icon', file)
  uploading.value = true
  try {
    const res = await api.post('/upload/icon', fd)
    if (res.data.success) {
      form.icon = res.data.data.url
      showToast('图标上传成功', 'success')
    }
  } catch {
    showToast('图标上传失败', 'error')
  } finally {
    uploading.value = false
    e.target.value = ''
  }
}

async function handleSave() {
  if (!form.title || !form.url) {
    showToast('名称和 URL 不能为空', 'error')
    return
  }
  saving.value = true
  try {
    await emit('save', { ...form })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.icon-row { display: flex; align-items: flex-start; gap: 10px; }
.icon-preview {
  width: 48px;
  height: 48px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  flex-shrink: 0;
  overflow: hidden;
}
.icon-preview img { width: 28px; height: 28px; object-fit: contain; }
.placeholder-char {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
}

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
