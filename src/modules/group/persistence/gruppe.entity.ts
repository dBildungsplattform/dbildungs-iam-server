import { Entity, Enum, EnumArrayType, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import {
    Bildungsziele,
    Faecherkanon,
    Geuppenbereich,
    GruppenTyp,
    Gruppendifferenzierung,
    Gruppenoption,
} from '../domain/group.enums.js';
import { Jahrgangsstufe } from '../../person/domain/personenkontext.enums.js';

@Entity({ tableName: 'gruppe' })
export class Gruppe extends TimestampedEntity {
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

    @Property()
    public referenzgruppen!: string;

    @Property()
    public laufzeit!: string;

    @Property()
    public sichtfreigabe!: string;

    @Property()
    public revision!: string;
}
