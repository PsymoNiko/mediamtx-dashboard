#!/bin/bash

echo "🔧 Setting up pnpm environment for Docker..."
echo ""

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 pnpm not found, installing..."
    npm install -g pnpm
    echo "✅ pnpm installed"
else
    echo "✅ pnpm is already installed: $(pnpm --version)"
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    exit 1
fi

# Generate pnpm-lock.yaml if it doesn't exist
if [ ! -f "pnpm-lock.yaml" ]; then
    echo "📦 pnpm-lock.yaml not found, generating..."
    pnpm install --lockfile-only
    echo "✅ pnpm-lock.yaml created"
else
    echo "✅ pnpm-lock.yaml exists"
fi

# Clean existing builds
echo ""
echo "🧹 Cleaning existing builds..."
rm -rf node_modules .next

# Verify pnpm-workspace.yaml
if [ ! -f "pnpm-workspace.yaml" ]; then
    echo "📝 Creating pnpm-workspace.yaml..."
    cat > pnpm-workspace.yaml << EOF
packages:
  - '.'
EOF
    echo "✅ pnpm-workspace.yaml created"
fi

echo ""
echo "✅ Environment ready for Docker build with pnpm!"
echo ""
echo "Next steps:"
echo "  1. docker-compose build --no-cache"
echo "  2. docker-compose up -d"
echo ""
echo "Or use development mode:"
echo "  docker-compose -f docker-compose.dev.yml up"
