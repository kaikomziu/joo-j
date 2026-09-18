// JOO-J common utilities shared across pages

const JOO_CLASSES = {
  safe: { label: '安全 - Safe', color: '#4caf50' },
  euclid: { label: 'ユークリッド - Euclid', color: '#e0b32d' },
  keter: { label: 'ケテル - Keter', color: '#e0453c' },
  thaumiel: { label: 'サウマテル - Thaumiel', color: '#3d8fe0' },
  neutralized: { label: '無力化 - Neutralized', color: '#8a8a8a' },
  unclassified: { label: '未分類 - Unclassified', color: '#9c5fe0' },
};

const JOO_ADMIN_SESSION_KEY = 'joo_admin_unlocked';

function jooEscapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function jooNl2br(str) {
  return jooEscapeHtml(str).replace(/\n/g, '<br>');
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
