#!/usr/bin/env bash
# local-stack.sh — Start/stop the full MACP backend stack in Docker
# and run the UI Console against real services.
#
# Usage:
#   ./scripts/local-stack.sh up      # Start backends + UI dev server
#   ./scripts/local-stack.sh down    # Stop and clean up
#   ./scripts/local-stack.sh status  # Check service health

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.e2e.yml"
COMPOSE_LOCAL="$PROJECT_DIR/docker-compose.local.yml"
COMPOSE_CMD="docker compose -f $COMPOSE_FILE -f $COMPOSE_LOCAL"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
fail()  { echo -e "${RED}[fail]${NC}  $*"; exit 1; }

check_docker() {
  if ! docker info &>/dev/null; then
    fail "Docker is not running. Please start Docker Desktop and try again."
  fi
}

health_check() {
  local name="$1" url="$2" retries="${3:-20}" delay="${4:-3}"
  for i in $(seq 1 "$retries"); do
    if curl -sf "$url" &>/dev/null; then
      ok "$name is healthy"
      return 0
    fi
    echo -n "."
    sleep "$delay"
  done
  warn "$name did not become healthy at $url (tried ${retries} times)"
  return 1
}

print_status() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  MACP Local Stack${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${GREEN}PostgreSQL${NC}        localhost:5434"
  echo -e "  ${GREEN}Runtime (gRPC)${NC}    localhost:50051"
  echo -e "  ${GREEN}Control Plane${NC}     localhost:3001    /healthz"
  echo -e "  ${GREEN}Examples Service${NC}  localhost:3100    /healthz"
  echo -e "  ${GREEN}UI Console${NC}        localhost:3000    (Next.js)"
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
  echo ""
}

cmd_up() {
  check_docker

  info "Starting backend services via Docker Compose (using pre-built images)..."
  $COMPOSE_CMD up -d --wait

  echo ""
  info "Waiting for services to become healthy..."
  health_check "Control Plane"     "http://localhost:3001/healthz"
  health_check "Examples Service"  "http://localhost:3100/healthz"

  print_status

  info "Starting UI Console in real mode (npm run dev:e2e)..."
  info "Press Ctrl+C to stop the dev server (backends keep running)."
  echo ""

  cd "$PROJECT_DIR"
  exec npm run dev:e2e
}

cmd_down() {
  info "Stopping all backend services..."
  $COMPOSE_CMD down -v
  ok "All services stopped and volumes removed."
}

cmd_status() {
  echo ""
  info "Docker Compose services:"
  echo ""
  $COMPOSE_CMD ps 2>/dev/null || warn "No services running."
  echo ""

  info "Health checks:"
  health_check "Control Plane"     "http://localhost:3001/healthz" 1 0 || true
  health_check "Examples Service"  "http://localhost:3100/healthz" 1 0 || true
  echo ""
}

case "${1:-}" in
  up)     cmd_up     ;;
  down)   cmd_down   ;;
  status) cmd_status ;;
  *)
    echo "Usage: $0 {up|down|status}"
    echo ""
    echo "  up      Start all backend services in Docker + UI dev server"
    echo "  down    Stop all services and remove volumes"
    echo "  status  Show running services and health"
    exit 1
    ;;
esac
