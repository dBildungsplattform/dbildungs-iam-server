import { IsInt, Min, Max, IsNotEmpty, IsString } from 'class-validator';

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

    @IsInt()
    @Min(900)
    @Max(1000)
    public readonly MAX_QUEUE_SIZE!: number;

    @IsInt()
    @Min(5)
    @Max(10)
    public readonly MAX_EXPORT_BATCH_SIZE!: number;

    @IsInt()
    @Min(400)
    @Max(500)
    public readonly SCHEDULED_DELAY_MILLIS!: number;

    @IsInt()
    @Min(20000)
    @Max(30000)
    public readonly EXPORT_TIMEOUT_MILLIS!: number;
}
