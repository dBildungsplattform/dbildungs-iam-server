import fs, { readFileSync } from 'fs';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { JsonConfig } from './json.config.js';
import { merge } from 'lodash-es';
import EnvConfig from './config.env.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFileToJSON(path: string): any {
    const file: string = readFileSync(path, { encoding: 'utf8' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
    return JSON.parse(file);
}

export function loadConfigFiles(): JsonConfig {
    const secretFilePath: string = './config/secrets.json';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
    const json: any = parseFileToJSON(`./config/config.json`);
    let secrets: unknown;
    if (fs.existsSync(secretFilePath)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
        secrets = parseFileToJSON(secretFilePath);
    } else {
        secrets = null;
    }
    // Environmental override
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
    const env: any = EnvConfig();
    let merged: unknown;
    if (secrets != null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
        merged = merge(json, secrets, env);
    } else {
        merged = merge(json, env);
    }

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
