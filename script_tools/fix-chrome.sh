#!/usr/bin/env bash
# ============================================================
# WebMerge Studio — Fix Chrome for WhatsApp
# Corrige el error "Could not find Chrome (ver. ...)" en
# Raspberry Pi / Linux instalando Chromium si hace falta.
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

CHROME_BIN=""

echo "  → Buscando Chrome/Chromium..."
for c in google-chrome-stable google-chrome chromium-browser chromium; do
  path=$(command -v "$c" 2>/dev/null || true)
  if [ -n "$path" ] && [ -x "$path" ]; then
    CHROME_BIN="$path"
    echo "  ✓ Encontrado: $path"
    break
  fi
done

if [ -z "$CHROME_BIN" ]; then
  echo "  → Chrome/Chromium no encontrado. Instalando chromium-browser..."
  if command -v apt &>/dev/null; then
    sudo apt update && sudo apt install -y chromium-browser
    CHROME_BIN=$(command -v chromium-browser 2>/dev/null || command -v chromium 2>/dev/null || true)
  elif command -v pacman &>/dev/null; then
    sudo pacman -S --noconfirm chromium
    CHROME_BIN=$(command -v chromium 2>/dev/null || true)
  else
    echo "  ✗ No se pudo instalar. Instalá Chromium manualmente."
    echo "    sudo apt install chromium-browser"
    exit 1
  fi

  if [ -z "$CHROME_BIN" ] || [ ! -x "$CHROME_BIN" ]; then
    echo "  ✗ Chromium instalado pero no se encontró el binario."
    exit 1
  fi
  echo "  ✓ Chromium instalado: $CHROME_BIN"
fi

# Actualizar servicios/whatsapp.js si falta la ruta en candidates
if ! grep -q "$CHROME_BIN" services/whatsapp.js; then
  echo "  → Agregando '$CHROME_BIN' a la lista de búsqueda en services/whatsapp.js..."
  sed -i "/\/snap\/bin\/chromium/a\\    '$CHROME_BIN'," services/whatsapp.js
  echo "  ✓ Ruta agregada."
fi

echo ""
echo "  ✓ Todo listo. Reiniciá el servidor para que WhatsApp funcione."
