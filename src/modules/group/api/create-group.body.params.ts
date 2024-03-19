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
import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';
import { Type } from 'class-transformer';
import { Laufzeit } from '../persistence/laufzeit.entity.js';
import { ReferenzgruppeParam } from './referenzgruppe.params.js';

export class CreateGroupBodyParams {
    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly referrer?: string;

    @IsString()
    @ApiProperty({ required: true })
    public readonly bezeichnung!: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly thema?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ required: false })
    public readonly beschreibung?: string;

    @IsEnum(GruppenTyp)
    @ApiProperty({ enum: GruppenTyp, required: true })
    public readonly typ!: GruppenTyp;

    @IsEnum(Gruppenbereich)
    @IsOptional()
    @ApiProperty({ enum: Gruppenbereich, required: false })
    public readonly bereich?: Gruppenbereich;

    @IsArray()
    @IsOptional()
    @IsEnum(Gruppenoption, { each: true })
    @ApiProperty({ enum: Gruppenoption, required: false, isArray: true })
    public readonly optionen?: Gruppenoption[];

    @IsEnum(Gruppendifferenzierung)
    @IsOptional()
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
    public readonly jahrgangsstufen?: Jahrgangsstufe[];

    @IsArray()
    @IsOptional()
    @IsEnum(Faecherkanon, { each: true })
    @ApiProperty({ enum: Faecherkanon, required: false, isArray: true })
    public readonly faecher?: Faecherkanon[];

    @ValidateNested()
    @IsArray()
    @IsOptional()
    @Type(() => ReferenzgruppeParam)
    @ApiProperty({ type: ReferenzgruppeParam, required: false, isArray: true })
    public readonly referenzgruppen?: ReferenzgruppeParam[];

    @ValidateNested()
    @IsOptional()
    @Type(() => Laufzeit)
    @ApiProperty({ type: Laufzeit, required: false })
    public readonly laufzeit!: Laufzeit;
}
