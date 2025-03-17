# Use a stable Node.js version
FROM node:20.17.0-alpine AS builder

# Set working directory
WORKDIR /build

# Copy package files first (for better caching)
COPY package.json package-lock.json ./

# Upgrade npm to latest stable version
RUN npm install -g npm@latest

# Uninstall react-query and install the new package using --legacy-peer-deps
RUN npm uninstall react-query && npm install @tanstack/react-query --legacy-peer-deps

# Install the correct TypeScript version to match react-scripts
RUN npm install typescript@4.9.5 --save-dev --legacy-peer-deps

# Install dependencies cleanly
RUN npm ci --legacy-peer-deps

# Copy project files
COPY . .

# Build the React app
RUN npm run build

# Use a lightweight Node.js runtime
FROM node:20.17.0-alpine AS runner

# Set working directory
WORKDIR /app

# Copy built assets and dependencies
COPY --from=builder /build/node_modules node_modules/
COPY --from=builder /build/package.json package.json
COPY --from=builder /build/package-lock.json package-lock.json
COPY --from=builder /build/build ./public/
COPY --from=builder /build/src ./src/

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
