# Use Node.js 24 LTS
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY ../package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY ../src ./src

# Build the frontend
RUN npm run build

RUN npm run server:build

RUN npm prune --production && npm cache clean --force

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "server:start"]