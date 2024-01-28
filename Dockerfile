ARG BASE_IMAGE_BUILDER=node:21.6.0-alpine3.18

# Build Stage
FROM $BASE_IMAGE_BUILDER as build

WORKDIR /app
COPY tsconfig*.json ./
COPY package*.json ./

RUN npm ci

COPY src/ src/

RUN npm run build

# Deployment Stage
FROM $BASE_IMAGE_BUILDER as deployment

ENV NODE_ENV=prod
WORKDIR /app
COPY package*.json ./
COPY config/ ./config/

RUN npm ci --omit-dev

COPY --from=build /app/dist/ ./dist/

CMD [ "node", "dist/src/server/main.js" ]