import { ApiProperty } from '@nestjs/swagger';
import { TimeLimitOccasion } from '../../person/domain/time-limit-occasion.enums.js';

export class PersonTimeLimitInfoResponse {
    @ApiProperty()
    public occasion: TimeLimitOccasion;

    @ApiProperty()
    public deadline: string;

    public constructor(occasion: TimeLimitOccasion, deadline: Date) {
        this.occasion = occasion;
        this.deadline = deadline.toISOString();
    }
}
