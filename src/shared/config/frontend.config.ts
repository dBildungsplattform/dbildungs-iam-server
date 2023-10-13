import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class FrontendConfig {
    @IsInt()
    @Min(1024)
    @Max(10000)
    public readonly PORT!: number;

    @IsString()
    @IsNotEmpty()
    public readonly SESSION_SECRET!: string;
}
