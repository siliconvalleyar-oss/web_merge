# Estructura del Proyecto

```
web_merge_final/
├── server.js                 # Servidor Express (monta estáticos + API)
├── package.json              # Dependencias (solo express)
├── node_modules/
├── .gitignore
│
├── public/                   # Frontend (servido estáticamente)
│   ├── index.html            # SPA principal: hero, stats, servicios,
│   │                         # proyectos, nosotros, contacto, footer
│   ├── css/
│   │   └── styles.css        # Design tokens + todos los estilos
│   ├── js/
│   │   └── main.js           # Lógica JS: animaciones, chatbot,
│   │                         # formulario, toasts, cursor, ripple
│   └── img/                  # Imágenes
│
├── docs/                     # Documentación
│   ├── index.md              # Índice
│   ├── instalacion.md        # Instalación
│   ├── estructura.md         # Esta página
│   ├── desarrollo.md         # Técnicas y patrones
│   ├── api.md                # API endpoints
│   └── CHANGELOG.md          # Historial de versiones
│
└── .opencode/
```

## Descripción de Archivos

### `server.js`
Servidor Express minimalista. Sirve archivos estáticos desde `public/` y redirige todas las rutas a `index.html` (SPA fallback). Incluye endpoint `/api/status` para health check.

### `public/index.html`
Única página de la aplicación. Contiene 7 secciones:
- **Hero** — Título con gradient text, grid animado de fondo, CTA buttons
- **Stats** — 4 métricas con contadores animados al hacer scroll
- **Servicios** — Grid de 4 tarjetas con features
- **Proyectos** — Grid de 4 tarjetas de portfolio
- **Nosotros** — Misión, valores, equipo
- **Contacto** — Formulario con validación + info de contacto
- **Footer** — Marca, descripción, redes sociales

### `public/css/styles.css`
Sistema de diseño completo con:
- Design tokens (colores, tipografía fluida, espaciado, sombras, radios, z-index)
- Reset moderno con `prefers-reduced-motion` y `focus-visible`
- Clases utilitarias (`.gradient-text`, `.section-label`, `.sr-only`)
- Glassmorphism mediante `backdrop-filter: blur()`
- Tema claro/oscuro automático según preferencia del sistema
- 3 breakpoints responsive (1024px, 768px, 480px)

### `public/js/main.js`
Lógica frontend que incluye:
- Custom cursor con efecto hover
- AOS init para animaciones al hacer scroll
- Hero grid con celdas pulsantes aleatorias
- GSAP hero entrance (stagger title, desc, buttons)
- ScrollTrigger para revelar cards al scrollear
- Navbar con cambio de estilo al scrollear + active link tracking
- Menú mobile toggle
- Smooth scroll para anchors
- Contadores animados con IntersectionObserver
- Ripple effect en botones
- Toast notifications (success, error, info)
- Validación de formulario de contacto
- Chatbot con keyword matching y respuestas automáticas
- Back to top button
