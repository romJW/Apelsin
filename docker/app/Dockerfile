FROM node:16-alpine as builder

WORKDIR /app
COPY package.json .


RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

WORKDIR /app

COPY /docker/nginx/conf.d /etc/nginx/conf.d

RUN rm -rf /usr/share/nginx/html/*

# Copy from the stahg 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]


