# Stage 1: Build the application
FROM node:18-alpine AS builder

RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

WORKDIR /app

# Copy package.json and package-lock.json and install dependencies
COPY package*.json ./

# Install all dependencies including dev dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Générer Prisma client
RUN npm run prisma:generate

# Build the application
RUN npm run build


# Stage 2: Production image
FROM node:18-alpine AS runner

RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

WORKDIR /usr/src/app

# Copy only what's needed for production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# ✅ Copie le script d'entrée dans le conteneur
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set environment variable
ENV NODE_ENV=production

# Expose the port
EXPOSE 3001

# Commande d'exécution via le script
CMD ["sh", "./entrypoint.sh"]
