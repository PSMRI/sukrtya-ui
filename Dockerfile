# Use Node.js Alpine as the base image for a lightweight build
FROM node:20.17.0-alpine AS builder

# Set the working directory
WORKDIR /build

# Copy only package.json and package-lock.json first for better caching
COPY package.json package-lock.json ./

# Upgrade npm to the latest stable version
RUN npm install -g npm@latest

# Fix react-query conflict by upgrading to @tanstack/react-query
RUN npm uninstall react-query && npm install @tanstack/react-query

# Install dependencies using --legacy-peer-deps to bypass conflicts
RUN npm ci --legacy-peer-deps

# Copy the rest of the app
COPY . .

# Build the React app
RUN npm run build

# Use a lightweight Node.js runtime for running the app
FROM node:20.17.0-alpine AS runner

# Set working directory
WORKDIR /app

# Copy necessary files from the builder
COPY --from=builder /build/node_modules node_modules/
COPY --from=builder /build/package.json package.json
COPY --from=builder /build/package-lock.json package-lock.json
COPY --from=builder /build/build ./public/
COPY --from=builder /build/src ./src/

# Expose port 3000 for React dev server
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
