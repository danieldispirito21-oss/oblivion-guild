// ════════════════════════════════════════════
// GESTIÓN DE USUARIOS (Supabase)
// ════════════════════════════════════════════

let allUsers = [];

const ROLE_LABELS = { admin:'Guild Master', officer:'Officer', member:'Miembro', pending:'Pendiente', rejected:'Rechazado' };
const ROLE_COLORS = { admin:'#C9A84C', officer:'#2A7EC8', member:'#60ff99', pending:'#c080ff', rejected:'#ff6666' };
const ACHIEVEMENTS_LIST = [
  { key:'founder',             label:'🌟 Fundador' },
  { key:'stonegard_conqueror', label:'🏰 Conquistador Stonegard' },
  { key:'veteran',             label:'⚔️ Veterano' },
  { key:'event_5',             label:'📅 Comprometido' },
  { key:'event_20',            label:'🔥 Guerrero de Guild' },
  { key:'manga_reader',        label:'📖 Cronista' },
];

async function initSupabaseAdmin() {
  await Auth.init(async (session, profile) => {
    const notice = document.getElementById('supabaseAuthNotice');
    if (!session || !profile || !['admin','officer'].includes(profile.role)) {
      if (notice) notice.style.display = 'block';
    } else {
      if (notice) notice.style.display = 'none';
      await loadUsers();
    }
  });
}

async function loadUsers() {
  if (!Auth.session) return;

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { toast('Error cargando usuarios: ' + error.message, 'error'); return; }
  allUsers = data || [];
  renderUsers(allUsers);
  renderDashboard(); // actualizar stats
}

function filterUsers() {
  const role = document.getElementById('userRoleFilter').value;
  const filtered = role ? allUsers.filter(u => u.role === role) : allUsers;
  renderUsers(filtered);
}

function renderUsers(users) {
  const grid = document.getElementById('usersGrid');
  if (!grid) return;

  if (!users.length) {
    grid.innerHTML = '<div class="empty-state">Sin usuarios en esta categoría.</div>';
    return;
  }

  // Agrupar por rol
  const pending  = users.filter(u => u.role === 'pending');
  const rest     = users.filter(u => u.role !== 'pending');

  let html = '';

  if (pending.length) {
    html += `<div style="margin-bottom:0.5rem;">
      <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:#c080ff;margin-bottom:0.8rem;padding-bottom:0.4rem;border-bottom:1px solid rgba(139,42,200,0.2);">
        ⏳ Pendientes de aprobación (${pending.length})
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:0.8rem;margin-bottom:1.5rem;">
        ${pending.map(u => renderUserCard(u)).join('')}
      </div>
    </div>`;
  }

  if (rest.length) {
    html += `<div>
      <div style="font-size:0.65rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--gray);margin-bottom:0.8rem;padding-bottom:0.4rem;border-bottom:1px solid var(--border);">
        Miembros (${rest.length})
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:0.8rem;">
        ${rest.map(u => renderUserCard(u)).join('')}
      </div>
    </div>`;
  }

  grid.innerHTML = html;
}

function renderUserCard(u) {
  const roleColor = ROLE_COLORS[u.role] || '#888';
  const roleLabel = ROLE_LABELS[u.role] || u.role;
  const isPending = u.role === 'pending';

  return `
  <div style="background:var(--card);border:1px solid ${isPending ? 'rgba(139,42,200,0.3)' : 'var(--border)'};border-radius:var(--radius);padding:1.1rem;display:flex;gap:0.9rem;align-items:flex-start;">
    <div style="width:52px;height:70px;border-radius:6px;overflow:hidden;flex-shrink:0;border:1px solid var(--border);background:linear-gradient(135deg,#1a0535,#060110);display:flex;align-items:center;justify-content:center;font-size:1.5rem;">
      ${u.image_url ? `<img src="${u.image_url}" style="width:100%;height:100%;object-fit:cover;object-position:top;" onerror="this.parentElement.innerHTML='👤'">` : '👤'}
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-family:'Cinzel',serif;font-size:0.9rem;color:#EDE8E0;margin-bottom:0.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
        ${u.nickname || '(sin nickname)'}
      </div>
      <div style="font-size:0.68rem;color:${roleColor};margin-bottom:0.2rem;">${roleLabel}</div>
      <div style="font-size:0.65rem;color:var(--gray);margin-bottom:0.7rem;">⚜ ${u.guild_coins || 0} coins</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.3rem;">
        ${isPending ? `
          <button class="btn btn-success btn-sm" onclick="setUserRole('${u.id}','member','${u.nickname}')">✓ Aprobar</button>
          <button class="btn btn-danger btn-sm" onclick="setUserRole('${u.id}','rejected','${u.nickname}')">✗ Rechazar</button>
        ` : ''}
        ${u.role === 'member' ? `
          <button class="btn btn-secondary btn-sm" onclick="setUserRole('${u.id}','officer','${u.nickname}')">▲ Officer</button>
        ` : ''}
        ${u.role === 'officer' ? `
          <button class="btn btn-secondary btn-sm" onclick="setUserRole('${u.id}','member','${u.nickname}')">▼ Miembro</button>
        ` : ''}
        <button class="btn btn-secondary btn-sm" onclick="openCoinsModal('${u.id}','${u.nickname}')">⚜ Coins</button>
        <button class="btn btn-secondary btn-sm" onclick="openAchieveModal('${u.id}','${u.nickname}')">🏆 Logro</button>
      </div>
    </div>
  </div>`;
}

async function setUserRole(userId, newRole, nickname) {
  const badgeMap = { admin:'master', officer:'officer', member:'member', pending:'member', rejected:'member' };
  const { error } = await sb.from('profiles')
    .update({ role: newRole, badge: badgeMap[newRole] || 'member' })
    .eq('id', userId);
  if (error) return toast('Error: ' + error.message, 'error');
  toast(`${nickname} → ${ROLE_LABELS[newRole] || newRole} ✓`);
  await loadUsers();
}

// ── Coins Modal ──
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

  // Registrar transacción
  const { error: txErr } = await sb.from('coin_transactions').insert({
    user_id: userId, amount, reason, given_by: Auth.session?.user?.id
  });
  if (txErr) return toast('Error: ' + txErr.message, 'error');

  // Actualizar total (leer primero)
  const user = allUsers.find(u => u.id === userId);
  const newTotal = (user?.guild_coins || 0) + amount;
  await sb.from('profiles').update({ guild_coins: Math.max(0, newTotal) }).eq('id', userId);

  toast(`${amount > 0 ? '+' : ''}${amount} coins asignados ✓`);
  closeModal('coinsModal');
  await loadUsers();
}

// ── Achievement Modal ──
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

// Mostrar banner si estamos en Netlify (no en localhost)
document.addEventListener('DOMContentLoaded', () => {
  initSupabaseAdmin();
  const isOnline = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0');
  const banner = document.getElementById('onlineBanner');
  if (isOnline && banner) banner.style.display = 'flex';
});

// ── STATE ──
let token = localStorage.getItem('oblivion_admin_token') || null;
let data  = { members: null, news: null, guides: null, gallery: null };

// ── INIT ──
window.addEventListener('DOMContentLoaded', async () => {
  if (token) {
    const res = await fetch('/api/verify', { headers: { 'x-admin-token': token } });
    const { valid } = await res.json();
    if (valid) { showAdmin(); loadAll(); return; }
    token = null; localStorage.removeItem('oblivion_admin_token');
  }
  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
});

// ── AUTH ──
async function doLogin() {
  const pass = document.getElementById('loginPass').value;
  const err  = document.getElementById('loginErr');
  err.classList.remove('show');
  const res = await fetch('/api/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ password: pass })
  });
  const json = await res.json();
  if (!res.ok) { err.classList.add('show'); return; }
  token = json.token;
  localStorage.setItem('oblivion_admin_token', token);
  showAdmin();
  loadAll();
}

async function doLogout() {
  await fetch('/api/logout', { method: 'POST', headers: {'x-admin-token': token} });
  token = null;
  localStorage.removeItem('oblivion_admin_token');
  document.getElementById('adminLayout').style.display = 'none';
  document.getElementById('loginPage').style.display   = 'flex';
  document.getElementById('loginPass').value = '';
}

function showAdmin() {
  document.getElementById('loginPage').style.display   = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
}

// ── API HELPERS ──
const api = {
  get:  file      => fetch(`/api/data/${file}`, {headers:{'x-admin-token':token}}).then(r=>r.json()),
  put:  (file,d)  => fetch(`/api/data/${file}`, {method:'PUT',headers:{'Content-Type':'application/json','x-admin-token':token},body:JSON.stringify(d)}).then(r=>r.json()),
};

async function loadAll() {
  data.members = await api.get('members');
  data.news    = await api.get('news');
  data.guides  = await api.get('guides');
  data.gallery = await api.get('gallery');
  renderDashboard();
  renderMembers();
  renderNews();
  renderGuides();
  renderGallery();
}

// ── NAVIGATION ──
function showSection(name, el) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  if (el) el.classList.add('active');
}

// ── TOAST ──
function toast(msg, type='success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 2500);
}

// ── MODAL ──
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ── DASHBOARD ──
function renderDashboard() {
  const stats = [
    { num: (data.members?.members || []).filter(m=>!m.pending&&!m.mystical).length, label:'Miembros' },
    { num: (data.news?.posts || []).length, label:'Noticias' },
    { num: (data.guides?.guides || []).length, label:'Guías' },
    { num: (data.gallery?.items || []).filter(i=>!i.empty).length, label:'Imágenes' },
  ];
  document.getElementById('dashStats').innerHTML = stats.map(s => `
    <div class="stat-pill">
      <div class="stat-pill-num">${s.num}</div>
      <div class="stat-pill-label">${s.label}</div>
    </div>`).join('');
}

// ════════════════════════════════════
// MIEMBROS
// ════════════════════════════════════
function renderMembers() {
  const members = (data.members?.members || []).filter(m => !m.pending);
  const grid = document.getElementById('membersGrid');
  grid.innerHTML = members.length ? '' : '<div class="empty-state">Sin miembros todavía.</div>';
  members.forEach((m, i) => {
    const realIdx = data.members.members.indexOf(m);
    grid.innerHTML += `
    <div class="admin-member-card">
      <div class="admin-member-avatar">
        ${m.image
          ? `<img src="${m.image}" onerror="this.src='assets/Logo.png?v=3'">`
          : `<div class="no-img">👤</div>`}
      </div>
      <div class="admin-member-info">
        <div class="admin-member-name">${m.nickname || '???'}</div>
        <div class="admin-member-role">
          <span class="badge badge-${m.badge}">${m.role || 'Member'}</span>
          &nbsp;${m.specialty || ''}
        </div>
        <div class="admin-member-actions">
          <button class="btn btn-secondary btn-sm" onclick="editMember(${realIdx})">✏️ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteMember(${realIdx})">🗑️</button>
        </div>
      </div>
    </div>`;
  });
}

function openMemberModal(idx=-1) {
  const m = idx >= 0 ? data.members.members[idx] : {};
  document.getElementById('mIdx').value       = idx;
  document.getElementById('mNick').value      = m.nickname    || '';
  document.getElementById('mBadge').value     = m.badge       || 'member';
  document.getElementById('mSpecialty').value = m.specialty   || '';
  document.getElementById('mWeapons').value   = m.weapons     || '';
  document.getElementById('mStatus').value    = m.status      || 'active';
  document.getElementById('mImage').value     = m.image       || '';
  document.getElementById('mBio').value       = m.bio         || '';
  document.getElementById('mQuote').value     = m.quote       || '';
  const prev = document.getElementById('mImgPreview');
  if (m.image) { prev.src = m.image; prev.style.display='block'; } else { prev.style.display='none'; }
  document.getElementById('memberModalTitle').textContent = idx >= 0 ? 'Editar Miembro' : 'Nuevo Miembro';
  openModal('memberModal');
}

function editMember(idx)   { openMemberModal(idx); }

async function deleteMember(idx) {
  if (!confirm('¿Eliminar este miembro?')) return;
  data.members.members.splice(idx, 1);
  await api.put('members', data.members);
  toast('Miembro eliminado'); renderMembers(); renderDashboard();
}

async function saveMember() {
  const idx = parseInt(document.getElementById('mIdx').value);
  const rolMap = { master:'Guild Master', officer:'Officer', member:'Member' };
  const badge  = document.getElementById('mBadge').value;
  const m = {
    nickname:  document.getElementById('mNick').value.trim(),
    role:      rolMap[badge] || 'Member',
    specialty: document.getElementById('mSpecialty').value.trim(),
    weapons:   document.getElementById('mWeapons').value.trim(),
    bio:       document.getElementById('mBio').value.trim(),
    quote:     document.getElementById('mQuote').value.trim(),
    image:     document.getElementById('mImage').value.trim(),
    badge, status: document.getElementById('mStatus').value,
  };
  if (!m.nickname) return toast('Falta el nickname', 'error');
  if (idx >= 0) data.members.members[idx] = m;
  else          data.members.members.unshift(m);
  await api.put('members', data.members);
  toast('Miembro guardado ✓'); closeModal('memberModal'); renderMembers(); renderDashboard();
}

// Image upload
function previewImg(input) {
  const file = input.files[0]; if (!file) return;
  const prev = document.getElementById('mImgPreview');
  prev.src = URL.createObjectURL(file); prev.style.display='block';
}

async function uploadImg() {
  const input = document.getElementById('mImgFile');
  const file  = input.files[0]; if (!file) return toast('Selecciona una imagen', 'error');
  const fd = new FormData(); fd.append('image', file);
  const res  = await fetch('/api/upload', { method:'POST', headers:{'x-admin-token':token}, body:fd });
  const json = await res.json();
  if (json.path) {
    document.getElementById('mImage').value = json.path;
    toast('Imagen subida ✓');
  } else toast('Error al subir', 'error');
}

// ════════════════════════════════════
// NOTICIAS
// ════════════════════════════════════
function renderNews() {
  const posts = data.news?.posts || [];
  const tb = document.getElementById('newsTable');
  tb.innerHTML = posts.length ? '' : '<tr><td colspan="5" class="empty-state">Sin noticias.</td></tr>';
  posts.forEach((p, i) => {
    tb.innerHTML += `
    <tr>
      <td><span style="color:var(--gold);font-size:0.8rem;">${p.chapter}</span></td>
      <td>${p.title}</td>
      <td><span class="badge badge-member">${p.category}</span></td>
      <td style="color:var(--gray);">${p.date}</td>
      <td><div class="td-actions">
        <button class="btn btn-secondary btn-sm" onclick="editNews(${i})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteNews(${i})">🗑️</button>
      </div></td>
    </tr>`;
  });
}

function openNewsModal(idx=-1) {
  const p = idx >= 0 ? data.news.posts[idx] : {};
  document.getElementById('nIdx').value      = idx;
  document.getElementById('nChapter').value  = p.chapter  || '';
  document.getElementById('nCategory').value = p.category || 'guild';
  document.getElementById('nTitle').value    = p.title    || '';
  document.getElementById('nDate').value     = p.date     || '';
  document.getElementById('nImg').value      = p.img      || '';
  document.getElementById('nFeatured').value = p.featured ? 'true' : 'false';
  document.getElementById('nDesc').value     = p.desc     || '';
  document.getElementById('newsModalTitle').textContent = idx >= 0 ? 'Editar Noticia' : 'Nueva Noticia';
  openModal('newsModal');
}
function editNews(idx) { openNewsModal(idx); }
async function deleteNews(idx) {
  if (!confirm('¿Eliminar noticia?')) return;
  data.news.posts.splice(idx, 1);
  await api.put('news', data.news); toast('Noticia eliminada'); renderNews();
}
async function saveNews() {
  const idx = parseInt(document.getElementById('nIdx').value);
  const p = {
    id:       idx >= 0 ? data.news.posts[idx].id : Date.now(),
    chapter:  document.getElementById('nChapter').value.trim(),
    title:    document.getElementById('nTitle').value.trim(),
    date:     document.getElementById('nDate').value.trim(),
    category: document.getElementById('nCategory').value,
    desc:     document.getElementById('nDesc').value.trim(),
    img:      document.getElementById('nImg').value.trim() || null,
    featured: document.getElementById('nFeatured').value === 'true',
  };
  if (!p.title) return toast('Falta el título', 'error');
  if (idx >= 0) data.news.posts[idx] = p;
  else          data.news.posts.unshift(p);
  await api.put('news', data.news);
  toast('Noticia guardada ✓'); closeModal('newsModal'); renderNews();
}

// ════════════════════════════════════
// GUÍAS
// ════════════════════════════════════
function renderGuides() {
  const guides = data.guides?.guides || [];
  const tb = document.getElementById('guidesTable');
  tb.innerHTML = guides.length ? '' : '<tr><td colspan="5" class="empty-state">Sin guías.</td></tr>';
  guides.forEach((g, i) => {
    tb.innerHTML += `
    <tr>
      <td><span class="badge badge-member">${g.gameShort}</span></td>
      <td>${g.title}</td>
      <td style="color:var(--gold);font-size:0.8rem;">${g.category}</td>
      <td style="color:var(--gray);">${g.author}</td>
      <td><div class="td-actions">
        <button class="btn btn-secondary btn-sm" onclick="editGuide(${i})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="deleteGuide(${i})">🗑️</button>
      </div></td>
    </tr>`;
  });
}

function openGuideModal(idx=-1) {
  const g = idx >= 0 ? data.guides.guides[idx] : {};
  document.getElementById('gIdx').value       = idx;
  document.getElementById('gGame').value      = g.game      || '';
  document.getElementById('gGameShort').value = g.gameShort || '';
  document.getElementById('gCategory').value  = g.category  || '';
  document.getElementById('gAuthor').value    = g.author    || '';
  document.getElementById('gTitle').value     = g.title     || '';
  document.getElementById('gDate').value      = g.date      || '';
  document.getElementById('gDesc').value      = g.desc      || '';
  document.getElementById('gContent').value   = g.content   || '';
  document.getElementById('guideModalTitle').textContent = idx >= 0 ? 'Editar Guía' : 'Nueva Guía';
  openModal('guideModal');
}
function editGuide(idx) { openGuideModal(idx); }
async function deleteGuide(idx) {
  if (!confirm('¿Eliminar guía?')) return;
  data.guides.guides.splice(idx, 1);
  await api.put('guides', data.guides); toast('Guía eliminada'); renderGuides();
}
async function saveGuide() {
  const idx = parseInt(document.getElementById('gIdx').value);
  const g = {
    id:        idx >= 0 ? data.guides.guides[idx].id : Date.now(),
    game:      document.getElementById('gGame').value.trim(),
    gameShort: document.getElementById('gGameShort').value.trim(),
    category:  document.getElementById('gCategory').value.trim(),
    author:    document.getElementById('gAuthor').value.trim(),
    title:     document.getElementById('gTitle').value.trim(),
    date:      document.getElementById('gDate').value.trim(),
    desc:      document.getElementById('gDesc').value.trim(),
    content:   document.getElementById('gContent').value.trim(),
  };
  if (!g.title) return toast('Falta el título', 'error');
  if (idx >= 0) data.guides.guides[idx] = g;
  else          data.guides.guides.unshift(g);
  await api.put('guides', data.guides);
  toast('Guía guardada ✓'); closeModal('guideModal'); renderGuides();
}

// ════════════════════════════════════
// GALERÍA
// ════════════════════════════════════
function renderGallery() {
  const items = (data.gallery?.items || []).filter(i => !i.empty);
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = items.length ? '' : '<div class="empty-state">Sin imágenes todavía.</div>';
  items.forEach((item, i) => {
    const realIdx = data.gallery.items.indexOf(item);
    grid.innerHTML += `
    <div class="admin-member-card" style="flex-direction:column;gap:0.7rem;">
      <img src="${item.img}" style="width:100%;height:120px;object-fit:cover;object-position:top;border-radius:6px;" onerror="this.style.display='none'">
      <div>
        <div style="font-size:0.85rem;color:var(--white);margin-bottom:0.3rem;">${item.title||'Sin título'}</div>
        <div style="font-size:0.72rem;color:var(--gray);">${item.desc||''}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteGallery(${realIdx})">🗑️ Eliminar</button>
    </div>`;
  });
}

function openGalleryModal() {
  const url = prompt('Ruta de la imagen (ej: assets/gallery/imagen.jpg):');
  if (!url) return;
  const title = prompt('Título de la imagen:') || '';
  const desc  = prompt('Descripción:') || '';
  const newItem = { id: Date.now(), title, desc, img: url, placeholder: false };
  data.gallery.items.push(newItem);
  api.put('gallery', data.gallery).then(() => { toast('Imagen agregada ✓'); renderGallery(); });
}

async function deleteGallery(idx) {
  if (!confirm('¿Eliminar imagen?')) return;
  data.gallery.items.splice(idx, 1);
  await api.put('gallery', data.gallery); toast('Imagen eliminada'); renderGallery();
}
