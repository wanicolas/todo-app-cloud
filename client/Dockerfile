FROM node:26.8.1 AS base
WORKDIR /usr/local/app

# Dev stage — Vite hot-reload
FROM base AS dev
COPY package.json package-lock.json ./
RUN npm install
COPY .eslintrc.cjs index.html vite.config.js tsconfig.json ./
COPY public ./public
COPY src ./src
CMD ["npm", "run", "dev"]

# Build stage — production static assets
FROM dev AS build
RUN npm run build

# Production stage — serve static assets via Nginx
FROM nginxinc/nginx-unprivileged:1.27.3-alpine AS production
COPY --from=build /usr/local/app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
