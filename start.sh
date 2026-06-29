#!/usr/bin/env bash
# ============================================================
# WebMerge Studio — Start Script
# Uso: ./start.sh [puerto]
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${1:-8080}"
export PORT

echo "  ╔═══════════════════════════════════════╗"
echo "  ║      WebMerge Studio v4               ║"
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
node server.js
