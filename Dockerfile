# Use an official OpenJDK runtime as a parent image
FROM node:20.17.0-alpine AS builder

# Set the working directory in the container
WORKDIR /build

# Copy the JAR file to the container
COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install -g npm@11.0.0

COPY . .

RUN npm run build

FROM node:20.17.0-alpine AS runner

WORKDIR /app

COPY --from=builder /build/node_modules node_modules/
COPY --from=builder /build/package.json package.json
COPY --from=builder /build/package-lock.json package-lock.json
COPY --from=builder /build/ build/

CMD [ "npm","start" ]
 
