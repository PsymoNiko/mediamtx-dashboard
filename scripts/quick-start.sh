#!/bin/bash

echo "🚀 MediaMTX Quick Start"
echo "======================="
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

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

resolve_compose

echo "Choose a start method:"
echo ""
echo "1. Start MediaMTX only (run dashboard locally with 'npm run dev')"
echo "2. Build and start everything with Docker (slower, production-like)"
echo "3. Start with pre-built image (if available)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Starting MediaMTX server only..."
        compose -f docker-compose.local.yml up -d
        echo ""
        echo "✅ MediaMTX is running!"
        echo ""
        echo "Next steps:"
        echo "  1. Install dependencies: npm install"
        echo "  2. Start dashboard: npm run dev"
        echo "  3. Open http://localhost:3000"
        echo ""
        echo "MediaMTX API: http://localhost:9997"
        ;;
    2)
        echo ""
        echo "Setting up environment..."
        chmod +x scripts/setup-docker.sh
        ./scripts/setup-docker.sh
        echo ""
        echo "Building Docker images (this may take a few minutes)..."
        compose -f docker-compose.yml build --no-cache
        echo ""
        echo "Starting services..."
        compose -f docker-compose.yml up -d
        echo ""
        echo "✅ Services are starting!"
        echo ""
        echo "Dashboard: http://localhost:3000"
        echo "MediaMTX API: http://localhost:9997"
        echo ""
        echo "View logs: docker-compose logs -f"
        ;;
    3)
        echo ""
        echo "Starting services with existing images..."
        compose -f docker-compose.yml up -d
        echo ""
        echo "✅ Services started!"
        echo ""
        echo "Dashboard: http://localhost:3000"
        echo "MediaMTX API: http://localhost:9997"
        ;;
    *)
        echo ""
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac
