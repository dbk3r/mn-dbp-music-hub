#!/bin/bash
echo "🚀 Starting PRODUCTION environment..."

# Copy production environment files
if [ -f backend/.env.prod ]; then
  echo "📋 Copying backend/.env.prod to backend/.env"
  cp backend/.env.prod backend/.env
else
  echo "❌ backend/.env.prod not found!"
  exit 1
fi

if [ -f frontend/.env.prod ]; then
  echo "📋 Copying frontend/.env.prod to frontend/.env"
  cp frontend/.env.prod frontend/.env
else
  echo "❌ frontend/.env.prod not found!"
  exit 1
fi

# Check for SSL certificate
if [ ! -f /etc/letsencrypt/live/dbp-music-hub.de/fullchain.pem ]; then
  echo "⚠️  SSL certificate not found at /etc/letsencrypt/live/dbp-music-hub.de/"
  echo "Run: certbot certonly --standalone -d dbp-music-hub.de"
  echo "Then combine: cat fullchain.pem privkey.pem > combined.pem"
  exit 1
fi

# Combine SSL certificates if needed
if [ ! -f /etc/letsencrypt/live/dbp-music-hub.de/combined.pem ]; then
  echo "📋 Creating combined SSL certificate..."
  sudo cat /etc/letsencrypt/live/dbp-music-hub.de/fullchain.pem \
           /etc/letsencrypt/live/dbp-music-hub.de/privkey.pem \
           > /tmp/combined.pem
  sudo mv /tmp/combined.pem /etc/letsencrypt/live/dbp-music-hub.de/combined.pem
  sudo chmod 600 /etc/letsencrypt/live/dbp-music-hub.de/combined.pem
fi

# Start with production override
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "✅ Production environment started!"
echo "📊 Check logs: docker compose logs -f"
echo "🛑 Stop: docker compose -f docker-compose.yml -f docker-compose.prod.yml down"
