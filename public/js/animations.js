document.addEventListener('DOMContentLoaded', () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60
    });
    console.log('[Animations] AOS inicializado');
  }

  if (typeof gsap !== 'undefined') {
    gsap.from('.hero-title', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.2 });
    gsap.from('.hero-desc', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.4 });
    gsap.from('.hero-actions', { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.6 });
    gsap.from('.hero-visual', { scale: 0.9, opacity: 0, duration: 1.2, ease: 'power2.out', delay: 0.1 });

    document.querySelectorAll('.product-card').forEach((card, i) => {
      gsap.from(card, {
        y: 40, opacity: 0, duration: 0.5, ease: 'power2.out',
        delay: 0.1 + i * 0.05,
        scrollTrigger: { trigger: card, start: 'top bottom-=80' }
      });
    });

    document.querySelectorAll('.nav-link, .btn').forEach(el => {
      el.addEventListener('mouseenter', function() {
        if (!this.disabled) gsap.to(this, { scale: 1.05, duration: 0.2 });
      });
      el.addEventListener('mouseleave', function() {
        gsap.to(this, { scale: 1, duration: 0.2 });
      });
    });

    console.log('[Animations] GSAP animaciones aplicadas');
  }

  if (typeof rive !== 'undefined') {
    initRiveHero();
  } else {
    mostrarFallbackHero();
  }
});

function mostrarFallbackHero() {
  const container = document.getElementById('heroRive');
  if (!container) return;
  const icons = ['🔌', '💻', '🪑'];
  let idx = 0;
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%">
      <div style="font-size:6rem;animation:bounce 2s infinite" id="heroIcon">${icons[0]}</div>
      <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:1rem">Tecnología de punta</p>
    </div>
    <style>
      @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
    </style>`;
  setInterval(() => {
    idx = (idx + 1) % icons.length;
    const el = document.getElementById('heroIcon');
    if (el) el.textContent = icons[idx];
  }, 3000);
}

function initRiveHero() {
  const container = document.getElementById('heroRive');
  if (!container) return;
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';
  container.appendChild(canvas);

  const anims = [
    '/assets/riv/electronics.riv',
    '/assets/riv/computer.riv',
    '/assets/riv/furniture.riv'
  ];

  let idx = 0, riveInstance = null;

  function loadRive(i) {
    if (riveInstance) { riveInstance.cleanup(); riveInstance = null; }
    const url = anims[i % anims.length];
    const req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';
    req.onload = function() {
      if (req.status === 200) {
        try {
          riveInstance = new rive.Rive({
            canvas,
            bytes: new Uint8Array(req.response),
            artboard: 'Artboard',
            animations: ['idle'],
            autoplay: true,
            fit: rive.Fit.Cover,
            alignment: rive.Alignment.Center,
            onLoad: () => riveInstance?.resizeDrawingSurfaceToCanvas()
          });
        } catch(e) {
          console.warn('[Rive] Error cargando animación:', e);
          if (idx === i) mostrarFallbackHero();
        }
      } else if (idx === i) {
        mostrarFallbackHero();
      }
    };
    req.onerror = () => { if (idx === i) mostrarFallbackHero(); };
    req.send();
  }

  loadRive(0);
  setInterval(() => { idx++; loadRive(idx); }, 6000);
}
