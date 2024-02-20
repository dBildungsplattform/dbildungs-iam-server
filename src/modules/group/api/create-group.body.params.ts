import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
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
import { Laufzeit } from '../persistence/laufzeit.js';
import { Type } from 'class-transformer';
import { Jahrgangsstufe } from '../../personenkontext/domain/personenkontext.enums.js';

export class CreateGroupBodyParams {
    @IsString()
    @ApiProperty({ required: false })
    public readonly orgid!: string;

    @IsString()
    @ApiProperty({ required: false })
    public readonly referrer!: string;

    @IsString()
    @ApiProperty({ required: false })
    public readonly bezeichnung!: string;

    @IsString()
    @ApiProperty({ required: false })
    public readonly thema!: string;

    @IsString()
    @ApiProperty({ required: false })
    public readonly beschreibung!: string;

    @IsString()
    @ApiProperty({ required: false })
    public readonly typ!: GruppenTyp;

    @IsString()
    @ApiProperty({ required: false })
    public readonly bereich!: Gruppenbereich;

    @IsString()
    @ApiProperty({ required: false })
    public readonly optionen!: Gruppenoption;

    @IsString()
    @ApiProperty({ required: false })
    public readonly differenzierung!: Gruppendifferenzierung;

    @IsString()
    @IsOptional()
    @ApiProperty({ enum: Bildungsziele, required: false })
    public readonly bildungsziele!: Bildungsziele[];

    @IsArray()
    @IsOptional()
    @ApiProperty({ enum: Jahrgangsstufe, required: false })
    public readonly jahrganagsstufen!: Jahrgangsstufe[];

    @IsArray()
    @IsOptional()
    @ApiProperty({ enum: Faecherkanon, required: false })
    public readonly faecher!: Faecherkanon[];

    @ValidateNested()
    @Type(() => Referenzgruppen)
    @ApiProperty({ type: Referenzgruppen, required: true })
    public readonly referenzgruppen!: Referenzgruppen[];

    @ValidateNested()
    @Type(() => Laufzeit)
    @ApiProperty({ type: Laufzeit, required: true })
    public readonly laufzeit!: Laufzeit;
}
