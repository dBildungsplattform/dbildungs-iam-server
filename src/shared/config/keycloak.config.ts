import { IsNotEmpty, IsString } from 'class-validator';

export class KeycloakConfig {
    @IsString()
    @IsNotEmpty()
    public readonly BASE_URL!: string;

    @IsString()
    @IsNotEmpty()
    public readonly REALM_NAME!: string;

    @IsString()
    @IsNotEmpty()
    public readonly CLIENT_ID!: string;

    @IsString()
    @IsNotEmpty()
    public readonly USERNAME!: string;

    @IsString()
    @IsNotEmpty()
    public readonly PASSWORD!: string;
}
