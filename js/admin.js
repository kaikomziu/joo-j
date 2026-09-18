async function jooInitAdmin() {
  jooRenderNav('admin.html');
  jooLoadAnnouncement();

  if (jooIsAdmin()) {
    await jooShowAdminBody();
  }

  document.getElementById('joo-admin-login-btn').addEventListener('click', jooAttemptLogin);
  document.getElementById('joo-admin-pw').addEventListener('keydown', e => {
    if (e.key === 'Enter') jooAttemptLogin();
  });
}

async function jooAttemptLogin() {
  const pw = document.getElementById('joo-admin-pw').value;
  const hash = await jooSha256Hex(pw);
  if (hash === JOO_ADMIN_PASSWORD_HASH) {
    jooSetAdmin(true);
    await jooShowAdminBody();
  } else {
    jooToast('パスワードが違います', true);
  }
}

async function jooShowAdminBody() {
  document.getElementById('joo-login-panel').style.display = 'none';
  document.getElementById('joo-admin-body').style.display = 'block';

  const { data } = await jooSupabase.from('joo_site_content').select('key, content').in('key', ['about', 'rules', 'announcement']);
  const map = {};
  (data || []).forEach(r => map[r.key] = r.content);
  document.getElementById('joo-admin-announcement').value = map.announcement || '';
  document.getElementById('joo-admin-about').value = map.about || '';
  document.getElementById('joo-admin-rules').value = map.rules || '';

  document.getElementById('joo-save-announcement').addEventListener('click', () => jooSaveContent('announcement', document.getElementById('joo-admin-announcement').value));
  document.getElementById('joo-save-about').addEventListener('click', () => jooSaveContent('about', document.getElementById('joo-admin-about').value));
  document.getElementById('joo-save-rules').addEventListener('click', () => jooSaveContent('rules', document.getElementById('joo-admin-rules').value));

  await jooLoadAdminArticles();
}

async function jooSaveContent(key, content) {
  const { error } = await jooSupabase.from('joo_site_content').upsert({ key, content, updated_at: new Date().toISOString() });
  if (error) {
    jooToast('保存に失敗しました', true);
    console.error(error);
    return;
  }
  jooToast('保存しました');
  jooLoadAnnouncement();
}

async function jooLoadAdminArticles() {
  const { data, error } = await jooSupabase.from('joo_articles').select('id, title, object_class, danger_level, rating_up, rating_down').order('id');
  const tbody = document.getElementById('joo-admin-articles');
  if (error || !data) {
    tbody.innerHTML = '<tr><td colspan="6">取得に失敗しました</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(a => {
    const info = jooClassInfo(a.object_class);
    const dInfo = jooDangerInfo(a.danger_level);
    const score = (a.rating_up || 0) - (a.rating_down || 0);
    return `<tr>
      <td><a href="article.html?id=${encodeURIComponent(a.id)}">${jooEscapeHtml(a.id)}</a></td>
      <td>${jooEscapeHtml(a.title || '')}</td>
      <td style="color:${info.color}">${info.label}</td>
      <td style="color:${dInfo.color}">${dInfo.label}</td>
      <td>${score}</td>
      <td><button class="joo-btn danger" data-id="${jooEscapeHtml(a.id)}">削除</button></td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => jooAdminDelete(btn.dataset.id));
  });
}

async function jooAdminDelete(id) {
  if (!confirm(`${id} を完全に削除します。よろしいですか?`)) return;
  const { error } = await jooSupabase.from('joo_articles').delete().eq('id', id);
  if (error) {
    jooToast('削除に失敗しました', true);
    return;
  }
  jooToast('削除しました');
  jooLoadAdminArticles();
}

jooInitAdmin();
