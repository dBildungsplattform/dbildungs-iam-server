import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { IsDIN91379A } from '../../../shared/util/din-91379-validation.js';

export class PersonNameParams {
    @AutoMap()
    @IsDIN91379A()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty({ required: true })
    public readonly familienname!: string;

    @AutoMap()
    @IsDIN91379A()
    @IsNotEmpty()
    @MinLength(2)
    @ApiProperty({ required: true })
    public readonly vorname!: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly initialenfamilienname?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly initialenvorname?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly rufname?: string;

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly titel?: string;

    @AutoMap(() => [String])
    @IsOptional()
    @IsArray()
    @ApiProperty({ type: [String], required: false })
    public readonly anrede?: string[];

    @AutoMap(() => [String])
    @IsOptional()
    @IsArray()
    @ApiProperty({ type: [String], required: false })
    public readonly namenssuffix?: string[];

    @AutoMap(() => [String])
    @IsOptional()
    @IsArray()
    @ApiProperty({ type: [String], required: false })
    public readonly namenspraefix?: string[];

    @AutoMap()
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly sortierindex?: string;
}
