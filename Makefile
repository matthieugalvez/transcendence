build-dev:
	npm install
	npx prisma generate
	npx prisma migrate dev --name init
	npm run dev:full

build-docker:
	docker compose up --build

clean:
	rm -rf node_modules
	rm -rf package-lock.json
	rm -rf dist
	rm -rf dist-back
	rm -rf transcendence.db
	rm -rf prisma/migrations

clean-docker: clean
	docker compose down --volumes --remove-orphans
	docker system prune -f

clean-db: clean clean-docker
	rm -rf ./data
	rm -rf transcendence.db
	rm -rf prisma/migrations

# Prisma specific commands
db-setup:
	npx prisma generate
	npx prisma migrate dev --name init

db-reset:
	npx prisma migrate reset --force
	npx prisma generate

db-studio:
	npx prisma studio

re: clean-db build-dev

#simple temp clean command for package setup