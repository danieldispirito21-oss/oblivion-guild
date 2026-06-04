let chapters = [];
let currentChapter = null;
let currentPage = 0;
let totalPages = 0;

// ── PROGRESO DE LECTURA ──
const PROG_KEY = 'oblivion_manga_progress';

function saveProgress(chId, page) {
  // Guardar en localStorage (funciona para todos)
  localStorage.setItem(PROG_KEY, JSON.stringify({
    chId, page, ts: Date.now(),
    chTitle: currentChapter?.title || ''
  }));
  // Guardar en Supabase si está logueado
  if (typeof sb !== 'undefined' && typeof Auth !== 'undefined' && Auth.session) {
    sb.from('reading_progress').upsert({
      user_id:    Auth.session.user.id,
      manga:      'oblivion',
      chapter_id: chId,
      page:       page
    }, { onConflict: 'user_id,manga' }).catch(() => {});
  }
}

function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROG_KEY) || 'null'); }
  catch { return null; }
}

function clearProgress() {
  localStorage.removeItem(PROG_KEY);
}

const img      = document.getElementById('readerImg');
const imgWrap  = document.getElementById('imgWrap');
const counter  = document.getElementById('pageCounter');
const btnPrev  = document.getElementById('btnPrev');
const btnNext  = document.getElementById('btnNext');
const thumbs   = document.getElementById('thumbStrip');
const chSel    = document.getElementById('chapterSelect');
const chTitle  = document.getElementById('chapterTitle');
const zoomDisp = document.getElementById('zoomDisplay');
const readerMain = document.getElementById('readerMain');

// ── ZOOM STATE ──
let zoomLevel = 1.0;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 5.0;
const ZOOM_STEP = 0.25;

// Drag-to-pan state
let isPanning = false;
let panStartX = 0, panStartY = 0;
let scrollStartX = 0, scrollStartY = 0;

// Pinch-to-zoom state
let pinchStartDist = null;
let pinchStartZoom = 1;

function setZoom(level, centerX, centerY) {
  const prev = zoomLevel;
  zoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, level));

  if (zoomLevel <= 1.0) {
    // Fit mode
    img.className = 'reader-page-img zoom-fit';
    img.style.width = '';
    img.style.height = '';
    readerMain.scrollTo(0, 0);
  } else {
    // Zoom mode — set explicit dimensions
    img.className = 'reader-page-img zoom-in';
    const base = getFitDimensions();
    const newW = base.w * zoomLevel;
    const newH = base.h * zoomLevel;
    img.style.width  = newW + 'px';
    img.style.height = newH + 'px';

    // Scroll to keep the zoom center in view
    if (centerX !== undefined && prev !== zoomLevel) {
      const ratio = zoomLevel / prev;
      const scrollX = (readerMain.scrollLeft + centerX) * ratio - centerX;
      const scrollY = (readerMain.scrollTop  + centerY) * ratio - centerY;
      readerMain.scrollLeft = Math.max(0, scrollX);
      readerMain.scrollTop  = Math.max(0, scrollY);
    }
  }

  zoomDisp.textContent = Math.round(zoomLevel * 100) + '%';
}

function getFitDimensions() {
  // Compute image natural aspect ratio and max fit in container
  const mW = readerMain.clientWidth  - 32;
  const mH = readerMain.clientHeight - 16;
  const nW = img.naturalWidth  || 800;
  const nH = img.naturalHeight || 1200;
  const ratio = nW / nH;
  const containerRatio = mW / mH;

  if (ratio > containerRatio) {
    return { w: mW, h: mW / ratio };
  } else {
    return { w: mH * ratio, h: mH };
  }
}

function adjustZoom(delta) { setZoom(zoomLevel + delta); }
function resetZoom()       { setZoom(1.0); }

// Zoom buttons
document.getElementById('btnZoomIn') .addEventListener('click', () => adjustZoom(+ZOOM_STEP));
document.getElementById('btnZoomOut').addEventListener('click', () => adjustZoom(-ZOOM_STEP));
document.getElementById('btnZoomFit').addEventListener('click', resetZoom);

// ── CTRL + RUEDA → ZOOM ──
readerMain.addEventListener('wheel', e => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  const rect = readerMain.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
  setZoom(zoomLevel + delta, cx, cy);
}, { passive: false });

// También sin Ctrl pero solo en la imagen
img.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = readerMain.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
  setZoom(zoomLevel + delta, cx, cy);
}, { passive: false });

// ── DOBLE CLIC → ZOOM RÁPIDO ──
img.addEventListener('dblclick', e => {
  e.preventDefault();
  if (zoomLevel > 1.0) {
    resetZoom();
  } else {
    const rect = readerMain.getBoundingClientRect();
    setZoom(2.5, e.clientX - rect.left, e.clientY - rect.top);
  }
});

// ── DRAG TO PAN ──
img.addEventListener('mousedown', e => {
  if (zoomLevel <= 1.0) return;
  isPanning = true;
  panStartX = e.clientX;
  panStartY = e.clientY;
  scrollStartX = readerMain.scrollLeft;
  scrollStartY = readerMain.scrollTop;
  e.preventDefault();
});
document.addEventListener('mousemove', e => {
  if (!isPanning) return;
  readerMain.scrollLeft = scrollStartX - (e.clientX - panStartX);
  readerMain.scrollTop  = scrollStartY - (e.clientY - panStartY);
});
document.addEventListener('mouseup', () => { isPanning = false; });

// ── PINCH TO ZOOM (MÓVIL) ──
readerMain.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    pinchStartDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    pinchStartZoom = zoomLevel;
  }
}, { passive: true });

readerMain.addEventListener('touchmove', e => {
  if (e.touches.length !== 2 || !pinchStartDist) return;
  e.preventDefault();
  const dist = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY
  );
  const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - readerMain.getBoundingClientRect().left;
  const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - readerMain.getBoundingClientRect().top;
  setZoom(pinchStartZoom * (dist / pinchStartDist), cx, cy);
}, { passive: false });

readerMain.addEventListener('touchend', () => { pinchStartDist = null; });

// ── INIT ──
fetch('data/chapters.json')
  .then(r => r.json())
  .then(data => {
    chapters = data.chapters;
    chapters.forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch.id;
      opt.textContent = `Cap. ${ch.number} — ${ch.title}`;
      chSel.appendChild(opt);
    });

    const params   = new URLSearchParams(location.search);
    const urlCh    = parseInt(params.get('ch'));
    const urlPage  = parseInt(params.get('p')) - 1 || 0;
    const saved    = getProgress();

    // Si viene con URL específica (enlace directo)
    if (urlCh) {
      loadChapter(urlCh, urlPage);
      return;
    }

    // Si tiene progreso guardado → ofrecer continuar
    if (saved && saved.chId && saved.page > 0) {
      showContinuePrompt(saved);
    } else {
      loadChapter(1, 0);
    }
  });

function showContinuePrompt(saved) {
  const overlay = document.getElementById('continueOverlay');
  const msg     = document.getElementById('continueMsg');
  if (!overlay || !msg) { loadChapter(saved.chId, saved.page); return; }

  const chObj = chapters.find(c => c.id === saved.chId);
  const pageLabel = `Cap. ${chObj?.number || saved.chId} · Página ${saved.page + 1}`;
  msg.textContent = pageLabel;
  overlay.style.display = 'flex';

  document.getElementById('btnContinue').onclick = () => {
    overlay.style.display = 'none';
    loadChapter(saved.chId, saved.page);
  };
  document.getElementById('btnStartOver').onclick = () => {
    overlay.style.display = 'none';
    clearProgress();
    loadChapter(1, 0);
  };
}

function loadChapter(id, startPage = 0) {
  currentChapter = chapters.find(c => c.id === id) || chapters[0];
  chSel.value = currentChapter.id;
  chTitle.textContent = `Cap. ${currentChapter.number} — ${currentChapter.title}`;
  totalPages = currentChapter.pages;
  buildThumbs();
  goToPage(startPage);
}

function buildThumbs() {
  thumbs.innerHTML = '';
  for (let i = 0; i < totalPages; i++) {
    const div = document.createElement('div');
    div.className = 'reader-thumb' + (i === 0 ? ' active' : '');
    div.innerHTML = `<img src="manga/${currentChapter.folder}/${String(i+1).padStart(2,'0')}.png" loading="lazy" alt="p${i+1}">`;
    div.addEventListener('click', () => goToPage(i));
    thumbs.appendChild(div);
  }
}

function goToPage(n) {
  n = Math.max(0, Math.min(n, totalPages - 1));
  currentPage = n;
  resetZoom();
  const src = `manga/${currentChapter.folder}/${String(n+1).padStart(2,'0')}.png`;
  img.style.opacity = '0';
  img.src = src;
  img.onload = () => { img.style.transition = 'opacity 0.2s'; img.style.opacity = '1'; };
  counter.textContent = `${n + 1} / ${totalPages}`;
  thumbs.querySelectorAll('.reader-thumb').forEach((t, i) => t.classList.toggle('active', i === n));
  thumbs.querySelectorAll('.reader-thumb')[n]?.scrollIntoView({ inline:'center', block:'nearest', behavior:'smooth' });
  document.querySelector('.reader-main').scrollTop = 0;
  history.replaceState(null, '', `?ch=${currentChapter.id}&p=${n+1}`);

  // ── Guardar progreso ──
  saveProgress(currentChapter.id, n);

  // ── Última página → mostrar botón siguiente capítulo ──
  const isLast = n === totalPages - 1;
  btnPrev.disabled = n === 0;

  const nextCh = chapters.find(c => c.id === currentChapter.id + 1);
  if (isLast && nextCh) {
    btnNext.textContent = `Cap. ${nextCh.number}: ${nextCh.title} →`;
    btnNext.onclick = () => { loadChapter(nextCh.id, 0); btnNext.textContent = 'Siguiente →'; btnNext.onclick = () => goToPage(currentPage + 1); };
    btnNext.disabled = false;
  } else {
    btnNext.textContent = 'Siguiente →';
    btnNext.onclick = () => goToPage(currentPage + 1);
    btnNext.disabled = isLast;
  }
}

// ── CONTROLS ──
btnPrev.addEventListener('click', () => goToPage(currentPage - 1));
btnNext.addEventListener('click', () => goToPage(currentPage + 1));

// Click image to advance
img.addEventListener('click', e => {
  const half = img.offsetWidth / 2;
  e.offsetX < half ? goToPage(currentPage - 1) : goToPage(currentPage + 1);
});

// Chapter selector
chSel.addEventListener('change', () => {
  loadChapter(parseInt(chSel.value));
  history.replaceState(null, '', `?ch=${chSel.value}`);
});

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goToPage(currentPage + 1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp'  ) goToPage(currentPage - 1);
  if (e.key === 'Home') goToPage(0);
  if (e.key === 'End')  goToPage(totalPages - 1);
});

// Touch swipe
let touchX = null;
document.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) dx < 0 ? goToPage(currentPage + 1) : goToPage(currentPage - 1);
  touchX = null;
});
