import { ApiProperty } from '@nestjs/swagger';
import { DBiamCreatePersonenkontextBodyParams } from './dbiam-create-personenkontext.body.params.js';
import { IsDate, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DbiamUpdatePersonenkontexteBodyParams {
    @IsDate()
    @ApiProperty({
        required: true,
        nullable: false,
        description: 'Date of the most recent changed personenkontext',
    })
    public lastModified!: Date;

    @IsNumber()
    @ApiProperty({
        required: true,
        nullable: false,
        description: 'The amount of personenkontexte',
    })
    public count!: number;

    @ApiProperty({ type: [DBiamCreatePersonenkontextBodyParams], required: true, nullable: false })
    @Type(() => DBiamCreatePersonenkontextBodyParams)
    @ValidateNested({ each: true })
    public personenkontexte!: DBiamCreatePersonenkontextBodyParams[];
}
