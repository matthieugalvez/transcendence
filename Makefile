# Development commands
build-dev:
	npm install
	npm install @fastify/websocket
	npm install uuid
	npx prisma generate
	npx prisma db push
	npm run db:seed
	npm run generate:jwt
	npm run dev:full

build-docker:
	docker compose up --build

# Clean commands (in order of dependency)
clean-containers:
	@echo "🧹 Stopping and removing containers..."
	-docker compose down --volumes --remove-orphans
	-docker container prune -f

clean-db: clean-containers
	@echo "🗑️  Cleaning database files..."
	-rm -rf ./data/
	-rm -rf ./prisma/dev.db*
	-rm -rf ./prisma/transcendence.db*
	-rm -rf ./prisma/migrations/
	-sudo rm -rf ./data/ 2>/dev/null || true
	@echo "✅ Database cleaned"

clean-build:
	@echo "🧹 Cleaning build artifacts..."
	-rm -rf node_modules/
	-rm -rf package-lock.json
	-rm -rf dist/
	-rm -rf dist-back/
	-rm -rf .vite/
	@echo "✅ Build artifacts cleaned"

clean: clean-containers clean-db clean-build
	@echo "🧹 Full cleanup completed"

clean-docker: clean
	@echo "🐳 Cleaning Docker resources..."
	-docker system prune -f
	-docker volume prune -f
	@echo "✅ Docker cleaned"

# Force clean (nuclear option)
clean-force: clean-containers
	@echo "💥 Force cleaning everything..."
	-sudo rm -rf node_modules/ package-lock.json dist/ dist-back/ || true
	-sudo rm -rf ./data/ ./prisma/dev.db* ./prisma/transcendence.db* || true
	-sudo rm -rf ./prisma/migrations/ || true
	-docker system prune -af
	-docker volume prune -f
	@echo "✅ Force clean completed"

# Prisma specific commands
db-setup:
	npx prisma generate
	npx prisma db push

db-reset: clean-containers
	@echo "🔄 Resetting database..."
	-rm -rf ./prisma/migrations/
	-rm -rf ./data/
	npx prisma db push --force-reset
	npx prisma generate
	@echo "✅ Database reset completed"

db-studio:
	npx prisma studio

# Development helpers
restart: clean build-dev
	npm cache clean --force

# Show what will be cleaned (dry run)
clean-preview:
	@echo "📋 Files that would be removed:"
	@echo "Node modules: $(shell ls -la node_modules 2>/dev/null || echo 'not found')"
	@echo "Build dirs: $(shell ls -la dist dist-back 2>/dev/null || echo 'not found')"
	@echo "DB files: $(shell ls -la ./data/ ./prisma/*.db* 2>/dev/null || echo 'not found')"
	@echo "Migrations: $(shell ls -la ./prisma/migrations/ 2>/dev/null || echo 'not found')"

.PHONY: build-dev build-docker clean clean-containers clean-db clean-build clean-docker clean-force db-setup db-reset db-studio restart clean-preview
