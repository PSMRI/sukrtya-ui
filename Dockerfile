# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Allow build-time injection of React env (set by Coolify/build args)
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to handle compatibility
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage - serve with Node.js
FROM node:22-alpine

WORKDIR /app

# Install serve package to run production server
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start serve
CMD ["serve", "-s", "build", "-l", "3000"]