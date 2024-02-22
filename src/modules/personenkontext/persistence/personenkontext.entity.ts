import { AutoMap } from '@automapper/classes';
import { DateTimeType, Entity, Enum, Property, Unique } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Jahrgangsstufe, Personenstatus, Rolle, SichtfreigabeType } from '../domain/personenkontext.enums.js';

@Entity({ tableName: 'personenkontext' })
@Unique({ properties: ['personId', 'organisationId', 'rolleId'] })
export class PersonenkontextEntity extends TimestampedEntity {
    @AutoMap()
    @Property({ nullable: false })
    public personId!: string;

    @AutoMap()
    @Property()
    public organisationId!: string;

    @AutoMap()
    @Property()
    public rolleId!: string;

    @AutoMap()
    @Property({ nullable: true })
    public referrer?: string;

    // TODO EW-636: mandant is related to organizations so it is not set for now. When implemented should be set to nullable: false
    @Property({ nullable: true })
    public mandant?: string;

    // Will be removed in favor of `rolleId`.
    @AutoMap(() => String)
    @Enum({ nullable: false, items: () => Rolle })
    public rolle!: Rolle;

    @AutoMap(() => String)
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
