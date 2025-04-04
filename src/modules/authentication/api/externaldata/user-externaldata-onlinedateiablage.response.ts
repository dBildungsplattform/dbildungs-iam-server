import { ApiProperty } from '@nestjs/swagger';

export class UserExeternalDataResponseOnlineDateiablage {
    @ApiProperty()
    public personId: string;

    public constructor(personId: string) {
        this.personId = personId;
    }
}
