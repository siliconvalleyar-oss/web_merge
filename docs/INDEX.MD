# WebMerge Studio — Índice

## Versión actual: [4.0.0](/VERSION)

## ¿Qué es?

WebMerge Studio es el resultado de fusionar las mejores técnicas aprendidas de 9 proyectos fuente. Es una landing page profesional full-stack con animaciones avanzadas, chatbot inteligente con RAG, base de datos SQLite, API REST, panel de administración y bot de WhatsApp.

## Proyectos Fuente y Técnicas Aportadas

| Proyecto | Técnicas Aportadas |
|----------|-------------------|
| **electronica_store** | Express SPA, vanilla JS modules, organización backend |
| **tienda_web_server** | Glassmorphism, dark theme, radial gradients, SPA routing |
| **animation_web_skill** | GSAP ScrollTrigger, AOS, chatbot, ripple effect, custom cursor |
| **web_rive** | ES modules, state management (pub/sub), animaciones canvas |
| **web_cursor** | Design tokens, tipografía fluida, reset accesible, secciones corporativas |
| **rag** | Base de conocimiento, retrieval pattern (RAG), scoring TF-IDF |
| **reedit / website-reddit** | Data-driven architecture, JSON data files, clean modular structure |

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | HTML5, CSS3 (design tokens), vanilla JS (ES modules) |
| **Animaciones** | GSAP, ScrollTrigger, AOS, CSS keyframes |
| **Backend** | Node.js, Express.js |
| **Base de datos** | SQLite (better-sqlite3) |
| **API** | REST (JSON) |
| **Chatbot** | RAG engine (TF-IDF scoring) + WhatsApp (whatsapp-web.js) |
| **Admin** | Panel web con autenticación JWT |
| **Autenticación** | JWT + bcrypt |

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [INSTALACION.MD](./INSTALACION.MD) | Instalación, configuración y puesta en marcha |
| [ESTRUCTURA.MD](./ESTRUCTURA.MD) | Estructura completa del proyecto |
| [DESARROLLO.MD](./DESARROLLO.MD) | Técnicas, patrones y arquitectura |
| [API.MD](./API.MD) | Documentación de la API REST |
| [CHANGELOG.MD](./CHANGELOG.MD) | Historial de versiones |

## Inicio Rápido

```bash
npm install
node setup-db.js   # Inicializa SQLite con datos de ejemplo
node server.js     # http://localhost:8080
# Admin: http://localhost:8080/admin (admin / admin123)
```
