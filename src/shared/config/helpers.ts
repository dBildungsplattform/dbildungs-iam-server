import { readFileSync } from 'fs';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvConfig, NodeEnvType } from './env.config.js';
import { JsonConfig } from './json.config.js';

let envType: Option<NodeEnvType>;

export function validateConfig(config: Record<string, unknown>): EnvConfig {
    const parsedConfig = plainToInstance(EnvConfig, config, { enableImplicitConversion: true });
    const errors = validateSync(parsedConfig, {
        skipMissingProperties: false,
        whitelist: true,
        forbidUnknownValues: true,
    });
    if (errors.length !== 0) {
        throw new Error(
            errors.map((error) => error.toString()).reduce((previous, current) => `${previous}\n${current}`),
        );
    }
    envType = parsedConfig.NODE_ENV;
    return parsedConfig;
}

export function loadConfig(): JsonConfig {
    const json = JSON.parse(
        readFileSync(`./config/config.${envType || NodeEnvType.PROD}.json`, { encoding: 'utf8' }),
    ) as unknown;
    const config = plainToInstance(JsonConfig, json, { enableImplicitConversion: true });
    const errors = validateSync(config, {
        skipMissingProperties: false,
        whitelist: true,
        forbidUnknownValues: true,
    });
    if (errors.length !== 0) {
        throw new Error(
            errors.map((error) => error.toString()).reduce((previous, current) => `${previous}\n${current}`),
        );
    }
    return config;
}
