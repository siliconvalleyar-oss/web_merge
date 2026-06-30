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
cd "$SCRIPT_DIR"

CMD="${1:-start}"
PORT="${2:-8080}"
PID_FILE=".server.pid"

case "$CMD" in
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
    export PORT
    echo "  ╔═══════════════════════════════════════╗"
    echo "  ║      WebMerge Studio                  ║"
    echo "  ╠═══════════════════════════════════════╣"
    echo "  ║  Puerto: $PORT"
    echo "  ║  DB:     data/webmerge.db"
    echo "  ║  Admin:  http://localhost:$PORT/admin"
    echo "  ╚═══════════════════════════════════════╝"
    echo ""

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
