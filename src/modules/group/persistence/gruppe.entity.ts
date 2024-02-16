import { ArrayType, Entity, Enum, EnumArrayType, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import {
    Bildungsziele,
    Faecherkanon,
    Geuppenbereich,
    GruppenTyp,
    Gruppendifferenzierung,
    Gruppenoption,
} from '../domain/gruppe.enums.js';
import { Jahrgangsstufe, SichtfreigabeType } from '../../person/domain/personenkontext.enums.js';
import { Referenzgruppen } from './referenzgruppen.js';
import { Laufzeit } from './laufzeit.js';

@Entity({ tableName: 'gruppe' })
export class GruppeEntity extends TimestampedEntity {
    public constructor() {
        super();
    }

    @Property()
    public mandant!: string;

    @Property()
    public orgid!: string;

    @Property()
    public referrer!: string;

    @Property()
    public bezeichnung!: string;

    @Property()
    public thema!: string;

    @Property()
    public beschreibung!: string;

    @Property()
    @Enum({ items: () => GruppenTyp, nullable: false })
    public typ!: GruppenTyp;

    @Property()
    @Enum({ items: () => Geuppenbereich, nullable: true })
    public bereich!: Geuppenbereich;

    @Property()
    @Enum({ items: () => Gruppenoption, nullable: true })
    public optionen!: Gruppenoption;

    @Property()
    @Enum({ items: () => Gruppendifferenzierung, nullable: true })
    public differenzierung!: Gruppendifferenzierung;

    @Property({ nullable: true, type: EnumArrayType })
    public bildungsziele!: Bildungsziele[];

    @Property({ nullable: true, type: EnumArrayType })
    public jahrgangsstufen!: Jahrgangsstufe[];

    @Property({ nullable: true, type: EnumArrayType })
    public faecher!: Faecherkanon[];

    @Property({ nullable: true, type: ArrayType })
    public referenzgruppen!: Referenzgruppen[];

    @Property({ nullable: false, type: Laufzeit })
    public laufzeit!: Laufzeit;

    @Property()
    @Enum({ items: () => SichtfreigabeType, nullable: true })
    public sichtfreigabe!: SichtfreigabeType;

    @Property({ nullable: false, default: '1' })
    public revision!: string;
}
