import { IsNotEmpty, IsString } from 'class-validator';

export class MetricsConfig {
    @IsString()
    @IsNotEmpty()
    public readonly USERNAME!: string;

    @IsString()
    @IsNotEmpty()
    public readonly PASSWORD!: string;
}
