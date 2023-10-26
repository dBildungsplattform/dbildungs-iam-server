import { IsBoolean, IsInt, IsNotEmpty, IsPositive, IsString, IsUrl, Max, Min } from 'class-validator';

export class FrontendConfig {
    @IsInt()
    @Min(1024)
    @Max(10000)
    public readonly PORT!: number;

    @IsString()
    @IsUrl()
    @IsNotEmpty()
    public readonly HOST!: string;

    @IsBoolean()
    @IsNotEmpty()
    public readonly SECURE_COOKIE!: boolean;

    @IsString()
    @IsNotEmpty()
    public readonly SESSION_SECRET!: string;

    @IsString()
    @IsNotEmpty()
    public readonly BACKEND_ADDRESS!: string;

    @IsInt()
    @IsPositive()
    @IsNotEmpty()
    public readonly SESSION_TTL_MS!: number;
}
