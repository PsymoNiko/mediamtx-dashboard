#!/bin/bash
set -euo pipefail

echo "🔧 Setting up Docker build environment with pnpm..."
echo ""

# Verify package.json
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json not found!"
    exit 1
fi

# Ensure pnpm is available for lockfile maintenance
if ! command -v pnpm >/dev/null 2>&1; then
    echo "📦 pnpm not found, enabling with corepack..."
    if command -v corepack >/dev/null 2>&1; then
        corepack enable
    fi
fi

if ! command -v pnpm >/dev/null 2>&1; then
    echo "📦 corepack did not provide pnpm, installing pnpm globally..."
    npm install -g pnpm
fi

# Check if pnpm-lock.yaml exists
if [ ! -f "pnpm-lock.yaml" ]; then
    echo "📦 pnpm-lock.yaml not found, generating..."
    pnpm install --lockfile-only
    echo "✅ pnpm-lock.yaml created"
else
    echo "✅ pnpm-lock.yaml exists"
fi

# Clean pnpm store metadata when available
echo ""
echo "🧹 Pruning pnpm store..."
pnpm store prune || true

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
