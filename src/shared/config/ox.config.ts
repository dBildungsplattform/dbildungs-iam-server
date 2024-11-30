import { IsBooleanString, IsNumberString, IsOptional, IsString } from 'class-validator';

export class OxConfig {
    @IsBooleanString()
    public readonly ENABLED!: 'true' | 'false';

    @IsString()
    public readonly ENDPOINT!: string;

    @IsNumberString()
    public readonly CONTEXT_ID!: string;

    @IsString()
    public readonly CONTEXT_NAME!: string;

    @IsNumberString()
    @IsOptional()
    public readonly STANDARD_GROUP_ID?: string;

    @IsString()
    public readonly USERNAME!: string;

    @IsString()
    public readonly PASSWORD!: string;
}
