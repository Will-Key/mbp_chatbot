#!/bin/sh

set -e

wait_for_database() {
	if [ -z "$DATABASE_URL" ]; then
		echo "DATABASE_URL is not set."
		exit 1
	fi

	echo "⏳ Waiting for database readiness..."

	node <<'EOF'
const net = require('net');

const databaseUrl = process.env.DATABASE_URL;
const timeoutMs = Number(process.env.DB_READY_TIMEOUT_MS || 60000);
const retryDelayMs = Number(process.env.DB_READY_RETRY_MS || 2000);

if (!databaseUrl) {
	console.error('DATABASE_URL is not set.');
	process.exit(1);
}

let parsedUrl;

try {
	parsedUrl = new URL(databaseUrl);
} catch (error) {
	console.error(`Invalid DATABASE_URL: ${error.message}`);
	process.exit(1);
}

const host = parsedUrl.hostname;
const port = Number(parsedUrl.port || 5432);

if (!host || !Number.isFinite(port)) {
	console.error('DATABASE_URL must include a valid host and port.');
	process.exit(1);
}

const startedAt = Date.now();

function waitForSocket() {
	const socket = net.createConnection({ host, port });

	const retry = (reason) => {
		socket.destroy();

		if (Date.now() - startedAt >= timeoutMs) {
			console.error(`Database did not become ready within ${timeoutMs}ms (${reason}).`);
			process.exit(1);
		}

		console.log(`Database not ready yet (${reason}). Retrying in ${retryDelayMs}ms...`);
		setTimeout(waitForSocket, retryDelayMs);
	};

	socket.setTimeout(retryDelayMs);

	socket.on('connect', () => {
		socket.end();
		console.log(`Database is reachable on ${host}:${port}.`);
		process.exit(0);
	});

	socket.on('timeout', () => retry('timeout'));
	socket.on('error', (error) => retry(error.code || error.message));
}

waitForSocket();
EOF
}

wait_for_database

echo "🔁 Applying Prisma migrations..."
npx prisma migrate deploy

echo "🚀 Starting app..."
exec node dist/src/main.js

# # # Charger les variables d'environnement
# # export $(cat .env | xargs)

# # # Attendre que Postgres soit prêt
# # until nc -z mbp_chatbot_db 5432; do
# #   echo "En attente de la base de données..."
# #   sleep 2
# # done

# # Vérifier si des tables existent
# # if [ "$(psql ${DATABASE_URL} -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public');")" = 't' ]; then
# #   echo "Des tables existent déjà, on saute les migrations."
# # else
# #   echo "Pas de tables, on applique les migrations."
# #   npx prisma migrate deploy
# # fi

# echo "Applying Prisma migrations..."
# npx prisma migrate deploy

# # Démarrer l'application Node.js
# echo "Starting app..."
# node dist/src/main.js


# # Démarrer l'application
# node dist/src/main.js
