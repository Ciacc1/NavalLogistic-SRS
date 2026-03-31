.PHONY: help up down logs build clean test install dev

help:
	@echo "NavalLogistic Simulators - Makefile Commands"
	@echo "=============================================="
	@echo ""
	@echo "Development Commands:"
	@echo "  make up          - Start all containers with docker-compose"
	@echo "  make down        - Stop all containers"
	@echo "  make logs        - View container logs (tail mode)"
	@echo "  make build       - Build Docker images"
	@echo "  make rebuild     - Rebuild Docker images from scratch"
	@echo "  make clean       - Remove containers, images, volumes"
	@echo ""
	@echo "Testing Commands:"
	@echo "  make test        - Run basic tests"
	@echo "  make test-api    - Test Disaster API endpoints"
	@echo "  make test-kafka  - Test Kafka connectivity"
	@echo ""
	@echo "Development Setup:"
	@echo "  make install     - Install all dependencies locally"
	@echo "  make dev         - Start simulators in development mode (requires local setup)"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make ps          - Show running containers"
	@echo "  make shell-fleet - Open shell in fleet-simulator container"
	@echo "  make shell-cargo - Open shell in cargo-simulator container"
	@echo "  make shell-disaster - Open shell in disaster-simulator container"
	@echo ""

# Docker Compose Commands
up:
	@echo "🚀 Starting simulators..."
	docker-compose up --build -d

down:
	@echo "🛑 Stopping simulators..."
	docker-compose down

logs:
	@echo "📋 Viewing logs (press Ctrl+C to exit)..."
	docker-compose logs -f

build:
	@echo "🔨 Building Docker images..."
	docker-compose build

rebuild:
	@echo "🔨 Rebuilding Docker images from scratch..."
	docker-compose build --no-cache

clean:
	@echo "🧹 Cleaning up containers, images, and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f

ps:
	@echo "📊 Running containers:"
	docker-compose ps

# Testing
test: up
	@echo "⏳ Waiting for services to be ready (10 seconds)..."
	@sleep 10
	@echo "🧪 Running tests..."
	@bash simulators/test.sh || true

test-api:
	@echo "🧪 Testing Disaster Simulator API..."
	@curl -s http://localhost:3001/health | jq . || echo "API not responding"

test-kafka:
	@echo "🧪 Testing Kafka..."
	@docker-compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092 2>/dev/null || echo "Kafka not responding"

# Local Development Setup
install:
	@echo "📦 Installing dependencies for all simulators..."
	@cd simulators/fleet-simulator && npm install
	@cd simulators/cargo-simulator && npm install  
	@cd simulators/disaster-simulator && npm install
	@echo "✓ Dependencies installed"

dev-fleet:
	@echo "🚢 Starting Fleet Simulator in dev mode..."
	@cd simulators/fleet-simulator && npm run dev

dev-cargo:
	@echo "📦 Starting Cargo Simulator in dev mode..."
	@cd simulators/cargo-simulator && npm run dev

dev-disaster:
	@echo "🌊 Starting Disaster Simulator in dev mode..."
	@cd simulators/disaster-simulator && npm run dev

# Container Shell Access
shell-fleet:
	@echo "📊 Entering fleet-simulator container shell..."
	@docker-compose exec fleet-simulator sh

shell-cargo:
	@echo "📊 Entering cargo-simulator container shell..."
	@docker-compose exec cargo-simulator sh

shell-disaster:
	@echo "📊 Entering disaster-simulator container shell..."
	@docker-compose exec disaster-simulator sh

# Convenience targets
status: ps logs-short

logs-short:
	@docker-compose logs --tail=20

restart: down up

full-clean: clean
	@echo "🧹 Full cleanup completed"
