ARG BASE_IMAGE_BUILDER=node:22.21.0-alpine3.22

# Build Stage
FROM $BASE_IMAGE_BUILDER as build

WORKDIR /app
COPY tsconfig*.json ./
COPY package*.json ./

RUN npm ci

COPY src/ src/
COPY migrations/ migrations/

RUN npm run build

# Deployment Stage
FROM $BASE_IMAGE_BUILDER as deployment

USER node
ENV NODE_ENV=prod
WORKDIR /app
COPY package*.json ./
COPY config/ ./config/

RUN npm ci --omit-dev

COPY --from=build /app/dist/ ./dist/
COPY /seeding/ /app/seeding/
COPY /keycloak-migrations/ /app/keycloak-migrations/
CMD [ "node", "dist/src/server/main.js" ]
