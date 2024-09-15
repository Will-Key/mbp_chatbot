# Utilisation de l'image officielle Node.js comme image de base
FROM node:18-alpine

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier le package.json et le package-lock.json pour installer les dépendances
COPY package*.json ./

# Installer les dépendances de l'application
RUN npm install --production

# Copier tout le reste des fichiers de l'application dans le répertoire de travail
COPY . .

# Compiler le projet NestJS (si TypeScript)
RUN npm run build

# Exposer le port utilisé par l'application
EXPOSE 3001

# Démarrer l'application
CMD ["npm", "run", "start:prod"]
