import { ApiProperty } from '@nestjs/swagger';

import { PersonID } from '../../../shared/types/index.js';

export class DBiamFindPersonenkontexteByPersonIdParams {
    @ApiProperty({
        description: 'The ID for the person.',
        type: String,
    })
    public readonly personId!: PersonID;
}
