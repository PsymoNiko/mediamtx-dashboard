#!/bin/bash

# Development helper script for Docker

set -e

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "Docker Compose is required. Install Docker Compose v2 or docker-compose."
  exit 1
fi

echo "🐳 MediaMTX Dashboard - Docker Development Helper"
echo ""

case "$1" in
  start)
    echo "Starting services..."
    "${COMPOSE[@]}" up -d
    echo "✅ Services started!"
    echo "Dashboard: http://localhost:3000"
    echo "MediaMTX API: http://localhost:9997"
    ;;
  
  stop)
    echo "Stopping services..."
    "${COMPOSE[@]}" down
    echo "✅ Services stopped!"
    ;;
  
  restart)
    echo "Restarting services..."
    "${COMPOSE[@]}" restart
    echo "✅ Services restarted!"
    ;;
  
  logs)
    echo "Showing logs (Ctrl+C to exit)..."
    "${COMPOSE[@]}" logs -f
    ;;
  
  rebuild)
    echo "Rebuilding services..."
    "${COMPOSE[@]}" down
    "${COMPOSE[@]}" build --no-cache
    "${COMPOSE[@]}" up -d
    echo "✅ Services rebuilt and started!"
    ;;
  
  clean)
    echo "Cleaning up..."
    "${COMPOSE[@]}" down -v
    docker system prune -f
    echo "✅ Cleanup complete!"
    ;;
  
  status)
    echo "Service status:"
    "${COMPOSE[@]}" ps
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
