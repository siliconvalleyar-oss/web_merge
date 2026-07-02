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
  echo "  → Chrome/Chromium no encontrado."

  if command -v apt &>/dev/null; then
    if sudo -n true 2>/dev/null; then
      echo "  → Instalando chromium-browser..."
      sudo apt install -y --fix-missing chromium-browser
      CHROME_BIN=$(command -v chromium-browser 2>/dev/null || command -v chromium 2>/dev/null || true)
    else
      echo "  → Se necesita sudo. Ejecutá:"
      echo "    sudo apt install -y chromium-browser"
      echo "  → Luego volvé a correr este script."
      exit 1
    fi
  elif command -v pacman &>/dev/null; then
    echo "  → Instalando chromium..."
    sudo pacman -S --noconfirm chromium
    CHROME_BIN=$(command -v chromium 2>/dev/null || true)
  else
    echo "  → No se pudo instalar automáticamente."
    echo "  → Instalá Chromium manualmente y volvé a correr este script."
    exit 1
  fi

  # Buscar también rutas no estándar (ej. snap)
  if [ -z "$CHROME_BIN" ] || [ ! -x "$CHROME_BIN" ]; then
    for c in /snap/bin/chromium /usr/bin/chromium /usr/bin/chromium-browser; do
      if [ -x "$c" ]; then
        CHROME_BIN="$c"
        break
      fi
    done
  fi

  if [ -z "$CHROME_BIN" ] || [ ! -x "$CHROME_BIN" ]; then
    echo "  ✗ Chromium instalado pero no se encontró el binario."
    exit 1
  fi
  echo "  ✓ Chromium instalado: $CHROME_BIN"
fi

# Agregar la ruta a services/whatsapp.js si no está en la lista
if ! grep -qF "$CHROME_BIN" services/whatsapp.js; then
  echo "  → Agregando '$CHROME_BIN' a la lista de búsqueda en services/whatsapp.js..."
  sed -i "/\/snap\/bin\/chromium/a\\    '$CHROME_BIN'," services/whatsapp.js
  echo "  ✓ Ruta agregada."
fi

echo ""
echo "  ✓ Todo listo. Reiniciá el servidor para que WhatsApp funcione."
