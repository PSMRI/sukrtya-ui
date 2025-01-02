# Fetching the latest node image on alpine linux

FROM node:20.17.0-alpine  AS development

# Setting up the work directory

WORKDIR /app

# Installing dependencies

COPY ./package.json /app
COPY ./package-lock.json /app


RUN npm install -g npm@11.0.0


# Copying all the files in our project

COPY . .

RUN npm run build
 
FROM node:20.17.0-alpine AS runner

# Starting our application

CMD ["npm","start"]