# Use Node.js Alpine for a lightweight build
FROM node:20.17.0-alpine AS builder

# Set working directory
WORKDIR /build

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Upgrade npm to latest stable version
RUN npm install -g npm@latest

# Fix dependency issues by uninstalling old react-query and installing the new one
RUN npm uninstall react-query && npm install @tanstack/react-query

# Install correct TypeScript version
RUN npm install typescript@4.9.5 --save-dev

# Install all dependencies using --legacy-peer-deps to avoid conflicts
RUN npm ci --legacy-peer-deps

# Copy the rest of the project files
COPY . .

# Build the React app
RUN npm run build

# Use a lightweight Node.js runtime for deployment
FROM node:20.17.0-alpine AS runner

# Set working directory
WORKDIR /app

# Copy necessary files from the builder
COPY --from=builder /build/node_modules node_modules/
COPY --from=builder /build/package.json package.json
COPY --from=builder /build/package-lock.json package-lock.json
COPY --from=builder /build/build ./public/
COPY --from=builder /build/src ./src/

# Expose port for development server
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
