import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class KafkaConfig {
    @IsString()
    public readonly BROKER!: string;

    @IsString()
    public readonly TOPIC_PREFIX!: string;

    @IsString()
    public readonly USER_TOPIC!: string;

    @IsString()
    public readonly USER_DLQ_TOPIC!: string;

    @IsString()
    public readonly GROUP_ID!: string;

    @IsNumber()
    public readonly SESSION_TIMEOUT!: number;

    @IsNumber()
    public readonly HEARTBEAT_INTERVAL!: number;

    @IsBoolean()
    public readonly ENABLED!: boolean;

    @IsBoolean()
    public readonly SASL_ENABLED!: boolean;

    @IsString()
    public readonly USERNAME!: string;

    @IsString()
    public readonly PASSWORD!: string;
}
