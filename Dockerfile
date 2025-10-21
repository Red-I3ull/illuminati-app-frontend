ARG NODE_VERSION=22.20.0-alpine

FROM node:${NODE_VERSION}

WORKDIR /app

COPY  package.json .

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "npm", "run", "dev" ]