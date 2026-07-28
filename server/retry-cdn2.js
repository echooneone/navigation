/**
 * 最后一轮 — 修正后的 CDN favicon URL
 */
const fs = require('fs');
const path = require('path');
const ICON_DIR = path.join(__dirname, 'uploads/icons');
function safeHost(h) { return h.replace(/[^a-z0-9.-]/g, '_'); }

const list = [
  { label: 'K8s',           domain: 'kubernetes.io',      url: 'https://kubernetes.io/favicon.ico' },
  { label: 'V2EX',          domain: 'www.v2ex.com',       url: 'https://v2ex.com/static/favicon.ico' },
  { label: 'Hacker News',   domain: 'news.ycombinator.com', url: 'https://news.ycombinator.com/favicon.ico' },
  { label: 'ChatGPT',       domain: 'openai.com',         url: 'https://cdn.oaistatic.com/assets/favicon.ico' },
  { label: 'Hugging Face',  domain: 'huggingface.co',     url: 'https://huggingface.co/favicon.ico' },
  { label: 'Behance',       domain: 'www.behance.net',    url: 'https://www.behance.net/favicon.ico' },
  { label: 'Pinterest',     domain: 'www.pinterest.com',  url: 'https://www.pinterest.com/favicon.ico' },
  { label: 'Notion',        domain: 'www.notion.so',      url: 'https://www.notion.so/favicon.ico' },
  { label: 'Discord',       domain: 'discord.com',        url: 'https://discord.com/favicon.ico' },
  { label: 'Twitter/X',     domain: 'x.com',              url: 'https://x.com/favicon.ico' },
  { label: 'Telegram',      domain: 'telegram.org',       url: 'https://telegram.org/favicon.ico' },
  { label: 'Google',        domain: 'www.google.com',     url: 'https://www.google.com/favicon.ico' },
  { label: 'Wikipedia',     domain: 'www.wikipedia.org',  url: 'https://www.wikipedia.org/favicon.ico' },
  { label: 'YouTube',       domain: 'www.youtube.com',    url: 'https://www.youtube.com/favicon.ico' },
  { label: 'Spotify',       domain: 'open.spotify.com',   url: 'https://open.spotify.com/favicon.ico' },
];

async function run() {
  let ok = 0, fail = [];
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    const hostKey = safeHost(p.domain);
    const existed = fs.readdirSync(ICON_DIR).find(f => f.startsWith(`auto_${hostKey}.`));
    if (existed) { console.log(`[${i + 1}/${list.length}] ${p.label} — 已缓存`); ok++; continue; }

    process.stdout.write(`[${i + 1}/${list.length}] ${p.label} ... `);
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    try {
      const r = await fetch(p.url, { signal: c.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      const ct = r.headers.get('content-type') || '';
      const ext = ct.includes('svg') ? '.svg' : ct.includes('ico') ? '.ico' : ct.includes('jpeg') ? '.jpg' : ct.includes('webp') ? '.webp' : ct.includes('gif') ? '.gif' : '.png';
      fs.writeFileSync(path.join(ICON_DIR, `auto_${hostKey}${ext}`), buf);
      console.log('OK'); ok++;
    } catch (e) {
      console.log(`FAIL — ${e.message}`); fail.push(p);
    } finally { clearTimeout(t); }
  }
  console.log(`\n===== ${ok} 成功, ${fail.length} 失败 =====`);
  if (fail.length) fail.forEach(p => console.log(`  ✗ ${p.label}`));
}
run();
