import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class EmailWebhookConfig {
    @IsString()
    @IsNotEmpty()
    public readonly ENDPOINT!: string;

    @Min(0)
    @IsInt()
    public readonly NUMBER_OF_RETRIES!: number;

    @Min(0)
    @IsInt()
    public readonly RETRY_DELAY!: number;
}
