# Keycloak Database Microservice Documentation

## Overview

The Keycloak Database Microservice (kc-db-microservice) is a NestJS application responsible for handling all interactions with the internal Keycloak database. It is designed to encapsulate and manage the database connection, ensuring that only this microservice has access to the sensitive connection details.

## Configuration

The microservice uses the `ConfigModule` from `@nestjs/config` to manage its configuration. The configuration is loaded from `kc-db-microservice.env`. The port on which the microservice is listening on can be configured.

## Using the microservice

The service can be started with the standard docker-compose up command.

Build the Docker Image:

```sh
docker-compose build keycloak-db-microservice
```

Run the Docker Container:

```sh
docker-compose up keycloak-db-microservice
```

Start the microservice:

```sh
npm run start:kc-db-microservice
```

Debug the microservice:

```sh
npm run debug:kc-db-microservice
```
