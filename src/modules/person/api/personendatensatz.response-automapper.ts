import { ApiProperty } from '@nestjs/swagger';
import { PersonResponseAutomapper } from './person.response-automapper.js';
import { PersonenkontextResponse } from '../../personenkontext/api/response/personenkontext.response.js';
//NOTE use the automapper convention name for now
export class PersonendatensatzResponseAutomapper {
    @ApiProperty({ type: PersonResponseAutomapper })
    public person!: PersonResponseAutomapper;

    @ApiProperty({ type: [PersonenkontextResponse] })
    public personenkontexte!: PersonenkontextResponse[];

    public constructor(person: PersonResponseAutomapper, personenkontexte: PersonenkontextResponse[]) {
        this.person = person;
        this.personenkontexte = personenkontexte;
    }
}
