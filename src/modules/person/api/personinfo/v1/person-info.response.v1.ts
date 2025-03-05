/* eslint-disable max-classes-per-file */
import { ApiProperty } from '@nestjs/swagger';
import { PersonInfoResponse, PersonNestedInPersonInfoResponse } from '../person-info.response.js';

class PersonNestedInPersonInfoResponseV1 extends PersonNestedInPersonInfoResponse {}

export class PersonInfoResponseV1 extends PersonInfoResponse {
    @ApiProperty()
    public override person: PersonNestedInPersonInfoResponseV1;

    public constructor(props: Readonly<PersonInfoResponseV1>) {
        super(props);
        this.person = new PersonNestedInPersonInfoResponseV1(props.person);
    }
}
