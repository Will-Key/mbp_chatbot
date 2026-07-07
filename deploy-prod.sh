#!/bin/bash

echo "🚀 Déploiement de la version PRODUCTION..."
echo "=========================================="

# Arrêt des containers
echo "⏹️  Arrêt des containers existants..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod down --remove-orphans

# Nettoyage des containers résiduels
echo "🧹 Nettoyage des containers résiduels..."
docker rm -f mbp_chatbot_app_prod mbp_chatbot_rabbitmq_prod mbp_chatbot_db_prod 2>/dev/null || true

# Construction et démarrage
echo "🔨 Construction et démarrage..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Attente
echo "⏳ Attente du démarrage des services..."
sleep 5

# Vérification
echo "✅ Vérification de l'état des containers..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod ps

echo ""
echo "✅ Production déployée !"
echo "📍 Application accessible sur : http://localhost:3201"
echo "📍 RabbitMQ Management : http://localhost:15676"
echo ""
echo "📋 Pour voir les logs : docker logs -f mbp_chatbot_app_prod"