import { IsEnum } from 'class-validator';

export enum NodeEnvType {
    TEST = 'testing',
    DEV = 'development',
    PROD = 'production',
}

export class EnvConfig {
    @IsEnum(NodeEnvType)
    public readonly NODE_ENV!: NodeEnvType;
}
