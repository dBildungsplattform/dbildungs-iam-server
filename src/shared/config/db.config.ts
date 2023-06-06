import { IsNotEmpty, IsString, Matches } from "class-validator";

export class DbConfig {
    @IsString()
    @Matches("postgres://.+:.+@.+")
    public readonly CLIENT_URL!: string;

    @IsString()
    @IsNotEmpty()
    public readonly DB_NAME!: string;
}
