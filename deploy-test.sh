#!/bin/bash
echo "🧪 Déploiement de la version TEST..."
docker-compose -f docker-compose.test.yml --env-file .env.test down
docker-compose -f docker-compose.test.yml --env-file .env.test up -d --build
echo "✅ Test déployé sur le port 3101"