#!/bin/bash

echo "🔍 MediaMTX Docker Troubleshooting"
echo "=================================="
echo ""

COMPOSE_CMD=()

format_compose_cmd() {
    printf "%s" "${COMPOSE_CMD[*]}"
}

# Check Docker
echo "1. Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "   ✅ Docker is installed: $(docker --version)"
else
    echo "   ❌ Docker is not installed"
    exit 1
fi

# Check Docker Compose
echo ""
echo "2. Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD=(docker-compose)
    echo "   ✅ Docker Compose is installed: $(docker-compose --version)"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD=(docker compose)
    echo "   ✅ Docker Compose is installed: $(docker compose version)"
else
    echo "   ❌ Docker Compose is not installed"
    echo "   Install Docker Compose v2 or legacy docker-compose, then re-run this script"
    exit 1
fi

# Check network connectivity
echo ""
echo "3. Checking network connectivity..."
if ping -c 1 dl-cdn.alpinelinux.org &> /dev/null; then
    echo "   ✅ Can reach Alpine package servers"
else
    echo "   ⚠️  Cannot reach Alpine servers (will use Debian image)"
    echo "   Run: $(format_compose_cmd) build --build-arg DOCKERFILE=Dockerfile.debian"
fi

# Check ports
echo ""
echo "4. Checking if required ports are available..."
ports=(3000 8554 1935 8888 8889 9997 9998)
for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   ⚠️  Port $port is already in use"
    else
        echo "   ✅ Port $port is available"
    fi
done

# Check authenticated MediaMTX API path when the stack is already running
echo ""
echo "5. Checking MediaMTX API with configured credentials..."
if ! command -v curl &> /dev/null; then
    echo "   ⚠️  curl is not installed; skipping API credential check"
else
    api_port="${API_PORT:-9997}"
    mediamtx_username="${MEDIAMTX_USERNAME:-admin}"
    mediamtx_password="${MEDIAMTX_PASSWORD:-adminpass}"
    api_url="http://localhost:${api_port}/v3/config/global/get"
    http_status=$(curl -sS -o /dev/null -w "%{http_code}" -u "${mediamtx_username}:${mediamtx_password}" "$api_url" 2>/dev/null || true)

    case "$http_status" in
        200)
            echo "   ✅ MediaMTX API accepts credentials for user '${mediamtx_username}'"
            ;;
        000)
            echo "   ⚠️  MediaMTX API is not reachable at $api_url"
            echo "   Start the stack with: $(format_compose_cmd) up -d"
            ;;
        401|403)
            echo "   ❌ MediaMTX API rejected credentials for user '${mediamtx_username}'"
            echo "   Check MEDIAMTX_USERNAME/MEDIAMTX_PASSWORD and the login form defaults"
            ;;
        *)
            echo "   ⚠️  MediaMTX API returned HTTP $http_status at $api_url"
            ;;
    esac
fi

# Check disk space
echo ""
echo "6. Checking disk space..."
available=$(df -h . | awk 'NR==2 {print $4}')
echo "   Available space: $available"

# Try building
echo ""
echo "7. Attempting to build..."
echo "   Testing Alpine build..."
if docker build -f Dockerfile -t mediamtx-test:alpine . &> /dev/null; then
    echo "   ✅ Alpine build successful"
    docker rmi mediamtx-test:alpine &> /dev/null
else
    echo "   ❌ Alpine build failed"
    echo "   Trying Debian build..."
    if docker build -f Dockerfile.debian -t mediamtx-test:debian . &> /dev/null; then
        echo "   ✅ Debian build successful"
        docker rmi mediamtx-test:debian &> /dev/null
        echo ""
        echo "   💡 Recommendation: Use Dockerfile.debian"
        echo "   Edit docker-compose.yml and change:"
        echo "   dockerfile: Dockerfile"
        echo "   to:"
        echo "   dockerfile: Dockerfile.debian"
    else
        echo "   ❌ Debian build also failed"
    fi
fi

echo ""
echo "=================================="
echo "Troubleshooting complete!"
