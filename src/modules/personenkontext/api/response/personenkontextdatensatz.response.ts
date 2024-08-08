import { ApiProperty } from '@nestjs/swagger';
import { PersonIdResponse } from '../../../person/api/person-id.response.js';
import { PersonenkontextResponse } from './personenkontext.response.js';

export class PersonenkontextdatensatzResponse {
    @ApiProperty({ type: PersonIdResponse })
    public person!: PersonIdResponse;

    @ApiProperty({ type: [PersonenkontextResponse] })
    public personenkontexte!: PersonenkontextResponse[];

    public constructor(person: PersonIdResponse, personenkontexte: PersonenkontextResponse[]) {
        this.person = person;
        this.personenkontexte = personenkontexte;
    }
}
