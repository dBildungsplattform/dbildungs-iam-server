import { IsString } from 'class-validator';

export class PrivacyIdeaConfig {
    @IsString()
    public readonly USERNAME!: string;

    @IsString()
    public readonly PASSWORD!: string;

    @IsString()
    public readonly USER_RESOLVER!: string;

    @IsString()
    public readonly ENDPOINT!: string;
}
