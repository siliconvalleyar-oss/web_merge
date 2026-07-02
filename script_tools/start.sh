#!/usr/bin/env bash
# ============================================================
# WebMerge Studio — Start/Stop/Restart Script
# Uso: ./start.sh [comando] [puerto]
#
# Compatible con: Linux, Raspberry Pi, Windows (Git Bash/MSYS2)
#
# Comandos:
#   start   [puerto]  Iniciar servidor (default)
#   stop              Detener servidor
#   restart [puerto]  Reiniciar servidor
#   status            Estado del servidor
# ============================================================

# ── OS detection ──────────────────────────────────────────
OS="unknown"
case "$(uname -s)" in
  Linux)  OS="linux"  ;;
  Darwin) OS="macos"  ;;
  MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
esac

# ── Helpers cross-platform ────────────────────────────────

find_port_pid() {
  local port=$1
  case "$OS" in
    linux)
      lsof -ti :"$port" 2>/dev/null || ss -tlnpH "sport = :$port" 2>/dev/null | grep -oP 'pid=\K\d+' || true
      ;;
    macos)
      lsof -ti :"$port" 2>/dev/null || true
      ;;
    windows)
      netstat -ano 2>/dev/null | grep -E ":$port\s" | grep -i listening | awk '{print $5}' | tr -d '\r' | head -1 || true
      ;;
  esac
}

kill_pid() {
  case "$OS" in
    windows) taskkill /F /PID "$1" 2>/dev/null || true ;;
    *)       kill "$1" 2>/dev/null || true ;;
  esac
}

kill_pids() {
  for pid in "$@"; do
    [ -n "$pid" ] && kill_pid "$pid"
  done
}

find_stale_browser_pids() {
  local pids=""
  case "$OS" in
    linux|macos)
      pids="$(ps aux 2>/dev/null | grep -E 'chrome.*session-webmerge|chromium.*session-webmerge' | grep -v grep | awk '{print $2}' || true)"
      pids="$pids $(ps aux 2>/dev/null | grep '\.wwebjs_auth/session-webmerge' | grep -v grep | awk '{print $2}' || true)"
      pids="$pids $(ps -ef 2>/dev/null | grep '\.wwebjs_auth/session-webmerge' | grep -v grep | awk '{print $2}' || true)"
      ;;
    windows)
      local images="chrome.exe chromium.exe msedge.exe"
      for img in $images; do
        local found
        found=$(tasklist /FI "IMAGENAME eq $img" /FO CSV /NH 2>/dev/null | awk -F',' '{print $2}' | tr -d '"' || true)
        for pid in $found; do
          local cmd
          cmd=$(tasklist /FI "PID eq $pid" /FO CSV /NH 2>/dev/null | awk -F',' '{print $1}' | tr -d '"' || true)
          pids="$pids $pid"
        done
      done
      ;;
  esac
  echo "$pids" | tr ' ' '\n' | sort -u | tr '\n' ' '
}

is_pid_alive() {
  case "$OS" in
    windows) tasklist /FI "PID eq $1" /NH 2>/dev/null | findstr "$1" >/dev/null 2>&1 || return 1 ;;
    *)       kill -0 "$1" 2>/dev/null || return 1 ;;
  esac
}

# ── Script setup ──────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

CMD="${1:-start}"
PORT="${2:-8080}"
PID_FILE=".server.pid"

case "$CMD" in
  menu|interactive|"")
    while true; do
      clear 2>/dev/null || cls 2>/dev/null || true
      echo "  ╔═══════════════════════════════════════╗"
      echo "  ║      WebMerge Studio — Menu           ║"
      echo "  ╠═══════════════════════════════════════╣"
      # Check server status
      STATUS_TEXT="✗ Detenido"
      STATUS_PID=""
      if [ -f "$PID_FILE" ]; then
        SPID=$(cat "$PID_FILE")
        if is_pid_alive "$SPID"; then
          STATUS_TEXT="✓ Corriendo (PID $SPID)"
          STATUS_PID=$SPID
        fi
      else
        SPID=$(find_port_pid "$PORT")
        if [ -n "$SPID" ]; then
          STATUS_TEXT="✓ Corriendo (PID $SPID)"
          STATUS_PID=$SPID
        fi
      fi
      if [ -n "$STATUS_PID" ]; then
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
             tail -30 /tmp/server.log 2>/dev/null || type -t tail >/dev/null && tail -30 /tmp/server.log || echo "  ! No hay visor de logs disponible"
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
    PID=""
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      kill_pid "$PID"
      echo "  ✓ Servidor detenido (PID $PID)"
      rm -f "$PID_FILE"
    else
      PID=$(find_port_pid "$PORT")
      if [ -n "$PID" ]; then
        kill_pid "$PID"
        echo "  ✓ Servidor detenido (PID $PID)"
      else
        echo "  ! No hay servidor corriendo en puerto $PORT"
      fi
    fi
    # Clean up stale browser processes for WhatsApp sessions
    STALE_PIDS=$(find_stale_browser_pids)
    if [ -n "$STALE_PIDS" ]; then
      kill_pids $STALE_PIDS
      echo "  ✓ Procesos de sesión WhatsApp limpiados"
    fi
    exit 0
    ;;

  status)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if is_pid_alive "$PID"; then
        echo "  ✓ Servidor corriendo (PID $PID, puerto $PORT)"
        exit 0
      else
        echo "  ! PID file existe pero el proceso no está vivo"
        rm -f "$PID_FILE"
        exit 1
      fi
    fi
    PID=$(find_port_pid "$PORT")
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
    OLD_PID=$(find_port_pid "$PORT")
    if [ -n "$OLD_PID" ]; then
      echo "  → Puerto $PORT ocupado, deteniendo proceso anterior (PID $OLD_PID)..."
      kill_pid "$OLD_PID"
      sleep 2
    fi
    # Clean up stale browser processes for WhatsApp sessions
    STALE_PIDS=$(find_stale_browser_pids)
    if [ -n "$STALE_PIDS" ]; then
      kill_pids $STALE_PIDS
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
