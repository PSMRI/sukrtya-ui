# Use Node.js image for the build stage
FROM node:20.17.0-alpine AS builder
 
# Set the working directory
WORKDIR /build
 
# Copy only the package files first to leverage caching
COPY package.json package-lock.json ./
 
# Install dependencies
RUN npm ci
 
# Copy the rest of the application code
COPY . .
 
# Build the application
RUN npm run build
 
# Use a smaller image for the runtime stage
FROM node:20.17.0-alpine AS runner
 
# Set the working directory
WORKDIR /app
 
# Copy only the necessary files from the builder stage
COPY --from=builder /build/node_modules ./node_modules/
COPY --from=builder /build/package.json ./package.json
COPY --from=builder /build/build ./build/
 
# Define the command to run the application
CMD ["npm", "start"]
