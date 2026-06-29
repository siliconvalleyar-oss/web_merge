# Changelog

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
