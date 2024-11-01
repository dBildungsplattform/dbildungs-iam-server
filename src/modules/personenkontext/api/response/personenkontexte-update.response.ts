import { ApiProperty } from '@nestjs/swagger';

import { DBiamPersonenkontextResponse } from './dbiam-personenkontext.response.js';
import { Personenkontext } from '../../domain/personenkontext.js';

export class PersonenkontexteUpdateResponse {
    @ApiProperty({ type: DBiamPersonenkontextResponse, isArray: true })
    public dBiamPersonenkontextResponses: DBiamPersonenkontextResponse[];

    public constructor(personenkontexte: Personenkontext<true>[]) {
        this.dBiamPersonenkontextResponses = personenkontexte.map(
            (pk: Personenkontext<true>) => new DBiamPersonenkontextResponse(pk),
        );
    }
}
