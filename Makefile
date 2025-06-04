build-dev:
	npm install
	npm run dev:full

build-docker:
	docker compose up --build

clean:
	rm -rf node_modules
	rm -rf package-lock.json
	rm -rf dist
	rm -rf dist-back
	rm -rf ./src/server/configs/transcendence.db

clean-docker: clean
	docker compose down --volumes --remove-orphans
	docker system prune -f

clean-db: clean clean-docker
	rm -rf ./data

re: clean-db build-dev

#simple temp clean command for package setup