#!/bin/bash

echo "🔍 MediaMTX Docker Troubleshooting"
echo "=================================="
echo ""

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
    echo "   ✅ Docker Compose is installed: $(docker-compose --version)"
else
    echo "   ❌ Docker Compose is not installed"
    exit 1
fi

# Check network connectivity
echo ""
echo "3. Checking network connectivity..."
if ping -c 1 dl-cdn.alpinelinux.org &> /dev/null; then
    echo "   ✅ Can reach Alpine package servers"
else
    echo "   ⚠️  Cannot reach Alpine servers (will use Debian image)"
    echo "   Run: docker-compose build --build-arg DOCKERFILE=Dockerfile.debian"
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

# Check disk space
echo ""
echo "5. Checking disk space..."
available=$(df -h . | awk 'NR==2 {print $4}')
echo "   Available space: $available"

# Try building
echo ""
echo "6. Attempting to build..."
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
