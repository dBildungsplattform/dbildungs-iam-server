import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class ImportConfig {
    @Min(0)
    @IsInt()
    public readonly IMPORT_FILE_MAXGROESSE_IN_MB!: number;

    @Min(0)
    @IsInt()
    public readonly IMPORT_MAX_NUMBER_OF_USERS!: number;

    @IsString()
    @IsNotEmpty()
    public readonly PASSPHRASE_SECRET!: string;
}
