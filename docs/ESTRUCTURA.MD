# Estructura del Proyecto — v4.0.0

```
web_merge_final/
├── server.js                 # Express + SQLite + API REST + WhatsApp init
├── package.json              # Dependencias full-stack
├── setup-db.js               # Inicializa la base de datos SQLite
├── node_modules/
├── .gitignore
│
├── config/
│   └── config.js             # JWT secret, PORT
│
├── database/
│   └── db.js                 # Conexión SQLite (better-sqlite3)
│
├── services/
│   ├── rag.js                # Motor RAG (TF-IDF scoring)
│   └── whatsapp.js           # WhatsApp bot (whatsapp-web.js + puppeteer)
│
├── routes/
│   ├── faqs.js               # GET /api/faqs (público)
│   ├── config.js             # GET/PUT /api/config
│   ├── contact.js            # POST /api/contact
│   ├── chat.js               # POST /api/chat (RAG)
│   └── admin.js              # CRUD admin + login JWT
│
├── sql/
│   └── schema.sql            # Esquema SQLite
│
├── data/
│   └── webmerge.db           # Base de datos SQLite
│
├── public/                   # Frontend
│   ├── index.html            # SPA con 8 secciones + chatbot + cursor
│   ├── admin/
│   │   ├── index.html        # Panel de administración
│   │   ├── css/admin.css     # Estilos del admin
│   │   └── js/admin.js       # Admin CRUD + login + WhatsApp status
│   ├── css/
│   │   └── styles.css        # Design system + todos los estilos
│   └── js/
│       ├── modules/
│       │   ├── store.js      # State management (pub/sub)
│       │   ├── ui.js         # Cursor, ripple, navbar, contact form, toasts
│       │   ├── animations.js # GSAP, AOS, hero grid, scrollTrigger, counters
│       │   ├── chatbot.js    # Chatbot client (consume /api/chat)
│       │   └── knowledge-base.js # Base de conocimiento (consume /api/faqs)
│       └── main.js           # Orquestador de módulos
│
├── docs/                     # Documentación
│   ├── INDEX.MD              # Índice con fuentes de inspiración
│   ├── INSTALACION.MD        # Guía de instalación
│   ├── ESTRUCTURA.MD         # Esta página
│   ├── DESARROLLO.MD         # Técnicas y patrones avanzados
│   ├── API.MD                # Documentación de la API REST
│   └── CHANGELOG.MD          # Historial de versiones
│
├── VERSION                   # Versión actual: 4.0.0
└── RULES.MD                  # Reglas de oro del proyecto
```

## Descripción de Archivos Clave

### `server.js`
Servidor Express con todas las capas:
- Sirve estáticos desde `public/`
- API endpoints montados bajo `/api/`
- Inicializa WhatsApp bot al arrancar
- SPA fallback para todas las rutas no-API

### Base de Datos (`data/webmerge.db`)
SQLite con 5 tablas: `config`, `faqs`, `contacts`, `whatsapp_messages`, `users`.

### `services/rag.js`
Motor de Retrieval Augmented Generation. Calcula relevancia entre consulta y FAQs usando scoring TF-IDF basado en coincidencia de tokens.

### `services/whatsapp.js`
Cliente de WhatsApp que responde automáticamente usando el motor RAG. Se autentica via QR, ignora grupos, almacena historial.

### `public/index.html`
SPA con 8 secciones: Hero, Stats, Servicios, Proyectos, FAQ (Knowledge Base), Nosotros, Contacto, Footer + chatbot + cursor + back-to-top.

### `public/js/modules/`
5 módulos ES + 1 orquestador, todos conectados a la API REST:
- **store.js** — State management pub/sub, carga configuración desde API
- **ui.js** — Interfaz: cursor, ripple, navbar, menú mobile, contacto via API, toasts
- **animations.js** — GSAP, ScrollTrigger, AOS, contadores animados
- **chatbot.js** — Envía consultas a `/api/chat` (RAG server-side)
- **knowledge-base.js** — Obtiene FAQs desde `/api/faqs`, filtros y búsqueda
- **main.js** — Inicializa todo en `DOMContentLoaded`

### `public/admin/`
Panel de administración completo:
- Login con JWT (guarda token en localStorage)
- CRUD de FAQs (crear, editar, eliminar, activar/desactivar)
- Editor de configuración (colores, nombre del sitio, chatbot)
- Visualización de mensajes de contacto (marcar como leído)
- Estado del bot de WhatsApp + historial de mensajes
