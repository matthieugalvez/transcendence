FROM node:24-slim AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy configuration files
COPY configs ./configs/
COPY prisma ./prisma/
COPY .env* ./

# Generate Prisma client
RUN npx prisma generate

# Copy source files
COPY src ./src/

# Build the frontend and backend
RUN npm run build:frontend && npm run build:backend

# Production stage
FROM node:24-slim

# Install curl and other dependencies
RUN apt-get update && apt-get install -y curl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install

# Copy built backend from builder stage
COPY --from=builder /app/dist-back ./dist-back
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Create data directory with proper permissions
RUN mkdir -p /app/data && \
    mkdir -p /app/src/server/db/users && \
    chown -R node:node /app && \
    chmod -R 755 /app && \
    chmod -R 777 /app/src/server/db/users

# Copy the default avatar from the builder stage
COPY --from=builder /app/src/server/db/users/default.svg /app/src/server/db/users/default.svg

# Set proper permissions for the default avatar
RUN chmod 644 /app/src/server/db/users/default.svg && chown node:node /app/src/server/db/users/default.svg

# Switch to non-root user
USER node

# Set the DATABASE_URL environment variable
ENV DATABASE_URL="file:./data/transcendence.db"

# Initialize database and seed data
RUN npx prisma db push --accept-data-loss && \
    npx prisma db seed

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the backend only
CMD ["node", "dist-back/app.js"]