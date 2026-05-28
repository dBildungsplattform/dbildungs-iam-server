import { IsString } from 'class-validator';

export class VidisConfig {
    @IsString()
    public readonly BASE_URL!: string;

    @IsString()
    public readonly CLIENT_ID!: string;

    @IsString()
    public readonly CLIENT_SECRET!: string;
}
