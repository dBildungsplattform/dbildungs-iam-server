import { IsBoolean, IsHexadecimal, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class FrontendConfig {
    @IsInt()
    @Min(1024)
    @Max(10000)
    public readonly PORT!: number;

    @IsBoolean()
    @IsNotEmpty()
    public readonly SECURE_COOKIE!: boolean;

    @IsString()
    @IsHexadecimal()
    @IsNotEmpty()
    public readonly SESSION_KEY!: string;

    @IsString()
    @IsNotEmpty()
    public readonly BACKEND_ADDRESS!: string;
}
