# WebMerge Studio Skill

## Descripción
Full-stack landing page con RAG chatbot + WhatsApp integrado + panel de administración completo. Unifica gestión de productos, clientes, pedidos, FAQs, y configuración de tienda en un solo proyecto.

## Stack Tecnológico
- **Backend:** Node.js + Express + better-sqlite3 (SQLite WAL mode)
- **Frontend:** HTML5 + CSS3 + Vanilla JS (SPA sin frameworks)
- **WhatsApp:** whatsapp-web.js (real device auth via QR)
- **Autenticación:** JWT + bcrypt, roles: master, stock, response
- **Diseño:** Dark theme, glassmorphism, sidebar admin layout, paletas de colores configurables

## Estructura actual
```
web_merge_final/
├── server.js                 # Servidor Express (migraciones DB, rutas, init)
├── package.json              # Dependencias
├── config/config.js          # Config (PORT, JWT_SECRET)
├── database/db.js            # SQLite connection (better-sqlite3, WAL)
├── setup-db.js               # Seed inicial de DB
├── sql/schema.sql            # Esquema de referencia
├── routes/
│   ├── admin.js              # CRUD admin (productos, clientes, usuarios, FAQs, WhatsApp, config)
│   ├── config.js             # Config pública (GET/PUT)
│   ├── faqs.js               # FAQs públicas
│   ├── contact.js            # Formulario de contacto
│   └── chat.js               # RAG chatbot endpoint
├── services/
│   └── whatsapp.js           # WhatsApp bot (catálogo, auto-client, sendMessage)
├── public/
│   ├── index.html            # Landing page pública
│   ├── css/styles.css        # Estilos glassmorphism + animaciones
│   ├── js/main.js            # Lógica SPA
│   └── admin/
│       ├── index.html        # Admin SPA (sidebar + pestañas)
│       ├── js/admin.js       # Admin logic (CRUD, paletas, colores)
│       └── css/admin.css     # Admin styles (CSS custom properties)
├── data/
│   └── webmerge.db           # SQLite database (auto-creada)
├── .opencode/skills/web_merge/SKILL.md
└── script_tools/start.sh     # Script de inicio
```

## Base de Datos (SQLite)
Tablas principales en `data/webmerge.db`:
- **config** — Configuración del sitio y admin (clave-valor)
- **faqs** — Preguntas frecuentes con categorías
- **contacts** — Mensajes del formulario de contacto
- **whatsapp_messages** — Mensajes de WhatsApp entrantes/salientes
- **clients** — Clientes con phone, name, address, email, notes, client_number (CLI-XXX)
- **products** — Productos con name, description, price, stock, category, image_url, enabled
- **users** — Usuarios admin con rol: master, stock, response

## Roles de Admin
- **master** — Acceso total (productos, clientes, usuarios, config, WhatsApp)
- **stock** — Solo productos (CRUD)
- **response** — Solo WhatsApp (ver conversaciones, responder) + clients (read-only)

## API Endpoints

### Públicos
- `GET /api/config` — Configuración del sitio
- `GET /api/faqs` — FAQs públicas (enabled=1)
- `POST /api/contact` — Enviar formulario de contacto
- `POST /api/chat` — Chatbot RAG (body: `{mensaje}`)

### Admin (requiere JWT Bearer token)
- `POST /api/admin/login` — Login (body: `{username, password}`)
- `GET /api/admin/verify` — Verificar token
- `GET /api/admin/config` — Toda la config
- `GET/POST /api/admin/faqs` — CRUD FAQs
- `PUT/DELETE /api/admin/faqs/:id`
- `GET /api/admin/contacts` — Contactos recibidos
- `PUT /api/admin/contacts/:id/read`
- `GET/POST /api/admin/clients` — CRUD clientes
- `PUT/DELETE /api/admin/clients/:id`
- `GET /api/admin/clients/export` — Exportar vCard
- `GET /api/admin/clients/by-phone/:phone`
- `GET/POST /api/admin/products` — CRUD productos (master/stock)
- `PUT/DELETE /api/admin/products/:id`
- `GET/POST /api/admin/users` — CRUD usuarios (master only)
- `PUT/DELETE /api/admin/users/:id`
- `GET /api/admin/whatsapp-status`
- `GET /api/admin/whatsapp-messages`
- `GET /api/admin/whatsapp-conversations`
- `GET /api/admin/whatsapp-conversation/:number`
- `PUT /api/admin/whatsapp-conversation/:number/read`
- `PUT /api/admin/whatsapp-conversation/:number/unread`
- `POST /api/admin/whatsapp-stop`
- `POST /api/admin/whatsapp-send` — Enviar mensaje (master/response)

## Paletas de Color
- **15 paletas de sitio** — Default, Minimalista, Pasteles, Colorido, Empresarial, Moderno, Atractivo, Oceánico, Atardecer, Naturaleza, Tecno, Vintage, Oscuro Elegante, Rosa, Solar
- **15 paletas de admin** — Dark, Light, Navy, Forest, Midnight, Warm, Grafito, Corporativo, Púrpura Oscuro, Verde Menta, Terracota, Pizarra, Cereza, Arena

Variables CSS para admin: `--admin-bg`, `--admin-sidebar`, `--admin-accent`, `--admin-text`, `--admin-border`, `--admin-surface`

## Layout Admin
- Sidebar vertical izquierdo con tabs (Dashboard, Config, FAQs, Contacts, Clients, Products, Users, WhatsApp)
- Contenido a la derecha
- WhatsApp: sidebar de conversaciones a la derecha (flex-direction: row-reverse)

## Datos Demo
- **Admin:** admin / admin123 (rol: master)

## Cómo usar
```bash
cd web_merge_final
npm install
npm start
# Abrir http://localhost:8080
# Admin: http://localhost:8080/admin/
```

## Convenciones
- Respuestas del bot: usar emojis solo si el usuario los usa
- DB: WAL mode, prepared statements con better-sqlite3
- JWT expira en 24h
- Productos: precio REAL, stock INTEGER, enabled BOOLEAN (0/1)
- Clientes: client_number auto-generado CLI-XXX
- WhatsApp: auto-crea cliente cuando un número nuevo escribe al bot
- Errores: responder con `{ error: mensaje }` en español
