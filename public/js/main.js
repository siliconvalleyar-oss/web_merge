/* ============================================================
   WebMerge Studio — Main JavaScript
   Inspirado en: electronica_store, web_rive, animation_web_skill,
                 tienda_web_server, web_cursor
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Custom Cursor ────────────────────────────────────── */
  const cursor = document.getElementById('cursor');
  if (cursor) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
    document.querySelectorAll('a, button, input, textarea, .service-card, .project-card, .stat-card').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });
  }

  /* ── AOS Init ─────────────────────────────────────────── */
  AOS.init({
    duration: 600,
    easing: 'ease-out-cubic',
    once: true,
    offset: 80
  });

  /* ── Hero Grid Animation ──────────────────────────────── */
  const heroGrid = document.getElementById('heroGrid');
  if (heroGrid) {
    for (let i = 0; i < 36; i++) {
      const cell = document.createElement('div');
      cell.className = 'hero-grid-cell';
      heroGrid.appendChild(cell);
    }
    const cells = heroGrid.querySelectorAll('.hero-grid-cell');
    setInterval(() => {
      const idx = Math.floor(Math.random() * cells.length);
      cells[idx].classList.add('active');
      setTimeout(() => cells[idx].classList.remove('active'), 3000);
    }, 500);
  }

  /* ── GSAP Hero ────────────────────────────────────────── */
  gsap.from('.hero-title', { y: 60, opacity: 0, duration: 1, delay: 0.3, ease: 'power3.out' });
  gsap.from('.hero-desc', { y: 40, opacity: 0, duration: 0.8, delay: 0.5, ease: 'power3.out' });
  gsap.from('.hero-actions a', {
    y: 30, opacity: 0, duration: 0.6, delay: 0.7,
    stagger: 0.15, ease: 'power3.out'
  });
  gsap.from('.hero-scroll', { y: 20, opacity: 0, duration: 0.6, delay: 1.2, ease: 'power3.out' });

  /* ── ScrollTrigger: Cards ───────────────────────────────── */
  gsap.utils.toArray('.service-card, .project-card').forEach((card, i) => {
    ScrollTrigger.create({
      trigger: card,
      start: 'top 85%',
      onEnter: () => {
        gsap.to(card, {
          y: 0, opacity: 1, duration: 0.6,
          delay: i * 0.1, ease: 'power3.out',
          overwrite: 'auto'
        });
      }
    });
    gsap.set(card, { y: 40, opacity: 0 });
  });

  /* ── Navbar Scroll ────────────────────────────────────── */
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    navbar.classList.toggle('scrolled', scrollY > 60);

    const backToTop = document.getElementById('backToTop');
    if (backToTop) backToTop.classList.toggle('visible', scrollY > 400);

    /* Active nav link */
    document.querySelectorAll('.nav-link').forEach(link => {
      const section = document.querySelector(link.getAttribute('href'));
      if (section) {
        const rect = section.getBoundingClientRect();
        link.classList.toggle('active', rect.top <= 150 && rect.bottom >= 150);
      }
    });

    lastScroll = scrollY;
  });

  /* ── Mobile Menu ──────────────────────────────────────── */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  /* ── Smooth Scroll ────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ── Stats Counter ────────────────────────────────────── */
  const counters = document.querySelectorAll('.counter');
  const animateCounter = (el) => {
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

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.counter').forEach(animateCounter);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.stats');
  if (statsSection) statsObserver.observe(statsSection);

  /* ── Ripple Effect ────────────────────────────────────── */
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

  /* ── Toast Notifications ──────────────────────────────── */
  const toastContainer = document.getElementById('toastContainer');
  window.showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icons = { success: '✓', error: '✕', info: '●' };
    toast.innerHTML = `<span>${icons[type] || '●'}</span> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  /* ── Contact Form ─────────────────────────────────────── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      const fields = contactForm.querySelectorAll('.form-input');
      fields.forEach(field => {
        field.classList.remove('error');
        if (!field.value.trim() || (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value))) {
          field.classList.add('error');
          valid = false;
        }
      });
      if (!valid) {
        window.showToast('Corrige los campos marcados', 'error');
        return;
      }
      const success = document.getElementById('contactSuccess');
      if (success) {
        success.classList.add('show');
        contactForm.reset();
        window.showToast('Mensaje enviado con éxito', 'success');
      }
    });

    contactForm.querySelectorAll('.form-input').forEach(field => {
      field.addEventListener('input', () => field.classList.remove('error'));
    });
  }

  /* ── Chatbot ──────────────────────────────────────────── */
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotWindow = document.getElementById('chatbotWindow');
  const chatbotClose = document.getElementById('chatbotClose');
  const chatbotSend = document.getElementById('chatbotSend');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotBody = document.getElementById('chatbotBody');

  const chatbotResponses = {
    hola: '¡Hola! Bienvenido a WebMerge Studio. ¿En qué podemos ayudarte?',
    precio: 'Nuestros proyectos parten desde $500 USD. El precio final depende del alcance y requerimientos.',
    servicio: 'Ofrecemos diseño UI/UX, desarrollo frontend, backend y consultoría tecnológica.',
    contacto: 'Puedes escribirnos al formulario de contacto o enviarnos un email a hola@webmerge.studio',
    horario: 'Atendemos de lunes a viernes de 9:00 a 18:00 (GMT-3).',
    proyecto: 'Cuéntanos sobre tu proyecto y te enviaremos una propuesta personalizada sin compromiso.',
    default: 'Gracias por tu mensaje. Un miembro de nuestro equipo te responderá a la brevedad.'
  };

  const addChatMessage = (text, type) => {
    const msg = document.createElement('div');
    msg.className = `chatbot-msg chatbot-msg--${type}`;
    msg.textContent = text;
    chatbotBody.appendChild(msg);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
  };

  const getBotResponse = (input) => {
    const lower = input.toLowerCase();
    if (lower.includes('hola') || lower.includes('buen')) return chatbotResponses.hola;
    if (lower.includes('precio') || lower.includes('cuest') || lower.includes('tarifa')) return chatbotResponses.precio;
    if (lower.includes('servicio') || lower.includes('hacen')) return chatbotResponses.servicio;
    if (lower.includes('contacto') || lower.includes('email') || lower.includes('correo')) return chatbotResponses.contacto;
    if (lower.includes('horario') || lower.includes('hora')) return chatbotResponses.horario;
    if (lower.includes('proyecto') || lower.includes('idea') || lower.includes('trabajo')) return chatbotResponses.proyecto;
    return chatbotResponses.default;
  };

  if (chatbotToggle && chatbotWindow) {
    chatbotToggle.addEventListener('click', () => chatbotWindow.classList.toggle('open'));
    if (chatbotClose) chatbotClose.addEventListener('click', () => chatbotWindow.classList.remove('open'));

    const sendMessage = () => {
      const text = chatbotInput.value.trim();
      if (!text) return;
      addChatMessage(text, 'user');
      chatbotInput.value = '';
      setTimeout(() => addChatMessage(getBotResponse(text), 'bot'), 500);
    };

    if (chatbotSend) chatbotSend.addEventListener('click', sendMessage);
    if (chatbotInput) {
      chatbotInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    }
  }

  /* ── Back to Top ──────────────────────────────────────── */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Welcome Toast ────────────────────────────────────── */
  setTimeout(() => {
    window.showToast('Bienvenido a WebMerge Studio', 'info');
  }, 1500);
});
