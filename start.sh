#!/bin/bash

echo "Starting 3x-ui Live Connections Map..."

if [ ! -f .env ]; then
    echo ".env not found"
    echo "Create it from .env.example and set your 3x-ui values"
    exit 1
fi

if [ ! -f ./data/GeoLite2-City.mmdb ]; then
    echo "GeoLite2-City.mmdb not found in ./data"
    echo "Place the MaxMind database at ./data/GeoLite2-City.mmdb"
    exit 1
fi

if ! command -v docker > /dev/null 2>&1; then
    echo "Docker is not installed"
    exit 1
fi

echo "Building and starting container..."
docker compose up --build -d

echo "Map available at: http://localhost:3000"
echo "API endpoint: http://localhost:3000/api/connections"
echo "Health check: http://localhost:3000/health"
echo "Logs: docker compose logs -f map-service"
echo "Stop: docker compose down"
