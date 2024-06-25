# Keycloak Step-Up Flow with Level of Authentication (LOA)

## Intro

Currently, this documenation does not hold any information about the implementation on the backend side in this project.
Its purpose is, to show what needs to be implemented in the future, what has been done yet (2024-06-07) and what attempts of implementing
a way of dynamically raising the level of authentication for a user have been made in the dbiam-server project.

## Current state
Currently, only the config of the keycloak project was adjusted, therefore a new flow "stepup" is available and already assigned to the spsh-client.
Two ACR values were introduced, silver=10, gold=20.

In this project, only one thing was adjusted, the [OpenIdConnectStrategy](./../src/modules/authentication/passport/oidc.strategy.ts) now sends ACR-value to client (passport).

## What still has to be implemented
The current state does not take into account any dynamical adjustments of ACR, the strategy and its constructor is not called everytime a method in any
controller is called, therefore the whole dynamically adjusting and raising of LOA and ACR value based on specific endpoints still has to be implemented.

## Failed attempts (so far)

- manipulating header or params via LoginGuard, AccessGuard or PermissionsInterceptor, to set the ACR dynamically => ACR values was not set
- implementing new PassportStrategy with a new AuthGuard e.g. AuthGuard('oidc-acr') => Resulted in CORS errors
- implementing new interceptor to manipulate header or params sent, to change the ACR dynamically => ACR values was not set
