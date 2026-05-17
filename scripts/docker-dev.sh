#!/bin/bash

# Development helper script for Docker

set -e

echo "🐳 MediaMTX Dashboard - Docker Development Helper"
echo ""

compose_cmd=()

resolve_compose() {
  if docker compose version > /dev/null 2>&1; then
    compose_cmd=(docker compose)
  elif command -v docker-compose > /dev/null 2>&1; then
    compose_cmd=(docker-compose)
  else
    echo "❌ Docker Compose is not installed. Install Docker Compose v2 or the legacy docker-compose binary."
    exit 1
  fi
}

compose() {
  "${compose_cmd[@]}" "$@"
}

resolve_compose

case "$1" in
  start)
    echo "Starting services..."
    compose up -d
    echo "✅ Services started!"
    echo "Dashboard: http://localhost:3000"
    echo "MediaMTX API: http://localhost:9997"
    ;;
  
  stop)
    echo "Stopping services..."
    compose down
    echo "✅ Services stopped!"
    ;;
  
  restart)
    echo "Restarting services..."
    compose restart
    echo "✅ Services restarted!"
    ;;
  
  logs)
    echo "Showing logs (Ctrl+C to exit)..."
    compose logs -f
    ;;
  
  rebuild)
    echo "Rebuilding services..."
    compose down
    compose build --no-cache
    compose up -d
    echo "✅ Services rebuilt and started!"
    ;;
  
  clean)
    echo "Cleaning up..."
    compose down -v
    docker system prune -f
    echo "✅ Cleanup complete!"
    ;;
  
  status)
    echo "Service status:"
    compose ps
    ;;
  
  shell)
    if [ "$2" = "dashboard" ]; then
      compose exec dashboard sh
    elif [ "$2" = "mediamtx" ]; then
      compose exec mediamtx sh
    else
      echo "Usage: $0 shell [dashboard|mediamtx]"
      exit 1
    fi
    ;;
  
  *)
    echo "Usage: $0 {start|stop|restart|logs|rebuild|clean|status|shell}"
    echo ""
    echo "Commands:"
    echo "  start    - Start all services"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  logs     - Show logs from all services"
    echo "  rebuild  - Rebuild and restart services"
    echo "  clean    - Remove containers, volumes, and images"
    echo "  status   - Show service status"
    echo "  shell    - Open shell (usage: shell [dashboard|mediamtx])"
    exit 1
    ;;
esac
