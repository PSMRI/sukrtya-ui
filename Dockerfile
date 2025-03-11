# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps flag
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Install envsubst
RUN apk add --no-cache bash gettext

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Script to replace environment variables and start nginx
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Start nginx using the entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]