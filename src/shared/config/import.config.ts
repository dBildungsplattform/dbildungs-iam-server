import { IsInt } from 'class-validator';

export class ImportConfig {
    @IsInt()
    public readonly IMPORT_FILE_MAXGROESSE_IN_MB!: number;
}
