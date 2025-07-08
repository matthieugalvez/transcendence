# Development commands
build-dev:
	npm install
	npm install @fastify/websocket
	npm install @fastify/helmet
	npm install uuid
	npm install chart.js
	npm install chartjs-adapter-date-fns date-fns
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
	-rm -rf ./src/server/db/users/*.png
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
	npm cache clean --force

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

# Show what will be cleaned (dry run)
clean-preview:
	@echo "📋 Files that would be removed:"
	@echo "Node modules: $(shell ls -la node_modules 2>/dev/null || echo 'not found')"
	@echo "Build dirs: $(shell ls -la dist dist-back 2>/dev/null || echo 'not found')"
	@echo "DB files: $(shell ls -la ./data/ ./prisma/*.db* 2>/dev/null || echo 'not found')"
	@echo "Migrations: $(shell ls -la ./prisma/migrations/ 2>/dev/null || echo 'not found')"


	# Add this to your Makefile
build-prod: clean
	@echo "🏗️ Building for production..."
	npm install
	npx prisma generate
	npx prisma db push
	npm run db:seed
	docker compose up --build -d
	@echo "✅ Production build completed"
	@echo "🌐 Application available at: http://localhost:3000"

# Production commands
prod-up:
	docker compose up -d

prod-down:
	docker compose down

prod-logs:
	docker compose logs -f

prod-restart: prod-down prod-up

docker-nuclear:
	@echo "💥 NUCLEAR OPTION: This will destroy EVERYTHING Docker-related!"
	@echo "⚠️  This includes containers, images, volumes, and networks from ALL projects!"
	@read -p "Are you absolutely sure? Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ]
	@echo "🧨 Starting nuclear cleanup..."
# Stop all running containers (if any exist)
	-docker stop $$(docker ps -aq) 2>/dev/null || echo "No containers to stop"
# Remove all containers (if any exist)
	-docker rm $$(docker ps -aq) 2>/dev/null || echo "No containers to remove"
# Remove all images (if any exist)
	-docker rmi $$(docker images -q) -f 2>/dev/null || echo "No images to remove"
# Remove all volumes (if any exist)
	-docker volume rm $$(docker volume ls -q) 2>/dev/null || echo "No volumes to remove"
# Remove all networks except default ones (if any exist)
	-docker network rm $$(docker network ls -q --filter type=custom) 2>/dev/null || echo "No custom networks to remove"
# Remove all build cache
	-docker builder prune -a -f
# Final system cleanup
	-docker system prune -a -f --volumes
	@echo "☢️  Nuclear cleanup completed!"

.PHONY: build-dev build-docker clean clean-containers clean-db clean-build clean-docker clean-force db-setup db-reset db-studio restart clean-preview


## Stop all containers
#docker stop $(docker ps -aq)

# Remove all containers
#docker rm $(docker ps -aq)

# Remove all images
#docker rmi $(docker images -q) -f

# Remove all volumesí
#docker volume rm $(docker volume ls -q)

# Remove all networks (except default ones)
#docker network rm $(docker network ls -q)

# Remove all build cache
#docker builder prune -a -f

# Clean system
#docker system prune -a -f --volumes
