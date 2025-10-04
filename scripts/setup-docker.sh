#!/bin/bash

echo "🔧 Setting up Docker build environment..."
echo ""

# Check if package-lock.json exists
if [ ! -f "package-lock.json" ]; then
    echo "📦 package-lock.json not found, generating..."
    npm install --package-lock-only
    echo "✅ package-lock.json created"
else
    echo "✅ package-lock.json exists"
fi

# Verify package.json
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json not found!"
    exit 1
fi

# Clean npm cache
echo ""
echo "🧹 Cleaning npm cache..."
npm cache clean --force

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
