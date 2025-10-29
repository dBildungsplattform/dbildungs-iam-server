import { IsBoolean, IsNotEmpty } from 'class-validator';

export class EmailMicroserviceConfig {
    @IsBoolean()
    @IsNotEmpty()
    public readonly USE_EMAIL_MICROSERVICE!: boolean;

    @IsNotEmpty()
    @IsNotEmpty()
    public readonly ENDPOINT!: string;
}
