#!/bin/bash

# Casa de Valores Development Startup Script

echo "🏦 Starting Casa de Valores Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p codigo/logs
mkdir -p codigo/uploads
mkdir -p codigo/data/mysql
mkdir -p codigo/data/mongodb
mkdir -p codigo/data/redis

# Copy environment file if it doesn't exist
if [ ! -f codigo/.env ]; then
    echo "📋 Creating .env file from template..."
    cp codigo/.env.example codigo/.env
    echo "⚠️  Please review and update the .env file with your configuration"
fi

# Start infrastructure services first
echo "🚀 Starting infrastructure services (databases, message queue)..."
docker-compose -f codigo/docker-compose.yml up -d mysql mongodb redis rabbitmq

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 30

# Check database connections
echo "🔍 Checking database connections..."

# Check MySQL
until docker-compose -f codigo/docker-compose.yml exec mysql mysqladmin ping -h"localhost" --silent; do
    echo "⏳ Waiting for MySQL..."
    sleep 2
done
echo "✅ MySQL is ready"

# Check MongoDB
until docker-compose -f codigo/docker-compose.yml exec mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    echo "⏳ Waiting for MongoDB..."
    sleep 2
done
echo "✅ MongoDB is ready"

# Check Redis
until docker-compose -f codigo/docker-compose.yml exec redis redis-cli ping > /dev/null 2>&1; do
    echo "⏳ Waiting for Redis..."
    sleep 2
done
echo "✅ Redis is ready"

# Start microservices
echo "🚀 Starting microservices..."
docker-compose -f codigo/docker-compose.yml up -d api-gateway user-service trading-service market-data-service portfolio-service risk-service compliance-service

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 20

# Check service health
echo "🔍 Checking service health..."

services=("api-gateway:8000" "user-service:8001" "trading-service:8002" "market-data-service:8003")

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "⚠️  $name may not be ready yet"
    fi
done

# Start frontend (optional)
read -p "🌐 Do you want to start the frontend? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting frontend..."
    docker-compose -f codigo/docker-compose.yml up -d frontend
    echo "✅ Frontend started at http://localhost:4200"
fi

echo ""
echo "🎉 Casa de Valores Development Environment is ready!"
echo ""
echo "📊 Service URLs:"
echo "   API Gateway:     http://localhost:8000"
echo "   User Service:    http://localhost:8001"
echo "   Trading Service: http://localhost:8002"
echo "   Market Data:     http://localhost:8003"
echo "   Portfolio:       http://localhost:8004"
echo "   Risk Service:    http://localhost:8005"
echo "   Compliance:      http://localhost:8006"
echo ""
echo "🗄️  Database URLs:"
echo "   MySQL:           localhost:3306"
echo "   MongoDB:         localhost:27017"
echo "   Redis:           localhost:6379"
echo "   RabbitMQ:        localhost:15672 (admin/adminpassword)"
echo ""
echo "📝 Logs: docker-compose -f codigo/docker-compose.yml logs -f [service-name]"
echo "🛑 Stop: docker-compose -f codigo/docker-compose.yml down"
echo ""