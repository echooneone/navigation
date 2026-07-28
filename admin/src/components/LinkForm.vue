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
              @click="forceFetchFavicon"
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
                :src="form.icon + '?v=' + previewKey"
                :key="previewKey"
                alt="图标预览"
                @error="e => e.target.style.display='none'"
              />
              <span v-else class="placeholder-char">{{ form.title?.charAt(0) || '?' }}</span>
            </div>
            <div style="flex:1">
              <div class="flex items-stretch gap-2">
                <input v-model="form.icon" class="form-input" type="text" placeholder="图标 URL（留空自动抓取或使用首字符）" style="flex:1" />
                <label class="btn btn-secondary" style="cursor:pointer;padding:0 10px;flex-shrink:0;display:flex;align-items:center" title="上传本地图标">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  <input type="file" accept="image/*" @change="handleUpload" style="display:none" />
                </label>
              </div>
              <span v-if="uploading" class="text-secondary text-sm mt-2" style="display:inline-block">上传中...</span>
            </div>
          </div>
          <!-- 品牌图标预设 -->
          <div class="icon-presets">
            <div v-for="(items, cat) in iconPresets" :key="cat" class="preset-group">
              <div class="preset-cat-label">{{ cat }}</div>
              <div class="preset-items">
                <button
                  v-for="p in items"
                  :key="p.domain"
                  type="button"
                  class="icon-preset-btn"
                  :class="{ active: form.icon && form.icon.includes(p.domain) }"
                  :title="p.label"
                  @click="handlePresetClick(p)"
                >
                  <img
                    :src="`/api/favicon/img?domain=${p.domain}&_=${cacheBuster}`"
                    :alt="p.label"
                    loading="lazy"
                    @error="e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }"
                  />
                  <span class="preset-fallback" style="display:none">{{ p.label.charAt(0) }}</span>
                </button>
              </div>
            </div>
            <!-- 自定义图标（用户上传的） -->
            <div v-if="customIcons.length" class="preset-group">
              <div class="preset-cat-label">自定义</div>
              <div class="preset-items">
                <button
                  v-for="c in customIcons"
                  :key="c.url"
                  type="button"
                  class="icon-preset-btn"
                  :class="{ active: form.icon === c.url }"
                  :title="c.label"
                  @click="form.icon = form.icon === c.url ? '' : c.url"
                >
                  <img
                    :src="c.url"
                    :alt="c.label"
                    loading="lazy"
                    @error="e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }"
                  />
                  <span class="preset-fallback" style="display:none">{{ c.label.charAt(0) }}</span>
                </button>
              </div>
            </div>
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
const cacheBuster     = ref(0)
const previewKey      = ref(0)

function setIcon(url) {
  form.icon = url
  previewKey.value++
  if (url) {
    cacheBuster.value++
    addCustomIcon(url)
  }
}

const iconPresets = {
  '开发工具': [
    { label: 'GitHub',    domain: 'github.com' },
    { label: 'GitLab',    domain: 'gitlab.com' },
    { label: 'Gitee 码云', domain: 'gitee.com' },
    { label: 'VS Code',   domain: 'code.visualstudio.com' },
    { label: 'JetBrains', domain: 'jetbrains.com' },
    { label: 'npm',       domain: 'www.npmjs.com' },
    { label: 'Node.js',   domain: 'nodejs.org' },
    { label: 'Python',    domain: 'www.python.org' },
    { label: 'Go',        domain: 'go.dev' },
    { label: 'Rust',      domain: 'www.rust-lang.org' },
    { label: 'Docker',    domain: 'www.docker.com' },
    { label: 'K8s',       domain: 'kubernetes.io' },
    { label: 'Linux',     domain: 'www.kernel.org' },
  ],
  '技术社区': [
    { label: 'Stack Overflow', domain: 'stackoverflow.com' },
    { label: 'MDN',            domain: 'developer.mozilla.org' },
    { label: '掘金',            domain: 'juejin.cn' },
    { label: 'SegmentFault',   domain: 'segmentfault.com' },
    { label: 'CSDN',           domain: 'www.csdn.net' },
    { label: '博客园',          domain: 'www.cnblogs.com' },
  ],
  'AI 工具': [
    { label: 'DeepSeek',    domain: 'chat.deepseek.com' },
    { label: '通义千问',     domain: 'tongyi.aliyun.com' },
    { label: '文心一言',     domain: 'yiyan.baidu.com' },
    { label: 'Kimi',        domain: 'kimi.moonshot.cn' },
    { label: '豆包',         domain: 'www.doubao.com' },
    { label: 'ChatGPT',     domain: 'openai.com' },
    { label: 'Claude',      domain: 'claude.ai' },
    { label: 'Gemini',      domain: 'gemini.google.com' },
    { label: 'Cursor',      domain: 'cursor.com' },
    { label: 'Perplexity',  domain: 'www.perplexity.ai' },
    { label: 'HuggingFace', domain: 'huggingface.co' },
    { label: 'Grok',        domain: 'grok.com' },
    { label: 'Mistral',     domain: 'mistral.com' },
    { label: 'Midjourney',  domain: 'midjourney.com' },
  ],
  '设计创意': [
    { label: 'Figma',     domain: 'www.figma.com' },
    { label: 'Canva',     domain: 'www.canva.com' },
    { label: '即时设计',   domain: 'js.design' },
    { label: '蓝湖',       domain: 'lanhuapp.com' },
    { label: 'Dribbble',  domain: 'dribbble.com' },
    { label: 'Unsplash',  domain: 'unsplash.com' },
    { label: 'Stability', domain: 'stability.ai' },
  ],
  '设计创意': [
    { label: 'Figma',    domain: 'www.figma.com' },
    { label: 'Canva',    domain: 'www.canva.com' },
    { label: '即时设计',  domain: 'js.design' },
    { label: '蓝湖',      domain: 'lanhuapp.com' },
    { label: 'Dribbble', domain: 'dribbble.com' },
    { label: 'Unsplash', domain: 'unsplash.com' },
  ],
  '效率协作': [
    { label: 'Notion',   domain: 'www.notion.so' },
    { label: '飞书',     domain: 'www.feishu.cn' },
    { label: '钉钉',     domain: 'www.dingtalk.com' },
    { label: '企业微信', domain: 'work.weixin.qq.com' },
    { label: 'Trello',   domain: 'trello.com' },
    { label: 'Linear',   domain: 'linear.app' },
    { label: 'Slack',    domain: 'slack.com' },
    { label: 'Obsidian', domain: 'obsidian.md' },
  ],
  '通讯社交': [
    { label: '微信',     domain: 'weixin.qq.com' },
    { label: 'QQ',       domain: 'qq.com' },
    { label: '微博',     domain: 'weibo.com' },
    { label: '知乎',     domain: 'www.zhihu.com' },
    { label: 'Bilibili', domain: 'www.bilibili.com' },
    { label: '小红书',   domain: 'www.xiaohongshu.com' },
    { label: 'LinkedIn', domain: 'www.linkedin.com' },
  ],
  '云服务': [
    { label: '阿里云',     domain: 'www.aliyun.com' },
    { label: '腾讯云',     domain: 'cloud.tencent.com' },
    { label: '华为云',     domain: 'www.huaweicloud.com' },
    { label: 'AWS',        domain: 'aws.amazon.com' },
    { label: 'Azure',      domain: 'azure.microsoft.com' },
    { label: 'Vercel',     domain: 'vercel.com' },
    { label: 'Cloudflare', domain: 'www.cloudflare.com' },
  ],
  '数据库': [
    { label: 'MySQL',         domain: 'www.mysql.com' },
    { label: 'PostgreSQL',    domain: 'www.postgresql.org' },
    { label: 'MongoDB',       domain: 'www.mongodb.com' },
    { label: 'Redis',         domain: 'redis.io' },
    { label: 'Elasticsearch', domain: 'www.elastic.co' },
    { label: 'Supabase',      domain: 'supabase.com' },
  ],
  '搜索资讯': [
    { label: '百度',         domain: 'www.baidu.com' },
    { label: 'Google',       domain: 'www.google.com' },
    { label: 'Bing',         domain: 'www.bing.com' },
    { label: '少数派',       domain: 'sspai.com' },
    { label: 'Product Hunt', domain: 'www.producthunt.com' },
  ],
  '视频娱乐': [
    { label: 'Bilibili', domain: 'www.bilibili.com' },
    { label: '爱奇艺',   domain: 'www.iqiyi.com' },
    { label: '优酷',     domain: 'www.youku.com' },
    { label: '腾讯视频', domain: 'v.qq.com' },
    { label: '芒果 TV',  domain: 'www.mgtv.com' },
    { label: '抖音',     domain: 'www.douyin.com' },
    { label: '快手',     domain: 'www.kuaishou.com' },
    { label: 'Netflix',  domain: 'www.netflix.com' },
  ],
  '音乐': [
    { label: '网易云音乐',  domain: 'music.163.com' },
    { label: 'QQ 音乐',     domain: 'y.qq.com' },
    { label: 'Apple Music', domain: 'music.apple.com' },
    { label: 'Spotify',     domain: 'open.spotify.com' },
    { label: 'Suno',       domain: 'suno.com' },
  ],
  '购物': [
    { label: '淘宝',   domain: 'www.taobao.com' },
    { label: '京东',   domain: 'www.jd.com' },
    { label: '拼多多', domain: 'www.pinduoduo.com' },
    { label: 'Amazon', domain: 'www.amazon.com' },
    { label: '闲鱼',   domain: 'www.goofish.com' },
  ],
  '学习': [
    { label: '慕课网',   domain: 'www.imooc.com' },
    { label: 'LeetCode', domain: 'leetcode.cn' },
    { label: '牛客网',   domain: 'www.nowcoder.com' },
    { label: '极客时间', domain: 'time.geekbang.org' },
    { label: 'Coursera', domain: 'www.coursera.org' },
  ],
  '邮箱': [
    { label: 'QQ 邮箱',  domain: 'mail.qq.com' },
    { label: '163 邮箱', domain: 'mail.163.com' },
    { label: 'Gmail',    domain: 'mail.google.com' },
    { label: 'Outlook',  domain: 'outlook.live.com' },
  ],
  '科技大厂': [
    { label: 'Apple',      domain: 'apple.com' },
    { label: 'Microsoft',  domain: 'microsoft.com' },
    { label: 'Meta',       domain: 'meta.com' },
    { label: 'Nvidia',     domain: 'nvidia.com' },
    { label: 'ByteDance',  domain: 'bytedance.com' },
    { label: 'Tencent',    domain: 'tencent.com' },
  ],
  '其他': [
    { label: 'Steam',     domain: 'store.steampowered.com' },
    { label: 'DeepL',     domain: 'www.deepl.com' },
    { label: '1Password', domain: '1password.com' },
    { label: 'Bitwarden', domain: 'bitwarden.com' },
  ],
}

// ── 自定义图标（用户上传的图标自动记录到预设中）──
const LS_CUSTOM_ICONS = 'nav-custom-icons'
const customIcons = ref(loadCustomIcons())
function loadCustomIcons() {
  try { return JSON.parse(localStorage.getItem(LS_CUSTOM_ICONS) || '[]') }
  catch { return [] }
}
function saveCustomIcons() {
  localStorage.setItem(LS_CUSTOM_ICONS, JSON.stringify(customIcons.value))
}
function addCustomIcon(url) {
  if (!url || !url.startsWith('/uploads/')) return
  if (customIcons.value.find(c => c.url === url)) return
  const name = url.split('/').pop().replace(/^auto_/, '').replace(/\.[^.]+$/, '')
  customIcons.value.unshift({ url, label: name })
  if (customIcons.value.length > 20) customIcons.value.pop()
  saveCustomIcons()
}

async function handlePresetClick(preset) {
  // 如果已选中此预设的图标，再次点击取消
  if (form.icon && form.icon.includes(preset.domain)) {
    setIcon('')
    return
  }
  fetchingFavicon.value = true
  try {
    const res = await api.get(`/favicon/cache?url=https://${preset.domain}`)
    if (res.data.success && res.data.data?.iconUrl) {
      setIcon(res.data.data.iconUrl)
      cacheBuster.value++  // 图标已缓存，刷新所有预设预览
    }
  } catch {
    // 失败静默，用户可手动设置图标 URL
  } finally {
    fetchingFavicon.value = false
  }
}

function isEmoji(str) {
  return str && /\p{Emoji}/u.test(str) && str.length <= 4
}

async function autoFetchFavicon() {
  // URL 失焦时自动抓取：仅在图标为空时触发
  if (!form.url || form.icon) return
  fetchingFavicon.value = true
  try {
    const res = await api.get(`/favicon/cache?url=${encodeURIComponent(form.url)}`)
    if (res.data.success && res.data.data?.iconUrl) {
      setIcon(res.data.data.iconUrl)
    }
  } catch { /* 静默 */ }
  finally { fetchingFavicon.value = false }
}

async function forceFetchFavicon() {
  // 按钮点击强制抓取：即使已有图标也重新抓取
  if (!form.url) return
  fetchingFavicon.value = true
  try {
    const res = await api.get(`/favicon/cache?url=${encodeURIComponent(form.url)}`)
    if (res.data.success && res.data.data?.iconUrl) {
      setIcon(res.data.data.iconUrl)
    } else {
      showToast('未找到图标', 'warning')
    }
  } catch {
    showToast('图标抓取失败，请检查网络或手动设置', 'error')
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
      setIcon(res.data.data.url)
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
  width: 38px;
  height: 38px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  flex-shrink: 0;
  overflow: hidden;
}
.icon-preview img { width: 22px; height: 22px; object-fit: contain; }
[data-theme="dark"] .icon-preview { background: rgba(255,255,255,.08); }
.placeholder-char {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
}

.icon-presets {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  padding: 10px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  max-height: 300px;
  overflow-y: auto;
}
.preset-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.preset-cat-label {
  font-family: var(--font-mono);
  font-size: .68rem;
  font-weight: 600;
  letter-spacing: .08em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  padding: 2px 0;
}
.preset-items {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
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
  transition: border-color 0.15s, transform 0.15s, background 0.15s;
  position: relative;
}
.icon-preset-btn:hover { border-color: var(--color-primary); transform: scale(1.1); }
.icon-preset-btn.active { border-color: var(--color-primary); background: var(--color-primary-light); }
.icon-preset-btn img { width: 20px; height: 20px; object-fit: contain; display: block; }
[data-theme="dark"] .icon-preset-btn { background: rgba(255,255,255,.12); }
.preset-fallback {
  width: 20px; height: 20px;
  font-family: var(--font-mono);
  font-size: .68rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  border-radius: 2px;
}

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
