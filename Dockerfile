# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Allow build-time injection of React env (set by Coolify/build args)
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Production stage: serve static files with nginx
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose default HTTP port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]