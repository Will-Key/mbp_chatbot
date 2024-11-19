#!/bin/sh

# Vérifier si des tables existent dans la base de données
if [ "$(psql ${DATABASE_URL} -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public');")" = 't' ]; then
  echo "Tables exist, skipping migrations"
else
  echo "No tables found, running migrations"
  npx prisma migrate deploy
fi

# Démarrer l'application Node.js
node dist/src/main.js
