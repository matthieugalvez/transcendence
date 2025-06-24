FROM node:18-slim AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy configuration files needed for build
COPY configs ./configs/
COPY src ./src/

# Build only the frontend
RUN npm run build:frontend

# Nginx stage
FROM nginx:alpine

# Install OpenSSL for SSL certificate generation
RUN apk add --no-cache openssl

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed SSL certificates
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:app,IP:127.0.0.1"

# Copy built frontend files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create directories for additional assets
RUN mkdir -p /usr/share/nginx/html/assets/fonts
RUN mkdir -p /usr/share/nginx/html/avatars

# Copy font files from source (since they might not be in dist)
COPY src/client/assets/fonts /usr/share/nginx/html/assets/fonts

# Create default avatar SVG (single line to avoid parsing issues)
RUN echo '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#e2e8f0"/><circle cx="50" cy="35" r="15" fill="#94a3b8"/><ellipse cx="50" cy="75" rx="25" ry="20" fill="#94a3b8"/></svg>' > /usr/share/nginx/html/avatars/default.svg

# Copy nginx configuration
COPY configs/nginx.conf /etc/nginx/nginx.conf

# Set proper permissions
RUN chmod 644 /etc/nginx/ssl/cert.pem && \
    chmod 600 /etc/nginx/ssl/key.pem

# Expose ports
EXPOSE 8080 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]