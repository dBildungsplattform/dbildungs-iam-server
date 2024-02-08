import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { PersonResponse } from './person.response.js';
import { PersonenkontextResponse } from '../../person-kontext/api/personenkontext.response.js';

export class PersonendatensatzResponse {
    @AutoMap(() => PersonResponse)
    @ApiProperty({ type: PersonResponse })
    public person!: PersonResponse;

    @AutoMap(() => [PersonenkontextResponse])
    @ApiProperty({ type: [PersonenkontextResponse] })
    public personenkontexte!: PersonenkontextResponse[];
}
