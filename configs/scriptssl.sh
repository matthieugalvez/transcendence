#!/bin/bash
# filepath: /home/edelplan/Code/transcendence/scripts/generate-ssl.sh

# Create SSL directory
mkdir -p configs/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout configs/ssl/key.pem \
    -out configs/ssl/cert.pem \
    -subj "/C=FR/ST=Paris/L=Paris/O=42School/OU=Transcendence/CN=localhost"

echo "✅ SSL certificates generated in configs/ssl/"