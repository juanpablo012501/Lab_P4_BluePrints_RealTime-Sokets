# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
# Vite incrusta estas variables en build-time (las llama el NAVEGADOR, por eso apuntan a localhost)
ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_IO_BASE=http://localhost:3001
ARG VITE_STOMP_BASE=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_IO_BASE=$VITE_IO_BASE VITE_STOMP_BASE=$VITE_STOMP_BASE
RUN npm run build

# Server stage (static server)
FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve
COPY --from=build /app/dist ./dist
EXPOSE 4173
CMD [ "serve", "-s", "dist", "-l", "4173" ]
