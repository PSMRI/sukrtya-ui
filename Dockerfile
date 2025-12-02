FROM node:18-alpine as build

# Set working directory inside the container
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create non-root user for security
# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S nextjs -u 1001
# USER nextjs

# Expose the port your app runs on (adjust as needed)
EXPOSE 5173

# Health check (optional but recommended)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
#   CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]