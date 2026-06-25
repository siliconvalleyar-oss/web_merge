#!/usr/bin/env bash
# Web Merge Final — utilidades compartidas

[[ -n "${WM_COMMON_LOADED:-}" ]] && return 0
WM_COMMON_LOADED=1

set -euo pipefail

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly MAGENTA='\033[0;35m'
readonly BOLD='\033[1m'
readonly DIM='\033[2m'
readonly NC='\033[0m'

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(cd "${LIB_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${TOOLS_DIR}/.." && pwd)"
RUNTIME_DIR="${TOOLS_DIR}/.runtime"

readonly SERVER_PORT=8080
readonly SERVER_URL="http://localhost:${SERVER_PORT}"

print_header() {
  clear
  echo -e "${CYAN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════╗"
  echo "  ║       Web Merge Final — Dev Tools            ║"
  echo "  ╚══════════════════════════════════════════════╝"
  echo -e "${NC}"
}

print_success() { echo -e "${GREEN}✔${NC} $*"; }
print_error()   { echo -e "${RED}✖${NC} $*" >&2; }
print_warn()    { echo -e "${YELLOW}⚠${NC} $*"; }
print_info()    { echo -e "${BLUE}ℹ${NC} $*"; }
print_step()    { echo -e "${DIM}→${NC} $*"; }

pause() {
  echo ""
  read -rp "$(echo -e "${DIM}Presiona Enter para continuar...${NC}")"
}

separator() {
  echo -e "${DIM}────────────────────────────────────────────────${NC}"
}

ensure_runtime_dir() {
  mkdir -p "${RUNTIME_DIR}"
}

cd_project() {
  cd "${PROJECT_ROOT}"
}

require_node() {
  if ! command -v node &>/dev/null; then
    print_error "Node.js no está instalado."
    return 1
  fi
  if ! command -v npm &>/dev/null; then
    print_error "npm no está instalado."
    return 1
  fi
  return 0
}

require_dependencies() {
  cd_project
  if [[ ! -d node_modules ]]; then
    print_warn "node_modules no encontrado. Instalando dependencias..."
    npm install
  fi
}

is_port_in_use() {
  local port=$1
  if command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | grep -q ":${port} "
  elif command -v lsof &>/dev/null; then
    lsof -i ":${port}" -sTCP:LISTEN &>/dev/null
  elif command -v netstat &>/dev/null; then
    netstat -tlnp 2>/dev/null | grep -q ":${port} "
  else
    return 1
  fi
}

get_pid_file() {
  echo "${RUNTIME_DIR}/$1.pid"
}

get_log_file() {
  echo "${RUNTIME_DIR}/$1.log"
}

is_process_running() {
  local name=$1
  local pid_file
  pid_file="$(get_pid_file "${name}")"
  if [[ -f "${pid_file}" ]]; then
    local pid
    pid=$(cat "${pid_file}")
    if kill -0 "${pid}" 2>/dev/null; then
      return 0
    fi
    rm -f "${pid_file}"
  fi
  return 1
}

stop_service() {
  local name=$1
  local pid_file
  pid_file="$(get_pid_file "${name}")"

  if [[ -f "${pid_file}" ]]; then
    local pid
    pid=$(cat "${pid_file}")
    if kill -0 "${pid}" 2>/dev/null; then
      print_step "Deteniendo ${name} (PID ${pid})..."
      kill "${pid}" 2>/dev/null || true
      sleep 1
      kill -9 "${pid}" 2>/dev/null || true
      print_success "${name} detenido."
    fi
    rm -f "${pid_file}"
  fi
}

stop_all_services() {
  stop_service "server"
  stop_service "server-dev"
}

open_url() {
  local url=$1
  if command -v xdg-open &>/dev/null; then
    xdg-open "${url}" &>/dev/null &
  elif command -v open &>/dev/null; then
    open "${url}" &>/dev/null &
  else
    print_info "Abre manualmente: ${url}"
  fi
}

get_package_version() {
  node -p "require('${PROJECT_ROOT}/package.json').version" 2>/dev/null || echo "N/A"
}

get_package_name() {
  node -p "require('${PROJECT_ROOT}/package.json').name" 2>/dev/null || echo "web-merge-final"
}
