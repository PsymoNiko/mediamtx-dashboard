#!/bin/bash

# Development helper script for Docker

set -e

echo "🐳 MediaMTX Dashboard - Docker Development Helper"
echo ""

case "$1" in
  start)
    echo "Starting services..."
    docker-compose up -d
    echo "✅ Services started!"
    echo "Dashboard: http://localhost:3000"
    echo "MediaMTX API: http://localhost:9997"
    ;;
  
  stop)
    echo "Stopping services..."
    docker-compose down
    echo "✅ Services stopped!"
    ;;
  
  restart)
    echo "Restarting services..."
    docker-compose restart
    echo "✅ Services restarted!"
    ;;
  
  logs)
    echo "Showing logs (Ctrl+C to exit)..."
    docker-compose logs -f
    ;;
  
  rebuild)
    echo "Rebuilding services..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo "✅ Services rebuilt and started!"
    ;;
  
  clean)
    echo "Cleaning up..."
    docker-compose down -v
    docker system prune -f
    echo "✅ Cleanup complete!"
    ;;
  
  status)
    echo "Service status:"
    docker-compose ps
    ;;
  
  shell)
    if [ "$2" = "dashboard" ]; then
      docker-compose exec dashboard sh
    elif [ "$2" = "mediamtx" ]; then
      docker-compose exec mediamtx sh
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
