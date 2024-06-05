import { IsString } from 'class-validator';

export class ItsLearningConfig {
    @IsString()
    public readonly ENDPOINT!: string;

    @IsString()
    public readonly USERNAME!: string;

    @IsString()
    public readonly PASSWORD!: string;
}
