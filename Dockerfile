# Multi-stage Dockerfile for Sukrtya UI React Application

# Stage 1: Dependencies
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --only=production --legacy-peer-deps && \
    npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies)
RUN npm install --legacy-peer-deps

# Explicitly install ajv to fix module resolution issue
RUN npm install ajv@^8 --legacy-peer-deps

# Copy source code and public assets
COPY public ./public
COPY src ./src

# Build the application
RUN npm run build

# Expose port 3000
EXPOSE 3000


# Set entrypoint
ENTRYPOINT ["npm", "run", "start"]
