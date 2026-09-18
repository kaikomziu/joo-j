let jooAllArticles = [];
let jooByNumber = new Map();

async function jooInitIndex() {
  jooRenderNav('index.html');
  jooLoadAnnouncement();

  const { data, error } = await jooSupabase
    .from('joo_articles')
    .select('id, number, title, object_class, danger_level, rating_up, rating_down, created_at')
    .order('created_at', { ascending: false });

  document.getElementById('joo-loading').style.display = 'none';

  if (error) {
    jooToast('記録の取得に失敗しました', true);
    console.error(error);
    return;
  }

  jooAllArticles = data || [];
  jooByNumber = new Map();
  jooAllArticles.forEach(a => {
    if (a.number != null) jooByNumber.set(a.number, a);
  });

  document.getElementById('joo-grid').style.display = 'grid';
  jooRenderGrid();
  jooRenderSpecialList();

  document.getElementById('joo-search').addEventListener('input', jooRenderGrid);
  document.getElementById('joo-filter-class').addEventListener('change', jooRenderGrid);
  document.getElementById('joo-filter-danger').addEventListener('change', jooRenderGrid);
}

function jooRenderGrid() {
  const search = document.getElementById('joo-search').value.trim().toLowerCase();
  const classFilter = document.getElementById('joo-filter-class').value;
  const dangerFilter = document.getElementById('joo-filter-danger').value;
  const filtering = !!(search || classFilter || dangerFilter);

  const maxNum = jooAllArticles.reduce((m, a) => a.number != null ? Math.max(m, a.number) : m, 0);
  const slotCount = Math.max(maxNum + 6, 30);

  const grid = document.getElementById('joo-grid');
  grid.innerHTML = '';

  for (let n = 1; n <= slotCount; n++) {
    const article = jooByNumber.get(n);
    if (article) {
      if (search && !article.title.toLowerCase().includes(search)) continue;
      if (classFilter && article.object_class !== classFilter) continue;
      if (dangerFilter && article.danger_level !== dangerFilter) continue;
      grid.appendChild(jooSlotCard(n, article));
    } else {
      if (filtering) continue;
      grid.appendChild(jooEmptySlot(n));
    }
  }

  if (filtering && grid.children.length === 0) {
    const msg = document.createElement('div');
    msg.className = 'joo-empty-msg';
    msg.textContent = '該当する収容記録が見つかりません。';
    grid.appendChild(msg);
  }
}

function jooSlotCard(n, article) {
  const div = document.createElement('div');
  div.className = 'joo-slot';
  const info = jooClassInfo(article.object_class);
  const dInfo = jooDangerInfo(article.danger_level);
  const score = (article.rating_up || 0) - (article.rating_down || 0);
  div.innerHTML = `
    <div class="num">JOO-J-${jooPadNumber(n)}</div>
    <div class="title">${jooEscapeHtml(article.title || '(無題)')}</div>
    <div style="display:flex; gap:4px; flex-wrap:wrap;">
      <span class="joo-badge" style="color:${info.color}">${info.label}</span>
      <span class="joo-badge" style="color:${dInfo.color}">危険度: ${dInfo.label.split(' - ')[0]}</span>
    </div>
  `;
  div.addEventListener('click', () => {
    window.location.href = `article.html?id=${encodeURIComponent(article.id)}`;
  });
  return div;
}

function jooEmptySlot(n) {
  const div = document.createElement('div');
  div.className = 'joo-slot empty';
  div.innerHTML = `<div class="num">JOO-J-${jooPadNumber(n)}</div><div>[未確保]</div>`;
  div.addEventListener('click', () => {
    window.location.href = `edit.html?new=${n}`;
  });
  return div;
}

function jooRenderSpecialList() {
  const specials = jooAllArticles.filter(a => a.number == null);
  if (specials.length === 0) return;
  document.getElementById('joo-special-wrap').style.display = 'block';
  const wrap = document.getElementById('joo-special-list');
  wrap.innerHTML = specials.map(a => {
    const info = jooClassInfo(a.object_class);
    const dInfo = jooDangerInfo(a.danger_level);
    return `<div class="row">
      <a href="article.html?id=${encodeURIComponent(a.id)}">${jooEscapeHtml(a.id)} - ${jooEscapeHtml(a.title || '(無題)')}</a>
      <span style="display:flex; gap:4px;">
        <span class="joo-badge" style="color:${info.color}">${info.label}</span>
        <span class="joo-badge" style="color:${dInfo.color}">危険度: ${dInfo.label.split(' - ')[0]}</span>
      </span>
    </div>`;
  }).join('');
}

jooInitIndex();
