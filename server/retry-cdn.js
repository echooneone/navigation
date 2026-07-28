/**
 * 用已知 CDN favicon 直链下载（绕过反爬）
 * 运行：node retry-cdn.js
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

const list = [
  { label: 'npm',             domain: 'www.npmjs.com',        url: 'https://static.npmjs.com/338e4905a2684ca96e08c7780fc68412.png' },
  { label: 'Go',              domain: 'go.dev',               url: 'https://go.dev/images/favicon-gopher.png' },
  { label: 'K8s',             domain: 'kubernetes.io',        url: 'https://kubernetes.io/images/favicon.png' },
  { label: 'Stack Overflow',  domain: 'stackoverflow.com',    url: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico' },
  { label: 'V2EX',            domain: 'www.v2ex.com',         url: 'https://www.v2ex.com/static/favicon.ico' },
  { label: 'Hacker News',     domain: 'news.ycombinator.com', url: 'https://news.ycombinator.com/favicon.ico' },
  { label: 'ChatGPT',         domain: 'openai.com',           url: 'https://openai.com/favicon.ico' },
  { label: 'Gemini',          domain: 'gemini.google.com',    url: 'https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7f294ce30.svg' },
  { label: 'Hugging Face',    domain: 'huggingface.co',       url: 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg' },
  { label: 'Canva',           domain: 'www.canva.com',        url: 'https://static.canva.com/static/images/favicon-1.ico' },
  { label: 'Behance',         domain: 'www.behance.net',      url: 'https://a5.behance.net/758bb53a37a4af4aa93d23a032ee21d52718bc27/img/site/favicon.ico' },
  { label: 'Pinterest',       domain: 'www.pinterest.com',    url: 'https://s.pinimg.com/webapp/favicon_144x144-1c5e1e6a.png' },
  { label: 'Notion',          domain: 'www.notion.so',        url: 'https://www.notion.so/images/favicon.ico' },
  { label: 'Discord',         domain: 'discord.com',          url: 'https://discord.com/assets/07dca80a102d4149e9736d4b162cff6f.ico' },
  { label: 'Twitter/X',       domain: 'x.com',                url: 'https://abs.twimg.com/favicons/twitter.3.ico' },
  { label: 'Telegram',        domain: 'telegram.org',         url: 'https://telegram.org/img/favicon.ico' },
  { label: 'Google',          domain: 'www.google.com',       url: 'https://www.google.com/favicon.ico' },
  { label: 'Wikipedia',       domain: 'www.wikipedia.org',    url: 'https://www.wikipedia.org/static/favicon/wikipedia.ico' },
  { label: 'YouTube',         domain: 'www.youtube.com',      url: 'https://www.youtube.com/s/desktop/12d6b690/img/favicon.ico' },
  { label: 'Netflix',         domain: 'www.netflix.com',      url: 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico' },
  { label: 'Spotify',         domain: 'open.spotify.com',     url: 'https://open.spotifycdn.com/cdn/images/favicon32.b64f48cc.ico' },
  { label: 'Gmail',           domain: 'mail.google.com',      url: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
];

async function downloadOne(p) {
  const hostKey = safeHost(p.domain);
  // 检查已有缓存
  const existed = fs.readdirSync(ICON_DIR).find(f => f.startsWith(`auto_${hostKey}.`));
  if (existed) return { cached: true, file: existed };

  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 8000);
  try {
    const r = await fetch(p.url, { signal: c.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const buffer = Buffer.from(await r.arrayBuffer());
    const ext = iconExtFromType(r.headers.get('content-type'));
    const filename = `auto_${hostKey}${ext}`;
    fs.writeFileSync(path.join(ICON_DIR, filename), buffer);
    return { cached: false, file: filename };
  } finally {
    clearTimeout(t);
  }
}

(async () => {
  let ok = 0, fail = 0;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    process.stdout.write(`[${i + 1}/${list.length}] ${p.label} (${p.domain}) ... `);
    try {
      const r = await downloadOne(p);
      console.log(r.cached ? '已缓存' : 'OK');
      ok++;
    } catch (e) {
      console.log(`FAIL — ${e.message}`);
      fail++;
    }
  }
  console.log(`\n===== 结果 =====`);
  console.log(`成功: ${ok}  失败: ${fail}`);
})();
