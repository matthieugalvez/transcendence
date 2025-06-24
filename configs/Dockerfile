# configs/Dockerfile
FROM node:18-slim

# Install curl and other dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Use npm install instead of ci (slower but more reliable)
RUN npm install

# Copy configuration files
COPY configs ./configs/

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source files (make sure index.html is included)
COPY src ./src/

# Copy any other necessary files
COPY .env* ./

# Debug: List files to see what's available
RUN ls -la && ls -la src/ && ls -la src/client/ || echo "Missing directories"

RUN npm run generate:jwt > .env.build && \
    cat .env.build >> .env

# Build frontend and backend (needs devDependencies)
RUN npm run build:frontend && npm run build:backend

# Remove devDependencies after build
RUN npm prune --omit=dev

# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/data

# Create non-root user for security
RUN chown -R node:node /app/data /app/dist /app/dist-back
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "run", "server:start"]