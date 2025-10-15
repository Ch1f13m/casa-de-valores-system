#!/bin/bash

# Casa de Valores Development Stop Script

echo "🛑 Stopping Casa de Valores Development Environment..."

# Stop all services
echo "⏹️  Stopping all services..."
docker-compose -f codigo/docker-compose.yml down

# Optional: Remove volumes (data will be lost)
read -p "🗑️  Do you want to remove all data volumes? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing volumes..."
    docker-compose -f codigo/docker-compose.yml down -v
    echo "✅ All data volumes removed"
fi

# Optional: Remove images
read -p "🗑️  Do you want to remove Docker images? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing images..."
    docker-compose -f codigo/docker-compose.yml down --rmi all
    echo "✅ All images removed"
fi

echo "✅ Casa de Valores Development Environment stopped"