# Configuration
> This site explains how configuration is implemented and gives guidelines on
> how to extend or implemented your own configuration modules. For configuration
> we are using the [@nestjs/config](https://www.npmjs.com/package/@nestjs/config)
> package which is also documented on the [NestJS](https://docs.nestjs.com/techniques/configuration)
> documentation site.

## Usage
The nest configuration package provides a module which must be imported to use the `ConfigService`.
We are using the config module as a global module, which makes the `ConfigService` globally available.
Here comes an example:

```ts
class MyClass {
    public constructor(private readonly configService: ServerConfig<ServerConfig, true>) {}

    public myFunction(): void {
        // the config key is compiled time checked => no typos
        const env: NodeEnvType = this.configService.getOrThrow<NodeEnvType>('NODE_ENV');
        // ...
    }
}
```

## How the configuration works?

### Lifecycle
> Config is loaded and validated on server startup, if provided config is not
> valid the server will write an error message to the console and shuts down.
> You can not start the server without a valid config.

* EnvConfig will be loaded and validated
  * Is loaded from environment variables
* JsonConfig
  * Is loaded form an environment specific json file
  * Json files can be found in the `config` folder in the repository root
  * Can be

### Config Types
* EnvConfig
  * Config which is loaded from environment variables
  * Is validated and parsed type safe
* JsonConfig
  *
* ServerConfig
  * Is the combined type

