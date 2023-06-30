import { AutoMap } from '@automapper/classes';
import { ArrayType, DateTimeType, Entity, Enum, Property } from '@mikro-orm/core';
import { EntityBase } from '../../../shared/types/index.js';
import { PersonGender, PersonTrustLevel } from '../domain/person.enums.js';

@Entity({ tableName: 'person' })
export class PersonEntity extends EntityBase<PersonEntity> {
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
    @Enum({ items: () => PersonGender, nullable: true })
    public gender?: PersonGender;

    @AutoMap()
    @Property({ nullable: true })
    public localization?: string = 'de-DE';

    @AutoMap()
    @Enum({ items: () => PersonTrustLevel, nullable: true })
    public trustLevel?: PersonTrustLevel;

    @AutoMap()
    @Property({ nullable: true })
    public isInformationBlocked?: boolean;
}
