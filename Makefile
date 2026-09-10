# ================================
# NPL DEF Dashboard - Makefile
#
# Production is deployed by Coolify from the root Dockerfile - there is no
# production docker-compose stack. The targets below cover local development
# and building/running that same production image on your own machine.
# ================================

DEV_COMPOSE := docker-compose.dev.yml
IMAGE       := npl-def-dashboard

.PHONY: help dev dev-down dev-logs dev-clean build run stop logs health

# Default target
help:
	@echo "NPL DEF Dashboard - Available Commands:"
	@echo ""
	@echo "  Local development (Postgres + hot-reload backend/frontend):"
	@echo "    make dev        - Start the development stack"
	@echo "    make dev-logs   - Follow development logs"
	@echo "    make dev-down   - Stop the development stack"
	@echo "    make dev-clean  - Stop it and delete its volumes"
	@echo ""
	@echo "  Production image (what Coolify builds and runs):"
	@echo "    make build      - Build the single-container image from ./Dockerfile"
	@echo "    make run        - Run it on http://localhost:8080 (needs DATABASE_URL)"
	@echo "    make logs       - Follow its logs"
	@echo "    make stop       - Stop and remove it"
	@echo "    make health     - Curl the health endpoint"

# ---------------------------------------------------------------- development
dev:
	docker compose -f $(DEV_COMPOSE) up -d

dev-logs:
	docker compose -f $(DEV_COMPOSE) logs -f

dev-down:
	docker compose -f $(DEV_COMPOSE) down

dev-clean:
	docker compose -f $(DEV_COMPOSE) down -v --remove-orphans

# ----------------------------------------------------------------- production
# Config is injected at runtime (see docker-entrypoint.sh), so the image is
# built once and configured per environment - no VITE_* build arguments.
build:
	docker build -t $(IMAGE) .

# DATABASE_URL, FRONTEND_URL and API_KEY are required in production; the server
# refuses to boot without them. Pass them from your shell or a local .env.
run:
	docker run -d --name $(IMAGE) -p 8080:80 \
		-e DATABASE_URL="$${DATABASE_URL}" \
		-e FRONTEND_URL="$${FRONTEND_URL:-http://localhost:8080}" \
		-e API_KEY="$${API_KEY}" \
		$(IMAGE)

logs:
	docker logs -f $(IMAGE)

stop:
	docker rm -f $(IMAGE)

health:
	@curl -fsS http://localhost:8080/health || echo "Dashboard: UNHEALTHY"
