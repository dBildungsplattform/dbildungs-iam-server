import { ApiProperty } from '@nestjs/swagger';

import { PersonID } from '../../../../shared/types/index.js';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DBiamFindPersonenkontexteByPersonIdParams {
    @ApiProperty({
        description: 'The ID for the person.',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    public readonly personId!: PersonID;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    public readonly personalnummer?: string;
}
