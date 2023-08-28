import { readFileSync } from 'fs';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validateSync } from 'class-validator';
import { EnvConfig, NodeEnvType } from './env.config.js';
import { JsonConfig } from './json.config.js';
import { merge } from 'lodash-es';

// TODO: this is necessary for state management and to determine which
// config json should be loaded, if we use generated config json via
// Kubernetes this will no longer be necessary: EW-???
let envType: NodeEnvType = NodeEnvType.PROD;

export function loadEnvConfig(config: Record<string, unknown>): EnvConfig {
    const parsedConfig: EnvConfig = plainToInstance(EnvConfig, config, { enableImplicitConversion: true });
    const errors: ValidationError[] = validateSync(parsedConfig, {
        skipMissingProperties: false,
        whitelist: true,
        forbidUnknownValues: true,
    });
    if (errors.length !== 0) {
        throw new Error(
            errors
                .map((error: ValidationError) => error.toString())
                .reduce((previous: string, current: string) => `${previous}\n${current}`),
        );
    }
    envType = parsedConfig.NODE_ENV;
    return parsedConfig;
}

export function loadConfigFiles(): JsonConfig {
    const json: any = JSON.parse(readFileSync(`./config/config.${envType}.json`, { encoding: 'utf8' }));
    const secrets: any = JSON.parse(readFileSync('./config/secrets.json', { encoding: 'utf8' }));
    const merged = merge(json, secrets);
    const mergedConfig: JsonConfig = plainToInstance(JsonConfig, merged, { enableImplicitConversion: true });

    const errors: ValidationError[] = validateSync(mergedConfig, {
        skipMissingProperties: false,
        whitelist: true,
        forbidUnknownValues: true,
    });
    if (errors.length !== 0) {
        throw new Error(
            errors
                .map((error: ValidationError) => error.toString())
                .reduce((previous: string, current: string) => `${previous}\n${current}`),
        );
    }
    return mergedConfig;
}
