#!/usr/bin/env bash
# ============================================================
# WebMerge Studio — Start/Stop/Restart Script
# Uso: ./start.sh [comando] [puerto]
#
# Comandos:
#   start   [puerto]  Iniciar servidor (default)
#   stop              Detener servidor
#   restart [puerto]  Reiniciar servidor
#   status            Estado del servidor
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

CMD="${1:-start}"
PORT="${2:-8080}"
PID_FILE=".server.pid"

case "$CMD" in
  menu|interactive|"")
    while true; do
      clear
      echo "  ╔═══════════════════════════════════════╗"
      echo "  ║      WebMerge Studio — Menu           ║"
      echo "  ╠═══════════════════════════════════════╣"
      # Check server status
      STATUS_TEXT="✗ Detenido"
      STATUS_PID=""
      if [ -f "$PID_FILE" ]; then
        SPID=$(cat "$PID_FILE")
        if kill -0 "$SPID" 2>/dev/null; then
          STATUS_TEXT="✓ Corriendo (PID $SPID)"
          STATUS_PID=$SPID
        fi
      else
        SPID=$(lsof -ti :"$PORT" 2>/dev/null || true)
        if [ -n "$SPID" ]; then
          STATUS_TEXT="✓ Corriendo (PID $SPID)"
          STATUS_PID=$SPID
        fi
      fi
      if [ -n "$STATUS_PID" ]; then
        # Get WhatsApp status from API if possible
        WA_STATUS=$(curl -s --max-time 3 http://localhost:$PORT/api/admin/whatsapp-status 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
        [ -z "$WA_STATUS" ] && WA_STATUS="unknown"
      else
        WA_STATUS="—"
      fi
      echo "  ║  Servidor: $STATUS_TEXT"
      echo "  ║  WhatsApp: $WA_STATUS"
      echo "  ║  Puerto:   $PORT"
      echo "  ║  Admin:    http://localhost:$PORT/admin"
      echo "  ╠═══════════════════════════════════════╣"
      echo "  ║  1) 🚀  Iniciar servidor              ║"
      echo "  ║  2) 🛑  Detener servidor              ║"
      echo "  ║  3) 🔄  Reiniciar servidor            ║"
      echo "  ║  4) 📊  Ver logs                      ║"
      echo "  ║  5) 🧹  Limpiar sesión WhatsApp       ║"
      echo "  ║  0) ❌  Salir                         ║"
      echo "  ╚═══════════════════════════════════════╝"
      echo ""
      read -p "  Opción: " OPT
      case "$OPT" in
        1) "$0" start "$PORT" & ;;
        2) "$0" stop "$PORT" ;;
        3) "$0" restart "$PORT" & sleep 3 ;;
        4)
           if [ -f /tmp/server.log ]; then
             tail -30 /tmp/server.log
           else
             echo "  ! No hay logs disponibles"
           fi
           echo ""; read -p "  Enter para volver al menú..." _
           ;;
        5)
           echo "  → Deteniendo y limpiando sesión WhatsApp..."
           TOKEN=$(curl -s --max-time 5 -X POST http://localhost:$PORT/api/admin/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}' 2>/dev/null | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
           if [ -n "$TOKEN" ]; then
             curl -s --max-time 5 -X POST http://localhost:$PORT/api/admin/whatsapp-reset -H "Authorization: Bearer $TOKEN" > /dev/null
             echo "  ✓ Sesión eliminada"
           else
             echo "  ! No se pudo conectar con el servidor"
           fi
           echo ""; read -p "  Enter para volver al menú..." _
           ;;
        0) echo "  👋 Hasta luego!"; exit 0 ;;
        *) echo "  Opción inválida"; sleep 1 ;;
      esac
    done
    ;;

  stop)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      kill "$PID" 2>/dev/null && echo "  ✓ Servidor detenido (PID $PID)" || echo "  ! El servidor no está corriendo"
      rm -f "$PID_FILE"
    else
      PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
      if [ -n "$PID" ]; then
        kill "$PID" 2>/dev/null && echo "  ✓ Servidor detenido (PID $PID)" || echo "  ! No se pudo detener"
      else
        echo "  ! No hay servidor corriendo en puerto $PORT"
      fi
    fi
    # Clean up any stale browser processes for WhatsApp sessions
    STALE_PIDS=""
    STALE_PIDS="$STALE_PIDS $(ps aux | grep 'chrome.*session-webmerge' | grep -v grep | awk '{print $2}' || true)"
    STALE_PIDS="$STALE_PIDS $(ps aux | grep 'chromium.*session-webmerge' | grep -v grep | awk '{print $2}' || true)"
    STALE_PIDS="$STALE_PIDS $(ps aux | grep '\.wwebjs_auth/session-webmerge' | grep -v grep | awk '{print $2}' || true)"
    STALE_PIDS="$STALE_PIDS $(ps -ef | grep '\.wwebjs_auth/session-webmerge' | grep -v grep | awk '{print $2}' || true)"
    STALE_PIDS=$(echo "$STALE_PIDS" | tr ' ' '\n' | sort -u | tr '\n' ' ')
    if [ -n "$STALE_PIDS" ]; then
      kill $STALE_PIDS 2>/dev/null
      echo "  ✓ Procesos de sesión WhatsApp limpiados"
    fi
    exit 0
    ;;

  status)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        echo "  ✓ Servidor corriendo (PID $PID, puerto $PORT)"
        exit 0
      else
        echo "  ! PID file existe pero el proceso no está vivo"
        rm -f "$PID_FILE"
        exit 1
      fi
    fi
    PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
    if [ -n "$PID" ]; then
      echo "  ✓ Servidor corriendo (PID $PID, puerto $PORT)"
    else
      echo "  ✗ Servidor detenido"
    fi
    exit 0
    ;;

  restart)
    "$0" stop "$PORT"
    sleep 2
    "$0" start "$PORT"
    exit 0
    ;;

  start)
    # Kill any existing process on the port
    OLD_PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
    if [ -n "$OLD_PID" ]; then
      echo "  → Puerto $PORT ocupado, deteniendo proceso anterior (PID $OLD_PID)..."
      kill "$OLD_PID" 2>/dev/null
      sleep 2
    fi
    # Clean up stale browser processes for WhatsApp sessions
    STALE_PIDS=""
    STALE_PIDS="$STALE_PIDS $(ps aux | grep 'chrome.*session-webmerge' | grep -v grep | awk '{print $2}' || true)"
    STALE_PIDS="$STALE_PIDS $(ps aux | grep 'chromium.*session-webmerge' | grep -v grep | awk '{print $2}' || true)"
    STALE_PIDS="$STALE_PIDS $(ps aux | grep '\.wwebjs_auth/session-webmerge' | grep -v grep | awk '{print $2}' || true)"
    STALE_PIDS="$STALE_PIDS $(ps -ef | grep '\.wwebjs_auth/session-webmerge' | grep -v grep | awk '{print $2}' || true)"
    STALE_PIDS=$(echo "$STALE_PIDS" | tr ' ' '\n' | sort -u | tr '\n' ' ')
    if [ -n "$STALE_PIDS" ]; then
      kill $STALE_PIDS 2>/dev/null
      sleep 1
    fi
    rm -f "$PID_FILE"

    export PORT
    echo "  ╔═══════════════════════════════════════╗"
    echo "  ║      WebMerge Studio                  ║"
    echo "  ╠═══════════════════════════════════════╣"
    echo "  ║  Puerto: $PORT"
    echo "  ║  DB:     data/webmerge.db"
    echo "  ║  Admin:  http://localhost:$PORT/admin"
    echo "  ╚═══════════════════════════════════════╝"
    echo ""

    mkdir -p data

    if [ ! -f "data/webmerge.db" ]; then
      echo "  → Inicializando base de datos..."
      node setup-db.js
      echo ""
    fi

    echo "  → Iniciando servidor..."
    echo ""
    node server.js &
    PID=$!
    echo "$PID" > "$PID_FILE"
    echo "  ✓ Servidor iniciado (PID $PID)"
    wait $PID
    ;;
esac
