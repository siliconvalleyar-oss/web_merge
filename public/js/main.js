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
function getMascotImg() { return document.getElementById('mascotImg'); }

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
  const img = getMascotImg();
  if (img) {
    if (config.mascot_file) img.src = '/assets/simbols/' + config.mascot_file;
    const size = parseInt(config.mascot_size) || 80;
    el.style.width = size + 'px';
  }
  if (enabled) {
    applyMascotPosition(config.mascot_pos_x, config.mascot_pos_y);
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

  loadPageContent();

  setTimeout(() => UI.showToast('Bienvenido a WebMerge Studio v4', 'info'), 1500);
});

/* ── Page Content Loader (from DB) ────────────────────────── */
async function loadPageContent() {
  try {
    const res = await fetch('/api/page-content');
    const sections = await res.json();
    if (!sections || sections.length === 0) return;

    const grouped = {};
    sections.forEach(s => {
      if (!grouped[s.section_key]) grouped[s.section_key] = [];
      grouped[s.section_key].push(s);
    });

    // Navbar
    if (grouped.navbar) {
      const nav = grouped.navbar[0].content;
      const logoText = document.querySelector('.nav-logo-text');
      if (logoText) logoText.innerHTML = nav.site_name.replace(/(Studio)/i, '<span class="text-accent">$1</span>') || logoText.innerHTML;
      if (nav.logo) {
        const logoIcon = document.querySelector('.nav-logo-icon');
        if (logoIcon) logoIcon.innerHTML = `<img src="${nav.logo}" style="height:28px;vertical-align:middle">`;
      }
      const links = document.querySelectorAll('.nav-link');
      if (nav.items && nav.items.length) {
        links.forEach((link, i) => {
          if (nav.items[i]) {
            link.textContent = nav.items[i].label;
            link.href = nav.items[i].href;
          }
        });
      }
    }

    // Hero
    if (grouped.hero) {
      const hero = grouped.hero[0].content;
      const title = document.querySelector('.hero-title');
      if (title && hero.title) {
        const hl = hero.title_highlight;
        if (hl) title.innerHTML = `<span class="gradient-text">${hero.title}</span><br>${hl}`;
        else title.innerHTML = hero.title;
      }
      const desc = document.querySelector('.hero-desc');
      if (desc && hero.subtitle) desc.textContent = hero.subtitle;
      const btns = document.querySelectorAll('.hero-actions .btn');
      if (btns.length >= 2) {
        if (hero.cta_primary) {
          btns[0].textContent = hero.cta_primary.text || btns[0].textContent;
          btns[0].href = hero.cta_primary.href || btns[0].href;
        }
        if (hero.cta_secondary) {
          btns[1].textContent = hero.cta_secondary.text || btns[1].textContent;
          btns[1].href = hero.cta_secondary.href || btns[1].href;
        }
      }
    }

    // Stats
    if (grouped.stats) {
      const statCards = document.querySelectorAll('.stat-card');
      grouped.stats.forEach((stat, i) => {
        if (!statCards[i]) return;
        const c = stat.content;
        const valEl = statCards[i].querySelector('.stat-value');
        const labEl = statCards[i].querySelector('.stat-label');
        if (valEl) valEl.innerHTML = c.icon ? c.icon + ' ' : '' + valEl.innerHTML;
        if (labEl && c.label) labEl.textContent = c.label;
      });
    }

    // Services
    if (grouped.services) {
      const cards = document.querySelectorAll('.service-card');
      grouped.services.forEach((svc, i) => {
        if (!cards[i]) return;
        const c = svc.content;
        const icon = cards[i].querySelector('.card-icon');
        const title = cards[i].querySelector('.card-title');
        const desc = cards[i].querySelector('.card-desc');
        const list = cards[i].querySelector('.card-features');
        if (icon && c.icon) icon.textContent = c.icon;
        if (title && c.title) title.textContent = c.title;
        if (desc && c.description) desc.textContent = c.description;
        if (list && c.features) {
          list.innerHTML = c.features.map(f => `<li>${f}</li>`).join('');
        }
      });
    }

    // Projects
    if (grouped.projects) {
      const cards = document.querySelectorAll('.project-card');
      grouped.projects.forEach((proj, i) => {
        if (!cards[i]) return;
        const c = proj.content;
        const tag = cards[i].querySelector('.project-tag');
        const title = cards[i].querySelector('.project-title');
        const desc = cards[i].querySelector('.project-desc');
        const stack = cards[i].querySelector('.project-stack');
        const icon = cards[i].querySelector('.project-icon');
        if (tag && c.tag) tag.textContent = c.tag;
        if (title && c.title) title.textContent = c.title;
        if (desc && c.description) desc.textContent = c.description;
        if (icon && c.icon) icon.textContent = c.icon;
        if (stack && c.tech) {
          stack.innerHTML = c.tech.map(t => `<span>${t}</span>`).join('');
        }
      });
    }

    // About
    if (grouped.about) {
      grouped.about.forEach(item => {
        const c = item.content;
        if (item.item_key === 'mission') {
          const el = document.querySelector('.about-mission p');
          if (el && c.text) el.textContent = c.text;
        }
        if (item.item_key === 'team_stats' && c.items) {
          const stats = document.querySelectorAll('.team-stat');
          c.items.forEach((s, i) => {
            if (!stats[i]) return;
            const val = stats[i].querySelector('.team-stat-value');
            const lab = stats[i].querySelector('.team-stat-label');
            if (val && s.value) val.textContent = s.value;
            if (lab && s.label) lab.textContent = s.label;
          });
        }
      });
    }

    // Footer
    if (grouped.footer) {
      const f = grouped.footer[0].content;
      const brand = document.querySelector('.footer-brand .nav-logo-text');
      if (brand && f.brand) brand.innerHTML = f.brand.replace(/(Studio)/i, '<span class="text-accent">$1</span>');
      const desc = document.querySelector('.footer-desc');
      if (desc && f.description) desc.textContent = f.description;
      const copy = document.querySelector('.footer-bottom p');
      if (copy && f.copyright) copy.innerHTML = f.copyright.replace(/(WebMerge Studio)/i, '<strong>$1</strong>');
      if (f.social) {
        const links = document.querySelectorAll('.footer-social .social-link');
        Object.entries(f.social).forEach(([platform, url], i) => {
          if (links[i] && url) links[i].href = url;
        });
      }
    }

    // Chatbot
    if (grouped.chatbot) {
      const ch = grouped.chatbot[0].content;
      const header = document.querySelector('.chatbot-header span');
      if (header && ch.name) header.textContent = ch.name;
      const welcome = document.querySelector('.chatbot-msg--bot');
      if (welcome && ch.greeting) welcome.textContent = ch.greeting;
      const toggle = document.querySelector('.chatbot-toggle');
      if (toggle && ch.logo) {
        toggle.innerHTML = `<img src="${ch.logo}" style="width:28px;height:28px;border-radius:50%">`;
      }
      if (ch.theme) {
        const w = document.querySelector('.chatbot-window');
        if (w && ch.theme.primary) w.style.setProperty('--chat-primary', ch.theme.primary);
        if (w && ch.theme.secondary) w.style.setProperty('--chat-secondary', ch.theme.secondary);
        if (w && ch.theme.bg) w.style.setProperty('--chat-bg', ch.theme.bg);
        if (w && ch.theme.text) w.style.setProperty('--chat-text', ch.theme.text);
      }
    }
  } catch (err) {
    console.warn('Page content loader:', err.message);
  }
}
