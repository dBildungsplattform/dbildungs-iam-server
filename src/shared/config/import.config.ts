import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ImportConfig {
    @Min(0)
    @IsInt()
    public readonly CSV_FILE_MAX_SIZE_IN_MB!: number;

    @Min(0)
    @IsInt()
    public readonly CSV_MAX_NUMBER_OF_USERS!: number;

    @IsString()
    @IsNotEmpty()
    public readonly PASSPHRASE_SECRET!: string;

    @IsString()
    @IsNotEmpty()
    public readonly PASSPHRASE_SALT!: string;
}
