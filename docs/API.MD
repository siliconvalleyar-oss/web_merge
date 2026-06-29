# API REST — WebMerge Studio v4

## Base URL

```
http://localhost:8080/api
```

## Autenticación

Los endpoints protegidos requieren header:

```
Authorization: Bearer <token_jwt>
```

Obtener token:

```bash
curl -X POST http://localhost:8080/api/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}'
# Respuesta: { "token": "eyJ...", "user": { "username": "admin", "role": "admin" } }
```

---

## Endpoints Públicos

### GET /api/faqs

Obtiene las FAQs activas. Filtros opcionales:

| Query | Ejemplo | Descripción |
|-------|---------|-------------|
| `category` | `?category=tecnico` | Filtrar por categoría |
| `search` | `?search=chatbot` | Búsqueda full-text |

```bash
curl http://localhost:8080/api/faqs
```

```json
[
  {
    "id": 1,
    "category": "general",
    "question": "¿Qué es WebMerge Studio?",
    "answer": "WebMerge Studio es una plataforma profesional...",
    "keywords": "que es, plataforma, studio, webmerge",
    "enabled": 1,
    "created_at": "2026-06-29 00:00:00",
    "updated_at": "2026-06-29 00:00:00"
  }
]
```

### GET /api/faqs/categories

```bash
curl http://localhost:8080/api/faqs/categories
# ["general", "proceso", "soporte", "tecnico"]
```

### GET /api/config

Configuración pública (colores, nombres, etc.)

```bash
curl http://localhost:8080/api/config
# { "site_name": "WebMerge Studio", "primary_color": "#6c5ce7", ... }
```

### PUT /api/config

Actualizar configuración.

```bash
curl -X PUT http://localhost:8080/api/config \
  -H 'Content-Type: application/json' \
  -d '{"primary_color": "#ff0000", "site_name": "Mi Sitio"}'
# { "success": true }
```

### POST /api/contact

Enviar mensaje de contacto.

```bash
curl -X POST http://localhost:8080/api/contact \
  -H 'Content-Type: application/json' \
  -d '{"name": "Juan", "email": "juan@mail.com", "message": "Hola"}'
# { "success": true, "message": "Mensaje enviado correctamente" }
```

### POST /api/chat

Consultar el chatbot (motor RAG).

```bash
curl -X POST http://localhost:8080/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "¿qué es webmerge?"}'
```

```json
{
  "found": true,
  "answer": "WebMerge Studio es una plataforma profesional...",
  "faq": {
    "id": 1,
    "category": "general",
    "question": "¿Qué es WebMerge Studio?",
    "answer": "WebMerge Studio es una plataforma profesional...",
    "keywords": "que es, plataforma, studio, webmerge",
    "score": 0.85
  }
}
```

---

## Endpoints Protegidos (Admin)

Requieren header `Authorization: Bearer <token>`.

### GET /api/admin/verify

Verifica si el token es válido.

### GET /api/admin/config

Obtiene toda la configuración (similar al público pero autenticado).

### GET /api/admin/faqs

Obtiene todas las FAQs (incluyendo desactivadas).

### POST /api/admin/faqs

Crear nueva FAQ.

```json
{ "category": "soporte", "question": "¿Pregunta?", "answer": "Respuesta", "keywords": "palabras, clave" }
```

### PUT /api/admin/faqs/:id

Actualizar FAQ (mismos campos + `enabled: true/false`).

### DELETE /api/admin/faqs/:id

Eliminar FAQ.

### GET /api/admin/contacts

Lista de mensajes de contacto.

### PUT /api/admin/contacts/:id/read

Marcar mensaje como leído.

### GET /api/admin/whatsapp-status

Estado del bot de WhatsApp.

```json
{ "status": "connected" }
// Posibles: "disconnected", "qr_ready", "connected", "auth_failure", "error"
```

Cuando `status === "qr_ready"`, incluye `qrCode` (string para generar QR).

### GET /api/admin/whatsapp-messages

Historial de mensajes de WhatsApp.

---

## Códigos de Error

```json
{ "error": "Mensaje descriptivo del error" }
```

| Código HTTP | Significado |
|-------------|-------------|
| 200 | OK |
| 400 | Bad Request (parámetros inválidos) |
| 401 | No autorizado (token faltante o inválido) |
| 500 | Error interno del servidor |
