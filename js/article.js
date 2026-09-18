let jooCurrentArticle = null;

async function jooInitArticle() {
  jooRenderNav('');
  jooLoadAnnouncement();

  const id = jooQueryParam('id');
  if (!id) {
    document.getElementById('joo-loading').textContent = '記録IDが指定されていません。';
    return;
  }

  const { data, error } = await jooSupabase.from('joo_articles').select('*').eq('id', id).maybeSingle();
  document.getElementById('joo-loading').style.display = 'none';

  if (error || !data) {
    document.getElementById('joo-loading').style.display = 'block';
    document.getElementById('joo-loading').textContent = 'この収容記録は存在しません。';
    return;
  }

  jooCurrentArticle = data;
  document.title = `${data.id} - ${data.title} | JOO-J`;
  jooRenderArticle(data);
  document.getElementById('joo-article').style.display = 'block';

  document.getElementById('joo-vote-up').addEventListener('click', () => jooVote(1));
  document.getElementById('joo-vote-down').addEventListener('click', () => jooVote(-1));
  document.getElementById('joo-addendum-submit').addEventListener('click', jooSubmitAddendum);

  document.getElementById('joo-edit-link').href = `edit.html?id=${encodeURIComponent(data.id)}`;

  if (jooIsAdmin()) {
    const delBtn = document.getElementById('joo-delete-btn');
    delBtn.style.display = 'inline-block';
    delBtn.addEventListener('click', jooDeleteArticle);
  }

  jooUpdateVoteButtons();
}

function jooRenderArticle(a) {
  const info = jooClassInfo(a.object_class);
  document.getElementById('joo-a-designation').textContent = a.id;
  document.getElementById('joo-a-title').textContent = a.title || '(無題)';
  const badge = document.getElementById('joo-a-class');
  badge.textContent = info.label;
  badge.style.color = info.color;
  const dInfo = jooDangerInfo(a.danger_level);
  const dangerBadge = document.getElementById('joo-a-danger');
  dangerBadge.textContent = '危険度: ' + dInfo.label;
  dangerBadge.style.color = dInfo.color;
  const aiInfo = jooAiInfo(a.ai_disclosure);
  const aiBadge = document.getElementById('joo-a-ai');
  aiBadge.textContent = aiInfo.label;
  aiBadge.style.color = aiInfo.color;
  document.getElementById('joo-a-tags').textContent = (a.tags && a.tags.length) ? '#' + a.tags.join(' #') : '';
  document.getElementById('joo-a-author').textContent = '記録者: ' + (a.author_name || '不明');
  const img = document.getElementById('joo-a-image');
  if (a.image_url) {
    img.src = a.image_url;
    img.alt = a.title || '';
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }
  document.getElementById('joo-a-date').textContent = new Date(a.created_at).toLocaleDateString('ja-JP');
  document.getElementById('joo-a-containment').innerHTML = jooNl2br(a.containment || '(未記載)');
  document.getElementById('joo-a-description').innerHTML = jooNl2br(a.description || '(未記載)');
  document.getElementById('joo-a-score').textContent = (a.rating_up || 0) - (a.rating_down || 0);

  const addenda = Array.isArray(a.addenda) ? a.addenda : [];
  if (addenda.length) {
    document.getElementById('joo-addenda-wrap').style.display = 'block';
    document.getElementById('joo-addenda-list').innerHTML = addenda.map(ad => `
      <div class="joo-addendum">
        <div class="meta">${jooEscapeHtml(ad.author || '観測員')} &mdash; ${new Date(ad.date).toLocaleString('ja-JP')}</div>
        <div>${jooNl2br(ad.text || '')}</div>
      </div>
    `).join('');
  }
}

function jooVotedKey(id) {
  return `joo_voted_${id}`;
}

function jooUpdateVoteButtons() {
  const voted = localStorage.getItem(jooVotedKey(jooCurrentArticle.id));
  if (voted) {
    document.getElementById('joo-vote-up').disabled = true;
    document.getElementById('joo-vote-down').disabled = true;
  }
}

async function jooVote(dir) {
  const id = jooCurrentArticle.id;
  if (localStorage.getItem(jooVotedKey(id))) {
    jooToast('この記録には既に評価済みです', true);
    return;
  }
  const field = dir > 0 ? 'rating_up' : 'rating_down';
  const newVal = (jooCurrentArticle[field] || 0) + 1;
  const { error } = await jooSupabase.from('joo_articles').update({ [field]: newVal }).eq('id', id);
  if (error) {
    jooToast('評価の送信に失敗しました', true);
    return;
  }
  jooCurrentArticle[field] = newVal;
  localStorage.setItem(jooVotedKey(id), dir > 0 ? 'up' : 'down');
  document.getElementById('joo-a-score').textContent = (jooCurrentArticle.rating_up || 0) - (jooCurrentArticle.rating_down || 0);
  jooUpdateVoteButtons();
  jooToast('評価を送信しました');
}

async function jooSubmitAddendum() {
  const text = document.getElementById('joo-addendum-text').value.trim();
  if (!text) {
    jooToast('追記内容を入力してください', true);
    return;
  }
  const author = document.getElementById('joo-addendum-author').value.trim() || '観測員';
  const addenda = Array.isArray(jooCurrentArticle.addenda) ? jooCurrentArticle.addenda.slice() : [];
  addenda.push({ author, text, date: new Date().toISOString() });

  const { error } = await jooSupabase.from('joo_articles').update({ addenda, updated_at: new Date().toISOString() }).eq('id', jooCurrentArticle.id);
  if (error) {
    jooToast('追記の投稿に失敗しました', true);
    return;
  }
  jooCurrentArticle.addenda = addenda;
  document.getElementById('joo-addendum-text').value = '';
  jooRenderArticle(jooCurrentArticle);
  jooToast('追記を投稿しました');
}

async function jooDeleteArticle() {
  if (!confirm(`${jooCurrentArticle.id} を完全に削除します。よろしいですか?`)) return;
  const { error } = await jooSupabase.from('joo_articles').delete().eq('id', jooCurrentArticle.id);
  if (error) {
    jooToast('削除に失敗しました', true);
    return;
  }
  jooToast('削除しました');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

jooInitArticle();
