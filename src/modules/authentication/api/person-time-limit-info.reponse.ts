import { ApiProperty } from '@nestjs/swagger';
import { TimeLimitOccasion } from '../../person/domain/time-limit-occasion.enums.js';
import { PersonTimeLimitInfo } from '../../person/domain/person-time-limit-info.js';

export class PersonTimeLimitInfoResponse {
    @ApiProperty()
    public occasion: TimeLimitOccasion;

    @ApiProperty()
    public deadline: string;

    @ApiProperty({ nullable: true })
    public school?: string;

    public constructor(personTimeLimitInfo: PersonTimeLimitInfo) {
        this.occasion = personTimeLimitInfo.occasion;
        this.deadline = personTimeLimitInfo.deadline.toISOString();
        this.school = personTimeLimitInfo.school;
    }
}
