FROM node:22 AS base
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
