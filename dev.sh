#!/bin/bash

# Development startup script

echo "🚀 Starting development server..."

# Проверяем .env
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Edit .env with your 3x-ui configuration"
fi

# Установим зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Проверяем nodemon
if ! npm list nodemon > /dev/null 2>&1; then
    echo "📥 Installing nodemon (dev dependency)..."
    npm install --save-dev nodemon
fi

echo "✅ Starting server with hot-reload..."
echo "🌐 Map will be available at: http://localhost:3000"
echo ""

npx nodemon server.js
