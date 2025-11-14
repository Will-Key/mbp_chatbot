#!/bin/bash

echo "🧪 Déploiement de la version TEST..."
echo "===================================="

# Arrêt des containers
echo "⏹️  Arrêt des containers existants..."
docker-compose -f docker-compose.test.yml --env-file .env.test down

# Construction et démarrage
echo "🔨 Construction et démarrage..."
docker-compose -f docker-compose.test.yml --env-file .env.test up -d --build

# Attente
echo "⏳ Attente du démarrage des services..."
sleep 5

# Vérification
echo "✅ Vérification de l'état des containers..."
docker-compose -f docker-compose.test.yml ps

echo ""
echo "✅ Test déployé !"
echo "📍 Application accessible sur : http://localhost:3101"
echo "📍 RabbitMQ Management : http://localhost:15675"
echo ""
echo "📋 Pour voir les logs : docker logs -f mbp_chatbot_app_test"