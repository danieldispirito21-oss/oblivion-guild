// ── SUPABASE CLIENT ──
const SUPABASE_URL  = 'https://qlyezahoudioxplkenhe.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFseWV6YWhvdWRpb3hwbGtlbmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MTIyMzIsImV4cCI6MjA5NjA4ODIzMn0.42McLYyAwSHCwzpsOetDJRdeGUGB_kL51E9UbbHO8vM';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── AUTH HELPERS ──
const Auth = {
  // Sesión actual
  session: null,
  profile: null,

  // Inicializa y escucha cambios
  async init(onStateChange) {
    // Escuchar PRIMERO antes de getSession (captura OAuth callback)
    sb.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] event:', event, '| user:', session?.user?.email || 'none');
      this.session = session;

      if (session) {
        try {
          this.profile = await this.getProfile(session.user.id);
        } catch(e) {
          console.warn('[Auth] Profile fetch failed (table may not exist yet):', e.message);
          this.profile = null;
        }
      } else {
        this.profile = null;
      }

      // Notificar solo en eventos relevantes (evitar doble disparo)
      if (['SIGNED_IN','SIGNED_OUT','INITIAL_SESSION','USER_UPDATED'].includes(event)) {
        if (onStateChange) onStateChange(session, this.profile);
      }
    });

    // Luego obtener sesión actual (por si ya está logueado)
    const { data: { session } } = await sb.auth.getSession();
    this.session = session;
    if (session && !this.profile) {
      try { this.profile = await this.getProfile(session.user.id); } catch(e) {}
    }
  },

  // Obtener perfil
  async getProfile(userId) {
    const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
    return data;
  },

  // Login con Discord
  async loginDiscord() {
    // Funciona en localhost Y en GitHub Pages (con subdirectorio)
    const base = window.location.pathname.replace(/[^/]*$/, '');
    const redirectTo = window.location.origin + base + 'login.html';
    console.log('[Auth] Discord OAuth → redirectTo:', redirectTo);

    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo,
        scopes: 'identify email',
      }
    });
    if (error) {
      console.error('[Auth] Discord login error:', error);
      alert('Error al conectar con Discord: ' + error.message);
    }
  },

  // Login con email
  async loginEmail(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  // Registro con email
  async registerEmail(email, password, nickname) {
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: nickname } }
    });
    return { data, error };
  },

  // Logout
  async logout() {
    await sb.auth.signOut();
    window.location.href = 'index.html';
  },

  // Actualizar perfil
  async updateProfile(updates) {
    if (!this.session) return { error: 'No autenticado' };
    const { data, error } = await sb.from('profiles')
      .update(updates)
      .eq('id', this.session.user.id)
      .select().single();
    if (!error) this.profile = data;
    return { data, error };
  },

  // Require auth (redirige si no está logueado)
  requireAuth(redirectUrl = 'login.html') {
    if (!this.session) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  },

  // Require role
  requireRole(roles = ['member', 'officer', 'admin']) {
    if (!this.profile || !roles.includes(this.profile.role)) return false;
    return true;
  },

  // ¿Es admin/officer?
  isOfficer() { return this.profile && ['officer','admin'].includes(this.profile.role); },
  isAdmin()   { return this.profile && this.profile.role === 'admin'; },
  isMember()  { return this.profile && ['member','officer','admin'].includes(this.profile.role); },
};

// ── NAVBAR AUTH STATE ──
// Llama esto en cada página para actualizar el navbar
async function initNavAuth() {
  await Auth.init((session, profile) => {
    const el = document.getElementById('navAuthArea');
    if (!el) return;
    if (session && profile) {
      const approved = ['member','officer','admin'].includes(profile.role);
      const isStaff  = ['officer','admin'].includes(profile.role);
      el.innerHTML = (approved ? `
        <a href="profile.html" class="nav-user-pill">
          <div class="nav-avatar-circle">${(profile.nickname||'?')[0].toUpperCase()}</div>
          <span>${profile.nickname || 'Miembro'}</span>
          <span class="nav-coins">⚜ ${profile.guild_coins || 0}</span>
        </a>` :
        `<a href="profile.html" class="nav-user-pill pending">
          <div class="nav-avatar-circle">⏳</div>
          <span>Pendiente</span>
        </a>`)
        + (isStaff ? `<a href="admin.html" class="btn-nav-admin" title="Panel de Admin">⚙</a>` : '');
    } else {
      el.innerHTML = `<a href="login.html" class="btn-nav-login">Entrar</a>`;
    }
  });
}
