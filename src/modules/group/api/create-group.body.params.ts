import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
    Bildungsziele,
    Faecherkanon,
    Gruppenbereich,
    GruppenTyp,
    Gruppendifferenzierung,
    Gruppenoption,
} from '../domain/gruppe.enums.js';
import { Referenzgruppen } from '../persistence/referenzgruppen.js';
import { Type } from 'class-transformer';
import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';

export class CreateGroupBodyParams {
    @IsString()
    @ApiProperty({ required: false })
    public readonly referrer?: string;

    @IsString()
    @ApiProperty({ required: false })
    public readonly bezeichnung?: string;

    @IsString()
    @ApiProperty({ required: false })
    public readonly thema?: string;

    @IsString()
    @ApiProperty({ required: false })
    public readonly beschreibung?: string;

    @IsEnum(GruppenTyp)
    @ApiProperty({ enum: GruppenTyp, required: false })
    public readonly typ?: GruppenTyp;

    @IsEnum(Gruppenbereich)
    @ApiProperty({ enum: Gruppenbereich, required: false })
    public readonly bereich?: Gruppenbereich;

    @IsArray()
    @IsEnum(Gruppenoption, { each: true })
    @ApiProperty({ enum: Gruppenoption, required: false, isArray: true })
    public readonly optionen?: Gruppenoption[];

    @IsEnum(Gruppendifferenzierung)
    @ApiProperty({ enum: Gruppendifferenzierung, required: false })
    public readonly differenzierung?: Gruppendifferenzierung;

    @IsArray()
    @IsOptional()
    @IsEnum(Bildungsziele, { each: true })
    @ApiProperty({ enum: Bildungsziele, required: false, isArray: true })
    public readonly bildungsziele?: Bildungsziele[];

    @IsArray()
    @IsOptional()
    @IsEnum(Jahrgangsstufe, { each: true })
    @ApiProperty({ enum: Jahrgangsstufe, required: false, isArray: true })
    public readonly jahrganagsstufen?: Jahrgangsstufe[];

    @IsArray()
    @IsOptional()
    @IsEnum(Faecherkanon, { each: true })
    @ApiProperty({ enum: Faecherkanon, required: false, isArray: true })
    public readonly faecher?: Faecherkanon[];

    @IsArray()
    @ValidateNested()
    @Type(() => Referenzgruppen)
    @ApiProperty({ type: Referenzgruppen, required: true, isArray: true })
    public readonly referenzgruppen!: Referenzgruppen[];

    // @ValidateNested()
    // @Type(() => Laufzeit)
    // @ApiProperty({ type: Laufzeit, required: true })
    // public readonly laufzeit!: Laufzeit;
}
