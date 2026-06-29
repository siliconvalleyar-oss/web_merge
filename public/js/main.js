/* ============================================================
   WebMerge Studio — Main Orchestrator
   Inspirado en: web_rive (ES modules), reedit/website-reddit
                 (clean architecture), electronica_store (SPA flow)
   ============================================================ */

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

  setTimeout(() => UI.showToast('Bienvenido a WebMerge Studio v4', 'info'), 1500);
});
