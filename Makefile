# ================================
# TATA Dashboard - Makefile
# Common Docker commands
# ================================

.PHONY: help build up down logs restart clean dev prod

# Default target
help:
	@echo "TATA Dashboard - Available Commands:"
	@echo ""
	@echo "  make build    - Build all Docker images"
	@echo "  make up       - Start all services"
	@echo "  make down     - Stop all services"
	@echo "  make restart  - Restart all services"
	@echo "  make logs     - View logs (follow mode)"
	@echo "  make clean    - Remove containers and volumes"
	@echo "  make dev      - Start development environment"
	@echo "  make prod     - Start production environment"
	@echo "  make status   - Show container status"
	@echo "  make shell-backend  - Open shell in backend container"
	@echo "  make shell-mongo    - Open MongoDB shell"

# Build all images
build:
	docker compose build

# Start services
up:
	docker compose up -d

# Stop services
down:
	docker compose down

# View logs
logs:
	docker compose logs -f

# Restart services
restart:
	docker compose restart

# Clean up everything
clean:
	docker compose down -v --remove-orphans
	docker system prune -f

# Development mode
dev:
	docker compose -f docker-compose.dev.yml up -d

# Production mode
prod:
	docker compose up -d --build

# Show status
status:
	docker compose ps

# Shell access
shell-backend:
	docker compose exec backend sh

shell-mongo:
	docker compose exec mongodb mongosh -u admin -p

# Rebuild specific service
rebuild-backend:
	docker compose build backend
	docker compose up -d backend

rebuild-frontend:
	docker compose build frontend
	docker compose up -d frontend

# Database backup
backup:
	docker compose exec mongodb mongodump --out /data/backup --username admin --password $${MONGO_ROOT_PASSWORD} --authenticationDatabase admin
	docker cp tata-mongodb:/data/backup ./backups/$(shell date +%Y%m%d_%H%M%S)

# Health check
health:
	@echo "Checking services health..."
	@curl -s http://localhost/health || echo "Nginx: DOWN"
	@curl -s http://localhost:5000/health || echo "Backend: DOWN"
	@docker compose exec mongodb mongosh --eval "db.adminCommand('ping')" --quiet || echo "MongoDB: DOWN"
