# Web Merge Final Skill

## Descripción
Proyecto mergeado que unifica tres tipos de página web en un solo proyecto funcional:
1. **Tienda C++ (tienda_web_server)** — Backend robusto, diseño glassmorphism dark, SPA vanilla JS
2. **Animation Web Skill (web_animation_skill)** — Animaciones GSAP + AOS, chatbot, paleta dinámica
3. **Web Rive (web_rive)** — Animaciones Rive vectoriales, panel admin completo, sistema de pedidos

## Stack Tecnológico
- **Backend:** Node.js + Express (unifica lo mejor de C++ y PHP)
- **Frontend:** HTML5 + CSS3 + Vanilla JS (SPA sin frameworks)
- **Animaciones:** GSAP 3.12 + ScrollTrigger + AOS 2.3 + Rive 2.0
- **Diseño:** Glassmorphism (backdrop-filter), dark theme, responsive
- **Datos:** JSON files (simple, portable)

## Estructura
```
web_merge_final/
├── server.js                 # Servidor Express (API REST)
├── package.json              # Dependencias
├── public/
│   ├── index.html            # SPA principal
│   ├── css/styles.css        # Estilos glassmorphism + animaciones
│   ├── js/
│   │   ├── main.js           # Lógica SPA (navegación, carrito, auth)
│   │   └── animations.js     # GSAP + AOS + Rive animations
│   ├── assets/riv/           # Archivos de animación Rive (.riv)
│   └── admin/
│       └── index.html        # Panel de administración
├── data/
│   ├── productos.json        # Catálogo de productos
│   ├── usuarios.json         # Usuarios y credenciales
│   ├── categorias.json       # Categorías con iconos y colores
│   ├── pedidos.json          # Historial de pedidos
│   ├── config.json           # Configuración de la tienda
│   └── chatbot_conocimiento.json  # Base de conocimiento del chatbot
├── .opencode/skills/web_merge/SKILL.md  # Este skill
└── docs/
    ├── CHANGELOG.md
    └── TODO.md
```

## API Endpoints

### Productos
- `GET /api/productos` — Lista todos (query: `categoria`, `busqueda`, `pagina`, `por_pagina`)
- `GET /api/productos/:id` — Detalle de producto

### Autenticación
- `POST /api/auth/login` — Iniciar sesión (body: `{usuario, password}`)
- `GET /api/auth/session` — Verificar sesión activa

### Carrito (requiere auth)
- `POST /api/carrito/agregar` — Agregar producto (body: `{producto_id, cantidad}`)
- `GET /api/carrito` — Ver carrito con detalles
- `POST /api/carrito/actualizar` — Cambiar cantidad (body: `{producto_id, cantidad}`)
- `DELETE /api/carrito/:id` — Eliminar del carrito

### Checkout (requiere auth)
- `POST /api/checkout` — Procesar pedido (body: `{nombre, direccion, email, tarjeta}`)
- `GET /api/pedidos` — Historial del usuario

### Chat
- `POST /api/chat` — Enviar mensaje al chatbot (body: `{mensaje}`)

### Admin (requiere auth + rol admin)
- `GET /api/admin/stats` — Estadísticas del dashboard
- `GET /api/admin/pedidos` — Todos los pedidos
- `GET /api/admin/usuarios` — Todos los usuarios
- `POST/PUT/DELETE /api/admin/productos/:id` — CRUD productos
- `POST /api/admin/config` — Guardar configuración

## Datos Demo
- **Admin:** admin / admin
- **Cliente:** cliente / cliente

## Cómo usar
```bash
cd web_merge_final
npm install
npm start
# Abrir http://localhost:8080
```

## Animaciones Incluidas
1. **GSAP**: Hero entrance, scroll-triggered cards, hover effects, button pulses
2. **AOS**: Fade-up/down en cards, header, hero sections on scroll
3. **Rive**: Canvas-based vector animations en hero (fallback a iconos animados si no hay .riv)
4. **CSS**: Glassmorphism (blur), transitions suaves, spin loader, badge pulse, toast in/out
5. **Custom**: Ripple en botones, stock badge color-coding, hero carousel

## Técnicas Mergeadas por Proyecto

| Técnica | tienda_web_server | web_animation_skill | web_rive |
|---------|-------------------|---------------------|----------|
| Glassmorphism | ✅ backdrop-filter | ✅ backdrop-filter | — |
| Dark theme | ✅ radial gradients | — | ✅ |
| SPA routing | ✅ section toggle | — | — |
| GSAP animations | — | ✅ ScrollTrigger | — |
| AOS scroll | — | ✅ fade-up | — |
| Rive canvas | — | — | ✅ .riv files |
| Chatbot | — | ✅ WhatsApp + KB | ✅ knowledge base |
| Admin panel | — | ✅ color config | ✅ full CRUD |
| Cart system | ✅ server-side | ✅ localStorage | ✅ hybrid |
| Auth tokens | ✅ Bearer token | — | ✅ session |
| Responsive | ✅ media queries | ✅ mobile menu | ✅ |
| Toast notifications | ✅ auto-dismiss | ✅ showToast | ✅ |
| Product filters | ✅ categories | ✅ search | ✅ pagination |
| Checkout flow | ✅ full form | ✅ order placement | ✅ invoice |
