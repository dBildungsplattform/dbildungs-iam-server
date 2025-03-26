import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { IsDIN91379A } from '../../../shared/util/din-91379-validation.js';

export class PersonNameParams {
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

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly initialenfamilienname?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly initialenvorname?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly rufname?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly titel?: string;

    @IsOptional()
    @IsArray()
    @ApiProperty({ type: [String], required: false })
    public readonly anrede?: string[];

    @IsOptional()
    @IsArray()
    @ApiProperty({ type: [String], required: false })
    public readonly namenssuffix?: string[];

    @IsOptional()
    @IsArray()
    @ApiProperty({ type: [String], required: false })
    public readonly namenspraefix?: string[];

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly sortierindex?: string;
}
