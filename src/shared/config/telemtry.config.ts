import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class TelemetryConfig {
    @IsString()
    @IsNotEmpty()
    public readonly METRICS_URL!: string;

    @IsString()
    @IsNotEmpty()
    public readonly TRACES_URL!: string;

    @IsInt()
    @Min(50000)
    @Max(60000)
    public readonly EXPORT_INTERVAL!: number;
}
