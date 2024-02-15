import { AutoMap } from '@automapper/classes';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { Jahrgangsstufe } from '../../person/domain/personenkontext.enums.js';
import { ApiProperty } from '@nestjs/swagger';
import { Faecherkanon } from '../domain/group.enums.js';

export class CreateGroupBodyParams {
    @AutoMap()
    @IsString()
    public readonly referrer?: string;

    @AutoMap()
    @IsString()
    public readonly bezeichnung?: string;

    @AutoMap()
    @IsString()
    public readonly thema?: string;

    @AutoMap()
    @IsString()
    public readonly beschreibung?: string;

    @AutoMap()
    @IsString()
    public readonly typ?: string;

    @AutoMap()
    @IsString()
    public readonly bereich?: string;

    @AutoMap()
    @IsString()
    public readonly optionen?: string;

    @AutoMap()
    @IsString()
    public readonly differenzierung?: string;

    @AutoMap()
    @IsString()
    public readonly bildungsziele?: string;

    @AutoMap(() => [String])
    @IsArray()
    @IsOptional()
    @ApiProperty({ type: Jahrgangsstufe, required: false })
    public readonly jahrganagsstufen?: Jahrgangsstufe[];

    @AutoMap(() => [String])
    @IsArray()
    @IsOptional()
    @ApiProperty({ type: Faecherkanon, required: false })
    public readonly faecher?: Faecherkanon[];

    // public readonly referenzgruppen?: Referenzgruppen;

    // public readonly laufzeit?: Laufzeit;

    // @AutoMap(() => String)
    // @IsEnum(SichtfreigabeType)
    // @IsOptional()
    // @ApiProperty({ enum: SichtfreigabeType, required: false })
    // public readonly sichtfreigabe?: SichtfreigabeType;

    // @AutoMap()
    // @IsString()
    // public readonly revision?: string;
}
