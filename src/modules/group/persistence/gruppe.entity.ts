import { Embedded, Entity, Enum, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import {
    Bildungsziele,
    Faecherkanon,
    Gruppenbereich,
    GruppenTyp,
    Gruppendifferenzierung,
    Gruppenoption,
} from '../domain/gruppe.enums.js';
import { Jahrgangsstufe, SichtfreigabeType } from '../../personenkontext/domain/personenkontext.enums.js';
import { Referenzgruppen } from './referenzgruppen.js';

@Entity({ tableName: 'gruppe' })
export class GruppeEntity extends TimestampedEntity {
    public constructor() {
        super();
    }

    @Property({ nullable: false })
    public mandant!: string;

    @Property({ nullable: true })
    public organisationId?: string;

    @Property({ nullable: true })
    public referrer?: string;

    @Property({ nullable: false })
    public bezeichnung!: string;

    @Property()
    public thema!: string;

    @Property({ nullable: true })
    public beschreibung?: string;

    @Enum({ items: () => GruppenTyp, nullable: false })
    public typ!: GruppenTyp;

    @Enum({ items: () => Gruppenbereich, nullable: true })
    public bereich?: Gruppenbereich;

    @Enum({ items: () => Gruppenoption, nullable: true, array: true })
    public optionen?: Gruppenoption[];

    @Enum({ items: () => Gruppendifferenzierung, nullable: true })
    public differenzierung?: Gruppendifferenzierung;

    @Enum({ items: () => Bildungsziele, nullable: true, array: true })
    public bildungsziele?: Bildungsziele[];

    @Enum({ items: () => Jahrgangsstufe, nullable: true, array: true })
    public jahrgangsstufen?: Jahrgangsstufe[];

    @Enum({ items: () => Faecherkanon, nullable: true, array: true })
    public faecher?: Faecherkanon[];

    @Embedded(() => Referenzgruppen, { nullable: true, array: true })
    public referenzgruppen?: Referenzgruppen[];

    // @Property({ nullable: false, type: Laufzeit })
    // public laufzeit!: Laufzeit;

    @Property({ nullable: false, default: SichtfreigabeType.NEIN })
    public sichtfreigabe!: SichtfreigabeType;

    @Property({ nullable: false, default: '1' })
    public revision!: string;
}
