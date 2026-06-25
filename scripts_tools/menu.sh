#!/usr/bin/env bash
# Web Merge Final — Menú interactivo de herramientas de desarrollo
#
# Uso:
#   ./scripts_tools/menu.sh           Menú interactivo
#   ./scripts_tools/menu.sh --server  Iniciar servidor producción
#   ./scripts_tools/menu.sh --dev     Iniciar servidor con hot reload
#   ./scripts_tools/menu.sh --help    Ver ayuda

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "${SCRIPT_DIR}/lib/common.sh"
# shellcheck source=lib/services.sh
source "${SCRIPT_DIR}/lib/services.sh"

show_help() {
  cat <<EOF
${BOLD}Web Merge Final — Dev Tools${NC}

${BOLD}Uso:${NC}
  ./scripts_tools/menu.sh [opción]

${BOLD}Opciones CLI:${NC}
  --server, -s     Iniciar servidor producción (node server.js)
  --dev, -d        Iniciar servidor con hot reload (--watch)
  --stop           Detener todos los servicios
  --restart, -r    Reiniciar servicio activo
  --status         Estado de servicios
  --install, -i    Instalar dependencias
  --logs           Ver logs
  --open, -o       Abrir en navegador
  --info           Información del proyecto
  --check          Verificar requisitos
  --health         Health check
  --help           Mostrar esta ayuda

${BOLD}Ejemplos:${NC}
  ./scripts_tools/menu.sh --server
  ./scripts_tools/menu.sh --dev
  ./scripts_tools/menu.sh --status
  ./scripts_tools/menu.sh --health
EOF
}

show_menu() {
  print_header
  echo -e "  ${DIM}Proyecto:${NC} $(get_package_name) v$(get_package_version)"
  echo -e "  ${DIM}Ruta:${NC}     ${PROJECT_ROOT}"
  echo ""
  separator
  echo -e "  ${BOLD}SERVICIOS${NC}"
  echo "    1)  Iniciar servidor (producción)"
  echo "    2)  Iniciar servidor dev (hot reload)"
  echo "    3)  Detener todos los servicios"
  echo "    4)  Reiniciar servicio activo"
  echo "    5)  Estado de servicios"
  echo ""
  echo -e "  ${BOLD}PROYECTO${NC}"
  echo "    6)  Instalar dependencias"
  echo "    7)  Ver logs"
  echo "    8)  Abrir en navegador"
  echo ""
  echo -e "  ${BOLD}CONSULTAS${NC}"
  echo "    9)  Información del proyecto"
  echo "   10)  Verificar requisitos del sistema"
  echo "   11)  Health check (consultar URLs)"
  echo ""
  echo "    0)  Salir"
  separator
}

run_interactive() {
  while true; do
    show_menu
    read -rp "$(echo -e "${CYAN}Selecciona una opción:${NC} ")" choice
    echo ""

    case "${choice}" in
      1)  start_server; pause ;;
      2)  start_server_dev; pause ;;
      3)  stop_all_services; print_success "Todos los servicios detenidos."; pause ;;
      4)  restart_services; pause ;;
      5)  show_status; pause ;;
      6)  install_deps; pause ;;
      7)  show_logs; pause ;;
      8)  open_browser; pause ;;
      9)  show_project_info; pause ;;
      10) check_requirements; pause ;;
      11) health_check; pause ;;
      0|q|Q|exit)
        stop_all_services 2>/dev/null || true
        echo -e "${GREEN}¡Hasta luego!${NC}"
        exit 0
        ;;
      *)
        print_error "Opción inválida: ${choice}"
        pause
        ;;
    esac
  done
}

# ── CLI mode ────────────────────────────────────────────────

if [[ $# -gt 0 ]]; then
  case "${1}" in
    --server|-s)    start_server ;;
    --dev|-d)       start_server_dev ;;
    --stop)         stop_all_services; print_success "Servicios detenidos." ;;
    --restart|-r)   restart_services ;;
    --status)       show_status ;;
    --install|-i)   install_deps ;;
    --logs)         show_logs ;;
    --open|-o)      open_browser ;;
    --info)         show_project_info ;;
    --check)        check_requirements ;;
    --health)       health_check ;;
    --help|help)    show_help ;;
    *)
      print_error "Opción desconocida: ${1}"
      echo ""
      show_help
      exit 1
      ;;
  esac
else
  run_interactive
fi
