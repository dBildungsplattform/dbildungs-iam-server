import { IsNotEmpty, IsString } from 'class-validator';

export class TelemetryConfig {
    @IsString()
    @IsNotEmpty()
    public readonly METRICS_URL!: string;

    @IsString()
    @IsNotEmpty()
    public readonly TRACES_URL!: string;
}
