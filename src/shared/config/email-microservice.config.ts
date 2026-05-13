import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class EmailMicroserviceConfig {
    @IsBoolean()
    @IsNotEmpty()
    public readonly USE_EMAIL_MICROSERVICE!: boolean;

    @IsBoolean()
    @IsNotEmpty()
    public readonly LDAP_ENABLED!: boolean;

    @IsBoolean()
    @IsNotEmpty()
    public readonly OX_ENABLED!: boolean;

    @IsString()
    @IsNotEmpty()
    public readonly ENDPOINT!: string;
}
