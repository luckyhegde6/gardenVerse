#!/bin/bash
# GardenVerse Development Setup Script
set -e

echo "============================================"
echo "  GardenVerse - Development Setup"
echo "============================================"

# Check prerequisites
echo "[1/6] Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Error: Docker is required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Error: Docker Compose is required"; exit 1; }

echo "  Node.js: $(node --version)"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $(docker-compose --version)"

# Install root dependencies
echo "[2/6] Installing root dependencies..."
npm install

# Copy environment files if they don't exist
echo "[3/6] Setting up environment files..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  Created .env from .env.example"
  echo "  WARNING: Update .env with your secrets!"
fi

# Start infrastructure
echo "[4/6] Starting infrastructure (Postgres, Redis, MQTT)..."
docker-compose up -d postgres redis mosquitto

# Wait for services
echo "  Waiting for services to be healthy..."
sleep 5

# Generate Prisma client
echo "[5/6] Generating Prisma client..."
cd packages/backend
npx prisma generate
npx prisma migrate dev --name init
cd ../..

# Install all workspace dependencies
echo "[6/6] Installing workspace dependencies..."
npm install

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "Start development servers:"
echo "  Backend:  npm run backend:dev"
echo "  Mobile:   npm run mobile:dev"
echo "  Admin:    npm run admin:dev"
echo "  AI:       npm run ai:dev"
echo "  IoT:      cd services/iot/simulator && npm start"
echo ""
echo "Access endpoints:"
echo "  Backend:  http://localhost:4000"
echo "  Admin:    http://localhost:3000"
echo "  AI:       http://localhost:8000"
echo "  MQTT:     localhost:1883"
echo ""
echo "Default database:"
echo "  Host:     localhost:5432"
echo "  Database: gardenverse"
echo "  User:     gardenverse"
echo "  Password: gardenverse123"
