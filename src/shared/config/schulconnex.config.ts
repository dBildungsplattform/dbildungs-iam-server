import { IsInt, Min } from 'class-validator';

export class SchulconnexConfig {
    @Min(0)
    @IsInt()
    public readonly LIMIT_PERSONENINFO!: number;
}
