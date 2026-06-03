let chapters = [];
let currentChapter = null;
let currentPage = 0;
let totalPages = 0;

const img     = document.getElementById('readerImg');
const counter = document.getElementById('pageCounter');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const thumbs  = document.getElementById('thumbStrip');
const chSel   = document.getElementById('chapterSelect');
const chTitle = document.getElementById('chapterTitle');

// ── INIT ──
fetch('data/chapters.json')
  .then(r => r.json())
  .then(data => {
    chapters = data.chapters;
    // Populate chapter selector
    chapters.forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch.id;
      opt.textContent = `Cap. ${ch.number} — ${ch.title}`;
      chSel.appendChild(opt);
    });
    // Load chapter from URL param
    const params = new URLSearchParams(location.search);
    const chId = parseInt(params.get('ch')) || 1;
    loadChapter(chId);
  });

function loadChapter(id) {
  currentChapter = chapters.find(c => c.id === id) || chapters[0];
  chSel.value = currentChapter.id;
  chTitle.textContent = `Cap. ${currentChapter.number} — ${currentChapter.title}`;
  totalPages = currentChapter.pages;
  buildThumbs();
  goToPage(0);
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
  const src = `manga/${currentChapter.folder}/${String(n+1).padStart(2,'0')}.png`;
  img.style.opacity = '0';
  img.src = src;
  img.onload = () => { img.style.transition = 'opacity 0.2s'; img.style.opacity = '1'; };
  counter.textContent = `${n + 1} / ${totalPages}`;
  btnPrev.disabled = n === 0;
  btnNext.disabled = n === totalPages - 1;
  // Update thumbs
  thumbs.querySelectorAll('.reader-thumb').forEach((t, i) => t.classList.toggle('active', i === n));
  // Scroll active thumb into view
  thumbs.querySelectorAll('.reader-thumb')[n]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  // Scroll page to top
  document.querySelector('.reader-main').scrollTop = 0;
  // Update URL
  history.replaceState(null, '', `?ch=${currentChapter.id}&p=${n+1}`);
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
