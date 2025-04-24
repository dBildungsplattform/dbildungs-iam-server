import { IsInt, IsOptional, Min } from 'class-validator';

export class EmailConfig {
    @Min(0)
    @IsInt()
    @IsOptional()
    public readonly NON_ENABLED_EMAIL_ADDRESS_DEADLINE_IN_DAYS?: number;
}
