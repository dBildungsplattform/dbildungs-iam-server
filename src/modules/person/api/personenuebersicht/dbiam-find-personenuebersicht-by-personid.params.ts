import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';
import { PersonID } from '../../../../shared/types/index.js';

export class DBiamFindPersonenuebersichtByPersonIdParams {
    @ApiProperty({
        description: 'The ID for the person.',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    public readonly personId!: PersonID;
}
