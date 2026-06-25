#!/usr/bin/env bash
# Web Merge Final — gestión de servicios

[[ -n "${WM_SERVICES_LOADED:-}" ]] && return 0
WM_SERVICES_LOADED=1

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "${LIB_DIR}/common.sh"

start_server() {
  ensure_runtime_dir
  require_node || return 1
  require_dependencies || return 1

  if is_process_running "server"; then
    print_warn "El servidor ya está corriendo."
    print_info "URL: ${SERVER_URL}"
    return 0
  fi

  if is_port_in_use "${SERVER_PORT}"; then
    print_warn "Puerto ${SERVER_PORT} ocupado. Intentando liberar..."
    local old_pid
    old_pid=$(lsof -ti ":${SERVER_PORT}" 2>/dev/null || true)
    if [[ -n "${old_pid}" ]]; then
      kill "${old_pid}" 2>/dev/null || true
      sleep 1
    fi
  fi

  cd_project
  local log_file
  log_file="$(get_log_file server)"

  print_step "Iniciando servidor Express en puerto ${SERVER_PORT}..."
  nohup node server.js > "${log_file}" 2>&1 &
  echo $! > "$(get_pid_file server)"

  sleep 2

  if is_process_running "server"; then
    print_success "Servidor iniciado."
    print_info "URL:    ${SERVER_URL}"
    print_info "Admin:  ${SERVER_URL}/admin/"
    print_info "Logs:   ${log_file}"
    print_info "PID:    $(cat "$(get_pid_file server)")"
  else
    print_error "No se pudo iniciar el servidor. Revisa los logs:"
    tail -20 "${log_file}" 2>/dev/null || true
    return 1
  fi
}

start_server_dev() {
  ensure_runtime_dir
  require_node || return 1
  require_dependencies || return 1

  if is_process_running "server-dev"; then
    print_warn "El servidor dev ya está corriendo."
    print_info "URL: ${SERVER_URL}"
    return 0
  fi

  if is_port_in_use "${SERVER_PORT}"; then
    print_warn "Puerto ${SERVER_PORT} ocupado. Intentando liberar..."
    local old_pid
    old_pid=$(lsof -ti ":${SERVER_PORT}" 2>/dev/null || true)
    if [[ -n "${old_pid}" ]]; then
      kill "${old_pid}" 2>/dev/null || true
      sleep 1
    fi
  fi

  cd_project
  local log_file
  log_file="$(get_log_file server-dev)"

  print_step "Iniciando servidor con --watch (hot reload)..."
  nohup npm run dev > "${log_file}" 2>&1 &
  echo $! > "$(get_pid_file server-dev)"

  sleep 2

  if is_process_running "server-dev"; then
    print_success "Servidor dev iniciado (hot reload activo)."
    print_info "URL:  ${SERVER_URL}"
    print_info "Logs: ${log_file}"
    print_info "PID:  $(cat "$(get_pid_file server-dev)")"
  else
    print_error "No se pudo iniciar el servidor dev. Revisa los logs:"
    tail -20 "${log_file}" 2>/dev/null || true
    return 1
  fi
}

show_status() {
  ensure_runtime_dir
  separator
  echo -e "${BOLD}Estado de servicios${NC}"
  separator

  local any_running=false

  if is_process_running "server"; then
    any_running=true
    echo -e "  ${GREEN}●${NC} Servidor      ${DIM}→${NC} ${SERVER_URL}  ${DIM}(PID $(cat "$(get_pid_file server)"))${NC}"
  else
    echo -e "  ${RED}○${NC} Servidor      ${DIM}→ detenido${NC}"
  fi

  if is_process_running "server-dev"; then
    any_running=true
    echo -e "  ${GREEN}●${NC} Servidor Dev  ${DIM}→${NC} ${SERVER_URL}  ${DIM}(PID $(cat "$(get_pid_file server-dev)"))${NC}"
  else
    echo -e "  ${RED}○${NC} Servidor Dev  ${DIM}→ detenido${NC}"
  fi

  separator
  echo -e "${BOLD}Puertos${NC}"
  separator

  if is_port_in_use "${SERVER_PORT}"; then
    echo -e "  ${GREEN}●${NC} Puerto ${SERVER_PORT}  ${DIM}(en uso)${NC}"
  else
    echo -e "  ${RED}○${NC} Puerto ${SERVER_PORT}  ${DIM}(libre)${NC}"
  fi

  separator
  echo -e "${BOLD}Proyecto${NC}"
  separator
  echo -e "  Nombre:       $(get_package_name)"
  echo -e "  Versión:      $(get_package_version)"
  echo -e "  Raíz:         ${PROJECT_ROOT}"
  echo -e "  node_modules: $([[ -d "${PROJECT_ROOT}/node_modules" ]] && echo -e "${GREEN}sí${NC}" || echo -e "${RED}no${NC}")"
  echo -e "  Productos:    $(python3 -c "import json; print(len(json.load(open('${PROJECT_ROOT}/data/productos.json'))))" 2>/dev/null || echo "?")"

  if ! $any_running; then
    echo ""
    print_info "Ningún servicio activo. Usa opción 1 o 2 para iniciar."
  fi
}

health_check() {
  separator
  echo -e "${BOLD}Health Check${NC}"
  separator

  local all_ok=true

  if is_process_running "server" || is_process_running "server-dev"; then
    if curl -sf --max-time 3 "${SERVER_URL}" &>/dev/null; then
      print_success "Servidor (${SERVER_URL}) — OK"
    else
      print_warn "Servidor corriendo pero no responde en ${SERVER_URL}"
      all_ok=false
    fi
  else
    print_info "Servidor — no iniciado (omitido)"
  fi

  if curl -sf --max-time 3 "${SERVER_URL}" &>/dev/null; then
    separator
    echo -e "${BOLD}Endpoints${NC}"
    separator

    local endpoints=(
      "/api/productos"
      "/api/config"
    )
    for ep in "${endpoints[@]}"; do
      local code
      code=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 3 "${SERVER_URL}${ep}" 2>/dev/null || echo "000")
      if [[ "${code}" == "200" ]]; then
        echo -e "  ${GREEN}✔${NC} ${ep}  ${DIM}(${code})${NC}"
      else
        echo -e "  ${RED}✖${NC} ${ep}  ${DIM}(${code})${NC}"
        all_ok=false
      fi
    done

    separator
    echo -e "${BOLD}Páginas${NC}"
    separator

    local pages=(
      "/"
      "/admin/"
    )
    for pg in "${pages[@]}"; do
      local code
      code=$(curl -sf -o /dev/null -w "%{http_code}" --max-time 3 "${SERVER_URL}${pg}" 2>/dev/null || echo "000")
      if [[ "${code}" == "200" ]]; then
        echo -e "  ${GREEN}✔${NC} ${pg}  ${DIM}(${code})${NC}"
      else
        echo -e "  ${RED}✖${NC} ${pg}  ${DIM}(${code})${NC}"
        all_ok=false
      fi
    done
  fi

  separator
  if $all_ok; then
    print_success "Health check completado."
  else
    print_warn "Health check con advertencias."
  fi
}

install_deps() {
  require_node || return 1
  cd_project
  print_step "Instalando dependencias..."
  npm install
  print_success "Dependencias instaladas."
}

show_logs() {
  ensure_runtime_dir
  separator
  echo -e "${BOLD}Logs disponibles${NC}"
  separator

  local has_logs=false

  for svc in server server-dev; do
    local log_file
    log_file="$(get_log_file "${svc}")"
    if [[ -f "${log_file}" ]]; then
      has_logs=true
      echo -e "${BOLD}${svc}:${NC} ${log_file}"
      echo -e "${DIM}── últimas 30 líneas ──${NC}"
      tail -30 "${log_file}" 2>/dev/null || echo "(vacío)"
      separator
    fi
  done

  if ! $has_logs; then
    print_info "No hay logs. Inicia un servicio primero."
  fi
}

show_project_info() {
  separator
  echo -e "${BOLD}Información del proyecto${NC}"
  separator
  echo -e "  Nombre:      $(get_package_name)"
  echo -e "  Versión:     $(get_package_version)"
  echo -e "  Node.js:     $(node -v 2>/dev/null || echo 'N/A')"
  echo -e "  npm:         $(npm -v 2>/dev/null || echo 'N/A')"
  echo -e "  Directorio:  ${PROJECT_ROOT}"
  separator
  echo -e "${BOLD}Stack${NC}"
  separator
  echo "  Node.js + Express (API REST)"
  echo "  HTML5 + CSS3 + Vanilla JS (SPA)"
  echo "  GSAP + AOS + Rive (animaciones)"
  echo "  Datos: JSON files"
  separator
  echo -e "${BOLD}Rutas${NC}"
  separator
  echo "  /             → Catálogo + Hero"
  echo "  /servicios    → Servicios"
  echo "  /nosotros     → Nosotros"
  echo "  /contacto     → Contacto"
  echo "  /admin/       → Panel Admin"
  separator
  echo -e "${BOLD}API${NC}"
  separator
  echo "  GET  /api/productos       → Listar productos"
  echo "  POST /api/auth/login       → Login"
  echo "  POST /api/carrito/agregar  → Agregar al carrito"
  echo "  POST /api/checkout         → Checkout"
  echo "  POST /api/chat             → Chatbot"
  separator
  echo -e "${BOLD}Usuarios demo${NC}"
  separator
  echo "  admin / admin    → Administrador"
  echo "  cliente / cliente → Cliente"
}

check_requirements() {
  separator
  echo -e "${BOLD}Verificación de requisitos${NC}"
  separator

  local all_ok=true

  if command -v node &>/dev/null; then
    local node_ver
    node_ver=$(node -v | sed 's/v//')
    local node_major
    node_major=$(echo "${node_ver}" | cut -d. -f1)
    if [[ "${node_major}" -ge 18 ]]; then
      print_success "Node.js ${node_ver} (≥ 18 requerido)"
    else
      print_warn "Node.js ${node_ver} — se recomienda v18+"
      all_ok=false
    fi
  else
    print_error "Node.js — NO instalado"
    all_ok=false
  fi

  if command -v npm &>/dev/null; then
    print_success "npm $(npm -v)"
  else
    print_error "npm — NO instalado"
    all_ok=false
  fi

  if command -v curl &>/dev/null; then
    print_success "curl disponible"
  else
    print_warn "curl no disponible — health check limitado"
  fi

  if [[ -d "${PROJECT_ROOT}/node_modules" ]]; then
    print_success "node_modules presente"
  else
    print_warn "node_modules ausente — ejecuta 'Instalar dependencias'"
  fi

  local prod_count
  prod_count=$(python3 -c "import json; print(len(json.load(open('${PROJECT_ROOT}/data/productos.json'))))" 2>/dev/null || echo "?")
  print_success "Productos en catálogo: ${prod_count}"

  separator
  if $all_ok; then
    print_success "Sistema listo para desarrollo."
  else
    print_warn "Corrige los problemas antes de continuar."
  fi
}

open_browser() {
  if is_process_running "server" || is_process_running "server-dev"; then
    print_step "Abriendo ${SERVER_URL}..."
    open_url "${SERVER_URL}"
  else
    print_warn "No hay servicios activos."
    read -rp "¿Iniciar servidor? [S/n]: " start
    if [[ "${start,,}" != "n" && "${start,,}" != "no" ]]; then
      start_server && open_url "${SERVER_URL}"
    fi
  fi
}

restart_services() {
  if is_process_running "server"; then
    print_step "Reiniciando servidor..."
    stop_service "server"
    start_server
  elif is_process_running "server-dev"; then
    print_step "Reiniciando servidor dev..."
    stop_service "server-dev"
    start_server_dev
  else
    print_warn "No hay servicios activos para reiniciar."
    read -rp "¿Iniciar servidor? [S/n]: " start
    if [[ "${start,,}" != "n" && "${start,,}" != "no" ]]; then
      start_server
    fi
  fi
}
