# Web Merge Final

Proyecto que unifica **cuatro** proyectos web en un solo proyecto funcional, tomando lo mejor de cada uno:

| Proyecto Original | Tipo | Técnicas Aportadas |
|---|---|---|
| **tienda_web_server** | Tienda C++ | Glassmorphism, dark theme, SPA routing, token auth, carrito server-side |
| **web_animation_skill** | Tienda Minimalista PHP | GSAP, AOS, chatbot WhatsApp, paleta dinámica, hero carrusel |
| **web_rive** | Tienda Rive PHP | Rive animations, admin CRUD completo, pedidos, configuración |
| **web_cursor** | Web ScaleWeb React | Design tokens, componentes modulares, páginas servicios/nosotros/contacto, gradientes, secciones stats |

## Stack

- **Backend:** Node.js + Express (API REST, 20+ endpoints)
- **Frontend:** HTML5 + CSS3 + Vanilla JS (SPA sin frameworks)
- **Animaciones:** GSAP 3.12 + ScrollTrigger + AOS 2.3 + Rive 2.0 Canvas
- **Diseño:** Glassmorphism, dark theme, responsive 3 breakpoints, design tokens CSS
- **Datos:** Archivos JSON (portable, sin BD)

## Instalación Rápida

```bash
npm install
npm start
```

Abrir http://localhost:8080

## Demo

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin | Administrador (acceso a /admin/) |
| cliente | cliente | Cliente de prueba |

## Funcionalidades

### Tienda
- Catálogo con búsqueda y filtros por categoría
- Carrito de compras con persistencia server-side
- Checkout con validación de stock y datos
- Perfil de usuario y sesión con token JWT-like

### Páginas Corporativas (de web_cursor)
- **Servicios:** Grid de servicios con feature lists y CTA
- **Nosotros:** Misión, valores, estadísticas del equipo
- **Contacto:** Formulario con validación y estado de éxito + info de contacto

### Animaciones
- Hero con animación Rive (vectorial) + fallback CSS
- Cards con GSAP ScrollTrigger al hacer scroll
- AOS fade-up en todos los elementos
- Hover effects con glassmorphism glow
- Toast notificaciones animadas
- Badge pulse en carrito
- Hero grid animation (pulsing cells)

### Sección Stats (de web_cursor)
- Métricas: Uptime 99.9%, <100ms respuesta, 10x más rápido, ∞ escalabilidad
- Grid responsive 4 columnas en desktop

### Chatbot
- Botón flotante con ventana de chat
- Base de conocimiento con respuestas automáticas
- Keywords: hola, precio, envío, horario, garantía

### Admin
- Dashboard con estadísticas (productos, pedidos, usuarios, stock bajo, ingresos)
- CRUD completo de productos
- Listado de pedidos y usuarios
- Configuración visual (colores primario, fondo, texto)
- Configuración de WhatsApp y nombre de tienda

## API

### Endpoints Públicos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/productos | Listar productos (filtrable) |
| GET | /api/productos/:id | Detalle producto |
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/auth/session | Verificar sesión |
| POST | /api/chat | Chatbot |
| GET | /api/config | Config pública |

### Endpoints Protegidos (requiere auth)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/carrito/agregar | Agregar al carrito |
| GET | /api/carrito | Ver carrito |
| POST | /api/carrito/actualizar | Actualizar cantidad |
| DELETE | /api/carrito/:id | Eliminar item |
| POST | /api/checkout | Procesar pedido |
| GET | /api/pedidos | Mis pedidos |

### Endpoints Admin (rol admin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/admin/stats | Dashboard stats |
| GET | /api/admin/pedidos | Todos los pedidos |
| GET | /api/admin/usuarios | Todos los usuarios |
| POST | /api/admin/productos | Crear producto |
| PUT | /api/admin/productos/:id | Editar producto |
| DELETE | /api/admin/productos/:id | Eliminar producto |
| POST | /api/admin/config | Guardar config |

## Técnicas de Animación

### 1. CSS Puras (de tienda_web_server)
- `backdrop-filter: blur(20px)` — Glassmorphism navbar
- `radial-gradient` — Glow de fondo
- `transition` — Hover effects suaves
- `@keyframes` — spin, fadeIn, slideUp, toastIn/Out, pulse
- `transform: scale()` — Badge pulse, image zoom

### 2. GSAP (de web_animation_skill)
- Hero entrance: stagger title/desc/buttons
- ScrollTrigger: product cards fade-up on scroll
- Hover: scale up en nav-links y botones
- Filtros: stagger animation al cambiar categoría
- Efecto pulse registrado como plugin custom

### 3. AOS (de web_animation_skill)
- `fade-up` en hero, cards, header, footer, stats
- Config: 600ms duration, ease-out-cubic

### 4. Rive (de web_rive)
- Canvas-based vector animations
- Hero rota entre 3 animaciones (electronics/computer/furniture)
- Fallback automático si no hay .riv (iconos animados CSS)
- Resize dinámico del canvas

### 5. Custom
- Ripple effect en botones (JS + CSS)
- Stock badge color-coded (verde/amarillo/rojo)
- Card hover: translateY + glow shadow
- Hero grid cell animation (pulsing)

## Design Tokens (de web_cursor)

Sistema de diseño centralizado con CSS custom properties:

### Colores
- `--color-primary`, `--color-primary-hover`, `--color-primary-muted`
- `--color-accent`, `--color-accent-muted`
- `--color-success`, `--color-danger`, `--color-warning`
- `--color-bg`, `--color-bg-elevated`, `--color-bg-subtle`, `--color-surface`
- `--color-text`, `--color-text-muted`, `--color-text-subtle`
- `--color-border`, `--color-border-strong`

### Tipografía Fluida
- `--text-xs` a `--text-5xl` (usando `clamp()`)
- `--leading-tight`, `--leading-normal`, `--leading-relaxed`

### Espaciado
- `--space-1` (0.25rem) a `--space-24` (6rem)

### Layout
- `--container-sm` (640px) a `--container-2xl` (1440px)
- `--container-padding` (clamp responsive)

### Efectos
- `--radius-sm` a `--radius-full`
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-glow`
- `--transition-fast` (150ms), `--transition-base` (250ms), `--transition-slow` (400ms)
- `--z-dropdown` (100), `--z-sticky` (200), `--z-overlay` (300), `--z-modal` (400)

## CSS Reset Mejorado (de web_cursor)
- `prefers-reduced-motion` — Respeta preferencias de accesibilidad
- `focus-visible` — Outline accesible para navegación por teclado
- `webkit-font-smoothing` — Rendering de fuentes optimizado

## Clases Utilidad (de web_cursor)
- `.gradient-text` — Texto con degradado animado
- `.section-label` — Etiqueta decorativa con línea
- `.sr-only` — Solo visible para lectores de pantalla

## Estructura del Proyecto

```
web_merge_final/
├── server.js                 # Express server (API + static)
├── package.json
├── .gitignore
├── README.md
├── public/
│   ├── index.html            # SPA principal (8 secciones)
│   ├── css/styles.css        # Estilos con design tokens
│   ├── js/
│   │   ├── main.js           # Lógica SPA + contact form
│   │   └── animations.js     # GSAP + AOS + Rive
│   ├── assets/riv/           # Animaciones Rive
│   └── admin/
│       └── index.html        # Panel admin
├── data/
│   ├── productos.json
│   ├── usuarios.json
│   ├── categorias.json
│   ├── pedidos.json
│   ├── config.json
│   └── chatbot_conocimiento.json
├── docs/
│   ├── CHANGELOG.md
│   └── TODO.md
└── .opencode/
    └── skills/web_merge/SKILL.md
```

## Cambios Realizados (integración web_cursor)

### Archivos Modificados
1. **public/css/styles.css** — Design tokens, reset mejorado, utility classes, estilos de páginas (Servicios, Nosotros, Contacto), footer mejorado, sección stats
2. **public/index.html** — Navegación actualizada, secciones Servicios/Nosotros/Contacto, hero con section-label y gradient-text, stats, footer mejorado
3. **public/js/main.js** — Funciones `enviarContacto()` y `resetContactForm()`

### Nuevas Secciones HTML
- `#seccion-servicios` — Grid de 4 servicios con features
- `#seccion-nosotros` — Misión, 3 valores, 4 estadísticas de equipo
- `#seccion-contacto` — Formulario + info de contacto

### Nuevos Estilos CSS
- `.card`, `.card--elevated`, `.card--accent` — Componente tarjeta
- `.card__icon`, `.card__title`, `.card__description` — Contenido tarjeta
- `.servicios-grid`, `.servicios-features`, `.servicios-cta`
- `.nosotros-valores-grid`, `.nosotros-equipo-grid`, `.nosotros-stat`
- `.contacto-form`, `.contacto-field`, `.contacto-success`, `.contacto-info`
- `.stats`, `.stats__grid`, `.stats__value`, `.stats__label`
- `.gradient-text`, `.section-label`, `.sr-only`

## Licencia
MIT — Libre para usar, modificar y distribuir.
