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

# Generate Prisma client
RUN npm run prisma:generate

# Build the application
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine AS runner

RUN ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3

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
