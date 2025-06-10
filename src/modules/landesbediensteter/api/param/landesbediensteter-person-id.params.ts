import { ApiProperty } from '@nestjs/swagger';

import { PersonID } from '../../../../shared/types/index.js';
import { IsNotEmpty, IsString } from 'class-validator';

export class LandesbediensteterPersonIdParams {
    @ApiProperty({
        description: 'The ID for the person.',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    public readonly personId!: PersonID;
}
