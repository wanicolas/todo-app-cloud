###################################################
# Dockerfile de production
#
# Construit l'image finale qui bundle le backend compilé
# et les assets statiques du client. Utilisé pour le
# déploiement (pas pour le dev — voir compose.yaml).
###################################################

FROM node:22 AS base
WORKDIR /usr/local/app

###################################################
# Stage: client-build
# Installe les deps client et build les assets statiques.
###################################################
FROM base AS client-build
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/.eslintrc.cjs client/index.html client/vite.config.js client/tsconfig.json ./
COPY client/public ./public
COPY client/src ./src
RUN npm run build

###################################################
# Stage: backend-build
# Installe les deps backend, compile TypeScript et
# lance les tests. Si les tests échouent, le build
# s'arrête ici.
###################################################
FROM base AS backend-build
COPY backend/package.json backend/package-lock.json backend/tsconfig.json ./
RUN npm install
COPY backend/src ./src
COPY backend/spec ./spec
RUN npm run build
RUN npm run test

###################################################
# Stage: final
# Image de production minimale. Copie le backend
# compilé et les assets client dans dist/static.
###################################################
FROM node:22-slim AS final
WORKDIR /usr/local/app
ENV NODE_ENV=production
COPY --from=backend-build /usr/local/app/package.json /usr/local/app/package-lock.json ./
RUN npm ci --production && npm cache clean --force
COPY --from=backend-build /usr/local/app/dist ./dist
COPY --from=client-build /usr/local/app/dist ./dist/src/static
EXPOSE 3000
CMD ["node", "dist/src/index.js"]
