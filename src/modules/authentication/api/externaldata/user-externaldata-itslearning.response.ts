import { ApiProperty } from '@nestjs/swagger';

export class UserExeternalDataResponseItslearning {
    @ApiProperty()
    public personId: string;

    public constructor(personId: string) {
        this.personId = personId;
    }
}
