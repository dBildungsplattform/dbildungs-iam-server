import { DateTimeType, Entity, Enum, Property } from '@mikro-orm/core';
import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { LernperiodenType } from '../domain/gruppe.enums.js';

@Entity({ tableName: 'lernperiode' })
export class LernperiodeEntity extends TimestampedEntity {
    @Property({ nullable: false })
    public code?: string;

    @Property({ nullable: false })
    public bezeichnung?: string;

    @Enum({ items: () => LernperiodenType, nullable: false })
    public typ?: LernperiodenType;

    @Property({ nullable: false, type: DateTimeType })
    public beginn?: Date;

    @Property({ nullable: false, type: DateTimeType })
    public ende?: Date;
}
