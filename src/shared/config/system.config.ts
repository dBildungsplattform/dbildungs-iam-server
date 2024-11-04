import { IsNumber } from 'class-validator';

export class SystemConfig {
    @IsNumber()
    public readonly RENAME_WAITING_TIME_IN_SECONDS!: number;

    @IsNumber()
    public readonly STEP_UP_TIMEOUT_IN_SECONDS!: number;
}
