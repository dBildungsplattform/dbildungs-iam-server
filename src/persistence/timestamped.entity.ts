import { BaseEntity, DateTimeType, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export abstract class TimestampedEntity<
    Entity extends TimestampedEntity<Entity>,
    Populate extends string = string,
> extends BaseEntity<Entity, 'id', Populate> {
    @PrimaryKey({ onCreate: () => randomUUID() })
    public readonly id!: string;

    @Property({ onCreate: () => new Date(), type: DateTimeType })
    public readonly createdAt!: Date;

    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), type: DateTimeType })
    public readonly updatedAt!: Date;
}
