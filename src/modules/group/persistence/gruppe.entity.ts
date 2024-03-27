import { Collection, Embedded, Entity, Enum, OneToMany, Property } from '@mikro-orm/core';
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
import { Laufzeit } from './laufzeit.entity.js';
import { ReferenzgruppeEntity } from './referenzgruppe.entity.js';

export type GruppeProps = Omit<GruppeEntity, keyof TimestampedEntity>;
@Entity({ tableName: 'gruppe' })
export class GruppeEntity extends TimestampedEntity {
    public constructor(props: GruppeProps) {
        super();
        Object.assign(this, props);
    }

    @Property({ nullable: false })
    public mandant!: string;

    @Property({ nullable: true })
    public organisationId!: string;

    @Property({ nullable: true })
    public referrer?: string;

    @Property({ nullable: false })
    public bezeichnung!: string;

    @Property({ nullable: true })
    public thema?: string;

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

    @OneToMany(() => ReferenzgruppeEntity, (referenzgruppe: ReferenzgruppeEntity) => referenzgruppe.gruppe)
    public referenzgruppen: Collection<ReferenzgruppeEntity> = new Collection<ReferenzgruppeEntity>(this);

    @Embedded(() => Laufzeit, { nullable: false })
    public laufzeit?: Laufzeit;

    @Property({ nullable: false, default: SichtfreigabeType.NEIN })
    public sichtfreigabe!: SichtfreigabeType;

    @Property({ nullable: false, default: '1' })
    public revision!: string;
}
