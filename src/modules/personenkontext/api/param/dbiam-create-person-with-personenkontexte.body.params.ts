import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { IsDIN91379A } from '../../../../shared/util/din-91379-validation.js';
import { DbiamCreatePersonenkontextBodyParams } from './dbiam-create-personenkontext.body.params.js';
import { Type } from 'class-transformer';

export class DbiamCreatePersonWithPersonenkontexteBodyParams {
    @IsDIN91379A()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty({ required: true })
    public readonly familienname!: string;

    @IsDIN91379A()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty({ required: true })
    public readonly vorname!: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    public readonly personalnummer?: string;

    @ApiProperty({ type: [DbiamCreatePersonenkontextBodyParams], required: true, nullable: false })
    @Type(() => DbiamCreatePersonenkontextBodyParams)
    @ValidateNested({ each: true })
    public readonly createPersonenkontexte!: DbiamCreatePersonenkontextBodyParams[];
}
