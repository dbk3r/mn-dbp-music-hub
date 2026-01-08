#!/bin/bash
echo "🚀 Starting LOCAL development environment..."

# Ensure local .env files exist
if [ ! -f backend/.env ]; then
  echo "⚠️  backend/.env not found - using defaults"
fi

if [ ! -f frontend/.env ]; then
  echo "⚠️  frontend/.env not found - using defaults"
fi

if [ ! -f admin/.env ]; then
  echo "⚠️  admin/.env not found - using defaults"
fi

# Start with default docker-compose.yml
docker compose up
