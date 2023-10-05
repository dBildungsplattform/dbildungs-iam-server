import { AutoMap } from '@automapper/classes';
import { DateTimeType, Entity, Enum, ManyToOne, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { Rolle, Personenstatus, Jahrgangsstufe } from '../domain/personenkontext.enums.js';
import { PersonEntity } from './person.entity.js';

@Entity({ tableName: 'personenkontext' })
export class PersonenkontextEntity extends TimestampedEntity<PersonenkontextEntity, 'id'> {
    public constructor() {
        super();
    }

    @ManyToOne()
    public person!: PersonEntity;

    @AutoMap()
    @Property({ nullable: true })
    public referrer?: string;

    // TODO nullable: false
    @AutoMap()
    @Property({ nullable: true })
    public mandant!: string;

    // TODO get from access_token, see SchulConneX (Version 1.003.003.000) page 91
    // @AutoMap()
    // @ManyToOne({ nullable: true })
    // public organisation!: OrganisationEntity;

    @AutoMap()
    @Enum({ nullable: false, items: () => Rolle })
    public rolle!: Rolle;

    @AutoMap()
    @Enum({ nullable: true, items: () => Personenstatus })
    public personenstatus?: Personenstatus;

    @AutoMap()
    @Enum({ nullable: true, items: () => Jahrgangsstufe })
    public jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap()
    @Property({ nullable: true })
    public sichtfreigabe?: boolean = false;

    @AutoMap()
    @Property({ nullable: true, type: DateTimeType })
    public loeschungZeitpunkt?: Date;

    @AutoMap()
    @Property({ nullable: false, default: '1' })
    public revision!: string;
}
