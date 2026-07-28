/**
 * 预热预设图标：遍历所有预设域名，下载 favicon 到本地缓存
 * 运行：node warmup-presets.js
 */
const fs = require('fs');
const path = require('path');

const ICON_DIR = path.join(__dirname, 'uploads/icons');
if (!fs.existsSync(ICON_DIR)) fs.mkdirSync(ICON_DIR, { recursive: true });

// ── 预设列表（与 admin/src/components/LinkForm.vue 保持同步，已剔除不可达域名）──
const presets = [
  // 开发工具
  { label: 'GitHub', domain: 'github.com' },
  { label: 'GitLab', domain: 'gitlab.com' },
  { label: 'Gitee 码云', domain: 'gitee.com' },
  { label: 'VS Code', domain: 'code.visualstudio.com' },
  { label: 'JetBrains', domain: 'jetbrains.com' },
  { label: 'npm', domain: 'www.npmjs.com' },
  { label: 'Node.js', domain: 'nodejs.org' },
  { label: 'Python', domain: 'www.python.org' },
  { label: 'Go', domain: 'go.dev' },
  { label: 'Rust', domain: 'www.rust-lang.org' },
  { label: 'Docker', domain: 'www.docker.com' },
  { label: 'K8s', domain: 'kubernetes.io' },
  { label: 'Linux', domain: 'www.kernel.org' },
  { label: 'GitHub Copilot', domain: 'github.com' },
  // 技术社区
  { label: 'Stack Overflow', domain: 'stackoverflow.com' },
  { label: 'MDN', domain: 'developer.mozilla.org' },
  { label: '掘金', domain: 'juejin.cn' },
  { label: 'SegmentFault', domain: 'segmentfault.com' },
  { label: 'CSDN', domain: 'www.csdn.net' },
  { label: '博客园', domain: 'www.cnblogs.com' },
  { label: 'V2EX', domain: 'www.v2ex.com' },
  { label: 'Hacker News', domain: 'news.ycombinator.com' },
  // AI 工具
  { label: 'DeepSeek', domain: 'chat.deepseek.com' },
  { label: '通义千问', domain: 'tongyi.aliyun.com' },
  { label: '文心一言', domain: 'yiyan.baidu.com' },
  { label: 'Kimi', domain: 'kimi.moonshot.cn' },
  { label: '豆包', domain: 'www.doubao.com' },
  { label: 'ChatGPT', domain: 'openai.com' },
  { label: 'Claude', domain: 'claude.ai' },
  { label: 'Gemini', domain: 'gemini.google.com' },
  { label: 'Cursor', domain: 'cursor.com' },
  { label: 'Hugging Face', domain: 'huggingface.co' },
  // 设计创意
  { label: 'Figma', domain: 'www.figma.com' },
  { label: 'Canva', domain: 'www.canva.com' },
  { label: '即时设计', domain: 'js.design' },
  { label: '蓝湖', domain: 'lanhuapp.com' },
  { label: 'Dribbble', domain: 'dribbble.com' },
  { label: 'Behance', domain: 'www.behance.net' },
  { label: 'Unsplash', domain: 'unsplash.com' },
  { label: 'Pinterest', domain: 'www.pinterest.com' },
  // 效率协作
  { label: 'Notion', domain: 'www.notion.so' },
  { label: '飞书', domain: 'www.feishu.cn' },
  { label: '钉钉', domain: 'www.dingtalk.com' },
  { label: '企业微信', domain: 'work.weixin.qq.com' },
  { label: 'Trello', domain: 'trello.com' },
  { label: 'Linear', domain: 'linear.app' },
  { label: 'Slack', domain: 'slack.com' },
  { label: 'Discord', domain: 'discord.com' },
  { label: 'Obsidian', domain: 'obsidian.md' },
  // 通讯社交
  { label: '微信', domain: 'weixin.qq.com' },
  { label: 'QQ', domain: 'qq.com' },
  { label: '微博', domain: 'weibo.com' },
  { label: '知乎', domain: 'www.zhihu.com' },
  { label: 'Bilibili', domain: 'www.bilibili.com' },
  { label: '小红书', domain: 'www.xiaohongshu.com' },
  { label: 'Twitter/X', domain: 'x.com' },
  { label: 'LinkedIn', domain: 'www.linkedin.com' },
  { label: 'Telegram', domain: 'telegram.org' },
  // 云服务
  { label: '阿里云', domain: 'www.aliyun.com' },
  { label: '腾讯云', domain: 'cloud.tencent.com' },
  { label: '华为云', domain: 'www.huaweicloud.com' },
  { label: 'AWS', domain: 'aws.amazon.com' },
  { label: 'Azure', domain: 'azure.microsoft.com' },
  { label: 'Vercel', domain: 'vercel.com' },
  { label: 'Cloudflare', domain: 'www.cloudflare.com' },
  // 数据库
  { label: 'MySQL', domain: 'www.mysql.com' },
  { label: 'PostgreSQL', domain: 'www.postgresql.org' },
  { label: 'MongoDB', domain: 'www.mongodb.com' },
  { label: 'Redis', domain: 'redis.io' },
  { label: 'Elasticsearch', domain: 'www.elastic.co' },
  { label: 'Supabase', domain: 'supabase.com' },
  // 搜索资讯
  { label: '百度', domain: 'www.baidu.com' },
  { label: 'Bing', domain: 'www.bing.com' },
  { label: 'Google', domain: 'www.google.com' },
  { label: 'Wikipedia', domain: 'www.wikipedia.org' },
  { label: '少数派', domain: 'sspai.com' },
  { label: 'Product Hunt', domain: 'www.producthunt.com' },
  // 视频娱乐
  { label: 'Bilibili', domain: 'www.bilibili.com' },
  { label: 'YouTube', domain: 'www.youtube.com' },
  { label: '爱奇艺', domain: 'www.iqiyi.com' },
  { label: '优酷', domain: 'www.youku.com' },
  { label: '腾讯视频', domain: 'v.qq.com' },
  { label: '芒果 TV', domain: 'www.mgtv.com' },
  { label: '抖音', domain: 'www.douyin.com' },
  { label: '快手', domain: 'www.kuaishou.com' },
  { label: 'Netflix', domain: 'www.netflix.com' },
  // 音乐
  { label: '网易云音乐', domain: 'music.163.com' },
  { label: 'QQ 音乐', domain: 'y.qq.com' },
  { label: 'Spotify', domain: 'open.spotify.com' },
  { label: 'Apple Music', domain: 'music.apple.com' },
  // 购物
  { label: '淘宝', domain: 'www.taobao.com' },
  { label: '京东', domain: 'www.jd.com' },
  { label: '拼多多', domain: 'www.pinduoduo.com' },
  { label: 'Amazon', domain: 'www.amazon.com' },
  { label: '闲鱼', domain: 'www.goofish.com' },
  // 学习
  { label: '慕课网', domain: 'www.imooc.com' },
  { label: 'LeetCode', domain: 'leetcode.cn' },
  { label: '牛客网', domain: 'www.nowcoder.com' },
  { label: '极客时间', domain: 'time.geekbang.org' },
  { label: 'Coursera', domain: 'www.coursera.org' },
  // 邮箱
  { label: 'QQ 邮箱', domain: 'mail.qq.com' },
  { label: '163 邮箱', domain: 'mail.163.com' },
  { label: 'Gmail', domain: 'mail.google.com' },
  { label: 'Outlook', domain: 'outlook.live.com' },
  // 其他
  { label: 'Steam', domain: 'store.steampowered.com' },
  { label: 'DeepL', domain: 'www.deepl.com' },
  { label: '1Password', domain: '1password.com' },
  { label: 'Bitwarden', domain: 'bitwarden.com' },
];

// ── 工具函数 ──
function safeHost(hostname) {
  return hostname.replace(/[^a-z0-9.-]/g, '_');
}
function iconExtFromType(contentType) {
  if ((contentType || '').includes('image/png')) return '.png';
  if ((contentType || '').includes('image/jpeg')) return '.jpg';
  if ((contentType || '').includes('image/svg+xml')) return '.svg';
  if ((contentType || '').includes('image/webp')) return '.webp';
  if ((contentType || '').includes('image/x-icon') || (contentType || '').includes('image/vnd.microsoft.icon')) return '.ico';
  if ((contentType || '').includes('image/gif')) return '.gif';
  return '.png';
}
function fetchWithTimeout(url, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function downloadFavicon(domain) {
  const hostKey = safeHost(domain);
  // 检查是否已有缓存
  const existed = fs.readdirSync(ICON_DIR).find(n => n.startsWith(`auto_${hostKey}.`));
  if (existed) {
    return { cached: true, file: existed };
  }

  let buffer = null;
  let ext = '.png';

  // 策略1: 解析首页 HTML
  try {
    const resp = await fetchWithTimeout(`https://${domain}`, 5000);
    if (resp.ok) {
      const html = await resp.text();
      const m = html.match(/<link[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["']/i)
             || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut\s+)?icon["']/i);
      if (m) {
        let url = m[1].trim();
        if (url.startsWith('//')) url = 'https:' + url;
        else if (url.startsWith('/')) url = `https://${domain}${url}`;
        else if (!url.startsWith('http')) url = `https://${domain}/${url}`;
        const ir = await fetchWithTimeout(url, 5000);
        if (ir.ok) { buffer = Buffer.from(await ir.arrayBuffer()); ext = iconExtFromType(ir.headers.get('content-type')); }
      }
    }
  } catch {}

  // 策略2: /favicon.ico
  if (!buffer) {
    try {
      const resp = await fetchWithTimeout(`https://${domain}/favicon.ico`, 5000);
      if (resp.ok) { buffer = Buffer.from(await resp.arrayBuffer()); ext = iconExtFromType(resp.headers.get('content-type')); }
    } catch {}
  }

  if (!buffer) throw new Error('不可达');
  const filename = `auto_${hostKey}${ext}`;
  fs.writeFileSync(path.join(ICON_DIR, filename), buffer);
  return { cached: false, file: filename };
}

// ── 主流程 ──
(async () => {
  // 去重
  const seen = new Set();
  const unique = [];
  for (const p of presets) {
    if (seen.has(p.domain)) continue;
    seen.add(p.domain);
    unique.push(p);
  }

  const ok = [];
  const fail = [];
  let i = 0;
  for (const p of unique) {
    i++;
    process.stdout.write(`[${i}/${unique.length}] ${p.label} (${p.domain}) ... `);
    try {
      const r = await downloadFavicon(p.domain);
      console.log(r.cached ? '已缓存' : 'OK');
      ok.push(p);
    } catch (e) {
      console.log(`FAIL — ${e.message}`);
      fail.push(p);
    }
  }

  console.log(`\n===== 结果 =====`);
  console.log(`成功: ${ok.length}  失败: ${fail.length}`);
  if (fail.length) {
    console.log(`\n失败的预设（需从列表中删除）:`);
    fail.forEach(p => console.log(`  ${p.label} (${p.domain})`));
  }
})();
