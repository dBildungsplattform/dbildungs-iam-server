import { BaseEntity, DateTimeType, Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export abstract class TimestampedEntity extends BaseEntity {
    @PrimaryKey({ columnType: 'uuid', onCreate: () => randomUUID() })
    public readonly id!: string;

    @Property({ onCreate: () => new Date(), type: DateTimeType })
    public readonly createdAt!: Date & Opt;

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), type: DateTimeType })
    public readonly updatedAt!: Date & Opt;
}
