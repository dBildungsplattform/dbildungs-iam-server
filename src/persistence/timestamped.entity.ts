import { BaseEntity, DateTimeType, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { AutoMap } from '@automapper/classes';

export abstract class TimestampedEntity<
    Entity extends TimestampedEntity<Entity>,
    Populate extends string = string,
> extends BaseEntity<Entity, 'id', Populate> {
    @AutoMap(() => String)
    @PrimaryKey({ onCreate: () => randomUUID() })
    public readonly id!: string;

    @AutoMap(() => Date)
    @Property({ onCreate: () => new Date(), type: DateTimeType })
    public readonly createdAt!: Date;

    @AutoMap(() => Date)
    @Property({ onCreate: () => new Date(), onUpdate: () => new Date(), type: DateTimeType })
    public readonly updatedAt!: Date;
}
