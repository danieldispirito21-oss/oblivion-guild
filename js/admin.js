// ══════════════════════════════════════════════
// OBLIVION ADMIN — 100% Supabase
// Guarda en tiempo real, funciona en Netlify
// ══════════════════════════════════════════════

// ── INIT ──
window.addEventListener('DOMContentLoaded', async () => {
  await Auth.init(async (session, profile) => {
    if (!session) {
      document.getElementById('noAuthPage').style.display = 'flex';
      return;
    }
    if (!profile || !['admin','officer'].includes(profile.role)) {
      document.getElementById('noAuthPage').style.display = 'flex';
      document.getElementById('authRoleError').style.display = 'block';
      return;
    }
    // Logged in as admin/officer
    document.getElementById('adminLayout').style.display = 'flex';
    document.getElementById('adminUserLabel').textContent = profile.nickname + ' · ' + profile.role;
    loadAll();
  });
});

async function doLogout() {
  await Auth.logout();
}

// ── HELPERS ──
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 2800);
}
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); });

function showSection(name, el) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  if (el) el.classList.add('active');
}

// ── LOAD ALL ──
async function loadAll() {
  await Promise.all([
    loadMembers(),
    loadNews(),
    loadGuides(),
    loadGallery(),
    loadUsers(),
  ]);
  renderDashboard();
}

async function renderDashboard() {
  const [{ count: m }, { count: n }, { count: g }] = await Promise.all([
    sb.from('content_members').select('*', { count: 'exact', head: true }),
    sb.from('content_news').select('*', { count: 'exact', head: true }),
    sb.from('content_guides').select('*', { count: 'exact', head: true }),
  ]);
  document.getElementById('dashStats').innerHTML = [
    { num: m || 0, label: 'Miembros' },
    { num: n || 0, label: 'Noticias' },
    { num: g || 0, label: 'Guías' },
    { num: allUsers.filter(u => u.role === 'pending').length, label: 'Pendientes ⏳' },
  ].map(s => `<div class="stat-pill"><div class="stat-pill-num">${s.num}</div><div class="stat-pill-label">${s.label}</div></div>`).join('');
}

// ════════════════════
// MIEMBROS
// ════════════════════
let membersData = [];

async function loadMembers() {
  const { data } = await sb.from('content_members').select('*').order('sort_order');
  membersData = data || [];
  renderMembers();
}

function renderMembers() {
  const grid = document.getElementById('membersGrid');
  if (!membersData.length) { grid.innerHTML = '<div class="empty-state">Sin miembros. Agrega uno.</div>'; return; }
  grid.innerHTML = membersData.map(m => `
    <div class="admin-member-card">
      <div class="admin-member-avatar">
        ${m.image_url ? `<img src="${m.image_url}" onerror="this.parentElement.innerHTML='<div class=no-img>👤</div>'">` : '<div class="no-img">👤</div>'}
      </div>
      <div class="admin-member-info">
        <div class="admin-member-name">${m.nickname}</div>
        <div class="admin-member-role"><span class="badge badge-${m.badge}">${m.role_label}</span></div>
        <div class="admin-member-actions" style="margin-top:0.6rem;">
          <button class="btn btn-secondary btn-sm" onclick="editMember(${m.id})">✏️ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteMember(${m.id})">🗑️</button>
        </div>
      </div>
    </div>`).join('');
}

function openMemberModal(id = null) {
  const m = id ? membersData.find(x => x.id === id) : {};
  document.getElementById('mDbId').value       = m?.id || '';
  document.getElementById('mNick').value       = m?.nickname    || '';
  document.getElementById('mBadge').value      = m?.badge       || 'member';
  document.getElementById('mSpecialty').value  = m?.specialty   || '';
  document.getElementById('mWeapons').value    = m?.weapons     || '';
  document.getElementById('mStatus').value     = m?.status      || 'active';
  document.getElementById('mImage').value      = m?.image_url   || '';
  document.getElementById('mBio').value        = m?.bio         || '';
  document.getElementById('mQuote').value      = m?.quote       || '';
  document.getElementById('memberModalTitle').textContent = id ? 'Editar Miembro' : 'Nuevo Miembro';
  openModal('memberModal');
}
function editMember(id) { openMemberModal(id); }

async function saveMember() {
  const dbId = document.getElementById('mDbId').value;
  const badgeMap = { master:'Guild Master', officer:'Officer', member:'Member' };
  const badge = document.getElementById('mBadge').value;
  const payload = {
    nickname:   document.getElementById('mNick').value.trim(),
    role_label: badgeMap[badge] || 'Member',
    specialty:  document.getElementById('mSpecialty').value.trim(),
    weapons:    document.getElementById('mWeapons').value.trim(),
    bio:        document.getElementById('mBio').value.trim(),
    quote:      document.getElementById('mQuote').value.trim(),
    image_url:  document.getElementById('mImage').value.trim(),
    badge,
    status:     document.getElementById('mStatus').value,
  };
  if (!payload.nickname) return toast('Falta el nickname', 'error');

  const { error } = dbId
    ? await sb.from('content_members').update(payload).eq('id', parseInt(dbId))
    : await sb.from('content_members').insert({ ...payload, sort_order: membersData.length + 1 });

  if (error) return toast('Error: ' + error.message, 'error');
  toast('Miembro guardado ✓');
  closeModal('memberModal');
  await loadMembers();
}

async function deleteMember(id) {
  if (!confirm('¿Eliminar este miembro?')) return;
  const { error } = await sb.from('content_members').delete().eq('id', id);
  if (error) return toast('Error: ' + error.message, 'error');
  toast('Miembro eliminado');
  await loadMembers();
}

// ════════════════════
// NOTICIAS
// ════════════════════
let newsData = [];

async function loadNews() {
  const { data } = await sb.from('content_news').select('*').order('sort_order');
  newsData = data || [];
  renderNews();
}

function renderNews() {
  const tb = document.getElementById('newsTable');
  if (!newsData.length) { tb.innerHTML = '<tr><td colspan="5" class="empty-state">Sin noticias.</td></tr>'; return; }
  tb.innerHTML = newsData.map(p => `
    <tr>
      <td><span style="color:var(--gold);font-size:0.8rem;">${p.chapter}</span></td>
      <td>${p.title}</td>
      <td><span class="badge badge-member">${p.category}</span></td>
      <td style="color:var(--gray);">${p.date_label}</td>
      <td><div class="td-actions">
        <button class="btn btn-secondary btn-sm" onclick="editNews(${p.id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteNews(${p.id})">🗑️</button>
      </div></td>
    </tr>`).join('');
}

function openNewsModal(id = null) {
  const p = id ? newsData.find(x => x.id === id) : {};
  document.getElementById('nDbId').value     = p?.id || '';
  document.getElementById('nChapter').value  = p?.chapter     || '';
  document.getElementById('nCategory').value = p?.category    || 'guild';
  document.getElementById('nTitle').value    = p?.title       || '';
  document.getElementById('nDate').value     = p?.date_label  || '';
  document.getElementById('nImg').value      = p?.image_url   || '';
  document.getElementById('nFeatured').value = p?.featured ? 'true' : 'false';
  document.getElementById('nDesc').value     = p?.description || '';
  document.getElementById('newsModalTitle').textContent = id ? 'Editar Noticia' : 'Nueva Noticia';
  openModal('newsModal');
}
function editNews(id) { openNewsModal(id); }

async function saveNews() {
  const dbId = document.getElementById('nDbId').value;
  const payload = {
    chapter:     document.getElementById('nChapter').value.trim(),
    title:       document.getElementById('nTitle').value.trim(),
    date_label:  document.getElementById('nDate').value.trim(),
    category:    document.getElementById('nCategory').value,
    description: document.getElementById('nDesc').value.trim(),
    image_url:   document.getElementById('nImg').value.trim() || null,
    featured:    document.getElementById('nFeatured').value === 'true',
  };
  if (!payload.title) return toast('Falta el título', 'error');
  const { error } = dbId
    ? await sb.from('content_news').update(payload).eq('id', parseInt(dbId))
    : await sb.from('content_news').insert({ ...payload, sort_order: newsData.length + 1 });
  if (error) return toast('Error: ' + error.message, 'error');
  toast('Noticia guardada ✓');
  closeModal('newsModal');
  await loadNews();
}

async function deleteNews(id) {
  if (!confirm('¿Eliminar noticia?')) return;
  await sb.from('content_news').delete().eq('id', id);
  toast('Noticia eliminada');
  await loadNews();
}

// ════════════════════
// GUÍAS
// ════════════════════
let guidesData = [];

async function loadGuides() {
  const { data } = await sb.from('content_guides').select('*').order('sort_order');
  guidesData = data || [];
  renderGuides();
}

function renderGuides() {
  const tb = document.getElementById('guidesTable');
  if (!guidesData.length) { tb.innerHTML = '<tr><td colspan="5" class="empty-state">Sin guías.</td></tr>'; return; }
  tb.innerHTML = guidesData.map(g => `
    <tr>
      <td><span class="badge badge-member">${g.game_short}</span></td>
      <td>${g.title}</td>
      <td style="color:var(--gold);font-size:0.8rem;">${g.category}</td>
      <td style="color:var(--gray);">${g.author}</td>
      <td><div class="td-actions">
        <button class="btn btn-secondary btn-sm" onclick="editGuide(${g.id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteGuide(${g.id})">🗑️</button>
      </div></td>
    </tr>`).join('');
}

function openGuideModal(id = null) {
  const g = id ? guidesData.find(x => x.id === id) : {};
  document.getElementById('gDbId').value      = g?.id || '';
  document.getElementById('gGame').value      = g?.game       || '';
  document.getElementById('gGameShort').value = g?.game_short || '';
  document.getElementById('gCategory').value  = g?.category   || '';
  document.getElementById('gAuthor').value    = g?.author     || '';
  document.getElementById('gTitle').value     = g?.title      || '';
  document.getElementById('gDate').value      = g?.date_label || '';
  document.getElementById('gDesc').value      = g?.description|| '';
  document.getElementById('gContent').value   = g?.content    || '';
  document.getElementById('guideModalTitle').textContent = id ? 'Editar Guía' : 'Nueva Guía';
  openModal('guideModal');
}
function editGuide(id) { openGuideModal(id); }

async function saveGuide() {
  const dbId = document.getElementById('gDbId').value;
  const payload = {
    game:        document.getElementById('gGame').value.trim(),
    game_short:  document.getElementById('gGameShort').value.trim(),
    category:    document.getElementById('gCategory').value.trim(),
    author:      document.getElementById('gAuthor').value.trim(),
    title:       document.getElementById('gTitle').value.trim(),
    date_label:  document.getElementById('gDate').value.trim(),
    description: document.getElementById('gDesc').value.trim(),
    content:     document.getElementById('gContent').value.trim(),
  };
  if (!payload.title) return toast('Falta el título', 'error');
  const { error } = dbId
    ? await sb.from('content_guides').update(payload).eq('id', parseInt(dbId))
    : await sb.from('content_guides').insert({ ...payload, sort_order: guidesData.length + 1 });
  if (error) return toast('Error: ' + error.message, 'error');
  toast('Guía guardada ✓');
  closeModal('guideModal');
  await loadGuides();
}

async function deleteGuide(id) {
  if (!confirm('¿Eliminar guía?')) return;
  await sb.from('content_guides').delete().eq('id', id);
  toast('Guía eliminada');
  await loadGuides();
}

// ════════════════════
// GALERÍA
// ════════════════════
let galleryData = [];

async function loadGallery() {
  const { data } = await sb.from('content_gallery').select('*').where ?
    await sb.from('content_gallery').select('*').eq('is_empty', false).order('sort_order') :
    await sb.from('content_gallery').select('*').order('sort_order');
  galleryData = (data || []).filter(i => !i.is_empty);
  renderGallery();
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!galleryData.length) { grid.innerHTML = '<div class="empty-state">Sin imágenes. Agrega una.</div>'; return; }
  grid.innerHTML = galleryData.map(item => `
    <div class="admin-member-card" style="flex-direction:column;gap:0.7rem;">
      ${item.image_url ? `<img src="${item.image_url}" style="width:100%;height:120px;object-fit:cover;object-position:top;border-radius:6px;" onerror="this.style.display='none'">` : '<div style="height:120px;background:rgba(20,20,40,0.8);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--gray);">Sin imagen</div>'}
      <div>
        <div style="font-size:0.85rem;color:var(--white);margin-bottom:0.3rem;">${item.title || 'Sin título'}</div>
        <div style="font-size:0.72rem;color:var(--gray);">${item.description || ''}</div>
      </div>
      <div style="display:flex;gap:0.4rem;">
        <button class="btn btn-secondary btn-sm" onclick="editGallery(${item.id})" style="flex:1;">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteGallery(${item.id})">🗑️</button>
      </div>
    </div>`).join('');
}

function openGalleryAdd() {
  const url   = prompt('URL o ruta de la imagen (ej: assets/gallery/foto.jpg):');
  if (!url) return;
  const title = prompt('Título:') || '';
  const desc  = prompt('Descripción:') || '';
  sb.from('content_gallery').insert({ image_url: url, title, description: desc, sort_order: galleryData.length + 1 })
    .then(({ error }) => {
      if (error) return toast('Error: ' + error.message, 'error');
      toast('Imagen agregada ✓');
      loadGallery();
    });
}

async function editGallery(id) {
  const item = galleryData.find(i => i.id === id);
  const url   = prompt('URL de imagen:', item?.image_url || '');
  if (url === null) return;
  const title = prompt('Título:', item?.title || '') || '';
  const desc  = prompt('Descripción:', item?.description || '') || '';
  const { error } = await sb.from('content_gallery').update({ image_url: url, title, description: desc }).eq('id', id);
  if (error) return toast('Error: ' + error.message, 'error');
  toast('Imagen actualizada ✓');
  await loadGallery();
}

async function deleteGallery(id) {
  if (!confirm('¿Eliminar imagen?')) return;
  await sb.from('content_gallery').delete().eq('id', id);
  toast('Imagen eliminada');
  await loadGallery();
}

// ════════════════════
// USUARIOS
// ════════════════════
let allUsers = [];
const ROLE_LABELS = { admin:'Guild Master', officer:'Officer', member:'Miembro', pending:'Pendiente', rejected:'Rechazado' };
const ROLE_COLORS = { admin:'#C9A84C', officer:'#2A7EC8', member:'#60ff99', pending:'#c080ff', rejected:'#ff6666' };

async function loadUsers() {
  const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
  allUsers = data || [];
  filterUsers();
}

function filterUsers() {
  const role = document.getElementById('userRoleFilter')?.value;
  renderUsers(role ? allUsers.filter(u => u.role === role) : allUsers);
}

function renderUsers(users) {
  const grid = document.getElementById('usersGrid');
  if (!grid) return;
  if (!users.length) { grid.innerHTML = '<div class="empty-state">Sin usuarios.</div>'; return; }

  const pending = users.filter(u => u.role === 'pending');
  const rest    = users.filter(u => u.role !== 'pending');
  let html = '';

  if (pending.length) {
    html += `<div style="margin-bottom:1.5rem;">
      <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#c080ff;margin-bottom:0.8rem;padding-bottom:0.4rem;border-bottom:1px solid rgba(139,42,200,0.2);">⏳ Pendientes (${pending.length})</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:0.8rem;">${pending.map(u => renderUserCard(u)).join('')}</div>
    </div>`;
  }
  if (rest.length) {
    html += `<div>
      <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gray);margin-bottom:0.8rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border);">Miembros (${rest.length})</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:0.8rem;">${rest.map(u => renderUserCard(u)).join('')}</div>
    </div>`;
  }
  grid.innerHTML = html;
}

function renderUserCard(u) {
  const rc = ROLE_COLORS[u.role] || '#888';
  const rl = ROLE_LABELS[u.role] || u.role;
  const isPending = u.role === 'pending';
  return `
  <div style="background:var(--card);border:1px solid ${isPending ? 'rgba(139,42,200,0.3)' : 'var(--border)'};border-radius:var(--radius);padding:1.1rem;display:flex;gap:0.9rem;align-items:flex-start;">
    <div style="width:52px;height:70px;border-radius:6px;overflow:hidden;flex-shrink:0;border:1px solid var(--border);background:linear-gradient(135deg,#1a0535,#06010f);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">
      ${u.image_url ? `<img src="${u.image_url}" style="width:100%;height:100%;object-fit:cover;object-position:top;" onerror="this.parentElement.innerHTML='👤'">` : '👤'}
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-family:'Cinzel',serif;font-size:0.9rem;color:#EDE8E0;margin-bottom:0.2rem;">${u.nickname || '(sin nickname)'}</div>
      <div style="font-size:0.68rem;color:${rc};margin-bottom:0.2rem;">${rl}</div>
      <div style="font-size:0.65rem;color:var(--gray);margin-bottom:0.7rem;">⚜ ${u.guild_coins || 0} coins</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">
        ${isPending ? `<button class="btn btn-success btn-sm" onclick="setUserRole('${u.id}','member','${u.nickname}')">✓ Aprobar</button><button class="btn btn-danger btn-sm" onclick="setUserRole('${u.id}','rejected','${u.nickname}')">✗ Rechazar</button>` : ''}
        ${u.role === 'member'  ? `<button class="btn btn-secondary btn-sm" onclick="setUserRole('${u.id}','officer','${u.nickname}')">▲ Officer</button>` : ''}
        ${u.role === 'officer' ? `<button class="btn btn-secondary btn-sm" onclick="setUserRole('${u.id}','member','${u.nickname}')">▼ Miembro</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="openCoinsModal('${u.id}','${u.nickname}')">⚜ Coins</button>
        <button class="btn btn-secondary btn-sm" onclick="openAchieveModal('${u.id}','${u.nickname}')">🏆 Logro</button>
      </div>
    </div>
  </div>`;
}

async function setUserRole(userId, newRole, nickname) {
  const badgeMap = { admin:'master', officer:'officer', member:'member', pending:'member', rejected:'member' };
  const { error } = await sb.from('profiles').update({ role: newRole, badge: badgeMap[newRole] || 'member' }).eq('id', userId);
  if (error) return toast('Error: ' + error.message, 'error');
  toast(`${nickname} → ${ROLE_LABELS[newRole]} ✓`);
  await loadUsers();
}

function openCoinsModal(userId, nickname) {
  document.getElementById('coinsUserId').value   = userId;
  document.getElementById('coinsUserName').value = nickname;
  document.getElementById('coinsAmount').value   = 50;
  document.getElementById('coinsReason').value   = '';
  openModal('coinsModal');
}
async function confirmGiveCoins() {
  const userId = document.getElementById('coinsUserId').value;
  const amount = parseInt(document.getElementById('coinsAmount').value) || 0;
  const reason = document.getElementById('coinsReason').value.trim() || 'GuildCoins';
  if (!amount) return toast('Ingresa una cantidad', 'error');
  await sb.from('coin_transactions').insert({ user_id: userId, amount, reason, given_by: Auth.session?.user?.id });
  const user = allUsers.find(u => u.id === userId);
  await sb.from('profiles').update({ guild_coins: Math.max(0, (user?.guild_coins || 0) + amount) }).eq('id', userId);
  toast(`${amount > 0 ? '+' : ''}${amount} coins asignados ✓`);
  closeModal('coinsModal');
  await loadUsers();
}

function openAchieveModal(userId, nickname) {
  document.getElementById('achieveUserId').value   = userId;
  document.getElementById('achieveUserName').value = nickname;
  openModal('achieveModal');
}
async function confirmGiveAchievement() {
  const userId      = document.getElementById('achieveUserId').value;
  const achievement = document.getElementById('achieveKey').value;
  const { error } = await sb.from('achievements').upsert({ user_id: userId, achievement }, { onConflict: 'user_id,achievement' });
  if (error) return toast('Error: ' + error.message, 'error');
  toast('Logro asignado ✓');
  closeModal('achieveModal');
}
