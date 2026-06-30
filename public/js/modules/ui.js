/* ============================================================
   WebMerge Studio — UI Utilities
   Inspirado en: electronica_store, animation_web_skill,
                 tienda_web_server (toasts, ripple, cursor)
   ============================================================ */

const UI = {
  initCursor() {
    const cursor = document.getElementById('cursor');
    if (!cursor) return;
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
    document.querySelectorAll('a, button, input, textarea, .service-card, .project-card, .stat-card, .faq-item, .kb-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  },

  initRipple() {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        this.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icons = { success: '✓', error: '✕', info: '●', warn: '⚠' };
    toast.innerHTML = `<span>${icons[type] || '●'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;
      const fields = form.querySelectorAll('.form-input');
      fields.forEach(field => {
        field.classList.remove('error');
        if (!field.value.trim() || (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value))) {
          field.classList.add('error');
          valid = false;
        }
      });
      if (!valid) {
        UI.showToast('Corrige los campos marcados', 'error');
        return;
      }
      const data = { name: '', email: '', message: '' };
      fields.forEach(f => {
        if (f.name === 'name') data.name = f.value;
        if (f.name === 'email') data.email = f.value;
        if (f.name === 'message') data.message = f.value;
      });
      console.log('📤 Enviando formulario:', data);
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
          form.reset();
          UI.showToast('Mensaje enviado con éxito', 'success');
        } else {
          UI.showToast(result.error || 'Error al enviar', 'error');
        }
      } catch {
        UI.showToast('Error de conexión', 'error');
      }
    });
    form.querySelectorAll('.form-input').forEach(field => {
      field.addEventListener('input', () => field.classList.remove('error'));
    });
  },

  initNavbar() {
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      navbar.classList.toggle('scrolled', y > 60);
      if (backToTop) backToTop.classList.toggle('visible', y > 400);
      document.querySelectorAll('.nav-link').forEach(link => {
        const section = document.querySelector(link.getAttribute('href'));
        if (section) {
          const rect = section.getBoundingClientRect();
          link.classList.toggle('active', rect.top <= 150 && rect.bottom >= 150);
        }
      });
    });
    if (backToTop) {
      backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  },

  initMobileMenu() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => links.classList.remove('open'));
    });
  },

  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }
};
