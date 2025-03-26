import { IsBoolean, IsNumberString, IsString } from 'class-validator';

export class OxConfig {
    @IsBoolean()
    public readonly ENABLED!: boolean;

    @IsString()
    public readonly ENDPOINT!: string;

    @IsNumberString()
    public readonly CONTEXT_ID!: string;

    @IsString()
    public readonly CONTEXT_NAME!: string;

    @IsString()
    public readonly USERNAME!: string;

    @IsString()
    public readonly PASSWORD!: string;
}
