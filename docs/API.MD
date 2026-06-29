# API

Base URL: `http://localhost:8080`

## Status

```
GET /api/status
```

```json
{
  "status": "online",
  "server": "WebMerge Studio v2",
  "port": 8080
}
```

## Frontend

Todas las rutas que no comiencen con `/api` sirven `index.html` (SPA fallback). El frontend maneja el ruteo del lado del cliente mediante secciones con `id` y smooth scroll.

## Archivos Estáticos

| Ruta | Archivo |
|------|---------|
| `/` | `public/index.html` |
| `/css/styles.css` | `public/css/styles.css` |
| `/js/main.js` | `public/js/main.js` |
| Cualquier otra ruta | `public/index.html` (SPA fallback) |
