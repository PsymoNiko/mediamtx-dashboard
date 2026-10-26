#!/bin/bash

# pnpm-specific Docker management script

set -e

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose is required. Install Docker Compose v2 or docker-compose."
  exit 1
fi

echo "🚀 MediaMTX Dashboard - pnpm Docker Manager"
echo ""

case "$1" in
  setup)
    echo "Setting up pnpm environment..."
    chmod +x scripts/setup-pnpm.sh
    ./scripts/setup-pnpm.sh
    ;;
  
  build)
    echo "Building with pnpm..."
    "${COMPOSE[@]}" build --no-cache
    ;;
  
  build-dev)
    echo "Building development image with pnpm..."
    "${COMPOSE[@]}" -f docker-compose.dev.yml build --no-cache
    ;;
  
  start)
    echo "Starting services..."
    "${COMPOSE[@]}" up -d
    echo "✅ Services started!"
    echo "Dashboard: http://localhost:3000"
    echo "MediaMTX API: http://localhost:9997"
    ;;
  
  dev)
    echo "Starting in development mode with hot-reload..."
    "${COMPOSE[@]}" -f docker-compose.dev.yml up
    ;;
  
  stop)
    echo "Stopping services..."
    "${COMPOSE[@]}" down
    "${COMPOSE[@]}" -f docker-compose.dev.yml down 2>/dev/null || true
    echo "✅ Services stopped!"
    ;;
  
  restart)
    echo "Restarting services..."
    "${COMPOSE[@]}" restart
    echo "✅ Services restarted!"
    ;;
  
  logs)
    echo "Showing logs (Ctrl+C to exit)..."
    "${COMPOSE[@]}" logs -f "${2:-}"
    ;;
  
  clean)
    echo "Cleaning up..."
    "${COMPOSE[@]}" down -v
    "${COMPOSE[@]}" -f docker-compose.dev.yml down -v 2>/dev/null || true
    rm -rf node_modules .next
    docker system prune -f
    echo "✅ Cleanup complete!"
    ;;
  
  rebuild)
    echo "Full rebuild with pnpm..."
    $0 stop
    $0 clean
    $0 setup
    $0 build
    $0 start
    ;;
  
  shell)
    if [ "$2" = "dashboard" ]; then
      "${COMPOSE[@]}" exec dashboard sh
    elif [ "$2" = "mediamtx" ]; then
      "${COMPOSE[@]}" exec mediamtx sh
    else
      echo "Usage: $0 shell [dashboard|mediamtx]"
      exit 1
    fi
    ;;
  
  install)
    echo "Installing pnpm globally..."
    npm install -g pnpm
    echo "✅ pnpm installed: $(pnpm --version)"
    ;;
  
  status)
    echo "Service status:"
    "${COMPOSE[@]}" ps
    echo ""
    echo "Docker images:"
    docker images | grep mediamtx
    ;;
  
  test-pnpm)
    echo "Testing pnpm build locally..."
    pnpm install
    pnpm run build
    echo "✅ Local build successful!"
    ;;
  
  *)
    echo "Usage: $0 {setup|build|build-dev|start|dev|stop|restart|logs|clean|rebuild|shell|install|status|test-pnpm}"
    echo ""
    echo "Commands:"
    echo "  setup      - Setup pnpm environment and generate lockfile"
    echo "  build      - Build production Docker image with pnpm"
    echo "  build-dev  - Build development Docker image with pnpm"
    echo "  start      - Start all services in production mode"
    echo "  dev        - Start in development mode with hot-reload"
    echo "  stop       - Stop all services"
    echo "  restart    - Restart all services"
    echo "  logs       - Show logs (optional: logs dashboard|mediamtx)"
    echo "  clean      - Remove containers, volumes, node_modules, and lockfile"
    echo "  rebuild    - Full rebuild from scratch"
    echo "  shell      - Open shell (usage: shell [dashboard|mediamtx])"
    echo "  install    - Install pnpm globally"
    echo "  status     - Show service and image status"
    echo "  test-pnpm  - Test pnpm build locally before Docker"
    exit 1
    ;;
esac
