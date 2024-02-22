import { DateTimeType, Entity, Enum, Property, Unique } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Jahrgangsstufe, Personenstatus, SichtfreigabeType } from '../domain/personenkontext.enums.js';

@Entity({ tableName: 'personen_kontext' })
@Unique({ properties: ['rolleId', 'personId', 'organisationId'] })
export class PersonenkontextEntity extends TimestampedEntity {
    @Property()
    public personId!: string;

    @Property()
    public organisationId!: string;

    @Property()
    public rolleId!: string;

    @Property({ nullable: true })
    public referrer?: string;

    // TODO EW-636: mandant is related to organizations so it is not set for now. When implemented should be set to nullable: false
    @Property({ nullable: true })
    public mandant?: string;

    @Enum({ nullable: true, items: () => Personenstatus })
    public personenstatus?: Personenstatus;

    @Enum({ nullable: true, items: () => Jahrgangsstufe })
    public jahrgangsstufe?: Jahrgangsstufe;

    @Property({ nullable: true, default: SichtfreigabeType.NEIN })
    public sichtfreigabe?: SichtfreigabeType;

    @Property({ nullable: true, type: DateTimeType })
    public loeschungZeitpunkt?: Date;

    @Property({ nullable: false, default: '1' })
    public revision!: string;
}
