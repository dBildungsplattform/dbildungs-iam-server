import { IsInt, Max, Min, ValidateNested, validateSync } from "class-validator";
import { DbConfig } from "./shared/index.js";
import { readFile } from "node:fs/promises";

const DEFAULT_CONFIG_PATH = "./config/config.json";

export class ServerConfig {
    @IsInt()
    @Min(1024)
    @Max(10000)
    public readonly HOST_PORT!: number;

    @ValidateNested()
    public readonly DB!: DbConfig;

    public constructor(config: unknown) {
        Object.assign(this, config);
    }
}

export async function loadConfig(): Promise<Record<string, unknown>> {
    const config = JSON.parse(await readFile(DEFAULT_CONFIG_PATH, { encoding: "utf8" })) as Record<string, unknown>;
    console.warn(config.toString());
    return config;
}

export function validateConfig(config: Record<string, unknown>): ServerConfig {
    console.warn(config);
    const serverConfig = new ServerConfig(config);
    const result = validateSync(serverConfig);
    if (result.length !== 0) {
        throw new Error(result.toString());
    }
    return serverConfig;
}
