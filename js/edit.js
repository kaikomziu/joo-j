let jooEditMode = 'create'; // 'create' | 'edit'
let jooEditingId = null;
let jooExistingImageUrl = null;
let jooImageRemoved = false;

function jooShowImagePreview(url) {
  const wrap = document.getElementById('joo-f-image-preview-wrap');
  const img = document.getElementById('joo-f-image-preview');
  img.src = url;
  wrap.style.display = 'block';
}

function jooSetupImageField() {
  document.getElementById('joo-f-image-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    jooImageRemoved = false;
    const reader = new FileReader();
    reader.onload = () => jooShowImagePreview(reader.result);
    reader.readAsDataURL(file);
  });
  document.getElementById('joo-f-image-remove').addEventListener('click', () => {
    jooImageRemoved = true;
    document.getElementById('joo-f-image-file').value = '';
    document.getElementById('joo-f-image-preview-wrap').style.display = 'none';
  });
}

async function jooUploadImageIfNeeded(id) {
  const fileInput = document.getElementById('joo-f-image-file');
  const file = fileInput.files[0];
  if (!file) {
    return jooImageRemoved ? null : undefined; // undefined = leave unchanged
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${id}/${Date.now()}.${ext}`;
  const { error } = await jooSupabase.storage.from('joo-images').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = jooSupabase.storage.from('joo-images').getPublicUrl(path);
  return data.publicUrl;
}

function jooRenderTagChips(selected) {
  const selectedSet = new Set(selected || []);
  const wrap = document.getElementById('joo-f-tags');
  wrap.innerHTML = JOO_TAGS.map(tag => `
    <label class="joo-tag-chip${selectedSet.has(tag) ? ' checked' : ''}">
      <input type="checkbox" value="${jooEscapeHtml(tag)}" ${selectedSet.has(tag) ? 'checked' : ''}>${jooEscapeHtml(tag)}
    </label>
  `).join('');
  wrap.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      cb.closest('.joo-tag-chip').classList.toggle('checked', cb.checked);
    });
  });
}

async function jooInitEdit() {
  jooRenderNav('edit.html');
  jooLoadAnnouncement();
  jooRenderTagChips([]);
  jooSetupImageField();

  const idParam = jooQueryParam('id');
  const newParam = jooQueryParam('new');

  if (idParam) {
    jooEditMode = 'edit';
    jooEditingId = idParam;
    document.getElementById('joo-form-title').textContent = `収容記録の編集: ${idParam}`;
    document.getElementById('joo-number-block').style.display = 'none';
    document.getElementById('joo-id-display').textContent = `収容番号: ${idParam} (番号は編集後に変更できません)`;

    const { data, error } = await jooSupabase.from('joo_articles').select('*').eq('id', idParam).maybeSingle();
    if (error || !data) {
      jooToast('記録の取得に失敗しました', true);
      return;
    }
    document.getElementById('joo-f-title').value = data.title || '';
    document.getElementById('joo-f-class').value = data.object_class || 'unclassified';
    document.getElementById('joo-f-danger').value = data.danger_level || 'unknown';
    document.getElementById('joo-f-containment').value = data.containment || '';
    document.getElementById('joo-f-description').value = data.description || '';
    jooRenderTagChips(data.tags || []);
    document.getElementById('joo-f-author').value = data.author_name || '';
    if (data.image_url) {
      jooExistingImageUrl = data.image_url;
      jooShowImagePreview(data.image_url);
    }
  } else if (newParam) {
    document.getElementById('joo-f-number').value = newParam;
    document.getElementById('joo-id-display').textContent = `割り当て予定: JOO-J-${jooPadNumber(newParam)}`;
    document.getElementById('joo-f-number').addEventListener('input', jooUpdateIdPreview);
    document.getElementById('joo-f-custom-id').addEventListener('input', jooUpdateIdPreview);
  } else {
    document.getElementById('joo-f-number').addEventListener('input', jooUpdateIdPreview);
    document.getElementById('joo-f-custom-id').addEventListener('input', jooUpdateIdPreview);
  }

  document.getElementById('joo-save-btn').addEventListener('click', jooSave);
}

function jooUpdateIdPreview() {
  const custom = document.getElementById('joo-f-custom-id').value.trim();
  const num = document.getElementById('joo-f-number').value.trim();
  const disp = document.getElementById('joo-id-display');
  if (custom) {
    disp.textContent = `割り当て予定: ${custom.toUpperCase()}`;
  } else if (num) {
    disp.textContent = `割り当て予定: JOO-J-${jooPadNumber(num)}`;
  } else {
    disp.textContent = '番号未入力の場合、保存時に空いている次の番号が自動で割り当てられます。';
  }
}

function jooCollectForm() {
  const tags = Array.from(document.querySelectorAll('#joo-f-tags input[type=checkbox]:checked')).map(cb => cb.value);
  return {
    title: document.getElementById('joo-f-title').value.trim(),
    object_class: document.getElementById('joo-f-class').value,
    danger_level: document.getElementById('joo-f-danger').value,
    containment: document.getElementById('joo-f-containment').value.trim(),
    description: document.getElementById('joo-f-description').value.trim(),
    tags,
    author_name: document.getElementById('joo-f-author').value.trim() || '観測員',
  };
}

async function jooSave() {
  const form = jooCollectForm();
  if (!form.title) {
    jooToast('タイトルを入力してください', true);
    return;
  }

  const btn = document.getElementById('joo-save-btn');
  btn.disabled = true;

  try {
    if (jooEditMode === 'edit') {
      const imageResult = await jooUploadImageIfNeeded(jooEditingId);
      const imagePatch = imageResult === undefined ? {} : { image_url: imageResult };
      const { error } = await jooSupabase.from('joo_articles').update({
        ...form,
        ...imagePatch,
        updated_at: new Date().toISOString(),
      }).eq('id', jooEditingId);
      if (error) throw error;
      jooToast('保存しました');
      setTimeout(() => { window.location.href = `article.html?id=${encodeURIComponent(jooEditingId)}`; }, 700);
      return;
    }

    // create mode
    const customId = document.getElementById('joo-f-custom-id').value.trim();
    const numRaw = document.getElementById('joo-f-number').value.trim();
    let id, number;

    if (customId) {
      id = customId.toUpperCase();
      number = null;
    } else if (numRaw) {
      number = parseInt(numRaw, 10);
      if (!Number.isInteger(number) || number < 1) {
        jooToast('収容番号は1以上の数字で入力してください', true);
        btn.disabled = false;
        return;
      }
      id = jooDesignationFromNumber(number);
    } else {
      const { data: maxRow } = await jooSupabase
        .from('joo_articles')
        .select('number')
        .not('number', 'is', null)
        .order('number', { ascending: false })
        .limit(1)
        .maybeSingle();
      number = maxRow && maxRow.number ? maxRow.number + 1 : 1;
      id = jooDesignationFromNumber(number);
    }

    const { data: existing } = await jooSupabase.from('joo_articles').select('id').eq('id', id).maybeSingle();
    if (existing) {
      jooToast(`${id} は既に使用されています。別の番号を指定してください。`, true);
      btn.disabled = false;
      return;
    }

    const imageResult = await jooUploadImageIfNeeded(id);
    const { error } = await jooSupabase.from('joo_articles').insert({
      id, number, ...form,
      image_url: imageResult === undefined ? null : imageResult,
    });
    if (error) throw error;

    jooToast('収容記録を作成しました');
    setTimeout(() => { window.location.href = `article.html?id=${encodeURIComponent(id)}`; }, 700);
  } catch (e) {
    console.error(e);
    jooToast('保存に失敗しました', true);
    btn.disabled = false;
  }
}

jooInitEdit();
