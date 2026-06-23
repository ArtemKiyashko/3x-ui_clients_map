#!/bin/bash

# 3x-ui Live Map Service - Start Script

echo "🌍 Starting 3x-ui Live Connections Map..."

# Проверяем .env
if [ ! -f .env ]; then
    echo "❌ .env not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your 3x-ui configuration"
    echo "Then run again: ./start.sh"
    exit 1
fi

# Проверяем Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

# Запускаем docker-compose
echo "📦 Building and starting containers..."
docker-compose up -d

echo "✅ Service started!"
echo ""
echo "🌐 Map available at: http://localhost:3000"
echo "📊 API endpoint: http://localhost:3000/api/connections"
echo "❤️  Health check: http://localhost:3000/health"
echo ""
echo "View logs:"
echo "  docker-compose logs -f map-service"
echo ""
echo "Stop service:"
echo "  docker-compose down"
