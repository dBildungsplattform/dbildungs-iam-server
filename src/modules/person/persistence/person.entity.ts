import { randomUUID } from 'crypto';
import { AutoMap } from '@automapper/classes';
import { ArrayType, BaseEntity, DateTimeType, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/core';
import { EntityBase } from '../../../shared/types/index.js';
import { Gender, TrustLevel } from '../domain/person.enums.js';

@Entity({ tableName: 'person' })
export class PersonEntity extends BaseEntity<PersonEntity, 'id'> implements EntityBase {
    /**
     * @deprecated This constructor is for automapper only.
     */
    public constructor() {
        super();
    }

    @PrimaryKey({ onCreate: () => randomUUID() })
    public readonly id!: string;

    @Property({ onCreate: () => new Date(), type: DateTimeType })
    public readonly createdAt!: Date;

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), type: DateTimeType })
    public readonly updatedAt!: Date;

    @AutoMap()
    @Property({ nullable: true })
    public referrer?: string;

    @AutoMap()
    @Property()
    public client!: string;

    @AutoMap()
    @Property({ nullable: true })
    public readonly mainOrganization?: string;

    @AutoMap()
    @Property()
    public lastName!: string;

    @AutoMap()
    @Property()
    public firstName!: string;

    @AutoMap()
    @Property({ nullable: true })
    public initialsLastName?: string;

    @AutoMap()
    @Property({ nullable: true })
    public initialsFirstName?: string;

    @AutoMap()
    @Property({ nullable: true })
    public nickName?: string;

    @AutoMap()
    @Property({ nullable: true })
    public nameTitle?: string;

    @AutoMap()
    @Property({ nullable: true, type: ArrayType })
    public nameSalutation?: string[];

    @AutoMap()
    @Property({ nullable: true, type: ArrayType })
    public namePrefix?: string[];

    @AutoMap()
    @Property({ nullable: true, type: ArrayType })
    public nameSuffix?: string[];

    @AutoMap()
    @Property({ nullable: true })
    public nameSortIndex?: string;

    @AutoMap()
    @Property({ nullable: true, type: DateTimeType })
    public birthDate?: Date;

    @AutoMap()
    @Property({ nullable: true })
    public birthPlace?: string;

    @AutoMap()
    @Enum({ items: () => Gender, nullable: true })
    public gender?: Gender;

    @AutoMap()
    @Property({ nullable: true })
    public localization?: string = 'de-DE';

    @AutoMap()
    @Enum({ items: () => TrustLevel, nullable: true })
    public trustLevel?: TrustLevel;

    @AutoMap()
    @Property({ nullable: true })
    public isInformationBlocked?: boolean;
}
