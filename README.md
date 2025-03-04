# dBildungs IAM Server

We have the strategic goal SG-02 "stand-alone system". We want to succeed this goal, therefor we need to set the ErWIn system separate to the dBC. This repository is used for the development the separate ErWIn system to achieve this goal.

## Prerequisites

* Node in the version stated in the `package.json`
* Container Runtime like Docker or Podman
  * Is required for local setup and integration tests

## Local Setup

1. Run `npm ci` to install all dependencies
2. Start the required services from the `compose.yaml` file
   * db
   * keycloak
   * redis
3. Create a `.env` file and set the required environment variables from `env.config.ts`
4. run `npm run setup` to initialize the DB and seed data
5. Run `npm run start:debug` to start the server
6. Server runs on the url printed in the console

## Scripts for Development

| Command                  | Description                                                           | Hint                                           |
|:-------------------------|:----------------------------------------------------------------------|:-----------------------------------------------|
| **Setup**                |                                                                       |                                                |
| npm ci                   | Installs all required dependencies                                    |                                                |
| **Build**                |                                                                       |                                                |
| npm run build            | Compiles all `*.ts` files                                             |                                                |
| **Run**                  |                                                                       |                                                |
| npm run start            | Starts the server                                                     | No debug port                                  |
| npm run start:debug      | Starts the server in debug mode                                       | Debug port is open                             |
| npm run start:prod       | Starts the server in production mode                                  |                                                |
| **Test**                 |                                                                       |                                                |
| npm run test:cov         | Runs all tests with coverage                                          | Success is a merge requirement                 |
| npm run test:unit        | Runs only unit tests                                                  | Files with `*.spec.ts` ending                  |
| npm run test:integration | Runs only integration tests                                           | Files with `*.integration-spec.ts` ending      |
| npm run test:watch       | Starts the interactive watch mode                                     |                                                |
| **Lint**                 |                                                                       |                                                |
| npm run format           | Runs the formatter                                                    |                                                |
| npm run lint             | Runs the linter                                                       | Success is a merge requirement                 |
| npm run lint:fix         | Runs the linter and fixes auto fixable problems                       |                                                |
| **Console Applications** |                                                                       |                                                |
| npm run setup            | Runs db:init to Initialize the DB                                     |                                                |
| npm run db:init          | Initializes the database (applies SQL schema)                         | `compose.yaml` can be used                     |
| npm run db:seed DATA_DIR | Creates seeding-data. DATA_DIR is required, FILES_TO_EXCLUDE optional | e.g. npm run db:seed DATA_DIR FILES_TO_EXCLUDE |

## Docker Compose

# Profiles help control which services are started based on the deployment needs. Below are the defined profiles:

* minimal (default): PostgreSQL, Keycloak, Keycloak DB microservice, Redis, and database initialization.

* fe-datum: Minimal backend with frontend for DaTUM, including cron service.

* third-party: OpenLDAP, PHP LDAP admin (GUI), PrivacyIDEA, and MariaDB for PrivacyIDEA.

* backend-only: Full backend setup without frontend, including cron service.

* full: Full backend with frontend, OpenLDAP, PrivacyIDEA, and MariaDB.

* privacy-idea: Standalone PrivacyIDEA service with MariaDB.

* kafka: Standalone Kafka service with topic initialization.

* full-with-kafka: Full backend, frontend, Kafka, PrivacyIDEA, and MariaDB.

* frontend: Only the frontend.

# Running Specific Profiles

To start services based on a profile, use:

`docker compose --profile <profile-name> up`

For example, to start only the backend services:

`docker compose --profile backend-only up`

To run the full system including frontend:

`docker compose --profile full up`

To add Kafka:

`docker compose --profile kafka up`

## Developer Guides

* Code conventions are enforced through the compile, eslint and prettier as far as possible
  * Non enforcable conventions will be documented here. If they become enforcable we will put them into
      automation.
  * Table names will be all lowercase if the name contains multiple words they will be separated by
        underscores.
* Git conventions can be found [here](./docs/git.md)
* Test conventions can be found [here](./docs/tests.md)
* Configuration conventions can be found [here](./docs/config.md)
* Authentication guides can be found [here](./docs/auth.md)
* Developer notes can be found [here](./docs/developer-notes.md)
* Seeding notes can be found [here](./docs/seeding.md)
* Migration notes can be found [here](./docs/migration.md)

## Testing Guides
* Help on how to test API with Insomnia can be found at [API manuell lokal testen mit Insomnia](./docs/test-api-with-insomnia.md)

## Package (Create Docker Image )

If you push a tag upstream a container will be created for you. (Check Github under Packages)

ghcr.io/dbildungsplattform/dbildungs-iam-server:*tag*

## License

The software is licensed under the [EUPL-1.2 license](./LICENSE).
