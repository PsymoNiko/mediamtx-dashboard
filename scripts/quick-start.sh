#!/bin/bash

echo "🚀 MediaMTX Quick Start"
echo "======================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

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
        docker-compose -f docker-compose.local.yml up -d
        echo "Waiting for the MediaMTX API to accept the default credentials..."
        mediamtx_ready=0
        for attempt in {1..30}; do
            if curl -fsS -u admin:adminpass http://localhost:9997/v3/config/global/get > /dev/null 2>&1; then
                mediamtx_ready=1
                break
            fi
            sleep 1
        done
        if [ "$mediamtx_ready" != "1" ]; then
            echo "❌ MediaMTX API did not become ready with admin/adminpass."
            echo "   Check logs with: docker-compose -f docker-compose.local.yml logs mediamtx"
            exit 1
        fi
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
        docker-compose -f docker-compose.yml build --no-cache
        echo ""
        echo "Starting services..."
        docker-compose -f docker-compose.yml up -d
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
        docker-compose -f docker-compose.yml up -d
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
