import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { PersonResponseAutomapper } from './person.response-automapper.js';
import { PersonenkontextResponse } from '../../personenkontext/api/response/personenkontext.response.js';

export class PersonendatensatzResponseAutomapper {
    @AutoMap(() => PersonResponseAutomapper)
    @ApiProperty({ type: PersonResponseAutomapper })
    public person!: PersonResponseAutomapper;

    @AutoMap(() => [PersonenkontextResponse])
    @ApiProperty({ type: [PersonenkontextResponse] })
    public personenkontexte!: PersonenkontextResponse[];
}
