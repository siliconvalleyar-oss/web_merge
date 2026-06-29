/* ============================================================
   WebMerge Studio — Chatbot Module (RAG via API)
   Inspirado en: animation_web_skill, rag (retrieval), whatsapp
   ============================================================ */

const Chatbot = {
  elements: {},

  init() {
    this.elements = {
      toggle: document.getElementById('chatbotToggle'),
      window: document.getElementById('chatbotWindow'),
      close: document.getElementById('chatbotClose'),
      send: document.getElementById('chatbotSend'),
      input: document.getElementById('chatbotInput'),
      body: document.getElementById('chatbotBody')
    };
    if (!this.elements.toggle || !this.elements.window) return;
    this.elements.toggle.addEventListener('click', () => this.toggle());
    if (this.elements.close) this.elements.close.addEventListener('click', () => this.close());
    if (this.elements.send) this.elements.send.addEventListener('click', () => this.sendMessage());
    if (this.elements.input) {
      this.elements.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }
  },

  toggle() {
    this.elements.window.classList.toggle('open');
    Store.set('chatbotOpen', this.elements.window.classList.contains('open'));
  },

  close() {
    this.elements.window.classList.remove('open');
    Store.set('chatbotOpen', false);
  },

  addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `chatbot-msg chatbot-msg--${type}`;
    msg.textContent = text;
    this.elements.body.appendChild(msg);
    this.elements.body.scrollTop = this.elements.body.scrollHeight;
  },

  async sendMessage() {
    const text = this.elements.input.value.trim();
    if (!text) return;
    this.addMessage(text, 'user');
    this.elements.input.value = '';

    this.addMessage('Escribiendo...', 'bot');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const lastMsg = this.elements.body.lastChild;
      if (lastMsg && lastMsg.textContent === 'Escribiendo...') {
        lastMsg.remove();
      }
      if (data.found && data.answer) {
        this.addMessage(data.answer, 'bot');
      } else {
        this.addMessage('Gracias por tu mensaje. Un miembro de nuestro equipo te responderá a la brevedad.', 'bot');
      }
    } catch {
      const lastMsg = this.elements.body.lastChild;
      if (lastMsg && lastMsg.textContent === 'Escribiendo...') lastMsg.remove();
      this.addMessage('Hubo un error al procesar tu mensaje. Intenta de nuevo.', 'bot');
    }
  }
};
