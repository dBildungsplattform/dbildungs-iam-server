import { IsNotEmpty, IsString } from 'class-validator';

export class LdapConfig {
    @IsString()
    @IsNotEmpty()
    public readonly URL!: string;

    @IsString()
    @IsNotEmpty()
    public readonly BIND_DN!: string;

    @IsString()
    @IsNotEmpty()
    public readonly ADMIN_PASSWORD!: string;
}
