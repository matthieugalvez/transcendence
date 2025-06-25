FROM node:24-slim AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci

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
#RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#    -keyout /etc/nginx/ssl/key.pem \
#    -out /etc/nginx/ssl/cert.pem \
#    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
#    -addext "subjectAltName=DNS:localhost,DNS:app,IP:127.0.0.1"

    # --- For production with a real domain and certbot ---
# If you have obtained a certificate for pong42.click with certbot on your host,
# you can mount or copy it into the container like this:
# COPY /var/cert/fullchain.pem /etc/nginx/ssl/cert.pem
# COPY /var/cert/privkey.pem /etc/nginx/ssl/key.pem

# Copy built frontend files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create directories for additional assets
RUN mkdir -p /usr/share/nginx/html/assets/fonts
RUN mkdir -p /usr/share/nginx/html/assets/img

# Copy font files from source
COPY src/client/assets/fonts /usr/share/nginx/html/assets/fonts

# Copy image files from source
COPY src/client/assets/img /usr/share/nginx/html/assets/img

# Copy nginx configuration
COPY configs/nginx.conf /etc/nginx/nginx.conf

# Set proper permissions
#RUN chmod 644 /etc/nginx/ssl/cert.pem && \
#    chmod 600 /etc/nginx/ssl/key.pem

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon"]