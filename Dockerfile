ARG BASE_IMAGE_BUILDER=node:21.6.0-alpine3.19
FROM $BASE_IMAGE_BUILDER as build


WORKDIR /app
COPY tsconfig*.json ./
COPY package*.json ./

RUN npm ci

COPY src/ src/

RUN npm run build

FROM $BASE_IMAGE_BUILDER as deployment

#running apk upgrade --no-cache in this stage is less likely to introduce instability,
#because there are fewer moving parts and complexities. 
#The primary focus is on having the latest security updates for the runtime environment.

RUN apk upgrade --no-cache
ENV NODE_ENV=prod

WORKDIR /app
COPY package*.json ./
COPY config/ ./config/

RUN npm ci --omit-dev

COPY --from=build /app/dist/ ./dist/

CMD [ "node", "dist/src/server/main.js" ]