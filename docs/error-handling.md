# Error Handling

SchulConnex define a format for errors in the API. Unfortunately The SchulConnex error format does not contain a key that is suitable for translation. Therefore for endpoints that are to follow the SchulConnex API we return the respective error format. For our own services we return an `DbiamError` containing an i18nKey.

Error handling in Nest.js is done by `ExceptionFilters`. Each Controller and each endpoint can define what `ExceptionFilters` to use.

### SchulConnex Errors
```json
{
"code": "401",
"subcode": "01",
"titel": " Access Token abgelaufen",
"beschreibung": "Der Access-Token ist abgelaufen und muss erneuert werden."
}
```

The current list of possible Errors is listed either in the [official documentation](https://github.com/SchulConneX/v1)
or in our [Confluence](https://docs.dbildungscloud.de/x/sIbbE).

## Error Types

### Domain Errors

Domain errors should extend the `DomainError` class. Each module needs to implement its own `ExceptionFilter` to transform the `DomainErrors` of the module into `DbiamErrors`. It might be necessary to add another `ExceptionFilter` to transform into `SchulConnexErrors` for the SchoolConnex endpoints.

It is important, that we do NOT throw Errors from our Domain layer, but return them as part of the result.
(For details, see the general Codestyle Documentation //TODO!!!)

Those should also be documented in our [Confluence](https://docs.dbildungscloud.de/x/sIbbE)

### Validation Errors

If the validation rules implemented with Decorators in the DTO classes are violated, the `class-validator` lib throws `ValidationErrors`.<br>

The `GlobalValidationPipe` defines rules for handling the `ValidationErrors` and aggregates multiple `ValidationErrors` for one requests into one `DetailedValidationError`.<br>
The `SchulConnexValidationErrorFilter` catches all `DetailedValidationError` and transforms them into `SchulConnexErrors`.

`SchulConnexValidationErrorFilter` is globally defined, so that it transforms all `DetailedValidationError` for all controllers.<br>
Thus if you need your controller to transform validation errors into `DbiamErrors` you need to define an `ExceptionFilter` for that controller.

### Global Error Handler
All other errors are handled by the `GlobalExceptionFilter`.
