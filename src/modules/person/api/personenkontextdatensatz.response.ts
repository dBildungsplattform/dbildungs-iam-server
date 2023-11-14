import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { PersonIdResponse } from './person-id.response.js';
import { PersonenkontextResponse } from './personenkontext.response.js';

export class PersonenkontextdatensatzResponse {
    @AutoMap(() => PersonIdResponse)
    @ApiProperty({ type: PersonIdResponse })
    public person!: PersonIdResponse;

    @AutoMap(() => [PersonenkontextResponse])
    @ApiProperty({ type: [PersonenkontextResponse] })
    public personenkontexte!: PersonenkontextResponse[];
}
