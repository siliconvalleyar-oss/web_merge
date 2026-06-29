# Desarrollo

## Técnicas de Animación

El proyecto integra 5 capas de animación, cada una aprendida de un proyecto distinto:

### 1. CSS Puras — de `tienda_web_server`

| Técnica | Uso |
|---------|-----|
| `backdrop-filter: blur(20px)` | Navbar glassmorphism al hacer scroll |
| `radial-gradient` | Fondo con glow ambiental |
| `transition` | Hover effects en cards, botones, links |
| `@keyframes` | `rippleAnim`, `gridPulse`, `bounce`, `toastIn`/`toastOut` |
| `transform: translateY()` | Hover lift en cards y botones |

### 2. GSAP + ScrollTrigger — de `animation_web_skill`

```js
// Hero entrance con stagger
gsap.from('.hero-title', { y: 60, opacity: 0, duration: 1, delay: 0.3 });
gsap.from('.hero-desc', { y: 40, opacity: 0, duration: 0.8, delay: 0.5 });
gsap.from('.hero-actions a', {
  y: 30, opacity: 0, duration: 0.6, delay: 0.7, stagger: 0.15
});

// ScrollTrigger para revelar cards
gsap.utils.toArray('.service-card, .project-card').forEach((card, i) => {
  ScrollTrigger.create({
    trigger: card, start: 'top 85%',
    onEnter: () => gsap.to(card, { y: 0, opacity: 1, duration: 0.6, delay: i * 0.1 })
  });
  gsap.set(card, { y: 40, opacity: 0 });
});
```

### 3. AOS (Animate On Scroll) — de `animation_web_skill`

Atributo `data-aos` en HTML para animaciones declarativas:

```html
<div data-aos="fade-up" data-aos-delay="100">
```

Configuración:
- Duración: 600ms
- Easing: ease-out-cubic
- Once: true (solo una vez)
- Offset: 80px

### 4. Ripple Effect — de `animation_web_skill`

```js
btn.addEventListener('click', function (e) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  this.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
});
```

```css
.ripple {
  position: absolute; border-radius: 50%;
  background: rgba(255,255,255,0.3);
  transform: scale(0); animation: rippleAnim 0.6s ease-out;
}
@keyframes rippleAnim { to { transform: scale(4); opacity: 0; } }
```

### 5. Custom Cursor — de `animation_web_skill`

Cursor circular que sigue al mouse con `mix-blend-mode: difference`. Se agranda al hover sobre elementos interactivos.

## Design Tokens — de `web_cursor`

Sistema centralizado con CSS custom properties en `:root`:

```css
:root {
  --color-primary: #6c5ce7;
  --color-accent: #00cec9;
  --text-4xl: clamp(2.5rem, 1.8rem + 2.5vw, 3.75rem);
  --space-8: 2rem;
  --shadow-glow: 0 0 30px rgba(108, 92, 231, 0.3);
  --radius-lg: 16px;
  --transition-base: 250ms ease;
}
```

Tipografía fluida con `clamp()`:
- `--text-xs`: `clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)`
- `--text-5xl`: `clamp(3rem, 2rem + 3.5vw, 5rem)`

## Dark / Light Theme

El tema se adapta automáticamente según `prefers-color-scheme`. En modo claro se invierten los valores de fondo, texto y sombras.

## Patrones JavaScript

### Toast Notifications

```js
window.showToast('Mensaje', 'success');
// Tipos: success, error, info
```

### Chatbot

Sistema de keyword matching con respuestas predefinidas:

```js
const chatbotResponses = {
  hola: '¡Hola! Bienvenido a WebMerge Studio.',
  precio: 'Nuestros proyectos parten desde $500 USD.',
  default: 'Gracias por tu mensaje. Te responderemos pronto.'
};
```

### Contadores Animados

Usa `IntersectionObserver` + `requestAnimationFrame` con easing cúbico:

```js
const eased = 1 - Math.pow(1 - progress, 3);
```

### Smooth Scroll

```js
anchor.addEventListener('click', (e) => {
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
```

## Patrón State Management (pub/sub) — de `web_rive`

```js
const Store = {
  state: { faqs: [], filteredFaqs: [], faqCategory: 'todas', faqSearch: '' },
  listeners: {},
  get(key) { return this.state[key]; },
  set(key, value) {
    this.state[key] = value;
    this._notify(key, value);
  },
  on(key, callback) {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(callback);
    return () => { /* unsubscribe */ };
  },
  _notify(key, value) {
    if (this.listeners[key]) this.listeners[key].forEach(fn => fn(value));
  }
};
```

## Arquitectura Full-Stack — v4.0.0

```
web_merge_final/
├── server.js              # Express + API routes + WhatsApp init
├── config/config.js       # JWT secret, port
├── database/db.js         # SQLite connection (better-sqlite3)
├── services/
│   ├── rag.js             # RAG engine (TF-IDF scoring)
│   └── whatsapp.js        # WhatsApp bot (whatsapp-web.js)
├── routes/
│   ├── faqs.js            # GET /api/faqs, /api/faqs/categories
│   ├── config.js          # GET/PUT /api/config
│   ├── contact.js         # POST /api/contact
│   ├── chat.js            # POST /api/chat (RAG)
│   └── admin.js           # Admin CRUD + login + WhatsApp status
├── sql/schema.sql         # Database schema (SQLite)
├── setup-db.js            # Initialize database with defaults
├── data/
│   ├── webmerge.db        # SQLite database file
│   └── knowledge-base.json# Legacy static data
└── public/
    ├── index.html         # SPA principal
    ├── admin/
    │   ├── index.html     # Panel de administración
    │   ├── css/admin.css
    │   └── js/admin.js
    ├── css/styles.css
    └── js/modules/
        ├── store.js
        ├── ui.js
        ├── animations.js
        ├── chatbot.js
        ├── knowledge-base.js
        └── main.js
```

## Base de Datos (SQLite)

5 tablas con `better-sqlite3`:

| Tabla | Propósito | Campos clave |
|-------|-----------|--------------|
| `config` | Configuración dinámica (colores, site_name) | `config_key`, `config_value` |
| `faqs` | Base de conocimiento del chatbot | `category`, `question`, `answer`, `keywords`, `enabled` |
| `contacts` | Mensajes del formulario de contacto | `name`, `email`, `message`, `is_read` |
| `whatsapp_messages` | Historial de chat de WhatsApp | `number`, `message`, `response` |
| `users` | Usuarios del panel admin | `username`, `password_hash`, `role` |

Inicialización: `node setup-db.js`

## API REST — Endpoints

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/faqs` | GET | No | FAQs públicas con filtro por `?category=` y `?search=` |
| `/api/faqs/categories` | GET | No | Lista de categorías |
| `/api/config` | GET | No | Configuración pública (colores, nombres) |
| `/api/config` | PUT | No | Actualizar configuración (admin) |
| `/api/contact` | POST | No | Enviar mensaje de contacto |
| `/api/chat` | POST | No | Consulta RAG al chatbot |
| `/api/admin/login` | POST | No | Autenticación JWT |
| `/api/admin/verify` | GET | JWT | Verificar token |
| `/api/admin/config` | GET | JWT | Obtener configuración |
| `/api/admin/faqs` | GET/POST | JWT | CRUD FAQs |
| `/api/admin/faqs/:id` | PUT/DELETE | JWT | Editar/eliminar FAQ |
| `/api/admin/contacts` | GET | JWT | Ver mensajes |
| `/api/admin/contacts/:id/read` | PUT | JWT | Marcar como leído |
| `/api/admin/whatsapp-status` | GET | JWT | Estado de WhatsApp |
| `/api/admin/whatsapp-messages` | GET | JWT | Mensajes de WhatsApp |

## Motor RAG (Retrieval Augmented Generation) — de `rag`

El chatbot usa scoring TF-IDF para encontrar la FAQ más relevante:

```
score = question_coincidencia × 0.5 + answer_coincidencia × 0.3 + keywords_coincidencia × 0.2
```

Tokenización: minúsculas, elimina signos, divide por espacios, filtra tokens < 2 caracteres.

```js
function score(sentence, queryTokens) {
  const tokens = tokenize(sentence);
  let matchCount = 0;
  for (const qt of queryTokens) {
    for (const t of tokens) {
      if (t.includes(qt) || qt.includes(t)) { matchCount++; break; }
    }
  }
  return matchCount / queryTokens.length;
}
```

## WhatsApp Bot — integración con `whatsapp-web.js`

El bot de WhatsApp comparte el mismo motor RAG que el chatbot web:

```
Usuario WhatsApp → mensaje → RAG engine → FAQ matching → respuesta automática
                          → INSERT en whatsapp_messages (historial)
```

- Se autentica via código QR escaneado desde el teléfono
- Estado visible en `/admin` (conectado/desconectado/QR listo)
- Ignora mensajes de grupos
- Almacena todo el historial de conversaciones

## Panel de Administración (`/admin`)

- Login con JWT (token en localStorage)
- Gestión CRUD de FAQs (crear, editar, eliminar)
- Editor de paleta de colores en tiempo real (color pickers)
- Visualización de mensajes de contacto recibidos
- Estado y mensajes del bot de WhatsApp

Usuario por defecto: `admin` / `admin123`

## Arquitectura Modular (ES Modules) — de `web_rive` + `reedit`

El JS se divide en módulos con responsabilidades únicas:

| Módulo | Responsabilidad |
|--------|----------------|
| `store.js` | State management (pub/sub) |
| `ui.js` | Cursor, ripple, navbar, contact form, toasts |
| `animations.js` | GSAP, AOS, hero grid, scrollTrigger, counters |
| `chatbot.js` | Chatbot con knowledge base + integración FAQs |
| `knowledge-base.js` | Base de conocimiento, búsqueda, filtros, acordeón |
| `main.js` | Orquestador: inicializa todos los módulos |

## Base de Conocimiento (Retrieval Pattern) — de `rag`

Sistema de recuperación de información con búsqueda y filtros:

```js
// data/knowledge-base.json — 12 preguntas con categorías
// Filtrado por categoría + búsqueda full-text
Store.filterFAQs = () => {
  let result = [...Store.state.faqs];
  if (category !== 'todas') result = result.filter(f => f.category === category);
  if (search) {
    const q = search.toLowerCase();
    result = result.filter(f =>
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q)
    );
  }
};
```

## Arquitectura Data-Driven — de `reedit` + `website-reddit`

Los datos se separan del código en archivos JSON:

```
data/
└── knowledge-base.json    # FAQs con categorías
```

El servidor Express sirve `/data` como ruta estática para que el frontend cargue los datos via `fetch()`.

## Responsive Design

| Breakpoint | Cambios |
|------------|---------|
| 1024px | Services/Projects: 4 col → 2 col |
| 768px | Stats: 4 col → 2 col, menú hamburguesa, cursor desactivado |
| 480px | Stats: 1 col, hero title reducido, chatbot full width |

## Accesibilidad

- `prefers-reduced-motion`: desactiva todas las animaciones
- `focus-visible`: outline accesible para navegación por teclado
- `.sr-only`: clase para lectores de pantalla
- `aria-label` en botones sin texto
- Contraste de color suficiente en ambos temas
