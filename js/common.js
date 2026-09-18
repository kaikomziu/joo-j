// JOO-J common utilities shared across pages

const JOO_CLASSES = {
  safe: { label: '安全 - Safe', color: '#4caf50' },
  euclid: { label: 'ユークリッド - Euclid', color: '#e0b32d' },
  keter: { label: 'ケテル - Keter', color: '#e0453c' },
  thaumiel: { label: 'サウマテル - Thaumiel', color: '#3d8fe0' },
  neutralized: { label: '無力化 - Neutralized', color: '#8a8a8a' },
  unclassified: { label: '未分類 - Unclassified', color: '#9c5fe0' },
};

const JOO_DANGER_LEVELS = {
  unknown: { label: '不明 - Unknown', color: '#8a9186' },
  low: { label: '低 - Low', color: '#4caf50' },
  medium: { label: '中 - Medium', color: '#e0b32d' },
  high: { label: '高 - High', color: '#e07a3d' },
  critical: { label: '最重要 - Critical', color: '#e0453c' },
};

function jooDangerInfo(key) {
  return JOO_DANGER_LEVELS[key] || JOO_DANGER_LEVELS.unknown;
}

const JOO_TAGS = [
  '人型', '動物', '植物', '無生物', '液体', '気体',
  '建造物', '乗り物', '電子機器', '食料', '医療関連',
  '認識災害', '記憶災害', '感染性', '寄生生物', '精神汚染',
  '変形能力', '自己複製', '時空間', '異次元', '儀式・信仰',
  '都市伝説', '未確認', '収容困難', '知性体', '超能力',
];

const JOO_AI_DISCLOSURE = {
  none: { label: 'AI生成なし', color: '#8a9186' },
  full: { label: 'AI生成あり(完全AI)', color: '#e0453c' },
  partial: { label: '一部使用(AI+修正)', color: '#e0b32d' },
  image: { label: '画像のみAI生成', color: '#3d8fe0' },
};

function jooAiInfo(key) {
  return JOO_AI_DISCLOSURE[key] || JOO_AI_DISCLOSURE.none;
}

const JOO_ADMIN_SESSION_KEY = 'joo_admin_unlocked';

function jooEscapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function jooFormatText(str) {
  let html = jooEscapeHtml(str);
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/--(.+?)--/g, '<del>$1</del>');
  return html;
}

function jooNl2br(str) {
  return jooFormatText(str).replace(/\n/g, '<br>');
}

function jooClassInfo(key) {
  return JOO_CLASSES[key] || JOO_CLASSES.unclassified;
}

function jooPadNumber(n) {
  const s = String(n);
  return s.length >= 3 ? s : '0'.repeat(3 - s.length) + s;
}

function jooDesignationFromNumber(n) {
  return `JOO-J-${jooPadNumber(n)}`;
}

async function jooSha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// SHA-256 of the admin password (kept hashed so the plaintext isn't in the source)
const JOO_ADMIN_PASSWORD_HASH = 'e0a305c998b64ca39593cfcc860b9c062d17019a339402d0b2baf2df4d75ca17';

function jooIsAdmin() {
  return sessionStorage.getItem(JOO_ADMIN_SESSION_KEY) === '1';
}

function jooSetAdmin(v) {
  if (v) sessionStorage.setItem(JOO_ADMIN_SESSION_KEY, '1');
  else sessionStorage.removeItem(JOO_ADMIN_SESSION_KEY);
}

function jooToast(msg, isError) {
  let el = document.getElementById('joo-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'joo-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'joo-toast show' + (isError ? ' error' : '');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.className = 'joo-toast'; }, 2600);
}

function jooQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function jooLoadAnnouncement() {
  const bar = document.getElementById('joo-announcement');
  if (!bar) return;
  const { data } = await jooSupabase.from('joo_site_content').select('content').eq('key', 'announcement').maybeSingle();
  if (data && data.content && data.content.trim()) {
    bar.textContent = '⚠ ' + data.content;
    bar.style.display = 'block';
  } else {
    bar.style.display = 'none';
  }
}

function jooRenderNav(active) {
  const nav = document.getElementById('joo-nav');
  if (!nav) return;
  const items = [
    { href: 'index.html', label: '収容記録一覧' },
    { href: 'edit.html', label: '新規収容記録' },
    { href: 'rules.html', label: '規約・組織概要' },
    { href: 'admin.html', label: '管理者' },
  ];
  nav.innerHTML = items.map(it =>
    `<a href="${it.href}" class="${active === it.href ? 'active' : ''}">${it.label}</a>`
  ).join('');
}
