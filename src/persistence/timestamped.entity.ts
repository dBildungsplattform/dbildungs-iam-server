import { AutoMap } from '@automapper/classes';
import { BaseEntity, DateTimeType, Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export abstract class TimestampedEntity extends BaseEntity {
    @AutoMap()
    @PrimaryKey({ columnType: 'uuid', onCreate: () => randomUUID() })
    public readonly id!: string;

    @AutoMap(() => Date)
    @Property({ onCreate: () => new Date(), type: DateTimeType })
    public readonly createdAt!: Date & Opt;

    @AutoMap(() => Date)
    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), type: DateTimeType })
    public readonly updatedAt!: Date & Opt;
}
