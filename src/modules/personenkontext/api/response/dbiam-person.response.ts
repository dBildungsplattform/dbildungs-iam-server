import { ApiProperty } from '@nestjs/swagger';
import { PersonResponse } from '../../../person/api/person.response.js';
import { DBiamPersonenkontextResponse } from './dbiam-personenkontext.response.js';
import { Person } from '../../../person/domain/person.js';
import { Personenkontext } from '../../domain/personenkontext.js';
import { PersonendatensatzResponse } from '../../../person/api/personendatensatz.response.js';

export class DBiamPersonResponse {
    @ApiProperty()
    public person!: PersonResponse;

    @ApiProperty({ type: DBiamPersonenkontextResponse, isArray: true })
    public dBiamPersonenkontextResponses: DBiamPersonenkontextResponse[];

    public constructor(person: Person<true>, personenkontexte: Personenkontext<true>[]) {
        this.person = new PersonendatensatzResponse(person, true).person;
        this.dBiamPersonenkontextResponses = personenkontexte.map(
            (pk: Personenkontext<true>) => new DBiamPersonenkontextResponse(pk),
        );
    }
}
