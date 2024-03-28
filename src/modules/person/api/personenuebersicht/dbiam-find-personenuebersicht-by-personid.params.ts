import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsUUID } from 'class-validator';
import { PersonID } from '../../../../shared/types/index.js';

export class DBiamFindPersonenuebersichtByPersonIdParams {
    @ApiProperty({
        description: 'The ID for the person.',
        type: String,
    })
    @IsUUID()
    @IsNotEmpty()
    public readonly personId!: PersonID;
}
