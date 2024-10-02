import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';
import { IsDIN91379A } from '../../../shared/util/din-91379-validation.js';

export class CSVImportDataItemDTO {
    @IsDIN91379A()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty({ required: true })
    public readonly nachname!: string;

    @IsDIN91379A()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty({ required: true })
    public readonly vorname!: string;

    @IsDIN91379A()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty({ required: true })
    public readonly klasse!: string;
}
