import { IsEnum } from 'class-validator';

export enum NodeEnvType {
    TEST = 'test',
    DEV = 'dev',
    PROD = 'prod',
}

export class EnvConfig {
    @IsEnum(NodeEnvType)
    public readonly NODE_ENV!: NodeEnvType;
}
