import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class TelemetryConfig {
    @IsString()
    @IsNotEmpty()
    public readonly HOST!: string;

    @IsInt()
    @Min(1024)
    @Max(10000)
    public readonly PORT!: number;
}
