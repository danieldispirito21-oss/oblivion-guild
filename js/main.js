// ── STARFIELD (fixed, full page) ──
(function () {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [], nebula = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function init() {
    stars = [];
    nebula = [];
    const count = Math.floor((canvas.width * canvas.height) / 4200);
    for (let i = 0; i < count; i++) {
      const rnd = Math.random();
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.2,
        alpha: Math.random() * 0.75 + 0.1,
        speed: Math.random() * 0.1 + 0.015,
        drift: (Math.random() - 0.5) * 0.05,
        gold:   rnd < 0.05,
        purple: rnd >= 0.05 && rnd < 0.14,
        blue:   rnd >= 0.14 && rnd < 0.22,
        twinkleSpeed:  Math.random() * 0.003 + 0.001,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
    // Bright prominent stars — some purple/gold
    for (let i = 0; i < 18; i++) {
      const rnd = Math.random();
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.5 + 1.0,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.05 + 0.01,
        drift: (Math.random() - 0.5) * 0.02,
        gold:   rnd < 0.35,
        purple: rnd >= 0.35 && rnd < 0.6,
        blue:   rnd >= 0.6 && rnd < 0.75,
        twinkleSpeed:  Math.random() * 0.002 + 0.001,
        twinkleOffset: Math.random() * Math.PI * 2,
        glow: true,
      });
    }
  }

  let t = 0;
  function draw() {
    t++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep void — almost black
    const grad = ctx.createRadialGradient(
      canvas.width * 0.5, canvas.height * 0.25, 0,
      canvas.width * 0.5, canvas.height * 0.5,  canvas.width * 0.95
    );
    grad.addColorStop(0,   'rgba(12,6,28,1)');
    grad.addColorStop(0.3, 'rgba(6,3,16,1)');
    grad.addColorStop(0.7, 'rgba(3,2,10,1)');
    grad.addColorStop(1,   'rgba(1,1,5,1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Purple nebula left
    const nebL = ctx.createRadialGradient(canvas.width*0.2, canvas.height*0.15, 0, canvas.width*0.2, canvas.height*0.15, canvas.width*0.4);
    nebL.addColorStop(0,   'rgba(100,20,200,0.08)');
    nebL.addColorStop(0.5, 'rgba(60,10,140,0.04)');
    nebL.addColorStop(1,   'transparent');
    ctx.fillStyle = nebL;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Purple nebula right
    const nebR = ctx.createRadialGradient(canvas.width*0.8, canvas.height*0.1, 0, canvas.width*0.8, canvas.height*0.1, canvas.width*0.35);
    nebR.addColorStop(0,   'rgba(80,10,180,0.07)');
    nebR.addColorStop(1,   'transparent');
    ctx.fillStyle = nebR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gold warm glow at horizon
    const nebGold = ctx.createRadialGradient(canvas.width*0.5, canvas.height*0.85, 0, canvas.width*0.5, canvas.height*0.85, canvas.width*0.5);
    nebGold.addColorStop(0,   'rgba(140,80,10,0.05)');
    nebGold.addColorStop(0.5, 'rgba(100,50,5,0.02)');
    nebGold.addColorStop(1,   'transparent');
    ctx.fillStyle = nebGold;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(s => {
      // Move
      s.y -= s.speed;
      s.x += s.drift;
      if (s.y < -4) { s.y = canvas.height + 4; s.x = Math.random() * canvas.width; }
      if (s.x < -4)  s.x = canvas.width + 4;
      if (s.x > canvas.width + 4) s.x = -4;

      // Twinkle
      const tw = 0.55 + 0.45 * Math.sin(t * s.twinkleSpeed * 60 + s.twinkleOffset);
      const alpha = s.alpha * tw;

      // Draw
      if (s.glow) {
        const glowGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        let gc;
        if      (s.gold)   gc = `rgba(240,200,80,${alpha * 0.7})`;
        else if (s.purple) gc = `rgba(180,80,255,${alpha * 0.7})`;
        else if (s.blue)   gc = `rgba(80,180,255,${alpha * 0.65})`;
        else               gc = `rgba(180,200,255,${alpha * 0.5})`;
        glowGrad.addColorStop(0, gc);
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      // Color variety: gold, purple, blue, white
      let color;
      if (s.gold)        color = `rgba(220,185,80,${alpha})`;
      else if (s.purple) color = `rgba(180,100,255,${alpha})`;
      else if (s.blue)   color = `rgba(100,190,255,${alpha})`;
      else               color = `rgba(200,210,255,${alpha})`;
      ctx.fillStyle = color;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); init(); });
  resize(); init(); draw();
})();

// ── NAVBAR ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 50);
});

// ── SMOOTH SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior:'smooth' }); }
  });
});

// ── REVEAL ON SCROLL ──
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ── NEWS (desde Supabase) ──
sb.from('content_news').select('*').order('sort_order').then(({ data }) => {
    const grid = document.getElementById('newsGrid');
    if (!grid || !data) return;
    const posts = data;
    posts.forEach((p, i) => {
      // Mapear campos de Supabase al formato esperado
      p.desc = p.description; p.date = p.date_label; p.img = p.image_url;
      const delay = (i % 3) * 0.1;
      const catLabel = { guild:'Guild', manga:'Manga', juego:'Juego' }[p.category] || p.category;
      const cover = p.img
        ? `<div class="news-cover">${p.featured ? '<div class="news-featured-badge">Destacado</div>' : ''}<img src="${p.img}" alt="${p.title}" loading="lazy"></div>`
        : `<div class="news-no-img"><div class="news-no-img-icon">📢</div></div>`;
      grid.innerHTML += `
      <div class="news-card${p.featured ? ' featured' : ''} reveal" style="transition-delay:${delay}s">
        ${cover}
        <div class="news-body">
          <div class="news-meta">
            <span class="news-chapter">${p.chapter}</span>
            <span class="news-cat cat-${p.category}">${catLabel}</span>
            <span class="news-date">${p.date}</span>
          </div>
          <div class="news-title">${p.title}</div>
          <div class="news-desc">${p.desc}</div>
        </div>
      </div>`;
    });
    grid.querySelectorAll('.reveal').forEach(el => io.observe(el));
  });

// ── GALLERY + LIGHTBOX ──
let galleryItems = [];
let lbIndex = 0;

sb.from('content_gallery').select('*').eq('is_empty', false).order('sort_order').then(({ data }) => {
    const grid = document.getElementById('galleryGrid');
    if (!grid || !data) return;
    galleryItems = data.filter(item => item.image_url);

    data.forEach((item, i) => {
      const delay = (i % 4) * 0.07;
      const lbIdx = galleryItems.findIndex(g => g.id === item.id);
      grid.innerHTML += `
      <div class="gallery-item reveal" style="transition-delay:${delay}s" data-lb="${lbIdx}">
        <img class="gallery-img" src="${item.image_url}" alt="${item.title || ''}" loading="lazy">
        <div class="gallery-overlay">
          <div class="gallery-title">${item.title || ''}</div>
          <div class="gallery-desc">${item.description || ''}</div>
        </div>
        <div class="gallery-zoom">⤢</div>
      </div>`;
    });
    grid.querySelectorAll('.gallery-item').forEach(el => {
      el.addEventListener('click', () => openLightbox(parseInt(el.dataset.lb)));
    });
    grid.querySelectorAll('.reveal').forEach(el => io.observe(el));
  });

function openLightbox(idx) {
  lbIndex = Math.max(0, Math.min(idx, galleryItems.length - 1));
  updateLightbox();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
function updateLightbox() {
  const item = galleryItems[lbIndex];
  if (!item) return;
  document.getElementById('lbImg').src = item.image_url || item.img || '';
  document.getElementById('lbCaption').textContent = item.title || '';
  document.getElementById('lbSub').textContent = item.description || item.desc || '';
  document.getElementById('lbPrev').style.opacity = lbIndex > 0 ? '1' : '0.2';
  document.getElementById('lbNext').style.opacity = lbIndex < galleryItems.length - 1 ? '1' : '0.2';
}

document.getElementById('lbClose')?.addEventListener('click', closeLightbox);
document.getElementById('lbPrev')?.addEventListener('click', () => { if (lbIndex > 0) { lbIndex--; updateLightbox(); } });
document.getElementById('lbNext')?.addEventListener('click', () => { if (lbIndex < galleryItems.length - 1) { lbIndex++; updateLightbox(); } });
document.getElementById('lightbox')?.addEventListener('click', e => { if (e.target.id === 'lightbox') closeLightbox(); });
document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (!lb?.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft'  && lbIndex > 0) { lbIndex--; updateLightbox(); }
  if (e.key === 'ArrowRight' && lbIndex < galleryItems.length - 1) { lbIndex++; updateLightbox(); }
});

// ── MEMBERS (Supabase) ──
sb.from('content_members').select('*').order('sort_order').then(({ data }) => {
    const grid = document.getElementById('membersGrid');
    if (!grid || !data) return;

    data.forEach((m, idx) => {
      m.image = m.image_url; m.badge = m.badge || 'member';
      const delay = (idx % 4) * 0.08;

      // ── Card mística (Scions / sin imagen) ──
      if (m.mystical) {
        grid.innerHTML += `
        <div class="member-card-mystical reveal" style="transition-delay:${delay}s">
          <div class="mystical-bg"></div>
          <div class="mystical-nebula"></div>
          <img class="mystical-alien" src="assets/logo-alien.svg" alt="">
          <div class="mystical-badge badge-${m.badge}" style="position:absolute;top:0.7rem;right:0.7rem;z-index:3;">${m.role}</div>
          <div class="mystical-info">
            <div class="mystical-name">${m.nickname}</div>
            <div class="mystical-role-label">${m.specialty}</div>
          </div>
          <div class="mystical-hover">
            <div class="hover-nick">${m.nickname}</div>
            <div class="hover-role">${m.role}</div>
            <div class="hover-row">
              <span class="hover-label">Armas</span>
              <span class="hover-val">${m.weapons}</span>
            </div>
            <div class="hover-bio">${m.bio}</div>
            <div class="hover-quote">${m.quote}</div>
          </div>
        </div>`;
        return;
      }

      // ── Slot vacío ──
      if (m.pending) {
        grid.innerHTML += `
        <div class="member-card-pending reveal" style="transition-delay:${delay}s">
          <div class="pending-icon">+</div>
          <div class="pending-label">Slot disponible</div>
        </div>`;
        return;
      }

      // ── Miembro real ──
      grid.innerHTML += `
      <div class="member-card reveal" style="transition-delay:${delay}s">
        <div class="member-stripe stripe-${m.badge}"></div>
        <div class="member-status status-${m.status}" title="${m.status}"></div>
        <div class="member-badge badge-${m.badge}">${m.role_label || m.role || 'Member'}</div>
        <img class="member-img" src="${m.image_url || m.image || ''}" alt="${m.nickname}" loading="lazy"
             onerror="this.src='assets/characters/Corvo.png'">
        <div class="member-default">
          <div class="member-nickname">${m.nickname}</div>
          <div class="member-role-small">${m.specialty}</div>
        </div>
        <div class="member-hover">
          <div class="hover-nick">${m.nickname}</div>
          <div class="hover-role">${m.role_label || ''} &nbsp;·&nbsp; ${m.specialty}</div>
          <div class="hover-row">
            <span class="hover-label">Armas</span>
            <span class="hover-val">${m.weapons}</span>
          </div>
          <div class="hover-bio">${m.bio}</div>
          <div class="hover-quote">${m.quote}</div>
        </div>
      </div>`;
    });

    // Re-observe new reveal elements
    grid.querySelectorAll('.reveal').forEach(el => io.observe(el));
  });

// ── GUIDES (Supabase) ──
sb.from('content_guides').select('*').order('sort_order').then(({ data }) => {
    const grid = document.getElementById('guidesGrid');
    if (!grid || !data) return;
    data.forEach((g, i) => {
      const delay = (i % 3) * 0.1;
      grid.innerHTML += `
      <div class="guide-card reveal" style="transition-delay:${delay}s">
        <div class="guide-header">
          <span class="guide-game-badge">${g.game_short || g.game}</span>
          <span class="guide-cat">${g.category}</span>
          <span class="guide-author">${g.author}</span>
        </div>
        <div class="guide-title">${g.title}</div>
        <div class="guide-desc">${g.description}</div>
        <div class="guide-footer">
          <span class="guide-date">${g.date_label}</span>
          <a class="guide-link" href="#" onclick="return false;">Ver guía &rarr;</a>
        </div>
      </div>`;
    });
    grid.querySelectorAll('.reveal').forEach(el => io.observe(el));
  });

// ── HERO TITLE: hover + SPARKS ──
document.querySelectorAll('.hero-letter').forEach(letter => {
  letter.addEventListener('mouseenter', () => {
    letter.style.transform = 'translateY(-6px) scale(1.08)';
    letter.style.filter = 'drop-shadow(0 0 30px rgba(240,210,100,0.9))';
    // Burst de chispas al hacer hover
    burstSparks(letter, 6);
  });
  letter.addEventListener('mouseleave', () => {
    letter.style.transform = '';
    letter.style.filter = '';
  });
});

// ── SISTEMA DE CHISPAS ──
(function () {
  const canvas = document.getElementById('sparkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sparks = [];

  // Ajustar canvas al tamaño del título
  function resizeCanvas() {
    const title = document.getElementById('heroTitle');
    if (!title) return;
    const rect = title.getBoundingClientRect();
    canvas.width  = rect.width;
    canvas.height = rect.height;
    canvas.style.left = '0px';
    canvas.style.top  = '0px';
  }
  setTimeout(resizeCanvas, 500);
  window.addEventListener('resize', resizeCanvas);

  // Crear chispa individual
  function createSpark(x, y, isBurst = false) {
    const colors = [
      'rgba(255,240,140,',  // oro cálido
      'rgba(255,255,220,',  // blanco cálido
      'rgba(140,220,255,',  // cyan eléctrico (neon)
      'rgba(255,200,80,',   // naranja-oro
    ];
    const colorBase = colors[Math.floor(Math.random() * colors.length)];
    const angle  = Math.random() * Math.PI * 2;
    const speed  = isBurst ? (Math.random() * 80 + 30) : (Math.random() * 50 + 15);
    const size   = Math.random() * 2.5 + 0.8;
    const life   = Math.random() * 600 + (isBurst ? 300 : 400);

    sparks.push({
      x, y,
      vx: Math.cos(angle) * speed * 0.001,
      vy: Math.sin(angle) * speed * 0.001 - 0.03, // tendencia hacia arriba
      size,
      colorBase,
      alpha: 1,
      life,
      maxLife: life,
      gravity: 0.00003 + Math.random() * 0.00002,
    });
  }

  // Burst de chispas desde una letra
  function burstSparks(letter, count = 5) {
    const titleRect  = document.getElementById('heroTitle')?.getBoundingClientRect();
    const letterRect = letter.getBoundingClientRect();
    if (!titleRect) return;
    const offsetX = letterRect.left - titleRect.left;
    const offsetY = letterRect.top  - titleRect.top;
    for (let i = 0; i < count; i++) {
      const x = offsetX + Math.random() * letterRect.width;
      const y = offsetY + Math.random() * letterRect.height;
      createSpark(x, y, true);
    }
  }
  window.burstSparks = burstSparks;

  // Chispas automáticas periódicas (muy ocasionales)
  function autoSpark() {
    const letters = document.querySelectorAll('.hero-letter');
    if (!letters.length) return;
    if (Math.random() < 0.5) { // 50% de probabilidad en cada tick
      const letter = letters[Math.floor(Math.random() * letters.length)];
      burstSparks(letter, Math.floor(Math.random() * 3) + 1); // 1-3 chispas
    }
  }
  // Cada 1.8s promedio una chispa automática (no constante)
  setInterval(() => { if (Math.random() < 0.65) autoSpark(); }, 1800);

  // Loop de animación
  let lastTime = 0;
  function animate(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }

      const progress = 1 - s.life / s.maxLife;
      s.x  += s.vx * dt;
      s.y  += s.vy * dt;
      s.vy += s.gravity * dt; // gravedad suave

      const alpha = Math.pow(1 - progress, 0.8);
      const size  = s.size * (1 - progress * 0.5);

      // Glow exterior
      ctx.beginPath();
      ctx.arc(s.x, s.y, size * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = s.colorBase + (alpha * 0.15) + ')';
      ctx.fill();

      // Núcleo de la chispa
      ctx.beginPath();
      ctx.arc(s.x, s.y, size, 0, Math.PI * 2);
      ctx.fillStyle = s.colorBase + alpha + ')';
      ctx.fill();

      // Brillo central puro
      if (size > 1.2) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
        ctx.fill();
      }
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();
