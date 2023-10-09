ARG BASE_IMAGE=node:20.5.1-alpine3.17
FROM $BASE_IMAGE as deployment

WORKDIR /app

COPY tsconfig*.json ./
COPY package*.json ./

RUN npm ci

COPY src/ src/

RUN npm run build

FROM $BASE_IMAGE
ENV NODE_ENV=prod

WORKDIR /app
COPY package*.json ./
COPY config/ ./config/

RUN npm ci --omit-dev

COPY --from=deployment /app/dist/ ./dist/

CMD [ "node", "dist/src/server/main.js" ]