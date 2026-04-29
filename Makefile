# WASSCE Analytics Platform — Makefile
# Run `make help` to see all available targets.

DOCKER_COMPOSE      := docker compose
DOCKER_COMPOSE_DEV  := docker compose -f docker-compose.yml -f docker-compose.dev.yml
WEB_DIR             := apps/web
PARSER_DIR          := apps/parser

.DEFAULT_GOAL := help

# ─── Help ─────────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-26s\033[0m %s\n", $$1, $$2}' \
		| sort

# ─── Environment ──────────────────────────────────────────────────────────────

.PHONY: env
env: ## Copy .env.example → .env (skip if .env already exists)
	@if [ -f .env ]; then \
		echo ".env already exists — skipping. Edit it manually if needed."; \
	else \
		cp .env.example .env; \
		echo ".env created. Set AUTH_SECRET before starting services."; \
	fi

.PHONY: gen-secret
gen-secret: ## Generate a random AUTH_SECRET and print it
	@openssl rand -base64 32

# ─── Production — Build ───────────────────────────────────────────────────────

.PHONY: build
build: ## [PROD] Build all images using Dockerfile.prod
	$(DOCKER_COMPOSE) build

.PHONY: build-web
build-web: ## [PROD] Build only the Next.js web image
	$(DOCKER_COMPOSE) build web

.PHONY: build-parser
build-parser: ## [PROD] Build parser + worker images (both use Dockerfile.prod)
	$(DOCKER_COMPOSE) build parser worker

.PHONY: build-no-cache
build-no-cache: ## [PROD] Build all images without layer cache
	$(DOCKER_COMPOSE) build --no-cache

.PHONY: pull
pull: ## Pull latest base images from Docker Hub
	$(DOCKER_COMPOSE) pull db redis minio nginx

# ─── Production — Run ─────────────────────────────────────────────────────────

.PHONY: up
up: ## [PROD] Start all services in background (production mode)
	$(DOCKER_COMPOSE) up -d

.PHONY: up-build
up-build: ## [PROD] Build production images then start all services
	$(DOCKER_COMPOSE) up -d --build

.PHONY: up-infra
up-infra: ## Start infrastructure only: db, redis, minio (shared by prod + dev)
	$(DOCKER_COMPOSE) up -d db redis minio

.PHONY: down
down: ## Stop all services (keep volumes)
	$(DOCKER_COMPOSE) down

.PHONY: down-volumes
down-volumes: ## Stop all services AND delete all volumes (wipes DB data)
	$(DOCKER_COMPOSE) down -v

.PHONY: restart
restart: ## Restart all services
	$(DOCKER_COMPOSE) restart

.PHONY: restart-web
restart-web: ## Restart only the web service
	$(DOCKER_COMPOSE) restart web

.PHONY: restart-parser
restart-parser: ## Restart only the parser + worker services
	$(DOCKER_COMPOSE) restart parser worker

# ─── Development — Build & Run ────────────────────────────────────────────────

.PHONY: dev-build
dev-build: ## [DEV] Build dev images (Dockerfile.dev, no compile step)
	$(DOCKER_COMPOSE_DEV) build

.PHONY: dev-build-web
dev-build-web: ## [DEV] Build only the web dev image
	$(DOCKER_COMPOSE_DEV) build web

.PHONY: dev-build-parser
dev-build-parser: ## [DEV] Build only the parser dev image
	$(DOCKER_COMPOSE_DEV) build parser

.PHONY: dev-up
dev-up: ## [DEV] Start all services in dev mode (hot reload, volume mounts)
	$(DOCKER_COMPOSE_DEV) up -d

.PHONY: dev-up-build
dev-up-build: ## [DEV] Build dev images then start
	$(DOCKER_COMPOSE_DEV) up -d --build

.PHONY: dev-down
dev-down: ## [DEV] Stop dev services
	$(DOCKER_COMPOSE_DEV) down

.PHONY: dev-logs
dev-logs: ## [DEV] Tail all dev service logs
	$(DOCKER_COMPOSE_DEV) logs -f

.PHONY: dev-logs-web
dev-logs-web: ## [DEV] Tail only web dev logs
	$(DOCKER_COMPOSE_DEV) logs -f web

.PHONY: dev-reset-web
dev-reset-web: ## [DEV] Remove web container + .next cache volume, then restart fresh
	$(DOCKER_COMPOSE_DEV) rm -f web
	docker volume rm wassceanalytics_web_next || true
	$(DOCKER_COMPOSE_DEV) up -d web

# ─── Docker — Observe ─────────────────────────────────────────────────────────

.PHONY: ps
ps: ## Show running service status
	$(DOCKER_COMPOSE) ps

.PHONY: logs
logs: ## Tail logs from all services
	$(DOCKER_COMPOSE) logs -f

.PHONY: logs-web
logs-web: ## Tail logs from the web service
	$(DOCKER_COMPOSE) logs -f web

.PHONY: logs-parser
logs-parser: ## Tail logs from parser + worker
	$(DOCKER_COMPOSE) logs -f parser worker

.PHONY: logs-db
logs-db: ## Tail logs from the database
	$(DOCKER_COMPOSE) logs -f db

# ─── Database ─────────────────────────────────────────────────────────────────

.PHONY: db-shell
db-shell: ## Open a psql shell inside the running db container
	$(DOCKER_COMPOSE) exec db psql -U wassce -d wassce_analytics

.PHONY: db-generate
db-generate: ## Generate Drizzle migration files from schema changes
	cd $(WEB_DIR) && npm run db:generate

.PHONY: db-migrate
db-migrate: ## Apply pending Drizzle migrations to the database (runs inside web container)
	$(DOCKER_COMPOSE) exec web npm run db:migrate

.PHONY: db-studio
db-studio: ## Open Drizzle Studio (http://local.drizzle.studio)
	cd $(WEB_DIR) && npm run db:studio

.PHONY: db-alembic-upgrade
db-alembic-upgrade: ## Run Alembic migrations inside the parser container
	$(DOCKER_COMPOSE) exec parser alembic upgrade head

.PHONY: db-alembic-revision
db-alembic-revision: ## Create a new Alembic migration (MSG="description")
	$(DOCKER_COMPOSE) exec parser alembic revision --autogenerate -m "$(MSG)"

# ─── Admin ────────────────────────────────────────────────────────────────────

.PHONY: create-admin
create-admin: ## Create a super_admin user (EMAIL= PASSWORD= NAME= required)
	@[ -n "$(EMAIL)" ] || (echo "Usage: make create-admin EMAIL=you@example.com PASSWORD=secret NAME='Full Name'"; exit 1)
	@[ -n "$(PASSWORD)" ] || (echo "Usage: make create-admin EMAIL=you@example.com PASSWORD=secret NAME='Full Name'"; exit 1)
	@[ -n "$(NAME)" ] || (echo "Usage: make create-admin EMAIL=you@example.com PASSWORD=secret NAME='Full Name'"; exit 1)
	$(DOCKER_COMPOSE) exec -e ADMIN_EMAIL="$(EMAIL)" -e ADMIN_PASSWORD="$(PASSWORD)" -e ADMIN_NAME="$(NAME)" \
		web node scripts/create-super-admin.mjs

# ─── Local dev (no Docker) ────────────────────────────────────────────────────

.PHONY: dev
dev: ## Start Next.js dev server locally (needs db + redis via make up-infra)
	cd $(WEB_DIR) && npm run dev

.PHONY: install
install: ## Install npm dependencies for apps/web
	cd $(WEB_DIR) && npm install

.PHONY: lint
lint: ## Run ESLint on the web app
	cd $(WEB_DIR) && npm run lint

.PHONY: typecheck
typecheck: ## Run TypeScript type check (no emit)
	cd $(WEB_DIR) && node node_modules/typescript/lib/tsc.js --noEmit

.PHONY: parser-dev
parser-dev: ## Run FastAPI dev server locally with auto-reload
	cd $(PARSER_DIR) && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

.PHONY: worker-dev
worker-dev: ## Run Celery worker locally
	cd $(PARSER_DIR) && celery -A app.workers.tasks worker --loglevel=info

# ─── Testing ──────────────────────────────────────────────────────────────────

.PHONY: test-parser
test-parser: ## Run FastAPI pytest suite inside the parser container
	$(DOCKER_COMPOSE) exec parser python -m pytest tests/ -v

.PHONY: test-web
test-web: ## Run Next.js vitest suite inside the web container
	$(DOCKER_COMPOSE) exec web npm test

.PHONY: test
test: test-parser test-web ## Run all tests (parser + web)

# ─── Health checks ────────────────────────────────────────────────────────────

.PHONY: health
health: ## Ping web and parser health endpoints
	@echo "Web   :" && curl -sf http://localhost:3000 > /dev/null && echo " OK" || echo " UNREACHABLE"
	@echo "Parser:" && curl -sf http://localhost:8000/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(' ' + d['status'])" || echo " UNREACHABLE"

.PHONY: health-db
health-db: ## Check PostgreSQL is accepting connections
	$(DOCKER_COMPOSE) exec db pg_isready -U wassce -d wassce_analytics

# ─── Cleanup ──────────────────────────────────────────────────────────────────

.PHONY: clean
clean: ## Remove build artifacts (.next, __pycache__, *.pyc)
	sudo rm -rf $(WEB_DIR)/.next $(WEB_DIR)/tsconfig.tsbuildinfo
	find $(PARSER_DIR) -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find $(PARSER_DIR) -name "*.pyc" -delete 2>/dev/null || true

.PHONY: clean-all
clean-all: clean down-volumes ## Remove build artifacts AND wipe all Docker volumes
	@echo "All containers stopped and volumes removed."

.PHONY: clean-uploads
clean-uploads: ## Delete any orphaned upload temp files left by OOM-killed workers
	$(DOCKER_COMPOSE) exec worker find /shared -name "tmp*.pdf" -o -name "tmp*.xlsx" | xargs -r rm -f
	@echo "Upload temp files cleared."

.PHONY: docker-nuke
docker-nuke: ## Stop and remove EVERY container on the system (all projects)
	@docker ps -aq | xargs -r docker stop
	@docker ps -aq | xargs -r docker rm
	@echo "All containers stopped and removed."

.PHONY: docker-prune-containers
docker-prune-containers: ## Remove all stopped containers
	docker container prune -f

.PHONY: docker-prune-volumes
docker-prune-volumes: ## Remove all unused volumes including named Compose volumes
	docker volume prune -f
	docker volume ls -q | xargs -r docker volume rm

.PHONY: docker-prune-images
docker-prune-images: ## Remove all unused images (frees ~8 GB)
	docker image prune -a -f

.PHONY: docker-prune-cache
docker-prune-cache: ## Remove all build cache (frees ~7 GB)
	docker builder prune -a -f

.PHONY: docker-prune-all
docker-prune-all: ## Remove ALL unused containers, volumes, images, and build cache
	@echo "WARNING: This will delete all unused Docker data system-wide."
	docker system prune -a --volumes -f
	@echo "Done. Run 'make docker-df' to verify."

.PHONY: docker-df
docker-df: ## Show Docker disk usage summary
	docker system df
