# Changelog

## [4.0.0] — 2026-06-29

### Added
- Base de datos SQLite con 5 tablas (config, faqs, contacts, users, whatsapp_messages)
- API RESTful completa: /api/faqs, /api/config, /api/contact, /api/chat (RAG), /api/admin
- Motor RAG (Retrieval Augmented Generation) server-side con scoring TF-IDF
- Chatbot sincronizado con WhatsApp (whatsapp-web.js + puppeteer)
- Panel de administración en /admin con login JWT
- Gestión CRUD de FAQs desde el admin
- Editor de paleta de colores dinámica
- Visualización de mensajes de contacto
- Estado y mensajes del bot de WhatsApp
- Arquitectura full-stack con Express + SQLite

### Changed
- Store.js simplificado, datos servidos desde API en lugar de JSON estático
- Chatbot.js ahora consulta /api/chat con RAG server-side
- knowledge-base.js obtiene FAQs desde /api/faqs
- ui.js envía formulario de contacto a /api/contact
- Server.js ahora incluye MySQL pool y rutas API
- Base de datos migrada de JSON estático a SQLite

### Docs
- VERSION actualizado a 4.0.0
- SQL schema en sql/schema.sql
- Script de inicialización: node setup-db.js

## [3.0.0] — 2026-06-29

### Added
- Arquitectura modular con ES modules (inspirado en web_rive)
- State management con patrón pub/sub (Store)
- Base de conocimiento con búsqueda y filtros (inspirado en rag)
- FAQs con acordeón expandible
- Sistema de data-driven desde archivos JSON (inspirado en reedit)
- Chatbot con knowledge base ampliada + integración con FAQs

### Changed
- JS monolítico dividido en 5 módulos: store, ui, animations, chatbot, knowledge-base
- Servidor Express ahora sirve /data como ruta estática
- Cursor custom mejorado con más elementos interactivos
- Chatbot con 11 entradas de conocimiento (antes 6)

### Docs
- VERSION actualizado a 3.0.0
- DESARROLLO.MD actualizado con nuevas técnicas

## [2.0.0] — 2026-06-29

### Added
- Nueva implementación completa como landing page profesional
- Hero con gradient text y grid animado de fondo
- Stats section con contadores animados (IntersectionObserver + requestAnimationFrame)
- Services grid con 4 tarjetas y hover glow effect
- Projects grid mostrando los 4 proyectos fuente
- About section con misión, valores y equipo
- Contact form con validación y estado de éxito
- Glassmorphism navbar con active link tracking
- Custom cursor con efecto hover (mix-blend-mode: difference)
- GSAP hero entrance con stagger (title, desc, buttons)
- ScrollTrigger para revelar cards al hacer scroll
- AOS fade-up en todas las secciones
- Ripple effect en botones
- Toast notifications (success, error, info)
- Chatbot flotante con keyword matching
- Back-to-top button
- Mobile hamburger menu
- Design tokens con CSS custom properties
- Tipografía fluida con clamp()
- Tema claro/oscuro automático
- Reset accesible con prefers-reduced-motion
- Documentación completa en docs/

### Changed
- Servidor Express minimalista (solo express, sin middleware extra)
- Puerto por defecto: 8080

### Removed
- Rive animations (incompatible con el nuevo diseño)
- PHP backend
- MySQL database
- Admin panel
- Sistema de autenticación
- Carrito de compras
- JSON data files

## [1.1.0] — 2026-05-10

### Added
- Integración de secciones corporativas desde web_cursor
- Design tokens system
- Páginas Servicios, Nosotros, Contacto

## [1.0.0] — 2026-05-01

### Added
- Fusión inicial de tienda_web_server, web_animation_skill, web_rive, web_cursor
- Express server con API REST
- Tienda online con carrito y checkout
- Animaciones GSAP, Rive y AOS
- Admin panel con CRUD
- Chatbot con WhatsApp integration
