.PHONY: help pnpm-setup pnpm-build pnpm-dev pnpm-clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-25s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# pnpm-specific commands
pnpm-install: ## Install pnpm globally
	npm install -g pnpm
	@echo "✅ pnpm installed: $$(pnpm --version)"

pnpm-setup: ## Setup pnpm environment
	chmod +x scripts/setup-pnpm.sh scripts/pnpm-docker.sh
	./scripts/setup-pnpm.sh

pnpm-test: ## Test pnpm build locally
	pnpm install
	pnpm run build
	@echo "✅ Local build successful!"

pnpm-build: ## Build Docker image with pnpm
	docker-compose build --no-cache

pnpm-build-dev: ## Build development image with pnpm
	docker-compose -f docker-compose.dev.yml build --no-cache

pnpm-dev: ## Start in development mode with hot-reload
	docker-compose -f docker-compose.dev.yml up

pnpm-clean: ## Clean pnpm cache and lockfile
	rm -rf node_modules .next pnpm-lock.yaml
	pnpm store prune || true

# Standard Docker commands
build: pnpm-setup pnpm-build ## Build production images

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down
	docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-dashboard: ## Show logs from dashboard only
	docker-compose logs -f dashboard

logs-mediamtx: ## Show logs from MediaMTX only
	docker-compose logs -f mediamtx

clean: ## Clean up everything
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
	$(MAKE) pnpm-clean
	docker system prune -f

rebuild: ## Full rebuild with pnpm
	$(MAKE) clean
	$(MAKE) pnpm-setup
	$(MAKE) pnpm-build
	$(MAKE) up

dev: pnpm-build-dev pnpm-dev ## Start in development mode

shell-dashboard: ## Open shell in dashboard container
	docker-compose exec dashboard sh

shell-mediamtx: ## Open shell in MediaMTX container
	docker-compose exec mediamtx sh

ps: ## Show running containers
	docker-compose ps

health: ## Check service health
	@echo "Checking services..."
	@curl -f http://localhost:9997/v3/config/global/get 2>/dev/null && echo "✅ MediaMTX OK" || echo "❌ MediaMTX not responding"
	@curl -f http://localhost:3000 2>/dev/null && echo "✅ Dashboard OK" || echo "❌ Dashboard not responding"

status: ## Show detailed status
	@echo "=== Docker Containers ==="
	@docker-compose ps
	@echo ""
	@echo "=== Docker Images ==="
	@docker images | grep -E "mediamtx|REPOSITORY"
	@echo ""
	@echo "=== pnpm Version ==="
	@pnpm --version 2>/dev/null || echo "pnpm not installed (run: make pnpm-install)"
