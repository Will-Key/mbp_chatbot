#!/bin/bash
echo "🚀 Déploiement de la version PRODUCTION..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod down
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
echo "✅ Production déployée sur le port 3201"