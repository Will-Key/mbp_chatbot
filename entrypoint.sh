#!/bin/sh

# Charger les variables d'environnement
export $(cat .env | xargs)

# Attendre que Postgres soit prêt
until nc -z mbp_chatbot_db 5432; do
  echo "En attente de la base de données..."
  sleep 2
done

# Vérifier si des tables existent
# if [ "$(psql ${DATABASE_URL} -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public');")" = 't' ]; then
#   echo "Des tables existent déjà, on saute les migrations."
# else
#   echo "Pas de tables, on applique les migrations."
#   npx prisma migrate deploy
# fi

echo "Applying Prisma migrations..."
npx prisma migrate deploy

# Démarrer l'application Node.js
echo "Starting app..."
node dist/src/main.js


# Démarrer l'application
node dist/src/main.js
