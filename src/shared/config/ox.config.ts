import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class OxConfig {
    @IsBoolean()
    public readonly ENABLED!: boolean;

    @IsString()
    @IsOptional()
    public readonly ENDPOINT?: string;

    @IsString()
    @IsOptional()
    public readonly CONTEXT_ID?: string;

    @IsString()
    @IsOptional()
    public readonly CONTEXT_NAME?: string;

    @IsString()
    @IsOptional()
    public readonly USERNAME?: string;

    @IsString()
    @IsOptional()
    public readonly PASSWORD?: string;
}
