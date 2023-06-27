## dbildungs-isle

We have the strategic goal SG-02 "stand-alone system". We want to succeed this goal, therefor we need to set the ErWIn system separate to the dBC. This repository is used for the development the separate ErWIn system to achieve this goal.

## Installation

```bash
$ npm install
```
## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Developer Notes

### Configuration

- We are using the Nest Config Service to access the configuration in the application
- The configuration will be loaded and validated once during startup and is treated as readonly
- The configuration is divided into two parts
  - Environment variables will be loaded first: best used to determine the environment and to store secrets
  - Loaded from json file is used for more static stuff like ports, db name or feature flags
  - These configs will NOT override each other


### Npm Scripts

### Console Applications

### Configuration
