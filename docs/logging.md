# Logging

> This site explains how logging is implemented in dBildungs-IAM-server
> and how it should be used by developers.
> Our logging is based on the [winston](https://www.npmjs.com/package/winston) library.
>
>

## General Structure

Logging is handled by different Logger Implementations.
Their role is to differentiate different log levels and domains:

### ModuleLogger

The ModuleLogger sets the level for a whole module.
All modules in this software are required to import the following in their module definition:
```typescript
LoggerModule.register(ThisModule.name)
```

This will create a logger with the name of the module and
set the log level to the one specified in the config.
Every module has an entry in the config file to set its log level.
If no entry is found, then the default loglevel is set for this module.

The entry has to follow the naming convention of `THISMODULE_LOG_LEVEL`
for the key where `THISMODULE` is the whole Module name in uppercase.
The value is the log level as string. The possible log levels are:
- `error`
- `warning`
- `notice`
- `info`
- `debug`

#### Config Example

```json
{
  "LOGGING": {
    "PERSONMODULE_LOG_LEVEL": "debug",
    "PERSONAPIMODULE_LOG_LEVEL": "debug"
  }
}
```

### ClassLogger

The ClassLogger is the workhorse of the logging system. This is the logger that
is injected into every Domain-`Controller`, `UC`, `Service` or `Repo` that logs something.
The ClassLogger is dependent on the ModuleLogger, since it derives it's formatting and
Metadata from it. Without a ModuleLogger the ClassLogger will fail initialization.

#### Usage
```typescript
class MyService {
  public constructor(private readonly logger: ClassLogger) {
  }

  public exampleMethod(): void {
    this.logger.debug('This is a debug message');
    this.logger.info('This is an info message');
    this.logger.notice('This is a notice message');
    this.logger.warning('This is a warning message');
    this.logger.error('This is an error message');
  }
}
```

### NestLogger

The NestLogger is an Implementation of the `LoggingService` from the `@nestjs/common` package.
This is to satisfy the NestJS framework, which requires a logger on startup that is derived
from the `LoggingService`. This is used for NestJS internal logging, which happens on a
Framework level instead of a Module level. It is set once in the `main.ts` file of the application.


> NOTICE: This documentation page was partially written using GitHub CoPilot to help with wording and structure and code examples.
