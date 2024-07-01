import { ApiProperty } from '@nestjs/swagger';
import { PersonResponse } from '../../../person/api/person.response.js';
import { DBiamPersonenkontextResponse } from './dbiam-personenkontext.response.js';
import { Person } from '../../../person/domain/person.js';
import { Personenkontext } from '../../domain/personenkontext.js';
import { PersonendatensatzResponse } from '../../../person/api/personendatensatz.response.js';

export class DBiamPersonResponse {
    @ApiProperty()
    public person!: PersonResponse;

    @ApiProperty()
    public DBiamPersonenkontextResponse!: DBiamPersonenkontextResponse;

    public constructor(person: Person<true>, personenkontext: Personenkontext<true>) {
        this.person = new PersonendatensatzResponse(person, true).person;
        this.DBiamPersonenkontextResponse = new DBiamPersonenkontextResponse(personenkontext);
    }
}
