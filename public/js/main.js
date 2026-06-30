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

  setTimeout(() => UI.showToast('Bienvenido a WebMerge Studio v4', 'info'), 1500);
});
