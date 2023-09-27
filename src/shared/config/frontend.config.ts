import { IsInt, Max, Min } from 'class-validator';

export class FrontendConfig {
    @IsInt()
    @Min(1024)
    @Max(10000)
    public readonly PORT!: number;
}
