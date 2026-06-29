# Instalación

## Requisitos

- Node.js 18+
- npm 9+

## Pasos

```bash
# 1. Clonar el repositorio
git clone git@github.com:siliconvalleyar-oss/web_merge.git
cd web_merge/web_merge_final

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor
npm start
```

## Verificación

```bash
curl http://localhost:8080/api/status
```

Respuesta esperada:
```json
{
  "status": "online",
  "server": "WebMerge Studio v2",
  "port": 8080
}
```

Abrir http://localhost:8080 en el navegador.
