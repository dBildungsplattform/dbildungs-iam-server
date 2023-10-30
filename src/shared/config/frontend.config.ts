import { IsBoolean, IsInt, IsNotEmpty, IsPositive, IsString, Max, Min } from 'class-validator';

export class FrontendConfig {
    @IsInt()
    @Min(1024)
    @Max(10000)
    public readonly PORT!: number;

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

    @IsString()
    @IsNotEmpty()
    public readonly OIDC_CALLBACK_URL!: string;

    @IsString()
    @IsNotEmpty()
    public readonly DEFAULT_AUTH_REDIRECT!: string;
}
