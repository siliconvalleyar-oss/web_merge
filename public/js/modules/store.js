/* ============================================================
   WebMerge Studio — State Management (pub/sub pattern)
   Inspirado en: web_rive (store.js), reedit/website-reddit (tRPC)
   ============================================================ */

const Store = {
  state: {
    faqs: [],
    filteredFaqs: [],
    faqCategory: 'todas',
    faqSearch: '',
    chatbotOpen: false,
    config: {}
  },

  listeners: {},

  get(key) {
    return this.state[key];
  },

  set(key, value) {
    this.state[key] = value;
    this._notify(key, value);
  },

  on(key, callback) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(callback);
    return () => {
      this.listeners[key] = this.listeners[key].filter(fn => fn !== callback);
    };
  },

  _notify(key, value) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(fn => fn(value));
    }
  },

  async loadConfig() {
    try {
      const res = await fetch('/api/config?_=' + Date.now());
      const config = await res.json();
      this.state.config = config;
      this._notify('config', config);
      KnowledgeBase.fetchFAQs();
    } catch {
      // fallback to static CSS variables
    }
  }
};
