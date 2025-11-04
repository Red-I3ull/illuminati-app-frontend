ARG NODE_VERSION=22.20.0-alpine

#stage 1
FROM node:${NODE_VERSION} AS build

WORKDIR /app

COPY package*.json ./

RUN npm install && npm cache clean --force

COPY . .

RUN npm run build

#stage2
FROM nginx:1.25-alpine AS runner

RUN rm /usr/share/nginx/html/index.html

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

ENTRYPOINT ["nginx", "-c", "/etc/nginx/nginx.conf"]
CMD ["-g", "daemon off;"]