clean:
	rm -rf node_modules
	rm -rf package-lock.json
	rm -rf ./dist/*
	rm -rf ./server/transcendence.db

clean-docker: clean
	docker compose down --volumes --remove-orphans
	docker system prune -f

clean-db: clean clean-docker
	rm -rf ./data

#simple temp clean command for package setup