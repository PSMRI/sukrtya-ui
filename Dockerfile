# Use an official Node.js runtime as a parent image for building
FROM node:20.17.0-alpine AS builder

# Set the working directory in the container
WORKDIR /build

# Copy package.json and package-lock.json first to leverage Docker caching
COPY package.json package-lock.json ./

# Upgrade npm to the latest stable version
RUN npm install -g npm@latest

# Fix dependency conflict by upgrading react-query
RUN npm uninstall react-query && npm install @tanstack/react-query

# Install dependencies using --legacy-peer-deps to avoid conflicts
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# Use a lightweight Node.js runtime for the final container
FROM node:20.17.0-alpine AS runner

# Set working directory
WORKDIR /app

# Copy necessary files from the builder stage
COPY --from=builder /build/node_modules node_modules/
COPY --from=builder /build/package.json package.json
COPY --from=builder /build/package-lock.json package-lock.json
COPY --from=builder /build/build ./public/
COPY --from=builder /build/src ./src/

# Expose port 3000 (default React dev server port)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
