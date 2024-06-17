import { ApiProperty } from '@nestjs/swagger';
import { DbiamPersonenkontextBodyParams } from './dbiam-personenkontext.body.params.js';
import { IsDate, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DbiamUpdatePersonenkontexteBodyParams {
    @IsDate()
    @ApiProperty({
        required: true,
        nullable: false,
        description: 'Date of the most recent changed personenkontext',
    })
    public readonly lastModified!: Date;

    @IsNumber()
    @ApiProperty({
        required: true,
        nullable: false,
        description: 'The amount of personenkontexte',
    })
    public readonly count!: number;

    @ApiProperty({ type: [DbiamPersonenkontextBodyParams], required: true, nullable: false })
    @Type(() => DbiamPersonenkontextBodyParams)
    @ValidateNested({ each: true })
    public readonly personenkontexte!: DbiamPersonenkontextBodyParams[];
}
