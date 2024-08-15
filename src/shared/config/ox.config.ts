import { IsBooleanString, IsString } from 'class-validator';

export class OxConfig {
    @IsBooleanString()
    public readonly ENABLED!: 'true' | 'false';

    @IsString()
    public readonly ENDPOINT!: string;

    @IsString()
    public readonly USERNAME!: string;

    @IsString()
    public readonly PASSWORD!: string;
}
