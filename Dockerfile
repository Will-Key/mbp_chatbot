# # Utilisation de l'image officielle Node.js comme image de base
# FROM node:18

# # Définir le répertoire de travail dans le conteneur
# WORKDIR /app

# # Copier le package.json et le package-lock.json pour installer les dépendances
# COPY package*.json ./

# # Installer les dépendances de l'application
# RUN npm install

# # Copier tout le reste des fichiers de l'application dans le répertoire de travail
# COPY . .

# # Define environment
# ENV NODE_ENV=production

# # Générer Prisma Client
# RUN npm run prisma:generate

# # Compiler le projet NestJS (optionnel si vous utilisez TypeScript)
# RUN npm run build

# # Exposer le port utilisé par l'application
# EXPOSE 3001

# # Démarrer l'application
# CMD ["npm", "run", "start:prod"]


# New config

# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npm run prisma:generate

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies in the production image
RUN npm ci --only=production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Set environment variable
ENV NODE_ENV=production

# Expose the port
EXPOSE 3001

# Run the application
CMD ["node", "dist/src/main.js"]
