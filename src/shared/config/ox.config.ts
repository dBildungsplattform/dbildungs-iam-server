import { IsBooleanString, IsNumberString, IsOptional, IsString } from 'class-validator';

export class OxConfig {
    @IsBooleanString()
    public readonly ENABLED!: 'true' | 'false';

    @IsString()
    @IsOptional()
    public readonly ENDPOINT!: string | undefined;

    @IsNumberString()
    @IsOptional()
    public readonly CONTEXT_ID!: string | undefined;

    @IsString()
    @IsOptional()
    public readonly CONTEXT_NAME!: string | undefined;

    @IsString()
    @IsOptional()
    public readonly USERNAME!: string | undefined;

    @IsString()
    @IsOptional()
    public readonly PASSWORD!: string | undefined;
}
