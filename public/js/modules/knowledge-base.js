/* ============================================================
   WebMerge Studio — Knowledge Base Module (via API)
   Inspirado en: rag (retrieval, search), reedit (data-driven)
   ============================================================ */

const KnowledgeBase = {
  init() {
    Store.on('filteredFaqs', faqs => this.render(faqs));
    this.fetchFAQs().then(() => this.setupFilters());
    this.setupSearch();
  },

  async fetchFAQs() {
    const cat = Store.get('faqCategory') || 'todas';
    const search = Store.get('faqSearch') || '';
    const params = new URLSearchParams();
    if (cat && cat !== 'todas') params.set('category', cat);
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/faqs?${params}`);
      const faqs = await res.json();
      Store.set('faqs', faqs);
      Store.set('filteredFaqs', faqs);
    } catch {
      document.getElementById('kbList').innerHTML =
        '<div class="kb-empty">Error al cargar la base de conocimiento.</div>';
    }
  },

  setupFilters() {
    const container = document.getElementById('kbFilters');
    if (!container) return;
    const categories = [
      { value: 'todas', label: 'Todas' },
      { value: 'general', label: 'General' },
      { value: 'tecnico', label: 'Técnico' },
      { value: 'proceso', label: 'Proceso' },
      { value: 'soporte', label: 'Soporte' }
    ];
    container.innerHTML = categories.map(c =>
      `<button class="kb-filter ${c.value === 'todas' ? 'active' : ''}" data-cat="${c.value}">${c.label}</button>`
    ).join('');
    container.addEventListener('click', e => {
      const btn = e.target.closest('.kb-filter');
      if (!btn) return;
      container.querySelectorAll('.kb-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Store.set('faqCategory', btn.dataset.cat);
      this.fetchFAQs();
    });
  },

  setupSearch() {
    const input = document.getElementById('kbSearch');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        Store.set('faqSearch', input.value);
        this.fetchFAQs();
      }, 300);
    });
  },

  render(faqs) {
    const container = document.getElementById('kbList');
    if (!container) return;
    if (!faqs || faqs.length === 0) {
      container.innerHTML = '<div class="kb-empty">No se encontraron resultados.</div>';
      return;
    }
    container.innerHTML = faqs.map(f =>
      `<article class="faq-item" data-aos="fade-up">
        <button class="faq-question" aria-expanded="false">
          <span>${f.question}</span>
          <span class="faq-arrow">↓</span>
        </button>
        <div class="faq-answer">
          <p>${f.answer}</p>
        </div>
      </article>`
    ).join('');
    container.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', !expanded);
        btn.classList.toggle('open');
        const answer = btn.nextElementSibling;
        answer.style.maxHeight = expanded ? '0' : answer.scrollHeight + 'px';
        answer.style.opacity = expanded ? '0' : '1';
      });
    });
    if (window.AOS) AOS.refresh();
  }
};
