/* ============================================================
   WebMerge Studio — Animations (GSAP + AOS)
   Inspirado en: animation_web_skill, web_animation_skill,
                 web_cursor (hero grid)
   ============================================================ */

const Animations = {
  initAOS() {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80
    });
  },

  initHeroGrid() {
    const grid = document.getElementById('heroGrid');
    if (!grid) return;
    for (let i = 0; i < 36; i++) {
      const cell = document.createElement('div');
      cell.className = 'hero-grid-cell';
      grid.appendChild(cell);
    }
    const cells = grid.querySelectorAll('.hero-grid-cell');
    setInterval(() => {
      const idx = Math.floor(Math.random() * cells.length);
      cells[idx].classList.add('active');
      setTimeout(() => cells[idx].classList.remove('active'), 3000);
    }, 500);
  },

  initHeroGSAP() {
    gsap.from('.hero-title', { y: 60, opacity: 0, duration: 1, delay: 0.3, ease: 'power3.out' });
    gsap.from('.hero-desc', { y: 40, opacity: 0, duration: 0.8, delay: 0.5, ease: 'power3.out' });
    gsap.from('.hero-actions a', { y: 30, opacity: 0, duration: 0.6, delay: 0.7, stagger: 0.15, ease: 'power3.out' });
    gsap.from('.hero-scroll', { y: 20, opacity: 0, duration: 0.6, delay: 1.2, ease: 'power3.out' });
  },

  initScrollTrigger() {
    gsap.utils.toArray('.service-card, .project-card, .kb-card').forEach((card, i) => {
      ScrollTrigger.create({
        trigger: card,
        start: 'top 85%',
        onEnter: () => {
          gsap.to(card, { y: 0, opacity: 1, duration: 0.6, delay: i * 0.1, ease: 'power3.out', overwrite: 'auto' });
        }
      });
      gsap.set(card, { y: 40, opacity: 0 });
    });
  },

  initStatsCounter() {
    const animate = (el) => {
      const target = parseFloat(el.dataset.target);
      const duration = 2000;
      const start = performance.now();
      const update = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = (target * eased).toFixed(target % 1 === 0 ? 0 : 1);
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.counter').forEach(animate);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    const section = document.querySelector('.stats');
    if (section) observer.observe(section);
  }
};
