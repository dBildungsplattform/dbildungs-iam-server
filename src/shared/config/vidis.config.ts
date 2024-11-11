import { IsString } from 'class-validator';

export class VidisConfig {
    @IsString()
    public readonly BASE_URL!: string;

    @IsString()
    public readonly USERNAME!: string;

    @IsString()
    public readonly PASSWORD!: string;
}
