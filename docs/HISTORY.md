# Historial de Cambios — WebMerge Studio

## v4.6.0 (2026-06-30)
- fix: burbujas de WhatsApp en admin — cliente a la derecha, bot a la izquierda, cada fila DB genera dos burbujas
- fix: tabs del admin panel en mobile — ahora se ven todas (antes solo FAQs por `display:block` heredado)
- chore: bump 4.5.0 → 4.6.0

## v4.5.0 (2026-06-30)
- feat: menú WhatsApp con letras (A–F menú principal, submenús AA/AF/CA/CF)
- feat: menú visual tipo árbol en admin (Menú WhatsApp tab)
- feat: CRUD completo de menu_options desde admin
- feat: pairing code (código de 8 dígitos) como alternativa al QR
- feat: navegación universal `0` / `volver` / `atras` / `back` → menú principal
- feat: footer de submenús con "O escribí 0 para volver"
- fix: quitar restricción de rol en rutas menu-options CRUD (permiso denegado)
- fix: admin responsive ≤768px (sidebar horizontal, tablas scroll, modales full-width)
- fix: breakpoint extra ≤480px
- chore: agregar RULES.md con 10 reglas de oro
- chore: actualizar link por defecto a `http://ms7851.local:8080/admin/`
- feat: tabla `clients` con phone, name, address, email, notes, client_number (CLI-XXX)
- feat: CRUD de clientes + export vCard
- feat: 15 paletas de color para sitio + 15 para admin
- feat: CRUD productos para roles master/stock, CRUD usuarios para master
- feat: botones conectar/stop/reset WhatsApp + eliminar conversación
- feat: carrusel desde `assets/carrusel/` con opacidad configurable
- feat: limpieza de procesos Chrome stale antes de iniciar WhatsApp

## v4.4.0
- feat: interactive menu + WhatsApp stale Chrome cleanup + reset session button
- feat: redesign WhatsApp bot with letter-based interactive menu system
- feat: admin can now customize WhatsApp bot menu options from DB
- feat: menu tree visualization + WhatsApp pairing code + configurable link URL
- feat: universal '0' and 'volver/atras/back' to return to main menu
- fix: remove role restriction on menu-options CRUD routes
- fix: responsive admin panel for mobile devices

## v4.3.0
- feat: WhatsApp conversation view + start.sh stop/restart + fix duplicates

## v4.2.0
- fix: RAG engine with accent normalization + exact token matching
- feat: WhatsApp bot now shows interactive menu instead of FAQ
- fix: mark chat as unread after auto-reply so human sees pending messages

## v4.1.0
- feat: WhatsApp real-time monitoring with auto-polling and notifications

## v4.0.2
- fix: add name attributes to contact form fields
- fix: WhatsApp bot message handling with dual event listeners + session reset

## v4.0.0 — v4.0.1
- feat: full-stack with RAG chatbot + WhatsApp + SQLite + admin panel
- feat: single page website redesign
- feat: interactive start.sh script
- feat: role-based admin (master, stock, response)
- feat: products CRUD
- feat: WhatsApp bot with QR authentication
- feat: RAG chatbot admin
- chore: version bumps and docs

## v1.0.0 — v1.1.0
- feat: initial commit web_merge v1.0.0
- feat: WebMerge Studio v2 - single page website
- docs: full documentation
