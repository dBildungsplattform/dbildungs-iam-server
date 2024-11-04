import { IsInt, Min } from 'class-validator';

export class SystemConfig {
    @Min(0)
    @IsInt()
    public readonly RENAME_WAITING_TIME_IN_SECONDS!: number;

    @Min(0)
    @IsInt()
    public readonly STEP_UP_TIMEOUT_IN_SECONDS!: number;
}
