#!/usr/bin/env bash
# ============================================================
# WebMerge Studio — Fix Dependencies Script
# Corrige el error "Cannot find module 'better-sqlite3'"
# Ejecuta npm install y verifica que los módulos queden bien.
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "  → Verificando node_modules..."
NEED_INSTALL=false
if [ ! -d "node_modules" ]; then
  echo "  → node_modules no encontrado."
  NEED_INSTALL=true
elif [ ! -d "node_modules/better-sqlite3" ]; then
  echo "  → better-sqlite3 no encontrado."
  NEED_INSTALL=true
fi

if [ "$NEED_INSTALL" = false ]; then
  echo "  ✓ Todas las dependencias están instaladas."
  exit 0
fi

echo "  → Instalando dependencias (PUPPETEER_SKIP_DOWNLOAD=true)..."
PUPPETEER_SKIP_DOWNLOAD=true npm install

# Verificar que la instalación fue exitosa
if [ -d "node_modules/better-sqlite3/build" ]; then
  echo "  ✓ Dependencias instaladas correctamente."
else
  echo "  ✗ Error: better-sqlite3 no se instaló correctamente."
  echo "  → Revisa manualmente con: npm install"
  exit 1
fi
