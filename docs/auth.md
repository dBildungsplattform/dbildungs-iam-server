# Auth

The backend allows authention using bearer tokens or sessions.

## Session

When logged in using the `Auth`-Module, the backend will store valid access-tokens for the session.

Any request will pass through the [SessionTokenMiddleware](/src/modules/authentication/services/session-access-token.middleware.ts), which will just extract the token from the session copy it to the `Authentication`-Header as a bearer-token.

For all intents and purposes, sessions are just another way to pass a bearer-token to the backend.

## Bearer Token

If the request contains a bearer token (either directly or set by the session middleware), it will be given to `nest-keycloak-connect` to validate it.

This document explains how to work with `nest-keycloak-connect` (https://github.com/ferrerojosh/nest-keycloak-connect)

## Controllers and Endpoints

By default, every endpoint in the backend module can only be accessed by logged in users.
Authentication is handled by keycloak and the token is passed as a Bearer-Token in the `Authorization`-header.

By annotating controllers or endpoints with `@Public()` or `@Unprotected()` you can disable authentication.
