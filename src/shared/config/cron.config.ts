import { IsInt, Min } from 'class-validator';

export class CronConfig {
    @Min(0)
    @IsInt()
    public readonly PERSON_WITHOUT_ORG_LIMIT!: number;
}
