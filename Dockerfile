# Stage 1: Build the application
FROM node:18-alpine AS builder

# Résout l'erreur openssl (utile pour certaines libs Node.js)
RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

# Dossier de travail
WORKDIR /app

# Copie des dépendances
COPY package*.json ./
RUN npm ci

# Copie du code source
COPY . .

# Donne les bons droits au script
RUN chmod +x entrypoint.sh

# Génération du client Prisma
RUN npm run prisma:generate

# Build de l'application NestJS
RUN npm run build

# Stage 2: Création de l'image de production
FROM node:18-alpine AS runner

RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

WORKDIR /app

# Copie uniquement les dépendances de production
COPY package*.json ./
RUN npm ci --only=production

# Copie des fichiers nécessaires depuis le builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env .env
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Donne les droits d'exécution au script
RUN chmod +x ./entrypoint.sh

# Set environment variable
ENV NODE_ENV=production

# Port exposé
EXPOSE 3001

# Commande de démarrage (avec script)
CMD ["sh", "./entrypoint.sh"]


# # Stage 1: Build the application
# FROM node:18-alpine AS builder

# RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

# WORKDIR /app

# # Copy package.json and package-lock.json and install dependencies
# COPY package*.json ./

# # Install all dependencies including dev dependencies
# RUN npm ci

# # Copy the rest of the application code
# COPY . .

# # Générer Prisma client
# RUN npm run prisma:generate

# # Build the application
# RUN npm run build


# # Stage 2: Production image
# FROM node:18-alpine AS runner

# RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

# WORKDIR /usr/src/app

# # Copy only what's needed for production
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/node_modules ./node_modules
# COPY --from=builder /app/prisma ./prisma
# COPY --from=builder /app/package*.json ./

# # ✅ Copie le script d'entrée dans le conteneur
# COPY entrypoint.sh ./entrypoint.sh
# RUN chmod +x ./entrypoint.sh

# # Set environment variable
# ENV NODE_ENV=production

# # Expose the port
# EXPOSE 3001

# # Commande d'exécution via le script
# CMD ["sh", "./entrypoint.sh"]
