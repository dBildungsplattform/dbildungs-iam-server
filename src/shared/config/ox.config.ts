import { IsBooleanString, IsNumberString, IsOptional, IsString } from 'class-validator';

export class OxConfig {
    @IsBooleanString()
    public readonly ENABLED!: 'true' | 'false';

    @IsString()
    @IsOptional()
    public readonly ENDPOINT!: string;

    @IsNumberString()
    @IsOptional()
    public readonly CONTEXT_ID!: string;

    @IsString()
    @IsOptional()
    public readonly CONTEXT_NAME!: string;

    @IsString()
    @IsOptional()
    public readonly USERNAME!: string;

    @IsString()
    @IsOptional()
    public readonly PASSWORD!: string;
}
