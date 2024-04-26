import { ApiProperty } from '@nestjs/swagger';
import { Personenkontext } from '../../personenkontext/domain/personenkontext.js';
import { Person } from '../domain/person.js';
import { PersonInfoParams } from './person-info.params.js';

export class PersonInfoResponse {
    @ApiProperty()
    public pid!: string;

    @ApiProperty()
    public person!: PersonInfoParams;

    @ApiProperty()
    public personenkontexte: Personenkontext<true>[];

    public constructor(person: Person<true>, personenkontexte: Personenkontext<true>[]) {
        if (personenkontexte.length == 1) {
            this.pid = personenkontexte[0]?.id ?? '';
        } else {
            this.pid = person.id;
        }
        this.person = new PersonInfoParams(person);
        this.personenkontexte = personenkontexte;
    }
}
