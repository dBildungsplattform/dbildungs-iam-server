import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class EmailMicroserviceConfig {
    @IsBoolean()
    @IsNotEmpty()
    public readonly USE_EMAIL_MICROSERVICE!: boolean;

    @IsString()
    @IsNotEmpty()
    public readonly ENDPOINT!: string;

    @IsString()
    @IsNotEmpty()
    public readonly API_KEY!: string;
}
