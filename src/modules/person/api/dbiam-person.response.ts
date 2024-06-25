import { ApiProperty } from '@nestjs/swagger';

import { PersonResponse } from './person.response.js';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { Person } from '../domain/person.js';
import { PersonendatensatzResponse } from './personendatensatz.response.js';
import { DBiamPersonenkontextResponse } from '../../personenkontext/api/response/dbiam-personenkontext.response.js';

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
