# Configuration
> This site explains how configuration is implemented and gives guidelines on
> how to extend or implemented your own configuration modules. For configuration
> we are using the [@nestjs/config](https://www.npmjs.com/package/@nestjs/config)
> package which is also documented on the [nestjs](https://docs.nestjs.com/techniques/configuration)
> documentation site.

## Usage
The nest configuration package provides a module which must be imported to use the `ConfigService`.
We are using the config module as a global module, which makes the `ConfigService` globally available.
Here comes an example:

```ts
class MyClass {
    public constructor(private readonly configService: ServerConfig<ServerConfig, true>) {}

    public myFunction(): void {
        // the config keys are compile time checked
        const env: NodeEnvType = this.configService.getOrThrow<NodeEnvType>('NODE_ENV');
        const dbConfig: DbConfig = this.configService.getOrThrow<DbConfig>('DB');
        // ...
    }
}
```

## Structure

![Configuration Composition Structure](./img/config-structure.svg)

* **General**
  * The configuration is loaded and validated on application startup
  * The validation uses decorators from the `class-validator` package
  * If the configuration is not valid, the application will stop with an error
  * The parsing from the environment and json is type safe
* **ServerConfig**
  * Is the top level configuration type and combines EnvConfig and JsonConfig
  * Should be used as the generic parameter e.g. `ConfigService<ServerConfig, true>`
* **EnvConfig**
  * Is loaded from environment variables and .env file
  * Should be used for secrets or api keys
* **JsonConfig**
  * Is loaded form an environment specific json file
  * Json files can be found in the `config` folder in the repository root

## How to expand the configuration?

* Where to put the new config value?
  * If it's secret, than put it into the `EnvConfig`
    * Annotate the new property with the desired decorators
    * IMPORTANT: Do NOT put complex types into the `EnvConfig`, only primitive values
  * If it's something like a feature flag, than put it into the `JsonConfig`
    * Annotate the new property with the desired decorators
* Do I want to expand an existing config class like `DbConfig`? If yes, than do the following steps:
  * Put the new configuration value in the desired class
  * Annotate the new property with the desired decorators
* I wan to add configuration for a new feature
  * Use the `DbConfig` as reference
    * [ ] Create a new class in the `src/shared/config` folder
    * [ ] Annotate the properties with the desired decorators
    * [ ] Add your config to the `JsonConfig` class with the required decorators
    * [ ] Add your config class to the `src/shared/config/index.ts` file
    * [ ] Add default values to the environment specific json files
