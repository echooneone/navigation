/**
 * 对首次失败的域名，换用不同抓取策略重试
 * 运行：node retry-presets.js
 */
const fs = require('fs');
const path = require('path');

const ICON_DIR = path.join(__dirname, 'uploads/icons');

function safeHost(h) { return h.replace(/[^a-z0-9.-]/g, '_'); }
function iconExtFromType(ct) {
  if ((ct || '').includes('png')) return '.png';
  if ((ct || '').includes('jpeg')) return '.jpg';
  if ((ct || '').includes('svg')) return '.svg';
  if ((ct || '').includes('webp')) return '.webp';
  if ((ct || '').includes('x-icon') || (ct || '').includes('vnd.microsoft.icon')) return '.ico';
  if ((ct || '').includes('gif')) return '.gif';
  return '.png';
}

function fetchTimeout(url, ms = 6000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { signal: c.signal, headers: { 'User-Agent': 'Mozilla/5.0' } }).finally(() => clearTimeout(t));
}

async function tryDownload(domain, label) {
  const hostKey = safeHost(domain);

  // 检查已有缓存
  const existed = fs.readdirSync(ICON_DIR).find(f => f.startsWith(`auto_${hostKey}.`));
  if (existed) return { ok: true, cached: true, file: existed };

  let buffer = null, ext = '.png';

  // 策略 A：DuckDuckGo Favicon API
  try {
    const r = await fetchTimeout(`https://icons.duckduckgo.com/ip3/${domain}.ico`, 6000);
    if (r.ok) { buffer = Buffer.from(await r.arrayBuffer()); ext = iconExtFromType(r.headers.get('content-type')); }
  } catch {}

  // 策略 B：Google Favicon（需 VPN）
  if (!buffer) {
    try {
      const r = await fetchTimeout(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`, 6000);
      if (r.ok) { buffer = Buffer.from(await r.arrayBuffer()); ext = iconExtFromType(r.headers.get('content-type')); }
    } catch {}
  }

  // 策略 C：直接首页 HTML 解析（加了 UA 头）
  if (!buffer) {
    try {
      const r = await fetchTimeout(`https://${domain}`, 5000);
      if (r.ok) {
        const html = await r.text();
        const m = html.match(/<link[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["']/i)
               || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut\s+)?icon["']/i);
        if (m) {
          let url = m[1].trim();
          if (url.startsWith('//')) url = 'https:' + url;
          else if (url.startsWith('/')) url = `https://${domain}${url}`;
          else if (!url.startsWith('http')) url = `https://${domain}/${url}`;
          const ir = await fetchTimeout(url, 5000);
          if (ir.ok) { buffer = Buffer.from(await ir.arrayBuffer()); ext = iconExtFromType(ir.headers.get('content-type')); }
        }
      }
    } catch {}
  }

  // 策略 D：/favicon.ico
  if (!buffer) {
    try {
      const r = await fetchTimeout(`https://${domain}/favicon.ico`, 5000);
      if (r.ok) { buffer = Buffer.from(await r.arrayBuffer()); ext = iconExtFromType(r.headers.get('content-type')); }
    } catch {}
  }

  if (!buffer) throw new Error('所有策略均失败');
  const filename = `auto_${hostKey}${ext}`;
  fs.writeFileSync(path.join(ICON_DIR, filename), buffer);
  return { ok: true, cached: false, file: filename };
}

const retryList = [
  { label: 'npm',             domain: 'www.npmjs.com' },
  { label: 'Go',              domain: 'go.dev' },
  { label: 'K8s',             domain: 'kubernetes.io' },
  { label: 'Stack Overflow',  domain: 'stackoverflow.com' },
  { label: 'V2EX',            domain: 'www.v2ex.com' },
  { label: 'Hacker News',     domain: 'news.ycombinator.com' },
  { label: 'ChatGPT',         domain: 'openai.com' },
  { label: 'Gemini',          domain: 'gemini.google.com' },
  { label: 'Hugging Face',    domain: 'huggingface.co' },
  { label: 'Canva',           domain: 'www.canva.com' },
  { label: 'Behance',         domain: 'www.behance.net' },
  { label: 'Pinterest',       domain: 'www.pinterest.com' },
  { label: 'Notion',          domain: 'www.notion.so' },
  { label: 'Discord',         domain: 'discord.com' },
  { label: 'Twitter/X',       domain: 'x.com' },
  { label: 'Telegram',        domain: 'telegram.org' },
  { label: 'Google',          domain: 'www.google.com' },
  { label: 'Wikipedia',       domain: 'www.wikipedia.org' },
  { label: 'YouTube',         domain: 'www.youtube.com' },
  { label: 'Netflix',         domain: 'www.netflix.com' },
  { label: 'Spotify',         domain: 'open.spotify.com' },
  { label: 'Gmail',           domain: 'mail.google.com' },
];

(async () => {
  const ok = [], fail = [];
  let i = 0;
  for (const p of retryList) {
    i++;
    process.stdout.write(`[${i}/${retryList.length}] ${p.label} (${p.domain}) ... `);
    try {
      const r = await tryDownload(p.domain, p.label);
      console.log(r.cached ? '已缓存' : 'OK');
      ok.push(p);
    } catch (e) {
      console.log(`FAIL — ${e.message}`);
      fail.push(p);
    }
  }
  console.log(`\n===== 结果 =====`);
  console.log(`成功: ${ok.length}  失败: ${fail.length}`);
  if (ok.length) { console.log(`\n新增成功:`); ok.forEach(p => console.log(`  ✓ ${p.label} (${p.domain})`)); }
  if (fail.length) { console.log(`\n仍然失败:`); fail.forEach(p => console.log(`  ✗ ${p.label} (${p.domain})`)); }
})();
