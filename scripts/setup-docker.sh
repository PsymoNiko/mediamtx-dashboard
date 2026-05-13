#!/bin/bash

echo "🔧 Setting up Docker build environment..."
echo ""

# Verify package.json
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json not found!"
    exit 1
fi

# Verify pnpm lockfile used by the Docker builds
if [ -f "pnpm-lock.yaml" ]; then
    echo "✅ pnpm-lock.yaml exists"
else
    echo "❌ pnpm-lock.yaml not found!"
    echo "   Run: pnpm install --lockfile-only"
    exit 1
fi

# Remove node_modules if exists
if [ -d "node_modules" ]; then
    echo "🗑️  Removing existing node_modules..."
    rm -rf node_modules
fi

# Remove .next if exists
if [ -d ".next" ]; then
    echo "🗑️  Removing existing .next..."
    rm -rf .next
fi

echo ""
echo "✅ Environment ready for Docker build!"
echo ""
echo "Next steps:"
echo "  1. docker-compose build --no-cache"
echo "  2. docker-compose up -d"
