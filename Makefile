# -------------------------------------------------
# Variables
# -------------------------------------------------
# Default value; can be overridden on the command line:
#   make pnpm-dev LOCALHOST=127.0.0.1
LOCALHOST ?= localhost
DOCKER_COMPOSE ?= $(shell if docker compose version >/dev/null 2>&1; then printf 'docker compose'; elif command -v docker-compose >/dev/null 2>&1; then printf 'docker-compose'; else printf 'docker compose'; fi)

# -------------------------------------------------
# Help
# -------------------------------------------------
.PHONY: help
help: ## Show this help message
	@echo 'Usage: make [target] [VARIABLE=value]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-25s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# -------------------------------------------------
# pnpm‑specific commands
# -------------------------------------------------
.PHONY: pnpm-install pnpm-setup pnpm-test pnpm-build pnpm-build-dev pnpm-dev pnpm-clean

pnpm-install: ## Install pnpm globally
	npm install -g pnpm
	@echo "✅ pnpm installed: $(pnpm --version)"

pnpm-setup: ## Setup pnpm environment
	chmod +x scripts/setup-pnpm.sh scripts/pnpm-docker.sh
	./scripts/setup-pnpm.sh

pnpm-test: ## Test pnpm build locally
	pnpm install
	pnpm run build
	@echo "✅ Local build successful!"

pnpm-build: ## Build Docker image with pnpm
	$(DOCKER_COMPOSE) build --no-cache

pnpm-build-dev: ## Build development image with pnpm
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml build --no-cache

pnpm-dev: ## Start in development mode with hot‑reload
	@echo "🚀 Running with LOCALHOST=$(LOCALHOST)"
	LOCALHOST=$(LOCALHOST) $(DOCKER_COMPOSE) -f docker-compose.dev.yml up

pnpm-clean: ## Clean pnpm cache and lockfile
	rm -rf node_modules .next pnpm-lock.yaml
	pnpm store prune || true

# -------------------------------------------------
# Standard Docker commands
# -------------------------------------------------
.PHONY: build up down restart logs logs-dashboard logs-mediamtx clean rebuild dev \
        shell-dashboard shell-mediamtx ps health status

build: pnpm-setup pnpm-build ## Build production images

up: ## Start all services
	$(DOCKER_COMPOSE) up -d

down: ## Stop all services
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml down 2>/dev/null || true

restart: ## Restart all services
	$(DOCKER_COMPOSE) restart

logs: ## Show logs from all services
	$(DOCKER_COMPOSE) logs -f

logs-dashboard: ## Show logs from dashboard only
	$(DOCKER_COMPOSE) logs -f dashboard

logs-mediamtx: ## Show logs from MediaMTX only
	$(DOCKER_COMPOSE) logs -f mediamtx

clean: ## Clean up everything
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml down -v 2>/dev/null || true
	$(MAKE) pnpm-clean
	docker system prune -f

rebuild: ## Full rebuild with pnpm
	$(MAKE) clean
	$(MAKE) pnpm-setup
	$(MAKE) pnpm-build
	$(MAKE) up

dev: pnpm-build-dev pnpm-dev ## Start in development mode

shell-dashboard: ## Open shell in dashboard container
	$(DOCKER_COMPOSE) exec dashboard sh

shell-mediamtx: ## Open shell in MediaMTX container
	$(DOCKER_COMPOSE) exec mediamtx sh

ps: ## Show running containers
	$(DOCKER_COMPOSE) ps

health: ## Check service health
	@echo "Checking services..."
	@curl -f http://localhost:9997/v3/config/global/get 2>/dev/null && echo "✅ MediaMTX OK" || echo "❌ MediaMTX not responding"
	@curl -f http://localhost:3000 2>/dev/null && echo "✅ Dashboard OK" || echo "❌ Dashboard not responding"

status: ## Show detailed status
	@echo "=== Docker Containers ==="
	@$(DOCKER_COMPOSE) ps
	@echo ""
	@echo "=== Docker Images ==="
	@docker images | grep -E "mediamtx|REPOSITORY"
	@echo ""
	@echo "=== pnpm Version ==="
	@pnpm --version 2>/dev/null || echo "pnpm not installed (run: make pnpm-install)"
