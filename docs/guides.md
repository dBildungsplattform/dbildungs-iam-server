# Developer Guides

## Error Handling

### Domain Errors

Domain errors should extend from an Nest Http Error. This allows Nest to understand
directly the thrown errors and will translate them into the default http error response.

### Global Exception Filter

We are using a global exception filter which will catch and translate all known errors
and return a 500 status code for all unknown errors.

### SchulConnex Error Format

The SchulConnex interface has specific errors for many error scenarios. Therefore we have
to translate our own domain errors into SchulConnex specific errors.
We use the SchulConnex JSON-structure for all our errors.
The GlobalExceptionFilter will translate all errors into SchulConnex structure.

The body of an error response looks like this.
``` js
type SchulConnexError = {
    statusCode: number;
    subcode: string;
    title: string;
    description: string;
};
```
