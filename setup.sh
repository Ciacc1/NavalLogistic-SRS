#!/bin/bash
# Installation script per Linux/Mac

set -e

echo "🚀 NavalLogistic Simulators - Setup"
echo "===================================="
echo ""

# Check Docker
echo "📦 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker: https://docker.com"
    exit 1
fi
echo "✓ Docker found: $(docker --version)"

# Check Docker Compose
echo "📦 Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install: https://docs.docker.com/compose/install/"
    exit 1
fi
echo "✓ Docker Compose found: $(docker-compose --version)"

# Check Node (optional, for dev)
if command -v node &> /dev/null; then
    echo "✓ Node.js found: $(node --version)"
else
    echo "⚠️  Node.js not found (needed for local development, not for Docker)"
fi

echo ""
echo "✅ All prerequisites met!"
echo ""
echo "🚀 Next steps:"
echo ""
echo "1. Start the simulators:"
echo "   docker-compose up --build"
echo ""
echo "2. Test the APIs:"
echo "   bash simulators/test.sh"
echo ""
echo "3. Run in development (local):"
echo "   Install Node.js if not already installed"
echo "   make install"
echo "   make dev-fleet    # in one terminal"
echo "   make dev-cargo    # in another terminal"
echo "   make dev-disaster # in another terminal"
echo ""
