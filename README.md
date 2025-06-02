<!--
The current project setup is just a basic setup to run the frontend independently using vite as a bundler (no framework). https://vite.dev/guide/#overview


##You need to update NODE on your session before running:

```
# Download and install nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# in lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js:
nvm install 24

# Verify the Node.js version:
node -v # Should print "v24.1.0".
nvm current # Should print "v24.1.0".

# Verify npm version:
npm -v # Should print "11.3.0".
```

Then run
```
npm install

and

npm run dev:full // Start the backend and frontend at the same time


npm run build // Compile dev build

or

npm run dev // Run dev frontend

or

npm run server:dev //Run Fastify backend server
```

site will be accessible on localhost:5173

(Vite is used for fast dev environment, and bundling (combining multiple file into fewer, optimizing the development) we can not use it for the backend though as per discord #staff-pedagogy).

For the database:

```
For VSCode quickview:

Install "SQLite Viewer" extension
Right-click on transcendence.db → "Open with SQLite Viewer"

or

Go to:
http://localhost:3000/api/users
```
-->

# Transcendence Pong Game

A pong game using TypeScript, Tailwind CSS, Node.js, SQLite and Fastify.

## Development Setup

```bash
npm install
npm run dev:full  # Start both frontend and backend
```


## Docker Setup

Pas necessairement correct pour le sujet mais c'etait pour se donner une idee.

### Run with Docker Compose
```bash
# Build and start the application
docker compose up --build

# Run in background
docker compose up -d

# Stop the application
docker compose down
```

### Manual Docker commands
```bash
# Build the image
docker build -t transcendence .

# Run the container
docker run -p 3000:3000 -v $(pwd)/data:/app/data transcendence
```

## Access the Application

- **Application**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/health
- **View Users**: http://localhost:3000/api/users

## Database

- SQLite database persists in `./data/transcendence.db`
- Database is automatically created on first run -->
