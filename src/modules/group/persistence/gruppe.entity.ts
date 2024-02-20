import { Entity, Enum, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import {
    Bildungsziele,
    Faecherkanon,
    Gruppenbereich,
    GruppenTyp,
    Gruppendifferenzierung,
    Gruppenoption,
} from '../domain/gruppe.enums.js';
import { Referenzgruppen } from './referenzgruppen.js';
import { Jahrgangsstufe, SichtfreigabeType } from '../../personenkontext/domain/personenkontext.enums.js';

@Entity({ tableName: 'gruppe' })
export class GruppeEntity extends TimestampedEntity {
    public constructor() {
        super();
    }

    @Property({ nullable: true })
    public mandant!: string;

    @Property({ nullable: true })
    public orgid!: string;

    @Property()
    public referrer!: string;

    @Property()
    public bezeichnung!: string;

    @Property()
    public thema!: string;

    @Property()
    public beschreibung!: string;

    @Enum({ items: () => GruppenTyp, nullable: false })
    public typ!: GruppenTyp;

    @Enum({ items: () => Gruppenbereich, nullable: true })
    public bereich!: Gruppenbereich;

    @Enum({ items: () => Gruppenoption, nullable: true })
    public optionen!: Gruppenoption[];

    @Enum({ items: () => Gruppendifferenzierung, nullable: true })
    public differenzierung!: Gruppendifferenzierung;

    @Enum({ items: () => Bildungsziele, nullable: true })
    public bildungsziele!: Bildungsziele[];

    @Enum({ items: () => Jahrgangsstufe, nullable: true })
    public jahrgangsstufen!: Jahrgangsstufe[];

    @Enum({ items: () => Faecherkanon, nullable: true })
    public faecher!: Faecherkanon[];

    @Property({ nullable: true, type: Referenzgruppen })
    public referenzgruppen!: Referenzgruppen[];

    // @Property({ nullable: false, type: Laufzeit })
    // public laufzeit!: Laufzeit;

    @Property({ nullable: false, default: SichtfreigabeType.NEIN })
    public sichtfreigabe!: SichtfreigabeType;

    @Property({ nullable: false, default: '1' })
    public revision!: string;
}
