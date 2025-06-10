import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { DbiamPersonenkontextBodyParams } from '../../../personenkontext/api/param/dbiam-personenkontext.body.params.js';

export class LandesbediensteterWorkflowCommitBodyParams {
    @IsDate()
    @IsOptional()
    @ApiProperty({
        required: false,
        nullable: true,
        description: 'Date of the most recent changed personenkontext',
    })
    public readonly lastModified?: Date;

    @IsNumber()
    @ApiProperty({
        required: true,
        nullable: false,
        description: 'The amount of personenkontexte',
    })
    public readonly count!: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false, description: 'Optional Personalnummer for the person' })
    public readonly personalnummer?: string;

    @ApiProperty({ type: [DbiamPersonenkontextBodyParams], required: true, nullable: false })
    @Type(() => DbiamPersonenkontextBodyParams)
    @ValidateNested({ each: true })
    public readonly newPersonenkontexte!: DbiamPersonenkontextBodyParams[];
}
