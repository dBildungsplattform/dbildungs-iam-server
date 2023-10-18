# Auth

This document explains how to work with `nest-keycloak-connect` (https://github.com/ferrerojosh/nest-keycloak-connect)

## Controllers and Endpoints

By default, every endpoint in the backend module can only be accessed by logged in users.
Authentication is handled by keycloak and the token is passed as a Bearer-Token in the `Authorization`-header.

By annotating controllers or endpoints with `@Public()` or `@Unprotected()` you can disable authentication.
