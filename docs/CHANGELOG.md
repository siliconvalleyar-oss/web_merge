# Changelog

## v1.1.0 (2026-06-25)
- **Auth**: Migración de contraseñas a bcrypt (hash + salt, 12 rounds)
- **Auth**: Token de acceso con expiración (24h) + refresh token (7d)
- **Auth**: Nuevo endpoint `POST /api/auth/register` para registro de usuarios
- **Auth**: Nuevo endpoint `POST /api/auth/refresh` para renovar tokens
- **Auth**: Nuevo endpoint `POST /api/auth/logout` para cerrar sesión en servidor
- **Auth**: Limpieza periódica de tokens expirados (cada hora)
- **Frontend**: Sección de registro de usuarios con validación
- **Frontend**: Refresh automático de token (5 min antes de expirar)
- **Frontend**: Reintento automático en peticiones con token expirado
- **Frontend**: Botón de registro en navegación y formulario de login
- **Security**: Validación de longitud mínima de contraseña (6 caracteres)
- **Security**: Verificación de duplicados (usuario y email) en registro
- **Chore**: Bump version a v1.1.0

## v1.0.2 (2026-06-25)
- **Docs**: Reglas de oro actualizadas en `docs/RULES.md` — flujo de versionado y tags
- **Chore**: Bump version a v1.0.2

## v1.0.0 (2026-06-25)
- **Merge Completo**: Unificación de tienda_web_server + web_animation_skill + web_rive
- **Backend**: Node.js + Express con 20+ endpoints REST
- **Frontend**: SPA con glassmorphism dark theme
- **Animaciones**: GSAP 3.12 + ScrollTrigger + AOS 2.3 + Rive 2.0
- **Catálogo**: 8 productos en 3 categorías con búsqueda y filtros
- **Carrito**: Server-side con persistencia por sesión
- **Checkout**: Formulario completo con validación
- **Auth**: Token-based con localStorage
- **Admin Panel**: Dashboard, CRUD productos, pedidos, usuarios, configuración
- **Chatbot**: Base de conocimiento con keywords y respuestas automáticas
- **Chat**: Integración con WhatsApp via wa.me
- **Responsive**: 3 breakpoints (768px, 480px)
- **Docs**: README, CHANGELOG, SKILL.md
