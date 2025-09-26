import { IsBoolean, IsInt, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

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

    @Min(0)
    @IsInt()
    @IsOptional()
    public readonly NUMBER_OF_RETRIES?: number;

    @IsString()
    public readonly USER_PASSWORD_DEFAULT!: string;

    @Min(0)
    @IsInt()
    @IsOptional()
    public readonly EMAIL_ADDRESS_DELETED_EVENT_DELAY?: number;
}
