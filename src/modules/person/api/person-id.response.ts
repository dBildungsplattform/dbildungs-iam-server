import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';

export class PersonIdResponse {
    @ApiProperty()
    public id!: string;

    public constructor(props: Readonly<PersonIdResponse>) {
        Object.assign(this, props);
    }
}
