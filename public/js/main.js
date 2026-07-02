/* ============================================================
   WebMerge Studio — Main Orchestrator
   Inspirado en: web_rive (ES modules), reedit/website-reddit
                 (clean architecture), electronica_store (SPA flow)
   ============================================================ */

/* ── Hero Carousel ──────────────────────────────────────── */
async function initCarousel() {
  const container = document.getElementById('heroCarousel');
  if (!container) return;
  try {
    const res = await fetch('/api/carrusel/images');
    const images = await res.json();
    if (!images.length) return;
    images.forEach((src, i) => {
      const div = document.createElement('div');
      div.className = 'carousel-slide' + (i === 0 ? ' active' : '');
      div.style.backgroundImage = `url(${src})`;
      container.appendChild(div);
    });
    let current = 0;
    setInterval(() => {
      const slides = container.querySelectorAll('.carousel-slide');
      if (!slides.length) return;
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 5000);
    applyCarouselOpacity();
  } catch {}
}

function applyCarouselOpacity() {
  const overlay = document.querySelector('.hero-carousel-overlay');
  if (!overlay) return;
  const opacity = parseFloat(Store.get('config').carousel_overlay_opacity);
  if (!isNaN(opacity)) {
    overlay.style.setProperty('--carousel-opacity', opacity);
  }
}

Store.on('config', applyCarouselOpacity);

/* ── Mascot ──────────────────────────────────────────────── */
function getMascotEl() { return document.getElementById('mascot'); }
function getMascotInner() { return document.getElementById('mascotInner'); }

async function loadMascotSVG(filename) {
  if (!filename) return;
  const inner = getMascotInner();
  if (!inner) return;
  try {
    const res = await fetch(`/assets/simbols/${filename}`);
    if (!res.ok) throw new Error('Not found');
    inner.innerHTML = await res.text();
  } catch {
    inner.innerHTML = '';
  }
}

function applyMascotPosition(x, y) {
  const el = getMascotEl();
  if (!el) return;
  const posX = parseFloat(x);
  const posY = parseFloat(y);
  if (!isNaN(posX)) el.style.left = posX + '%';
  if (!isNaN(posY)) el.style.top = posY + '%';
}

function applyMascotConfig(config) {
  const el = getMascotEl();
  if (!el) return;
  const enabled = config.mascot_enabled === '1' || config.mascot_enabled === true;
  el.classList.toggle('visible', enabled);
  if (enabled) {
    loadMascotSVG(config.mascot_file || 'simbol_git.svg');
    applyMascotPosition(config.mascot_pos_x, config.mascot_pos_y);
    const size = parseInt(config.mascot_size) || 80;
    el.style.width = size + 'px';
  }
}

function initMascot() {
  const cfg = Store.get('config');
  if (cfg && Object.keys(cfg).length) applyMascotConfig(cfg);
}

Store.on('config', applyMascotConfig);

document.addEventListener('DOMContentLoaded', () => {
  UI.initCursor();
  UI.initNavbar();
  UI.initMobileMenu();
  UI.initSmoothScroll();
  UI.initRipple();
  UI.initContactForm();

  Animations.initAOS();
  Animations.initHeroGrid();
  Animations.initHeroGSAP();
  Animations.initScrollTrigger();
  Animations.initStatsCounter();

  Chatbot.init();
  KnowledgeBase.init();

  Store.loadConfig();
  initCarousel();
  initMascot();

  setTimeout(() => UI.showToast('Bienvenido a WebMerge Studio v4', 'info'), 1500);
});
