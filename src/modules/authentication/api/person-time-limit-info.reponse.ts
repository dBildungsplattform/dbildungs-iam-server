import { ApiProperty } from '@nestjs/swagger';
import { TimeLimitOccasion } from '../domain/time-limit-occasion.enums.js';

export class PersonTimeLimitInfoResponse {
    @ApiProperty({ nullable: true })
    public occasion: TimeLimitOccasion;

    @ApiProperty({ nullable: true })
    public deadline: string;

    public constructor(occasion: TimeLimitOccasion, deadline: Date) {
        this.occasion = occasion;
        this.deadline = deadline?.toISOString();
    }
}
