# Reglas de Oro — WebMerge Studio

## 1. Versionado y Tags
- `package.json:version` y tag `v*` deben coincidir SIEMPRE.
- Antes de pushear, si hay cambios, incrementar VERSION (semver: `major.minor.patch`).
- Crear tag `v<VERSION>` y pushearlo junto con los cambios.
- El footer en `public/index.html` debe reflejar la versión actual.

## 2. Base de Datos
- SQLite vía `better-sqlite3`, WAL mode.
- Migraciones en `server.js` con `CREATE TABLE IF NOT EXISTS` y `ALTER TABLE` + try/catch para columnas nuevas.
- Seed de datos por defecto en `setup-db.js` y también en `server.js` con `INSERT OR IGNORE`.
- No borrar tablas en producción — solo agregar columnas o tablas nuevas.

## 3. Roles de Usuario
- Tres roles en DB con CHECK: `master` (todo), `stock` (productos), `response` (WhatsApp/contactos).
- Sidebar muestra todos los tabs siempre; backend retorna 403 por rol.
- Rutas sensibles (users, products) usan `roleMiddleware('master')` o `roleMiddleware('master', 'stock')`.

## 4. Admin Panel
- Layout: sidebar vertical a la izquierda, contenido a la derecha.
- En móvil (<768px): sidebar se convierte en barra horizontal con scroll.
- WhatsApp: `flex-direction: row-reverse` para sidebar a la derecha.
- CSS custom properties en `#dashboardView` para theming del admin.
- Los colores del admin se guardan en tabla `config` con prefijo `admin_`.

## 5. WhatsApp Bot
- Menú interactivo con letras (A-F menú principal, AA/AF/CA/CF submenús).
- Opciones del menú almacenadas en tabla `menu_options`, editables desde admin.
- `0` / `volver` / `atras` / `back` → menú principal desde cualquier lugar.
- `menu` / `hola` / `buenas` → muestra el menú principal.
- Productos se listan dinámicamente desde DB (tipo `product_list`).
- Al iniciar, matar procesos Chrome stale de sesiones anteriores para evitar `EADDRINUSE`.
- Soporte QR + vinculación por código (pairing code).

## 6. API
- Rutas públicas: `/api/config`, `/api/faqs`, `/api/contact`, `/api/chat`, `/api/carrusel/images`.
- Rutas admin: `/api/admin/*` con JWT en header `Authorization: Bearer <token>`.
- Login retorna token 24h. El frontend lo guarda en `localStorage` como `wms_token`.
- CRUD siempre con try/catch y `res.status(500).json({ error: err.message })`.

## 7. Frontend
- Paletas de color: 15 para sitio web, 15 para admin, precargadas en `admin.js`.
- Carrusel: imágenes `.png` desde `assets/carrusel/`, servidas como `background-image` con `cover`.
- Opacidad del overlay configurable desde admin (`carousel_overlay_opacity`).

## 8. Estructura de Archivos
```
server.js              → Entry point, Express, DB migrations
routes/                → API routers (admin.js, config.js, faqs.js, contact.js, chat.js)
services/whatsapp.js   → Bot de WhatsApp
database/db.js         → Singleton de better-sqlite3
public/                → Frontend estático
  index.html           → Landing page
  admin/index.html     → Admin SPA
  admin/js/admin.js    → Lógica del admin
  admin/css/admin.css  → Estilos del admin
  css/styles.css       → Estilos del sitio público
  js/main.js           → Lógica del sitio público
script_tools/start.sh  → Script de inicio/parada/menú
assets/carrusel/       → Imágenes del carrusel
data/webmerge.db       → Base de datos SQLite
```

## 9. Script de Inicio
- `script_tools/start.sh` acepta: `start`, `stop`, `restart`, `status`, `menu`.
- Sin argumentos → menú interactivo con opciones numeradas.
- Mata proceso anterior en el puerto antes de iniciar.
- Limpia procesos Chrome stale de WhatsApp.

## 10. Commits y Push
- Commits descriptivos en inglés o español, con prefijo semántico (`feat:`, `fix:`, `chore:`, `refactor:`).
- Pushear a la branch `feat/single-page-v2`.
- No commitear secrets ni archivos generados.
