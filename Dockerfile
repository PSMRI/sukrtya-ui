# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Build the React app
RUN npm run build

# Set the base image for running the app
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy the built files from the previous stage
COPY --from=build /app/build /app/build
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Expose port 3000
EXPOSE 3000

# Start the React app using a simple HTTP server
CMD ["npx", "serve", "-s", "build", "-l", "3000"]