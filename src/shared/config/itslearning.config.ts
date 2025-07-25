import { IsBoolean, IsInt, IsPositive, IsString } from 'class-validator';

export class ItsLearningConfig {
    @IsBoolean()
    public readonly ENABLED!: boolean;

    @IsString()
    public readonly ENDPOINT!: string;

    @IsString()
    public readonly USERNAME!: string;

    @IsString()
    public readonly PASSWORD!: string;

    @IsString()
    public readonly ROOT!: string;

    @IsString()
    public readonly ROOT_OEFFENTLICH!: string;

    @IsString()
    public readonly ROOT_ERSATZ!: string;

    @IsInt()
    @IsPositive()
    public readonly MAX_BATCH_SIZE!: number;

    @IsInt()
    @IsPositive()
    public readonly MAX_ATTEMPTS!: number;

    @IsInt()
    @IsPositive()
    public readonly RETRY_DELAY_MS!: number;
}
