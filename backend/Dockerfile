FROM node:22 AS base
WORKDIR /usr/local/app

# Dev stage — nodemon + tsx hot-reload
FROM base AS dev
COPY package.json package-lock.json tsconfig.json ./
RUN npm install
COPY spec ./spec
COPY src ./src
CMD ["npm", "run", "dev"]

# Test stage — build TypeScript + run tests
FROM dev AS test
RUN npm run build
RUN npm run test

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=test /usr/local/app/package.json /usr/local/app/package-lock.json ./
RUN npm ci --production && npm cache clean --force
COPY --from=test /usr/local/app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/src/index.js"]
