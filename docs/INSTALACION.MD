# Instalación — WebMerge Studio v4

## Requisitos

- Node.js >= 18
- npm >= 9
- Google Chrome o Chromium (para WhatsApp bot, opcional)

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd web_merge_final

# 2. Instalar dependencias
npm install

# 3. Inicializar base de datos SQLite
node setup-db.js
# Crea data/webmerge.db con datos de ejemplo

# 4. Iniciar servidor
node server.js
# http://localhost:8080
```

## Primer Uso

1. Abrir `http://localhost:8080` — landing page principal
2. Probar el chatbot — ícono flotante abajo a la derecha
3. Ir a `http://localhost:8080/admin` — panel de administración
4. Login con `admin` / `admin123`

## WhatsApp Bot (Opcional)

El bot de WhatsApp se inicia automáticamente con el servidor.

1. Ve al admin > pestaña "WhatsApp"
2. Escanea el código QR con tu teléfono (WhatsApp Web)
3. El estado cambiará a "Conectado"
4. Envía mensajes al número conectado — responderá automáticamente

Si no tienes Chrome instalado, el bot no se conectará pero el resto de la aplicación funciona sin problemas.

## Configuración

Variables de entorno:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `8080` | Puerto del servidor |
| `JWT_SECRET` | `webmerge_secret_key_...` | Secreto para tokens JWT |

## Script de Inicio (Recomendado)

```bash
./start.sh            # Puerto por defecto (8080)
./start.sh 3000       # Puerto personalizado
PORT=4000 ./start.sh  # También funciona con variable de entorno
```

El script:

1. Verifica e inicializa la base de datos automáticamente si no existe
2. Lee `$PORT` del argumento, variable de entorno, o usa 8080 por defecto
3. Muestra un banner informativo antes de arrancar

## Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm start` | Iniciar servidor |
| `npm run dev` | Iniciar servidor (modo desarrollo) |
| `npm run db:init` | Inicializar/reinicializar base de datos |

## Estructura de Archivos

Ver [ESTRUCTURA.MD](./ESTRUCTURA.MD) para la estructura completa.
