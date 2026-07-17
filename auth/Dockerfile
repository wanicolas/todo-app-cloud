FROM node:22.23.1 AS base
WORKDIR /usr/local/app

# Dev stage — nodemon + tsx hot-reload
FROM base AS dev
COPY package.json package-lock.json tsconfig.json ./
RUN npm install
COPY spec ./spec
COPY src ./src
CMD ["npm", "run", "dev"]

# Build stage — build TypeScript
FROM dev AS build
RUN npm run build

# Production stage
FROM node:22.23.1-alpine AS production
WORKDIR /usr/local/app
ENV NODE_ENV=production
COPY --from=build /usr/local/app/package.json /usr/local/app/package-lock.json ./
RUN npm ci --production && npm cache clean --force
COPY --from=build /usr/local/app/dist ./dist
RUN chown -R node:node /usr/local/app
USER node
EXPOSE 3001
CMD ["node", "dist/src/index.js"]
