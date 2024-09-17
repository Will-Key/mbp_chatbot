# Utilisation de l'image officielle Node.js comme image de base
FROM node:18

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier le package.json et le package-lock.json pour installer les dépendances
COPY package*.json ./

# Installer les dépendances de l'application
RUN npm install

# Copier tout le reste des fichiers de l'application dans le répertoire de travail
COPY . .

# Générer Prisma Client
RUN npm run prisma:generate

# Compiler le projet NestJS (optionnel si tu as du TypeScript)
RUN npm run build

# Exposer le port utilisé par l'application
EXPOSE 3001

# Démarrer l'application
CMD ["npm", "run", "start:prod"]
