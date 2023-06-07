import { readFileSync } from "fs";
import { Type, plainToClass } from "class-transformer";
import { ValidateNested, validateSync } from "class-validator";
import { DbConfig } from "./db.config.js";
import { HostConfig } from "./host.config.js";

const DEFAULT_CONFIG_PATH = "./config/config.json";

export class ServerConfig {
    @ValidateNested()
    @Type(() => HostConfig)
    public readonly HOST!: HostConfig;

    @ValidateNested()
    @Type(() => DbConfig)
    public readonly DB!: DbConfig;
}

export function loadConfig(): ServerConfig {
    const json = JSON.parse(readFileSync(DEFAULT_CONFIG_PATH, { encoding: "utf8" })) as unknown;
    const config = plainToClass(ServerConfig, json, { enableImplicitConversion: true });
    const errors = validateSync(config, {
        skipMissingProperties: false,
        whitelist: false,
        forbidNonWhitelisted: true,
        forbidUnknownValues: false,
        skipNullProperties: false,
        skipUndefinedProperties: false,
    });
    if (errors.length !== 0) {
        throw new Error(
            errors.map((error) => error.toString()).reduce((previous, current) => `${previous}\n${current}`),
        );
    }
    return config;
}
